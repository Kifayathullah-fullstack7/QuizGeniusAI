import os
import json
import uuid
import asyncio
from datetime import datetime, timezone
from typing import List, Optional
from backend.schemas import (
    FlashcardItem,
    FlashcardDeck,
    GenerateFlashcardsRequest,
    StudyGuideResponse,
    StudyGuideSection,
    GenerateStudyGuideRequest,
    QChatRequest,
    QChatResponse,
    StudySetSummary
)
from backend.services.groq_service import get_groq_client

PREBUILT_STUDY_SETS: List[StudySetSummary] = [
    StudySetSummary(
        id="set-react-19",
        title="React 19 & Next.js Architecture",
        description="Batched updates, stale closures, Server Components, Suspense boundaries, and useEffect lifecycles.",
        subject="Frontend Engineering",
        card_count=10,
        question_count=8,
        difficulty="Advanced",
        icon="Atom",
        popular_tags=["React", "Next.js", "Hooks", "Closures"]
    ),
    StudySetSummary(
        id="set-python-gil",
        title="Python Memory & GIL Internals",
        description="Reference counting, generational GC, Global Interpreter Lock thread contention, and mutable default trap.",
        subject="Backend Engineering",
        card_count=10,
        question_count=6,
        difficulty="Advanced",
        icon="Terminal",
        popular_tags=["Python", "GIL", "Memory", "Concurrency"]
    ),
    StudySetSummary(
        id="set-system-design",
        title="Distributed Systems & Caching",
        description="Cache stampedes, CAP theorem tradeoffs, replication lag, and distributed lock consistency.",
        subject="System Architecture",
        card_count=12,
        question_count=8,
        difficulty="Expert",
        icon="Layers",
        popular_tags=["Distributed Systems", "Caching", "CAP", "Redis"]
    ),
    StudySetSummary(
        id="set-dsa-mastery",
        title="Algorithms & Data Structures",
        description="Graph traversal, dynamic programming memoization, amortized complexity, and tree balancing.",
        subject="Computer Science",
        card_count=12,
        question_count=10,
        difficulty="Intermediate",
        icon="Binary",
        popular_tags=["DSA", "Graphs", "DP", "Trees"]
    ),
    StudySetSummary(
        id="set-ml-transformers",
        title="Machine Learning & LLM Math",
        description="Self-attention dot products, backpropagation gradients, layer normalization, and temperature sampling.",
        subject="Artificial Intelligence",
        card_count=10,
        question_count=7,
        difficulty="Advanced",
        icon="Cpu",
        popular_tags=["AI", "Transformers", "Attention", "Deep Learning"]
    ),
    StudySetSummary(
        id="set-database-internals",
        title="Database Systems & Indexing",
        description="ACID durability, Write-Ahead Logs (WAL), B-Tree vs LSM trees, and SQL query execution plans.",
        subject="Databases",
        card_count=10,
        question_count=8,
        difficulty="Intermediate",
        icon="Database",
        popular_tags=["SQL", "B-Tree", "ACID", "Postgres"]
    )
]

FALLBACK_FLASHCARDS = {
    "react": [
        FlashcardItem(
            id="fc-1",
            term="Stale Closure in Hooks",
            definition="Occurs when a callback (like inside useEffect or setInterval) captures state variables from an earlier render cycle because the dependency array omitted the variable.",
            example_or_code="useEffect(() => {\n  const id = setInterval(() => setCount(c => c + 1), 1000);\n  return () => clearInterval(id);\n}, []);",
            concept_tag="React Hooks & Closures",
            difficulty=4,
            mnemonic="Omitted in deps? You're frozen in the past!"
        ),
        FlashcardItem(
            id="fc-2",
            term="Batched State Updates",
            definition="React 18+ groups multiple setState calls inside timeouts, promises, and native event handlers into a single render pass to prevent performance thrashing.",
            example_or_code="setCount(c => c + 1);\nsetFlag(f => !f);\n// Only 1 render pass triggered",
            concept_tag="State Scheduling",
            difficulty=3,
            mnemonic="Batching: One render to rule them all."
        ),
        FlashcardItem(
            id="fc-3",
            term="Functional State Updater",
            definition="Passing an updater function (prev => prev + 1) guarantees access to the latest state regardless of closure staleness or asynchronous queuing.",
            example_or_code="setCount(prevCount => prevCount + 1);",
            concept_tag="State Invariants",
            difficulty=2,
            mnemonic="When in doubt with async, use the prev func."
        ),
        FlashcardItem(
            id="fc-4",
            term="React 19 Action State (useActionState)",
            definition="Hook specifically designed for handling form actions and async pending states without manual useState + try/catch boilerplate.",
            example_or_code="const [state, formAction, isPending] = useActionState(updateName, null);",
            concept_tag="React 19 Actions",
            difficulty=3,
            mnemonic="Actions handle pending, result, and errors natively."
        ),
        FlashcardItem(
            id="fc-5",
            term="Server Components vs Client Components",
            definition="Server Components execute solely on the server, producing zero client JavaScript bundle impact. Client components ('use client') hydrate in the browser to enable interactivity.",
            example_or_code="// 'use client' required only for onClick, hooks, window",
            concept_tag="Next.js Architecture",
            difficulty=3,
            mnemonic="Server sends HTML/RSC; Client ships interactive JS."
        ),
        FlashcardItem(
            id="fc-6",
            term="useEffect Cleanup Timing",
            definition="Cleanups run before the effect runs again, and on unmount. React does not execute cleanup on initial render.",
            example_or_code="return () => socket.disconnect();",
            concept_tag="Lifecycle Mechanics",
            difficulty=3,
            mnemonic="Clean before new: Rinse old dishes before plating new dinner."
        )
    ],
    "python": [
        FlashcardItem(
            id="py-1",
            term="Global Interpreter Lock (GIL)",
            definition="A mutex that protects access to Python objects, preventing multiple native threads from executing Python bytecode simultaneously on separate CPU cores.",
            example_or_code="import threading\n# CPU-bound threads will NOT achieve multi-core speedup in CPython",
            concept_tag="Concurrency & Internals",
            difficulty=4,
            mnemonic="One thread on the mic at a time."
        ),
        FlashcardItem(
            id="py-2",
            term="Mutable Default Argument Trap",
            definition="Default arguments in Python are evaluated once at function definition time, not every time the function is called. Mutable defaults (lists, dicts) persist mutations across calls.",
            example_or_code="def append_to(val, lst=None):\n    if lst is None: lst = []\n    lst.append(val)\n    return lst",
            concept_tag="Parameter Binding",
            difficulty=3,
            mnemonic="Def time binding: Never put [] in def header."
        ),
        FlashcardItem(
            id="py-3",
            term="Reference Counting & Cyclic GC",
            definition="CPython immediately deallocates memory when refcount drops to zero. A separate generational garbage collector detects and cleans cyclic references (e.g. A->B->A).",
            example_or_code="import sys\nsys.getrefcount(obj)",
            concept_tag="Memory Management",
            difficulty=4,
            mnemonic="Zero count = instant dust; Cycles = generational sweep."
        ),
        FlashcardItem(
            id="py-4",
            term="Generator `yield` vs `return`",
            definition="Yield pauses function execution and maintains the stack frame state in memory, allowing lazy evaluation of infinite streams without O(N) memory allocation.",
            example_or_code="def fib():\n    a, b = 0, 1\n    while True:\n        yield a\n        a, b = b, a + b",
            concept_tag="Iteration Protocols",
            difficulty=2,
            mnemonic="Yield gives one slice; return closes the bakery."
        )
    ]
}

def get_fallback_study_guide(topic: str) -> StudyGuideResponse:
    title = topic.strip().title() if topic else "Modern Software Engineering & Computer Science"
    return StudyGuideResponse(
        id=str(uuid.uuid4()),
        title=f"Complete AI Study Guide: {title}",
        topic=title,
        subject="Software Engineering",
        executive_summary=f"This comprehensive study guide distills core concepts, internal execution models, and frequent examination pitfalls for {title}. Master these principles to ace technical assessments and design resilient systems.",
        key_vocabulary=[
            {"term": "Invariant", "definition": "A condition that must always remain true throughout execution of a program or system block."},
            {"term": "Atomicity", "definition": "An operation that appears to the rest of the system to occur instantaneously or not at all."},
            {"term": "Idempotency", "definition": "The property of certain operations whereby they can be applied multiple times without changing the result beyond initial application."},
            {"term": "Closure", "definition": "A function bundled together with references to its surrounding lexical environment."},
            {"term": "Time Complexity (Big-O)", "definition": "The mathematical upper bound of execution time growth relative to input size N."}
        ],
        sections=[
            StudyGuideSection(
                heading="1. Foundational Architecture & Execution Models",
                summary="Understanding the low-level execution stack and lifecycle events.",
                key_points=[
                    "Execution contexts maintain call frames, lexical scope chains, and variable bindings.",
                    "Asynchronous event loops decouple I/O waiting from CPU processing cycles.",
                    "Memory layout is divided into the Call Stack (fixed size frames) and Heap (dynamic allocations)."
                ],
                common_pitfalls=[
                    "Assuming synchronous execution inside callback handlers.",
                    "Ignoring race conditions between concurrent promise settlements.",
                    "Creating memory leaks via forgotten event listeners or uncleaned subscriptions."
                ]
            ),
            StudyGuideSection(
                heading="2. State Machines, Immutability & Concurrency",
                summary="Mechanisms for managing mutating data safely across concurrent execution pipelines.",
                key_points=[
                    "Immutability enables reliable change detection via shallow reference equality (O(1)).",
                    "Atomic compare-and-swap (CAS) primitives allow lock-free state synchronization.",
                    "Thread synchronization requires strict mutex boundaries to prevent deadlocks."
                ],
                common_pitfalls=[
                    "Directly mutating state objects rather than cloning with spread operators.",
                    "Reading state immediately after an asynchronous dispatch.",
                    "Acquiring locks in inconsistent orders across competing threads."
                ]
            ),
            StudyGuideSection(
                heading="3. Performance Optimization & Diagnostic Patterns",
                summary="Profiling bottlenecks, caching tiers, and reducing algorithmic overhead.",
                key_points=[
                    "Always measure with profiling flamegraphs before applying speculative optimizations.",
                    "Cache at the boundary closest to the requester (CDN -> Edge -> Redis -> DB).",
                    "Choose data structures aligned with CPU cache line locality when traversing large collections."
                ],
                common_pitfalls=[
                    "Premature optimization of non-hot code paths.",
                    "Unbounded cache growth without TTL or LRU eviction policies.",
                    "Neglecting the N+1 query problem in relational data fetching."
                ]
            )
        ],
        high_yield_rules=[
            "RULE 1: Snapshot Invariant — Treat state variables as immutable snapshots within their current execution frame.",
            "RULE 2: Single Source of Truth — Derive calculated values on the fly; never synchronize redundant state.",
            "RULE 3: Defensive Cleanup — Every subscription, interval, or event listener must have an explicit teardown trigger.",
            "RULE 4: Bounded Concurrency — Never launch unmetered parallel tasks; always use worker pools or semaphores."
        ],
        created_at=datetime.now(timezone.utc).isoformat()
    )

async def generate_flashcards(req: GenerateFlashcardsRequest) -> FlashcardDeck:
    client = get_groq_client()
    topic = req.topic.strip() or "Computer Science"
    
    if client:
        try:
            prompt = f"""Generate {req.card_count} high-quality study flashcards for topic: "{topic}".
Notes/Context: "{req.notes_text or 'Standard curriculum'}"

Return JSON matching:
{{
  "title": "Flashcard Deck: {topic}",
  "cards": [
    {{
      "id": "fc-1",
      "term": "Term or Concept",
      "definition": "Clear concise definition",
      "example_or_code": "code snippet or practical example",
      "concept_tag": "Category Tag",
      "difficulty": 3,
      "mnemonic": "Memorable trick to remember"
    }}
  ]
}}"""
            chat_completion = await asyncio.wait_for(
                client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {"role": "system", "content": "You are a master educator creating interactive study flashcards. Output valid JSON only."},
                        {"role": "user", "content": prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.3
                ),
                timeout=4.5
            )
            raw = json.loads(chat_completion.choices[0].message.content)
            cards = [FlashcardItem(**c) for c in raw.get("cards", [])]
            if cards:
                return FlashcardDeck(
                    id=str(uuid.uuid4()),
                    title=raw.get("title", f"Flashcard Deck: {topic}"),
                    topic=topic,
                    subject=req.subject or "Computer Science",
                    card_count=len(cards),
                    cards=cards,
                    created_at=datetime.now(timezone.utc).isoformat()
                )
        except Exception:
            pass # Fall through to fallback
            
    # Fallback selection
    topic_lower = topic.lower()
    selected = FALLBACK_FLASHCARDS.get("react" if "react" in topic_lower or "hook" in topic_lower or "web" in topic_lower else ("python" if "python" in topic_lower else "react"))
    return FlashcardDeck(
        id=str(uuid.uuid4()),
        title=f"AI Flashcards: {topic.title()}",
        topic=topic,
        subject=req.subject or "Computer Science",
        card_count=len(selected),
        cards=selected,
        created_at=datetime.now(timezone.utc).isoformat()
    )

async def generate_study_guide(req: GenerateStudyGuideRequest) -> StudyGuideResponse:
    client = get_groq_client()
    topic = req.topic.strip() or "Computer Science Foundations"
    
    if client:
        try:
            prompt = f"""Create a comprehensive study guide for: "{topic}".
Notes: "{req.notes_text or 'Standard high-yield university syllabus'}"
Output JSON with fields: title, executive_summary, key_vocabulary (list of term, definition), sections (list of heading, summary, key_points, common_pitfalls), high_yield_rules (list of string rules)."""
            chat_completion = await asyncio.wait_for(
                client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {"role": "system", "content": "You are a distinguished university professor and learning scientist. Output valid JSON only."},
                        {"role": "user", "content": prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.3
                ),
                timeout=5.0
            )
            raw = json.loads(chat_completion.choices[0].message.content)
            sections = [StudyGuideSection(**s) for s in raw.get("sections", [])]
            return StudyGuideResponse(
                id=str(uuid.uuid4()),
                title=raw.get("title", f"AI Study Guide: {topic}"),
                topic=topic,
                subject=req.subject or "Computer Science",
                executive_summary=raw.get("executive_summary", "Comprehensive conceptual breakdown."),
                key_vocabulary=raw.get("key_vocabulary", []),
                sections=sections,
                high_yield_rules=raw.get("high_yield_rules", []),
                created_at=datetime.now(timezone.utc).isoformat()
            )
        except Exception:
            pass

    return get_fallback_study_guide(topic)

async def qchat_tutor_response(req: QChatRequest) -> QChatResponse:
    client = get_groq_client()
    msg = req.message.strip()
    topic = req.topic or "Computer Science"
    
    if client:
        try:
            messages = [
                {"role": "system", "content": f"You are Q-Chat, an encouraging, razor-sharp Socratic AI tutor on {topic}. Ask guiding questions, give concise analogies, identify cognitive fallacies, and always provide 3 helpful suggested follow-up questions."},
                {"role": "user", "content": msg}
            ]
            chat_completion = await asyncio.wait_for(
                client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=messages,
                    temperature=0.5
                ),
                timeout=4.0
            )
            reply = chat_completion.choices[0].message.content
            return QChatResponse(
                reply=reply,
                suggested_followups=[
                    "Can you test me on this concept with a tricky question?",
                    "What is a real-world analogy to remember this?",
                    "What is the most common mistake students make here?"
                ]
            )
        except Exception:
            pass

    # Socratic fallback response
    msg_lower = msg.lower()
    if "mnemonic" in msg_lower or "remember" in msg_lower:
        reply = f"Here is a proven mnemonic for {topic}: Remember **C-A-S-H**: **C**losures capture scope, **A**sync schedules later, **S**tate is snapshot, **H**ooks require top-level calls. Does that framework make intuitive sense?"
        followups = ["Give me another example", "Test me on closures", "How does this apply to performance?"]
    elif "test me" in msg_lower or "quiz" in msg_lower:
        reply = f"Here is a quick diagnostic question on {topic}:\n\n*If you invoke a state setter 3 times in a row inside a normal click handler in React 18, how many times will the component render, and why?*\n\nTake your best guess!"
        followups = ["It renders 1 time because of batching", "It renders 3 times immediately", "It depends on whether it's async"]
    elif "explain" in msg_lower or "5" in msg_lower or "simple" in msg_lower:
        reply = f"Imagine a restaurant kitchen (the Call Stack) and an order queue (the Event Loop). Synchronous code is the chef cooking tickets right in front of them. When you call setTimeout or fetch, the chef passes the ticket to the pantry bellboy and keeps cooking. The chef NEVER checks the pantry until the cutting board is completely clean! Does this analogy clarify things?"
        followups = ["Where do microtasks and Promises fit in?", "Show me a code snippet of this in action", "Let's take a quick practice test"]
    else:
        reply = f"Great question regarding **{topic}**! To master this, consider the mental model: what happens at execution time versus compile/definition time? When you write this code, are you mutating an existing memory pointer or creating a new immutable reference? Tell me what you predict happens first!"
        followups = [
            "Explain it like I'm 5",
            "Give me a 10-second mental cure",
            "Generate a 5-question practice test"
        ]

    return QChatResponse(reply=reply, suggested_followups=followups)
