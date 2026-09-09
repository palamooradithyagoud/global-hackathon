import logging
import threading
from typing import List, Optional
from backend.app.core.config import settings
from backend.app.services.rag.base import BaseEmbeddingProvider

logger = logging.getLogger(__name__)


class SentenceTransformersProvider(BaseEmbeddingProvider):
    """
    Local, production-quality semantic embedding provider using SentenceTransformers.
    Runs 100% offline without external API keys or recurring network requests.
    """

    def __init__(self, model_name: Optional[str] = None):
        self._model_name = model_name or settings.EMBEDDING_MODEL or "all-MiniLM-L6-v2"
        self._provider_name = "sentence_transformers"
        self._model = None
        self._dimension: Optional[int] = None
        self._lock = threading.Lock()

    def _get_model(self):
        if self._model is None:
            with self._lock:
                if self._model is None:
                    logger.info(f"[EmbeddingProvider] Loading local model '{self._model_name}'...")
                    try:
                        from sentence_transformers import SentenceTransformer
                        # Load model (weights already cached locally)
                        self._model = SentenceTransformer(self._model_name)
                        # Probe dimension
                        sample_emb = self._model.encode("dim test")
                        self._dimension = len(sample_emb)
                        logger.info(f"[EmbeddingProvider] Model '{self._model_name}' loaded successfully (dimension: {self._dimension}).")
                    except Exception as exc:
                        logger.error(f"[EmbeddingProvider] Failed to load SentenceTransformer '{self._model_name}': {exc}")
                        raise RuntimeError(f"Could not load embedding model '{self._model_name}': {exc}") from exc
        return self._model

    def embed_text(self, text: str) -> List[float]:
        """Embeds a single query string into a normalized dense float vector."""
        clean = (text or "").strip()
        if not clean:
            clean = "empty query"
        model = self._get_model()
        vec = model.encode(clean, normalize_embeddings=True)
        return vec.tolist()

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Embeds a batch of document texts into normalized dense float vectors."""
        if not texts:
            return []
        cleaned_texts = [t.strip() if t.strip() else "empty document" for t in texts]
        model = self._get_model()
        vecs = model.encode(cleaned_texts, batch_size=32, normalize_embeddings=True, show_progress_bar=False)
        return [v.tolist() for v in vecs]

    def embedding_dimension(self) -> int:
        if self._dimension is None:
            self._get_model()
        return self._dimension or 384

    def provider_name(self) -> str:
        return self._provider_name

    def model_name(self) -> str:
        return self._model_name


def get_embedding_provider() -> BaseEmbeddingProvider:
    """Factory function returning the configured embedding provider."""
    return SentenceTransformersProvider(model_name=settings.EMBEDDING_MODEL)


# Singleton instance for consistent use across ingestion and query
embedding_provider = SentenceTransformersProvider(model_name=settings.EMBEDDING_MODEL)
