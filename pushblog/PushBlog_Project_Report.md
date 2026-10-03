# PushBlog: A Developer Changelog Platform

by

**Shantanu**

**24BDS1115**

---

A project report submitted for the course of

**BCSE302L - Database Systems**

in

**B. Tech. Computer Science and Engineering**

**April 2026**

---

\newpage

## Table of Contents

1. Abstract ..................................................... 3
2. Introduction ................................................. 4
3. Existing Work ................................................ 5
4. Proposed Work / System ....................................... 6
5. System Design / Architecture ................................. 8
6. Technology Stack ............................................. 10
7. Working Modules .............................................. 11
8. Screenshots of Output ........................................ 16
9. Conclusion ................................................... 17
10. References .................................................. 18
11. Complete Implementation ..................................... 19

---

\newpage

## Abstract

PushBlog is a full-stack web application designed as a developer changelog and devlog platform, enabling software developers to document and share their project updates, feature releases, bug fixes, and development progress with the community. The platform addresses the growing need for developers to maintain transparent communication about their work while building a professional portfolio of their contributions.

The system implements a comprehensive relational database design using PostgreSQL, featuring normalized tables for users, projects, posts, comments, likes, follows, media attachments, and notifications. The backend is built using FastAPI, a modern Python web framework, with SQLAlchemy ORM for database operations. The frontend is developed using React with Vite as the build tool, providing a responsive and interactive user interface.

Key features include user authentication with JWT tokens, project management, rich post creation with version tagging and change type classification (feature, bugfix, improvement, release, update), media upload capabilities, social interactions (likes, comments, follows), personalized feed generation, and real-time notifications. The application follows RESTful API design principles and implements proper security measures including password hashing with bcrypt and token-based authentication.

This project demonstrates practical application of database management concepts including entity-relationship modeling, normalization, referential integrity, cascade operations, and efficient query design using joins and aggregations.

---

\newpage

## Introduction

In the modern software development ecosystem, transparency and communication have become essential aspects of building successful projects. Developers working on open-source projects, startups, or personal ventures often need a dedicated platform to share their progress, announce new features, document bug fixes, and engage with their user community. While social media platforms like Twitter/X exist, they lack the structured format needed for technical changelogs and version tracking.

PushBlog addresses this gap by providing a purpose-built platform specifically designed for developer updates. The name "PushBlog" draws inspiration from the Git terminology "push" – the action of sharing code changes with others – combined with "blog" to represent the narrative aspect of documenting development journeys.

### Problem Statement

Developers face several challenges when communicating their work:

1. **Fragmented Communication**: Updates are scattered across multiple platforms (GitHub releases, Twitter, Discord, mailing lists)
2. **Lack of Version Context**: General social media lacks support for version numbers, change types, and project associations
3. **No Dedicated Community**: Developer updates get lost in the noise of general-purpose social platforms
4. **Portfolio Gap**: No centralized place to showcase development history and contributions

### Objectives

The primary objectives of this project are:

1. Design and implement a normalized relational database schema for a social developer platform
2. Build a secure authentication system with proper password hashing and JWT tokens
3. Create RESTful APIs for all CRUD operations on posts, projects, comments, and social interactions
4. Develop a responsive frontend application for seamless user experience
5. Implement efficient database queries using joins, aggregations, and proper indexing
6. Demonstrate practical application of database management concepts learned in the course

---

\newpage

## Existing Work

Several platforms currently serve parts of the developer communication needs:

### 1. GitHub Releases

GitHub provides a releases feature where developers can tag versions and write release notes. However, it is tightly coupled to repositories, lacks social features like following developers across projects, and doesn't support rich media or community engagement beyond the scope of a single repository.

### 2. Dev.to / Hashnode

These are blogging platforms for developers but are designed for long-form articles rather than quick updates and changelogs. They lack version tracking, change type classification, and the structured format needed for development logs.

### 3. Twitter/X

Many developers use Twitter for announcements, but the platform has character limits, no version tracking, no project organization, and development updates get mixed with general content. The algorithmic feed also doesn't prioritize followed developers' updates.

### 4. Discord / Slack

Team communication tools that work well for private teams but lack public discoverability, structured changelog formats, and portfolio-building capabilities.

### 5. Changelog.com / Keep a Changelog

These focus on changelog specifications and standards but don't provide a social platform for sharing and discovering changelogs across the developer community.

### Gap Analysis

| Feature | GitHub | Dev.to | Twitter | Discord | PushBlog |
|---------|--------|--------|---------|---------|----------|
| Version Tracking | Yes | No | No | No | Yes |
| Change Type Tags | No | No | No | No | Yes |
| Social Following | No | Yes | Yes | No | Yes |
| Project Organization | Yes | No | No | Yes | Yes |
| Media Support | Limited | Yes | Yes | Yes | Yes |
| Developer-Focused | Yes | Yes | No | No | Yes |
| Public Feed | No | Yes | Yes | No | Yes |
| Quick Updates | No | No | Yes | Yes | Yes |

---

\newpage

## Proposed Work / System

PushBlog is designed as a comprehensive developer changelog platform with the following core functionalities:

### User Management

- **Registration and Authentication**: Secure user registration with email and username, password hashing using bcrypt, and JWT-based session management
- **User Profiles**: Customizable profiles with display name, bio, website link, and profile picture
- **Follow System**: Users can follow other developers to curate their personalized feed

### Project Management

- **Project Creation**: Users can create projects to organize their posts
- **Project Details**: Each project has a name, description, repository link, and associated posts
- **Project Discovery**: Browse and explore projects from the community

### Post System

- **Rich Posts**: Create posts with title, content, optional version number, and change type classification
- **Change Types**: Categorize posts as Feature, Bug Fix, Improvement, Release, or Update
- **Media Attachments**: Upload and attach images/screenshots to posts
- **Visibility Control**: Posts can be public or private
- **Project Association**: Optionally link posts to specific projects

### Social Features

- **Likes**: Users can like posts to show appreciation
- **Comments**: Engage in discussions under posts
- **Following/Followers**: Build a network of developers
- **Personalized Feed**: View posts from followed users
- **Explore Feed**: Discover posts from the entire community

### Notification System

- **Activity Notifications**: Get notified when someone likes your post, comments, or follows you
- **Read/Unread Status**: Track which notifications have been viewed

### Core Entities and Relationships

The system revolves around the following primary entities:

1. **User**: Central entity representing registered developers
2. **Profile**: One-to-one with User, stores additional profile information
3. **Project**: Belongs to a User, can have many Posts
4. **Post**: Created by User, optionally linked to Project, can have Media, Likes, Comments
5. **Media**: Attached to Posts for image storage
6. **Like**: Many-to-many relationship between Users and Posts
7. **Comment**: Belongs to User and Post
8. **Follow**: Self-referential many-to-many on Users
9. **Notification**: Belongs to User, tracks various activity types

---

\newpage

## System Design / Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   React Frontend                         │    │
│  │  (Vite + React Router + Context API + Axios)            │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SERVER LAYER                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   FastAPI Backend                        │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │    │
│  │  │  Auth   │ │  Posts  │ │ Social  │ │ Upload  │       │    │
│  │  │ Router  │ │ Router  │ │ Router  │ │ Router  │       │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │    │
│  │                      │                                   │    │
│  │              ┌───────┴───────┐                          │    │
│  │              │  SQLAlchemy   │                          │    │
│  │              │     ORM       │                          │    │
│  │              └───────────────┘                          │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Database Connection
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    PostgreSQL                            │    │
│  │  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐     │    │
│  │  │ Users │ │ Posts │ │Projects│ │ Likes │ │Comments│    │    │
│  │  └───────┘ └───────┘ └───────┘ └───────┘ └───────┘     │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Entity-Relationship Diagram

**[INSERT ER DIAGRAM HERE]**

The database schema consists of the following tables and relationships:

### Database Schema

```sql
-- Users Table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Profiles Table (1:1 with Users)
CREATE TABLE profiles (
    profile_id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    display_name VARCHAR(100),
    bio TEXT,
    website VARCHAR(255),
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects Table
CREATE TABLE projects (
    project_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    repo_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Posts Table
CREATE TABLE posts (
    post_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(project_id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    version VARCHAR(50),
    change_type VARCHAR(20),
    visibility VARCHAR(20) DEFAULT 'public',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Media Table
CREATE TABLE media (
    media_id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(post_id) ON DELETE CASCADE,
    media_url VARCHAR(255) NOT NULL,
    media_type VARCHAR(50),
    caption TEXT
);

-- Likes Table (M:N between Users and Posts)
CREATE TABLE likes (
    like_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES posts(post_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, post_id)
);

-- Comments Table
CREATE TABLE comments (
    comment_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES posts(post_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Follows Table (Self-referential M:N on Users)
CREATE TABLE follows (
    follow_id SERIAL PRIMARY KEY,
    follower_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    following_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id)
);

-- Notifications Table
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    related_post_id INTEGER REFERENCES posts(post_id) ON DELETE CASCADE,
    related_user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Normalization

The database schema follows Third Normal Form (3NF):

1. **1NF**: All tables have atomic values, no repeating groups
2. **2NF**: All non-key attributes are fully dependent on the primary key
3. **3NF**: No transitive dependencies exist; profile data is separated from user credentials

---

\newpage

## Technology Stack

### Backend

| Technology | Purpose | Version |
|------------|---------|---------|
| **Python** | Programming Language | 3.11+ |
| **FastAPI** | Web Framework | 0.100+ |
| **SQLAlchemy** | ORM (Object-Relational Mapping) | 2.0+ |
| **PostgreSQL** | Relational Database | 15+ |
| **Pydantic** | Data Validation & Serialization | 2.0+ |
| **python-jose** | JWT Token Generation/Validation | 3.3+ |
| **passlib + bcrypt** | Password Hashing | - |
| **python-multipart** | File Upload Handling | - |
| **Uvicorn** | ASGI Server | 0.23+ |

### Frontend

| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | UI Library | 18+ |
| **Vite** | Build Tool & Dev Server | 5+ |
| **React Router** | Client-side Routing | 6+ |
| **Axios** | HTTP Client | 1.6+ |
| **Context API** | State Management | - |
| **CSS3** | Styling | - |

### Development Tools

| Tool | Purpose |
|------|---------|
| **Git** | Version Control |
| **npm** | Package Management (Frontend) |
| **pip** | Package Management (Backend) |
| **ESLint** | JavaScript Linting |

### Architecture Patterns

- **REST API**: Stateless client-server communication
- **JWT Authentication**: Secure token-based sessions
- **Repository Pattern**: Database access abstraction via SQLAlchemy
- **Component-Based UI**: Reusable React components
- **Context Pattern**: Global state management for auth and theme

---

\newpage

## Working Modules

### Module 1: Authentication Module

The authentication module handles user registration, login, and session management.

**[INSERT AUTHENTICATION FLOW DIAGRAM HERE]**

#### Registration Flow

1. User submits username, email, and password
2. Backend validates uniqueness of username and email
3. Password is hashed using bcrypt with salt
4. User record is created in the database
5. Associated profile record is created
6. JWT token is generated and returned

#### Login Flow

1. User submits username/email and password
2. Backend retrieves user by username
3. Password is verified against stored hash
4. If valid, JWT token is generated with user_id in payload
5. Token is returned to client and stored in localStorage

#### Key Code - Password Hashing

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
```

#### Key Code - JWT Token Creation

```python
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
```

---

### Module 2: Post Management Module

The post module handles creation, retrieval, updating, and deletion of posts.

**[INSERT POST CRUD FLOW DIAGRAM HERE]**

#### Features

- Create posts with title, content, version, and change type
- Associate posts with projects
- Attach media files to posts
- Control visibility (public/private)
- Retrieve paginated feeds

#### Key Code - Post Creation

```python
@router.post("/", response_model=PostResponse)
def create_post(
    post_data: PostCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_post = Post(
        user_id=current_user.user_id,
        title=post_data.title,
        content=post_data.content,
        version=post_data.version,
        change_type=post_data.change_type,
        project_id=post_data.project_id,
        visibility=post_data.visibility
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    # Handle media attachments
    if post_data.media:
        for media_item in post_data.media:
            media = Media(
                post_id=new_post.post_id,
                media_url=media_item.media_url,
                media_type=media_item.media_type,
                caption=media_item.caption
            )
            db.add(media)
        db.commit()

    return new_post
```

#### Key Code - Feed Generation with Joins

```python
@router.get("/feed", response_model=List[PostResponse])
def get_feed(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 20,
    offset: int = 0
):
    # Get IDs of users the current user follows
    following_ids = db.query(Follow.following_id).filter(
        Follow.follower_id == current_user.user_id
    ).subquery()

    # Get posts from followed users
    posts = db.query(Post).filter(
        Post.user_id.in_(following_ids),
        Post.visibility == "public"
    ).order_by(
        Post.created_at.desc()
    ).offset(offset).limit(limit).all()

    return posts
```

---

### Module 3: Social Interaction Module

Handles likes, comments, and follow relationships.

**[INSERT SOCIAL FEATURES DIAGRAM HERE]**

#### Like System

- Toggle like on/off with single endpoint
- Returns updated like count
- Unique constraint prevents duplicate likes

```python
@router.post("/posts/{post_id}/like")
def toggle_like(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing_like = db.query(Like).filter(
        Like.user_id == current_user.user_id,
        Like.post_id == post_id
    ).first()

    if existing_like:
        db.delete(existing_like)
        db.commit()
        liked = False
    else:
        new_like = Like(user_id=current_user.user_id, post_id=post_id)
        db.add(new_like)
        db.commit()
        liked = True

    likes_count = db.query(Like).filter(Like.post_id == post_id).count()
    return {"liked": liked, "likes_count": likes_count}
```

#### Follow System

- Follow/unfollow other users
- Retrieve followers and following lists
- Self-referential many-to-many relationship

```python
@router.post("/users/{user_id}/follow")
def toggle_follow(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user_id == current_user.user_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    existing_follow = db.query(Follow).filter(
        Follow.follower_id == current_user.user_id,
        Follow.following_id == user_id
    ).first()

    if existing_follow:
        db.delete(existing_follow)
        db.commit()
        following = False
    else:
        new_follow = Follow(
            follower_id=current_user.user_id,
            following_id=user_id
        )
        db.add(new_follow)
        db.commit()
        following = True

    return {"following": following}
```

---

### Module 4: Comment System

Enables discussion on posts.

```python
@router.post("/posts/{post_id}/comments", response_model=CommentResponse)
def create_comment(
    post_id: int,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    post = db.query(Post).filter(Post.post_id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    new_comment = Comment(
        user_id=current_user.user_id,
        post_id=post_id,
        content=comment_data.content
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    return new_comment
```

---

### Module 5: File Upload Module

Handles image uploads for post attachments.

**[INSERT FILE UPLOAD FLOW DIAGRAM HERE]**

```python
UPLOAD_DIR = "uploads"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    # Validate file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="File type not allowed")

    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"url": f"/uploads/{unique_filename}"}
```

---

### Module 6: Project Management

Allows users to organize posts under projects.

```python
@router.post("/", response_model=ProjectResponse)
def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_project = Project(
        user_id=current_user.user_id,
        name=project_data.name,
        description=project_data.description,
        repo_url=project_data.repo_url
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project
```

---

### Module 7: Notification System

Tracks user activity and alerts.

```python
@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    unread_only: bool = False
):
    query = db.query(Notification).filter(
        Notification.user_id == current_user.user_id
    )

    if unread_only:
        query = query.filter(Notification.is_read == False)

    notifications = query.order_by(
        Notification.created_at.desc()
    ).limit(50).all()

    return notifications
```

---

\newpage

## Screenshots of Output

### 1. Home Page / Feed

**[INSERT SCREENSHOT: Home page showing the post feed with posts from followed users]**

### 2. User Registration

**[INSERT SCREENSHOT: Registration form with username, email, and password fields]**

### 3. User Login

**[INSERT SCREENSHOT: Login form]**

### 4. Create Post Page

**[INSERT SCREENSHOT: Post creation form with title, content, version, change type, project selection, and image upload]**

### 5. Post Detail View

**[INSERT SCREENSHOT: Single post view with full content, media, likes, and comments]**

### 6. User Profile

**[INSERT SCREENSHOT: Profile page showing user info, stats, and their posts]**

### 7. Projects Page

**[INSERT SCREENSHOT: Projects list with project cards]**

### 8. Explore Page

**[INSERT SCREENSHOT: Explore feed showing public posts from all users]**

### 9. Comment Section

**[INSERT SCREENSHOT: Comments under a post with user avatars and timestamps]**

### 10. Dark Mode

**[INSERT SCREENSHOT: Application in dark theme]**

---

\newpage

## Conclusion

PushBlog successfully demonstrates the practical application of database management concepts in building a real-world web application. The project implements a comprehensive relational database design with proper normalization, referential integrity, and efficient query patterns.

### Key Achievements

1. **Database Design**: Implemented a normalized schema with 9 interconnected tables, proper foreign key relationships, and cascade delete behaviors

2. **Authentication Security**: Implemented secure password hashing with bcrypt and JWT-based stateless authentication

3. **RESTful API**: Built a complete REST API with proper HTTP methods, status codes, and resource-based endpoints

4. **Social Features**: Implemented complex database relationships including self-referential many-to-many (follows) and standard many-to-many (likes)

5. **Efficient Queries**: Used SQLAlchemy ORM to write efficient queries with joins, subqueries, and aggregations for feed generation and statistics

6. **Full-Stack Integration**: Successfully integrated FastAPI backend with React frontend for a complete user experience

### Learning Outcomes

- Practical experience with PostgreSQL and SQL schema design
- Understanding of ORM patterns and SQLAlchemy usage
- Implementation of authentication and authorization in web applications
- Experience with RESTful API design principles
- Frontend-backend integration patterns

### Future Enhancements

- Real-time notifications using WebSockets
- Full-text search for posts and projects
- Markdown support for post content
- Email verification and password reset
- Rate limiting and API throttling
- Database query optimization with indexes
- Deployment to cloud infrastructure

---

\newpage

## References

1. FastAPI Documentation. https://fastapi.tiangolo.com/

2. SQLAlchemy Documentation. https://docs.sqlalchemy.org/

3. PostgreSQL Documentation. https://www.postgresql.org/docs/

4. React Documentation. https://react.dev/

5. Vite Documentation. https://vitejs.dev/

6. JSON Web Tokens (JWT). https://jwt.io/

7. OWASP Authentication Cheat Sheet. https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html

8. REST API Design Best Practices. https://restfulapi.net/

9. Database Normalization Explained. https://www.guru99.com/database-normalization.html

10. Bcrypt Password Hashing. https://en.wikipedia.org/wiki/Bcrypt

---

\newpage

## Complete Implementation

The complete source code is organized as follows:

```
pushblog/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI application entry point
│   │   ├── config.py            # Configuration settings
│   │   ├── database.py          # Database connection setup
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py          # User and Profile models
│   │   │   ├── post.py          # Post and Media models
│   │   │   ├── project.py       # Project model
│   │   │   ├── social.py        # Like, Comment, Follow models
│   │   │   └── notification.py  # Notification model
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py          # Authentication endpoints
│   │   │   ├── posts.py         # Post CRUD endpoints
│   │   │   ├── projects.py      # Project endpoints
│   │   │   ├── social.py        # Social feature endpoints
│   │   │   └── upload.py        # File upload endpoint
│   │   ├── schemas/
│   │   │   └── schemas.py       # Pydantic models
│   │   └── utils/
│   │       └── auth.py          # Auth helper functions
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── client.js        # Axios API client
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── PostCard.jsx
    │   │   └── CommentSection.jsx
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── ThemeContext.jsx
    │   ├── pages/
    │   │   ├── Home.jsx
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── CreatePost.jsx
    │   │   ├── PostDetail.jsx
    │   │   ├── Profile.jsx
    │   │   └── Projects.jsx
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```

### Key Implementation Files

*Note: Complete source code files are attached separately / available in the project repository.*

---

**End of Report**
