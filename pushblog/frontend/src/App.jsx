import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Explore from './pages/Explore';
import PublicProject from './pages/PublicProject';
import Login from './pages/Login';
import Register from './pages/Register';
import CreatePost from './pages/CreatePost';
import PostDetail from './pages/PostDetail';
import Profile from './pages/Profile';
import Projects from './pages/Projects';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import Bookmarks from './pages/Bookmarks';
import './App.css';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="route-loading">Loading your workspace...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppFrame() {
  const location = useLocation();
  const isAuthRoute = ['/login', '/register'].includes(location.pathname);

  return (
    <div className={`app ${isAuthRoute ? 'app-auth' : ''}`}>
      {!isAuthRoute && <Navbar />}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home key="home" initialTab="following" />} />
          <Route path="/following" element={<RequireAuth><Home key="following" initialTab="following" /></RequireAuth>} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/create" element={<CreatePost />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/projects" element={<RequireAuth><Projects /></RequireAuth>} />
          <Route path="/project/:id" element={<PublicProject />} />
          <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
          <Route path="/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
          <Route path="/bookmarks" element={<RequireAuth><Bookmarks /></RequireAuth>} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppFrame />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
