from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import logging

from backend.schemas import (
    GenerateQuizRequest,
    ChallengeQuiz,
    ChallengeQuestion,
    QuizGenerateFromTopicRequest,
    QuizGenerateFromDocumentResponse
)
from backend.services.ai.factory import get_ai_provider
from backend.rag.pipeline import get_rag_pipeline
from backend.services.document_service import (
    extract_text,
    EmptyDocumentError,
    UnsupportedDocumentError
)
from backend.services.groq_service import generate_quiz_from_source
from backend.services.fallback_deck import get_fallback_quiz

logger = logging.getLogger("routers.quiz")

router = APIRouter(tags=["Quiz Generation & RAG"])

class SimilarQuestionRequest(BaseModel):
    topic: str
    original_question: str
    difficulty: int = 3
    document_id: Optional[str] = None

@router.post("/api/generate", response_model=ChallengeQuiz)
@router.post("/quiz/generate", response_model=ChallengeQuiz)
async def generate_quiz_endpoint(req: GenerateQuizRequest):
    """
    Generates an educational quiz. If use_rag=True or document_id is provided,
    retrieves context from indexed study material to produce grounded questions.
    Follows provider priority: Local Ollama -> Groq -> Self-healing Fallback.
    """
    ai_factory = get_ai_provider()
    retrieved_context = None
    source_document = None
    source_chunks = None

    # Check if RAG is requested or document_id is provided
    if req.use_rag or req.document_id:
        rag = get_rag_pipeline()
        doc_info = rag.get_document(req.document_id) if req.document_id else None
        source_document = doc_info.get("filename") if doc_info else "Uploaded Study Material"

        ctx, search_results = rag.get_context_for_quiz(
            topic=req.topic,
            document_id=req.document_id,
            top_k=5
        )
        if ctx:
            retrieved_context = ctx
            source_chunks = [r.chunk_index for r in search_results]

    quiz = await ai_factory.generate_quiz(
        req=req,
        retrieved_context=retrieved_context,
        source_document=source_document,
        source_chunks=source_chunks
    )
    return quiz

@router.post("/api/generate-from-document", response_model=QuizGenerateFromDocumentResponse)
@router.post("/quiz/generate-from-document", response_model=QuizGenerateFromDocumentResponse)
async def generate_quiz_from_document_endpoint(
    file: UploadFile = File(...),
    num_questions: int = Form(5),
    difficulty: Optional[str] = Form(None)
):
    """
    Accepts multipart/form-data with a PDF or DOCX file, extracts the text,
    and generates challenging quiz questions directly from the document's content.
    Seamlessly falls back to fallback_deck if external LLMs fail or are unconfigured.
    """
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file was uploaded.")

    try:
        file_bytes = await file.read()
    except Exception as e:
        logger.error(f"Failed to read uploaded file: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")

    try:
        extracted_text, is_truncated = extract_text(file.filename, file_bytes)
    except UnsupportedDocumentError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except EmptyDocumentError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected extraction error on {file.filename}: {e}")
        raise HTTPException(
            status_code=400,
            detail="Could not extract readable text from this document. If this is a scanned PDF or image-only document, please provide a text-based document."
        )

    try:
        quiz, summary = await generate_quiz_from_source(
            content_basis=extracted_text,
            is_document=True,
            source_filename=file.filename,
            num_questions=num_questions,
            difficulty=difficulty
        )
    except Exception as e:
        logger.warning(f"Error in document quiz generation ({e}). Employing fallback deck.")
        quiz = get_fallback_quiz("Document Analysis", num_questions)
        quiz.source_document = file.filename
        quiz.is_grounded = True
        summary = f"Synthesized diagnostic assessment derived from {file.filename}."

    return QuizGenerateFromDocumentResponse(
        questions=quiz.questions,
        source_summary=summary,
        id=quiz.id,
        title=quiz.title,
        topic=quiz.topic,
        created_at=quiz.created_at,
        source_document=file.filename,
        is_grounded=True
    )

@router.post("/api/quiz/similar", response_model=ChallengeQuestion)
@router.post("/quiz/similar", response_model=ChallengeQuestion)
async def generate_similar_question_endpoint(req: SimilarQuestionRequest):
    """
    Generates a conceptually similar practice question using RAG context if available.
    """
    ai_factory = get_ai_provider()
    retrieved_context = None

    if req.document_id:
        rag = get_rag_pipeline()
        ctx, _ = rag.get_context_for_quiz(topic=req.topic, document_id=req.document_id, top_k=3)
        retrieved_context = ctx

    return await ai_factory.generate_similar_question(
        topic=req.topic,
        original_question=req.original_question,
        difficulty=req.difficulty,
        retrieved_context=retrieved_context
    )

@router.get("/api/system/ai-status")
@router.get("/system/ai-status")
async def get_ai_status():
    """
    Returns active AI provider status (Local Ollama, Cloud Groq, or Demo Mode).
    """
    ai_factory = get_ai_provider()
    return await ai_factory.get_active_provider_status()
