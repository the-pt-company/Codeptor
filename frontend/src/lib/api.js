import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Auth APIs
export const authAPI = {
    register: (data) => api.post('/api/auth/register', data),
    login: (data) => api.post('/api/auth/login', data),
    googleLogin: (data) => api.post('/api/auth/google', data),
    getMe: () => api.get('/api/auth/me'),
    updateMe: (data) => api.put('/api/auth/me', data),
    forgotPassword: (data) => api.post('/api/auth/forgot-password', data),
    resetPassword: (data) => api.post('/api/auth/reset-password', data),
};

// User APIs
export const userAPI = {
    getByUsername: (username) => api.get(`/api/users/${username}`),
    follow: (username) => api.post(`/api/users/${username}/follow`),
    unfollow: (username) => api.delete(`/api/users/${username}/follow`),
    getFollowers: (username) => api.get(`/api/users/${username}/followers`),
    getFollowing: (username) => api.get(`/api/users/${username}/following`),
    isFollowing: (username) => api.get(`/api/users/${username}/is-following`),
    getDevelopers: (params) => api.get('/api/developers', { params }),
};

// Project APIs
export const projectAPI = {
    create: (data) => api.post('/api/projects', data),
    getAll: (params) => api.get('/api/projects', { params }),
    getMy: () => api.get('/api/projects/my'),
    getByUsername: (username) => api.get(`/api/projects/user/${username}`),
    getById: (id) => api.get(`/api/projects/${id}`),
    update: (id, data) => api.put(`/api/projects/${id}`, data),
    delete: (id) => api.delete(`/api/projects/${id}`),
};

// Blog APIs
export const blogAPI = {
    create: (data) => api.post('/api/blogs', data),
    getAll: (params) => api.get('/api/blogs', { params }),
    getMy: () => api.get('/api/blogs/my'),
    getBySlug: (slug) => api.get(`/api/blogs/${slug}`),
    update: (id, data) => api.put(`/api/blogs/${id}`, data),
    delete: (id) => api.delete(`/api/blogs/${id}`),
    publish: (id) => api.post(`/api/blogs/${id}/publish`),
    unpublish: (id) => api.post(`/api/blogs/${id}/unpublish`),
    getComments: (id) => api.get(`/api/blogs/${id}/comments`),
    addComment: (id, data) => api.post(`/api/blogs/${id}/comments`, data),
    getReactions: (id) => api.get(`/api/blogs/${id}/reactions`),
    react: (id, data) => api.post(`/api/blogs/${id}/reactions`, data),
    toggleBookmark: (id) => api.post(`/api/blogs/${id}/bookmark`),
    getBookmarks: () => api.get('/api/bookmarks'),
    uploadImage: (formData) => api.post('/api/blogs/upload-image', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    }),
};

// Analytics APIs (separate microservice on port 4000)
const ANALYTICS_BASE_URL = process.env.REACT_APP_ANALYTICS_URL || 'http://localhost:4000';

const analyticsClient = axios.create({
    baseURL: ANALYTICS_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

export const analyticsAPI = {
    track: (page) => analyticsClient.post('/api/analytics/track', { page }),
    getPageStats: (page) => analyticsClient.get(`/api/analytics/stats/${encodeURIComponent(page)}`),
    getAllStats: () => analyticsClient.get('/api/analytics/stats'),
};


export default api;
