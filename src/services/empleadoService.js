import api from './api';

// Obtener todos los empleados
export const getEmpleados = async () => {
  try {
    const response = await api.get('/empleados');
    return response.data;
  } catch (error) {
    console.error("Error al obtener empleados:", error);
    throw error;
  }
};

// Obtener un empleado específico
export const getEmpleado = async (id) => {
  try {
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      throw new Error('ID inválido');
    }
    const response = await api.get(`/empleados/${numericId}`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener empleado con ID ${id}:`, error);
    throw error;
  }
};

// Actualizar empleado
export const updateEmpleado = async (id, empleadoData) => {
  try {
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      throw new Error('ID inválido');
    }
    
    console.log('ID a actualizar:', numericId);
    console.log('Datos a enviar:', empleadoData);

    const updateData = {
      codigo_empleado: empleadoData.codigo_empleado,
      nombre: empleadoData.nombre,
      apellido: empleadoData.apellido,
      departamento: empleadoData.departamento,
      cargo: empleadoData.cargo,
      email: empleadoData.email,
      telefono: empleadoData.telefono,
      fecha_ingreso: new Date(empleadoData.fecha_ingreso).toISOString(),
      estado: empleadoData.estado
    };

    console.log('Datos formateados:', updateData);
    
    const response = await api.patch(`/empleados/${numericId}`, updateData);
    console.log('Respuesta del servidor:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error detallado:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

// Eliminar empleado (cambiar estado a inactivo)
// Modificar la función deleteEmpleado para manejar ambos casos
export const deleteEmpleado = async (id, nuevoEstado = false) => {
  try {
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      throw new Error('ID inválido');
    }
    const response = await api.patch(`/empleados/${numericId}`, {
      estado: nuevoEstado
    });
    return response.data;
  } catch (error) {
    console.error(`Error al cambiar estado del empleado con ID ${id}:`, error);
    throw error;
  }
};

// Crear nuevo empleado
export const createEmpleado = async (empleadoData) => {
  try {
    // Remover campos innecesarios para la creación
    const { id: _, ...createData } = empleadoData;
    
    const response = await api.post('/empleados', {
      ...createData,
      fecha_ingreso: new Date(empleadoData.fecha_ingreso).toISOString()
    });
    return response.data;
  } catch (error) {
    console.error("Error al crear empleado:", error);
    throw error;
  }
};