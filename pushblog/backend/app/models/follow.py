from sqlalchemy import Column, Integer, ForeignKey, DateTime, String, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..database import Base


class Follow(Base):
    __tablename__ = "follows"

    follower_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    following_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    status = Column(String(20), nullable=False, default="accepted", server_default="accepted")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint("follower_id != following_id", name="check_no_self_follow"),
        CheckConstraint("status IN ('pending', 'accepted')", name="check_follow_status"),
    )

    follower = relationship("User", foreign_keys=[follower_id], back_populates="following")
    following = relationship("User", foreign_keys=[following_id], back_populates="followers")
