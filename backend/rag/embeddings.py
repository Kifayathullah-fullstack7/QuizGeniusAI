import os
import logging
from typing import List

logger = logging.getLogger("rag.embeddings")

_EMBEDDING_INSTANCE = None

class EmbeddingService:
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.model_name = model_name
        self._ef = None
        self._init_model()

    def _init_model(self):
        """Initializes the local embedding model once."""
        try:
            from chromadb.utils import embedding_functions
            # Uses local ONNX all-MiniLM-L6-v2 (384 dims) without requiring PyTorch
            self._ef = embedding_functions.DefaultEmbeddingFunction()
            logger.info(f"Initialized local ONNX embedding engine: {self.model_name}")
        except Exception as e:
            logger.warning(f"Could not initialize ChromaDB DefaultEmbeddingFunction: {e}. Falling back to basic TF-IDF vectors.")
            self._ef = None

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Embed a batch of document chunk texts."""
        if not texts:
            return []
        if self._ef is not None:
            try:
                embeddings = self._ef(texts)
                # Ensure it's python float lists
                return [list(map(float, emb)) for emb in embeddings]
            except Exception as e:
                logger.error(f"Error computing document embeddings: {e}")
        
        # Fallback hash-based deterministic normalized vector (384 dims) if engine fails
        return [self._fallback_embed(t) for t in texts]

    def embed_query(self, text: str) -> List[float]:
        """Embed a single search query."""
        res = self.embed_documents([text])
        return res[0] if res else [0.0] * 384

    def _fallback_embed(self, text: str) -> List[float]:
        """Deterministic 384-dimensional sparse projection fallback."""
        vec = [0.0] * 384
        for word in text.lower().split():
            h = hash(word) % 384
            vec[h] += 1.0
        # Normalize
        norm = sum(x * x for x in vec) ** 0.5
        if norm > 0:
            vec = [x / norm for x in vec]
        return vec

def get_embedding_service() -> EmbeddingService:
    global _EMBEDDING_INSTANCE
    if _EMBEDDING_INSTANCE is None:
        model_name = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
        _EMBEDDING_INSTANCE = EmbeddingService(model_name=model_name)
    return _EMBEDDING_INSTANCE
