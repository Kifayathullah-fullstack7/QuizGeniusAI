import os
import json
import re
import uuid
import logging
import httpx
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

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

logger = logging.getLogger("ai.ollama")

DEFAULT_OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
DEFAULT_OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:3b")

def _extract_json(text: str) -> Optional[Dict[str, Any]]:
    """Extracts JSON object from text, handling markdown fences or surrounding chatter."""
    if not text:
        return None
    # Strip ```json ... ``` fences if present
    fence_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if fence_match:
        candidate = fence_match.group(1).strip()
        try:
            return json.loads(candidate)
        except Exception:
            pass

    # Find outermost braces
    brace_match = re.search(r"\{[\s\S]*\}", text)
    if brace_match:
        try:
            return json.loads(brace_match.group(0))
        except Exception:
            pass

    try:
        return json.loads(text.strip())
    except Exception:
        return None

class OllamaProvider(BaseAIProvider):
    name: str = "ollama"

    def __init__(
        self,
        base_url: str = DEFAULT_OLLAMA_BASE_URL,
        model: str = DEFAULT_OLLAMA_MODEL,
        timeout: float = 8.0
    ):
        self.base_url = base_url
        self.model = model
        self.timeout = timeout

    async def is_available(self) -> bool:
        """Checks if Ollama server is running and has models available."""
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                if res.status_code == 200:
                    data = res.json()
                    models = [m.get("name") for m in data.get("models", [])]
                    if models:
                        # If specified model is present or use the first available model
                        if not any(self.model in m for m in models):
                            self.model = models[0]
                        return True
                    # Server is running, but no models pulled yet
                    return False
        except Exception:
            return False
        return False

    async def _call_ollama(self, prompt: str, system_prompt: str) -> Optional[str]:
        payload = {
            "model": self.model,
            "prompt": prompt,
            "system": system_prompt,
            "format": "json",
            "stream": False,
            "options": {
                "temperature": 0.3
            }
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            res = await client.post(f"{self.base_url}/api/generate", json=payload)
            if res.status_code == 200:
                data = res.json()
                return data.get("response", "")
        return None

    async def generate_quiz(
        self,
        req: GenerateQuizRequest,
        retrieved_context: Optional[str] = None,
        source_document: Optional[str] = None,
        source_chunks: Optional[List[int]] = None
    ) -> ChallengeQuiz:
        is_grounded = bool(retrieved_context and retrieved_context.strip())
        system_prompt = GROUNDED_QUIZ_SYSTEM_PROMPT if is_grounded else GENERIC_QUIZ_SYSTEM_PROMPT

        prompt = f"""Topic: {req.topic}
Number of Questions: {req.num_questions}
Difficulty Level: {req.difficulty_level or 'medium'}
Question Type: {req.question_type or 'MCQ'}
"""
        if is_grounded:
            prompt += f"\n=== RETRIEVED STUDY MATERIAL CONTEXT ===\n{retrieved_context}\n=======================================\n"
        elif req.context_text:
            prompt += f"\nAdditional Context:\n{req.context_text}\n"

        prompt += "\nOutput valid JSON only."

        raw_response = await self._call_ollama(prompt, system_prompt)
        parsed = _extract_json(raw_response or "")
        if not parsed or "questions" not in parsed or not parsed["questions"]:
            raise ValueError(f"Ollama failed to return valid quiz JSON: {raw_response[:200] if raw_response else 'Empty'}")

        questions = []
        for i, q in enumerate(parsed["questions"]):
            opts = []
            for opt in q.get("options", []):
                opts.append(DistractorOption(
                    id=opt.get("id", "A"),
                    text=opt.get("text", ""),
                    is_correct=bool(opt.get("is_correct", False)),
                    trap_explanation=opt.get("trap_explanation")
                ))

            questions.append(ChallengeQuestion(
                id=q.get("id", f"q{i+1}"),
                type=q.get("type", "MCQ"),
                difficulty=int(q.get("difficulty", 3)),
                prompt=q.get("prompt", ""),
                code_snippet=q.get("code_snippet"),
                options=opts,
                cognitive_trap_name=q.get("cognitive_trap_name", "Conceptual Blindspot"),
                cognitive_trap_detail=q.get("cognitive_trap_detail", ""),
                concept_tag=q.get("concept_tag", req.topic),
                hint=q.get("hint", "Consider the execution flow carefully."),
                source_document=source_document if is_grounded else None,
                source_chunks=source_chunks if is_grounded else None,
                is_grounded=is_grounded
            ))

        return ChallengeQuiz(
            id=str(uuid.uuid4()),
            title=parsed.get("title", f"Grounded Quiz: {req.topic}" if is_grounded else f"Mastery Challenge: {req.topic}"),
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
        prompt = f"""Question: {req.question_prompt}
Student Chosen (WRONG): {req.chosen_text}
Correct Answer: {req.correct_text}
Cognitive Trap Tag: {req.cognitive_trap_name}
"""
        if retrieved_context and retrieved_context.strip():
            prompt += f"\n=== GROUNDED STUDY CONTEXT FROM STUDENT MATERIAL ===\n{retrieved_context}\n"

        prompt += "\nDiagnose the student's cognitive mistake in valid JSON."

        raw = await self._call_ollama(prompt, AUTOPSY_SYSTEM_PROMPT)
        parsed = _extract_json(raw or "")
        if not parsed:
            raise ValueError("Ollama failed to return valid autopsy JSON.")

        return AutopsyResponse(
            fallacy_name=parsed.get("fallacy_name", req.cognitive_trap_name or "Cognitive Misconception"),
            mental_model_diagnostic=parsed.get("mental_model_diagnostic", "You misapplied the underlying principle."),
            ten_second_cure=parsed.get("ten_second_cure", "Always review the fundamental execution model before choosing an option."),
            source_reference=f"Grounding: {req.source_document}" if req.source_document else None
        )

    async def generate_similar_question(
        self,
        topic: str,
        original_question: str,
        difficulty: int,
        retrieved_context: Optional[str] = None
    ) -> ChallengeQuestion:
        prompt = f"""Generate a NEW, conceptually similar practice question for topic '{topic}' at difficulty {difficulty}/5.
Original Question for reference (DO NOT duplicate): {original_question}
"""
        if retrieved_context and retrieved_context.strip():
            prompt += f"\nStudy Context:\n{retrieved_context}\n"

        prompt += "\nOutput JSON matching single question schema."

        raw = await self._call_ollama(prompt, GROUNDED_QUIZ_SYSTEM_PROMPT if retrieved_context else GENERIC_QUIZ_SYSTEM_PROMPT)
        parsed = _extract_json(raw or "")
        if not parsed:
            raise ValueError("Ollama failed to generate similar question.")

        opts = [
            DistractorOption(
                id=o["id"],
                text=o["text"],
                is_correct=o.get("is_correct", False),
                trap_explanation=o.get("trap_explanation")
            )
            for o in parsed.get("options", [])
        ]
        return ChallengeQuestion(
            id=str(uuid.uuid4())[:8],
            type="MCQ",
            difficulty=difficulty,
            prompt=parsed.get("prompt", ""),
            code_snippet=parsed.get("code_snippet"),
            options=opts,
            cognitive_trap_name=parsed.get("cognitive_trap_name", "Targeted Concept"),
            cognitive_trap_detail=parsed.get("cognitive_trap_detail", ""),
            concept_tag=parsed.get("concept_tag", topic),
            hint=parsed.get("hint", "Recall the core invariant.")
        )
