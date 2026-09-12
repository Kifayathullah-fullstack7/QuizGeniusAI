import os
import logging
from pathlib import Path
from dataclasses import dataclass
from typing import List, Dict, Any, Optional
from backend.rag.chunker import DocumentChunk
from backend.rag.embeddings import get_embedding_service

logger = logging.getLogger("rag.vector_store")

CHROMA_DIR = Path(__file__).resolve().parent.parent / "data" / "chroma_db"
COLLECTION_NAME = "quizgenius_study_materials"

@dataclass
class SearchResult:
    chunk_id: str
    document_id: str
    source: str
    chunk_index: int
    text: str
    score: float
    metadata: Dict[str, Any]

class VectorStore:
    def __init__(self, persist_directory: str = str(CHROMA_DIR)):
        self.persist_directory = persist_directory
        os.makedirs(self.persist_directory, exist_ok=True)
        self.client = None
        self.collection = None
        self._init_chroma()

    def _init_chroma(self):
        try:
            import chromadb
            from chromadb.config import Settings
            self.client = chromadb.PersistentClient(
                path=self.persist_directory,
                settings=Settings(anonymized_telemetry=False)
            )
            self.collection = self.client.get_or_create_collection(
                name=COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"}
            )
            logger.info(f"ChromaDB initialized at {self.persist_directory} with collection '{COLLECTION_NAME}'")
        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB PersistentClient: {e}. In-memory fallback will be active.")
            self.client = None
            self.collection = None
            self._fallback_store: Dict[str, DocumentChunk] = {}

    def add_chunks(self, chunks: List[DocumentChunk]):
        """Embeds and indexes document chunks in the vector store."""
        if not chunks:
            return

        texts = [c.text for c in chunks]
        ids = [c.id for c in chunks]
        metadatas = [c.metadata for c in chunks]

        # Use embedding service
        emb_service = get_embedding_service()
        embeddings = emb_service.embed_documents(texts)

        if self.collection is not None:
            try:
                self.collection.upsert(
                    ids=ids,
                    documents=texts,
                    embeddings=embeddings,
                    metadatas=metadatas
                )
                logger.info(f"Successfully indexed {len(chunks)} chunks in ChromaDB")
                return
            except Exception as e:
                logger.warning(f"ChromaDB upsert error: {e}. Falling back to memory store.")

        # In-memory fallback
        if not hasattr(self, "_fallback_store"):
            self._fallback_store = {}
        for c, emb in zip(chunks, embeddings):
            self._fallback_store[c.id] = (c, emb)

    def search(
        self,
        query: str,
        top_k: int = 5,
        document_id: Optional[str] = None
    ) -> List[SearchResult]:
        """Retrieves top_k relevant chunks matching the query."""
        if not query or not query.strip():
            return []

        emb_service = get_embedding_service()
        query_emb = emb_service.embed_query(query)

        if self.collection is not None:
            try:
                where_filter = {"document_id": document_id} if document_id else None
                res = self.collection.query(
                    query_embeddings=[query_emb],
                    n_results=top_k,
                    where=where_filter,
                    include=["documents", "metadatas", "distances"]
                )

                results: List[SearchResult] = []
                if res and res.get("ids") and len(res["ids"][0]) > 0:
                    for i in range(len(res["ids"][0])):
                        cid = res["ids"][0][i]
                        doc_text = res["documents"][0][i]
                        meta = res["metadatas"][0][i] or {}
                        # Cosine distance to similarity score
                        dist = res["distances"][0][i] if "distances" in res else 0.5
                        score = max(0.0, 1.0 - dist)

                        results.append(SearchResult(
                            chunk_id=cid,
                            document_id=meta.get("document_id", ""),
                            source=meta.get("source", "Uploaded Document"),
                            chunk_index=meta.get("chunk_index", 0),
                            text=doc_text,
                            score=score,
                            metadata=meta
                        ))
                return results
            except Exception as e:
                logger.warning(f"ChromaDB query error: {e}. Falling back to memory search.")

        # Fallback memory cosine similarity search
        if hasattr(self, "_fallback_store") and self._fallback_store:
            scored = []
            for cid, (chunk, c_emb) in self._fallback_store.items():
                if document_id and chunk.document_id != document_id:
                    continue
                # Dot product as similarity
                sim = sum(a * b for a, b in zip(query_emb, c_emb))
                scored.append((sim, chunk))
            scored.sort(key=lambda x: x[0], reverse=True)
            return [
                SearchResult(
                    chunk_id=c.id,
                    document_id=c.document_id,
                    source=c.source,
                    chunk_index=c.chunk_index,
                    text=c.text,
                    score=float(sim),
                    metadata=c.metadata
                )
                for sim, c in scored[:top_k]
            ]

        return []

    def delete_document(self, document_id: str) -> bool:
        """Deletes all chunks belonging to a document."""
        deleted = False
        if self.collection is not None:
            try:
                self.collection.delete(where={"document_id": document_id})
                deleted = True
            except Exception as e:
                logger.error(f"Error deleting document from ChromaDB: {e}")

        if hasattr(self, "_fallback_store"):
            to_del = [cid for cid, (c, _) in self._fallback_store.items() if c.document_id == document_id]
            for cid in to_del:
                del self._fallback_store[cid]
            deleted = True

        return deleted

_VECTOR_STORE_INSTANCE = None

def get_vector_store() -> VectorStore:
    global _VECTOR_STORE_INSTANCE
    if _VECTOR_STORE_INSTANCE is None:
        _VECTOR_STORE_INSTANCE = VectorStore()
    return _VECTOR_STORE_INSTANCE
