import api from './api';

export const login = async (credentials) => {
  try {
    console.log('Intentando login con:', credentials);
    const response = await api.post('/auth/login', credentials);
    console.log('Respuesta raw:', response);
    console.log('Respuesta data:', response.data);
    
    // Si hay un error en la respuesta, lanzarlo
    if (response.data.error) {
      throw new Error(response.data.error);
    }

    // Validar la estructura completa de la respuesta
    const { access_token, usuario } = response.data;
    
    if (!access_token) {
      throw new Error('No se recibió el token de acceso');
    }

    if (!usuario || !usuario.role) {
      throw new Error('Información de usuario incompleta');
    }

    // Guardar en localStorage
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(usuario));

    return {
      user: usuario,
      token: access_token
    };
  } catch (error) {
    console.error('Error completo:', error);
    console.error('Detalles del error:', {
      name: error.name,
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack
    });
    
    // Relanzar el error con un mensaje más específico
    if (error.response?.status === 401) {
      throw new Error('Credenciales incorrectas');
    }
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};