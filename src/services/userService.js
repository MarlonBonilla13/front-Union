import api from './api';

// Crear un nuevo usuario
export const createUser = async (createUserDto) => {
  try {
    const response = await api.post('/usuario', createUserDto);
    return response.data;
  } catch (error) {
    console.error("Error al crear usuario:", error);
    throw error;
  }
};

// Obtener todos los usuarios
export const getUsers = async () => {
  try {
    const response = await api.get('/usuario');
    return response.data;
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    throw error;
  }
};

// Obtener un usuario por ID
export const getUserById = async (id) => {
  try {
    const response = await api.get(`/usuario/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    throw error;
  }
};

// Otros métodos del servicio de usuario que puedas necesitar
// Actualizar un usuario
export const updateUser = async (id, updateUserDto) => {
  try {
    const response = await api.patch(`/usuario/${id}`, updateUserDto);
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar usuario con ID ${id}:`, error);
    throw error;
  }
};

// Eliminar un usuario
export const deleteUser = async (id) => {
  try {
    const response = await api.delete(`/usuario/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar usuario con ID ${id}:`, error);
    throw error;
  }
};