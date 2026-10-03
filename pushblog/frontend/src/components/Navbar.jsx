import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useEffect, useRef, useState } from 'react';
import { getUnreadNotificationCount } from '../api/client';
import './Navbar.css';

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
    { label: 'Home', path: '/', number: '01', end: true },
    ...(user ? [{ label: 'Following', path: '/following', number: '02' }] : []),
    { label: 'Explore', path: '/explore', number: user ? '03' : '02' },
    ...(user ? [
      { label: 'My projects', path: '/projects', number: '04' },
      { label: 'Notifications', path: '/notifications', number: '05' },
    ] : []),
  ];

  return (
    <>
      <aside className="sidebar">
        <Link to="/" className="logo" aria-label="PushBlog home">
          pushblog<span>.</span>
        </Link>
        <div className="sidebar-caption">DEVELOPER JOURNAL</div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-link-number">{item.number}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          {user ? (
            <>
              <Link to={`/profile/${user.username}`} className="sidebar-user">
                <span className="sidebar-avatar">{user.username[0].toUpperCase()}</span>
                <span className="sidebar-user-details">
                  <strong>{user.username}</strong>
                  <small>Developer account</small>
                </span>
              </Link>
              <Link to="/settings" className="sidebar-settings">Profile settings</Link>
              <button onClick={handleLogout} className="sidebar-logout">Sign out</button>
            </>
          ) : (
            <div className="sidebar-auth-links">
              <Link to="/login">Sign in</Link>
              <Link to="/register">Create account</Link>
            </div>
          )}
        </div>
      </aside>

      <header className="topbar">
        <div className="topbar-context">
          <span className="status-indicator" />
          <span>{location.pathname.startsWith('/projects') ? 'WORKSPACE' : 'PUBLIC JOURNAL'}</span>
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
