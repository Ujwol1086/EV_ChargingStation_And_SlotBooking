import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: process.env.NODE_ENV === 'production'
        ? 'http://your-production-url/api'  // Replace with your production URL
        : 'http://192.168.1.67:5000/api',   // Use local network IP for mobile access
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
