from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from backend.rag.pipeline import get_rag_pipeline

router = APIRouter(tags=["Study Materials & RAG"])

class PasteNotesRequest(BaseModel):
    title: str = "Pasted Study Notes"
    text: str

class DocumentResponse(BaseModel):
    document_id: str
    filename: str
    file_type: str
    page_count: int
    char_count: int
    chunk_count: int
    created_at: str
    sample_snippet: Optional[str] = None
    already_indexed: bool = False
    message: Optional[str] = "Document active"

@router.post("/materials/upload", response_model=DocumentResponse)
@router.post("/api/materials/upload", response_model=DocumentResponse)
async def upload_material(file: UploadFile = File(...)):
    """
    Upload and index study material (PDF, DOCX, TXT) into the local vector database.
    """
    try:
        content = await file.read()
        pipeline = get_rag_pipeline()
        res = pipeline.ingest_document(
            file_bytes=content,
            filename=file.filename or "uploaded_document.txt",
            content_type=file.content_type
        )
        return DocumentResponse(**res)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document indexing failed: {str(e)}"
        )

@router.post("/materials/paste", response_model=DocumentResponse)
@router.post("/api/materials/paste", response_model=DocumentResponse)
async def paste_material(req: PasteNotesRequest):
    """
    Index pasted text notes into the local vector database.
    """
    if not req.text or not req.text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pasted text cannot be empty."
        )
    try:
        pipeline = get_rag_pipeline()
        res = pipeline.ingest_raw_notes(notes_text=req.text, title=req.title)
        return DocumentResponse(**res)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Notes indexing failed: {str(e)}"
        )

@router.get("/materials", response_model=List[DocumentResponse])
@router.get("/api/materials", response_model=List[DocumentResponse])
async def list_materials():
    """Returns all currently indexed study materials."""
    pipeline = get_rag_pipeline()
    docs = pipeline.list_documents()
    return [DocumentResponse(**d) for d in docs]

@router.get("/materials/{document_id}", response_model=DocumentResponse)
@router.get("/api/materials/{document_id}", response_model=DocumentResponse)
async def get_material(document_id: str):
    """Retrieves metadata for a specific indexed document."""
    pipeline = get_rag_pipeline()
    doc = pipeline.get_document(document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document '{document_id}' not found."
        )
    return DocumentResponse(**doc)

@router.delete("/materials/{document_id}")
@router.delete("/api/materials/{document_id}")
async def delete_material(document_id: str):
    """Deletes an indexed document and its embeddings from the vector store."""
    pipeline = get_rag_pipeline()
    success = pipeline.delete_document(document_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document '{document_id}' not found."
        )
    return {"message": f"Document '{document_id}' successfully deleted.", "document_id": document_id}
