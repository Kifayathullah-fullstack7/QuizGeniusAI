from fastapi import APIRouter
from backend.schemas import AutopsyRequest, AutopsyResponse
from backend.services.ai.factory import get_ai_provider
from backend.rag.pipeline import get_rag_pipeline

router = APIRouter(tags=["Autopsy & RAG Diagnostics"])

@router.post("/api/autopsy", response_model=AutopsyResponse)
@router.post("/autopsy", response_model=AutopsyResponse)
async def perform_cognitive_autopsy_endpoint(req: AutopsyRequest):
    """
    Diagnoses the underlying cognitive misconception behind a wrong answer.
    If the quiz originated from study material, retrieves relevant chunks to ground the diagnosis.
    """
    ai_factory = get_ai_provider()
    retrieved_context = None

    if req.document_id or req.source_document:
        rag = get_rag_pipeline()
        ctx, _ = rag.get_context_for_autopsy(
            question_prompt=req.question_prompt,
            chosen_text=req.chosen_text,
            correct_text=req.correct_text,
            document_id=req.document_id,
            top_k=3
        )
        retrieved_context = ctx

    return await ai_factory.analyze_mistake(req, retrieved_context=retrieved_context)
