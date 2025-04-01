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

// Eliminar un material (soft delete)
export const deleteMaterial = async (id) => {
  try {
    const response = await api.delete(`/materiales/${id}`);
    return response.data;
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
    return response.data;
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
    return response.data;
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
    
    return response.data;
  } catch (error) {
    console.error('Error al subir la imagen:', error);
    throw new Error('No se pudo subir la imagen. Por favor, intente nuevamente.');
  }
};

// Add this function to your materialService
// Add or update this function in your materialService.js file
export const updateMaterialStock = async (materialId, newStock) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/materiales/${materialId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        stock_actual: newStock
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Error updating material stock');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in updateMaterialStock:', error);
    throw error;
  }
};
