import hashlib
from typing import Dict, Any, Optional
from backend.app.services.rag.models import AuthorityLevel


AUTHORITATIVE_SOURCES = {
    "NSP": {
        "name": "National Scholarship Portal (scholarships.gov.in)",
        "publisher": "Ministry of Electronics & Information Technology / Ministry of Education, Govt of India",
        "url": "https://scholarships.gov.in",
        "authority_level": AuthorityLevel.LEVEL_1.value
    },
    "UGC": {
        "name": "University Grants Commission (ugc.ac.in)",
        "publisher": "Department of Higher Education, Ministry of Education, Govt of India",
        "url": "https://www.ugc.gov.in",
        "authority_level": AuthorityLevel.LEVEL_1.value
    },
    "AICTE": {
        "name": "All India Council for Technical Education (aicte-india.org)",
        "publisher": "Ministry of Education, Govt of India",
        "url": "https://www.aicte-india.org",
        "authority_level": AuthorityLevel.LEVEL_1.value
    },
    "TELANGANA_EPASS": {
        "name": "Telangana Electronic Payment & Application System (telanganaepass.cgg.gov.in)",
        "publisher": "Welfare Departments, Government of Telangana",
        "url": "https://telanganaepass.cgg.gov.in",
        "authority_level": AuthorityLevel.LEVEL_1.value
    },
    "CBSE": {
        "name": "Central Board of Secondary Education (cbse.gov.in)",
        "publisher": "Ministry of Education, Govt of India",
        "url": "https://www.cbse.gov.in",
        "authority_level": AuthorityLevel.LEVEL_1.value
    },
    "NTA": {
        "name": "National Testing Agency (nta.ac.in)",
        "publisher": "Ministry of Education, Govt of India",
        "url": "https://nta.ac.in",
        "authority_level": AuthorityLevel.LEVEL_1.value
    },
    "GATE_IIT": {
        "name": "GATE Official Organizing Institute (gate2026.iit.ac.in)",
        "publisher": "Indian Institute of Technology (Organizing Institute)",
        "url": "https://gate2026.iit.ac.in",
        "authority_level": AuthorityLevel.LEVEL_2.value
    },
    "IIT_BOMBAY": {
        "name": "IIT Bombay Academic Senate",
        "publisher": "Indian Institute of Technology Bombay",
        "url": "https://www.iitb.ac.in",
        "authority_level": AuthorityLevel.LEVEL_2.value
    },
    "LIC_GJSS": {
        "name": "LIC Golden Jubilee Scholarship Scheme (licindia.in)",
        "publisher": "Life Insurance Corporation of India Golden Jubilee Foundation",
        "url": "https://www.licindia.in",
        "authority_level": AuthorityLevel.LEVEL_3.value
    },
    "SBI_FOUNDATION": {
        "name": "SBI Foundation ASHA Scholarship (sbiashascholarship.co.in)",
        "publisher": "SBI Foundation CSR Directorate",
        "url": "https://www.sbifoundation.in",
        "authority_level": AuthorityLevel.LEVEL_3.value
    },
    "RELIANCE_FOUNDATION": {
        "name": "Reliance Foundation Scholarships (reliancefoundation.org)",
        "publisher": "Reliance Foundation",
        "url": "https://www.reliancefoundation.org",
        "authority_level": AuthorityLevel.LEVEL_3.value
    },
    "TATA_CAPITAL": {
        "name": "Tata Capital Pankh Scholarship (tatacapital.com)",
        "publisher": "Tata Capital CSR Trust",
        "url": "https://www.tatacapital.com",
        "authority_level": AuthorityLevel.LEVEL_3.value
    },
    "ONGC_FOUNDATION": {
        "name": "ONGC Foundation Scholarship (ongcfoundation.org)",
        "publisher": "ONGC Foundation (Govt of India Undertaking)",
        "url": "https://www.ongcfoundation.org",
        "authority_level": AuthorityLevel.LEVEL_3.value
    }
}


def compute_content_hash(text: str) -> str:
    """Computes deterministic SHA-256 hash of normalized text for deduplication."""
    clean = " ".join(text.strip().split())
    return hashlib.sha256(clean.encode("utf-8")).hexdigest()


def resolve_source_authority(source_name: str, publisher: Optional[str] = None) -> str:
    """Resolves authoritative level for a given source name or publisher."""
    s_lower = (source_name or "").lower()
    p_lower = (publisher or "").lower()

    # Check known sources dictionary
    for k, info in AUTHORITATIVE_SOURCES.items():
        if k.lower() in s_lower or info["name"].lower() in s_lower or info["publisher"].lower() in p_lower:
            return info["authority_level"]

    # Keyword heuristics
    gov_keywords = ["gov.in", "nic.in", "ministry", "government", "aicte", "ugc", "cgg.gov.in", "epass", "cbse", "nta"]
    if any(kw in s_lower or kw in p_lower for kw in gov_keywords):
        return AuthorityLevel.LEVEL_1.value

    edu_keywords = ["iit", "nit", "iiit", "university", "institute", "ac.in", "college"]
    if any(kw in s_lower or kw in p_lower for kw in edu_keywords):
        return AuthorityLevel.LEVEL_2.value

    scholarship_keywords = ["foundation", "trust", "lic", "sbi", "reliance", "tata", "ongc", "corporate csr"]
    if any(kw in s_lower or kw in p_lower for kw in scholarship_keywords):
        return AuthorityLevel.LEVEL_3.value

    return AuthorityLevel.LEVEL_4.value


def validate_document_metadata(doc: Dict[str, Any]) -> bool:
    """Ensures documents adhere to authoritative provenance requirements."""
    required_keys = ["document_id", "title", "content"]
    for k in required_keys:
        if not doc.get(k):
            return False
    return True
