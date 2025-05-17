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

// Modificar la función para formatear la fecha correctamente para NestJS
const formatearFechaParaAPI = (fechaString) => {
  // Si la fecha ya es un objeto Date válido, no necesita conversión
  if (fechaString instanceof Date && !isNaN(fechaString.getTime())) {
    return fechaString.toISOString();
  }

  // Si tenemos un string en formato YYYY-MM-DD, convertirlo a ISO string
  if (typeof fechaString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fechaString)) {
    // El backend espera una fecha con hora, añadimos T00:00:00Z
    // Esto crea un ISO string válido en UTC
    const fecha = new Date(`${fechaString}T00:00:00Z`);
    if (!isNaN(fecha.getTime())) {
      return fecha.toISOString();
    }
  }

  // Para otros formatos, intentar convertir
  try {
    const fecha = new Date(fechaString);
    if (!isNaN(fecha.getTime())) {
      return fecha.toISOString();
    }
  } catch (error) {
    console.error('Error al convertir fecha:', error);
  }

  // Si todo falla, devolver la fecha actual
  return new Date().toISOString();
};

export const updateEmpleado = async (id, empleadoData) => {
  try {
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      throw new Error('ID inválido');
    }
    
    console.log('Datos recibidos para actualizar:', empleadoData);

    // Preparar datos para actualización - solo incluir lo estrictamente necesario
    const updateData = {
      nombre: empleadoData.nombre?.trim(),
      apellido: empleadoData.apellido?.trim(),
      departamento: empleadoData.departamento?.trim(),
      cargo: empleadoData.cargo?.trim(),
      email: empleadoData.email?.trim() || null,
      telefono: empleadoData.telefono?.trim() || null
    };
    
    // Solo incluir la fecha si está presente, convertida al formato correcto
    if (empleadoData.fecha_ingreso) {
      updateData.fecha_ingreso = formatearFechaParaAPI(empleadoData.fecha_ingreso);
    }
    
    // Solo incluir el estado si se proporciona específicamente
    if (empleadoData.estado !== undefined) {
      updateData.estado = empleadoData.estado;
    }
    
    // Eliminar campos con valores undefined o null
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined || updateData[key] === null) {
        delete updateData[key];
      }
    });

    // Validar campos requeridos
    const camposRequeridos = ['nombre', 'apellido', 'departamento', 'cargo'];
    for (const campo of camposRequeridos) {
      if (!updateData[campo]) {
        throw new Error(`El campo ${campo} es requerido`);
      }
    }

    console.log('Datos formateados para actualizar:', updateData);
    
    try {
      const response = await api.patch(`/empleados/${numericId}`, updateData);
      console.log('Respuesta del servidor:', response.data);
      return response.data;
    } catch (requestError) {
      // Capturar y registrar detalles específicos del error de la solicitud
      console.error('Error HTTP detallado en updateEmpleado:', {
        status: requestError.response?.status,
        statusText: requestError.response?.statusText,
        headers: requestError.response?.headers,
        data: requestError.response?.data,
        config: {
          url: requestError.config?.url,
          method: requestError.config?.method,
          headers: requestError.config?.headers,
          data: requestError.config?.data
        },
        originalSentData: updateData
      });
      
      throw requestError; // Re-lanzar para el manejo de errores externo
    }
  } catch (error) {
    console.error('Error detallado en updateEmpleado:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      data: JSON.stringify(empleadoData), // Usar el mismo formato que en createEmpleado
      stack: error.stack
    });
    
    // Personalizar mensaje de error basado en el código de respuesta
    if (error.response?.status === 409) {
      throw new Error(`Conflicto al actualizar el empleado: ${error.response?.data?.message || 'La operación no puede completarse'}`);
    } else if (error.response?.status === 400) {
      throw new Error(`Error de validación: ${error.response?.data?.message || 'Verifique el formato de los datos, especialmente la fecha'}`);
    } else if (error.response?.status === 500) {
      const errorMessage = error.response?.data?.message || 'Error en el servidor';
      console.error('Error 500 detalles completos:', error.response);
      throw new Error(`Error en el servidor: ${errorMessage}. Esto podría deberse a un problema con el formato de los datos. Por favor, verifique y vuelva a intentarlo.`);
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

    // Preparar datos para creación, con fecha en formato ISO
    const createData = {
      codigo_empleado: empleadoData.codigo_empleado?.trim(),
      nombre: empleadoData.nombre?.trim(),
      apellido: empleadoData.apellido?.trim(),
      departamento: empleadoData.departamento?.trim(),
      cargo: empleadoData.cargo?.trim(),
      email: empleadoData.email?.trim() || null,
      telefono: empleadoData.telefono?.trim() || null,
      // Convertir la fecha al formato que espera NestJS (ISO string)
      fecha_ingreso: formatearFechaParaAPI(empleadoData.fecha_ingreso),
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
    console.log('URL de API:', api.defaults.baseURL);
    console.log('Endpoint:', '/empleados');
    
    try {
      // Crear el empleado directamente
      const response = await api.post('/empleados', createData);
      console.log('Respuesta del servidor:', response.data);
      return response.data;
    } catch (requestError) {
      // Capturar y registrar detalles específicos del error de la solicitud
      console.error('Error HTTP detallado:', {
        status: requestError.response?.status,
        statusText: requestError.response?.statusText,
        headers: requestError.response?.headers,
        data: requestError.response?.data,
        config: {
          url: requestError.config?.url,
          method: requestError.config?.method,
          headers: requestError.config?.headers,
          data: requestError.config?.data
        },
        originalSentData: createData
      });
      
      throw requestError; // Re-lanzar para el manejo de errores externo
    }
  } catch (error) {
    // Mejorar el log de errores
    console.error('Error detallado en createEmpleado:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      data: JSON.stringify(empleadoData), // Mostrar los datos originales para diagnóstico
      stack: error.stack // Incluir stack trace para diagnóstico
    });
    
    // Personalizar mensaje de error basado en el código de respuesta
    if (error.response?.status === 409) {
      throw new Error(`Ya existe un empleado con el código ${empleadoData.codigo_empleado}`);
    } else if (error.response?.status === 400) {
      throw new Error(`Error de validación: ${error.response?.data?.message || 'Verifique el formato de los datos, especialmente la fecha'}`);
    } else if (error.response?.status === 500) {
      const errorMessage = error.response?.data?.message || 'Error en el servidor';
      console.error('Error 500 detalles completos:', error.response);
      throw new Error(`Error en el servidor: ${errorMessage}. Esto podría deberse a un problema con el formato de los datos. Por favor, verifique y vuelva a intentarlo.`);
    }
    
    throw error;
  }
};