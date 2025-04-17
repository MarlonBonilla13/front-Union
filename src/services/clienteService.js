import api from './api';

// Obtener todos los clientes
export const getClientes = async () => {
  try {
    const response = await api.get('/clientes');
    // Transform image URLs for all clients
    const clientesWithImages = response.data.map(cliente => ({
      ...cliente,
      imagen_url: cliente.imagen_url ? `${api.defaults.baseURL}/uploads/clientes/${cliente.imagen_url}` : null
    }));
    return clientesWithImages;
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    throw error;
  }
};

export const uploadClienteLogo = async (clienteId, imageFile) => {
  try {
    const formData = new FormData();
    formData.append('file', imageFile);

    console.log('Uploading file:', imageFile); // Debug log
    console.log('FormData contents:', formData); // Debug log

    const response = await api.post(`/clientes/upload/${clienteId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      // Add timeout and response type
      timeout: 30000,
      responseType: 'json'
    });
    
    console.log('Upload response:', response.data); // Debug log
    return response.data;
  } catch (error) {
    console.error('Detailed upload error:', error.response?.data || error.message);
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
    const cliente = response.data;
    
    // Ensure the image URL is properly constructed
    if (cliente.imagen_url) {
      cliente.imagen_url = `${api.defaults.baseURL}/uploads/clientes/${cliente.imagen_url}`;
      console.log('Full image URL:', cliente.imagen_url);
    }
    
    return cliente;
  } catch (error) {
    console.error('Error fetching client:', error);
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
    return response.data;
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
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar cliente con ID ${id}:`, error);
    throw error;
  }
};

// Eliminar un cliente
export const deleteCliente = async (id) => {
  try {
    const response = await api.delete(`/clientes/${id}`);
    return response.data;
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
    return response.data;
  } catch (error) {
    console.error('Error al cambiar estado del cliente:', error);
    throw error;
  }
};