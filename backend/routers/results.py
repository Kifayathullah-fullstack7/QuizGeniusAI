from fastapi import APIRouter
from typing import List
from datetime import datetime, timezone
from backend.schemas import (
    QuizResultSubmission,
    QuizResultResponse,
    QuizHistoryItem,
    TopicPerformance,
    WeakTopicsResponse,
    DashboardStats
)

router = APIRouter(prefix="/api/results", tags=["Quiz Results & Analytics"])

# In-memory history with initial rich data
_HISTORY: List[QuizHistoryItem] = [
    QuizHistoryItem(
        quiz_id="seed-quiz-1",
        topic="React Hooks & Closures",
        subject="Frontend Engineering",
        score=4,
        total_questions=5,
        correct_count=4,
        accuracy=80.0,
        time_taken_seconds=145.0,
        completed_at=datetime.now(timezone.utc).isoformat(),
        topic_performance=[
            TopicPerformance(concept_tag="React Hooks & Closures", correct=2, total=3, accuracy=66.7, mastery_level="needs_practice"),
            TopicPerformance(concept_tag="State Scheduling", correct=2, total=2, accuracy=100.0, mastery_level="mastered")
        ]
    ),
    QuizHistoryItem(
        quiz_id="seed-quiz-2",
        topic="Python Memory & Concurrency",
        subject="Backend Engineering",
        score=3,
        total_questions=5,
        correct_count=3,
        accuracy=60.0,
        time_taken_seconds=180.0,
        completed_at=datetime.now(timezone.utc).isoformat(),
        topic_performance=[
            TopicPerformance(concept_tag="Python GIL & Threading", correct=1, total=3, accuracy=33.3, mastery_level="weak"),
            TopicPerformance(concept_tag="Parameter Binding", correct=2, total=2, accuracy=100.0, mastery_level="mastered")
        ]
    )
]

def _classify_mastery(accuracy: float) -> str:
    if accuracy >= 90.0:
        return "mastered"
    elif accuracy >= 75.0:
        return "good"
    elif accuracy >= 50.0:
        return "needs_practice"
    else:
        return "weak"

@router.post("", response_model=QuizResultResponse)
async def submit_quiz_results(sub: QuizResultSubmission):
    # Compute concept tag performance from attempts
    topic_map = {}
    for att in sub.attempts:
        tag = att.concept_tag or "General Knowledge"
        if tag not in topic_map:
            topic_map[tag] = {"correct": 0, "total": 0}
        topic_map[tag]["total"] += 1
        if att.is_correct:
            topic_map[tag]["correct"] += 1

    perf_list = []
    weak_list = []
    for tag, stats in topic_map.items():
        acc = round((stats["correct"] / stats["total"]) * 100.0, 1) if stats["total"] > 0 else 0.0
        level = _classify_mastery(acc)
        tp = TopicPerformance(
            concept_tag=tag,
            correct=stats["correct"],
            total=stats["total"],
            accuracy=acc,
            mastery_level=level
        )
        perf_list.append(tp)
        if level in ["weak", "needs_practice"]:
            weak_list.append(tp)

    # Save to history
    item = QuizHistoryItem(
        quiz_id=sub.quiz_id,
        topic=sub.topic,
        subject=sub.subject or "Computer Science",
        score=sub.score,
        total_questions=sub.total_questions,
        correct_count=sub.correct_count,
        accuracy=sub.accuracy,
        time_taken_seconds=sub.time_taken_seconds,
        completed_at=datetime.now(timezone.utc).isoformat(),
        topic_performance=perf_list
    )
    _HISTORY.insert(0, item)

    return QuizResultResponse(
        message="Quiz results registered successfully.",
        quiz_id=sub.quiz_id,
        weak_topics=weak_list
    )

@router.get("/history", response_model=List[QuizHistoryItem])
async def get_quiz_history():
    return _HISTORY

@router.get("/weak-topics", response_model=WeakTopicsResponse)
async def get_weak_topics():
    # Aggregate weak topics across all quizzes
    tag_totals = {}
    for item in _HISTORY:
        for tp in item.topic_performance:
            if tp.concept_tag not in tag_totals:
                tag_totals[tp.concept_tag] = {"correct": 0, "total": 0}
            tag_totals[tp.concept_tag]["correct"] += tp.correct
            tag_totals[tp.concept_tag]["total"] += tp.total

    weak_list = []
    total_q = sum(item.total_questions for item in _HISTORY)
    total_c = sum(item.correct_count for item in _HISTORY)
    overall_acc = round((total_c / total_q * 100.0), 1) if total_q > 0 else 0.0

    for tag, stats in tag_totals.items():
        acc = round((stats["correct"] / stats["total"]) * 100.0, 1) if stats["total"] > 0 else 0.0
        level = _classify_mastery(acc)
        if level in ["weak", "needs_practice"]:
            weak_list.append(TopicPerformance(
                concept_tag=tag,
                correct=stats["correct"],
                total=stats["total"],
                accuracy=acc,
                mastery_level=level
            ))

    return WeakTopicsResponse(
        weak_topics=weak_list,
        total_quizzes=len(_HISTORY),
        overall_accuracy=overall_acc
    )

@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats():
    total_quizzes = len(_HISTORY)
    total_q = sum(item.total_questions for item in _HISTORY)
    total_c = sum(item.correct_count for item in _HISTORY)
    avg_score = round(sum(item.score for item in _HISTORY) / total_quizzes, 1) if total_quizzes > 0 else 0.0
    overall_acc = round((total_c / total_q * 100.0), 1) if total_q > 0 else 0.0

    # Aggregate weak topics
    wt_resp = await get_weak_topics()

    subject_mastery = {
        "Frontend Engineering": 85,
        "Backend & Systems": 72,
        "Algorithms & DSA": 78,
        "Databases": 88,
        "Artificial Intelligence": 92
    }

    return DashboardStats(
        quizzes_completed=total_quizzes,
        average_score=avg_score,
        total_questions_practiced=total_q,
        overall_accuracy=overall_acc,
        learning_streak=7,
        recent_quizzes=_HISTORY[:5],
        weak_topics=wt_resp.weak_topics,
        subject_mastery=subject_mastery
    )
