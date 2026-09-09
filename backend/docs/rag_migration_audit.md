# SkillCatalyst RAG System — Forensic Architecture Audit

**Date:** September 10, 2026  
**Auditor:** Senior AI / RAG Systems Engineer  
**Status:** Audit Complete — Ready for ChromaDB Migration

---

## 1. Executive Summary

This forensic audit evaluates the existing Retrieval-Augmented Generation (RAG) subsystem inside `backend/app/services/rag/` within the SkillCatalyst codebase.

The current system was built as an initial self-contained baseline using in-memory cosine similarity and custom 128-dimensional character tri-gram hashing. While it successfully establishes authoritative metadata provenance (sources, sections, page numbers, and URLs) and connects into the `searchKnowledgeBase` agent tool and `verifyClaim` layer, its vector storage and embedding mechanisms have severe production limitations.

This document details the current state, identifies critical weaknesses, and defines the phased migration plan to a persistent, production-grade **ChromaDB + SentenceTransformers** vector retrieval architecture.

---

## 2. Current RAG Architecture & Flow

The current request and retrieval flow operates as follows:

```text
User / Agent Query
       ↓
`searchKnowledgeBase` Agent Tool
       ↓
`backend.app.services.rag.retriever.search_knowledge_base()`
       ↓
Check if `vector_store.total_chunks == 0`:
   If empty → dynamically run `ingest_authoritative_corpus()`
       ↓
In-Memory Vector Search:
   Compute 128-d tri-gram embedding for query
   Iterate sequentially through Python list `self.chunks`
   Compute dot-product / cosine similarity
   Filter by `min_score` (default 0.20) and optional `filter_source`
   Sort descending and return top_k `RetrievalResult` objects
       ↓
`_execute_search_knowledge_base()` formats JSON evidence
       ↓
`verification.py` / `agent_orchestrator.py`
       ↓
LLM Response Synthesis with Provenance
```

---

## 3. Subsystem Breakdown

### 3.1 Data Models (`backend/app/services/rag/models.py`)
- Defines `DocumentChunk` and `RetrievalResult`.
- Tracks: `chunk_id`, `document_id`, `title`, `source`, `source_url`, `section`, `page`, `content`, `embedding`, `last_verified`.
- **Finding**: Good foundation, but lacks explicit authority levels (`LEVEL_1` through `LEVEL_5`), `document_type`, `publisher`, `content_hash`, `published_date`, and chunk-level deterministic IDs.

### 3.2 Metadata Registry (`backend/app/services/rag/metadata.py`)
- Hardcodes 11 authoritative entities (`NSP`, `UGC`, `AICTE`, `TELANGANA_EPASS`, `CBSE`, etc.).
- Validates that required keys (`document_id`, `title`, `source`, `source_url`, `content`, `last_verified`) are non-empty.
- **Finding**: Does not classify source authority or enforce tiering (e.g. government regulatory body vs. secondary source).

### 3.3 Chunking Engine (`backend/app/services/rag/chunking.py`)
- Splits text into paragraphs, extracts word tokens, and chunks into ~160 words with a 30-word overlap.
- **Finding**:
  - Naive whitespace word slicing does not preserve semantic sentence or heading structures.
  - Does not support structured document formats (PDF, DOCX) or extract page boundaries from actual multi-page files.
  - Token counts are rough approximations based on word counts.

### 3.4 Embeddings (`backend/app/services/rag/embeddings.py`)
- Uses FNV-1a character tri-gram feature hashing into a 128-dimensional vector, followed by L2 normalization.
- Cosine similarity is computed via dot-product.
- **Finding**:
  - Hashing is lexical and n-gram based, **not semantic**.
  - Synonyms (e.g., "stipend" vs. "scholarship" vs. "financial grant", or "eligibility" vs. "qualifying criteria") have near-zero lexical overlap and thus produce low similarity scores.
  - Vocabulary collisions and subword noise limit retrieval precision.

### 3.5 Vector Store (`backend/app/services/rag/vector_store.py`)
- In-memory `VectorStore` storing chunks in a native Python list (`self.chunks: List[DocumentChunk] = []`).
- **Finding**:
  - **Zero persistence**: Every application restart or worker reload wipes the vector store completely.
  - **Sequential scan**: $O(N)$ linear scan across all chunks on every query. While fast for 100 chunks, it does not scale to thousands of documents.
  - **Concurrent initialization race conditions**: If multiple requests hit the backend upon startup, `vector_store.total_chunks == 0` can trigger redundant ingestion passes concurrently.

### 3.6 Ingestion Pipeline (`backend/app/services/rag/ingestion.py`)
- Hardcodes ~20 authoritative text blobs directly in Python dictionaries.
- Iterates and chunks each dictionary, appending to `vector_store`.
- **Finding**:
  - No file-system ingestion pipeline for actual PDF or text documents.
  - Not idempotent on disk: re-running recreates chunk objects in memory without content hashing.

### 3.7 Retriever (`backend/app/services/rag/retriever.py`)
- Exposes `search_knowledge_base(query, top_k=4, min_score=0.18, filter_source=None)`.
- Exposes `format_retrieved_evidence_for_prompt()` which creates markdown formatted blocks.
- **Finding**: Coupling between retrieval and the in-memory store; lacks metadata filtering by authority level, publisher, or document type.

---

## 4. Current Weaknesses & Failure Modes

1. **Non-Persistent In-Memory Storage**:
   Process termination destroys the vector store. Cold boots require re-chunking and re-embedding.
2. **Lexical Feature Hashing vs. Semantic Embeddings**:
   Natural language queries containing paraphrased questions fail to match official bureaucratic phrasing.
3. **Absence of Hierarchical Authority Levels**:
   No differentiation between an official government gazette / central ministry guideline (Level 1) versus private or secondary sources.
4. **Lack of PDF / Multi-Page Document Ingestion**:
   Cannot ingest official PDF brochures, circulars, or notifications directly from disk.
5. **Missing Ingestion Idempotency & Deduplication**:
   No content hash checking (`content_hash`) or deterministic chunk ID upserts.
6. **No Vector Store Health Checks**:
   No `/health/rag` or observability into collection document counts, index status, or embedding dimensions.

---

## 5. Migration Strategy & Architecture Target

We will transition the RAG subsystem to:

```text
User / Agent Query
       ↓
`searchKnowledgeBase` Tool
       ↓
`Retriever` (ChromaRetriever)
       ↓
`EmbeddingProvider` (SentenceTransformers: all-MiniLM-L6-v2, 384-d, local)
       ↓
`VectorStore` Abstraction (BaseVectorStore)
       └── `ChromaVectorStore` (PersistentClient at `CHROMA_PERSIST_DIR`, collection `skillcatalyst_knowledge`)
       ↓
Ranked `RetrievalResult` (with full authority level & provenance metadata)
       ↓
Evidence Verification & Prompt Synthesis
```

### Key Invariants Preserved
- **PostgreSQL remains the sole source of truth** for structured student profiles, careers, skills, scholarships, and deterministic eligibility rules.
- **ChromaDB is strictly dedicated to unstructured authoritative documentation**.
- Existing API contracts (`POST /api/v1/assistant/chat`) and tool signatures (`searchKnowledgeBase`) remain 100% backward compatible.
- Local embeddings (`all-MiniLM-L6-v2`) run completely offline without external API cost or latency risks.
