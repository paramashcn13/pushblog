from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import engine, Base, upgrade_schema
from .config import UPLOAD_DIR, CORS_ORIGINS, AUTO_CREATE_TABLES, STORAGE_BACKEND
from .routers import (
    auth_router, users_router, projects_router,
    posts_router, social_router, upload_router, webhooks_router
)

if AUTO_CREATE_TABLES:
    Base.metadata.create_all(bind=engine)
    upgrade_schema()

app = FastAPI(
    title="PushBlog API",
    description="Developer changelog and devlog platform",
    version="1.0.0"
)

# CORS: only the configured frontend origins (set CORS_ORIGINS in the environment)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploads from disk only for local storage; with S3 they come from the bucket/CDN
if STORAGE_BACKEND == "local":
    app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(projects_router)
app.include_router(posts_router)
app.include_router(social_router)
app.include_router(upload_router)
app.include_router(webhooks_router)


@app.get("/")
def root():
    return {"message": "Welcome to PushBlog API", "docs": "/docs"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
