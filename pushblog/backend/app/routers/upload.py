import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File

from ..models.user import User
from ..utils.auth import get_current_user
from ..utils.storage import save_file

router = APIRouter(prefix="/api/upload", tags=["upload"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    file_ext = os.path.splitext(file.filename or "")[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size is 5MB"
        )

    unique_filename = f"{uuid.uuid4()}{file_ext}"
    url = await save_file(unique_filename, content, file.content_type)

    # url is "/uploads/x.png" (local) or a full https URL (S3/CloudFront)
    return {"url": url, "filename": unique_filename}
