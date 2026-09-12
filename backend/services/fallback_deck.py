import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional
from backend.schemas import ChallengeQuestion, ChallengeQuiz, AutopsyRequest, AutopsyResponse

FALLBACK_FILE = Path(__file__).resolve().parent.parent / "data" / "fallback_questions.json"

_cached_questions: Optional[List[dict]] = None

def _load_raw_questions() -> List[dict]:
    global _cached_questions
    if _cached_questions is None:
        try:
            with open(FALLBACK_FILE, "r", encoding="utf-8") as f:
                _cached_questions = json.load(f)
        except Exception:
            _cached_questions = []
    return _cached_questions

def get_fallback_quiz(topic: str, num_questions: int = 5) -> ChallengeQuiz:
    """
    Returns a guaranteed high-quality pre-built quiz deck matching the topic if possible,
    or a diverse technical deck covering fundamental computer science & software patterns.
    """
    raw = _load_raw_questions()
    if not raw:
        raise RuntimeError("Fallback deck unavailable")

    topic_lower = topic.lower() if topic else ""
    
    # Keyword matching
    matched = [
        q for q in raw
        if any(term in topic_lower for term in [
            q.get("concept_tag", "").lower(),
            q.get("cognitive_trap_name", "").lower(),
            "react" if "react" in q.get("concept_tag", "").lower() else "",
            "python" if "python" in q.get("concept_tag", "").lower() else "",
            "js" if "javascript" in q.get("concept_tag", "").lower() else "",
            "system" if "system" in q.get("concept_tag", "").lower() else ""
        ] if term)
    ]

    selected_raw = matched if len(matched) >= num_questions else (matched + [q for q in raw if q not in matched])
    selected_raw = selected_raw[:max(3, min(num_questions, len(selected_raw)))]

    questions = [ChallengeQuestion(**q) for q in selected_raw]

    return ChallengeQuiz(
        id=str(uuid.uuid4()),
        title=f"Mastery Challenge: {topic.title() if topic.strip() else 'Core Software Engineering'}",
        topic=topic if topic.strip() else "Core Software Engineering",
        questions=questions,
        created_at=datetime.now(timezone.utc).isoformat()
    )

def get_fallback_autopsy(req: AutopsyRequest) -> AutopsyResponse:
    """
    Provides an instant structured diagnosis and 10-second mental cure
    derived from the cognitive trap metadata.
    """
    trap_name = req.cognitive_trap_name.strip() if req.cognitive_trap_name else "Premature Optimization Fallacy"
    
    # Specific fallacies heuristics
    diagnostics = {
        "Synchronous State Fallacy": (
            "You assumed `setCount` acts like an in-place imperative variable assignment (`count = count + 1`). In reality, state setters in React enqueue a render pass and leave the current execution frame's closure variable untouched.",
            "Rule of thumb: In React, state variables are snapshot constants within the current render cycle. Never read state immediately after calling its setter."
        ),
        "Living Closure Assumption": (
            "You expected a callback function inside an effect to dynamically update its references to outer scope variables. Because the dependency array was empty, the interval callback closed over the initial render's scope forever.",
            "Rule of thumb: If a callback reads state inside an effect, either declare it in the dependency array or use the functional state updater `setCount(prev => prev + 1)`."
        ),
        "Timer Priority Bias": (
            "You assumed that a 0 millisecond timer executes immediately before queued microtasks. In JavaScript's event loop, microtask queues (Promise callbacks) are completely drained before the next macrotask (timer) is fetched.",
            "Rule of thumb: Microtasks always cut in line ahead of macrotasks. Remember: Sync code -> Microtasks (Promises) -> Macrotasks (setTimeout)."
        ),
        "Hardware Parallelism Illusion": (
            "You treated OS thread creation as equivalent to true multi-core CPU parallelism. In standard CPython, the Global Interpreter Lock (GIL) mandates that only one native thread can execute Python bytecodes at any single instant.",
            "Rule of thumb: Use `multiprocessing` or native C/Rust extensions for CPU-bound tasks in Python; reserve `threading` strictly for I/O-bound blocking calls."
        ),
        "Call-Time Instantiation Fallacy": (
            "You expected `items=[]` to allocate a fresh list on every invocation. In Python, default argument expressions are evaluated once when the function definition is executed, creating a shared persistent object across all invocations.",
            "Rule of thumb: Always use `items=None` as the default argument, then inside the function initialize `if items is None: items = []`."
        ),
        "Passive Expiry Fallacy": (
            "You relied on TTL expiration without concurrency protection. When a hot cache key expires under heavy traffic, thousands of concurrent requests miss simultaneously and overwhelm the primary database in a cache stampede.",
            "Rule of thumb: Use mutex locking (single-flight / distributed lock) or probabilistic early expiration (XFetch) for high-traffic cache keys."
        ),
        "Symmetric Negation Assumption": (
            "You assumed comparing an object against its negation must be false. In JS, `![]` coerces to `false`, and `[] == false` triggers type coercion where both sides convert to number `0 == 0`, yielding `true`.",
            "Rule of thumb: Never rely on loose equality `==` with objects or booleans. Always enforce strict equality `===`."
        )
    }

    if trap_name in diagnostics:
        diagnostic, cure = diagnostics[trap_name]
    else:
        diagnostic = (
            f"You selected '{req.chosen_text}', which reflects the '{trap_name}' trap instead of the correct answer '{req.correct_text}'. "
            f"Your mental model assumed intuitive immediate outcomes rather than the underlying runtime lifecycle."
        )
        cure = "Rule of thumb: Pause to trace the explicit execution lifecycle and underlying state mutation order before confirming your answer."

    return AutopsyResponse(
        fallacy_name=trap_name,
        mental_model_diagnostic=diagnostic,
        ten_second_cure=cure
    )
