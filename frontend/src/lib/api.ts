import axios from 'axios';

// In production (Docker/nginx), always use relative URL — nginx proxies to backend.
// In dev, VITE_API_URL points to the local backend.
const API_URL = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3000');

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export default apiClient;
