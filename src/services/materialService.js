// src/services/materialService.js
import api from './api'; // Asegúrate de importar la instancia de axios

export const createMaterial = async (createMaterialDto) => {
  try {
    const response = await api.post('/materiales', createMaterialDto); // Asegúrate de usar '/materiales' si esa es la ruta correcta en NestJS
    return response.data; // Devuelve la respuesta del servidor
  } catch (error) {
    console.error("Error al crear material:", error);
    return null; // Si hay un error, devuelve null
  }
};
