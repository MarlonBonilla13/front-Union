// src/services/materialService.js
import api from './api'; // Asegúrate de importar la instancia de axios

// Crear un nuevo material
export const createMaterial = async (createMaterialDto) => {
  try {
    const response = await api.post('/materiales', createMaterialDto); // Asegúrate de usar '/materiales' si esa es la ruta correcta en NestJS
    return response.data; // Devuelve la respuesta del servidor
  } catch (error) {
    console.error("Error al crear material:", error);
    throw error;
  }
};

// Obtener todos los materiales
export const getMaterials = async () => {
  try {
    const response = await api.get('/materiales');
    return response.data;
  } catch (error) {
    console.error("Error al obtener materiales:", error);
    throw error;
  }
};

// Obtener un material por ID
export const getMaterialById = async (id) => {
  try {
    const response = await api.get(`/materiales/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener material con ID ${id}:`, error);
    throw error;
  }
};

// Actualizar un material
export const updateMaterial = async (id, updateMaterialDto) => {
  try {
    const response = await api.patch(`/materiales/${id}`, updateMaterialDto);
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar material con ID ${id}:`, error);
    throw error;
  }
};

// Eliminar un material
export const deleteMaterial = async (id) => {
  try {
    const response = await api.delete(`/materiales/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar material con ID ${id}:`, error);
    throw error;
  }
};
