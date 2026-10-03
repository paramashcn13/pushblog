from sqlalchemy import create_engine, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from .config import DATABASE_URL

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def upgrade_schema():
    """Add webhook and draft columns to databases created before this feature."""
    inspector = inspect(engine)
    additions = {
        "posts": {
            "status": "VARCHAR(20) NOT NULL DEFAULT 'published'",
            "github_release_id": "VARCHAR(50)",
            "release_compare_url": "VARCHAR(1000)",
            "release_impact": "JSON",
        },
        "projects": {
            "webhook_secret": "VARCHAR(64)",
        },
        "profiles": {
            "is_private": "BOOLEAN NOT NULL DEFAULT FALSE",
        },
        "follows": {
            "status": "VARCHAR(20) NOT NULL DEFAULT 'accepted'",
        },
    }

    with engine.begin() as connection:
        for table_name, columns in additions.items():
            existing_columns = {column["name"] for column in inspector.get_columns(table_name)}
            for column_name, column_type in columns.items():
                if column_name not in existing_columns:
                    connection.execute(text(
                        f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}"
                    ))

        connection.execute(text(
            "CREATE UNIQUE INDEX IF NOT EXISTS uq_post_project_github_release "
            "ON posts (project_id, github_release_id)"
        ))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
