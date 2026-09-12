import uuid
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Tuple, List
from backend.rag.document_loader import extract_document_text, DocumentContent
from backend.rag.chunker import chunk_document, DocumentChunk
from backend.rag.vector_store import get_vector_store, SearchResult
from backend.rag.retriever import get_retriever

class RAGPipeline:
    def __init__(self):
        self.vector_store = get_vector_store()
        self.retriever = get_retriever()
        # In-memory document registry: doc_id -> doc_info
        self._document_registry: Dict[str, Dict[str, Any]] = {}
        # Hash -> doc_id for deduplication
        self._hash_to_doc_id: Dict[str, str] = {}

    def _compute_hash(self, content: bytes) -> str:
        return hashlib.sha256(content).hexdigest()

    def ingest_document(
        self,
        file_bytes: bytes,
        filename: str,
        content_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Complete RAG Ingestion Pipeline:
        Validation -> Extraction -> Chunking -> Local Embeddings -> Vector Store.
        """
        # Deduplication check
        file_hash = self._compute_hash(file_bytes)
        if file_hash in self._hash_to_doc_id:
            existing_id = self._hash_to_doc_id[file_hash]
            if existing_id in self._document_registry:
                doc_info = self._document_registry[existing_id]
                return {
                    **doc_info,
                    "already_indexed": True,
                    "message": f"Document '{filename}' already indexed."
                }

        # 1. Extraction
        doc_content = extract_document_text(file_bytes, filename, content_type)
        doc_id = f"doc_{uuid.uuid4().hex[:12]}"

        # 2. Chunking
        chunks = chunk_document(
            text=doc_content.text,
            document_id=doc_id,
            source=filename,
            extra_metadata={
                "file_type": doc_content.file_type,
                "page_count": doc_content.page_count
            }
        )

        if not chunks:
            raise ValueError("Document yielded 0 chunks. Ensure it contains sufficient text.")

        # 3. Vector Storage
        self.vector_store.add_chunks(chunks)

        # 4. Register document
        doc_record = {
            "document_id": doc_id,
            "filename": filename,
            "file_type": doc_content.file_type,
            "page_count": doc_content.page_count,
            "char_count": doc_content.char_count,
            "chunk_count": len(chunks),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "file_hash": file_hash,
            "sample_snippet": doc_content.text[:300] + "..." if len(doc_content.text) > 300 else doc_content.text
        }
        self._document_registry[doc_id] = doc_record
        self._hash_to_doc_id[file_hash] = doc_id

        return {
            **doc_record,
            "already_indexed": False,
            "message": f"Successfully indexed '{filename}' with {len(chunks)} semantic chunks."
        }

    def ingest_raw_notes(self, notes_text: str, title: str = "Pasted Study Notes") -> Dict[str, Any]:
        """Ingests pasted text notes into the RAG vector store."""
        raw_bytes = notes_text.encode("utf-8")
        filename = f"{title.strip()[:30].replace(' ', '_')}.txt"
        return self.ingest_document(raw_bytes, filename, content_type="text/plain")

    def get_document(self, document_id: str) -> Optional[Dict[str, Any]]:
        return self._document_registry.get(document_id)

    def list_documents(self) -> List[Dict[str, Any]]:
        return list(self._document_registry.values())

    def delete_document(self, document_id: str) -> bool:
        if document_id in self._document_registry:
            doc = self._document_registry.pop(document_id)
            if doc.get("file_hash") in self._hash_to_doc_id:
                del self._hash_to_doc_id[doc["file_hash"]]
            self.vector_store.delete_document(document_id)
            return True
        return False

    def get_context_for_quiz(
        self,
        topic: str,
        document_id: Optional[str] = None,
        top_k: int = 5
    ) -> Tuple[str, List[SearchResult]]:
        """Retrieves grounded context for quiz generation."""
        query = f"Key concepts, rules, questions, and principles regarding {topic}"
        return self.retriever.retrieve_context_bundle(query=query, top_k=top_k, document_id=document_id)

    def get_context_for_autopsy(
        self,
        question_prompt: str,
        chosen_text: str,
        correct_text: str,
        document_id: Optional[str] = None,
        top_k: int = 3
    ) -> Tuple[str, List[SearchResult]]:
        """Retrieves grounded context to diagnose a wrong answer."""
        query = f"{question_prompt} {chosen_text} {correct_text}"
        return self.retriever.retrieve_context_bundle(query=query, top_k=top_k, document_id=document_id)

_PIPELINE_INSTANCE = None

def get_rag_pipeline() -> RAGPipeline:
    global _PIPELINE_INSTANCE
    if _PIPELINE_INSTANCE is None:
        _PIPELINE_INSTANCE = RAGPipeline()
    return _PIPELINE_INSTANCE
