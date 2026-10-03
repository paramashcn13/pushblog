from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship

from ..database import Base


class Profile(Base):
    __tablename__ = "profiles"

    profile_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), unique=True)
    display_name = Column(String(100))
    bio = Column(Text)
    avatar_url = Column(String(500))
    github_url = Column(String(255))
    website_url = Column(String(255))

    user = relationship("User", back_populates="profile")
