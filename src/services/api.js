import axios from 'axios';
import { API_BASE_URL } from '../config/config';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add a debug log to see the base URL
console.log('API Base URL:', api.defaults.baseURL);

// Interceptor para agregar el token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log detallado de la petición
    console.log('=== Detalles de la petición ===');
    console.log('URL completa:', `${api.defaults.baseURL}${config.url}`);
    console.log('Método:', config.method.toUpperCase());
    console.log('Headers:', JSON.stringify(config.headers, null, 2));
    console.log('Datos:', config.data ? JSON.stringify(config.data, null, 2) : 'Sin datos');
    console.log('============================');

    return config;
  },
  (error) => {
    console.error('Error en el interceptor de petición:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => {
    console.log('=== Respuesta exitosa ===');
    console.log('URL:', response.config.url);
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    console.log('========================');
    return response;
  },
  (error) => {
    console.error('=== Error en la petición ===');
    console.error('URL:', error.config?.url);
    console.error('Método:', error.config?.method);
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Headers:', error.response?.headers);
    console.error('=========================');
    throw error;
  }
);

export default api;