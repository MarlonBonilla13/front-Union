import api from './api';

// Función auxiliar para transformar URLs de imágenes
const transformImageUrl = (cliente) => {
  if (cliente.imagen_url) {
    // Si la URL ya es absoluta (comienza con http:// o https://), la dejamos como está
    if (!cliente.imagen_url.startsWith('http')) {
      // Extraer solo el nombre del archivo
      const fileName = cliente.imagen_url.split('/').pop();
      // Construir la URL completa
      cliente.imagen_url = `${api.defaults.baseURL}/uploads/clientes/${fileName}`;
      
      // Log para debugging
      console.log('URL de imagen transformada:', cliente.imagen_url);
    }
  }
  return cliente;
};

// Obtener todos los clientes
export const getClientes = async () => {
  try {
    const response = await api.get('/clientes');
    return response.data.map(cliente => transformImageUrl(cliente));
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    throw error;
  }
};

export const uploadClienteLogo = async (clienteId, imageFile) => {
  try {
    const formData = new FormData();
    formData.append('file', imageFile);

    const response = await api.post(`/clientes/upload/${clienteId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000,
      responseType: 'json'
    });
    
    return transformImageUrl(response.data);
  } catch (error) {
    console.error('Error al subir el logo:', error);
    if (error.response?.status === 413) {
      throw new Error('El archivo es demasiado grande');
    } else if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('No se pudo subir el logo. Por favor, intente nuevamente.');
  }
};

// Obtener un cliente por ID
export const getClienteById = async (id) => {
  try {
    const response = await api.get(`/clientes/${id}`);
    return transformImageUrl(response.data);
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    throw error;
  }
};

// Crear un nuevo cliente
export const createCliente = async (clienteData) => {
  try {
    // Ensure we only send the fields defined in CreateClienteDto
    const clienteDto = {
      nombre: clienteData.nombre,
      apellido: clienteData.apellido,
      telefono: clienteData.telefono,
      correo: clienteData.correo,
      lugar: clienteData.lugar,
      direccion: clienteData.direccion,
      tipo_cliente: clienteData.tipo_cliente,
      nombre_comercial: clienteData.nombre_comercial || null,
      estado: clienteData.estado ?? true,
      terminos_pago: clienteData.terminos_pago || null
    };

    const response = await api.post('/clientes', clienteDto);
    return transformImageUrl(response.data);
  } catch (error) {
    console.error('Error al crear cliente:', error);
    throw error;
  }
};

// Actualizar un cliente
export const updateCliente = async (id, clienteData) => {
  try {
    // Remove properties that shouldn't be sent to the backend
    const { id_cliente, fecha_registro, fecha_actualizacion, imagen_url, ...updateData } = clienteData;
    
    const response = await api.patch(`/clientes/${id}`, updateData);
    return transformImageUrl(response.data);
  } catch (error) {
    console.error(`Error al actualizar cliente con ID ${id}:`, error);
    throw error;
  }
};

// Eliminar un cliente
export const deleteCliente = async (id) => {
  try {
    const response = await api.delete(`/clientes/${id}`);
    return transformImageUrl(response.data);
  } catch (error) {
    console.error(`Error al eliminar cliente con ID ${id}:`, error);
    throw error;
  }
};

// Cambiar estado de un cliente
export const cambiarEstadoCliente = async (clienteId, estado) => {
  try {
    const response = await api.patch(`/clientes/${clienteId}`, {
      estado: estado
    });
    return transformImageUrl(response.data);
  } catch (error) {
    console.error('Error al cambiar estado del cliente:', error);
    throw error;
  }
};