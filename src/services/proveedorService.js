import api from './api';

// Get all providers with proper image URLs
export const getProveedores = async () => {
  try {
    const response = await api.get('/proveedores');
    // Transform image URLs for all providers
    const proveedoresWithImages = response.data.map(proveedor => {
      // Limpiar la ruta de la imagen eliminando duplicados
      const cleanImagePath = proveedor.imagen_url?.replace(/^(uploads\/)?proveedores\//, '');
      
      return {
        ...proveedor,
        imagen_url: cleanImagePath ? `${api.defaults.baseURL}/uploads/proveedores/${cleanImagePath}` : null
      };
    });
    return proveedoresWithImages;
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    throw error;
  }
};

// Upload provider logo
export const uploadProveedorImage = async (id, file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/proveedores/${id}/imagen`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000,
      responseType: 'json'
    });
    
    // Limpiar el nombre del archivo
    const cleanFilename = response.data.filename?.replace(/^(uploads\/)?proveedores\//, '');
    // Construct and return the full image URL
    const imageUrl = `${api.defaults.baseURL}/uploads/proveedores/${cleanFilename}`;
    return { ...response.data, imageUrl };
  } catch (error) {
    console.error('Detailed upload error:', error.response?.data || error.message);
    throw error;
  }
};

// Get provider by ID with proper image URL
export const getProveedorById = async (id) => {
  try {
    const response = await api.get(`/proveedores/${id}`);
    const proveedor = response.data;
    
    // Ensure the image URL is properly constructed
    if (proveedor.imagen_url) {
      // Limpiar la ruta de la imagen
      const cleanImagePath = proveedor.imagen_url.replace(/^(uploads\/)?proveedores\//, '');
      proveedor.imagen_url = `${api.defaults.baseURL}/uploads/proveedores/${cleanImagePath}`;
    }
    
    return proveedor;
  } catch (error) {
    console.error('Error fetching provider:', error);
    throw error;
  }
};

export const createProveedor = async (proveedor) => {
  try {
    // Ensure all required fields are present
    const proveedorData = {
      ruc: proveedor.ruc,
      nombre: proveedor.nombre,
      contacto: proveedor.contacto,
      telefono: proveedor.telefono,
      correo: proveedor.correo || '',
      direccion: proveedor.direccion || '',
      tipo_proveedor: proveedor.tipo_proveedor,
      estado: proveedor.estado,
      notas: proveedor.notas || ''
    };

    const response = await api.post('/proveedores', proveedorData);
    return response.data;
  } catch (error) {
    console.error('Error creating proveedor:', error.response?.data || error.message);
    throw error;
  }
};

export const updateProveedor = async (id, proveedor) => {
  try {
    // Remove properties that shouldn't be sent to the backend
    const { id_proveedores, fecha_registro, fecha_actualizacion, imagen_url, ...updateData } = proveedor;
    
    // Ensure all fields are properly formatted
    const proveedorData = {
      ruc: updateData.ruc?.trim(),
      nombre: updateData.nombre?.trim(),
      contacto: updateData.contacto?.trim(),
      telefono: updateData.telefono?.trim(),
      correo: updateData.correo?.trim() || '',
      direccion: updateData.direccion?.trim() || '',
      tipo_proveedor: updateData.tipo_proveedor,
      estado: updateData.estado ?? true,
      notas: updateData.notas?.trim() || ''
    };

    console.log('Updating proveedor with data:', proveedorData); // Debug log

    const response = await api.patch(`/proveedores/${id}`, proveedorData);
    return response.data;
  } catch (error) {
    console.error('Error updating proveedor:', error.response?.data || error.message);
    throw error;
  }
};

export const deleteProveedor = async (id) => {
  try {
    const response = await api.delete(`/proveedores/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const reactivateProveedor = async (id) => {
  try {
    const response = await api.patch(`/proveedores/${id}`, { estado: true });
    return response.data;
  } catch (error) {
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