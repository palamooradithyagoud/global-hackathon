import re
from typing import List, Dict, Any, Optional
from backend.app.services.rag.models import DocumentChunk, AuthorityLevel
from backend.app.services.rag.metadata import compute_content_hash, resolve_source_authority


def chunk_document(
    doc: Dict[str, Any],
    target_words: int = 350,      # ~500 tokens
    overlap_words: int = 60,      # ~85 tokens
    min_chunk_words: int = 40
) -> List[DocumentChunk]:
    """
    Section-aware and page-preserving chunking engine for authoritative documents.
    Generates deterministic chunk IDs, computes content hashes, and attaches full provenance.
    """
    doc_id = doc["document_id"]
    title = doc.get("title") or doc.get("document_title", "Official Guidelines")
    source_name = doc.get("source") or doc.get("source_name", "Official Source")
    source_url = doc.get("source_url", "")
    publisher = doc.get("publisher") or "Official Body"
    doc_type = doc.get("document_type", "guideline")
    auth_level = doc.get("authority_level") or resolve_source_authority(source_name, publisher)
    default_page = doc.get("page") or doc.get("page_number", 1)
    last_verified = doc.get("last_verified", "2026-08-01")
    published_date = doc.get("published_date", "2026-01-01")
    language = doc.get("language", "en")
    program_name = doc.get("program_name")
    state = doc.get("state")
    country = doc.get("country", "India")

    # If document has multi-page structure (from PDF parser)
    if "pages" in doc and isinstance(doc["pages"], list):
        all_chunks: List[DocumentChunk] = []
        for p_info in doc["pages"]:
            p_num = p_info.get("page_number", default_page)
            p_text = p_info.get("text", "").strip()
            if not p_text:
                continue

            page_chunks = _chunk_single_page_text(
                text=p_text,
                doc_id=doc_id,
                title=title,
                source_name=source_name,
                source_url=source_url,
                publisher=publisher,
                doc_type=doc_type,
                auth_level=auth_level,
                page_number=p_num,
                section=doc.get("section", "General"),
                last_verified=last_verified,
                published_date=published_date,
                language=language,
                program_name=program_name,
                state=state,
                country=country,
                target_words=target_words,
                overlap_words=overlap_words,
                min_chunk_words=min_chunk_words
            )
            all_chunks.extend(page_chunks)
        return all_chunks

    # Otherwise chunk flat text content
    raw_content = doc.get("content", "").strip()
    return _chunk_single_page_text(
        text=raw_content,
        doc_id=doc_id,
        title=title,
        source_name=source_name,
        source_url=source_url,
        publisher=publisher,
        doc_type=doc_type,
        auth_level=auth_level,
        page_number=default_page,
        section=doc.get("section", "General"),
        last_verified=last_verified,
        published_date=published_date,
        language=language,
        program_name=program_name,
        state=state,
        country=country,
        target_words=target_words,
        overlap_words=overlap_words,
        min_chunk_words=min_chunk_words
    )


def _chunk_single_page_text(
    text: str,
    doc_id: str,
    title: str,
    source_name: str,
    source_url: str,
    publisher: str,
    doc_type: str,
    auth_level: str,
    page_number: int,
    section: str,
    last_verified: str,
    published_date: str,
    language: str,
    program_name: Optional[str],
    state: Optional[str],
    country: str,
    target_words: int,
    overlap_words: int,
    min_chunk_words: int
) -> List[DocumentChunk]:
    if not text.strip():
        return []

    # Detect section headings within text
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    if not paragraphs:
        paragraphs = [text.strip()]

    # Extract words while detecting active section
    words = []
    current_section = section
    for p in paragraphs:
        # If line looks like a heading (short, all caps or starts with # or numbering)
        if len(p.split()) <= 10 and (p.isupper() or p.startswith("#") or re.match(r"^\d+\.\s+", p)):
            current_section = p.lstrip("#").strip()
        words.extend(p.split())

    if len(words) <= target_words:
        full_text = " ".join(words)
        c_hash = compute_content_hash(full_text)
        return [
            DocumentChunk(
                chunk_id=f"{doc_id}_p{page_number}_c1",
                document_id=doc_id,
                document_title=title,
                document_type=doc_type,
                source_name=source_name,
                source_url=source_url,
                publisher=publisher,
                authority_level=auth_level,
                page_number=page_number,
                section=current_section,
                content=full_text,
                content_hash=c_hash,
                published_date=published_date,
                last_verified=last_verified,
                language=language,
                program_name=program_name,
                state=state,
                country=country
            )
        ]

    chunks = []
    start = 0
    chunk_idx = 1
    seen_hashes = set()

    while start < len(words):
        end = min(start + target_words, len(words))
        chunk_words = words[start:end]
        chunk_text = " ".join(chunk_words)

        if len(chunk_words) >= min_chunk_words or not chunks:
            c_hash = compute_content_hash(chunk_text)
            if c_hash not in seen_hashes:
                seen_hashes.add(c_hash)
                chunks.append(
                    DocumentChunk(
                        chunk_id=f"{doc_id}_p{page_number}_c{chunk_idx}",
                        document_id=doc_id,
                        document_title=title,
                        document_type=doc_type,
                        source_name=source_name,
                        source_url=source_url,
                        publisher=publisher,
                        authority_level=auth_level,
                        page_number=page_number,
                        section=current_section,
                        content=chunk_text,
                        content_hash=c_hash,
                        published_date=published_date,
                        last_verified=last_verified,
                        language=language,
                        program_name=program_name,
                        state=state,
                        country=country
                    )
                )
                chunk_idx += 1

        start += max(1, target_words - overlap_words)
        if start >= len(words) or end >= len(words):
            break

    return chunks
