from typing import List, Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field


class AuthorityLevel(str, Enum):
    LEVEL_1 = "LEVEL_1"  # Government / official regulatory source (e.g. NSP, UGC, AICTE, ePASS)
    LEVEL_2 = "LEVEL_2"  # Official university / academic institution
    LEVEL_3 = "LEVEL_3"  # Official scholarship foundation / CSR (e.g. SBI Foundation, LIC, Reliance)
    LEVEL_4 = "LEVEL_4"  # Trusted secondary source / accredited portal
    LEVEL_5 = "LEVEL_5"  # Unknown / unverified source


class DocumentChunk(BaseModel):
    """
    Structured document chunk model representing a discrete,
    provenance-retaining snippet of an authoritative document.
    """
    chunk_id: str = Field(..., description="Deterministic unique ID for the chunk")
    document_id: str = Field(..., description="Parent document unique identifier")
    document_title: str = Field(..., description="Full official title of the document")
    document_type: str = Field("guideline", description="Document type: guideline, circular, policy, exam_rule, brochure")
    source_name: str = Field(..., description="Authoritative source name")
    source_url: str = Field(..., description="Official URL of the document or portal")
    publisher: str = Field(..., description="Entity or government department publishing the document")
    authority_level: str = Field(AuthorityLevel.LEVEL_1.value, description="Authority ranking (LEVEL_1 to LEVEL_5)")
    page_number: int = Field(1, description="1-indexed physical or logical page number")
    section: str = Field("General", description="Section heading or structural context")
    content: str = Field(..., description="Cleaned, extracted text content of the chunk")
    content_hash: str = Field("", description="SHA-256 hash of the content for deduplication")
    published_date: str = Field("2026-01-01", description="Date of document publication (YYYY-MM-DD)")
    last_verified: str = Field("2026-08-01", description="Timestamp when evidence was last verified")
    retrieved_at: str = Field("2026-09-10", description="Date when document was retrieved")
    language: str = Field("en", description="Document language")
    embedding: Optional[List[float]] = None

    # Optional domain metadata
    program_name: Optional[str] = None
    country: Optional[str] = "India"
    state: Optional[str] = None
    category: Optional[str] = None
    version: Optional[str] = "1.0"
    # Domain metadata for scholarships
    scholarship_name: Optional[str] = None
    current_study: Optional[str] = None
    education_level: Optional[str] = None
    year_of_study: Optional[int] = None
    minimum_percentage: Optional[float] = None
    amount_inr: Optional[int] = None
    deadline: Optional[str] = None
    deadline_iso: Optional[str] = None
    application_link: Optional[str] = None
    extra_metadata: Dict[str, Any] = Field(default_factory=dict)

    # Backward compatibility aliases for existing code
    @property
    def title(self) -> str:
        return self.document_title

    @property
    def source(self) -> str:
        return self.source_name

    @property
    def page(self) -> int:
        return self.page_number

    def to_chroma_metadata(self) -> Dict[str, Any]:
        """
        Flattens chunk attributes into Chroma-compatible scalar metadata.
        ChromaDB metadata supports str, int, float, and bool.
        """
        meta = {
            "chunk_id": self.chunk_id,
            "document_id": self.document_id,
            "document_title": self.document_title,
            "document_type": self.document_type,
            "source_name": self.source_name,
            "source_url": self.source_url,
            "publisher": self.publisher,
            "authority_level": str(self.authority_level),
            "page_number": int(self.page_number),
            "section": self.section,
            "content_hash": self.content_hash,
            "published_date": self.published_date,
            "last_verified": self.last_verified,
            "retrieved_at": self.retrieved_at,
            "language": self.language,
            "country": self.country or "",
            "state": self.state or "",
            "program_name": self.program_name or "",
            "category": self.category or "",
            "version": self.version or "1.0",
        }
        if self.scholarship_name:
            meta["scholarship_name"] = self.scholarship_name
        if self.current_study:
            meta["current_study"] = self.current_study
        if self.education_level:
            meta["education_level"] = self.education_level
        if self.year_of_study is not None:
            meta["year_of_study"] = int(self.year_of_study)
        if self.minimum_percentage is not None:
            meta["minimum_percentage"] = float(self.minimum_percentage)
        if self.amount_inr is not None:
            meta["amount_inr"] = int(self.amount_inr)
        if self.deadline:
            meta["deadline"] = self.deadline
        if self.deadline_iso:
            meta["deadline_iso"] = self.deadline_iso
        if self.application_link:
            meta["application_link"] = self.application_link
        for k, v in self.extra_metadata.items():
            if isinstance(v, (str, int, float, bool)) and k not in meta:
                meta[k] = v
        return meta


class RetrievalResult(BaseModel):
    """
    Search result returned from semantic retrieval, containing
    content, relevance score, and complete provenance metadata.
    """
    chunk_id: str
    document_id: str
    title: str
    source: str
    source_url: str
    publisher: str = "Government / Official Body"
    authority_level: str = AuthorityLevel.LEVEL_1.value
    section: str
    page: int
    content: str
    score: float = Field(..., description="Semantic similarity score (0.0 to 1.0, higher is closer)")
    distance: float = Field(0.0, description="Raw distance metric from vector index")
    last_verified: str
    published_date: str = "2026-01-01"
    metadata: Dict[str, Any] = Field(default_factory=dict)
