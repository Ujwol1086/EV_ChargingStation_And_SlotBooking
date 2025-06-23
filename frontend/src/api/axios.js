import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor for adding auth token
axiosInstance.interceptors.request.use(
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

export default axiosInstance;
