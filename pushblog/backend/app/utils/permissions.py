from sqlalchemy.orm import Session

from ..models.follow import Follow
from ..models.post import Post
from ..models.user import User


def can_view_post(db: Session, post: Post, viewer: User | None) -> bool:
    is_owner = viewer is not None and viewer.user_id == post.user_id
    if post.status == "draft":
        return is_owner
    if post.status != "published":
        return False
    if post.visibility == "public" or is_owner:
        return True
    if post.visibility != "private" or viewer is None:
        return False

    return db.query(Follow).filter(
        Follow.follower_id == viewer.user_id,
        Follow.following_id == post.user_id,
        Follow.status == "accepted",
    ).first() is not None