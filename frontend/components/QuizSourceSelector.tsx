'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  UploadCloud,
  FileCode,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  X
} from 'lucide-react';
import { generateQuiz, generateQuizFromDocument, ChallengeQuiz } from '@/lib/api';

const PRESET_TOPICS = [
  {
    title: 'React State & Closures',
    tag: 'Frontend',
    desc: 'Batched updates, stale closures, dependency arrays & hooks internals.',
  },
  {
    title: 'Python Memory & GIL Internals',
    tag: 'Backend',
    desc: 'Mutable defaults, refcounts, and thread switching mechanics.',
  },
  {
    title: 'System Design & Distributed Caching',
    tag: 'Architecture',
    desc: 'Cache stampedes, CAP theorem, replication lag & locks.',
  },
  {
    title: 'Recursion & Dynamic Programming',
    tag: 'Algorithms',
    desc: 'Base cases, call stack unwinding & memoization invariants.',
  },
  {
    title: 'Database Concurrency & MVCC',
    tag: 'Data',
    desc: 'Transaction isolation levels, dirty reads & snapshot consistency.',
  },
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt'];

interface QuizSourceSelectorProps {
  onQuizGenerated: (quiz: ChallengeQuiz, sourceMode: 'topic' | 'document', sourceName: string) => void;
  initialTopic?: string;
}

export function QuizSourceSelector({ onQuizGenerated, initialTopic }: QuizSourceSelectorProps) {
  const [sourceMode, setSourceMode] = useState<'topic' | 'document'>('topic');

  // Topic Mode State
  const [topic, setTopic] = useState(initialTopic || 'React State & Closures');
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<string>('medium');

  // Document Mode State
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Loading & Step State
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialTopic) {
      setTopic(initialTopic);
    }
  }, [initialTopic]);

  // Stepped loading message effect
  useEffect(() => {
    let timer1: NodeJS.Timeout;
    let timer2: NodeJS.Timeout;
    if (isLoading) {
      if (sourceMode === 'document') {
        setLoadingStep('Reading your document & verifying text stream...');
        timer1 = setTimeout(() => {
          setLoadingStep('Analyzing conceptual core & mental models...');
        }, 1400);
        timer2 = setTimeout(() => {
          setLoadingStep('Synthesizing cognitive autopsy challenges...');
        }, 3200);
      } else {
        setLoadingStep('Consulting cognitive engine for topic...');
        timer1 = setTimeout(() => {
          setLoadingStep('Formulating diagnostic distractor options...');
        }, 1200);
      }
    }
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isLoading, sourceMode]);

  const validateAndSetFile = (selectedFile: File) => {
    setErrorMessage(null);
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setErrorMessage(
        `Unsupported file type '${ext}'. Please upload a valid PDF (.pdf), Word Document (.docx), or Text file (.txt).`
      );
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage('File size exceeds the 10MB limit. Please upload a smaller document.');
      return;
    }

    setFile(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      validateAndSetFile(selected);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      validateAndSetFile(dropped);
    }
  };

  const handleTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setErrorMessage('Please specify or select a topic.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const generated = await generateQuiz({
        topic: topic.trim(),
        num_questions: numQuestions,
        difficulty_level: difficulty as any,
      });

      onQuizGenerated(generated, 'topic', topic.trim());
    } catch (err: any) {
      console.error('Topic quiz generation error:', err);
      setErrorMessage(
        err.message || 'Failed to generate quiz for this topic. Please try again or pick another topic.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentSubmit = async () => {
    if (!file) {
      setErrorMessage('Please choose or drop a document to start.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const generated = await generateQuizFromDocument(file, numQuestions, difficulty);
      onQuizGenerated(generated, 'document', file.name);
    } catch (err: any) {
      console.error('Document quiz generation error:', err);
      let msg = err.message || 'Failed to generate quiz from document.';
      if (msg.toLowerCase().includes('scanned') || msg.toLowerCase().includes('could not extract')) {
        msg = "Couldn't read this file. If this is a scanned image PDF, please try another text-based document.";
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Header Eyebrow & Title */}
      <div className="text-center space-y-2">
        <span className="font-dala-eyebrow text-xs text-[#ffb829]">
          Cognitive Challenge Setup
        </span>
        <h2 className="font-dala-heading text-2xl md:text-3xl text-white">
          Configure Your Quiz Arena
        </h2>
        <p className="font-dala-body-muted text-xs md:text-sm max-w-lg mx-auto">
          Choose between testing curated conceptual topics or upload your study material for a grounded diagnostic session.
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex p-1.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
        <button
          type="button"
          onClick={() => {
            setSourceMode('topic');
            setErrorMessage(null);
          }}
          className={`flex-1 py-3 px-4 rounded-xl font-dala-nav text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            sourceMode === 'topic'
              ? 'bg-white/10 text-white shadow-md border border-white/20'
              : 'text-[#9a9a9a] hover:text-white hover:bg-white/[0.02]'
          }`}
        >
          <Sparkles className={`w-3.5 h-3.5 ${sourceMode === 'topic' ? 'text-[#8052ff]' : ''}`} />
          <span>Pick a Topic</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSourceMode('document');
            setErrorMessage(null);
          }}
          className={`flex-1 py-3 px-4 rounded-xl font-dala-nav text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            sourceMode === 'document'
              ? 'bg-white/10 text-white shadow-md border border-white/20'
              : 'text-[#9a9a9a] hover:text-white hover:bg-white/[0.02]'
          }`}
        >
          <FileText className={`w-3.5 h-3.5 ${sourceMode === 'document' ? 'text-cyan-400' : ''}`} />
          <span>Upload Document (PDF / DOCX)</span>
        </button>
      </div>

      {/* Error Alert Message */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-rose-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading ? (
        <div className="p-12 rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-md flex flex-col items-center justify-center gap-4 text-center min-h-[300px]">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin" />
            <Sparkles className="w-5 h-5 text-violet-400 absolute inset-0 m-auto animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-white">{loadingStep}</p>
            <p className="text-xs text-[#9a9a9a]">
              Crafting misconception distractors and 10-second cognitive cures...
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* TAB 1: TOPIC PATH */}
          {sourceMode === 'topic' && (
            <form
              onSubmit={handleTopicSubmit}
              className="p-6 md:p-8 rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-md space-y-6"
            >
              {/* Custom Topic Input */}
              <div className="space-y-2">
                <label className="font-dala-nav text-[11px] uppercase text-[#9a9a9a] tracking-wider block">
                  Challenge Topic or Concept
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Distributed Caching, Python GIL, React State..."
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#6b6b76] focus:outline-none focus:border-violet-500/50 transition-colors"
                  />
                </div>
              </div>

              {/* Preset Topic Chips */}
              <div className="space-y-2">
                <span className="font-dala-nav text-[10px] uppercase text-[#6b6b76] tracking-wider block">
                  High-Signal Curated Topics
                </span>
                <div className="flex flex-wrap gap-2">
                  {PRESET_TOPICS.map((item) => (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => setTopic(item.title)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                        topic === item.title
                          ? 'bg-violet-500/20 border-violet-500/40 text-violet-300 font-medium'
                          : 'bg-white/[0.02] border-white/5 text-[#9a9a9a] hover:text-white hover:border-white/15'
                      }`}
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quiz Configuration: Question Count & Difficulty */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/[0.06]">
                <div className="space-y-1.5">
                  <label className="font-dala-nav text-[10px] uppercase text-[#9a9a9a] tracking-wider block">
                    Question Count
                  </label>
                  <div className="flex items-center gap-2">
                    {[3, 5, 10].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setNumQuestions(count)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-mono transition-all ${
                          numQuestions === count
                            ? 'bg-white/15 text-white border border-white/20 font-bold'
                            : 'bg-white/[0.02] border border-white/5 text-[#9a9a9a] hover:text-white'
                        }`}
                      >
                        {count} Questions
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-dala-nav text-[10px] uppercase text-[#9a9a9a] tracking-wider block">
                    Target Difficulty
                  </label>
                  <div className="flex items-center gap-2">
                    {['easy', 'medium', 'hard'].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDifficulty(d)}
                        className={`flex-1 py-1.5 rounded-lg text-xs capitalize transition-all ${
                          difficulty === d
                            ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40 font-bold'
                            : 'bg-white/[0.02] border border-white/5 text-[#9a9a9a] hover:text-white'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || !topic.trim()}
                  className="btn-dala-primary w-full text-xs py-3.5 flex items-center justify-center gap-2"
                >
                  <span>Start Topic Quiz</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: DOCUMENT PATH */}
          {sourceMode === 'document' && (
            <div className="p-6 md:p-8 rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-md space-y-6">
              {/* Dropzone Area */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                className="hidden"
              />

              {!file ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                    isDragging
                      ? 'border-cyan-400 bg-cyan-400/5'
                      : 'border-white/15 bg-white/[0.01] hover:border-white/30 hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-white">
                      Drop lecture notes or syllabus here, or <span className="text-cyan-400 underline">browse</span>
                    </p>
                    <p className="text-xs text-[#9a9a9a]">
                      Supports PDF, Word (.docx), or Text (.txt) up to 10MB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-[#9a9a9a]">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for ingestion
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="p-1.5 rounded-lg text-[#9a9a9a] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Quiz Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/[0.06]">
                <div className="space-y-1.5">
                  <label className="font-dala-nav text-[10px] uppercase text-[#9a9a9a] tracking-wider block">
                    Question Count
                  </label>
                  <div className="flex items-center gap-2">
                    {[3, 5, 10].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setNumQuestions(count)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-mono transition-all ${
                          numQuestions === count
                            ? 'bg-white/15 text-white border border-white/20 font-bold'
                            : 'bg-white/[0.02] border border-white/5 text-[#9a9a9a] hover:text-white'
                        }`}
                      >
                        {count} Questions
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-dala-nav text-[10px] uppercase text-[#9a9a9a] tracking-wider block">
                    Target Difficulty
                  </label>
                  <div className="flex items-center gap-2">
                    {['easy', 'medium', 'hard'].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDifficulty(d)}
                        className={`flex-1 py-1.5 rounded-lg text-xs capitalize transition-all ${
                          difficulty === d
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                            : 'bg-white/[0.02] border border-white/5 text-[#9a9a9a] hover:text-white'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleDocumentSubmit}
                  disabled={isLoading || !file}
                  className="btn-dala-primary w-full text-xs py-3.5 flex items-center justify-center gap-2"
                >
                  <span>Generate Grounded Quiz</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
