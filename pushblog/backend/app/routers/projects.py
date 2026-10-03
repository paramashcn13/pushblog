from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List
import secrets

from ..database import get_db
from ..models.user import User
from ..models.project import Project
from ..models.post import Post
from ..schemas import (
    MediaResponse, PostWithAuthor, ProjectCreate, ProjectDetailResponse,
    ProjectDiscoveryResponse, ProjectResponse, ProjectUpdate, UserResponse,
)
from ..utils.auth import get_current_user, get_optional_user

router = APIRouter(prefix="/api/projects", tags=["projects"])


def build_discovery_post(post: Post, current_user: User | None) -> PostWithAuthor:
    return PostWithAuthor(
        post_id=post.post_id,
        user_id=post.user_id,
        project_id=post.project_id,
        title=post.title,
        content=post.content,
        version=post.version,
        change_type=post.change_type,
        visibility=post.visibility,
        status=post.status,
        release_compare_url=post.release_compare_url,
        release_impact=post.release_impact,
        created_at=post.created_at,
        updated_at=post.updated_at,
        media=[MediaResponse.model_validate(media) for media in post.media],
        likes_count=len(post.likes),
        comments_count=len(post.comments),
        is_liked=current_user is not None and any(
            like.user_id == current_user.user_id for like in post.likes
        ),
        author=UserResponse.model_validate(post.user),
        project=ProjectResponse.model_validate(post.project),
    )


@router.get("/discover", response_model=List[ProjectDiscoveryResponse])
def discover_projects(
    limit: int = Query(20, le=50),
    db: Session = Depends(get_db),
):
    project_rows = db.query(
        Project,
        func.count(Post.post_id).label("updates_count"),
        func.max(Post.created_at).label("updated_at"),
    ).join(
        Post, Post.project_id == Project.project_id
    ).filter(
        Post.visibility == "public",
        Post.status == "published",
    ).group_by(Project.project_id).order_by(
        func.max(Post.created_at).desc()
    ).limit(limit).all()

    results = []
    for project, updates_count, updated_at in project_rows:
        latest_version = db.query(Post.version).filter(
            Post.project_id == project.project_id,
            Post.visibility == "public",
            Post.status == "published",
            Post.version.isnot(None),
        ).order_by(Post.created_at.desc()).first()
        results.append(ProjectDiscoveryResponse(
            project_id=project.project_id,
            user_id=project.user_id,
            name=project.name,
            description=project.description,
            repo_url=project.repo_url,
            created_at=project.created_at,
            owner=UserResponse.model_validate(project.user),
            updates_count=updates_count,
            current_version=latest_version[0] if latest_version else None,
            updated_at=updated_at,
        ))
    return results


@router.get("/discover/{project_id}", response_model=ProjectDetailResponse)
def discover_project_detail(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    updates = db.query(Post).filter(
        Post.project_id == project_id,
        Post.visibility == "public",
        Post.status == "published",
    ).order_by(Post.created_at.desc()).limit(30).all()
    if not updates:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    versions = [post.version for post in updates if post.version]
    return ProjectDetailResponse(
        project_id=project.project_id,
        user_id=project.user_id,
        name=project.name,
        description=project.description,
        repo_url=project.repo_url,
        created_at=project.created_at,
        owner=UserResponse.model_validate(project.user),
        updates_count=db.query(Post).filter(
            Post.project_id == project_id,
            Post.visibility == "public",
            Post.status == "published",
        ).count(),
        current_version=versions[0] if versions else None,
        updated_at=updates[0].created_at,
        recent_updates=[build_discovery_post(post, current_user) for post in updates],
    )


@router.get("", response_model=List[ProjectResponse])
def get_my_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    projects = db.query(Project).filter(
        Project.user_id == current_user.user_id
    ).order_by(Project.created_at.desc()).all()
    return projects


@router.post("", response_model=ProjectResponse)
def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = Project(
        user_id=current_user.user_id,
        name=project_data.name,
        description=project_data.description,
        repo_url=project_data.repo_url,
        webhook_secret=secrets.token_hex(32)
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/{project_id}/github-webhook")
def get_github_webhook_config(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(
        Project.project_id == project_id,
        Project.user_id == current_user.user_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    if not project.webhook_secret:
        project.webhook_secret = secrets.token_hex(32)
        db.commit()
        db.refresh(project)

    return {
        "webhook_path": f"/api/webhooks/github/{project.project_id}",
        "webhook_secret": project.webhook_secret,
        "events": ["release"],
    }


@router.post("/{project_id}/github-webhook/rotate")
def rotate_github_webhook_secret(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(
        Project.project_id == project_id,
        Project.user_id == current_user.user_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    project.webhook_secret = secrets.token_hex(32)
    db.commit()
    db.refresh(project)
    return {
        "webhook_path": f"/api/webhooks/github/{project.project_id}",
        "webhook_secret": project.webhook_secret,
        "events": ["release"],
    }


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(
        Project.project_id == project_id,
        Project.user_id == current_user.user_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    return project


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(
        Project.project_id == project_id,
        Project.user_id == current_user.user_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    for key, value in project_data.model_dump(exclude_unset=True).items():
        setattr(project, key, value)

    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(
        Project.project_id == project_id,
        Project.user_id == current_user.user_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    db.delete(project)
    db.commit()
    return {"message": "Project deleted"}
