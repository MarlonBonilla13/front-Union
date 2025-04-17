import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4001',
  headers: {
    'Content-Type': 'application/json',
  },
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
    // Log URL being requested for debugging
    if (config.url.includes('upload') || config.url.includes('clientes')) {
      console.log('Request URL:', `${api.defaults.baseURL}${config.url}`);
      console.log('Request method:', config.method);
      console.log('Request headers:', config.headers);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Error en la petición:', error);
    
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      // Devolver un mensaje de error más específico
      const errorMessage = error.response.data.message || 'Error en la operación';
      return Promise.reject(new Error(errorMessage));
    }
    return Promise.reject(new Error('Error de conexión con el servidor'));
  }
);

export default api;