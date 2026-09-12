from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal
from datetime import datetime

# Enums
class RoleEnum(str):
    ADMIN = "admin"
    STUDENT = "student"

class StatusEnum(str):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"

# Auth Schemas
class LoginRequest(BaseModel):
    username_or_email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    username: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=6)

# User & Profile Schemas
class ProfileOut(BaseModel):
    full_name: Optional[str] = None
    enrollment_date: Optional[datetime] = None
    program: Optional[str] = None

    class Config:
        from_attributes = True

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    program: Optional[str] = None

class UserOut(BaseModel):
    id: str
    email: str
    username: str
    role: str
    status: str
    last_login_at: Optional[datetime] = None
    created_at: datetime
    profile: Optional[ProfileOut] = None

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=6)
    role: Literal["admin", "student"] = "student"
    full_name: Optional[str] = None
    program: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    program: Optional[str] = None
    status: Optional[Literal["active", "inactive", "suspended"]] = None

class AuditLogOut(BaseModel):
    id: str
    user_id: Optional[str] = None
    action: str
    details: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Dashboard Schemas
class AdminStats(BaseModel):
    total_students: int
    active_users: int
    recent_logins: int

class SystemConfig(BaseModel):
    maintenance_mode: bool = False
    announcement_banner: str = "Welcome to the Academic Portal"
    allow_registrations: bool = True

class StudentProgress(BaseModel):
    courses_enrolled: int
    completed_modules: int
    average_score: float
    grade_letter: str
    upcoming_deadlines: List[dict]

class Announcement(BaseModel):
    id: str
    title: str
    content: str
    published_at: str
    priority: Literal["low", "medium", "high"] = "medium"

# QuizGenius Core Schemas
class DistractorOption(BaseModel):
    id: Literal["A", "B", "C", "D"]
    text: str
    is_correct: bool
    trap_explanation: Optional[str] = None

class ChallengeQuestion(BaseModel):
    id: str
    type: Literal["MCQ", "TRUE_FALSE"] = "MCQ"
    difficulty: int = Field(default=3, ge=1, le=5)
    prompt: str
    code_snippet: Optional[str] = None
    options: List[DistractorOption]
    cognitive_trap_name: str
    cognitive_trap_detail: str
    concept_tag: str
    hint: str
    # RAG Citation Traceability
    source_document: Optional[str] = None
    source_chunks: Optional[List[int]] = None
    is_grounded: Optional[bool] = False

class GenerateQuizRequest(BaseModel):
    topic: str
    num_questions: int = Field(default=5, ge=3, le=50)
    context_text: Optional[str] = None
    subject: Optional[str] = None
    difficulty_level: Optional[Literal["easy", "medium", "hard", "adaptive"]] = None
    question_type: Optional[Literal["MCQ", "TRUE_FALSE"]] = "MCQ"
    time_limit: Optional[int] = None  # minutes, None = no timer
    # RAG parameters
    document_id: Optional[str] = None
    use_rag: Optional[bool] = False
    ai_provider: Optional[Literal["auto", "ollama", "groq"]] = None

class QuizGenerateFromTopicRequest(BaseModel):
    topic: str
    difficulty: Optional[str] = None
    num_questions: int = Field(default=10, ge=1, le=50)

class QuizGenerateFromDocumentResponse(BaseModel):
    questions: List[ChallengeQuestion]
    source_summary: str
    id: Optional[str] = None
    title: Optional[str] = None
    topic: Optional[str] = None
    created_at: Optional[str] = None
    source_document: Optional[str] = None
    is_grounded: Optional[bool] = True

class ChallengeQuiz(BaseModel):
    id: str
    title: str
    topic: str
    questions: List[ChallengeQuestion]
    created_at: str
    source_document: Optional[str] = None
    is_grounded: Optional[bool] = False

class AutopsyRequest(BaseModel):
    question_id: str
    selected_option_id: str
    question_prompt: str
    chosen_text: str
    correct_text: str
    cognitive_trap_name: str
    document_id: Optional[str] = None
    source_document: Optional[str] = None

class AutopsyResponse(BaseModel):
    fallacy_name: str
    mental_model_diagnostic: str
    ten_second_cure: str
    source_reference: Optional[str] = None

# Quiz Results & History Schemas
class QuestionAttempt(BaseModel):
    question_id: str
    selected_option_id: str
    is_correct: bool
    concept_tag: str
    difficulty: int = 3
    time_spent_seconds: Optional[float] = None

class QuizResultSubmission(BaseModel):
    quiz_id: str
    topic: str
    subject: Optional[str] = None
    score: int
    total_questions: int
    correct_count: int
    accuracy: float
    time_taken_seconds: Optional[float] = None
    attempts: List[QuestionAttempt]

class TopicPerformance(BaseModel):
    concept_tag: str
    correct: int
    total: int
    accuracy: float
    mastery_level: Literal["weak", "needs_practice", "good", "mastered"]

class QuizHistoryItem(BaseModel):
    quiz_id: str
    topic: str
    subject: Optional[str] = None
    score: int
    total_questions: int
    correct_count: int
    accuracy: float
    time_taken_seconds: Optional[float] = None
    completed_at: str
    topic_performance: List[TopicPerformance]

class QuizResultResponse(BaseModel):
    message: str
    quiz_id: str
    weak_topics: List[TopicPerformance]

class WeakTopicsResponse(BaseModel):
    weak_topics: List[TopicPerformance]
    total_quizzes: int
    overall_accuracy: float

class DashboardStats(BaseModel):
    quizzes_completed: int
    average_score: float
    total_questions_practiced: int
    overall_accuracy: float
    learning_streak: int
    recent_quizzes: List[QuizHistoryItem]
    weak_topics: List[TopicPerformance]
    subject_mastery: dict

# Study Tools (Quizlet-style AI Tools)
class FlashcardItem(BaseModel):
    id: str
    term: str
    definition: str
    example_or_code: Optional[str] = None
    concept_tag: str
    difficulty: int = 3
    mnemonic: Optional[str] = None

class FlashcardDeck(BaseModel):
    id: str
    title: str
    topic: str
    subject: Optional[str] = None
    card_count: int
    cards: List[FlashcardItem]
    created_at: str

class GenerateFlashcardsRequest(BaseModel):
    topic: str
    notes_text: Optional[str] = None
    subject: Optional[str] = None
    card_count: int = Field(default=8, ge=3, le=30)

class StudyGuideSection(BaseModel):
    heading: str
    summary: str
    key_points: List[str]
    common_pitfalls: List[str]

class StudyGuideResponse(BaseModel):
    id: str
    title: str
    topic: str
    subject: Optional[str] = None
    executive_summary: str
    key_vocabulary: List[dict]  # {"term": str, "definition": str}
    sections: List[StudyGuideSection]
    high_yield_rules: List[str]
    created_at: str

class GenerateStudyGuideRequest(BaseModel):
    topic: str
    notes_text: Optional[str] = None
    subject: Optional[str] = None

class QChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str

class QChatRequest(BaseModel):
    message: str
    topic: Optional[str] = "General Computer Science & Learning"
    history: Optional[List[QChatMessage]] = None
    context_notes: Optional[str] = None

class QChatResponse(BaseModel):
    reply: str
    suggested_followups: List[str]

class StudySetSummary(BaseModel):
    id: str
    title: str
    description: str
    subject: str
    card_count: int
    question_count: int
    difficulty: Literal["Beginner", "Intermediate", "Advanced", "Expert"]
    icon: str
    popular_tags: List[str]

