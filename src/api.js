import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Solo si usas cookies/sesiones
  headers: { "Content-Type": "application/json" }
});

export default api;