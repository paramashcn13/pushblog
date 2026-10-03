import os

from dotenv import load_dotenv

load_dotenv()  # reads backend/.env locally; in the cloud real env vars are used


def _require(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


# --- Core ---
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg:///pushblog")
SECRET_KEY = _require("SECRET_KEY")  # no default on purpose
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 1 week

# --- CORS: comma-separated list of allowed frontend origins ---
CORS_ORIGINS = [
    o.strip()
    for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    if o.strip()
]

# --- Schema management ---
# True = create tables on startup (fine for dev / course demo).
AUTO_CREATE_TABLES = os.getenv("AUTO_CREATE_TABLES", "true").lower() == "true"

# --- File storage: "local" (dev) or "s3" (cloud) ---
STORAGE_BACKEND = os.getenv("STORAGE_BACKEND", "local").lower()
UPLOAD_DIR = os.getenv(
    "UPLOAD_DIR",
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads"),
)
S3_BUCKET = os.getenv("S3_BUCKET", "")
S3_REGION = os.getenv("S3_REGION", "ap-south-1")
# Public base URL of the bucket or CloudFront distribution, e.g. https://dxxxx.cloudfront.net
S3_PUBLIC_BASE_URL = os.getenv("S3_PUBLIC_BASE_URL", "").rstrip("/")

if STORAGE_BACKEND == "s3" and not S3_BUCKET:
    raise RuntimeError("STORAGE_BACKEND=s3 requires S3_BUCKET to be set")

if STORAGE_BACKEND == "local":
    os.makedirs(UPLOAD_DIR, exist_ok=True)
