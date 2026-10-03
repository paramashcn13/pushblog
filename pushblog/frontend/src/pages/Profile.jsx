import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getFollowers,
  getFollowing,
  getUser,
  getUserPosts,
  toggleFollow,
  checkFollowing,
} from '../api/client';
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
  const [followStatus, setFollowStatus] = useState('none');
  const [followLoading, setFollowLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('updates');
  const [relationshipUsers, setRelationshipUsers] = useState([]);
  const [relationshipLoading, setRelationshipLoading] = useState(false);
  const [relationshipError, setRelationshipError] = useState('');

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
          setFollowStatus(followRes.data.status || (followRes.data.is_following ? 'accepted' : 'none'));
          setIsFollowing(followRes.data.status === 'accepted' || followRes.data.is_following);
        } catch {
          setFollowStatus('none');
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
      setFollowStatus(res.data.status || (res.data.following ? 'accepted' : 'none'));
      setProfile({
        ...profile,
        followers_count: profile.followers_count + (
          res.data.following && !isFollowing ? 1 :
            isFollowing && !res.data.following ? -1 : 0
        ),
      });
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleSectionChange = async (section) => {
    setActiveSection(section);
    setRelationshipError('');
    if (section === 'updates') return;
    setRelationshipLoading(true);
    try {
      const result = section === 'followers'
        ? await getFollowers(profile.user_id)
        : await getFollowing(profile.user_id);
      setRelationshipUsers(result.data);
    } catch (err) {
      setRelationshipError(err.response?.data?.detail || 'Could not load this list.');
    } finally {
      setRelationshipLoading(false);
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
          {profile.profile?.is_private && (
            <span className="profile-privacy-label">PRIVATE ACCOUNT</span>
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
              className={`follow-btn ${followStatus !== 'none' ? 'following' : ''}`}
              onClick={handleFollow}
              disabled={followLoading}
            >
              {followStatus === 'pending' ? 'Requested' : isFollowing ? 'Following' : 'Follow'}
            </button>
          ) : null}
        </div>
      </div>

      <div className="profile-posts">
        {!isOwnProfile && profile.profile?.is_private && !isFollowing && (
          <div className="private-profile-notice">
            <span className="eyebrow">PRIVATE ACCOUNT</span>
            <p>Only public updates are visible until your follow request is approved.</p>
          </div>
        )}
        <nav className="profile-tabs" aria-label="Profile sections">
          <button className={activeSection === 'updates' ? 'active' : ''} onClick={() => handleSectionChange('updates')}>Updates <span>{posts.length}</span></button>
          <button className={activeSection === 'followers' ? 'active' : ''} onClick={() => handleSectionChange('followers')}>Followers <span>{profile.followers_count}</span></button>
          <button className={activeSection === 'following' ? 'active' : ''} onClick={() => handleSectionChange('following')}>Following <span>{profile.following_count}</span></button>
        </nav>

        {activeSection === 'updates' ? (
          <>
            {posts.length === 0 ? (
              <div className="empty-posts">
                <p>No public updates yet</p>
                {isOwnProfile && <Link to="/create" className="create-first-post">Create your first update</Link>}
              </div>
            ) : (
              <div className="posts-list">
                {posts.map((post) => <PostCard key={post.post_id} post={post} />)}
              </div>
            )}
          </>
        ) : relationshipLoading ? (
          <p className="relationship-state">Loading {activeSection}...</p>
        ) : relationshipError ? (
          <p className="relationship-state relationship-error">{relationshipError}</p>
        ) : relationshipUsers.length ? (
          <div className="profile-relationships">
            {relationshipUsers.map((person) => (
              <Link className="profile-relationship-row" key={person.user_id} to={`/profile/${person.username}`}>
                <span className="relationship-avatar">{person.username[0].toUpperCase()}</span>
                <span><strong>{person.username}</strong><small>View developer profile</small></span>
                <span className="relationship-arrow">↗</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="relationship-state">No {activeSection} yet.</p>
        )}
      </div>
    </div>
  );
}
