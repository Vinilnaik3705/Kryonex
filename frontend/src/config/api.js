// Use Vite's local proxy in development. In production, either variable may
// point to the deployed backend origin, with or without a trailing /api.
const configuredUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL;
const API_BASE_URL = configuredUrl
    ? `${configuredUrl.replace(/\/api\/?$/, '').replace(/\/$/, '')}/api`
    : '/api';

export default API_BASE_URL;
