from backend.app.services.rag.chroma_store import ChromaVectorStore
from backend.app.services.rag.base import BaseVectorStore

# Global persistent ChromaDB vector store singleton
vector_store: BaseVectorStore = ChromaVectorStore()

__all__ = ["vector_store", "ChromaVectorStore", "BaseVectorStore"]
