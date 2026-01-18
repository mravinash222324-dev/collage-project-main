import axios from 'axios';

// Use environment variable for API URL, fallback to localhost if not set
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add the auth token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle common errors (like 401 Unauthorized)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('accessToken');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

export default api;

export const teamApi = {
    addMember: (projectId: number, username: string) =>
        api.post(`/projects/${projectId}/members/`, { username }),

    removeMember: (projectId: number, userId: number) =>
        api.delete(`/projects/${projectId}/members/`, { params: { user_id: userId } })
};
