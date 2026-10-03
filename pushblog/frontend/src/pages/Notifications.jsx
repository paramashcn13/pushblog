import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  acceptFollowRequest,
  getFollowRequests,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  rejectFollowRequest,
} from '../api/client';
import { useAuth } from '../context/AuthContext';
import './Notifications.css';

export default function Notifications() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('activity');
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (authLoading) return () => { cancelled = true; };
    if (!user) {
      navigate('/login');
      return () => { cancelled = true; };
    }

    Promise.all([getNotifications(), getFollowRequests()])
      .then(([notificationResult, requestResult]) => {
        if (cancelled) return;
        setNotifications(notificationResult.data);
        setRequests(requestResult.data);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load your notifications.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [authLoading, user, navigate]);

  const handleMarkRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);
      setNotifications((items) => items.map((item) => (
        item.notification_id === notificationId ? { ...item, is_read: true } : item
      )));
      window.dispatchEvent(new Event('pushblog-notifications-updated'));
    } catch {
      setError('Could not update this notification.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((items) => items.map((item) => ({ ...item, is_read: true })));
      window.dispatchEvent(new Event('pushblog-notifications-updated'));
    } catch {
      setError('Could not mark notifications as read.');
    }
  };

  const handleRequest = async (followerId, action) => {
    setWorkingId(followerId);
    setError('');
    try {
      if (action === 'accept') await acceptFollowRequest(followerId);
      else await rejectFollowRequest(followerId);
      setRequests((items) => items.filter((item) => item.follower.user_id !== followerId));
      window.dispatchEvent(new Event('pushblog-notifications-updated'));
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Could not update follow request.');
    } finally {
      setWorkingId(null);
    }
  };

  const unreadCount = notifications.filter((notification) => !notification.is_read).length;
  const today = new Date().toDateString();
  const todayNotifications = notifications.filter((item) => new Date(item.created_at).toDateString() === today);
  const earlierNotifications = notifications.filter((item) => new Date(item.created_at).toDateString() !== today);

  const renderNotification = (notification) => (
    <article className={`notification-row ${notification.is_read ? '' : 'unread'}`} key={notification.notification_id}>
      <span className="notification-indicator" aria-hidden="true" />
      <div className="notification-copy">
        <p>{notification.message || 'You have a new notification.'}</p>
        <time dateTime={notification.created_at}>{new Date(notification.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time>
      </div>
      {!notification.is_read && (
        <button type="button" className="mark-read-btn" onClick={() => handleMarkRead(notification.notification_id)}>
          Mark read
        </button>
      )}
    </article>
  );

  return (
    <div className="notifications-page">
      <header className="notifications-heading">
        <div>
          <span className="eyebrow"><span /> INBOX / ACTIVITY</span>
          <h1>Notifications</h1>
          <p>Follows, requests, and conversations around your updates.</p>
        </div>
        {unreadCount > 0 && <button type="button" className="mark-all-read" onClick={handleMarkAllRead}>Mark all read</button>}
      </header>

      <div className="notification-tabs" role="tablist" aria-label="Notification sections">
        <button type="button" role="tab" aria-selected={activeTab === 'activity'} className={activeTab === 'activity' ? 'active' : ''} onClick={() => setActiveTab('activity')}>
          Activity <span>{unreadCount || notifications.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={activeTab === 'requests'} className={activeTab === 'requests' ? 'active' : ''} onClick={() => setActiveTab('requests')}>
          Follow requests <span>{requests.length}</span>
        </button>
      </div>

      {error && <p className="notifications-error" role="alert">{error}</p>}

      {loading ? (
        <div className="notifications-loading"><div /><div /><div /></div>
      ) : activeTab === 'requests' ? (
        requests.length ? (
          <div className="follow-request-list">
            {requests.map((request) => (
              <article className="follow-request-row" key={request.follower.user_id}>
                <span className="request-avatar">{request.follower.username[0].toUpperCase()}</span>
                <div className="request-copy">
                  <Link to={`/profile/${request.follower.username}`}>@{request.follower.username}</Link>
                  <span>requested to follow you</span>
                  <time dateTime={request.created_at}>{new Date(request.created_at).toLocaleDateString()}</time>
                </div>
                <div className="request-actions">
                  <button type="button" className="accept-request" disabled={workingId === request.follower.user_id} onClick={() => handleRequest(request.follower.user_id, 'accept')}>
                    {workingId === request.follower.user_id ? 'Updating...' : 'Approve'}
                  </button>
                  <button type="button" className="reject-request" disabled={workingId === request.follower.user_id} onClick={() => handleRequest(request.follower.user_id, 'reject')}>Decline</button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="notifications-empty">
            <span className="eyebrow">NO PENDING REQUESTS</span>
            <h2>Follow requests will appear here.</h2>
          </div>
        )
      ) : notifications.length ? (
        <div className="notification-groups">
          {todayNotifications.length > 0 && (
            <section>
              <h2>Today</h2>
              {todayNotifications.map(renderNotification)}
            </section>
          )}
          {earlierNotifications.length > 0 && (
            <section>
              <h2>Earlier</h2>
              {earlierNotifications.map(renderNotification)}
            </section>
          )}
        </div>
      ) : (
        <div className="notifications-empty">
          <span className="eyebrow">ALL CAUGHT UP</span>
          <h2>Activity around your work will show here.</h2>
          <p>Likes, comments, and follow activity stay connected to the update that started them.</p>
        </div>
      )}
    </div>
  );
}