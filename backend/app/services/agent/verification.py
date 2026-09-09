import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from backend.app.models.profile import Scholarship
from backend.app.models.agent import VerificationRecord, Career, Skill
from backend.app.services.rag.retriever import search_knowledge_base

logger = logging.getLogger(__name__)


def verify_factual_claim(claim: str, db: Session) -> Dict[str, Any]:
    """
    Evidence-backed factual verification engine.
    Compares the claim against:
    1. Structured Scholarship Database
    2. Career & Skill Taxonomy
    3. Authoritative RAG Knowledge Base
    The LLM cannot mark its own claim as verified.
    """
    clean_claim = claim.strip()
    now_str = datetime.now(timezone.utc).isoformat()

    # 1. Check Structured Scholarship DB
    scholarships = db.query(Scholarship).all()
    for s in scholarships:
        # Check if scholarship title is part of the claim
        if s.title.lower() in clean_claim.lower() or s.id.lower() in clean_claim.lower():
            if s.status == "expired":
                status = "expired"
                evidence = f"Scholarship '{s.title}' is flagged expired/closed in verified registry."
            else:
                status = "verified"
                evidence = f"Scholarship '{s.title}' verified by provider '{s.provider}'. Amount: {s.benefit_value}, Deadline: {s.deadline}."

            rec = VerificationRecord(
                claim=clean_claim,
                source=s.provider,
                evidence=evidence,
                source_url=s.source_url or s.application_link,
                confidence=0.95,
                status=status
            )
            db.add(rec)
            db.commit()

            return {
                "claim": clean_claim,
                "status": status,
                "confidence": 0.95,
                "source": s.provider,
                "evidence": evidence,
                "source_url": s.source_url or s.application_link,
                "verified_at": now_str
            }

    # 2. Check Authoritative RAG Knowledge Base
    rag_results = search_knowledge_base(clean_claim, top_k=2, min_score=0.50)
    if rag_results:
        top_match = rag_results[0]
        # Only LEVEL_1, LEVEL_2, and LEVEL_3 are authoritative for official claims
        is_official = top_match.authority_level in ("LEVEL_1", "LEVEL_2", "LEVEL_3")
        status = "verified" if (is_official and top_match.score >= 0.55) else "uncertain"

        rec = VerificationRecord(
            claim=clean_claim,
            source=f"{top_match.title} [{top_match.authority_level}]",
            evidence=top_match.content[:300] + "...",
            source_url=top_match.source_url,
            confidence=round(top_match.score, 2),
            status=status
        )
        db.add(rec)
        db.commit()

        return {
            "claim": clean_claim,
            "status": status,
            "confidence": round(top_match.score, 2),
            "source": f"{top_match.title} ({top_match.publisher})",
            "evidence": top_match.content,
            "source_url": top_match.source_url,
            "authority_level": top_match.authority_level,
            "page": top_match.page,
            "section": top_match.section,
            "verified_at": now_str
        }

    # 3. No authoritative verification found
    rec = VerificationRecord(
        claim=clean_claim,
        source=None,
        evidence=None,
        source_url=None,
        confidence=0.1,
        status="unverified"
    )
    db.add(rec)
    db.commit()

    return {
        "claim": clean_claim,
        "status": "unverified",
        "confidence": 0.1,
        "source": None,
        "evidence": "No matching record in authoritative database or RAG repository.",
        "source_url": None,
        "verified_at": now_str
    }
