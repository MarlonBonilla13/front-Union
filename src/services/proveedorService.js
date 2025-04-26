import api from './api';

// Función auxiliar para transformar URLs de imágenes
const transformImageUrl = (proveedor) => {
  if (proveedor.imagen_url) {
    // Si la URL ya es absoluta (comienza con http:// o https://), la dejamos como está
    if (!proveedor.imagen_url.startsWith('http')) {
      // Extraer solo el nombre del archivo
      const fileName = proveedor.imagen_url.split('/').pop();
      // Construir la URL completa
      proveedor.imagen_url = `${api.defaults.baseURL}/uploads/proveedores/${fileName}`;
      
      // Log para debugging
      console.log('URL de imagen transformada:', proveedor.imagen_url);
    }
  }
  return proveedor;
};

// Get all providers with proper image URLs
export const getProveedores = async () => {
  try {
    const response = await api.get('/proveedores');
    return response.data.map(proveedor => transformImageUrl(proveedor));
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    throw error;
  }
};

// Upload provider logo
export const uploadProveedorImage = async (id, imageFile) => {
  try {
    const formData = new FormData();
    formData.append('file', imageFile);

    const response = await api.post(`/proveedores/upload/${id}`, formData, {
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

// Get provider by ID with proper image URL
export const getProveedorById = async (id) => {
  try {
    const response = await api.get(`/proveedores/${id}`);
    return transformImageUrl(response.data);
  } catch (error) {
    console.error(`Error al obtener proveedor con ID ${id}:`, error);
    throw error;
  }
};

export const createProveedor = async (proveedorData) => {
  try {
    const response = await api.post('/proveedores', proveedorData);
    return transformImageUrl(response.data);
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    throw error;
  }
};

export const updateProveedor = async (id, proveedorData) => {
  try {
    const response = await api.patch(`/proveedores/${id}`, proveedorData);
    return transformImageUrl(response.data);
  } catch (error) {
    console.error(`Error al actualizar proveedor con ID ${id}:`, error);
    throw error;
  }
};

export const deleteProveedor = async (id) => {
  try {
    const response = await api.delete(`/proveedores/${id}`);
    return transformImageUrl(response.data);
  } catch (error) {
    console.error(`Error al eliminar proveedor con ID ${id}:`, error);
    throw error;
  }
};

export const reactivateProveedor = async (id) => {
  try {
    const response = await api.patch(`/proveedores/${id}`, {
      estado: true
    });
    return transformImageUrl(response.data);
  } catch (error) {
    console.error(`Error al reactivar proveedor con ID ${id}:`, error);
    throw error;
  }
};

export const uploadProveedorLogo = async (proveedorId, imageFile) => {
  try {
    const formData = new FormData();
    formData.append('file', imageFile);

    const response = await api.post(`/proveedores/upload/${proveedorId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000,
      responseType: 'json'
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};