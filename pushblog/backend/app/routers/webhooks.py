import hashlib
import hmac
import json
from urllib.parse import quote

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.post import Post
from ..models.project import Project

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


@router.post("/github/{project_id}", status_code=status.HTTP_202_ACCEPTED)
async def github_webhook(
    project_id: int,
    request: Request,
    db: Session = Depends(get_db),
    signature: str | None = Header(default=None, alias="X-Hub-Signature-256"),
    github_event: str | None = Header(default=None, alias="X-GitHub-Event"),
):
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project or not project.webhook_secret:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Webhook not found")

    body = await request.body()
    expected_signature = "sha256=" + hmac.new(
        project.webhook_secret.encode("utf-8"), body, hashlib.sha256
    ).hexdigest()
    if not signature or not hmac.compare_digest(signature, expected_signature):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid signature")

    if github_event != "release":
        return {"status": "ignored", "reason": "unsupported event"}

    try:
        payload = json.loads(body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON payload")

    if payload.get("action") != "published":
        return {"status": "ignored", "reason": "release is not published"}

    release = payload.get("release") or {}
    release_id = release.get("id")
    tag_name = release.get("tag_name")
    if release_id is None or not tag_name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Release ID and tag are required")

    repository = payload.get("repository") or {}
    if project.repo_url and repository.get("html_url", "").rstrip("/").lower() != project.repo_url.rstrip("/").lower():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Release repository does not match project")

    existing_post = db.query(Post).filter(
        Post.project_id == project.project_id,
        Post.github_release_id == str(release_id)
    ).first()
    if existing_post:
        return {"status": "duplicate", "post_id": existing_post.post_id}

    release_title = (release.get("name") or tag_name).strip()[:200]
    if not release_title:
        release_title = tag_name[:200]
    release_notes = release.get("body") or ""
    release_url = release.get("html_url")
    if not release_notes.strip():
        release_notes = f"Release {tag_name} published."
    if release_url:
        release_notes = f"{release_notes.rstrip()}\n\n[View release]({release_url})"

    previous_release = db.query(Post).filter(
        Post.project_id == project.project_id,
        Post.change_type == "release",
        Post.version.isnot(None)
    ).order_by(Post.created_at.desc()).first()
    compare_url = None
    repository_url = repository.get("html_url") or ""
    if previous_release and repository_url.startswith("https://"):
        compare_url = (
            f"{repository_url.rstrip('/')}/compare/"
            f"{quote(previous_release.version, safe='')}...{quote(tag_name, safe='')}"
        )

    post = Post(
        user_id=project.user_id,
        project_id=project.project_id,
        title=release_title,
        content=release_notes,
        version=tag_name[:50],
        change_type="release",
        visibility="public",
        status="draft",
        github_release_id=str(release_id),
        release_compare_url=compare_url,
        release_impact={
            "breaking_changes": False,
            "affected_versions": None,
            "migration_steps": None,
            "upgrade_minutes": None,
        },
    )
    db.add(post)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        existing_post = db.query(Post).filter(
            Post.project_id == project.project_id,
            Post.github_release_id == str(release_id)
        ).first()
        if existing_post:
            return {"status": "duplicate", "post_id": existing_post.post_id}
        raise

    db.refresh(post)
    return {"status": "draft_created", "post_id": post.post_id}