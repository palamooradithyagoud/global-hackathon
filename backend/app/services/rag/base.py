from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from backend.app.services.rag.models import DocumentChunk, RetrievalResult


class BaseEmbeddingProvider(ABC):
    """Abstract interface for dense semantic embedding providers."""

    @abstractmethod
    def embed_text(self, text: str) -> List[float]:
        """Generate embedding vector for a single text query."""
        pass

    @abstractmethod
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Generate embedding vectors for multiple document chunks."""
        pass

    @abstractmethod
    def embedding_dimension(self) -> int:
        """Returns the fixed dimensionality of the embedding model."""
        pass

    @abstractmethod
    def provider_name(self) -> str:
        """Returns provider identifier (e.g. 'sentence_transformers')."""
        pass

    @abstractmethod
    def model_name(self) -> str:
        """Returns model identifier (e.g. 'all-MiniLM-L6-v2')."""
        pass


class BaseVectorStore(ABC):
    """Abstract interface for vector database storage and similarity retrieval."""

    @abstractmethod
    def add_documents(self, chunks: List[DocumentChunk]) -> int:
        """Adds chunks to the vector store."""
        pass

    @abstractmethod
    def upsert_documents(self, chunks: List[DocumentChunk]) -> int:
        """Idempotently adds or updates chunks in the vector store."""
        pass

    @abstractmethod
    def delete_documents(self, chunk_ids: List[str]) -> int:
        """Deletes chunks by their unique chunk IDs."""
        pass

    @abstractmethod
    def delete_by_document_id(self, document_id: str) -> int:
        """Deletes all chunks belonging to a specific document ID."""
        pass

    @abstractmethod
    def similarity_search(
        self,
        query: str,
        top_k: int = 4,
        filters: Optional[Dict[str, Any]] = None,
        min_score: float = 0.0
    ) -> List[RetrievalResult]:
        """Performs semantic similarity search with optional metadata filtering."""
        pass

    @abstractmethod
    def get_by_document_id(self, document_id: str) -> List[DocumentChunk]:
        """Retrieves all stored chunks for a given document."""
        pass

    @abstractmethod
    def health_check(self) -> Dict[str, Any]:
        """Returns operational status, count of chunks, and collection metadata."""
        pass

    @abstractmethod
    def clear(self) -> None:
        """Clears all chunks from the vector store."""
        pass

    @property
    @abstractmethod
    def total_chunks(self) -> int:
        """Returns total count of chunks in the collection."""
        pass
