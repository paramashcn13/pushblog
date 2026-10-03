import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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
import './App.css';

function AppFrame() {
  const location = useLocation();
  const isAuthRoute = ['/login', '/register'].includes(location.pathname);

  return (
    <div className={`app ${isAuthRoute ? 'app-auth' : ''}`}>
      {!isAuthRoute && <Navbar />}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home key="home" initialTab="following" />} />
          <Route path="/following" element={<Home key="following" initialTab="following" />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/create" element={<CreatePost />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/project/:id" element={<PublicProject />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/notifications" element={<Notifications />} />
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
