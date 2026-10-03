from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, CheckConstraint, UniqueConstraint, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..database import Base


class Post(Base):
    __tablename__ = "posts"

    post_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), index=True)
    project_id = Column(Integer, ForeignKey("projects.project_id", ondelete="SET NULL"), nullable=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    version = Column(String(50))
    change_type = Column(String(50))
    visibility = Column(String(20), default="public")
    status = Column(String(20), nullable=False, default="published")
    github_release_id = Column(String(50))
    release_compare_url = Column(String(1000))
    release_impact = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        CheckConstraint(
            "change_type IN ('feature', 'bugfix', 'improvement', 'release', 'update')",
            name="check_change_type"
        ),
        CheckConstraint(
            "visibility IN ('public', 'private')",
            name="check_visibility"
        ),
        CheckConstraint(
            "status IN ('draft', 'published')",
            name="check_post_status"
        ),
        UniqueConstraint(
            "project_id", "github_release_id",
            name="uq_post_project_github_release"
        ),
    )

    user = relationship("User", back_populates="posts")
    project = relationship("Project", back_populates="posts")
    media = relationship("Media", back_populates="post", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="post", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")
