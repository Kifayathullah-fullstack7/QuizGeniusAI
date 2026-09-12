import os
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional, List, Tuple

from backend.schemas import (
    ChallengeQuiz,
    ChallengeQuestion,
    DistractorOption,
    GenerateQuizRequest,
    AutopsyRequest,
    AutopsyResponse
)
from backend.services.ai.base import BaseAIProvider
from backend.services.ai.ollama_service import OllamaProvider
from backend.services.ai.groq_service import GroqProvider
from backend.services.fallback_deck import get_fallback_quiz, get_fallback_autopsy

logger = logging.getLogger("ai.factory")

class AIProviderFactory:
    def __init__(self):
        self.ollama = OllamaProvider()
        self.groq = GroqProvider()

    def get_configured_provider_name(self, override: Optional[str] = None) -> str:
        prov = (override or os.getenv("LLM_PROVIDER", "auto")).lower().strip()
        if prov in ["ollama", "groq", "auto"]:
            return prov
        return "auto"

    async def get_active_provider_status(self) -> dict:
        """Returns the status and active provider for the UI indicator."""
        ollama_ok = await self.ollama.is_available()
        groq_ok = await self.groq.is_available()

        configured = self.get_configured_provider_name()

        active = "fallback"
        mode_label = "Demo Mode"
        badge_type = "demo"

        if configured == "ollama":
            if ollama_ok:
                active = "ollama"
                mode_label = f"Local AI ({self.ollama.model})"
                badge_type = "local"
            elif groq_ok:
                active = "groq"
                mode_label = f"Cloud AI ({self.groq.model})"
                badge_type = "cloud"
        elif configured == "groq":
            if groq_ok:
                active = "groq"
                mode_label = f"Cloud AI ({self.groq.model})"
                badge_type = "cloud"
            elif ollama_ok:
                active = "ollama"
                mode_label = f"Local AI ({self.ollama.model})"
                badge_type = "local"
        else: # auto
            if ollama_ok:
                active = "ollama"
                mode_label = f"Local AI ({self.ollama.model})"
                badge_type = "local"
            elif groq_ok:
                active = "groq"
                mode_label = f"Cloud AI ({self.groq.model})"
                badge_type = "cloud"

        return {
            "configured_mode": configured,
            "active_provider": active,
            "mode_label": mode_label,
            "badge_type": badge_type,  # 'local' | 'cloud' | 'demo'
            "ollama_available": ollama_ok,
            "ollama_model": self.ollama.model,
            "groq_available": groq_ok,
            "groq_model": self.groq.model
        }

    async def generate_quiz(
        self,
        req: GenerateQuizRequest,
        retrieved_context: Optional[str] = None,
        source_document: Optional[str] = None,
        source_chunks: Optional[List[int]] = None
    ) -> ChallengeQuiz:
        pref = self.get_configured_provider_name(req.ai_provider)
        is_grounded = bool(retrieved_context and retrieved_context.strip())

        providers_to_try: List[Tuple[str, BaseAIProvider]] = []
        if pref == "ollama":
            providers_to_try = [("ollama", self.ollama), ("groq", self.groq)]
        elif pref == "groq":
            providers_to_try = [("groq", self.groq), ("ollama", self.ollama)]
        else: # auto: local ollama first, then groq
            providers_to_try = [("ollama", self.ollama), ("groq", self.groq)]

        # Try providers in order
        for name, provider in providers_to_try:
            try:
                if await provider.is_available():
                    logger.info(f"Generating quiz using {name} (grounded={is_grounded})...")
                    quiz = await provider.generate_quiz(
                        req=req,
                        retrieved_context=retrieved_context,
                        source_document=source_document,
                        source_chunks=source_chunks
                    )
                    return quiz
            except Exception as e:
                logger.warning(f"Provider {name} quiz generation failed: {e}. Trying next...")

        # Final Guaranteed Fallback
        logger.info(f"Using self-healing fallback deck (grounded={is_grounded})")
        if is_grounded and source_document:
            return self._synthesize_grounded_fallback_quiz(
                topic=req.topic,
                retrieved_context=retrieved_context,
                source_document=source_document,
                source_chunks=source_chunks,
                num_questions=req.num_questions
            )

        fallback = get_fallback_quiz(req.topic, req.num_questions)
        return fallback

    def _synthesize_grounded_fallback_quiz(
        self,
        topic: str,
        retrieved_context: str,
        source_document: str,
        source_chunks: Optional[List[int]],
        num_questions: int = 5
    ) -> ChallengeQuiz:
        """
        Synthesizes a guaranteed valid quiz directly from retrieved chunks
        if external LLM providers are unavailable.
        """
        lines = [line.strip() for line in retrieved_context.split("\n") if len(line.strip()) > 30 and not line.startswith("===")]
        questions = []

        q_count = max(3, min(num_questions, max(3, len(lines))))
        for i in range(q_count):
            fact_line = lines[i % len(lines)] if lines else f"Key concept in {topic}"
            q_id = f"grounded_q{i+1}"

            questions.append(ChallengeQuestion(
                id=q_id,
                type="MCQ",
                difficulty=3,
                prompt=f"According to {source_document}, which statement accurately reflects the principles of {topic}?",
                code_snippet=None,
                concept_tag=topic,
                cognitive_trap_name="Unsupported Premise Assumption",
                cognitive_trap_detail=f"Overlooking the explicit facts stated in {source_document}.",
                hint=f"Refer directly to the study material excerpt from {source_document}.",
                options=[
                    DistractorOption(id="A", text=fact_line, is_correct=True, trap_explanation=None),
                    DistractorOption(id="B", text=f"The exact opposite of what is documented in {source_document}.", is_correct=False, trap_explanation="Contradicts the verified material."),
                    DistractorOption(id="C", text="An external assumption not discussed in this study guide.", is_correct=False, trap_explanation="Extrapolating unsupported external claims."),
                    DistractorOption(id="D", text="A legacy implementation rule that violates modern invariants.", is_correct=False, trap_explanation="Confusing legacy syntax with current specs.")
                ],
                source_document=source_document,
                source_chunks=source_chunks or [i],
                is_grounded=True
            ))

        return ChallengeQuiz(
            id=str(uuid.uuid4()),
            title=f"Grounded Material Quiz: {topic}",
            topic=topic,
            questions=questions,
            created_at=datetime.now(timezone.utc).isoformat(),
            source_document=source_document,
            is_grounded=True
        )

    async def analyze_mistake(
        self,
        req: AutopsyRequest,
        retrieved_context: Optional[str] = None
    ) -> AutopsyResponse:
        pref = self.get_configured_provider_name()
        providers = [self.ollama, self.groq] if pref != "groq" else [self.groq, self.ollama]

        for provider in providers:
            try:
                if await provider.is_available():
                    return await provider.analyze_mistake(req, retrieved_context=retrieved_context)
            except Exception as e:
                logger.warning(f"Autopsy provider failed: {e}")

        # Fallback autopsy
        res = get_fallback_autopsy(req)
        if req.source_document:
            res.source_reference = f"Grounded in {req.source_document}"
        return res

    async def generate_similar_question(
        self,
        topic: str,
        original_question: str,
        difficulty: int,
        retrieved_context: Optional[str] = None
    ) -> ChallengeQuestion:
        pref = self.get_configured_provider_name()
        providers = [self.ollama, self.groq] if pref != "groq" else [self.groq, self.ollama]

        for provider in providers:
            try:
                if await provider.is_available():
                    return await provider.generate_similar_question(
                        topic=topic,
                        original_question=original_question,
                        difficulty=difficulty,
                        retrieved_context=retrieved_context
                    )
            except Exception as e:
                logger.warning(f"Similar question provider failed: {e}")

        # Fallback question
        fallback_quiz = get_fallback_quiz(topic, 3)
        q = fallback_quiz.questions[0]
        q.id = f"sim_{uuid.uuid4().hex[:6]}"
        return q

_AI_FACTORY_INSTANCE = None

def get_ai_provider() -> AIProviderFactory:
    global _AI_FACTORY_INSTANCE
    if _AI_FACTORY_INSTANCE is None:
        _AI_FACTORY_INSTANCE = AIProviderFactory()
    return _AI_FACTORY_INSTANCE
