import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getUser, getUserPosts, toggleFollow, checkFollowing } from '../api/client';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import './Profile.css';

export default function Profile() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const [profileRes, postsRes] = await Promise.all([
        getUser(username),
        getUserPosts(username),
      ]);
      setProfile(profileRes.data);
      setPosts(postsRes.data);

      if (currentUser && currentUser.username !== username) {
        try {
          const followRes = await checkFollowing(username);
          setIsFollowing(followRes.data.is_following);
        } catch (err) {
          // Not logged in or error
        }
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser || followLoading) return;

    setFollowLoading(true);
    try {
      const res = await toggleFollow(profile.user_id);
      setIsFollowing(res.data.following);
      setProfile({
        ...profile,
        followers_count: profile.followers_count + (res.data.following ? 1 : -1),
      });
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <div className="not-found">User not found</div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.username === username;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">
          {profile.profile?.avatar_url ? (
            <img src={profile.profile.avatar_url} alt={profile.username} />
          ) : (
            <span>{profile.username[0].toUpperCase()}</span>
          )}
        </div>

        <div className="profile-info">
          <div className="profile-name-row">
            <h1>{profile.profile?.display_name || profile.username}</h1>
            <span className="username">@{profile.username}</span>
          </div>

          {profile.profile?.bio && (
            <p className="profile-bio">{profile.profile.bio}</p>
          )}

          <div className="profile-links">
            {profile.profile?.github_url && (
              <a
                href={profile.profile.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="profile-link"
              >
                GitHub
              </a>
            )}
            {profile.profile?.website_url && (
              <a
                href={profile.profile.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="profile-link"
              >
                Website
              </a>
            )}
          </div>

          <div className="profile-stats">
            <div className="stat">
              <span className="stat-value">{posts.length}</span>
              <span className="stat-label">Posts</span>
            </div>
            <div className="stat">
              <span className="stat-value">{profile.followers_count}</span>
              <span className="stat-label">Followers</span>
            </div>
            <div className="stat">
              <span className="stat-value">{profile.following_count}</span>
              <span className="stat-label">Following</span>
            </div>
          </div>
        </div>

        <div className="profile-actions">
          {isOwnProfile ? (
            <Link to="/settings" className="edit-profile-btn">
              Edit Profile
            </Link>
          ) : currentUser ? (
            <button
              className={`follow-btn ${isFollowing ? 'following' : ''}`}
              onClick={handleFollow}
              disabled={followLoading}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          ) : null}
        </div>
      </div>

      <div className="profile-posts">
        <h2>Posts</h2>
        {posts.length === 0 ? (
          <div className="empty-posts">
            <p>No posts yet</p>
            {isOwnProfile && (
              <Link to="/create" className="create-first-post">
                Create your first post
              </Link>
            )}
          </div>
        ) : (
          <div className="posts-list">
            {posts.map((post) => (
              <PostCard key={post.post_id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
