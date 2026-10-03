from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.user import User
from ..models.post import Post
from ..models.like import Like
from ..models.comment import Comment
from ..models.follow import Follow
from ..models.notification import Notification
from ..schemas import CommentCreate, CommentResponse, UserResponse, FollowResponse
from ..utils.auth import get_current_user

router = APIRouter(prefix="/api", tags=["social"])


# --- Likes ---
@router.post("/posts/{post_id}/like")
def toggle_like(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(Post).filter(Post.post_id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

    existing_like = db.query(Like).filter(
        Like.user_id == current_user.user_id,
        Like.post_id == post_id
    ).first()

    if existing_like:
        db.delete(existing_like)
        db.commit()
        db.refresh(post)
        return {"liked": False, "likes_count": len(post.likes)}
    else:
        like = Like(user_id=current_user.user_id, post_id=post_id)
        db.add(like)

        # Create notification for post owner (if not self)
        if post.user_id != current_user.user_id:
            notification = Notification(
                user_id=post.user_id,
                type="like",
                reference_id=post_id,
                message=f"{current_user.username} liked your post"
            )
            db.add(notification)

        db.commit()
        db.refresh(post)
        return {"liked": True, "likes_count": len(post.likes)}


# --- Comments ---
@router.get("/posts/{post_id}/comments", response_model=List[CommentResponse])
def get_comments(
    post_id: int,
    db: Session = Depends(get_db)
):
    post = db.query(Post).filter(Post.post_id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

    comments = db.query(Comment).filter(
        Comment.post_id == post_id
    ).order_by(Comment.created_at.asc()).all()

    result = []
    for comment in comments:
        comment_data = CommentResponse.model_validate(comment)
        comment_data.author = UserResponse.model_validate(comment.user)
        result.append(comment_data)

    return result


@router.post("/posts/{post_id}/comments", response_model=CommentResponse)
def add_comment(
    post_id: int,
    comment_data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(Post).filter(Post.post_id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

    comment = Comment(
        user_id=current_user.user_id,
        post_id=post_id,
        content=comment_data.content
    )
    db.add(comment)

    # Create notification for post owner (if not self)
    if post.user_id != current_user.user_id:
        notification = Notification(
            user_id=post.user_id,
            type="comment",
            reference_id=post_id,
            message=f"{current_user.username} commented on your post"
        )
        db.add(notification)

    db.commit()
    db.refresh(comment)

    response = CommentResponse.model_validate(comment)
    response.author = UserResponse.model_validate(current_user)
    return response


@router.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comment = db.query(Comment).filter(
        Comment.comment_id == comment_id,
        Comment.user_id == current_user.user_id
    ).first()

    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )

    db.delete(comment)
    db.commit()
    return {"message": "Comment deleted"}


# --- Follows ---
@router.post("/users/{user_id}/follow")
def toggle_follow(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if user_id == current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot follow yourself"
        )

    target_user = db.query(User).filter(User.user_id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    existing_follow = db.query(Follow).filter(
        Follow.follower_id == current_user.user_id,
        Follow.following_id == user_id
    ).first()

    if existing_follow:
        db.delete(existing_follow)
        db.commit()
        return {"following": False}
    else:
        follow = Follow(
            follower_id=current_user.user_id,
            following_id=user_id
        )
        db.add(follow)

        # Create notification
        notification = Notification(
            user_id=user_id,
            type="follow",
            reference_id=current_user.user_id,
            message=f"{current_user.username} started following you"
        )
        db.add(notification)

        db.commit()
        return {"following": True}


@router.get("/users/{user_id}/followers", response_model=List[UserResponse])
def get_followers(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    follows = db.query(Follow).filter(Follow.following_id == user_id).all()
    followers = [
        UserResponse.model_validate(
            db.query(User).filter(User.user_id == f.follower_id).first()
        )
        for f in follows
    ]
    return followers


@router.get("/users/{user_id}/following", response_model=List[UserResponse])
def get_following(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    follows = db.query(Follow).filter(Follow.follower_id == user_id).all()
    following = [
        UserResponse.model_validate(
            db.query(User).filter(User.user_id == f.following_id).first()
        )
        for f in follows
    ]
    return following


@router.get("/users/{username}/is-following")
def check_following(
    username: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_user = db.query(User).filter(User.username == username).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    existing_follow = db.query(Follow).filter(
        Follow.follower_id == current_user.user_id,
        Follow.following_id == target_user.user_id
    ).first()

    return {"is_following": existing_follow is not None}
