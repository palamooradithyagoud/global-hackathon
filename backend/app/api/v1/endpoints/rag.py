from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.app.core.database import get_db
from backend.app.services.rag.vector_store import vector_store
from backend.app.services.rag.embeddings import embedding_provider
from backend.app.services.rag.retriever import search_knowledge_base
from backend.app.services.rag.ingestion import ingest_all_sources

router = APIRouter(prefix="/rag", tags=["RAG Knowledge Base"])


class RagQueryRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Search query")
    top_k: int = Field(4, ge=1, le=10, description="Number of chunks to return")
    authority_level: Optional[str] = Field(None, description="Optional minimum authority level (LEVEL_1 to LEVEL_5)")
    filter_source: Optional[str] = Field(None, description="Optional source name filter")


@router.get("/health")
def rag_health_check(db: Session = Depends(get_db)):
    """
    RAG Subsystem Health Check:
    Verifies ChromaDB persistence, collection status, embedding provider, and database connectivity.
    """
    # 1. Check ChromaDB
    chroma_health = vector_store.health_check()
    chroma_ok = chroma_health.get("status") == "healthy"

    # 2. Check Embeddings
    try:
        dim = embedding_provider.embedding_dimension()
        model_name = embedding_provider.model_name()
        embed_ok = dim > 0
    except Exception as exc:
        dim = 0
        model_name = "unknown"
        embed_ok = False

    # 3. Check Database
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    overall_status = "healthy" if (chroma_ok and embed_ok and db_ok) else "degraded"

    return {
        "status": overall_status,
        "chroma": "healthy" if chroma_ok else "unhealthy",
        "embeddings": "healthy" if embed_ok else "unhealthy",
        "database": "healthy" if db_ok else "unhealthy",
        "collection": chroma_health.get("collection_name", "skillcatalyst_knowledge"),
        "document_count": chroma_health.get("total_chunks", 0),
        "embedding_model": model_name,
        "embedding_dimension": dim,
        "persist_directory": chroma_health.get("persist_directory")
    }


@router.post("/query")
def query_knowledge_base(payload: RagQueryRequest):
    """Direct semantic retrieval endpoint for testing and UI integration."""
    results = search_knowledge_base(
        query=payload.query,
        top_k=payload.top_k,
        min_authority_level=payload.authority_level,
        filter_source=payload.filter_source
    )
    return {
        "query": payload.query,
        "results_count": len(results),
        "results": [r.model_dump() for r in results]
    }


@router.post("/ingest")
def trigger_ingestion(force: bool = Query(False, description="Force re-index")):
    """Triggers ingestion of corpus and raw document directory."""
    try:
        total = ingest_all_sources(force_reindex=force)
        return {
            "success": True,
            "total_chunks_indexed": total,
            "collection_chunks": vector_store.total_chunks
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {exc}")
