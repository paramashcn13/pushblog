from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models.user import User
from ..models.post import Post
from ..models.media import Media
from ..models.follow import Follow
from ..utils.permissions import can_view_post
from ..schemas import (
    PostCreate, PostUpdate, PostResponse, PostWithAuthor,
    UserResponse, ProjectResponse, MediaResponse
)
from ..utils.auth import get_current_user, get_optional_user

router = APIRouter(prefix="/api/posts", tags=["posts"])


def build_post_response(post: Post, current_user: Optional[User]) -> PostWithAuthor:
    # Build the response manually to map 'user' to 'author'
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
        media=[MediaResponse.model_validate(m) for m in post.media],
        likes_count=len(post.likes),
        comments_count=len(post.comments),
        is_liked=current_user is not None and any(
            like.user_id == current_user.user_id for like in post.likes
        ),
        author=UserResponse.model_validate(post.user),
        project=ProjectResponse.model_validate(post.project) if post.project else None
    )


@router.get("/explore", response_model=List[PostWithAuthor])
def explore_posts(
    limit: int = Query(20, le=50),
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_user)
):
    posts = db.query(Post).filter(
        Post.visibility == "public",
        Post.status == "published"
    ).order_by(Post.created_at.desc()).offset(offset).limit(limit).all()

    return [build_post_response(post, current_user) for post in posts]


@router.get("", response_model=List[PostWithAuthor])
def get_feed(
    limit: int = Query(20, le=50),
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get posts from followed users + own posts
    accepted_following_ids = select(Follow.following_id).where(
        Follow.follower_id == current_user.user_id,
        Follow.status == "accepted",
    )

    posts = db.query(Post).filter(
        Post.status == "published",
        or_(
            Post.user_id == current_user.user_id,
            Post.user_id.in_(accepted_following_ids),
        ),
    ).order_by(Post.created_at.desc()).offset(offset).limit(limit).all()

    return [build_post_response(post, current_user) for post in posts]


@router.get("/{post_id}", response_model=PostWithAuthor)
def get_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_user)
):
    post = db.query(Post).filter(Post.post_id == post_id).first()

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

    if not can_view_post(db, post, current_user):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

    return build_post_response(post, current_user)


@router.post("", response_model=PostWithAuthor)
def create_post(
    post_data: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = Post(
        user_id=current_user.user_id,
        project_id=post_data.project_id,
        title=post_data.title,
        content=post_data.content,
        version=post_data.version,
        change_type=post_data.change_type,
        visibility=post_data.visibility,
        status=post_data.status,
        release_impact={
            "breaking_changes": False,
            "affected_versions": None,
            "migration_steps": None,
            "upgrade_minutes": None,
        },
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    # Add media if provided
    if post_data.media:
        for i, media_item in enumerate(post_data.media):
            media = Media(
                post_id=post.post_id,
                media_url=media_item.media_url,
                media_type=media_item.media_type,
                caption=media_item.caption,
                upload_order=i
            )
            db.add(media)
        db.commit()
        db.refresh(post)

    return build_post_response(post, current_user)


@router.put("/{post_id}", response_model=PostWithAuthor)
def update_post(
    post_id: int,
    post_data: PostUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(Post).filter(
        Post.post_id == post_id,
        Post.user_id == current_user.user_id
    ).first()

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

    updates = post_data.model_dump(exclude_unset=True)
    if "status" in updates and updates["status"] is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Post status cannot be null"
        )

    for key, value in updates.items():
        setattr(post, key, value)

    db.commit()
    db.refresh(post)
    return build_post_response(post, current_user)


@router.delete("/{post_id}")
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(Post).filter(
        Post.post_id == post_id,
        Post.user_id == current_user.user_id
    ).first()

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

    db.delete(post)
    db.commit()
    return {"message": "Post deleted"}
