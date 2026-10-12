CREATE TABLE IF NOT EXISTS bookmarks (
    bookmark_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    post_id INTEGER NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_bookmark_user_post UNIQUE (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS ix_bookmarks_user_id ON bookmarks (user_id);
CREATE INDEX IF NOT EXISTS ix_bookmarks_post_id ON bookmarks (post_id);
