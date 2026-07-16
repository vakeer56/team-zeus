const DEFAULT_API_BASE_URL = 
  typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3001'
    : 'https://team-zeus.onrender.com';

export const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') || DEFAULT_API_BASE_URL;

export const apiUrl = (path: string) =>
  `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
