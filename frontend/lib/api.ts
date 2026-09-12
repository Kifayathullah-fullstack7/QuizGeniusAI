// Frontend API Client for QuizGenius AI
// Self-healing fallback in backend ensures high-availability and zero client-side fallback clutter.

export interface DistractorOption {
  id: 'A' | 'B' | 'C' | 'D';
  text: string;
  is_correct: boolean;
  trap_explanation?: string | null;
}

export interface ChallengeQuestion {
  id: string;
  type: 'MCQ' | 'TRUE_FALSE';
  difficulty: number;
  prompt: string;
  code_snippet?: string | null;
  options: DistractorOption[];
  cognitive_trap_name: string;
  cognitive_trap_detail: string;
  concept_tag: string;
  hint: string;
  source_document?: string | null;
  source_chunks?: number[] | null;
  is_grounded?: boolean;
}

export interface GenerateQuizRequest {
  topic: string;
  num_questions?: number;
  context_text?: string | null;
  subject?: string | null;
  difficulty_level?: 'easy' | 'medium' | 'hard' | 'adaptive';
  question_type?: 'MCQ' | 'TRUE_FALSE';
  time_limit?: number | null;
  document_id?: string | null;
  use_rag?: boolean;
  ai_provider?: 'auto' | 'ollama' | 'groq';
}

export interface ChallengeQuiz {
  id: string;
  title: string;
  topic: string;
  questions: ChallengeQuestion[];
  created_at: string;
  source_document?: string | null;
  is_grounded?: boolean;
}

export interface AutopsyRequest {
  question_id: string;
  selected_option_id: string;
  question_prompt: string;
  chosen_text: string;
  correct_text: string;
  cognitive_trap_name: string;
  document_id?: string | null;
  source_document?: string | null;
}

export interface AutopsyResponse {
  fallacy_name: string;
  mental_model_diagnostic: string;
  ten_second_cure: string;
  source_reference?: string | null;
}

// Flashcard types
export interface FlashcardItem {
  id: string;
  term: string;
  definition: string;
  example_or_code?: string | null;
  concept_tag: string;
  difficulty: number;
  mnemonic?: string | null;
}

export interface FlashcardDeck {
  id: string;
  title: string;
  topic: string;
  subject?: string | null;
  card_count: number;
  cards: FlashcardItem[];
  created_at: string;
}

export interface GenerateFlashcardsRequest {
  topic: string;
  notes_text?: string | null;
  subject?: string | null;
  card_count?: number;
}

// Study Guide types
export interface StudyGuideSection {
  heading: string;
  summary: string;
  key_points: string[];
  common_pitfalls: string[];
}

export interface StudyGuideResponse {
  id: string;
  title: string;
  topic: string;
  subject?: string | null;
  executive_summary: string;
  key_vocabulary: Array<{ term: string; definition: string }>;
  sections: StudyGuideSection[];
  high_yield_rules: string[];
  created_at: string;
}

export interface GenerateStudyGuideRequest {
  topic: string;
  notes_text?: string | null;
  subject?: string | null;
}

// Q-Chat types
export interface QChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface QChatRequest {
  message: string;
  topic?: string;
  history?: QChatMessage[];
  context_notes?: string | null;
}

export interface QChatResponse {
  reply: string;
  suggested_followups: string[];
}

// Study Set Summary
export interface StudySetSummary {
  id: string;
  title: string;
  description: string;
  subject: string;
  card_count: number;
  question_count: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  icon: string;
  popular_tags: string[];
}

// Study Material (RAG)
export interface StudyMaterial {
  document_id: string;
  filename: string;
  file_type: string;
  page_count: number;
  char_count: number;
  chunk_count: number;
  created_at: string;
  sample_snippet?: string;
  already_indexed: boolean;
  message: string;
}

// AI Status
export interface AIStatus {
  configured_mode: string;
  active_provider: string;
  mode_label: string;
  badge_type: 'local' | 'cloud' | 'demo';
  ollama_available: boolean;
  ollama_model?: string;
  groq_available: boolean;
  groq_model?: string;
}

// Results & Dashboard types
export interface QuestionAttempt {
  question_id: string;
  selected_option_id: string;
  is_correct: boolean;
  concept_tag: string;
  difficulty: number;
  time_spent_seconds?: number | null;
}

export interface QuizResultSubmission {
  quiz_id: string;
  topic: string;
  subject?: string | null;
  score: number;
  total_questions: number;
  correct_count: number;
  accuracy: number;
  time_taken_seconds?: number | null;
  attempts: QuestionAttempt[];
}

export interface TopicPerformance {
  concept_tag: string;
  correct: number;
  total: number;
  accuracy: number;
  mastery_level: 'weak' | 'needs_practice' | 'good' | 'mastered';
}

export interface QuizHistoryItem {
  quiz_id: string;
  topic: string;
  subject?: string | null;
  score: number;
  total_questions: number;
  correct_count: number;
  accuracy: number;
  time_taken_seconds?: number | null;
  completed_at: string;
  topic_performance: TopicPerformance[];
}

export interface DashboardStats {
  quizzes_completed: number;
  average_score: number;
  total_questions_practiced: number;
  overall_accuracy: number;
  learning_streak: number;
  recent_quizzes: QuizHistoryItem[];
  weak_topics: TopicPerformance[];
  subject_mastery: Record<string, number>;
}

export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return `http://${host}:8000`;
    }
  }
  return 'http://localhost:8000';
}


const API_BASE_URL = getApiBaseUrl();

export async function generateQuiz(req: GenerateQuizRequest): Promise<ChallengeQuiz> {
  const res = await fetch(`${API_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic: req.topic,
      num_questions: req.num_questions || 5,
      context_text: req.context_text || null,
      subject: req.subject || null,
      difficulty_level: req.difficulty_level || 'medium',
      question_type: req.question_type || 'MCQ',
      time_limit: req.time_limit || null,
      document_id: req.document_id || null,
      use_rag: req.use_rag || false,
      ai_provider: req.ai_provider || null,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => 'Unknown error');
    throw new Error(`Failed to generate quiz: ${res.status} ${errText}`);
  }

  return await res.json();
}

export async function generateQuizFromDocument(
  file: File,
  numQuestions: number = 5,
  difficulty?: string
): Promise<ChallengeQuiz & { source_summary?: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('num_questions', numQuestions.toString());
  if (difficulty) {
    formData.append('difficulty', difficulty);
  }

  const res = await fetch(`${getApiBaseUrl()}/quiz/generate-from-document`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    let errorDetail = 'Failed to generate quiz from document';
    try {
      const errJson = await res.json();
      if (errJson.detail) {
        errorDetail = errJson.detail;
      }
    } catch {
      const errText = await res.text().catch(() => '');
      if (errText) errorDetail = errText;
    }
    throw new Error(errorDetail);
  }

  return await res.json();
}


export async function performAutopsy(req: AutopsyRequest): Promise<AutopsyResponse> {
  const res = await fetch(`${API_BASE_URL}/api/autopsy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => 'Unknown error');
    throw new Error(`Failed to perform autopsy: ${res.status} ${errText}`);
  }

  return await res.json();
}

export async function checkBackendHealth(): Promise<{ status: string; engine?: string }> {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) {
    throw new Error(`Backend unhealthy (${res.status})`);
  }
  return await res.json();
}

export async function getAIStatus(): Promise<AIStatus> {
  const res = await fetch(`${API_BASE_URL}/api/system/ai-status`);
  if (!res.ok) {
    return {
      configured_mode: 'auto',
      active_provider: 'fallback',
      mode_label: 'Demo Mode',
      badge_type: 'demo',
      ollama_available: false,
      groq_available: false,
    };
  }
  return await res.json();
}

export async function uploadStudyMaterial(file: File): Promise<StudyMaterial> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE_URL}/api/materials/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(err.detail || 'Upload failed');
  }
  return await res.json();
}

export async function pasteStudyMaterial(title: string, text: string): Promise<StudyMaterial> {
  const res = await fetch(`${API_BASE_URL}/api/materials/paste`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, text }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to index notes' }));
    throw new Error(err.detail || 'Failed to index notes');
  }
  return await res.json();
}

export async function listStudyMaterials(): Promise<StudyMaterial[]> {
  const res = await fetch(`${API_BASE_URL}/api/materials`);
  if (!res.ok) return [];
  return await res.json();
}

export async function deleteStudyMaterial(documentId: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/materials/${documentId}`, {
    method: 'DELETE',
  });
  return await res.json();
}

export async function generateSimilarQuestion(req: {
  topic: string;
  original_question: string;
  difficulty?: number;
  document_id?: string;
}): Promise<ChallengeQuestion> {
  const res = await fetch(`${API_BASE_URL}/api/quiz/similar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error('Failed to generate similar question');
  return await res.json();
}

export async function getStudySets(): Promise<StudySetSummary[]> {
  const res = await fetch(`${API_BASE_URL}/api/study/sets`);
  if (!res.ok) throw new Error('Failed to fetch study sets');
  return await res.json();
}

export async function generateFlashcards(req: GenerateFlashcardsRequest): Promise<FlashcardDeck> {
  const res = await fetch(`${API_BASE_URL}/api/study/flashcards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error('Failed to generate flashcards');
  return await res.json();
}

export async function generateStudyGuide(req: GenerateStudyGuideRequest): Promise<StudyGuideResponse> {
  const res = await fetch(`${API_BASE_URL}/api/study/guide`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error('Failed to generate study guide');
  return await res.json();
}

export async function sendQChatMessage(req: QChatRequest): Promise<QChatResponse> {
  const res = await fetch(`${API_BASE_URL}/api/study/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error('Failed to communicate with Q-Chat');
  return await res.json();
}

export async function submitQuizResults(sub: QuizResultSubmission): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/results`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sub),
  });
  if (!res.ok) throw new Error('Failed to record quiz results');
  return await res.json();
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE_URL}/api/results/dashboard`);
  if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
  return await res.json();
}
