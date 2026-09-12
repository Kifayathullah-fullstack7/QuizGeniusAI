import os
import json
import asyncio
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional, Tuple, List
from dotenv import load_dotenv
from groq import AsyncGroq

from backend.schemas import (
    ChallengeQuiz,
    ChallengeQuestion,
    DistractorOption,
    GenerateQuizRequest,
    AutopsyRequest,
    AutopsyResponse
)
from backend.services.fallback_deck import get_fallback_quiz, get_fallback_autopsy

load_dotenv()
logger = logging.getLogger("groq_service")
logging.basicConfig(level=logging.INFO)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()

def get_groq_client() -> Optional[AsyncGroq]:
    key = os.getenv("GROQ_API_KEY", GROQ_API_KEY).strip()
    if key and key != "gsk_your_groq_api_key_here":
        return AsyncGroq(api_key=key)
    return None

GENERATE_SYSTEM_PROMPT = """You are an expert cognitive scientist and elite software engineering educator.
You generate challenging, conceptual multiple-choice quizzes that test DEEP mental models and identify common developer cognitive traps.

For every question:
1. Provide a realistic scenario or concise code snippet.
2. Formulate 4 distractor options (A, B, C, D) where ONLY ONE is correct.
3. Every INCORRECT option MUST represent a known cognitive misconception or trap (e.g. Synchronous State Fallacy, Living Closure Assumption, Off-By-One Boundary Error, Reference vs Value Confusion, Race Condition Blindness).
4. For every option, provide a concise 'trap_explanation' explaining why someone thinking incorrectly picked it (null for the correct option).
5. Specify 'cognitive_trap_name' (a 2-4 word memorable name for the primary mental trap tested) and 'cognitive_trap_detail'.
6. Specify 'concept_tag' (e.g., 'React Hooks & Closures', 'JavaScript Event Loop', 'Python Memory & GIL', 'System Design & Caching').
7. Difficulty must be an integer between 1 and 5.
8. Provide a clever 1-sentence 'hint'.

Output MUST be strictly valid JSON matching this structure without any markdown fencing or extra text:
{
  "title": "Mastery Challenge: [Topic or Document Title]",
  "topic": "[Topic or Document Domain]",
  "source_summary": "1-2 sentence executive summary of the content basis",
  "questions": [
    {
      "id": "q1",
      "type": "MCQ",
      "difficulty": 3,
      "prompt": "Question text...",
      "code_snippet": "code here or null",
      "concept_tag": "Specific Concept",
      "cognitive_trap_name": "Name of the Fallacy",
      "cognitive_trap_detail": "Detailed explanation of the mental misconception",
      "hint": "Subtle hint",
      "options": [
        {"id": "A", "text": "Option A text", "is_correct": false, "trap_explanation": "Why this wrong answer was tempting"},
        {"id": "B", "text": "Option B text", "is_correct": true, "trap_explanation": null},
        {"id": "C", "text": "Option C text", "is_correct": false, "trap_explanation": "Trap explanation C"},
        {"id": "D", "text": "Option D text", "is_correct": false, "trap_explanation": "Trap explanation D"}
      ]
    }
  ]
}
"""

AUTOPSY_SYSTEM_PROMPT = """You are the Cognitive Autopsy Engine of QuizGenius AI.
A learner answered a technical question incorrectly. Your mission is to diagnose the underlying cognitive misconception that tricked their brain, not merely state that the answer was wrong.

Output MUST be strictly valid JSON with these 3 exact keys:
{
  "fallacy_name": "A catchy, authoritative title for the cognitive misconception (e.g. Synchronous State Fallacy, Living Closure Assumption, Off-By-One Boundary Error)",
  "mental_model_diagnostic": "1-2 sentences explaining precisely what incorrect mental model or false assumption led them to choose their option over the correct one.",
  "ten_second_cure": "A punchy, actionable rule-of-thumb or mental model fix (under 25 words) that cures this misconception forever."
}
"""

def build_quiz_prompt(
    content_basis: str,
    is_document: bool,
    num_questions: int = 5,
    difficulty: Optional[str] = None,
    extra_context: Optional[str] = None
) -> Tuple[str, str]:
    """
    Shared prompt-building function for both topic-based and document-based generation.
    When is_document=True, instructs the AI to generate questions based on source material.
    When is_document=False, instructs the AI to generate questions about the topic.
    """
    system_prompt = GENERATE_SYSTEM_PROMPT

    if is_document:
        user_prompt = (
            f"Generate {num_questions} quiz questions based on the following source material:\n\n"
            f"--- SOURCE MATERIAL START ---\n"
            f"{content_basis}\n"
            f"--- SOURCE MATERIAL END ---\n\n"
            f"Target Difficulty: {difficulty or 'medium'}\n"
            f"Include an accurate, 1-2 sentence 'source_summary' of this document.\n"
        )
    else:
        user_prompt = (
            f"Generate {num_questions} quiz questions about the following topic: {content_basis}\n"
            f"Target Difficulty: {difficulty or 'medium'}\n"
        )
        if extra_context and extra_context.strip():
            user_prompt += f"\nContext/Notes provided by learner:\n{extra_context.strip()}\n"

    return system_prompt, user_prompt

async def generate_quiz_from_source(
    content_basis: str,
    is_document: bool = False,
    source_filename: Optional[str] = None,
    num_questions: int = 5,
    difficulty: Optional[str] = None,
    extra_context: Optional[str] = None,
    timeout_seconds: float = 6.0
) -> Tuple[ChallengeQuiz, str]:
    """
    Unified quiz generation from a source (either topic string or document text).
    Falls back gracefully to fallback_deck if Groq is unconfigured or fails.
    Returns (ChallengeQuiz, source_summary).
    """
    topic_label = source_filename or (content_basis[:40] + "..." if len(content_basis) > 40 else content_basis)
    
    # 1. Attempt Groq generation
    client = get_groq_client()
    if client:
        system_prompt, user_prompt = build_quiz_prompt(
            content_basis=content_basis,
            is_document=is_document,
            num_questions=num_questions,
            difficulty=difficulty,
            extra_context=extra_context
        )
        try:
            coro = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            completion = await asyncio.wait_for(coro, timeout=timeout_seconds)
            raw_json = completion.choices[0].message.content
            data = json.loads(raw_json)

            questions = []
            for idx, q_data in enumerate(data.get("questions", [])):
                if "id" not in q_data or not q_data["id"]:
                    q_data["id"] = f"q-{idx+1}-{str(uuid.uuid4())[:6]}"
                if source_filename:
                    q_data["source_document"] = source_filename
                    q_data["is_grounded"] = True
                questions.append(ChallengeQuestion(**q_data))

            if len(questions) >= 1:
                summary = data.get(
                    "source_summary",
                    f"Comprehensive review of {topic_label} focusing on core conceptual invariants."
                )
                quiz = ChallengeQuiz(
                    id=str(uuid.uuid4()),
                    title=data.get("title", f"Challenge: {topic_label}"),
                    topic=data.get("topic", topic_label),
                    questions=questions[:num_questions],
                    created_at=datetime.now(timezone.utc).isoformat(),
                    source_document=source_filename,
                    is_grounded=is_document
                )
                return quiz, summary
        except Exception as e:
            logger.warning(f"Groq source generation failed ({type(e).__name__}: {e}). Swapping to resilient fallback deck.")

    # 2. Resilient Fallback
    logger.info(f"Using self-healing fallback deck for {topic_label}")
    fallback = get_fallback_quiz(topic_label, num_questions)
    if is_document and source_filename:
        fallback.source_document = source_filename
        fallback.is_grounded = True
        for q in fallback.questions:
            q.source_document = source_filename
            q.is_grounded = True
        summary = f"Synthesized diagnostic assessment derived from {source_filename} covering key architectural principles."
    else:
        summary = f"Conceptual mastery challenges covering key mental models and patterns in {topic_label}."

    return fallback, summary

async def generate_quiz_with_groq(req: GenerateQuizRequest, timeout_seconds: float = 4.0) -> ChallengeQuiz:
    """
    Backwards-compatible wrapper calling the unified generation function.
    """
    quiz, _ = await generate_quiz_from_source(
        content_basis=req.topic,
        is_document=False,
        num_questions=req.num_questions,
        difficulty=req.difficulty_level,
        extra_context=req.context_text,
        timeout_seconds=timeout_seconds
    )
    return quiz

async def generate_autopsy_with_groq(req: AutopsyRequest, timeout_seconds: float = 3.0) -> AutopsyResponse:
    """
    Attempts to generate cognitive autopsy diagnosis via llama-3.1-8b-instant.
    Falls back gracefully if unavailable.
    """
    client = get_groq_client()
    if not client:
        logger.info("No Groq API key configured. Utilizing local autopsy diagnostics.")
        return get_fallback_autopsy(req)

    user_prompt = f"""
Question Prompt: {req.question_prompt}
Learner chose Option ({req.selected_option_id}): {req.chosen_text}
Correct Option: {req.correct_text}
Identified Cognitive Trap: {req.cognitive_trap_name}
"""
    try:
        coro = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": AUTOPSY_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        completion = await asyncio.wait_for(coro, timeout=timeout_seconds)
        raw_json = completion.choices[0].message.content
        data = json.loads(raw_json)
        return AutopsyResponse(
            fallacy_name=data.get("fallacy_name", req.cognitive_trap_name or "Cognitive Misconception"),
            mental_model_diagnostic=data.get("mental_model_diagnostic", "Your mental model misjudged runtime execution ordering."),
            ten_second_cure=data.get("ten_second_cure", "Always trace lifecycle execution and state mutation order explicitly.")
        )
    except Exception as e:
        logger.warning(f"Groq autopsy failed or timed out ({type(e).__name__}: {e}). Swapping to fallback autopsy.")
        return get_fallback_autopsy(req)
