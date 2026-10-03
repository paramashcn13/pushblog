"""Storage abstraction: local disk for development, S3 for the cloud."""
import asyncio
import os

import aiofiles

from ..config import (
    STORAGE_BACKEND, UPLOAD_DIR, S3_BUCKET, S3_REGION, S3_PUBLIC_BASE_URL,
)

_s3_client = None


def _get_s3():
    global _s3_client
    if _s3_client is None:
        import boto3  # lazy import so local dev works without AWS set up
        # Credentials come from the IAM role in the cloud (or AWS_* env vars locally)
        _s3_client = boto3.client("s3", region_name=S3_REGION)
    return _s3_client


async def save_file(filename: str, content: bytes, content_type: str) -> str:
    """Store the file and return the URL/path the frontend should use."""
    if STORAGE_BACKEND == "s3":
        await asyncio.to_thread(
            _get_s3().put_object,
            Bucket=S3_BUCKET,
            Key=f"uploads/{filename}",
            Body=content,
            ContentType=content_type or "application/octet-stream",
            CacheControl="public, max-age=31536000, immutable",
        )
        base = S3_PUBLIC_BASE_URL or f"https://{S3_BUCKET}.s3.{S3_REGION}.amazonaws.com"
        return f"{base}/uploads/{filename}"

    async with aiofiles.open(os.path.join(UPLOAD_DIR, filename), "wb") as f:
        await f.write(content)
    return f"/uploads/{filename}"
