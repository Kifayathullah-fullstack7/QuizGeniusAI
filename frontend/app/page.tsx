'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  FileText,
  Brain,
  Cpu,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Zap,
  Activity
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { generateQuiz } from '@/lib/api';

interface PresetTopic {
  title: string;
  domain: string;
  desc: string;
}

const PRESET_TOPICS: PresetTopic[] = [
  {
    title: 'React State & Closures',
    domain: 'Frontend',
    desc: 'Batched updates, stale closures, dependency arrays & hooks internals.',
  },
  {
    title: 'Python Memory & GIL Internals',
    domain: 'Backend',
    desc: 'Mutable defaults, refcounts, and thread switching mechanics.',
  },
  {
    title: 'System Design & Distributed Caching',
    domain: 'Architecture',
    desc: 'Cache stampedes, CAP theorem, replication lag & locks.',
  },
  {
    title: 'JavaScript Event Loop & Microtasks',
    domain: 'Core JS',
    desc: 'Call stack execution, task queues & microtask scheduling invariants.',
  },
];

export default function HomePage() {
  const router = useRouter();

  const [topic, setTopic] = useState('React State & Closures');
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number | null>(0);
  const [notesText, setNotesText] = useState('');
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPreset = (index: number, presetTitle: string) => {
    setSelectedPresetIndex(index);
    setTopic(presetTitle);
  };

  const handleTopicChange = (val: string) => {
    setTopic(val);
    const matchedIdx = PRESET_TOPICS.findIndex(
      (p) => p.title.toLowerCase() === val.trim().toLowerCase()
    );
    setSelectedPresetIndex(matchedIdx !== -1 ? matchedIdx : null);
  };

  const handleLaunchChallenge = async (customTopic?: string) => {
    const targetTopic = (customTopic || topic).trim();
    if (!targetTopic) {
      setError('Please enter a topic or select a preset.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const generated = await generateQuiz({
        topic: targetTopic,
        num_questions: numQuestions,
        context_text: notesText.trim() ? notesText.trim() : null,
      });

      sessionStorage.setItem('current_quiz', JSON.stringify(generated));
      sessionStorage.removeItem('rag_document_id');
      sessionStorage.removeItem('rag_source_document');

      router.push('/arena');
    } catch (err: unknown) {
      console.error('Quiz generation failed:', err);
      // Even if network fails, fallback to demo/arena with topic
      router.push(`/arena?topic=${encodeURIComponent(targetTopic)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Compute gradient fill percentage for the slider track
  const sliderPercentage = ((numQuestions - 3) / 7) * 100;

  return (
    <div className="min-h-screen text-[#FFFFFF] flex flex-col selection:bg-[#8052ff] selection:text-white relative">
      <Navbar />

      <main className="flex-1 w-full max-w-[1280px] mx-auto px-6 lg:px-12 py-14 lg:py-24 flex flex-col gap-20 lg:gap-28 relative z-10">
        
        {/* HERO SECTION: Monolithic Display Floating Over Full Galaxy Starfield */}
        <section className="flex flex-col items-center text-center gap-8 pt-4">
          
          {/* Mission / Differentiator Eyebrow */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-[#11131E]/70 backdrop-blur-md text-[11px] font-semibold tracking-[0.14em] text-[#ffb829] uppercase shadow-[0_0_15px_rgba(255,184,41,0.2)]">
            <Sparkles className="w-3.5 h-3.5 text-[#ffb829]" />
            <span>The only quiz engine powered by Distractor Forensics</span>
          </div>

          {/* Monolithic Display Headline */}
          <h1 className="font-display-hero text-white tracking-tight max-w-4xl">
            The quiz that tells you<br />
            <span className="bg-gradient-to-r from-[#8052ff] via-[#c084fc] to-[#38BDF8] bg-clip-text text-transparent">
              why your brain
            </span><br />
            got it <span className="text-[#F472B6]">wrong.</span>
          </h1>

          {/* Ultra-refined narrative copy */}
          <p className="text-[17px] sm:text-[19px] text-[#bdbdbd] font-light leading-[1.65] max-w-2xl">
            QuizGenius diagnoses the specific cognitive misconception behind every mistake,
            uncovers mental model blindspots in real time, and dynamically calibrates the next challenge
            to reinforce foundational invariants.
          </p>

          {/* Action Row: Primary Electric Pill + Secondary Link */}
          <div className="flex flex-wrap items-center justify-center gap-5 pt-2">
            <button
              type="button"
              onClick={() => handleLaunchChallenge()}
              disabled={isLoading}
              className="btn-electric-pill text-[13px] px-8 py-4"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Synthesizing...</span>
                </div>
              ) : (
                <span>Enter Challenge Arena →</span>
              )}
            </button>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-[13px] font-semibold tracking-[0.08em] text-[#9a9a9a] hover:text-[#ffffff] uppercase transition-colors py-3 px-4 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-sm hover:border-white/20"
            >
              <span>Explore Learning DNA</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>

        {/* INGESTION & CHALLENGE STUDIO PANEL */}
        <section className="w-full max-w-3xl mx-auto flex flex-col gap-8">
          
          <div className="text-center flex flex-col items-center gap-2">
            <span className="micro-label text-[#8052ff]">
              COGNITIVE WORKSPACE
            </span>
            <h2 className="text-2xl sm:text-3xl font-normal text-white tracking-tight">
              Select your topic or paste your syllabus.
            </h2>
            <p className="text-sm text-[#9a9a9a] font-light max-w-lg">
              Launch targeted challenges from curated architectural domains or inject your custom materials for source-grounded diagnostic telemetry.
            </p>
          </div>

          {/* Main Glassmorphic Ingestion Card Floating on the Galaxy Starfield */}
          <div className="glass-panel rounded-2xl p-6 sm:p-8 flex flex-col gap-6 shadow-[0_8px_40px_rgba(0,0,0,0.6)] bg-[rgba(17,19,30,0.7)] backdrop-blur-[20px] border border-white/[0.1]">
            
            {/* 1. Preset Topics Grid */}
            <div className="flex flex-col gap-3">
              <label className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B6B76]">
                CHOOSE A PRESET TOPIC OR ENTER YOUR OWN
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {PRESET_TOPICS.map((preset, idx) => {
                  const isSelected = selectedPresetIndex === idx;
                  return (
                    <button
                      key={preset.title}
                      type="button"
                      onClick={() => handleSelectPreset(idx, preset.title)}
                      className={`text-left p-4 rounded-xl transition-all duration-200 cursor-pointer flex flex-col gap-1.5 ${
                        isSelected
                          ? 'border border-[#8052ff] bg-[#8052ff]/[0.12] shadow-[0_0_25px_rgba(128,82,255,0.2)]'
                          : 'border border-white/[0.08] bg-[#08090E]/50 hover:border-white/[0.18]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[14px] font-medium text-[#FFFFFF]">
                          {preset.title}
                        </span>
                        <span className="text-[10px] font-mono uppercase text-[#6B6B76] border border-white/[0.08] px-2 py-0.5 rounded-full shrink-0">
                          {preset.domain}
                        </span>
                      </div>
                      <p className="text-[13px] text-[#9A9AA6] leading-normal line-clamp-2">
                        {preset.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Labeled Input Field */}
            <div className="flex flex-col gap-2 pt-2">
              <label className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#8052ff]">
                TOPIC / SKILL DOMAIN
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => handleTopicChange(e.target.value)}
                  placeholder="e.g. Distributed Consensus, Python Generators, Cache Coherence..."
                  className="w-full bg-[#08090E]/70 border border-white/[0.08] focus:border-[#8052ff] rounded-xl px-4 py-3 text-[14px] text-[#FFFFFF] placeholder:text-[#9A9AA6] focus:outline-none transition-colors pr-10 font-mono"
                />
                <div className="absolute right-3.5 text-[#8052ff] text-[13px] pointer-events-none select-none">
                  ◆
                </div>
              </div>
            </div>

            {/* 3. Ingestion Textarea */}
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B6B76]">
                  <FileText className="w-3.5 h-3.5 text-[#6B6B76]" />
                  <span>PASTE CUSTOM NOTES OR DOCUMENTATION (OPTIONAL)</span>
                </label>
                <span className="text-[11px] font-mono text-[#6B6B76]">
                  {notesText.length} chars
                </span>
              </div>
              <textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                rows={3}
                placeholder="Paste raw lecture notes, architecture documentation, or code snippets here. The AI will extract core concepts, detect common mental traps, and generate targeted diagnostic questions directly from your material..."
                className="w-full bg-[#08090E]/70 border border-white/[0.08] focus:border-[#8052ff] rounded-xl p-3.5 text-[13px] text-[#FFFFFF] placeholder:text-[#9A9AA6] focus:outline-none transition-colors resize-y leading-relaxed font-mono"
              />
            </div>

            {/* 4. Range Slider with Ticks */}
            <div className="flex flex-col gap-3 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B6B76]">
                  QUESTION COUNT
                </label>
                <span className="text-[11px] font-medium text-[#8052ff] border border-[#8052ff]/30 bg-[#8052ff]/10 px-2.5 py-0.5 rounded-full font-mono">
                  {numQuestions} Questions
                </span>
              </div>

              {/* Slider with dynamic gradient track */}
              <div className="relative pt-1 pb-1">
                <input
                  type="range"
                  min="3"
                  max="10"
                  step="1"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(parseInt(e.target.value, 10))}
                  style={{
                    background: `linear-gradient(to right, #8052ff 0%, #38BDF8 ${sliderPercentage}%, rgba(255,255,255,0.12) ${sliderPercentage}%, rgba(255,255,255,0.12) 100%)`
                  }}
                  className="quizgenius-slider w-full"
                />
              </div>

              {/* Ticks */}
              <div className="flex items-center justify-between text-[12px] text-[#6B6B76] font-medium">
                <button
                  type="button"
                  onClick={() => setNumQuestions(3)}
                  className={`transition-colors hover:text-[#FFFFFF] cursor-pointer ${numQuestions === 3 ? 'text-[#8052ff]' : ''}`}
                >
                  3 (Speed Blitz)
                </button>
                <button
                  type="button"
                  onClick={() => setNumQuestions(5)}
                  className={`transition-colors hover:text-[#FFFFFF] cursor-pointer ${numQuestions === 5 ? 'text-[#8052ff]' : ''}`}
                >
                  5 (Standard)
                </button>
                <button
                  type="button"
                  onClick={() => setNumQuestions(10)}
                  className={`transition-colors hover:text-[#FFFFFF] cursor-pointer ${numQuestions === 10 ? 'text-[#8052ff]' : ''}`}
                >
                  10 (Deep Mastery)
                </button>
              </div>
            </div>

            {error && (
              <div className="text-[12px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-xl">
                {error}
              </div>
            )}

            {/* Launch Action */}
            <div className="pt-3">
              <button
                type="button"
                onClick={() => handleLaunchChallenge()}
                disabled={isLoading}
                className="btn-primary-gradient"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Synthesizing Cognitive Traps...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 font-semibold">
                    <span>Launch Challenge Arena</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </button>
            </div>

          </div>
        </section>

        {/* 3. Three Feature Highlight Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl mx-auto w-full">
          
          {/* Card 1: Cognitive Autopsies */}
          <div className="glass-panel rounded-xl p-5 flex flex-col gap-2.5 bg-[rgba(17,19,30,0.6)] backdrop-blur-md">
            <div className="w-8 h-8 rounded-lg bg-[#F472B6]/15 border border-[#F472B6]/30 flex items-center justify-center text-[#F472B6]">
              <Brain className="w-4 h-4" />
            </div>
            <h3 className="text-[15px] font-medium text-white">
              Cognitive Autopsies
            </h3>
            <p className="text-[13px] text-[#9A9AA6] leading-relaxed">
              Pinpoints the exact conceptual fallacy behind mistakes, not just an incorrect mark.
            </p>
          </div>

          {/* Card 2: Groq LPU Inference */}
          <div className="glass-panel rounded-xl p-5 flex flex-col gap-2.5 bg-[rgba(17,19,30,0.6)] backdrop-blur-md">
            <div className="w-8 h-8 rounded-lg bg-[#22D3EE]/15 border border-[#22D3EE]/30 flex items-center justify-center text-[#22D3EE]">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="text-[15px] font-medium text-white">
              Groq LPU Inference
            </h3>
            <p className="text-[13px] text-[#9A9AA6] leading-relaxed">
              Sub-second response streaming powered by Groq LPUs for conversational-speed feedback.
            </p>
          </div>

          {/* Card 3: Self-Healing Engine */}
          <div className="glass-panel rounded-xl p-5 flex flex-col gap-2.5 bg-[rgba(17,19,30,0.6)] backdrop-blur-md">
            <div className="w-8 h-8 rounded-lg bg-[#FBBF24]/15 border border-[#FBBF24]/30 flex items-center justify-center text-[#FBBF24]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-[15px] font-medium text-white">
              Self-Healing Engine
            </h3>
            <p className="text-[13px] text-[#9A9AA6] leading-relaxed">
              Autonomous resilience layer guarantees zero downtime even if upstream APIs fail.
            </p>
          </div>

        </section>

      </main>
    </div>
  );
}
