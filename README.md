# PushBlog

PushBlog is a developer changelog and devlog platform for documenting project releases, fixes, improvements, and the work behind them. Developers can connect a GitHub repository, turn published releases into editable draft posts, and share updates with followers.

## Features

- Create projects and publish versioned updates with change-type labels and media.
- Save drafts and edit release notes before publishing.
- Connect GitHub Releases with a signed webhook. A published release creates an idempotent PushBlog draft with its version, title, and notes.
- Compare a release with the previous tracked version and add structured upgrade-impact notes.
- Discover public changelogs, projects, and developers; search by title, project, version, or username.
- Follow developers. Public accounts accept follows immediately; private accounts can approve or decline requests.
- Choose public or followers-only posts. Public posts are visible to everyone; followers-only posts are visible to the owner and accepted followers.
- Receive notifications for likes, comments, follows, and follow requests.
- Like and comment on posts, and view the profiles of commenters and likers.

## Stack

- Frontend: React, Vite, React Router, Axios
- Backend: FastAPI, SQLAlchemy, Pydantic
- Database: PostgreSQL
- Local development: Docker Compose

## Run Locally

Prerequisites: Docker Desktop and Node.js/npm.

1. Start PostgreSQL and the API from the repository root:

   ```powershell
   docker compose up --build
   ```

   The API is available at `http://localhost:8000`; interactive API documentation is at `http://localhost:8000/docs`.

2. In a second terminal, start the frontend:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

   Open `http://localhost:5173`.

The frontend defaults to `http://127.0.0.1:8000` for the API. To use another API address, set `VITE_API_URL` in the frontend environment before starting Vite.

## Configuration

The API reads configuration from environment variables. `backend/.env` is loaded for local backend runs; Docker and cloud deployments should provide environment variables directly.

| Variable | Purpose |
| --- | --- |
| `SECRET_KEY` | Required signing key for authentication tokens. Use a long, random value outside local development. |
| `DATABASE_URL` | SQLAlchemy database URL. |
| `CORS_ORIGINS` | Comma-separated frontend origins allowed by the API. |
| `AUTO_CREATE_TABLES` | Creates tables and runs additive startup upgrades when `true`. For production, use managed migrations and set this to `false`. |
| `STORAGE_BACKEND` | `local` or `s3`. |
| `UPLOAD_DIR` | Local upload directory when using local storage. |
| `S3_BUCKET` | Required when `STORAGE_BACKEND=s3`. |
| `S3_REGION` | AWS region for the upload bucket. |
| `S3_PUBLIC_BASE_URL` | Optional public bucket/CDN base URL. |

Never commit `.env` files, database credentials, token signing keys, or webhook secrets.

## GitHub Release Webhook

1. Create a PushBlog project and set its repository URL to the matching GitHub repository.
2. In **Projects**, open **GitHub webhook** and copy the endpoint and generated secret.
3. In GitHub, add a repository webhook using the endpoint, the secret, content type `application/json`, and the **Release** event.
4. Publish a GitHub Release. PushBlog verifies `X-Hub-Signature-256` and creates a draft; it does not publish the post automatically.

GitHub must be able to reach the API over the public internet. A local `127.0.0.1` URL will not work; use a deployed API URL or a secure tunnel for development. If a webhook secret is exposed, rotate it in PushBlog and update GitHub.

## Database Migration

When `AUTO_CREATE_TABLES=false`, apply [`backend/migrations/001_github_release_drafts.sql`](backend/migrations/001_github_release_drafts.sql) to PostgreSQL before deploying. It adds the release-draft, project-webhook, profile-privacy, and follow-request fields while preserving existing rows.

## Validation

```powershell
cd frontend
npm run build
npm run lint
```

The backend health check is available at `GET /health`. API docs are available at `/docs`.

## Current Scope

PushBlog supports single-level comments. Rich Markdown editing, GitHub OAuth, password reset, and bookmarks are not currently implemented.
