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

    // Validar y formatear la fecha
    let fechaIngreso;
    try {
      fechaIngreso = new Date(empleadoData.fecha_ingreso);
      if (isNaN(fechaIngreso.getTime())) {
        throw new Error('Fecha de ingreso inválida');
      }
    } catch (error) {
      console.error('Error al procesar la fecha:', error);
      throw new Error('La fecha de ingreso no tiene un formato válido');
    }

    // Preparar datos para actualización (nunca incluir codigo_empleado)
    const updateData = {
      nombre: empleadoData.nombre?.trim(),
      apellido: empleadoData.apellido?.trim(),
      departamento: empleadoData.departamento?.trim(),
      cargo: empleadoData.cargo?.trim(),
      email: empleadoData.email?.trim() || null,
      telefono: empleadoData.telefono?.trim() || null,
      fecha_ingreso: fechaIngreso.toISOString().split('T')[0],
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
      data: error.response?.config?.data
    });
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

    // Validar y formatear la fecha
    let fechaIngreso;
    try {
      fechaIngreso = new Date(empleadoData.fecha_ingreso);
      if (isNaN(fechaIngreso.getTime())) {
        throw new Error('Fecha de ingreso inválida');
      }
    } catch (error) {
      console.error('Error al procesar la fecha:', error);
      throw new Error('La fecha de ingreso no tiene un formato válido');
    }

    // Preparar datos para creación
    const createData = {
      codigo_empleado: empleadoData.codigo_empleado?.trim(),
      nombre: empleadoData.nombre?.trim(),
      apellido: empleadoData.apellido?.trim(),
      departamento: empleadoData.departamento?.trim(),
      cargo: empleadoData.cargo?.trim(),
      email: empleadoData.email?.trim() || null,
      telefono: empleadoData.telefono?.trim() || null,
      fecha_ingreso: fechaIngreso.toISOString().split('T')[0],
      estado: true // Por defecto, un nuevo empleado se crea como activo
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

    // Verificar si ya existe un empleado con el mismo código
    try {
      const checkResponse = await api.get(`/empleados/codigo/${createData.codigo_empleado}`);
      if (checkResponse.status === 200) {
        // Si llegamos aquí, significa que el empleado existe
        throw new Error(`Ya existe un empleado con el código ${createData.codigo_empleado}`);
      }
    } catch (error) {
      // Si el error es 404, significa que el código no existe y podemos continuar
      if (error.response && error.response.status !== 404) {
        // Si el error no es 404, propagamos el error original
        throw error;
      }
      // Si es 404, continuamos con la creación
      console.log('Código de empleado disponible, procediendo con la creación');
    }

    // Crear el empleado
    const response = await api.post('/empleados', createData);
    console.log('Respuesta del servidor:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error detallado en createEmpleado:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      data: error.response?.config?.data
    });
    throw error;
  }
};