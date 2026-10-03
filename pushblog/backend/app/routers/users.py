from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.user import User
from ..models.profile import Profile
from ..models.follow import Follow
from ..models.post import Post
from ..schemas import (
    UserResponse, UserWithProfile, ProfileCreate, ProfileResponse, PostWithAuthor,
    ProjectResponse, MediaResponse
)
from ..utils.auth import get_current_user, get_optional_user

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/{username}", response_model=UserWithProfile)
def get_user(
    username: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_user)
):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    followers_count = db.query(Follow).filter(Follow.following_id == user.user_id).count()
    following_count = db.query(Follow).filter(Follow.follower_id == user.user_id).count()

    response = UserWithProfile.model_validate(user)
    response.followers_count = followers_count
    response.following_count = following_count

    if user.profile:
        response.profile = ProfileResponse.model_validate(user.profile)

    return response


@router.put("/profile", response_model=ProfileResponse)
def update_profile(
    profile_data: ProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.user_id).first()

    if not profile:
        profile = Profile(user_id=current_user.user_id)
        db.add(profile)

    for key, value in profile_data.model_dump(exclude_unset=True).items():
        setattr(profile, key, value)

    db.commit()
    db.refresh(profile)
    return profile


@router.get("/{username}/posts", response_model=List[PostWithAuthor])
def get_user_posts(
    username: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_user)
):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    query = db.query(Post).filter(Post.user_id == user.user_id)

    # If not the owner, only show public posts
    if not current_user or current_user.user_id != user.user_id:
        query = query.filter(Post.visibility == "public")

    posts = query.order_by(Post.created_at.desc()).all()

    result = []
    for post in posts:
        post_data = PostWithAuthor(
            post_id=post.post_id,
            user_id=post.user_id,
            project_id=post.project_id,
            title=post.title,
            content=post.content,
            version=post.version,
            change_type=post.change_type,
            visibility=post.visibility,
            created_at=post.created_at,
            updated_at=post.updated_at,
            media=[MediaResponse.model_validate(m) for m in post.media],
            likes_count=len(post.likes),
            comments_count=len(post.comments),
            is_liked=current_user is not None and any(
                like.user_id == current_user.user_id for like in post.likes
            ),
            author=UserResponse.model_validate(user),
            project=ProjectResponse.model_validate(post.project) if post.project else None
        )
        result.append(post_data)

    return result
