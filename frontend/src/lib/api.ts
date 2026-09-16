import axios from 'axios';

// In production, nginx proxies /api and /r to the backend, so use relative URL.
// In dev, VITE_API_URL points to the local backend.
const API_URL = import.meta.env.VITE_API_URL || '';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export default apiClient;
