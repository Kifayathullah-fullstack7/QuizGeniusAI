from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any
from backend.schemas import (
    ChallengeQuiz,
    ChallengeQuestion,
    GenerateQuizRequest,
    AutopsyRequest,
    AutopsyResponse
)

GROUNDED_QUIZ_SYSTEM_PROMPT = """You are QuizGenius AI, an elite educational assessment engine.
Generate educational quiz questions ONLY using the provided retrieved study context.

Strict Grounding Rules:
1. Use the retrieved study context as the SOLE source of truth.
2. Do NOT invent, extrapolate, or hallucinate unsupported facts.
3. If the context is insufficient, generate fewer questions rather than hallucinating.
4. Every MCQ must have exactly one unambiguously correct answer supported by the text.
5. Include plausible distractors reflecting common student misunderstandings.
6. For every option, provide a concise 'trap_explanation' (null for the correct option).
7. Specify 'cognitive_trap_name' (a memorable 2-4 word name for the mental fallacy) and 'cognitive_trap_detail'.
8. Specify 'concept_tag' and 'hint'.
9. Output valid, parseable JSON matching the schema without markdown tags or extra prose.

JSON Structure:
{
  "title": "Grounded Challenge: [Topic]",
  "topic": "[Topic]",
  "questions": [
    {
      "id": "q1",
      "type": "MCQ",
      "difficulty": 3,
      "prompt": "Question text directly tested by context...",
      "code_snippet": "optional code or null",
      "concept_tag": "Specific Concept from text",
      "cognitive_trap_name": "Cognitive Trap Name",
      "cognitive_trap_detail": "Why a student thinking incorrectly chooses this",
      "hint": "Subtle hint",
      "options": [
        {"id": "A", "text": "...", "is_correct": true, "trap_explanation": null},
        {"id": "B", "text": "...", "is_correct": false, "trap_explanation": "..."},
        {"id": "C", "text": "...", "is_correct": false, "trap_explanation": "..."},
        {"id": "D", "text": "...", "is_correct": false, "trap_explanation": "..."}
      ]
    }
  ]
}
"""

GENERIC_QUIZ_SYSTEM_PROMPT = """You are an expert cognitive scientist and elite software engineering educator.
You generate challenging, conceptual multiple-choice quizzes that test DEEP mental models and identify common developer cognitive traps.

For every question:
1. Provide a realistic scenario or concise code snippet.
2. Formulate 4 distractor options (A, B, C, D) where ONLY ONE is correct.
3. Every INCORRECT option MUST represent a known cognitive misconception or trap (e.g. Synchronous State Fallacy, Living Closure Assumption, Boundary Off-By-One, Race Condition Blindness).
4. For every option, provide a concise 'trap_explanation' explaining why someone thinking incorrectly picked it (null for the correct option).
5. Specify 'cognitive_trap_name' (a 2-4 word memorable name for the primary mental trap tested) and 'cognitive_trap_detail'.
6. Specify 'concept_tag'.
7. Difficulty must be an integer between 1 and 5.
8. Provide a clever 1-sentence 'hint'.

Output strictly valid JSON matching the exact structure.
"""

AUTOPSY_SYSTEM_PROMPT = """You are a senior cognitive scientist and elite software engineering educator.
A student selected an incorrect option on a technical assessment question.
Diagnose the cognitive trap and psychological fallacy that led them to select this specific distractor.

Respond with strictly valid JSON:
{
  "fallacy_name": "Specific 2-4 word name of the cognitive fallacy",
  "mental_model_diagnostic": "2-3 sentences precisely diagnosing what incorrect assumption their brain made.",
  "ten_second_cure": "A punchy, memorable rule of thumb to correct this mental model forever."
}
"""

class BaseAIProvider(ABC):
    name: str = "base"

    @abstractmethod
    async def is_available(self) -> bool:
        """Returns True if this AI provider is reachable and operational."""
        pass

    @abstractmethod
    async def generate_quiz(
        self,
        req: GenerateQuizRequest,
        retrieved_context: Optional[str] = None,
        source_document: Optional[str] = None,
        source_chunks: Optional[List[int]] = None
    ) -> ChallengeQuiz:
        """Generates a quiz either grounded in retrieved context or via conceptual reasoning."""
        pass

    @abstractmethod
    async def analyze_mistake(
        self,
        req: AutopsyRequest,
        retrieved_context: Optional[str] = None
    ) -> AutopsyResponse:
        """Performs cognitive autopsy, optionally grounded in retrieved study material."""
        pass

    @abstractmethod
    async def generate_similar_question(
        self,
        topic: str,
        original_question: str,
        difficulty: int,
        retrieved_context: Optional[str] = None
    ) -> ChallengeQuestion:
        """Generates a conceptually similar practice question."""
        pass
