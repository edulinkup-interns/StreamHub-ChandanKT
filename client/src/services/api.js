import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 300000, // 5 minutes timeout to allow large file uploads
});

// Attach JWT token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// Videos
export const videoApi = {
  getVideos: (params) => api.get('/videos', { params }),
  getById: (id) => api.get(`/videos/${id}`),
  upload: (data, onProgress) => api.post('/videos', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => onProgress?.(Math.round((e.loaded * 100) / e.total)),
  }),
  update: (id, data) => api.put(`/videos/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/videos/${id}`),
  like: (id) => api.post(`/videos/${id}/like`),
  dislike: (id) => api.post(`/videos/${id}/dislike`),
  getRecommendations: () => api.get('/videos/recommendations'),
  updateProgress: (id, data) => api.post(`/videos/${id}/progress`, data),
};

// Comments
export const commentApi = {
  getComments: (videoId, params) => api.get(`/comments/video/${videoId}`, { params }),
  addComment: (videoId, data) => api.post(`/comments/video/${videoId}`, data),
  getReplies: (commentId) => api.get(`/comments/${commentId}/replies`),
  likeComment: (commentId) => api.post(`/comments/${commentId}/like`),
  deleteComment: (commentId) => api.delete(`/comments/${commentId}`),
};

// Channels
export const channelApi = {
  getChannel: (username) => api.get(`/channels/${username}`),
  getChannelVideos: (username, params) => api.get(`/channels/${username}/videos`, { params }),
  subscribe: (channelId) => api.post(`/channels/${channelId}/subscribe`),
  getSubscriptions: () => api.get('/channels/subscriptions'),
  getSubscriptionFeed: (params) => api.get('/channels/feed', { params }),
};

// Playlists
export const playlistApi = {
  getMyPlaylists: () => api.get('/playlists/my'),
  create: (data) => api.post('/playlists', data),
  getById: (id) => api.get(`/playlists/${id}`),
  update: (id, data) => api.put(`/playlists/${id}`, data),
  delete: (id) => api.delete(`/playlists/${id}`),
  addVideo: (playlistId, videoId) => api.post(`/playlists/${playlistId}/videos/${videoId}`),
  removeVideo: (playlistId, videoId) => api.delete(`/playlists/${playlistId}/videos/${videoId}`),
};

// Search
export const searchApi = {
  search: (params) => api.get('/search', { params }),
  getSuggestions: (q) => api.get('/search/suggestions', { params: { q } }),
};

// Analytics
export const analyticsApi = {
  getChannelAnalytics: () => api.get('/analytics/channel'),
  getVideoAnalytics: (videoId) => api.get(`/analytics/video/${videoId}`),
  getWatchHistory: (params) => api.get('/analytics/history', { params }),
  clearHistory: () => api.delete('/analytics/history'),
};

export default api;
