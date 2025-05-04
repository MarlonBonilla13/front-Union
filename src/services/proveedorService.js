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
    if (error.response?.status === 500) {
      throw new Error('Error interno del servidor. Por favor, contacte al administrador del sistema.');
    }
    throw new Error('No se pudieron cargar los proveedores. Por favor, intente nuevamente.');
  }
};

// Upload provider logo
export const uploadProveedorImage = async (id, imageFile) => {
  try {
    if (!imageFile) {
      throw new Error('No se ha seleccionado ningún archivo');
    }

    const formData = new FormData();
    formData.append('file', imageFile);

    const response = await api.post(`/proveedores/${id}/imagen`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 30000
    });
    
    if (!response.data) {
      throw new Error('No se recibió respuesta del servidor');
    }
    
    return transformImageUrl(response.data);
  } catch (error) {
    console.error('Error detallado al subir imagen:', error.response?.data || error);
    if (error.response?.status === 400) {
      throw new Error('Formato de archivo no válido. Por favor, use imágenes en formato jpg, jpeg, png o gif.');
    }
    throw new Error('No se pudo subir la imagen. Por favor, intente nuevamente.');
  }
};

// Eliminar la función uploadProveedorLogo ya que es redundante

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
    const datosFormateados = {
      ruc: proveedorData.ruc?.trim() || '', // Keep using RUC internally
      nombre: proveedorData.nombre?.trim() || '',
      contacto: proveedorData.contacto?.trim() || '',
      telefono: proveedorData.telefono?.trim() || '',
      correo: proveedorData.correo?.trim() || '',
      direccion: proveedorData.direccion?.trim() || '',
      tipo_proveedor: proveedorData.tipo_proveedor?.trim() || '',
      estado: Boolean(proveedorData.estado),
      notas: proveedorData.notas?.trim() || '',
      imagen_url: proveedorData.imagen_url || ''
    };

    const response = await api.post('/proveedores', datosFormateados);
    return transformImageUrl(response.data);
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    if (error.response?.status === 400) {
      throw new Error('Error en el formato de los datos. Por favor, verifique que el RUC no esté duplicado.');
    }
    throw error;
  }
};

export const updateProveedor = async (id, proveedorData) => {
  try {
    // Asegurarse de que los datos están en el formato correcto
    const datosFormateados = {
      ...proveedorData,
      ruc: proveedorData.ruc?.trim() || '', // Cambiado de nit a ruc
      nombre: proveedorData.nombre?.trim() || '',
      
      contacto: proveedorData.contacto?.trim() || '',
      telefono: proveedorData.telefono?.trim() || '',
      correo: proveedorData.correo?.trim() || '',
      direccion: proveedorData.direccion?.trim() || '',
      tipo_proveedor: proveedorData.tipo_proveedor?.trim() || '',
      estado: Boolean(proveedorData.estado),
      notas: proveedorData.notas?.trim() || '',
      imagen_url: proveedorData.imagen_url || ''
    };

    const response = await api.patch(`/proveedores/${id}`, datosFormateados);
    if (!response.data) {
      throw new Error('No se recibió respuesta del servidor');
    }
    return transformImageUrl(response.data);
  } catch (error) {
    console.error(`Error al actualizar proveedor con ID ${id}:`, error);
    if (error.response?.status === 400) {
      throw new Error('Error en el formato de los datos. Por favor, verifique que el NIT no esté duplicado y que todos los campos requeridos estén completos.');
    }
    throw new Error('No se pudo actualizar el proveedor. Por favor, intente nuevamente.');
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