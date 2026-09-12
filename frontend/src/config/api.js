// Use Vite's local proxy in development; VITE_BACKEND_URL points at the deployed backend in production.
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL
    ? `${import.meta.env.VITE_BACKEND_URL}/api`
    : '/api';

export default API_BASE_URL;
