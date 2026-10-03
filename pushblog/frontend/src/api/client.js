import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const register = (data) => api.post('/api/auth/register', data);
export const login = (data) => api.post('/api/auth/login', data);
export const getMe = () => api.get('/api/auth/me');

// Users
export const getUser = (username) => api.get(`/api/users/${username}`);
export const updateProfile = (data) => api.put('/api/users/profile', data);
export const getUserPosts = (username) => api.get(`/api/users/${username}/posts`);
export const checkFollowing = (username) => api.get(`/api/users/${username}/is-following`);

// Projects
export const getProjects = () => api.get('/api/projects');
export const createProject = (data) => api.post('/api/projects', data);
export const updateProject = (id, data) => api.put(`/api/projects/${id}`, data);
export const deleteProject = (id) => api.delete(`/api/projects/${id}`);

// Posts
export const getFeed = () => api.get('/api/posts');
export const explorePosts = () => api.get('/api/posts/explore');
export const getPost = (id) => api.get(`/api/posts/${id}`);
export const createPost = (data) => api.post('/api/posts', data);
export const updatePost = (id, data) => api.put(`/api/posts/${id}`, data);
export const deletePost = (id) => api.delete(`/api/posts/${id}`);

// Social
export const toggleLike = (postId) => api.post(`/api/posts/${postId}/like`);
export const getComments = (postId) => api.get(`/api/posts/${postId}/comments`);
export const addComment = (postId, data) => api.post(`/api/posts/${postId}/comments`, data);
export const deleteComment = (commentId) => api.delete(`/api/comments/${commentId}`);
export const toggleFollow = (userId) => api.post(`/api/users/${userId}/follow`);
export const getFollowers = (userId) => api.get(`/api/users/${userId}/followers`);
export const getFollowing = (userId) => api.get(`/api/users/${userId}/following`);

// Upload
export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
};

export default api;
