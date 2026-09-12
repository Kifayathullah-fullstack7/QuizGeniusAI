import os
import json
import uuid
import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional, List
from groq import AsyncGroq

from backend.schemas import (
    ChallengeQuiz,
    ChallengeQuestion,
    DistractorOption,
    GenerateQuizRequest,
    AutopsyRequest,
    AutopsyResponse
)
from backend.services.ai.base import (
    BaseAIProvider,
    GROUNDED_QUIZ_SYSTEM_PROMPT,
    GENERIC_QUIZ_SYSTEM_PROMPT,
    AUTOPSY_SYSTEM_PROMPT
)

logger = logging.getLogger("ai.groq")

DEFAULT_GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

class GroqProvider(BaseAIProvider):
    name: str = "groq"

    def __init__(self, api_key: Optional[str] = None, model: str = DEFAULT_GROQ_MODEL):
        self.api_key = (api_key or os.getenv("GROQ_API_KEY", "")).strip()
        self.model = model
        self.client = None
        if self.api_key and self.api_key != "gsk_your_groq_api_key_here":
            self.client = AsyncGroq(api_key=self.api_key)

    async def is_available(self) -> bool:
        return self.client is not None

    async def generate_quiz(
        self,
        req: GenerateQuizRequest,
        retrieved_context: Optional[str] = None,
        source_document: Optional[str] = None,
        source_chunks: Optional[List[int]] = None
    ) -> ChallengeQuiz:
        if not self.client:
            raise RuntimeError("Groq API key not configured.")

        is_grounded = bool(retrieved_context and retrieved_context.strip())
        system_prompt = GROUNDED_QUIZ_SYSTEM_PROMPT if is_grounded else GENERIC_QUIZ_SYSTEM_PROMPT

        user_prompt = f"""Topic: {req.topic}
Number of Questions: {req.num_questions}
Difficulty: {req.difficulty_level or 'medium'}
Question Type: {req.question_type or 'MCQ'}
"""
        if is_grounded:
            user_prompt += f"\n=== RETRIEVED STUDY MATERIAL CONTEXT ===\n{retrieved_context}\n=======================================\n"
        elif req.context_text:
            user_prompt += f"\nAdditional Context:\n{req.context_text}\n"

        user_prompt += "\nOutput JSON strictly matching schema."

        chat_completion = await asyncio.wait_for(
            self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.3
            ),
            timeout=5.0
        )

        raw = json.loads(chat_completion.choices[0].message.content)
        questions = []
        for i, q in enumerate(raw.get("questions", [])):
            opts = [
                DistractorOption(
                    id=opt["id"],
                    text=opt["text"],
                    is_correct=opt.get("is_correct", False),
                    trap_explanation=opt.get("trap_explanation")
                )
                for opt in q.get("options", [])
            ]
            questions.append(ChallengeQuestion(
                id=q.get("id", f"q{i+1}"),
                type=q.get("type", "MCQ"),
                difficulty=int(q.get("difficulty", 3)),
                prompt=q.get("prompt", ""),
                code_snippet=q.get("code_snippet"),
                options=opts,
                cognitive_trap_name=q.get("cognitive_trap_name", "Cognitive Trap"),
                cognitive_trap_detail=q.get("cognitive_trap_detail", ""),
                concept_tag=q.get("concept_tag", req.topic),
                hint=q.get("hint", "Analyze the premises."),
                source_document=source_document if is_grounded else None,
                source_chunks=source_chunks if is_grounded else None,
                is_grounded=is_grounded
            ))

        return ChallengeQuiz(
            id=str(uuid.uuid4()),
            title=raw.get("title", f"Grounded Quiz: {req.topic}" if is_grounded else f"Mastery Challenge: {req.topic}"),
            topic=req.topic,
            questions=questions,
            created_at=datetime.now(timezone.utc).isoformat(),
            source_document=source_document if is_grounded else None,
            is_grounded=is_grounded
        )

    async def analyze_mistake(
        self,
        req: AutopsyRequest,
        retrieved_context: Optional[str] = None
    ) -> AutopsyResponse:
        if not self.client:
            raise RuntimeError("Groq API key not configured.")

        prompt = f"""Question: {req.question_prompt}
Student Selected (WRONG): {req.chosen_text}
Correct Answer: {req.correct_text}
Cognitive Trap Tag: {req.cognitive_trap_name}
"""
        if retrieved_context and retrieved_context.strip():
            prompt += f"\n=== GROUNDED STUDY CONTEXT FROM STUDENT MATERIAL ===\n{retrieved_context}\n"

        prompt += "\nDiagnose in JSON."

        chat_completion = await asyncio.wait_for(
            self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": AUTOPSY_SYSTEM_PROMPT},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.3
            ),
            timeout=4.0
        )

        raw = json.loads(chat_completion.choices[0].message.content)
        return AutopsyResponse(
            fallacy_name=raw.get("fallacy_name", req.cognitive_trap_name or "Cognitive Misconception"),
            mental_model_diagnostic=raw.get("mental_model_diagnostic", "You misapplied the underlying logic."),
            ten_second_cure=raw.get("ten_second_cure", "Always check the invariants first."),
            source_reference=f"Grounding: {req.source_document}" if req.source_document else None
        )

    async def generate_similar_question(
        self,
        topic: str,
        original_question: str,
        difficulty: int,
        retrieved_context: Optional[str] = None
    ) -> ChallengeQuestion:
        if not self.client:
            raise RuntimeError("Groq API key not configured.")

        prompt = f"""Generate a NEW, distinct question on topic '{topic}' at difficulty {difficulty}/5.
Original question for reference (do not duplicate): {original_question}
"""
        if retrieved_context and retrieved_context.strip():
            prompt += f"\nStudy Context:\n{retrieved_context}\n"

        prompt += "\nOutput JSON for single question."

        chat_completion = await asyncio.wait_for(
            self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": GROUNDED_QUIZ_SYSTEM_PROMPT if retrieved_context else GENERIC_QUIZ_SYSTEM_PROMPT},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.3
            ),
            timeout=4.0
        )

        raw = json.loads(chat_completion.choices[0].message.content)
        opts = [
            DistractorOption(
                id=o["id"],
                text=o["text"],
                is_correct=o.get("is_correct", False),
                trap_explanation=o.get("trap_explanation")
            )
            for o in raw.get("options", [])
        ]
        return ChallengeQuestion(
            id=str(uuid.uuid4())[:8],
            type="MCQ",
            difficulty=difficulty,
            prompt=raw.get("prompt", ""),
            code_snippet=raw.get("code_snippet"),
            options=opts,
            cognitive_trap_name=raw.get("cognitive_trap_name", "Targeted Concept"),
            cognitive_trap_detail=raw.get("cognitive_trap_detail", ""),
            concept_tag=raw.get("concept_tag", topic),
            hint=raw.get("hint", "Think through the base case.")
        )
