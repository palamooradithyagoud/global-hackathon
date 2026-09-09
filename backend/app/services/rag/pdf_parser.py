import os
import re
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)


def extract_text_from_pdf(pdf_path: str) -> Dict[str, Any]:
    """
    Extracts text page-by-page from a PDF file preserving page numbers and structure.
    Uses PyMuPDF (fitz) if installed, with pypdf fallback.
    """
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF file not found at: {pdf_path}")

    filename = os.path.basename(pdf_path)
    base_id = os.path.splitext(filename)[0].lower().replace(" ", "_").replace("-", "_")

    pages_data: List[Dict[str, Any]] = []

    # 1. Try PyMuPDF (fitz)
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(pdf_path)
        title = doc.metadata.get("title") or filename.replace(".pdf", "").replace("_", " ").title()

        for page_idx, page in enumerate(doc, start=1):
            text = page.get_text("text") or ""
            clean = _clean_page_text(text)
            if clean:
                pages_data.append({
                    "page_number": page_idx,
                    "text": clean
                })
        doc.close()
        logger.info(f"[PDFParser] Extracted {len(pages_data)} pages from '{filename}' via PyMuPDF.")
        return {
            "document_id": base_id,
            "title": title,
            "filename": filename,
            "total_pages": len(pages_data),
            "pages": pages_data
        }
    except Exception as e_fitz:
        logger.warning(f"[PDFParser] PyMuPDF failed for '{filename}': {e_fitz}. Trying pypdf fallback...")

    # 2. Fallback to pypdf
    try:
        import pypdf
        reader = pypdf.PdfReader(pdf_path)
        title = filename.replace(".pdf", "").replace("_", " ").title()
        if reader.metadata and reader.metadata.title:
            title = reader.metadata.title

        for page_idx, page in enumerate(reader.pages, start=1):
            text = page.extract_text() or ""
            clean = _clean_page_text(text)
            if clean:
                pages_data.append({
                    "page_number": page_idx,
                    "text": clean
                })

        logger.info(f"[PDFParser] Extracted {len(pages_data)} pages from '{filename}' via pypdf.")
        return {
            "document_id": base_id,
            "title": title,
            "filename": filename,
            "total_pages": len(pages_data),
            "pages": pages_data
        }
    except Exception as e_pypdf:
        logger.error(f"[PDFParser] Both PyMuPDF and pypdf failed for '{filename}': {e_pypdf}")
        raise RuntimeError(f"Could not extract text from PDF '{filename}': {e_pypdf}") from e_pypdf


def _clean_page_text(raw_text: str) -> str:
    """
    Cleans extracted PDF page text while preserving line breaks, bullet points, and headers.
    Removes common standalone page number footers and excessive repeated whitespace.
    """
    if not raw_text:
        return ""

    lines = raw_text.split("\n")
    cleaned_lines = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        # Drop standalone page numbers like "Page 12 of 35" or just "12"
        if re.match(r"^(?:page\s+)?\d+(?:\s+of\s+\d+)?$", stripped, re.IGNORECASE):
            continue
        cleaned_lines.append(stripped)

    # Reassemble with normalized paragraph spacing
    cleaned_text = "\n".join(cleaned_lines)
    # Collapse multiple consecutive empty lines
    cleaned_text = re.sub(r"\n{3,}", "\n\n", cleaned_text)
    return cleaned_text.strip()
