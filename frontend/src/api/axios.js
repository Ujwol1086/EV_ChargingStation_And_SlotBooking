import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: process.env.NODE_ENV === 'production'
        ? 'http://your-production-url/api'  // Replace with your production URL
        : 'http://localhost:5000/api',      // Use localhost for development
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor for adding auth token
api.interceptors.request.use(
    (config) =>
    {
        const token = localStorage.getItem('token');
        if (token)
        {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) =>
    {
        return Promise.reject(error);
    }
);

export default api;
