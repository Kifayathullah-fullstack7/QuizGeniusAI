'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Brain,
  Flame,
  Trophy,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  FileText,
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react';

import {
  ChallengeQuiz,
  ChallengeQuestion,
  AutopsyResponse,
  performAutopsy,
  generateQuiz
} from '@/lib/api';
import { sound } from '@/lib/audio';
import { DifficultyIndicator } from '@/components/DifficultyIndicator';
import { QuestionCard } from '@/components/QuestionCard';
import { AutopsyModal } from '@/components/AutopsyModal';
import { QuizSourceSelector } from '@/components/QuizSourceSelector';

interface SourceInfo {
  mode: 'topic' | 'document';
  name: string;
  summary?: string;
}

function ArenaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicParam = searchParams.get('topic') || undefined;

  const [quiz, setQuiz] = useState<ChallengeQuiz | null>(null);
  const [sourceInfo, setSourceInfo] = useState<SourceInfo | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Gamification & Adaptive state
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [conceptDifficultyMap, setConceptDifficultyMap] = useState<Record<string, number>>({});
  const [lastDelta, setLastDelta] = useState<number>(0);

  // Autopsy modal state
  const [isAutopsyOpen, setIsAutopsyOpen] = useState(false);
  const [currentAutopsy, setCurrentAutopsy] = useState<AutopsyResponse | null>(null);
  const [failedOptionInfo, setFailedOptionInfo] = useState<{
    chosenText: string;
    chosenId: string;
    correctText: string;
    correctId: string;
  } | null>(null);

  // History tracking for end-of-quiz analysis
  const [attemptHistory, setAttemptHistory] = useState<
    Array<{
      question: ChallengeQuestion;
      selectedId: string;
      isCorrect: boolean;
      autopsy?: AutopsyResponse;
    }>
  >([]);

  const [isCompleted, setIsCompleted] = useState(false);

  // Load quiz from sessionStorage if launched from Studio / Home
  useEffect(() => {
    const cached = sessionStorage.getItem('current_quiz');
    if (cached) {
      try {
        const parsed: ChallengeQuiz = JSON.parse(cached);
        setQuiz(parsed);
        const sourceDoc = sessionStorage.getItem('rag_source_document');
        if (sourceDoc || parsed.source_document) {
          setSourceInfo({
            mode: 'document',
            name: sourceDoc || parsed.source_document || 'Uploaded Document',
          });
        } else {
          setSourceInfo({
            mode: 'topic',
            name: parsed.topic || 'Curated Topic',
          });
        }

        const initialMap: Record<string, number> = {};
        parsed.questions.forEach((q) => {
          if (!initialMap[q.concept_tag]) {
            initialMap[q.concept_tag] = q.difficulty || 3;
          }
        });
        setConceptDifficultyMap(initialMap);
      } catch (e) {
        console.error('Failed to parse cached quiz:', e);
      }
    }
  }, []);

  const handleQuizGenerated = (
    generated: ChallengeQuiz,
    sourceMode: 'topic' | 'document',
    sourceName: string
  ) => {
    setQuiz(generated);
    setSourceInfo({
      mode: sourceMode,
      name: sourceName,
      summary: (generated as any).source_summary,
    });
    sessionStorage.setItem('current_quiz', JSON.stringify(generated));

    // Reset session state
    setCurrentIdx(0);
    setSelectedOptionId(null);
    setShowHint(false);
    setIsSubmitting(false);
    setScore(0);
    setStreak(0);
    setAttemptHistory([]);
    setIsCompleted(false);

    const initialMap: Record<string, number> = {};
    generated.questions.forEach((q) => {
      if (!initialMap[q.concept_tag]) {
        initialMap[q.concept_tag] = q.difficulty || 3;
      }
    });
    setConceptDifficultyMap(initialMap);
  };

  const handleResetToSourceSelector = () => {
    sessionStorage.removeItem('current_quiz');
    setQuiz(null);
    setSourceInfo(null);
    setIsCompleted(false);
    setCurrentIdx(0);
    setScore(0);
    setStreak(0);
    setAttemptHistory([]);
  };

  const currentQuestion = quiz?.questions[currentIdx] ?? null;
  const currentConceptTag = currentQuestion?.concept_tag || 'Core Concept';
  const currentDifficulty = conceptDifficultyMap[currentConceptTag] || currentQuestion?.difficulty || 3;

  // Handle option selection
  const handleSelectOption = (opt: 'A' | 'B' | 'C' | 'D') => {
    if (isSubmitting || isAutopsyOpen) return;
    setSelectedOptionId(opt);
  };

  // Submit current answer
  const handleSubmitAnswer = useCallback(async () => {
    if (!currentQuestion || !selectedOptionId || isSubmitting || isAutopsyOpen) return;

    setIsSubmitting(true);
    const chosen = currentQuestion.options.find((o) => o.id === selectedOptionId);
    const correct = currentQuestion.options.find((o) => o.is_correct);

    const isCorrect = chosen?.is_correct === true;

    if (isCorrect) {
      // 1. Audio & Confetti
      sound.playCorrect();
      const newStreak = streak + 1;
      setStreak(newStreak);
      const points = 100 * currentDifficulty;
      setScore((prev) => prev + points);

      // Trigger celebratory confetti on 3+ streak or final question
      if (newStreak >= 3 || currentIdx === (quiz?.questions.length ?? 0) - 1) {
        sound.playStreak();
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.7 },
          colors: ['#06B6D4', '#8B5CF6', '#F43F5E', '#10B981'],
        });
      }

      // 2. Adaptive Difficulty: +1 for concept tag (up to 5)
      const nextDiff = Math.min(5, currentDifficulty + 1);
      setConceptDifficultyMap((prev) => ({
        ...prev,
        [currentConceptTag]: nextDiff,
      }));
      setLastDelta(+1);

      // 3. Record attempt
      setAttemptHistory((prev) => [
        ...prev,
        {
          question: currentQuestion,
          selectedId: selectedOptionId,
          isCorrect: true,
        },
      ]);

      // 4. Advance immediately after sound
      setTimeout(() => {
        advanceNextQuestion();
      }, 500);
    } else {
      // Misconception Trap Triggered
      sound.playWrong();
      setStreak(0);

      // Adaptive Difficulty: -1 for concept tag (down to 1)
      const nextDiff = Math.max(1, currentDifficulty - 1);
      setConceptDifficultyMap((prev) => ({
        ...prev,
        [currentConceptTag]: nextDiff,
      }));
      setLastDelta(-1);

      // Trigger Cognitive Autopsy
      try {
        const autopsy = await performAutopsy({
          question_id: currentQuestion.id,
          selected_option_id: selectedOptionId,
          question_prompt: currentQuestion.prompt,
          chosen_text: chosen?.text || '',
          correct_text: correct?.text || '',
          cognitive_trap_name: currentQuestion.cognitive_trap_name,
          source_document: currentQuestion.source_document || null,
        });

        setCurrentAutopsy(autopsy);
        setFailedOptionInfo({
          chosenText: chosen?.text || '',
          chosenId: selectedOptionId,
          correctText: correct?.text || '',
          correctId: correct?.id || 'A',
        });
        setIsAutopsyOpen(true);

        // Record attempt with autopsy diagnosis
        setAttemptHistory((prev) => [
          ...prev,
          {
            question: currentQuestion,
            selectedId: selectedOptionId,
            isCorrect: false,
            autopsy,
          },
        ]);
      } catch (err) {
        console.error('Autopsy failed:', err);
        // If autopsy fails, still advance cleanly
        advanceNextQuestion();
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [
    currentQuestion,
    selectedOptionId,
    isSubmitting,
    isAutopsyOpen,
    streak,
    currentDifficulty,
    quiz?.questions.length,
    currentIdx,
    currentConceptTag,
  ]);

  // Advance question helper
  const advanceNextQuestion = () => {
    setSelectedOptionId(null);
    setShowHint(false);
    setIsSubmitting(false);
    setLastDelta(0);

    if (quiz && currentIdx + 1 < quiz.questions.length) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  // Close autopsy modal & advance
  const handleCloseAutopsy = () => {
    setIsAutopsyOpen(false);
    setCurrentAutopsy(null);
    advanceNextQuestion();
  };

  // Keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAutopsyOpen) return;

      if (e.key === '1') handleSelectOption('A');
      else if (e.key === '2') handleSelectOption('B');
      else if (e.key === '3') handleSelectOption('C');
      else if (e.key === '4') handleSelectOption('D');
      else if (e.key === 'h' || e.key === 'H') setShowHint((prev) => !prev);
      else if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmitAnswer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAutopsyOpen, handleSubmitAnswer]);

  return (
    <main className="min-h-screen relative flex flex-col items-center justify-between p-4 sm:p-6 md:p-8 max-w-5xl mx-auto font-sans selection:bg-violet-500 selection:text-white">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[800px] h-[400px] bg-violet-700/10 rounded-full blur-[150px]" />
      </div>

      {/* Top Header */}
      <header className="w-full flex items-center justify-between gap-4 py-3 border-b border-white/10 relative z-10">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit Arena</span>
        </button>

        {/* Middle: Source Badge or Quiz Title */}
        {quiz ? (
          <div className="text-center max-w-[260px] sm:max-w-md truncate">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-cyan-400 uppercase tracking-wider mb-0.5">
              {sourceInfo?.mode === 'document' ? (
                <>
                  <FileText className="w-3 h-3 text-cyan-400" />
                  <span>Document: {sourceInfo.name}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 text-[#8B5CF6]" />
                  <span>Topic: {sourceInfo?.name || quiz.topic}</span>
                </>
              )}
            </div>
            <h1 className="text-xs sm:text-sm font-bold text-white truncate">
              {quiz.title}
            </h1>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#ffb829]">
            <Brain className="w-4 h-4" />
            <span>Pre-Challenge Setup</span>
          </div>
        )}

        {/* Right Action: New Source & HUD */}
        <div className="flex items-center gap-2 sm:gap-3">
          {quiz && (
            <>
              <button
                type="button"
                onClick={handleResetToSourceSelector}
                className="hidden sm:flex items-center gap-1 text-[11px] text-[#9a9a9a] hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/10 transition-colors cursor-pointer"
                title="Change Topic or Document"
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>New Source</span>
              </button>

              {/* Streak pill */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                  streak >= 3
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                    : 'bg-white/5 border-white/10 text-slate-300'
                }`}
              >
                <Flame
                  className={`w-3.5 h-3.5 ${
                    streak >= 3 ? 'text-amber-400 fill-amber-400 animate-bounce' : 'text-slate-400'
                  }`}
                />
                <span>{streak} Streak</span>
              </div>

              {/* Score pill */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600/20 border border-violet-500/30 text-xs font-mono font-bold text-violet-300">
                <Trophy className="w-3.5 h-3.5 text-violet-400" />
                <span>{score} PTS</span>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Main Arena Content */}
      <div className="w-full flex-1 flex flex-col justify-center py-6 sm:py-8 relative z-10">
        {!quiz ? (
          /* PRE-QUIZ STEP: Source Selector */
          <div className="py-6">
            <QuizSourceSelector
              onQuizGenerated={handleQuizGenerated}
              initialTopic={topicParam}
            />
          </div>
        ) : !isCompleted && currentQuestion ? (
          /* ACTIVE QUIZ SESSION */
          <div className="w-full flex flex-col gap-6">
            {/* Progress Bar & Counter */}
            <div className="w-full max-w-3xl mx-auto flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <div className="flex items-center gap-2">
                  <span>
                    Question <strong className="text-white">{currentIdx + 1}</strong> of{' '}
                    {quiz.questions.length}
                  </span>
                  {currentQuestion.is_grounded && (
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      Grounded
                    </span>
                  )}
                </div>
                <span>
                  {Math.round(((currentIdx + 1) / quiz.questions.length) * 100)}% Completed
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={false}
                  animate={{
                    width: `${((currentIdx + 1) / quiz.questions.length) * 100}%`,
                  }}
                  transition={{ duration: 0.3 }}
                  className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full shadow-[0_0_8px_#06B6D4]"
                />
              </div>
            </div>

            {/* Concept Tag + Adaptive Difficulty Level */}
            <div className="w-full max-w-3xl mx-auto">
              <DifficultyIndicator
                conceptTag={currentConceptTag}
                difficulty={currentDifficulty}
                lastDelta={lastDelta}
              />
            </div>

            {/* Question Card */}
            <QuestionCard
              question={currentQuestion}
              selectedOptionId={selectedOptionId}
              onSelectOption={handleSelectOption}
              onSubmit={handleSubmitAnswer}
              showHint={showHint}
              onToggleHint={() => setShowHint((prev) => !prev)}
              isSubmitting={isSubmitting}
            />
          </div>
        ) : (
          /* COMPLETION REPORT */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl mx-auto rounded-3xl p-8 text-center border border-white/10 bg-white/[0.02] backdrop-blur-md relative overflow-hidden shadow-2xl"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 mx-auto flex items-center justify-center text-white shadow-[0_0_30px_rgba(139,92,246,0.5)] mb-5">
              <Trophy className="w-8 h-8" />
            </div>

            <span className="text-xs uppercase tracking-widest text-cyan-400 font-bold">
              Challenge Completed
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 mb-2">
              Cognitive Mastery Report
            </h2>
            <p className="text-sm text-slate-300 max-w-md mx-auto mb-6">
              You navigated {quiz.questions.length} high-yield conceptual scenarios testing mental model fidelity.
            </p>

            {/* Source Summary if Available */}
            {sourceInfo?.summary && (
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 mb-6 text-left">
                <span className="text-[10px] uppercase font-bold text-violet-400 tracking-wider block mb-1">
                  Source Document Summary
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {sourceInfo.summary}
                </p>
              </div>
            )}

            {/* Summary Metrics */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                <span className="text-xs text-slate-400 block mb-1">Final Score</span>
                <span className="text-xl sm:text-2xl font-bold font-mono text-violet-400">
                  {score}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                <span className="text-xs text-slate-400 block mb-1">Accuracy</span>
                <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
                  {Math.round(
                    (attemptHistory.filter((a) => a.isCorrect).length /
                      (attemptHistory.length || 1)) *
                      100
                  )}
                  %
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                <span className="text-xs text-slate-400 block mb-1">Autopsies</span>
                <span className="text-xl sm:text-2xl font-bold font-mono text-rose-400">
                  {attemptHistory.filter((a) => !a.isCorrect).length}
                </span>
              </div>
            </div>

            {/* Diagnosed Fallacies Recap */}
            {attemptHistory.some((a) => !a.isCorrect) && (
              <div className="text-left mb-8">
                <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 uppercase tracking-wider mb-3">
                  <AlertCircle className="w-4 h-4" />
                  <span>Cognitive Fallacies Diagnosed During Session</span>
                </div>
                <div className="flex flex-col gap-2">
                  {attemptHistory
                    .filter((a) => !a.isCorrect)
                    .map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/20 text-xs flex items-center justify-between"
                      >
                        <div>
                          <span className="font-semibold text-white block">
                            {item.autopsy?.fallacy_name || item.question.cognitive_trap_name}
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">
                            Concept: {item.question.concept_tag}
                          </span>
                        </div>
                        <span className="text-rose-400 font-mono text-[10px] px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                          Autopsied
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleResetToSourceSelector}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl font-medium text-xs bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Configure New Quiz</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentIdx(0);
                  setSelectedOptionId(null);
                  setScore(0);
                  setStreak(0);
                  setAttemptHistory([]);
                  setIsCompleted(false);
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl font-medium text-xs bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Challenge</span>
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Signature Cognitive Autopsy Modal */}
      <AnimatePresence>
        {isAutopsyOpen && currentAutopsy && failedOptionInfo && (
          <AutopsyModal
            isOpen={isAutopsyOpen}
            autopsy={currentAutopsy}
            chosenText={failedOptionInfo.chosenText}
            chosenOptionId={failedOptionInfo.chosenId}
            correctText={failedOptionInfo.correctText}
            correctOptionId={failedOptionInfo.correctId}
            onClose={handleCloseAutopsy}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

export default function ArenaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <Sparkles className="w-8 h-8 text-cyan-400 animate-spin mb-4" />
          <h2 className="text-xl font-bold text-white">Initializing Arena...</h2>
        </div>
      }
    >
      <ArenaContent />
    </Suspense>
  );
}
