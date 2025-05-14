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
    
    // Información más detallada para errores de estado
    if (error.response?.status === 400) {
      console.error('Error 400 - Bad Request. Posible error en el formato de los datos enviados');
      console.error('Detalles del error:', error.response?.data);
      
      // Mostrar en detalle los datos que se enviaron
      console.error('Datos enviados:', error.config?.data ? JSON.parse(error.config.data) : 'Sin datos');
      
      // Si hay un mensaje específico del campo id_estado
      if (error.response?.data?.message?.includes('id_estado')) {
        console.error('⚠️ Error específico con campo id_estado detectado');
      }
    }
    else if (error.response?.status === 404) {
      console.error('Error 404 - Not Found. El recurso o endpoint no existe');
    }
    else if (error.response?.status === 401) {
      console.error('Error 401 - Unauthorized. Problemas de autenticación o token expirado');
    }
    else if (error.response?.status === 403) {
      console.error('Error 403 - Forbidden. No tiene permisos para esta acción');
    }
    else if (error.response?.status === 422) {
      console.error('Error 422 - Unprocessable Entity. Datos de entrada inválidos');
      console.error('Detalles de validación:', error.response?.data);
    }
    else if (error.response?.status === 500) {
      console.error('Error 500 - Internal Server Error. Error en el servidor');
    }
    
    console.error('Data:', error.response?.data);
    console.error('Headers:', error.response?.headers);
    console.error('=========================');
    
    // Añadir información adicional al error para facilitar el diagnóstico
    if (error.response) {
      error.detailedInfo = {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
        sentData: error.config?.data ? JSON.parse(error.config.data) : null
      };
    }
    
    throw error;
  }
);

export default api;