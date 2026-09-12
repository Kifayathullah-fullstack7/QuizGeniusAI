from fastapi import APIRouter, HTTPException, status
from typing import List
from backend.schemas import (
    StudySetSummary,
    FlashcardDeck,
    GenerateFlashcardsRequest,
    StudyGuideResponse,
    GenerateStudyGuideRequest,
    QChatRequest,
    QChatResponse
)
from backend.services.study_service import (
    PREBUILT_STUDY_SETS,
    generate_flashcards,
    generate_study_guide,
    qchat_tutor_response
)

router = APIRouter(prefix="/api/study", tags=["Study Tools"])

@router.get("/sets", response_model=List[StudySetSummary])
async def list_study_sets():
    """Returns curated popular study sets for instant learning."""
    return PREBUILT_STUDY_SETS

@router.post("/flashcards", response_model=FlashcardDeck)
async def create_flashcards(req: GenerateFlashcardsRequest):
    """Generate or retrieve high-yield interactive flashcards."""
    try:
        deck = await generate_flashcards(req)
        return deck
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Flashcard generation failed: {str(e)}"
        )

@router.post("/guide", response_model=StudyGuideResponse)
async def create_study_guide(req: GenerateStudyGuideRequest):
    """Generate or retrieve a structured AI study guide."""
    try:
        guide = await generate_study_guide(req)
        return guide
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Study guide generation failed: {str(e)}"
        )

@router.post("/chat", response_model=QChatResponse)
async def chat_with_tutor(req: QChatRequest):
    """Engage with Q-Chat, the Socratic AI Study Companion."""
    try:
        return await qchat_tutor_response(req)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Q-Chat session failed: {str(e)}"
        )
