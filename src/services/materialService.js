// src/services/materialService.js
import api from './api'; // Asegúrate de importar la instancia de axios

// Función auxiliar para transformar URLs de imágenes
const transformImageUrl = (material) => {
  if (material.imagen_url) {
    // Si la URL ya es absoluta (comienza con http:// o https://), la dejamos como está
    if (!material.imagen_url.startsWith('http')) {
      // Extraer solo el nombre del archivo
      const fileName = material.imagen_url.split('/').pop();
      // Construir la URL completa
      material.imagen_url = `${api.defaults.baseURL}/uploads/materiales/${fileName}`;
      
      // Log para debugging
      console.log('URL de imagen transformada:', material.imagen_url);
    }
  }
  return material;
};

// Crear un nuevo material
export const createMaterial = async (createMaterialDto) => {
  try {
    const response = await api.post('/materiales', createMaterialDto); // Asegúrate de usar '/materiales' si esa es la ruta correcta en NestJS
    return transformImageUrl(response.data);
  } catch (error) {
    console.error("Error al crear material:", error);
    throw error;
  }
};

// Obtener todos los materiales
export const getMaterials = async () => {
  try {
    const response = await api.get('/materiales');
    // Transformar las URLs de las imágenes para todos los materiales
    return response.data.map(material => transformImageUrl(material));
  } catch (error) {
    console.error("Error al obtener materiales:", error);
    throw error;
  }
};

// Obtener un material por ID
export const getMaterialById = async (id) => {
  try {
    const response = await api.get(`/materiales/${id}`);
    return transformImageUrl(response.data);
  } catch (error) {
    console.error(`Error al obtener material con ID ${id}:`, error);
    throw error;
  }
};

// Actualizar un material
export const updateMaterial = async (id, updateMaterialDto) => {
  try {
    const response = await api.patch(`/materiales/${id}`, updateMaterialDto);
    return transformImageUrl(response.data);
  } catch (error) {
    console.error(`Error al actualizar material con ID ${id}:`, error);
    throw error;
  }
};

// Eliminar un material (soft delete)
export const deleteMaterial = async (id) => {
  try {
    const response = await api.delete(`/materiales/${id}`);
    return transformImageUrl(response.data);
  } catch (error) {
    console.error(`Error al eliminar material con ID ${id}:`, error);
    if (error.response && error.response.status === 404) {
      throw new Error('No se encontró el material');
    } else if (error.response && error.response.data.message) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error('No se pudo eliminar el material. Por favor, intente nuevamente.');
    }
  }
};

// Obtener materiales inactivos
export const getInactiveMaterials = async () => {
  try {
    const response = await api.get('/materiales/all/inactive');
    return response.data.map(material => transformImageUrl(material));
  } catch (error) {
    console.error('Error al obtener materiales inactivos:', error);
    throw error;
  }
};

export const reactivateMaterial = async (id) => {
  try {
    // Usamos updateMaterial para cambiar solo el estado a true
    const response = await api.patch(`/materiales/${id}`, {
      estado: true
    });
    if (!response.data) {
      throw new Error('No se recibió respuesta del servidor');
    }
    return transformImageUrl(response.data);
  } catch (error) {
    console.error(`Error al reactivar material con ID ${id}:`, error);
    if (error.response) {
      if (error.response.status === 404) {
        throw new Error('No se encontró el material');
      } else if (error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
    }
    throw new Error('No se pudo reactivar el material. Por favor, intente nuevamente.');
  }
};

// Add this function to your existing materialService.js
export const uploadMaterialImage = async (id, imageFile) => {
  try {
    const formData = new FormData();
    formData.append('file', imageFile); // Cambiado de 'imagen' a 'file' para coincidir con el backend

    const response = await api.post(`/materiales/upload/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return transformImageUrl(response.data);
  } catch (error) {
    console.error('Error al subir la imagen:', error);
    throw new Error('No se pudo subir la imagen. Por favor, intente nuevamente.');
  }
};

// Add this function to your materialService
// Add or update this function in your materialService.js file
// Make sure your updateMaterialStock function looks like this:
export const updateMaterialStock = async (materialId, newStock) => {
  try {
    const response = await api.patch(`/materiales/${materialId}`, {
      stock_actual: newStock
    });
    
    return transformImageUrl(response.data);
  } catch (error) {
    console.error(`Error al actualizar stock del material con ID ${materialId}:`, error);
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error('No se pudo actualizar el stock del material');
    }
  }
};
