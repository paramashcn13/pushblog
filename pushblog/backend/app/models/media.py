from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from ..database import Base


class Media(Base):
    __tablename__ = "media"

    media_id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.post_id", ondelete="CASCADE"), index=True)
    media_url = Column(String(500), nullable=False)
    media_type = Column(String(50), default="image")
    caption = Column(String(255))
    upload_order = Column(Integer, default=0)

    post = relationship("Post", back_populates="media")
