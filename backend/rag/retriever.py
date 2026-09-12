import os
from typing import List, Optional, Tuple
from backend.rag.vector_store import get_vector_store, SearchResult

DEFAULT_TOP_K = int(os.getenv("RAG_TOP_K", "5"))

class Retriever:
    def __init__(self, top_k: int = DEFAULT_TOP_K):
        self.top_k = top_k
        self.vector_store = get_vector_store()

    def retrieve(
        self,
        query: str,
        top_k: Optional[int] = None,
        document_id: Optional[str] = None
    ) -> List[SearchResult]:
        k = top_k if top_k is not None else self.top_k
        return self.vector_store.search(query=query, top_k=k, document_id=document_id)

    def retrieve_context_bundle(
        self,
        query: str,
        top_k: Optional[int] = None,
        document_id: Optional[str] = None
    ) -> Tuple[str, List[SearchResult]]:
        """
        Retrieves top relevant chunks and formats them into a clean, numbered context block.
        Returns (formatted_context_string, list_of_search_results).
        """
        results = self.retrieve(query=query, top_k=top_k, document_id=document_id)
        if not results:
            return "", []

        context_blocks = []
        for r in results:
            header = f"=== CHUNK [Source: {r.source}, Index: {r.chunk_index}] ==="
            context_blocks.append(f"{header}\n{r.text}")

        formatted_context = "\n\n".join(context_blocks)
        return formatted_context, results

_RETRIEVER_INSTANCE = None

def get_retriever() -> Retriever:
    global _RETRIEVER_INSTANCE
    if _RETRIEVER_INSTANCE is None:
        _RETRIEVER_INSTANCE = Retriever()
    return _RETRIEVER_INSTANCE
