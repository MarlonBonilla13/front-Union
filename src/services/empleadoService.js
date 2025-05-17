import api from './api';

export const getEmpleadosActivos = async () => {
  try {
    console.log('Intentando obtener empleados activos...');
    const response = await api.get('/empleados');  // Changed from '/empleados/activos'
    // Filter active employees in the frontend
    const empleadosActivos = response.data.filter(empleado => empleado.estado === true);
    console.log('Empleados activos:', empleadosActivos);
    return empleadosActivos;
  } catch (error) {
    console.error("Error detallado:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: '/empleados'
    });
    throw error;
  }
};

export const getEmpleados = async () => {
  try {
    const response = await api.get('/empleados');
    return response.data;
  } catch (error) {
    console.error("Error al obtener empleados:", error);
    throw error;
  }
};

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

export const updateEmpleado = async (id, empleadoData) => {
  try {
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      throw new Error('ID inválido');
    }
    
    console.log('Datos recibidos para actualizar:', empleadoData);

    // Preparar datos para actualización (nunca incluir codigo_empleado)
    const updateData = {
      nombre: empleadoData.nombre?.trim(),
      apellido: empleadoData.apellido?.trim(),
      departamento: empleadoData.departamento?.trim(),
      cargo: empleadoData.cargo?.trim(),
      email: empleadoData.email?.trim() || null,
      telefono: empleadoData.telefono?.trim() || null,
      fecha_ingreso: empleadoData.fecha_ingreso, // No manipular la fecha
      estado: empleadoData.estado
    };

    // Validar campos requeridos
    const camposRequeridos = ['nombre', 'apellido', 'departamento', 'cargo'];
    for (const campo of camposRequeridos) {
      if (!updateData[campo]) {
        throw new Error(`El campo ${campo} es requerido`);
      }
    }

    console.log('Datos formateados para actualizar:', updateData);
    
    const response = await api.patch(`/empleados/${numericId}`, updateData);
    console.log('Respuesta del servidor:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error detallado en updateEmpleado:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      data: JSON.stringify(empleadoData) // Usar el mismo formato que en createEmpleado
    });
    
    // Personalizar mensaje de error basado en el código de respuesta
    if (error.response?.status === 409) {
      throw new Error(`Conflicto al actualizar el empleado: ${error.response?.data?.message || 'La operación no puede completarse'}`);
    } else if (error.response?.status === 400) {
      throw new Error(`Error de validación: ${error.response?.data?.message || 'Verifique los datos ingresados'}`);
    } else if (error.response?.status === 500) {
      throw new Error('Error en el servidor. Por favor, inténtelo de nuevo más tarde.');
    }
    
    throw error;
  }
};

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

export const createEmpleado = async (empleadoData) => {
  try {
    console.log('Datos originales recibidos:', empleadoData);

    // Preparar datos para creación - Mantenerlo simple para evitar errores
    const createData = {
      codigo_empleado: empleadoData.codigo_empleado?.trim(),
      nombre: empleadoData.nombre?.trim(),
      apellido: empleadoData.apellido?.trim(),
      departamento: empleadoData.departamento?.trim(),
      cargo: empleadoData.cargo?.trim(),
      email: empleadoData.email?.trim() || null,
      telefono: empleadoData.telefono?.trim() || null,
      fecha_ingreso: empleadoData.fecha_ingreso, // Enviar la fecha tal como viene, sin procesamiento
      estado: empleadoData.estado ?? true
    };

    // Validar campos requeridos
    const camposRequeridos = ['codigo_empleado', 'nombre', 'apellido', 'departamento', 'cargo'];
    for (const campo of camposRequeridos) {
      if (!createData[campo]) {
        throw new Error(`El campo ${campo} es requerido`);
      }
    }

    // Validar formato de email si se proporciona
    if (createData.email && !createData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      throw new Error('El formato del email no es válido');
    }

    console.log('Datos formateados para crear:', createData);

    // No intentar verificar duplicados, dejar que el backend lo maneje

    // Crear el empleado directamente
    const response = await api.post('/empleados', createData);
    console.log('Respuesta del servidor:', response.data);
    return response.data;
  } catch (error) {
    // Mejorar el log de errores
    console.error('Error detallado en createEmpleado:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      data: JSON.stringify(empleadoData) // Mostrar los datos originales para diagnóstico
    });
    
    // Personalizar mensaje de error basado en el código de respuesta
    if (error.response?.status === 409) {
      throw new Error(`Ya existe un empleado con el código ${empleadoData.codigo_empleado}`);
    } else if (error.response?.status === 400) {
      throw new Error(`Error de validación: ${error.response?.data?.message || 'Verifique los datos ingresados'}`);
    } else if (error.response?.status === 500) {
      throw new Error('Error en el servidor. Por favor, inténtelo de nuevo más tarde.');
    }
    
    throw error;
  }
};