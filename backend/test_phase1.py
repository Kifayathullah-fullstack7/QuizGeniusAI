import sys
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health():
    print("[TEST 1] Testing GET /health...")
    r = client.get("/health")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    data = r.json()
    assert data["status"] == "healthy"
    assert "http://localhost:3000" in data["allowed_origins"], f"CORS must contain localhost:3000, got {data['allowed_origins']}"
    print("  -> Passed! Health check OK, CORS origin contains: 'http://localhost:3000'")

def test_generate():
    print("[TEST 2] Testing POST /api/generate...")
    r = client.post("/api/generate", json={"topic": "React Hooks & State", "num_questions": 5})
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    data = r.json()
    assert "questions" in data
    assert len(data["questions"]) >= 3
    q0 = data["questions"][0]
    assert "prompt" in q0
    assert "options" in q0
    assert len(q0["options"]) == 4
    assert "cognitive_trap_name" in q0
    assert "concept_tag" in q0
    print(f"  -> Passed! Generated {len(data['questions'])} questions. Sample trap: '{q0['cognitive_trap_name']}'")

def test_autopsy():
    print("[TEST 3] Testing POST /api/autopsy...")
    r = client.post("/api/autopsy", json={
        "question_id": "q-1",
        "selected_option_id": "A",
        "question_prompt": "What is logged when setCount is called?",
        "chosen_text": "1",
        "correct_text": "0",
        "cognitive_trap_name": "Synchronous State Fallacy"
    })
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    data = r.json()
    assert "fallacy_name" in data
    assert "mental_model_diagnostic" in data
    assert "ten_second_cure" in data
    assert len(data["ten_second_cure"]) > 5
    print(f"  -> Passed! Autopsy fallacy: '{data['fallacy_name']}'")
    print(f"     Diagnostic: '{data['mental_model_diagnostic']}'")
    print(f"     10-Sec Cure: '{data['ten_second_cure']}'")

def test_fallback_resilience():
    print("[TEST 4] Testing Fallback Resilience (Invisible swap under simulated Groq failure)...")
    from backend.services.fallback_deck import get_fallback_quiz, get_fallback_autopsy
    from backend.schemas import AutopsyRequest

    quiz = get_fallback_quiz("Python GIL Concurrency", 3)
    assert len(quiz.questions) == 3
    assert any("python" in q.concept_tag.lower() for q in quiz.questions)

    autopsy = get_fallback_autopsy(AutopsyRequest(
        question_id="test",
        selected_option_id="A",
        question_prompt="test prompt",
        chosen_text="test chosen",
        correct_text="test correct",
        cognitive_trap_name="Living Closure Assumption"
    ))
    assert autopsy.fallacy_name == "Living Closure Assumption"
    assert "dependency array" in autopsy.mental_model_diagnostic or "closure" in autopsy.mental_model_diagnostic
    print("  -> Passed! Fallback deck provides seamless question generation and autopsy diagnosis.")

if __name__ == "__main__":
    test_health()
    test_generate()
    test_autopsy()
    test_fallback_resilience()
    print("\nALL PHASE 1 BACKEND VERIFICATIONS PASSED SUCCESSFULLY!")
