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
    // Validar campos requeridos
    if (!proveedorData.ruc?.trim()) {
      throw new Error('El NIT es requerido');
    }
    if (!proveedorData.nombre?.trim()) {
      throw new Error('El nombre es requerido');
    }
    if (!proveedorData.tipo_proveedor?.trim()) {
      throw new Error('El tipo de proveedor es requerido');
    }

    // Log para debugging de los datos recibidos
    console.log('Datos recibidos:', proveedorData);

    // Crear objeto con solo los campos permitidos por el DTO
    const datosFormateados = {
      ruc: proveedorData.ruc.trim(), // Enviar como ruc en minúscula
      Ruc: proveedorData.ruc.trim(), // También enviar como Ruc por si acaso
      nombre: proveedorData.nombre.trim(),
      tipo_proveedor: proveedorData.tipo_proveedor.trim(),
      contacto: proveedorData.contacto?.trim() || '',
      telefono: proveedorData.telefono?.trim() || '',
      correo: proveedorData.correo?.trim() || '',
      direccion: proveedorData.direccion?.trim() || '',
      estado: proveedorData.estado ?? true,
      notas: proveedorData.notas?.trim() || ''
    };

    // Solo agregar imagen_url si existe y no es vacía
    if (proveedorData.imagen_url && proveedorData.imagen_url.trim() !== '') {
      datosFormateados.imagen_url = proveedorData.imagen_url;
    }

    // Log para debugging de los datos formateados
    console.log('Datos formateados a enviar:', datosFormateados);

    // Log de la URL y método
    console.log('Enviando POST a:', api.defaults.baseURL + '/proveedores');

    const response = await api.post('/proveedores', datosFormateados, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Log para debugging de la respuesta
    console.log('Respuesta del servidor:', response.data);

    return transformImageUrl(response.data);
  } catch (error) {
    // Log detallado del error
    console.error('Error completo:', error);
    console.error('Detalles del error:', {
      mensaje: error.message,
      respuesta: error.response?.data,
      estado: error.response?.status,
      headers: error.response?.headers,
      config: error.config
    });
    
    // Si es un error de validación local
    if (error.message.includes('requerido')) {
      throw error;
    }
    
    // Si es un error 400 del servidor
    if (error.response?.status === 400) {
      const serverMessage = error.response.data?.message;
      if (Array.isArray(serverMessage)) {
        throw new Error(serverMessage[0]); // Tomamos el primer mensaje de error
      }
      throw new Error('Error en el formato de los datos. Por favor, verifique que el NIT no esté duplicado.');
    }

    // Si es un error 500 del servidor
    if (error.response?.status === 500) {
      throw new Error('Error interno del servidor. Por favor, intente nuevamente.');
    }
    
    // Para otros errores
    throw new Error(`Error al crear el proveedor: ${error.message}`);
  }
};

export const updateProveedor = async (id, proveedorData) => {
  try {
    // Si solo estamos actualizando el estado, enviamos solo ese campo
    if (Object.keys(proveedorData).length === 1 && 'estado' in proveedorData) {
      const response = await api.patch(`/proveedores/${id}`, {
        estado: Boolean(proveedorData.estado)
      });
      
      if (!response.data) {
        throw new Error('No se recibió respuesta del servidor');
      }
      return transformImageUrl(response.data);
    }

    // Para actualizaciones completas, solo enviamos los campos que tienen valor
    const datosActualizados = {};

    // Solo incluimos los campos que tienen valor y han sido modificados
    if (proveedorData.nombre?.trim()) {
      datosActualizados.nombre = proveedorData.nombre.trim();
    }
    if (proveedorData.tipo_proveedor?.trim()) {
      datosActualizados.tipo_proveedor = proveedorData.tipo_proveedor.trim();
    }
    if (proveedorData.contacto?.trim()) {
      datosActualizados.contacto = proveedorData.contacto.trim();
    }
    if (proveedorData.telefono?.trim()) {
      datosActualizados.telefono = proveedorData.telefono.trim();
    }
    if (proveedorData.correo?.trim()) {
      datosActualizados.correo = proveedorData.correo.trim();
    }
    if (proveedorData.direccion?.trim()) {
      datosActualizados.direccion = proveedorData.direccion.trim();
    }
    if (proveedorData.notas?.trim()) {
      datosActualizados.notas = proveedorData.notas.trim();
    }
    if ('estado' in proveedorData) {
      datosActualizados.estado = Boolean(proveedorData.estado);
    }
    if (proveedorData.imagen_url) {
      datosActualizados.imagen_url = proveedorData.imagen_url;
    }

    // No incluimos el RUC en las actualizaciones
    console.log('Datos a enviar al servidor:', datosActualizados);

    const response = await api.patch(`/proveedores/${id}`, datosActualizados);
    if (!response.data) {
      throw new Error('No se recibió respuesta del servidor');
    }
    return transformImageUrl(response.data);
  } catch (error) {
    console.error(`Error al actualizar proveedor con ID ${id}:`, error);
    
    // Si es un error 400 del servidor
    if (error.response?.status === 400) {
      const errorMessage = error.response.data?.message || 'Error al actualizar el proveedor';
      throw new Error(Array.isArray(errorMessage) ? errorMessage[0] : errorMessage);
    }
    
    // Para otros errores
    throw new Error('Error al actualizar el proveedor. Por favor, intente nuevamente.');
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