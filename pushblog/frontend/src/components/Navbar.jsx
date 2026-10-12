import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useEffect, useRef, useState } from 'react';
import { getUnreadNotificationCount } from '../api/client';
import UserAvatar from './UserAvatar';
import './Navbar.css';

const navigationIcons = {
  Home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v12h14V9M9 21v-7h6v7" /></>,
  Following: <><circle cx="9" cy="8" r="3" /><path d="M3 21c.5-4 2.5-6 6-6s5.5 2 6 6M16 5a3 3 0 0 1 0 6M18 15c2 .7 3 2.5 3 5" /></>,
  Explore: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" /></>,
  'My projects': <><path d="M3 7h7l2 2h9v11H3V7Z" /><path d="M3 7V5h7l2 2" /></>,
  Notifications: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" /></>,
  Bookmarks: <path d="M6 4h12v17l-6-4-6 4V4Z" />,
  Settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.4.8l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.4-.8l-1.7.7-1.4-2.4L8 15a7 7 0 0 1 0-1.6l-1.5-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.4-.8l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.4.8l1.7-.7 1.4 2.4-1.5 1.1a7 7 0 0 1 0 1.6Z" /></>,
};

function NavigationIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="sidebar-link-icon">
      {navigationIcons[name]}
    </svg>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchText, setSearchText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const searchInput = useRef(null);

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInput.current?.focus();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;
    const loadUnreadCount = () => {
      getUnreadNotificationCount()
        .then((res) => {
          if (!cancelled) setUnreadCount(res.data.count);
        })
        .catch(() => {
          if (!cancelled) setUnreadCount(0);
        });
    };
    loadUnreadCount();
    window.addEventListener('pushblog-notifications-updated', loadUnreadCount);
    return () => {
      cancelled = true;
      window.removeEventListener('pushblog-notifications-updated', loadUnreadCount);
    };
  }, [user, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearch = (event) => {
    event.preventDefault();
    const query = searchText.trim();
    navigate(query ? `/explore?q=${encodeURIComponent(query)}` : '/explore');
  };

  const navItems = [
    { label: 'Home', path: '/', end: true },
    { label: 'Following', path: '/following' },
    { label: 'Explore', path: '/explore' },
    { label: 'My projects', path: '/projects' },
    { label: 'Notifications', path: '/notifications', badge: unreadCount },
    { label: 'Bookmarks', path: '/bookmarks' },
    { label: 'Settings', path: '/settings' },
  ];

  return (
    <>
      <aside className="sidebar">
        <Link to="/" className="logo" aria-label="PushBlog home">
          <span className="logo-mark"><i /><i /><i /></span>
          <strong>PushBlog</strong>
        </Link>
        <div className="sidebar-caption">WORKSPACE</div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <NavigationIcon name={item.label} />
              <span>{item.label}</span>
              {item.badge > 0 && <b>{item.badge > 99 ? '99+' : item.badge}</b>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          {user ? (
            <>
              <Link to={`/profile/${user.username}`} className="sidebar-user">
                <span className="sidebar-avatar">
                  <UserAvatar user={user} alt={`${user.username} avatar`} />
                </span>
                <span className="sidebar-user-details">
                  <strong>{user.username}</strong>
                  <small>Developer account</small>
                </span>
              </Link>
              <Link to="/settings" className="sidebar-settings">Profile settings</Link>
              <button onClick={handleLogout} className="sidebar-logout">Sign out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="sidebar-user sidebar-guest">
                <span className="sidebar-avatar">?</span>
                <span className="sidebar-user-details">
                  <strong>Account</strong>
                  <small>Sign in or create an account</small>
                </span>
              </Link>
              <Link to="/register" className="sidebar-settings">Create account</Link>
            </>
          )}
        </div>
      </aside>

      <header className="topbar">
        <div className="topbar-context">
          <span className="topbar-page">{location.pathname.startsWith('/projects') ? 'Projects' : location.pathname === '/' ? 'Home' : location.pathname.slice(1).replaceAll('/', ' ')}</span>
        </div>
        <form className="global-search" onSubmit={handleSearch} role="search">
          <span className="search-mark" aria-hidden="true">/</span>
          <input
            ref={searchInput}
            type="search"
            aria-label="Search changelogs"
            placeholder="Search updates, projects, people..."
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
          <kbd>Ctrl K</kbd>
        </form>
        <div className="topbar-actions">
          {user && (
            <>
              <Link to="/notifications" className="topbar-notifications" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}>
                Alerts{unreadCount > 0 && <span>{unreadCount > 99 ? '99+' : unreadCount}</span>}
              </Link>
              <Link to="/create" className="topbar-create">Write update <span>+</span></Link>
            </>
          )}
          <button
            onClick={toggleTheme}
            className="theme-toggle"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          >
            {theme === 'light' ? 'Dark' : 'Light'}
          </button>
        </div>
      </header>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navItems.map((item) => (
          <NavLink key={item.path} to={item.path} end={item.end}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
