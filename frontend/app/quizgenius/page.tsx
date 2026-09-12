'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  UploadCloud,
  FileCheck,
  Sparkles,
  FileText,
  ArrowRight,
  ShieldAlert,
  Zap,
  Layers,
  BookOpen,
  Cpu,
  Trash2
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import {
  generateQuiz,
  uploadStudyMaterial,
  pasteStudyMaterial,
  listStudyMaterials,
  deleteStudyMaterial,
  StudyMaterial,
  getAIStatus,
  AIStatus
} from '@/lib/api';

export default function QuizGeniusConfiguratorPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'topic' | 'upload' | 'notes'>('upload');
  const [topic, setTopic] = useState('Python OOP & Design Patterns');
  const [notesText, setNotesText] = useState('');
  const [notesTitle, setNotesTitle] = useState('My Course Notes');
  const [useRAG, setUseRAG] = useState(true);
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'adaptive'>('medium');

  const [uploadedMaterial, setUploadedMaterial] = useState<StudyMaterial | null>(null);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'extracting' | 'indexing' | 'ready' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [materialsList, setMaterialsList] = useState<StudyMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [aiStatus, setAIStatus] = useState<AIStatus | null>(null);

  useEffect(() => {
    listStudyMaterials().then(setMaterialsList).catch(() => {});
    getAIStatus().then(setAIStatus).catch(() => {});
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadState('uploading');

    try {
      setTimeout(() => setUploadState('extracting'), 300);
      setTimeout(() => setUploadState('indexing'), 800);

      const mat = await uploadStudyMaterial(file);
      setUploadedMaterial(mat);
      setUploadState('ready');
      setTopic(mat.filename.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
      setMaterialsList(prev => [mat, ...prev.filter(m => m.document_id !== mat.document_id)]);
    } catch (err: any) {
      setUploadState('error');
      setUploadError(err.message || 'Failed to upload document');
    }
  };

  const handlePasteSubmit = async () => {
    if (!notesText.trim()) return;
    setUploadError(null);
    setUploadState('indexing');

    try {
      const mat = await pasteStudyMaterial(notesTitle, notesText);
      setUploadedMaterial(mat);
      setUploadState('ready');
      setTopic(notesTitle);
      setMaterialsList(prev => [mat, ...prev.filter(m => m.document_id !== mat.document_id)]);
    } catch (err: any) {
      setUploadState('error');
      setUploadError(err.message || 'Failed to index pasted notes');
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsLoading(true);

    try {
      const isRAGActive = Boolean(useRAG && uploadedMaterial);
      const quiz = await generateQuiz({
        topic: topic.trim(),
        num_questions: numQuestions,
        difficulty_level: difficulty,
        document_id: isRAGActive ? uploadedMaterial?.document_id : undefined,
        use_rag: isRAGActive,
      });

      sessionStorage.setItem('current_quiz', JSON.stringify(quiz));
      sessionStorage.setItem('quiz_start_time', Date.now().toString());
      if (isRAGActive && uploadedMaterial) {
        sessionStorage.setItem('rag_source_document', uploadedMaterial.filename);
        sessionStorage.setItem('rag_document_id', uploadedMaterial.document_id);
      } else {
        sessionStorage.removeItem('rag_source_document');
        sessionStorage.removeItem('rag_document_id');
      }

      router.push('/arena');
    } catch (err) {
      console.error(err);
      router.push(`/arena?topic=${encodeURIComponent(topic.trim())}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090E] text-white flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-10 flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <Cpu className="w-3 h-3" />
                Local LLM + RAG Studio
              </span>
              <span className={`text-xs font-semibold ${aiStatus?.badge_type === 'local' ? 'text-emerald-400' : 'text-slate-400'}`}>
                ● {aiStatus?.mode_label || 'Auto Provider'}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">
              QuizGenius AI Configurator
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Upload study documents or paste notes to generate grounded, factually verifiable quizzes.
            </p>
          </div>
        </div>

        {/* Configurator Card */}
        <div className="p-6 md:p-8 rounded-3xl bg-[#11131F]/90 border border-white/10 shadow-2xl space-y-6">
          
          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              Upload Material
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'notes'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText className="w-4 h-4" />
              Paste Notes
            </button>

            <button
              onClick={() => setActiveTab('topic')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'topic'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Topic Prompt
            </button>
          </div>

          <form onSubmit={handleGenerate} className="space-y-6">
            
            {/* TAB: UPLOAD MATERIAL */}
            {activeTab === 'upload' && (
              <div className="space-y-4">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/15 hover:border-indigo-500/50 rounded-2xl p-8 text-center cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] transition-all"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.doc,.txt,.md"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <UploadCloud className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
                  <p className="text-base font-bold text-white mb-1">
                    Select PDF, DOCX, or TXT study material
                  </p>
                  <p className="text-xs text-slate-400">
                    Extracted text will be split into semantic chunks and embedded in ChromaDB
                  </p>
                </div>

                {uploadState === 'uploading' && (
                  <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-center gap-2.5">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                    <span>Uploading...</span>
                  </div>
                )}

                {uploadState === 'extracting' && (
                  <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-center gap-2.5">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                    <span>Extracting content...</span>
                  </div>
                )}

                {uploadState === 'indexing' && (
                  <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 flex items-center gap-2.5">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
                    <span>Indexing study material into ChromaDB...</span>
                  </div>
                )}

                {uploadState === 'error' && uploadError && (
                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {uploadedMaterial && uploadState === 'ready' && (
                  <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileCheck className="w-6 h-6 text-emerald-400" />
                      <div>
                        <p className="text-sm font-bold text-white">✓ Material ready</p>
                        <p className="text-xs text-emerald-300 font-semibold">{uploadedMaterial.filename}</p>
                        <p className="text-[11px] text-slate-400">{uploadedMaterial.chunk_count} semantic chunks indexed</p>
                      </div>
                    </div>
                    <span className="text-xs uppercase font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Active
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* TAB: PASTE NOTES */}
            {activeTab === 'notes' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Title / Subject:
                  </label>
                  <input
                    type="text"
                    value={notesTitle}
                    onChange={(e) => setNotesTitle(e.target.value)}
                    className="w-full bg-[#171A2B] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Paste Lecture or Textbook Notes:
                  </label>
                  <textarea
                    rows={6}
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    placeholder="Paste text notes here..."
                    className="w-full bg-[#171A2B] border border-white/10 rounded-xl p-3.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handlePasteSubmit}
                  disabled={!notesText.trim()}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-colors cursor-pointer disabled:opacity-40"
                >
                  Index Pasted Notes into RAG
                </button>
              </div>
            )}

            {/* TAB: TOPIC PROMPT */}
            {activeTab === 'topic' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Topic Prompt:
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-[#171A2B] border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {/* Target Concept Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Quiz Focus / Concept Name:
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Memory Management, Concurrency, Virtual DOM..."
                className="w-full bg-[#171A2B] border border-white/10 rounded-2xl px-4 py-3 text-xs md:text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Controls: Difficulty & Question Count */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Number of Questions:
                </label>
                <select
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                  className="w-full bg-[#171A2B] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                >
                  <option value={3}>3 Questions</option>
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                  <option value={15}>15 Questions</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Difficulty Level:
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full bg-[#171A2B] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                >
                  <option value="easy">Easy (Foundational)</option>
                  <option value="medium">Medium (Standard Exam)</option>
                  <option value="hard">Hard (Deep Traps)</option>
                  <option value="adaptive">Adaptive (Dynamic Progression)</option>
                </select>
              </div>
            </div>

            {/* RAG Toggle */}
            <div className="p-4 rounded-2xl bg-[#141829] border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Grounded RAG Mode</span>
                <span className="text-[11px] text-slate-400">
                  {uploadedMaterial 
                    ? `Questions will be grounded in ${uploadedMaterial.filename}` 
                    : 'Upload a document above to enable grounded RAG questions'}
                </span>
              </div>
              <button
                type="button"
                disabled={!uploadedMaterial}
                onClick={() => setUseRAG(!useRAG)}
                className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                  useRAG && uploadedMaterial
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-white/5 text-slate-400 border-white/10 opacity-50'
                }`}
              >
                {useRAG && uploadedMaterial ? 'RAG Active' : 'AI Knowledge'}
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Generating Grounded Quiz...
                </>
              ) : (
                <>
                  Generate Quiz from Material
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Previously Indexed Materials List */}
        {materialsList.length > 0 && (
          <div className="p-6 rounded-3xl bg-[#11131F]/80 border border-white/10">
            <h3 className="text-base font-bold text-white mb-3">
              Indexed Study Materials in ChromaDB ({materialsList.length})
            </h3>
            <div className="space-y-2">
              {materialsList.map((m) => (
                <div
                  key={m.document_id}
                  className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    <div>
                      <p className="text-xs font-bold text-white">{m.filename}</p>
                      <p className="text-[10px] text-slate-400">{m.chunk_count} chunks • {m.file_type.toUpperCase()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setUploadedMaterial(m);
                        setUploadState('ready');
                        setTopic(m.filename.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
                        setUseRAG(true);
                      }}
                      className="px-3 py-1 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Use Material
                    </button>
                    <button
                      onClick={async () => {
                        await deleteStudyMaterial(m.document_id);
                        setMaterialsList(prev => prev.filter(x => x.document_id !== m.document_id));
                        if (uploadedMaterial?.document_id === m.document_id) {
                          setUploadedMaterial(null);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
