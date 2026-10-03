from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# User schemas
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    user_id: int
    username: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserWithProfile(UserResponse):
    profile: Optional["ProfileResponse"] = None
    followers_count: int = 0
    following_count: int = 0


# Profile schemas
class ProfileCreate(BaseModel):
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    github_url: Optional[str] = None
    website_url: Optional[str] = None


class ProfileResponse(BaseModel):
    profile_id: int
    user_id: int
    display_name: Optional[str]
    bio: Optional[str]
    avatar_url: Optional[str]
    github_url: Optional[str]
    website_url: Optional[str]

    class Config:
        from_attributes = True


# Project schemas
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    repo_url: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    repo_url: Optional[str] = None


class ProjectResponse(BaseModel):
    project_id: int
    user_id: int
    name: str
    description: Optional[str]
    repo_url: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# Media schemas
class MediaCreate(BaseModel):
    media_url: str
    media_type: str = "image"
    caption: Optional[str] = None
    upload_order: int = 0


class MediaResponse(BaseModel):
    media_id: int
    post_id: int
    media_url: str
    media_type: str
    caption: Optional[str]
    upload_order: int

    class Config:
        from_attributes = True


# Post schemas
class PostCreate(BaseModel):
    title: str
    content: str
    project_id: Optional[int] = None
    version: Optional[str] = None
    change_type: Optional[str] = None
    visibility: str = "public"
    media: Optional[List[MediaCreate]] = None


class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    project_id: Optional[int] = None
    version: Optional[str] = None
    change_type: Optional[str] = None
    visibility: Optional[str] = None


class PostResponse(BaseModel):
    post_id: int
    user_id: int
    project_id: Optional[int]
    title: str
    content: str
    version: Optional[str]
    change_type: Optional[str]
    visibility: str
    created_at: datetime
    updated_at: datetime
    media: List[MediaResponse] = []
    likes_count: int = 0
    comments_count: int = 0
    is_liked: bool = False

    class Config:
        from_attributes = True


class PostWithAuthor(PostResponse):
    author: UserResponse
    project: Optional[ProjectResponse] = None


# Comment schemas
class CommentCreate(BaseModel):
    content: str


class CommentResponse(BaseModel):
    comment_id: int
    user_id: int
    post_id: int
    content: str
    created_at: datetime
    author: Optional[UserResponse] = None

    class Config:
        from_attributes = True


# Follow schemas
class FollowResponse(BaseModel):
    follower_id: int
    following_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Notification schemas
class NotificationResponse(BaseModel):
    notification_id: int
    user_id: int
    type: str
    reference_id: Optional[int]
    message: Optional[str]
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Auth response
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# Fix forward reference
UserWithProfile.model_rebuild()
