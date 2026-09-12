'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Zap,
  Printer,
  Copy,
  Check,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Volume2,
  Shuffle,
  ShieldCheck,
  AlertTriangle,
  Bookmark,
  Calendar,
  Award,
  CheckCircle2
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/lib/auth';
import {
  getDashboardStats,
  DashboardStats,
  generateStudyGuide,
  StudyGuideResponse,
  generateFlashcards,
  FlashcardDeck,
  getStudySets,
  StudySetSummary,
  getApiBaseUrl
} from '@/lib/api';
import { ProgressChart } from '@/components/student/ProgressChart';
import { AnnouncementsFeed } from '@/components/student/AnnouncementsFeed';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export type StudentHubTab = 'overview' | 'study' | 'flashcards' | 'progress';

interface StudentHubProps {
  initialTab?: StudentHubTab;
}

function StudentHubContent({ initialTab = 'overview' }: StudentHubProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as StudentHubTab | null;

  const [activeTab, setActiveTab] = useState<StudentHubTab>(
    tabParam && ['overview', 'study', 'flashcards', 'progress'].includes(tabParam)
      ? tabParam
      : initialTab
  );

  const { user } = useAuth();

  // Sync tab with URL
  useEffect(() => {
    if (tabParam && ['overview', 'study', 'flashcards', 'progress'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: StudentHubTab) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url.toString());
  };

  // --- 1. OVERVIEW DATA ---
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [studentProgress, setStudentProgress] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    getDashboardStats().then(setStats).catch(() => {});

    const fetchScholarData = async () => {
      try {
        const token = typeof window !== 'undefined' ? sessionStorage.getItem('access_token') : null;
        const baseUrl = getApiBaseUrl();
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

        const [progRes, annRes] = await Promise.all([
          fetch(`${baseUrl}/student/progress`, { headers }).catch(() => null),
          fetch(`${baseUrl}/student/announcements`, { headers }).catch(() => null),
        ]);

        if (progRes && progRes.ok) {
          const progData = await progRes.json();
          setStudentProgress(progData);
        }
        if (annRes && annRes.ok) {
          const annData = await annRes.json();
          setAnnouncements(annData);
        }
      } catch {
        // Fallbacks rendered
      }
    };

    fetchScholarData();
  }, []);

  // --- 2. STUDY GUIDE DATA ---
  const [studySets, setStudySets] = useState<StudySetSummary[]>([]);
  const [selectedTopic, setSelectedTopic] = useState('React 19 & Next.js Architecture');
  const [guide, setGuide] = useState<StudyGuideResponse | null>(null);
  const [isGuideLoading, setIsGuideLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getStudySets().then(setStudySets).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab === 'study' && !guide) {
      loadGuide(selectedTopic);
    }
  }, [activeTab, selectedTopic]);

  const loadGuide = async (topic: string) => {
    setIsGuideLoading(true);
    try {
      const data = await generateStudyGuide({ topic });
      setGuide(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGuideLoading(false);
    }
  };

  const handleCopyGuide = () => {
    if (!guide) return;
    const text = `${guide.title}\n\n${guide.executive_summary}\n\nHigh-Yield Rules:\n${guide.high_yield_rules.join('\n')}\n\nKey Terms:\n${guide.key_vocabulary.map(v => `${v.term}: ${v.definition}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // --- 3. FLASHCARDS DATA ---
  const [deck, setDeck] = useState<FlashcardDeck | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownIds, setKnownIds] = useState<Set<string>>(new Set());
  const [learningIds, setLearningIds] = useState<Set<string>>(new Set());
  const [isDeckLoading, setIsDeckLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'flashcards' && !deck) {
      loadDeck(selectedTopic);
    }
  }, [activeTab, selectedTopic]);

  const loadDeck = async (topic: string) => {
    setIsDeckLoading(true);
    setIsFlipped(false);
    setCurrentIndex(0);
    setKnownIds(new Set());
    setLearningIds(new Set());
    try {
      const data = await generateFlashcards({ topic });
      setDeck(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeckLoading(false);
    }
  };

  const currentCard = deck?.cards[currentIndex];

  const handleNextCard = () => {
    if (!deck || deck.cards.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % deck.cards.length);
  };

  const handlePrevCard = () => {
    if (!deck || deck.cards.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + deck.cards.length) % deck.cards.length);
  };

  const markKnown = () => {
    if (!currentCard) return;
    setKnownIds(prev => new Set(prev).add(currentCard.id));
    setLearningIds(prev => {
      const next = new Set(prev);
      next.delete(currentCard.id);
      return next;
    });
    handleNextCard();
  };

  const markLearning = () => {
    if (!currentCard) return;
    setLearningIds(prev => new Set(prev).add(currentCard.id));
    setKnownIds(prev => {
      const next = new Set(prev);
      next.delete(currentCard.id);
      return next;
    });
    handleNextCard();
  };

  const handleShuffleCards = () => {
    if (!deck) return;
    const shuffled = [...deck.cards].sort(() => Math.random() - 0.5);
    setDeck({ ...deck, cards: shuffled });
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleSpeak = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Keyboard navigation for flashcards
  useEffect(() => {
    if (activeTab !== 'flashcards') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNextCard();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrevCard();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, deck]);

  // Telemetry metrics
  const memoryScore = stats ? `${Math.round(stats.average_score / 10 || 88)}%` : '88%';
  const studyStreak = stats ? `${stats.learning_streak || 7} DAYS` : '7 DAYS';
  const accuracy = stats ? `${Math.round(stats.overall_accuracy || 70)}%` : '70%';
  const questionsTotal = stats ? `${stats.total_questions_practiced || 438}` : '438';

  const weakestConcept = stats?.weak_topics?.[0]?.concept_tag || 'RECURSION';
  const weakestPct = stats?.weak_topics?.[0]?.accuracy ? `${Math.round(stats.weak_topics[0].accuracy)}%` : '42%';

  const strongestConcept = 'ARRAYS & POINTERS';
  const strongestPct = '91%';

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col font-sans selection:bg-[#8052ff] selection:text-white print:bg-white print:text-black">
      <div className="print:hidden">
        <Navbar />
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex flex-col gap-8">

        {/* Page Banner / Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/[0.08] pb-6 print:border-black">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="font-dala-eyebrow text-[11px] text-[#ffb829]">
                Student Learning Workspace
              </span>
              <span className="text-white/20">•</span>
              <span className="text-xs text-zinc-400 font-mono">
                Unified Hub
              </span>
            </div>
            <h1 className="font-dala-heading text-2xl sm:text-3xl text-white print:text-black">
              {activeTab === 'overview' && 'Knowledge & Learning DNA'}
              {activeTab === 'study' && 'AI Comprehensive Study Guide'}
              {activeTab === 'flashcards' && 'Spaced Repetition Flashcards'}
              {activeTab === 'progress' && 'Academic Curriculum Progress'}
            </h1>
            <p className="font-dala-body-muted text-sm text-zinc-400 print:text-slate-600">
              {activeTab === 'overview' && 'Real-time diagnostic telemetry tracking mental models, retention half-life, and cognitive boundaries.'}
              {activeTab === 'study' && 'High-yield conceptual summaries, exam invariants, and key vocabulary synthesized for deep retention.'}
              {activeTab === 'flashcards' && 'Interactive 3D flashcards with active recall testing and spaced repetition confidence tracking.'}
              {activeTab === 'progress' && 'Official academic progress, module completion metrics, and course letter grades.'}
            </p>
          </div>

          {/* Top Quick Actions */}
          <div className="flex items-center gap-3 print:hidden shrink-0">
            <Link
              href={`/arena?topic=${encodeURIComponent(selectedTopic)}`}
              className="btn-dala-primary text-xs py-2.5 px-5 flex items-center gap-2"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Launch Arena Challenge</span>
            </Link>
          </div>
        </div>

        {/* Unified Tab Navigation Bar */}
        <div className="print:hidden flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/[0.08] scrollbar-none">
          {[
            { id: 'overview', label: 'Overview & DNA', icon: LayoutDashboard, badge: null },
            { id: 'study', label: 'Study Guides', icon: BookOpen, badge: 'AI' },
            { id: 'flashcards', label: 'Flashcards', icon: Layers, badge: 'Active Recall' },
            { id: 'progress', label: 'Curriculum Progress', icon: TrendingUp, badge: null },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id as StudentHubTab)}
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-dala-nav text-xs transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-violet-500/15 text-white border border-violet-500/30 shadow-lg shadow-violet-500/10 font-semibold'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-violet-400' : 'text-zinc-500'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded-full font-mono ${
                    isActive ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40' : 'bg-white/5 text-zinc-400'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW & LEARNING DNA */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-10 animate-in fade-in duration-200">
            {/* 4 Glass Metrics */}
            <div className="p-6 sm:p-8 rounded-3xl border border-white/[0.1] bg-[#0e101a]/70 backdrop-blur-2xl shadow-2xl grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">
              <div className="space-y-1.5 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                <span className="font-mono text-zinc-500 block text-[11px] uppercase tracking-wider">
                  Memory Retention
                </span>
                <div className="text-3xl font-bold font-mono text-white">
                  {memoryScore}
                </div>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                  Optimal decay index
                </span>
              </div>

              <div className="space-y-1.5 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                <span className="font-mono text-zinc-500 block text-[11px] uppercase tracking-wider">
                  Active Streak
                </span>
                <div className="text-3xl font-bold font-mono text-[#ffb829]">
                  {studyStreak}
                </div>
                <span className="text-[11px] text-amber-400/80 flex items-center gap-1">
                  Consistent recall daily
                </span>
              </div>

              <div className="space-y-1.5 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                <span className="font-mono text-zinc-500 block text-[11px] uppercase tracking-wider">
                  Overall Accuracy
                </span>
                <div className="text-3xl font-bold font-mono text-cyan-400">
                  {accuracy}
                </div>
                <span className="text-[11px] text-cyan-400/80 flex items-center gap-1">
                  Across all concept nodes
                </span>
              </div>

              <div className="space-y-1.5 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                <span className="font-mono text-zinc-500 block text-[11px] uppercase tracking-wider">
                  Challenges Solved
                </span>
                <div className="text-3xl font-bold font-mono text-violet-400">
                  {questionsTotal}
                </div>
                <span className="text-[11px] text-violet-400/80 flex items-center gap-1">
                  Total drill questions
                </span>
              </div>
            </div>

            {/* Asymmetric Split: Weakest vs Strongest Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Weakest Concept Card */}
              <div className="lg:col-span-6 p-8 rounded-3xl border border-rose-500/20 bg-[#0e101a]/70 backdrop-blur-2xl shadow-xl space-y-6 hover:border-rose-500/40 transition-all flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                    <span className="font-mono text-xs uppercase tracking-wider text-rose-400 font-semibold">
                      Highest Cognitive Friction
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      {weakestConcept}
                    </h2>
                    <div className="text-5xl font-extralight text-[#ffb829] font-mono">
                      {weakestPct}
                    </div>
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Base-case confusion and boundary condition oversight detected during recent challenge cycles.
                  </p>
                </div>

                <div className="pt-4 flex items-center gap-4">
                  <Link
                    href={`/arena?topic=${encodeURIComponent(weakestConcept)}`}
                    className="btn-dala-primary text-xs py-2.5 px-6"
                  >
                    Fix My Weakness
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTopic(weakestConcept);
                      handleTabChange('study');
                    }}
                    className="btn-dala-ghost text-xs text-zinc-400 hover:text-white"
                  >
                    <span>Read Study Guide</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Strongest Concept Card */}
              <div className="lg:col-span-6 p-8 rounded-3xl border border-emerald-500/20 bg-[#0e101a]/70 backdrop-blur-2xl shadow-xl space-y-6 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-mono text-xs uppercase tracking-wider text-emerald-400 font-semibold">
                      Mastery Invariant
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      {strongestConcept}
                    </h2>
                    <div className="text-5xl font-extralight text-white font-mono">
                      {strongestPct}
                    </div>
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Demonstrated mastery over spatial contiguous arrays, pointer arithmetic, and contiguous buffer operations.
                  </p>
                </div>

                <div className="pt-4 flex items-center gap-4">
                  <Link
                    href="/arena"
                    className="btn-dala-ghost text-white hover:text-[#8052ff] text-xs flex items-center gap-1.5"
                  >
                    <span>Challenge next difficulty tier</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Learning DNA Matrix */}
            <section className="space-y-6">
              <div className="space-y-2">
                <span className="font-dala-eyebrow text-xs text-[#8052ff]">
                  Learner Telemetry
                </span>
                <h2 className="font-dala-heading text-2xl text-white">
                  Cognitive Learning DNA
                </h2>
                <p className="font-dala-body-muted text-sm max-w-xl">
                  Dynamic behavioral blueprint synthesized from error patterns, response latency, and conceptual retention.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Strongest Domain', value: strongestConcept, color: 'text-white' },
                  { label: 'Friction Point', value: weakestConcept, color: 'text-[#ffb829]' },
                  { label: 'Learning Speed', value: 'Accelerated', color: 'text-white' },
                  { label: 'Confidence Index', value: 'High (84%)', color: 'text-white' },
                  { label: 'Frequent Trap', value: 'Base-case illusion', color: 'text-rose-300' },
                  { label: 'Recommended Tier', value: 'Tier 04 (Advanced)', color: 'text-white' },
                  { label: 'Streak Status', value: '7 Days Active', color: 'text-[#ffb829]' },
                  { label: 'Target Invariant', value: 'Reinforce Recursion', color: 'text-[#8052ff]' },
                ].map((item, i) => (
                  <div key={i} className="p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm space-y-1 hover:border-white/20 transition-all">
                    <span className="font-dala-nav text-[10px] uppercase text-[#9a9a9a] block tracking-wider">
                      {item.label}
                    </span>
                    <p className={`text-base font-medium ${item.color}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Two Column Section: Deadlines & Dispatches */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
              {/* Deadlines */}
              <div className="space-y-4">
                <span className="font-dala-eyebrow text-xs text-[#ffb829] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Upcoming Milestones & Exams
                </span>
                <div className="p-6 rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-md space-y-3">
                  <div className="py-3 border-b border-white/[0.06] flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Midterm Diagnostic Assessment</p>
                      <p className="text-xs text-[#9a9a9a]">Advanced Algorithms & Data Structures</p>
                    </div>
                    <span className="font-mono text-xs text-[#ffb829] bg-[#ffb829]/10 px-2 py-1 rounded border border-[#ffb829]/20">
                      In 3 Days
                    </span>
                  </div>
                  <div className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Distributed Systems Analysis</p>
                      <p className="text-xs text-[#9a9a9a]">Concurrency & Consensus Protocols</p>
                    </div>
                    <span className="font-mono text-xs text-[#9a9a9a] bg-white/5 px-2 py-1 rounded border border-white/10">
                      Oct 15
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Dispatches */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-dala-eyebrow text-xs text-[#8052ff] flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" />
                    Academic Notices & Dispatches
                  </span>
                  <Link
                    href="/student/announcements"
                    className="btn-dala-ghost text-xs text-[#9a9a9a] hover:text-white"
                  >
                    View All
                  </Link>
                </div>
                <div className="p-6 rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-md">
                  <AnnouncementsFeed announcements={announcements.slice(0, 2)} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STUDY GUIDES */}
        {activeTab === 'study' && (
          <div className="flex flex-col gap-8 animate-in fade-in duration-200">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6 print:border-black">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white print:text-black">
                  {guide?.title || selectedTopic}
                </h2>
                <p className="text-xs text-[#9a9a9a] mt-1">
                  Exam Ready Conceptual Cheat Sheet & High-Yield Rules
                </p>
              </div>

              <div className="flex items-center gap-2 print:hidden">
                <button
                  type="button"
                  onClick={handleCopyGuide}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy Guide'}
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange('flashcards')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  Study Flashcards
                </button>
              </div>
            </div>

            {/* Topic Selector Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none print:hidden">
              {studySets.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSelectedTopic(s.title);
                    loadGuide(s.title);
                  }}
                  className={`text-xs px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                    selectedTopic === s.title
                      ? 'bg-white text-black font-bold shadow-xs'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
                  }`}
                >
                  {s.title}
                </button>
              ))}
            </div>

            {isGuideLoading ? (
              <div className="h-96 w-full rounded-3xl bg-white/[0.02] border border-white/10 flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                <p className="text-sm text-slate-400 font-medium">Synthesizing comprehensive study guide...</p>
              </div>
            ) : guide ? (
              <div className="flex flex-col gap-8">
                {/* Executive Summary */}
                <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-[#111322] to-[#0D0F19] border border-indigo-500/20 shadow-xl">
                  <h3 className="text-xs uppercase font-bold tracking-widest text-indigo-400 mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Executive Summary
                  </h3>
                  <p className="text-sm md:text-base text-slate-200 leading-relaxed font-normal">
                    {guide.executive_summary}
                  </p>
                </div>

                {/* High-Yield Rules Checklist */}
                <div className="p-6 md:p-8 rounded-3xl bg-white/[0.02] border border-white/10">
                  <h3 className="text-sm uppercase font-bold tracking-wider text-amber-400 mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    High-Yield Exam Invariants & Rules
                  </h3>
                  <div className="space-y-3">
                    {guide.high_yield_rules.map((rule, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5">
                        <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                          ✓
                        </div>
                        <span className="text-xs md:text-sm text-slate-200 leading-relaxed">{rule}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Vocabulary Table */}
                <div className="p-6 md:p-8 rounded-3xl bg-white/[0.02] border border-white/10">
                  <h3 className="text-sm uppercase font-bold tracking-wider text-cyan-400 mb-4 flex items-center gap-2">
                    <Bookmark className="w-4 h-4" />
                    Key Vocabulary & Formal Definitions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {guide.key_vocabulary.map((v, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-1.5">
                        <h4 className="text-sm font-bold text-white">{v.term}</h4>
                        <p className="text-xs text-slate-300 leading-relaxed">{v.definition}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detailed Conceptual Sections */}
                <div className="space-y-6">
                  {guide.sections.map((section, idx) => (
                    <div key={idx} className="p-6 md:p-8 rounded-3xl bg-white/[0.02] border border-white/10 space-y-4">
                      <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3">
                        {section.heading}
                      </h3>
                      <p className="text-xs md:text-sm text-slate-300 italic">
                        {section.summary}
                      </p>

                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Core Mechanisms</h4>
                        <ul className="list-disc list-inside space-y-1.5 text-xs md:text-sm text-slate-200">
                          {section.key_points.map((pt, pIdx) => (
                            <li key={pIdx}>{pt}</li>
                          ))}
                        </ul>
                      </div>

                      {section.common_pitfalls.length > 0 && (
                        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-2 mt-4">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Common Exam Pitfalls & Traps to Avoid
                          </h4>
                          <ul className="space-y-1 text-xs text-rose-200">
                            {section.common_pitfalls.map((pit, pitIdx) => (
                              <li key={pitIdx} className="flex items-start gap-2">
                                <span className="text-rose-400 font-bold">•</span>
                                <span>{pit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* TAB 3: FLASHCARDS */}
        {activeTab === 'flashcards' && (
          <div className="flex flex-col gap-8 animate-in fade-in duration-200 max-w-4xl mx-auto w-full">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white">
                  {deck?.title || selectedTopic}
                </h2>
                <p className="text-xs text-[#9a9a9a] mt-1">
                  Active Recall & Spaced Repetition Mode
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleShuffleCards}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  Shuffle
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange('study')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                  Read Guide
                </button>
              </div>
            </div>

            {/* Topic Selector Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {studySets.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSelectedTopic(s.title);
                    loadDeck(s.title);
                  }}
                  className={`text-xs px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                    selectedTopic === s.title
                      ? 'bg-white text-black font-bold shadow-xs'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
                  }`}
                >
                  {s.title}
                </button>
              ))}
            </div>

            {isDeckLoading ? (
              <div className="h-96 w-full rounded-3xl bg-white/[0.02] border border-white/10 flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                <p className="text-sm text-slate-400 font-medium">Generating smart flashcards...</p>
              </div>
            ) : deck && currentCard ? (
              <div className="flex flex-col items-center gap-6">
                {/* Progress & Counters */}
                <div className="w-full flex items-center justify-between text-xs font-semibold px-2">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-rose-400">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      Still Learning ({learningIds.size})
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Mastered ({knownIds.size})
                    </span>
                  </div>
                  <div className="text-slate-400">
                    Card <span className="text-white font-bold">{currentIndex + 1}</span> of {deck.cards.length}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400 transition-all duration-300 rounded-full"
                    style={{ width: `${((currentIndex + 1) / deck.cards.length) * 100}%` }}
                  />
                </div>

                {/* 3D Flippable Card */}
                <div
                  className="w-full h-[360px] md:h-[400px] perspective-1000 cursor-pointer select-none"
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  <div
                    className={`w-full h-full relative transform-style-preserve-3d transition-transform duration-500 rounded-3xl shadow-2xl ${
                      isFlipped ? 'rotate-y-180' : ''
                    }`}
                  >
                    {/* Front Side */}
                    <div className="absolute inset-0 backface-hidden w-full h-full rounded-3xl bg-gradient-to-br from-[#121526] via-[#101221] to-[#0A0C16] border border-white/10 p-8 md:p-12 flex flex-col justify-between shadow-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {currentCard.concept_tag}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSpeak(currentCard.term);
                          }}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                          title="Read aloud"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex flex-col items-center justify-center text-center my-auto">
                        <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-3">
                          TERM / CONCEPT
                        </p>
                        <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-snug">
                          {currentCard.term}
                        </h2>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-white/5">
                        <span>Press <kbd className="px-2 py-0.5 rounded bg-white/10 text-slate-300">Space</kbd> or click to flip</span>
                        <span className="flex items-center gap-1 text-indigo-400 font-medium">
                          <RotateCw className="w-3.5 h-3.5" /> Flip Card
                        </span>
                      </div>
                    </div>

                    {/* Back Side */}
                    <div className="absolute inset-0 backface-hidden rotate-y-180 w-full h-full rounded-3xl bg-gradient-to-br from-[#151930] via-[#121427] to-[#0D0F1B] border border-violet-500/30 p-8 md:p-12 flex flex-col justify-between shadow-2xl overflow-y-auto">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">
                          Explanation & Mechanism
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSpeak(currentCard.definition);
                          }}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                          title="Read aloud"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="my-auto space-y-4">
                        <p className="text-sm md:text-base text-slate-200 leading-relaxed">
                          {currentCard.definition}
                        </p>
                        {currentCard.code_example && (
                          <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-emerald-300 overflow-x-auto">
                            <pre>{currentCard.code_example}</pre>
                          </div>
                        )}
                        {currentCard.mnemonic && (
                          <p className="text-xs text-amber-300 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                            💡 <strong>Mnemonic:</strong> {currentCard.mnemonic}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-white/5">
                        <span>Click to flip back</span>
                        <span className="flex items-center gap-1 text-violet-400 font-medium">
                          <RotateCw className="w-3.5 h-3.5" /> Back
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Controls & Active Recall Scoring */}
                <div className="w-full flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={handlePrevCard}
                    className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={markLearning}
                      className="px-5 py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold transition-all cursor-pointer"
                    >
                      Still Learning
                    </button>
                    <button
                      type="button"
                      onClick={markKnown}
                      className="px-5 py-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition-all cursor-pointer"
                    >
                      Mastered (Know It)
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleNextCard}
                    className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* TAB 4: CURRICULUM PROGRESS */}
        {activeTab === 'progress' && (
          <div className="flex flex-col gap-8 animate-in fade-in duration-200">
            <div className="p-8 rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-md">
              <h3 className="font-dala-nav text-xs text-[#9a9a9a] uppercase tracking-wider mb-6">
                Curriculum Topic Mastery
              </h3>
              <ProgressChart progress={studentProgress} />
            </div>

            {/* Course Breakdown */}
            <div className="p-8 rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-md space-y-6">
              <h3 className="font-dala-nav text-xs text-[#9a9a9a] uppercase tracking-wider">
                Enrolled Courses & Academic Telemetry
              </h3>
              <div className="flex flex-col gap-4">
                {[
                  { name: 'CS 401: Cognitive Systems & Diagnostic AI', score: 94, modules: '5/5 completed', grade: 'A+' },
                  { name: 'CS 305: Relational Schema & Database Internals', score: 88, modules: '4/5 completed', grade: 'B+' },
                  { name: 'CS 450: Distributed Systems & Consensus', score: 95, modules: '5/5 completed', grade: 'A+' },
                  { name: 'CS 220: Computer Architecture & Cache Coherence', score: 91, modules: '4/4 completed', grade: 'A' },
                ].map((c, i) => (
                  <div key={i} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-white/15 transition-all">
                    <div>
                      <p className="text-sm font-medium text-white">{c.name}</p>
                      <span className="text-xs text-[#6B6B76]">{c.modules}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-mono font-bold text-[#22D3EE]">{c.score}%</span>
                      <span className="px-2.5 py-1 rounded-lg bg-[#4ADE80]/10 border border-[#4ADE80]/20 text-[#4ADE80] font-mono font-semibold text-xs">
                        {c.grade}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default function StudentHub(props: StudentHubProps) {
  return (
    <Suspense fallback={<LoadingSpinner text="Loading Student Workspace..." />}>
      <StudentHubContent {...props} />
    </Suspense>
  );
}
