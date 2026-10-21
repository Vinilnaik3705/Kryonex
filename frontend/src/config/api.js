// Centralized API configuration. Accept both names so existing deployments do
// not silently fall back to localhost and produce confusing 404/connection errors.
const configuredUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const BASE_URL = configuredUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
const API_BASE_URL = `${BASE_URL}/api`;

export default API_BASE_URL;
