-- Apply before deploying when AUTO_CREATE_TABLES=false.
ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS webhook_secret VARCHAR(64);

ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE follows
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'accepted';

ALTER TABLE posts
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'published';

ALTER TABLE posts
    ADD COLUMN IF NOT EXISTS github_release_id VARCHAR(50);

ALTER TABLE posts
    ADD COLUMN IF NOT EXISTS release_compare_url VARCHAR(1000);

ALTER TABLE posts
    ADD COLUMN IF NOT EXISTS release_impact JSON;

CREATE UNIQUE INDEX IF NOT EXISTS uq_post_project_github_release
    ON posts (project_id, github_release_id);