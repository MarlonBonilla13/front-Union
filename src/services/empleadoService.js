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

    // Manejo especial para la fecha
    let fechaIngreso = empleadoData.fecha_ingreso;
    
    // Verificar si la fecha está en formato MM/DD/YYYY y convertirla a YYYY-MM-DD
    if (fechaIngreso && /^\d{2}\/\d{2}\/\d{4}$/.test(fechaIngreso)) {
      const partes = fechaIngreso.split('/');
      fechaIngreso = `${partes[2]}-${partes[0]}-${partes[1]}`;
      console.log('Fecha convertida de MM/DD/YYYY a YYYY-MM-DD:', fechaIngreso);
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
      fecha_ingreso: fechaIngreso, // Usar la fecha procesada
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

    // Añadir información detallada sobre la solicitud
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
      
      // Verificar si hay problemas específicos con la fecha
      if (requestError.response?.status === 500 && createData.fecha_ingreso) {
        console.warn('Posible problema con formato de fecha, intentando alternativa...');
        
        // Intento alternativo con otro formato de fecha
        try {
          // Parse y format la fecha a YYYY-MM-DD sin dependencias
          const date = new Date(createData.fecha_ingreso);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            
            // Actualizar datos con el nuevo formato
            const newData = {
              ...createData,
              fecha_ingreso: `${year}-${month}-${day}`
            };
            
            console.log('Reintentando con fecha reformateada:', newData.fecha_ingreso);
            const retryResponse = await api.post('/empleados', newData);
            console.log('Respuesta exitosa con fecha alternativa:', retryResponse.data);
            return retryResponse.data;
          }
        } catch (retryError) {
          console.error('Falló también el intento alternativo:', retryError);
          // Continuar con el manejo regular de errores
        }
      }
      
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
      throw new Error(`Error de validación: ${error.response?.data?.message || 'Verifique los datos ingresados'}`);
    } else if (error.response?.status === 500) {
      const errorMessage = error.response?.data?.message || 'Error en el servidor';
      console.error('Error 500 detalles completos:', error.response);
      throw new Error(`Error en el servidor: ${errorMessage}. Esto podría deberse a un problema con el formato de los datos. Por favor, verifique y vuelva a intentarlo.`);
    }
    
    throw error;
  }
};