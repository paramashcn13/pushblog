from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.user import User
from ..models.post import Post
from ..models.like import Like
from ..models.comment import Comment
from ..models.follow import Follow
from ..models.notification import Notification
from ..models.profile import Profile
from ..schemas import (
    CommentCreate, CommentResponse, FollowRequestResponse,
    NotificationResponse, UserResponse,
)
from ..utils.auth import get_current_user, get_optional_user
from ..utils.permissions import can_view_post

router = APIRouter(prefix="/api", tags=["social"])


def can_view_relationships(db: Session, user_id: int, viewer: User | None) -> bool:
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not profile or not profile.is_private or (viewer and viewer.user_id == user_id):
        return True
    if not viewer:
        return False
    return db.query(Follow).filter(
        Follow.follower_id == viewer.user_id,
        Follow.following_id == user_id,
        Follow.status == "accepted",
    ).first() is not None


# --- Likes ---
@router.post("/posts/{post_id}/like")
def toggle_like(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(Post).filter(Post.post_id == post_id).first()
    if not post or not can_view_post(db, post, current_user):
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


@router.get("/posts/{post_id}/likes", response_model=List[UserResponse])
def get_post_likes(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    post = db.query(Post).filter(Post.post_id == post_id).first()
    if not post or post.status != "published" or not can_view_post(db, post, current_user):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    likers = db.query(User).join(Like, Like.user_id == User.user_id).filter(
        Like.post_id == post_id
    ).order_by(Like.created_at.desc()).limit(100).all()
    return [UserResponse.model_validate(user) for user in likers]


# --- Comments ---
@router.get("/posts/{post_id}/comments", response_model=List[CommentResponse])
def get_comments(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    post = db.query(Post).filter(Post.post_id == post_id).first()
    if not post or post.status != "published" or not can_view_post(db, post, current_user):
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
    if not post or not can_view_post(db, post, current_user):
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
        return {"following": False, "status": "none"}
    else:
        target_profile = db.query(Profile).filter(Profile.user_id == user_id).first()
        follow_status = "pending" if target_profile and target_profile.is_private else "accepted"
        follow = Follow(
            follower_id=current_user.user_id,
            following_id=user_id,
            status=follow_status,
        )
        db.add(follow)

        notification = Notification(
            user_id=user_id,
            type="follow",
            reference_id=current_user.user_id,
            message=(
                f"{current_user.username} requested to follow you"
                if follow_status == "pending"
                else f"{current_user.username} started following you"
            ),
        )
        db.add(notification)

        db.commit()
        return {"following": follow_status == "accepted", "status": follow_status}


@router.get("/follow-requests", response_model=List[FollowRequestResponse])
def get_follow_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    requests = db.query(Follow).filter(
        Follow.following_id == current_user.user_id,
        Follow.status == "pending",
    ).order_by(Follow.created_at.desc()).all()
    return [
        FollowRequestResponse(
            follower=UserResponse.model_validate(request.follower),
            created_at=request.created_at,
        )
        for request in requests
    ]


@router.post("/follow-requests/{follower_id}/accept")
def accept_follow_request(
    follower_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    follow = db.query(Follow).filter(
        Follow.follower_id == follower_id,
        Follow.following_id == current_user.user_id,
        Follow.status == "pending",
    ).first()
    if not follow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Follow request not found")

    follow.status = "accepted"
    db.add(Notification(
        user_id=follower_id,
        type="follow",
        reference_id=current_user.user_id,
        message=f"{current_user.username} accepted your follow request",
    ))
    db.commit()
    return {"status": "accepted"}


@router.post("/follow-requests/{follower_id}/reject")
def reject_follow_request(
    follower_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    follow = db.query(Follow).filter(
        Follow.follower_id == follower_id,
        Follow.following_id == current_user.user_id,
        Follow.status == "pending",
    ).first()
    if not follow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Follow request not found")
    db.delete(follow)
    db.commit()
    return {"status": "rejected"}


@router.get("/users/{user_id}/followers", response_model=List[UserResponse])
def get_followers(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if not can_view_relationships(db, user_id, current_user):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    follows = db.query(Follow).filter(
        Follow.following_id == user_id,
        Follow.status == "accepted",
    ).all()
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
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if not can_view_relationships(db, user_id, current_user):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    follows = db.query(Follow).filter(
        Follow.follower_id == user_id,
        Follow.status == "accepted",
    ).all()
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

    return {
        "is_following": existing_follow is not None and existing_follow.status == "accepted",
        "status": existing_follow.status if existing_follow else "none",
    }


@router.get("/notifications", response_model=List[NotificationResponse])
def get_notifications(
    limit: int = Query(50, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Notification).filter(
        Notification.user_id == current_user.user_id,
    ).order_by(Notification.created_at.desc()).limit(limit).all()


@router.get("/notifications/unread-count")
def get_unread_notification_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count = db.query(Notification).filter(
        Notification.user_id == current_user.user_id,
        Notification.is_read.is_(False),
    ).count()
    return {"count": count}


@router.post("/notifications/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(Notification).filter(
        Notification.user_id == current_user.user_id,
        Notification.is_read.is_(False),
    ).update({Notification.is_read: True}, synchronize_session=False)
    db.commit()
    return {"status": "read"}


@router.post("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notification = db.query(Notification).filter(
        Notification.notification_id == notification_id,
        Notification.user_id == current_user.user_id,
    ).first()
    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    notification.is_read = True
    db.commit()
    return {"status": "read"}
