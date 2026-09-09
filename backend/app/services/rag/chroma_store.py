import os
import logging
import threading
from typing import List, Dict, Any, Optional

import chromadb
from chromadb.config import Settings as ChromaSettings

from backend.app.core.config import settings
from backend.app.services.rag.base import BaseVectorStore
from backend.app.services.rag.models import DocumentChunk, RetrievalResult, AuthorityLevel
from backend.app.services.rag.embeddings import embedding_provider, BaseEmbeddingProvider

logger = logging.getLogger(__name__)


class ChromaVectorStore(BaseVectorStore):
    """
    Persistent ChromaDB vector store for unstructured authoritative document chunks.
    Ensures idempotence, local disk persistence, and exact dimension validation.
    """

    def __init__(
        self,
        persist_dir: Optional[str] = None,
        collection_name: Optional[str] = None,
        embedder: Optional[BaseEmbeddingProvider] = None,
        api_key: Optional[str] = None,
        tenant: Optional[str] = None,
        database: Optional[str] = None,
        use_cloud: Optional[bool] = None
    ):
        self.persist_dir = persist_dir or settings.CHROMA_PERSIST_DIR or "./data/chroma"
        self.collection_name = collection_name or settings.CHROMA_COLLECTION_NAME or "skillcatalyst_knowledge"
        self.embedder = embedder or embedding_provider
        self.api_key = api_key or settings.CHROMA_API_KEY
        self.tenant = tenant or settings.CHROMA_TENANT or "214d5420-8e7c-4134-a9a5-f3b1689c790b"
        self.database = database or settings.CHROMA_DATABASE or "GlobalHackathon"
        self.use_cloud = use_cloud if use_cloud is not None else settings.CHROMA_USE_CLOUD
        self._client = None
        self._collection = None
        self._lock = threading.Lock()

    @property
    def is_cloud(self) -> bool:
        return bool(
            self.use_cloud
            or (self.api_key and self.api_key.strip() and self.api_key != "YOUR_API_KEY")
        )

    def _ensure_initialized(self):
        """Idempotently initializes the persistent Chroma client (Cloud or Local Persistent) and collection."""
        if self._collection is None:
            with self._lock:
                if self._collection is None:
                    if self.is_cloud and hasattr(chromadb, "CloudClient"):
                        logger.info(
                            f"[ChromaVectorStore] Initializing Chroma CloudClient (tenant={self.tenant}, database={self.database})..."
                        )
                        self._client = chromadb.CloudClient(
                            api_key=self.api_key,
                            tenant=self.tenant,
                            database=self.database,
                            settings=ChromaSettings(
                                anonymized_telemetry=False
                            )
                        )
                    else:
                        os.makedirs(self.persist_dir, exist_ok=True)
                        logger.info(f"[ChromaVectorStore] Initializing PersistentClient at '{self.persist_dir}'...")

                        self._client = chromadb.PersistentClient(
                            path=self.persist_dir,
                            settings=ChromaSettings(
                                anonymized_telemetry=False,
                                allow_reset=True
                            )
                        )

                    expected_dim = self.embedder.embedding_dimension()
                    model_name = self.embedder.model_name()

                    # Get or create collection with cosine distance
                    try:
                        self._collection = self._client.get_or_create_collection(
                            name=self.collection_name,
                            metadata={
                                "hnsw:space": "cosine",
                                "embedding_dimension": expected_dim,
                                "embedding_model": model_name,
                                "description": "SkillCatalyst Authoritative Knowledge Base"
                            }
                        )
                    except Exception as e:
                        logger.error(f"[ChromaVectorStore] Failed to get_or_create_collection: {e}")
                        raise

                    # Dimension validation check on existing collection
                    coll_meta = self._collection.metadata or {}
                    stored_dim = coll_meta.get("embedding_dimension")
                    if stored_dim and int(stored_dim) != expected_dim:
                        raise ValueError(
                            f"Collection '{self.collection_name}' has dimension {stored_dim}, "
                            f"but active embedding model '{model_name}' has dimension {expected_dim}. "
                            f"Incompatible embedding model detected."
                        )

                    logger.info(
                        f"[ChromaVectorStore] Collection '{self.collection_name}' ready. "
                        f"Current chunks: {self._collection.count()}"
                    )

    @property
    def collection(self):
        self._ensure_initialized()
        return self._collection

    def add_documents(self, chunks: List[DocumentChunk]) -> int:
        """Adds chunks to collection without overwriting existing IDs."""
        return self.upsert_documents(chunks)

    def upsert_documents(self, chunks: List[DocumentChunk]) -> int:
        """
        Idempotently inserts or updates chunks in the Chroma collection.
        Computes embeddings in batch and attaches full scalar metadata.
        """
        if not chunks:
            return 0

        self._ensure_initialized()

        ids = [c.chunk_id for c in chunks]
        documents = [c.content for c in chunks]
        metadatas = [c.to_chroma_metadata() for c in chunks]

        # Extract or compute embeddings
        texts_to_embed = []
        indices_to_embed = []
        embeddings = [None] * len(chunks)

        for i, c in enumerate(chunks):
            if c.embedding and len(c.embedding) == self.embedder.embedding_dimension():
                embeddings[i] = c.embedding
            else:
                texts_to_embed.append(f"{c.document_title} - {c.section}: {c.content}")
                indices_to_embed.append(i)

        if texts_to_embed:
            generated_embeddings = self.embedder.embed_documents(texts_to_embed)
            for idx, emb in zip(indices_to_embed, generated_embeddings):
                embeddings[idx] = emb
                chunks[idx].embedding = emb

        # Batch upsert into Chroma
        batch_size = 64
        total_upserted = 0
        for b_start in range(0, len(chunks), batch_size):
            b_end = min(b_start + batch_size, len(chunks))
            self.collection.upsert(
                ids=ids[b_start:b_end],
                documents=documents[b_start:b_end],
                metadatas=metadatas[b_start:b_end],
                embeddings=embeddings[b_start:b_end]
            )
            total_upserted += (b_end - b_start)

        logger.info(f"[ChromaVectorStore] Successfully upserted {total_upserted} chunks into '{self.collection_name}'.")
        return total_upserted

    def delete_documents(self, chunk_ids: List[str]) -> int:
        """Deletes chunks by their IDs."""
        if not chunk_ids:
            return 0
        self._ensure_initialized()
        before_count = self.total_chunks
        self.collection.delete(ids=chunk_ids)
        after_count = self.total_chunks
        return max(0, before_count - after_count)

    def delete_by_document_id(self, document_id: str) -> int:
        """Deletes all chunks belonging to a document ID."""
        if not document_id:
            return 0
        self._ensure_initialized()
        before_count = self.total_chunks
        self.collection.delete(where={"document_id": document_id})
        after_count = self.total_chunks
        return max(0, before_count - after_count)

    def similarity_search(
        self,
        query: str,
        top_k: int = 4,
        filters: Optional[Dict[str, Any]] = None,
        min_score: float = 0.15
    ) -> List[RetrievalResult]:
        """
        Performs semantic cosine similarity search over ChromaDB with optional metadata filtering.
        Maps cosine distance to normalized similarity score (1.0 - distance).
        """
        clean_query = (query or "").strip()
        if not clean_query:
            return []

        self._ensure_initialized()
        if self.total_chunks == 0:
            return []

        query_emb = self.embedder.embed_text(clean_query)

        # Build Chroma where clause
        where_clause = None
        if filters:
            clean_filters = {k: v for k, v in filters.items() if v is not None}
            if len(clean_filters) == 1:
                where_clause = clean_filters
            elif len(clean_filters) > 1:
                where_clause = {"$and": [{k: v} for k, v in clean_filters.items()]}

        fetch_k = min(top_k * 2, max(top_k, 10))
        try:
            results = self.collection.query(
                query_embeddings=[query_emb],
                n_results=min(fetch_k, self.total_chunks),
                where=where_clause,
                include=["documents", "metadatas", "distances"]
            )
        except Exception as exc:
            logger.warning(f"[ChromaVectorStore] Query failed with filters {where_clause}: {exc}. Retrying without filter...")
            results = self.collection.query(
                query_embeddings=[query_emb],
                n_results=min(fetch_k, self.total_chunks),
                include=["documents", "metadatas", "distances"]
            )

        if not results or not results["ids"] or not results["ids"][0]:
            return []

        ids = results["ids"][0]
        docs = results["documents"][0]
        metas = results["metadatas"][0]
        distances = results["distances"][0]

        retrieval_results: List[RetrievalResult] = []
        for chunk_id, doc_text, meta, dist in zip(ids, docs, metas, distances):
            # For cosine distance, distance = 1 - cos_sim.
            # Convert to similarity score in [0.0, 1.0]
            sim_score = max(0.0, min(1.0, 1.0 - float(dist)))

            if sim_score < min_score:
                continue

            retrieval_results.append(
                RetrievalResult(
                    chunk_id=chunk_id,
                    document_id=meta.get("document_id", ""),
                    title=meta.get("document_title", ""),
                    source=meta.get("source_name", ""),
                    source_url=meta.get("source_url", ""),
                    publisher=meta.get("publisher", "Official Body"),
                    authority_level=meta.get("authority_level", AuthorityLevel.LEVEL_1.value),
                    section=meta.get("section", "General"),
                    page=int(meta.get("page_number", 1)),
                    content=doc_text,
                    score=round(sim_score, 3),
                    distance=round(float(dist), 4),
                    last_verified=meta.get("last_verified", "2026-08-01"),
                    published_date=meta.get("published_date", "2026-01-01"),
                    metadata=meta
                )
            )

        # Sort descending by similarity score
        retrieval_results.sort(key=lambda r: r.score, reverse=True)
        return retrieval_results[:top_k]

    def get_by_document_id(self, document_id: str) -> List[DocumentChunk]:
        """Fetches all stored chunks for a specific document ID."""
        self._ensure_initialized()
        data = self.collection.get(
            where={"document_id": document_id},
            include=["documents", "metadatas"]
        )
        if not data or not data["ids"]:
            return []

        chunks = []
        for cid, doc, meta in zip(data["ids"], data["documents"], data["metadatas"]):
            chunks.append(
                DocumentChunk(
                    chunk_id=cid,
                    document_id=meta.get("document_id", document_id),
                    document_title=meta.get("document_title", ""),
                    document_type=meta.get("document_type", "guideline"),
                    source_name=meta.get("source_name", ""),
                    source_url=meta.get("source_url", ""),
                    publisher=meta.get("publisher", ""),
                    authority_level=meta.get("authority_level", AuthorityLevel.LEVEL_1.value),
                    page_number=int(meta.get("page_number", 1)),
                    section=meta.get("section", "General"),
                    content=doc,
                    content_hash=meta.get("content_hash", ""),
                    published_date=meta.get("published_date", "2026-01-01"),
                    last_verified=meta.get("last_verified", "2026-08-01"),
                    retrieved_at=meta.get("retrieved_at", "2026-09-10"),
                    language=meta.get("language", "en")
                )
            )
        return chunks

    def clear(self) -> None:
        """Clears all entries in the collection."""
        self._ensure_initialized()
        if self._client:
            try:
                self._client.delete_collection(self.collection_name)
            except Exception:
                pass
            self._collection = self._client.create_collection(
                name=self.collection_name,
                metadata={
                    "hnsw:space": "cosine",
                    "embedding_dimension": self.embedder.embedding_dimension(),
                    "embedding_model": self.embedder.model_name()
                }
            )

    @property
    def total_chunks(self) -> int:
        self._ensure_initialized()
        try:
            return self.collection.count()
        except Exception:
            return 0

    def health_check(self) -> Dict[str, Any]:
        """Provides a comprehensive health status of the persistent Chroma store."""
        try:
            self._ensure_initialized()
            count = self.total_chunks
            res = {
                "status": "healthy",
                "provider": "chromadb",
                "mode": "cloud" if self.is_cloud else "local_persistent",
                "persist_directory": self.persist_dir,
                "collection_name": self.collection_name,
                "total_chunks": count,
                "embedding_provider": self.embedder.provider_name(),
                "embedding_model": self.embedder.model_name(),
                "embedding_dimension": self.embedder.embedding_dimension()
            }
            if self.is_cloud:
                res["tenant"] = self.tenant
                res["database"] = self.database
            return res
        except Exception as exc:
            return {
                "status": "unhealthy",
                "error": str(exc),
                "mode": "cloud" if self.is_cloud else "local_persistent",
                "persist_directory": self.persist_dir,
                "collection_name": self.collection_name
            }
