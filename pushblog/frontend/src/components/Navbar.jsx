import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="logo">
          pushblog.
        </Link>

        <div className="navbar-right">
          <Link to="/explore" className="nav-link">explore</Link>

          {user ? (
            <>
              <Link to="/create" className="nav-link">new</Link>
              <Link to="/projects" className="nav-link">projects</Link>
              <Link to={`/profile/${user.username}`} className="nav-link">
                {user.username}
              </Link>
              <button onClick={handleLogout} className="nav-link nav-btn">
                logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">login</Link>
              <Link to="/register" className="nav-link nav-signup">
                sign up
              </Link>
            </>
          )}

          <button
            onClick={toggleTheme}
            className="theme-toggle"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? '◐' : '◑'}
          </button>
        </div>
      </div>
    </nav>
  );
}
