from .auth import router as auth_router
from .users import router as users_router
from .projects import router as projects_router
from .posts import router as posts_router
from .social import router as social_router
from .upload import router as upload_router

__all__ = [
    "auth_router",
    "users_router",
    "projects_router",
    "posts_router",
    "social_router",
    "upload_router"
]
