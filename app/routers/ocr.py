from fastapi import APIRouter, UploadFile, File, HTTPException, status
from app.config import settings
from app.schemas.admin import OCRResponse
from app.services.ocr_service import process_certificate_ocr

router = APIRouter(prefix="/api", tags=["Document OCR"])

@router.post("/ocr", response_model=OCRResponse)
async def extract_certificate_data(
    file: UploadFile = File(..., description="Certificate image or document scan")
):
    """
    Extracts fields (income, community, name) from certificate scans.
    Protected behind OCR_ENABLED feature flag.
    NOTE: All extracted values are presented for citizen confirmation and never auto-submitted.
    """
    if not settings.OCR_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Document OCR service is currently disabled by server configuration."
        )

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )

    result = await process_certificate_ocr(file_bytes, file.filename or "certificate.png")
    return OCRResponse(**result)
