from fastapi import APIRouter, UploadFile, File, HTTPException, status
from backend.app.schemas.profile import ExtractedProfileData
from backend.app.services.resume_parser import extract_text_from_pdf, parse_resume_text

router = APIRouter(prefix="/profile/resume", tags=["Resume Processing"])


@router.post("/extract", response_model=ExtractedProfileData)
async def extract_resume_data(file: UploadFile = File(...)):
    """
    Ingests PDF or text resume file, extracts text, recognizes structured
    academic, skill, and project information, and returns structured data
    for student review before saving.
    """
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file provided.")

    filename_lower = file.filename.lower()
    if not (filename_lower.endswith(".pdf") or filename_lower.endswith(".txt")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload a PDF or TXT file."
        )

    try:
        content = await file.read()
        if filename_lower.endswith(".pdf"):
            raw_text = extract_text_from_pdf(content)
        else:
            raw_text = content.decode("utf-8", errors="ignore")

        if not raw_text or len(raw_text.strip()) < 20:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Could not extract readable text from the uploaded file. Please ensure the document is not an image scan."
            )

        extracted = parse_resume_text(raw_text)
        return extracted

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process resume: {str(e)}"
        )
