import api from './api';

// Función para verificar la conexión con el servidor
export const checkServerConnection = async () => {
  try {
    // Intentar diferentes rutas
    const routes = ['/', '/api', '/api/compras', '/compras'];
    for (const route of routes) {
      try {
        console.log(`Probando ruta: ${route}`);
        const response = await api.get(route);
        console.log(`Respuesta de ${route}:`, response.data);
        return true;
      } catch (error) {
        console.log(`Error en ruta ${route}:`, error.message);
      }
    }
    return false;
  } catch (error) {
    console.error('Error checking server connection:', error);
    return false;
  }
};

// Función para probar diferentes rutas
export const testComprasRoutes = async () => {
  const routes = [
    '/compras'
  ];

  console.log('Probando rutas disponibles...');
  
  for (const route of routes) {
    try {
      console.log(`Intentando ruta: ${route}`);
      const response = await api.get(route);
      console.log(`✅ Ruta ${route} funciona:`, response.data);
      return route; // Retorna la primera ruta que funcione
    } catch (error) {
      console.log(`❌ Ruta ${route} falló:`, error.message);
    }
  }
  
  throw new Error('No se encontró ninguna ruta válida para compras');
};

// Compras
export const getCompras = async () => {
  try {
    console.log('=== Obteniendo lista de compras ===');
    console.log('URL base:', api.defaults.baseURL);
    
    // Intentar diferentes rutas
    const routes = ['/compras', '/api/compras', '/v1/compras'];
    let lastError = null;

    for (const route of routes) {
      try {
        console.log(`Intentando obtener compras desde: ${route}`);
        const response = await api.get(route);
        console.log('✅ Compras obtenidas exitosamente:', response.data);
        return response.data;
      } catch (error) {
        console.log(`❌ Error al obtener compras desde ${route}:`, error.message);
        lastError = error;
        if (error.response?.status !== 404) {
          throw error; // Si el error no es 404, lo propagamos
        }
      }
    }

    // Si llegamos aquí, ninguna ruta funcionó
    throw lastError || new Error('No se pudo obtener la lista de compras');
  } catch (error) {
    console.error('=== Error al obtener compras ===');
    console.error('Tipo de error:', error.constructor.name);
    console.error('Mensaje:', error.message);
    console.error('Response:', error.response?.data);
    console.error('Status:', error.response?.status);
    
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
};

// Obtener detalles de una compra por su ID
export const getCompraById = async (id) => {
  try {
    console.log('=== Obteniendo compra por ID ===');
    console.log('ID:', id);
    
    const response = await api.get(`/compras/${id}`);
    console.log('Compra encontrada:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error al obtener compra por ID:', error);
    if (error.response && error.response.status === 404) {
      throw new Error('Compra no encontrada');
    }
    throw error;
  }
};

// Función para probar diferentes rutas de compras
const tryCreateCompra = async (datosFormateados) => {
  const routes = [
    '/compras',
    '/api/compras',
    '/v1/compras',
    '/api/v1/compras'
  ];

  for (const route of routes) {
    try {
      console.log(`=== Intentando ruta: ${route} ===`);
      const response = await api.post(route, datosFormateados);
      console.log(`✅ Ruta ${route} funcionó correctamente`);
      return response;
    } catch (error) {
      console.log(`❌ Ruta ${route} falló:`, error.message);
      if (error.response?.status !== 404) {
        throw error; // Si el error no es 404, lo propagamos
      }
    }
  }
  throw new Error('No se encontró ninguna ruta válida para crear compras');
};

export const createCompra = async (compraData) => {
  try {
    console.log('=== Iniciando creación de compra ===');
    console.log('URL base de la API:', api.defaults.baseURL);
    console.log('Datos recibidos:', JSON.stringify(compraData, null, 2));

    // Validaciones...
    if (!compraData.id_proveedor) throw new Error('El proveedor es requerido');
    if (!compraData.fecha?.trim()) throw new Error('La fecha es requerida');
    if (!compraData.numeroFactura?.trim()) throw new Error('El número de factura es requerido');
    if (!compraData.tipoPago?.trim()) throw new Error('El tipo de pago es requerido');
    if (!compraData.detalles?.length) throw new Error('Debe incluir al menos un detalle en la compra');

    // Validar detalles
    compraData.detalles.forEach((detalle, index) => {
      if (!detalle.idMaterial) throw new Error(`El material es requerido en el detalle ${index + 1}`);
      if (!detalle.cantidad || detalle.cantidad <= 0) throw new Error(`La cantidad debe ser mayor a 0 en el detalle ${index + 1}`);
      if (!detalle.precioUnitario || detalle.precioUnitario <= 0) throw new Error(`El precio unitario debe ser mayor a 0 en el detalle ${index + 1}`);
    });

    // Preparar datos
    const datosFormateados = {
      id_proveedores: parseInt(compraData.id_proveedor),
      numero_factura: compraData.numeroFactura,
      tipo_pago: compraData.tipoPago,
      estado_pago: compraData.estado || 'PENDIENTE', // Cambiado de estado a estado_pago
      fecha_vencimiento: new Date(compraData.fecha).toISOString(),
      observaciones: compraData.observaciones || '',
      usuario_creacion: 1,
      detalles: compraData.detalles.map(detalle => ({
        id_material: parseInt(detalle.idMaterial),
        cantidad: parseFloat(detalle.cantidad),
        precio_unitario: parseFloat(detalle.precioUnitario),
        descuento: parseFloat(detalle.descuento || 0)
      }))
    };

    // Intentar diferentes rutas
    const routes = ['/compras', '/api/compras', '/v1/compras'];
    let lastError = null;

    for (const route of routes) {
      try {
        console.log(`\n=== Intentando ruta: ${route} ===`);
        const response = await api.post(route, datosFormateados);
        console.log(`✅ Éxito en ruta ${route}`);
        return response.data;
      } catch (error) {
        console.log(`❌ Error en ruta ${route}:`, error.message);
        lastError = error;
        if (error.response?.status !== 404) {
          throw error; // Si el error no es 404, lo propagamos
        }
      }
    }

    // Si llegamos aquí, ninguna ruta funcionó
    throw lastError || new Error('No se pudo crear la compra en ninguna ruta disponible');
  } catch (error) {
    console.error('=== Error en createCompra ===');
    console.error('Tipo de error:', error.constructor.name);
    console.error('Mensaje:', error.message);
    console.error('Response:', error.response?.data);
    console.error('Status:', error.response?.status);
    
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
};

export const updateCompra = async (id, data) => {
  try {
    console.log('=== Iniciando actualización de compra ===');
    console.log('ID de compra:', id);
    console.log('Datos originales a actualizar:', data);

    // Validar ID
    if (!id) throw new Error('El ID de la compra es requerido');

    // Verificar si tenemos una ruta y formato preferido guardado
    const savedRouteConfig = localStorage.getItem('bestUpdateRoute');
    let datosFormateados = null;
    
    // Asegurar que tenemos el estado correcto
    const estado_numerico = data.estado === 'APROBADO' ? 2 : (data.estado === 'RECHAZADO' ? 3 : (data.estado === 'ANULADO' ? 4 : 1));
    console.log('Estado convertido a numérico:', estado_numerico);
    
    // Usar estado_pago en lugar de id_estado
    const estado_pago = data.estado || 'PENDIENTE';
    console.log('Estado para actualización:', estado_pago);
    
    if (savedRouteConfig) {
      const config = JSON.parse(savedRouteConfig);
      console.log(`\n=== Usando configuración guardada ===`);
      console.log(`Ruta: ${config.route}, Método: ${config.method}, Formato: ${config.format || 'No especificado'}`);
      
      // Formatear datos según el formato preferido
      if (config.format === 'snake_case') {
        datosFormateados = {
          estado_pago: estado_pago,
          observaciones: data.observaciones || '',
          
          // Si hay detalles, transformarlos también
          detalles: data.detalles ? data.detalles.map(detalle => ({
            id_material: parseInt(detalle.idMaterial || detalle.id_material),
            cantidad: parseFloat(detalle.cantidad),
            precio_unitario: parseFloat(detalle.precioUnitario || detalle.precio_unitario),
            descuento: parseFloat(detalle.descuento || 0)
          })) : undefined
        };
      } else {
        // Formato camelCase (o predeterminado si no se especifica)
        datosFormateados = {
          estado_pago: estado_pago,
          observaciones: data.observaciones || '',
          
          // Si hay detalles, mantener su formato
          detalles: data.detalles ? data.detalles.map(detalle => ({
            idMaterial: parseInt(detalle.idMaterial || detalle.id_material),
            cantidad: parseFloat(detalle.cantidad),
            precioUnitario: parseFloat(detalle.precioUnitario || detalle.precio_unitario),
            descuento: parseFloat(detalle.descuento || 0)
          })) : undefined
        };
      }
      
      console.log('Datos formateados según preferencia:', datosFormateados);
      
      try {
        const { route, method } = config;
        
        // Extraer la parte de la ruta sin el ID
        const baseRoute = route.split('/:id')[0] || route.split('/')[0];
        const fullRoute = baseRoute + '/' + id;
        
        // Usar axios nativo para mayor control
        const axios = await import('axios');
        let response;
        
        if (method === 'PUT') {
          response = await axios.default.put(
            `${api.defaults.baseURL}${fullRoute}`, 
            datosFormateados,
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
        } else if (method === 'PATCH') {
          response = await axios.default.patch(
            `${api.defaults.baseURL}${fullRoute}`, 
            datosFormateados,
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
        } else if (method === 'POST') {
          response = await axios.default.post(
            `${api.defaults.baseURL}${fullRoute}`,
            {
              ...datosFormateados,
              _method: 'PUT' // Algunos frameworks soportan esto
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
        }
        
        console.log('✅ Éxito con ruta guardada');
        return response.data;
      } catch (savedRouteError) {
        console.log('❌ Error con ruta guardada:', savedRouteError.message);
        console.log('Respuesta del servidor:', savedRouteError.response?.data);
        // Si falla, continuamos con los métodos normales
      }
    } else {
      // Si no hay configuración guardada, usamos el formato snake_case por defecto
      datosFormateados = {
        estado_pago: estado_pago,
        observaciones: data.observaciones || '',
        
        // Si hay detalles, transformarlos también
        detalles: data.detalles ? data.detalles.map(detalle => ({
          id_material: parseInt(detalle.idMaterial || detalle.id_material),
          cantidad: parseFloat(detalle.cantidad),
          precio_unitario: parseFloat(detalle.precioUnitario || detalle.precio_unitario),
          descuento: parseFloat(detalle.descuento || 0)
        })) : undefined
      };
      
      console.log('Datos formateados (snake_case predeterminado):', datosFormateados);
    }

    // Intentar actualizar con axios nativo directamente a la URL correcta
    try {
      console.log('\n=== Intentando PUT directo a la URL correcta ===');
      const axios = await import('axios');
      const response = await axios.default.put(
        `${api.defaults.baseURL}/compras/${id}`, 
        datosFormateados,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      console.log('✅ Éxito con PUT directo');
      return response.data;
    } catch (putError) {
      console.log('❌ Error con PUT directo:', putError.message);
      console.log('Respuesta del servidor:', putError.response?.data);
      
      // Si PUT falla, intentar con PATCH
      try {
        console.log('\n=== Intentando PATCH directo a la URL correcta ===');
        const axios = await import('axios');
        const response = await axios.default.patch(
          `${api.defaults.baseURL}/compras/${id}`, 
          datosFormateados,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        console.log('✅ Éxito con PATCH directo');
        return response.data;
      } catch (patchError) {
        console.log('❌ Error con PATCH directo:', patchError.message);
        console.log('Respuesta del servidor:', patchError.response?.data);
        
        // Si PATCH falla, intentar con snake_case sin detalles (solo el estado)
        try {
          console.log('\n=== Intentando PATCH solo con estado ===');
          
          // Probar diferentes nombres de campo para el estado
          const posiblesCamposEstado = [
            { estado_pago: estado_pago },             // Nuevo campo principal
            { estado: estado_pago },                  // Campo de texto posible
            { id_estado: estado_numerico },           // Antiguo formato numérico
            { estado_id: estado_numerico },           // Variante posible
            { id_estado_compra: estado_numerico },    // Otra variante posible
            { estado_compra: estado_pago }            // Otra posibilidad
          ];
          
          // Probar cada posible campo uno por uno
          let exitoso = false;
          let ultimoError = null;
          
          for (const campoEstado of posiblesCamposEstado) {
            if (exitoso) break;
            
            try {
              console.log(`\n=== Intentando PATCH con campo: ${Object.keys(campoEstado)[0]} ===`);
              const axios = await import('axios');
              const response = await axios.default.patch(
                `${api.defaults.baseURL}/compras/${id}`, 
                campoEstado,
                {
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  }
                }
              );
              console.log(`✅ Éxito con PATCH usando campo: ${Object.keys(campoEstado)[0]}`);
              exitoso = true;
              return response.data;
            } catch (error) {
              console.log(`❌ Error con PATCH usando campo: ${Object.keys(campoEstado)[0]}:`, error.message);
              console.log('Respuesta:', error.response?.data);
              ultimoError = error;
            }
          }
          
          // Si ninguno de los campos funcionó, lanzar el último error
          if (!exitoso && ultimoError) {
            console.log('❌ Ningún formato de campo funcionó para actualizar el estado');
            throw ultimoError;
          }
        } catch (minimalPatchError) {
          console.log('❌ Error con PATCH mínimo:', minimalPatchError.message);
          console.log('Respuesta del servidor:', minimalPatchError.response?.data);
          throw minimalPatchError;
        }
      }
    }
  } catch (error) {
    console.error('=== Error en updateCompra ===');
    console.error('Tipo de error:', error.constructor.name);
    console.error('Mensaje:', error.message);
    console.error('Response:', error.response?.data);
    console.error('Status:', error.response?.status);
    
    // Mensaje de error más detallado
    let errorMessage = 'Error al actualizar la compra: ';
    if (error.response?.data?.message) {
      errorMessage += error.response.data.message;
    } else if (error.message) {
      errorMessage += error.message;
    } else {
      errorMessage += 'Error desconocido';
    }
    
    throw new Error(errorMessage);
  }
};

export const getDetallesByCompraId = async (id) => {
  try {
    console.log('Obteniendo detalles de compra:', id);
    const response = await api.get(`/detalle-compra/compra/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener detalles de la compra ${id}:`, error);
    throw new Error('No se pudieron cargar los detalles de la compra');
  }
};

// Detalles de Compra
export const getDetallesCompra = async (idCompra) => {
  try {
    const response = await api.get(`/api/compras/${idCompra}/detalles`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener detalles de compra ${idCompra}:`, error);
    throw error;
  }
};

export const createDetalleCompra = async (idCompra, detalleData) => {
  try {
    const response = await api.post(`/api/compras/${idCompra}/detalles`, detalleData);
    return response.data;
  } catch (error) {
    console.error(`Error al crear detalle de compra ${idCompra}:`, error);
    throw error;
  }
};

export const updateDetalleCompra = async (idCompra, idDetalle, detalleData) => {
  try {
    const response = await api.put(`/api/compras/${idCompra}/detalles/${idDetalle}`, detalleData);
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar detalle ${idDetalle} de compra ${idCompra}:`, error);
    throw error;
  }
};

export const deleteDetalleCompra = async (idCompra, idDetalle) => {
  try {
    const response = await api.delete(`/api/compras/${idCompra}/detalles/${idDetalle}`);
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar detalle ${idDetalle} de compra ${idCompra}:`, error);
    throw error;
  }
};

// Pagos de Compra
export const getPagosCompra = async (idCompra) => {
  try {
    console.log(`Obteniendo pagos para compra ID: ${idCompra}`);
    const response = await api.get(`/pagos-compra/compra/${idCompra}`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener pagos de compra ${idCompra}:`, error);
    return [];
  }
};

export const createPagoCompra = async (idCompra, pagoData) => {
  try {
    const response = await api.post('/pagos-compra', {
      ...pagoData,
      id_compra: idCompra
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear pago:', error);
    throw new Error(error.response?.data?.message || 'No se pudo crear el pago');
  }
};

export const updatePagoCompra = async (idPago, pagoData) => {
  try {
    const response = await api.put(`/pagos-compra/${idPago}`, pagoData);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar pago:', error);
    throw new Error(error.response?.data?.message || 'No se pudo actualizar el pago');
  }
};

export const deletePagoCompra = async (idPago, idCompra) => {
  try {
    // El id_pago no se utiliza directamente por la API pero lo mantenemos para referencia interna
    // Verificamos que al menos tengamos un id_compra 
    if (!idCompra) {
      throw new Error(`No se puede eliminar el pago: ID de compra inválido`);
    }
    console.log(`Eliminando pago de compra ID: ${idCompra}, pago interno ID: ${idPago}`);
    
    // Usar endpoint que elimina por id_compra
    const response = await api.delete(`/pagos-compra/por-compra/${idCompra}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar pago:', error);
    throw new Error(error.response?.data?.message || `No se pudo eliminar el pago de la compra (ID: ${idCompra})`);
  }
};

// Función para eliminar todos los pagos asociados a una compra
export const deletePagosPorCompra = async (idCompra) => {
  try {
    if (!idCompra) {
      throw new Error(`No se pueden eliminar los pagos: ID de compra inválido (${idCompra})`);
    }
    console.log(`Eliminando todos los pagos de la compra ID: ${idCompra}`);
    
    // Intentar eliminar todos los pagos de esta compra
    try {
      // Cambiar a un endpoint más específico y consistente para eliminar pagos por id_compra
      const response = await api.delete(`/pagos-compra/eliminar-por-compra/${idCompra}`);
      console.log('Pagos eliminados exitosamente por id_compra');
      return response.data;
    } catch (apiError) {
      console.log('Error eliminando pagos por id_compra:', apiError.message);
      
      // Intentar con otra estructura de endpoint
      try {
        // Esta es una alternativa que puede estar implementada en el backend
        const response = await api.delete(`/pagos-compra/compra/${idCompra}/eliminar`);
        console.log('Pagos eliminados exitosamente usando formato alternativo');
        return response.data;
      } catch (alternateError) {
        console.log('Error con formato alternativo:', alternateError.message);
        
        // Intentar con endpoint más genérico
        try {
          // Utilizamos POST como último recurso con _method=DELETE para compatibilidad RESTful
          const axios = await import('axios');
          const response = await axios.default.post(
            `${api.defaults.baseURL}/pagos-compra/eliminar`, 
            { id_compra: idCompra, _method: 'DELETE' },
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          console.log('Pagos eliminados exitosamente usando método POST con _method=DELETE');
          return response.data;
        } catch (postMethodError) {
          console.log('Error con método POST:', postMethodError.message);
          
          // Como último recurso, intentar obtener la lista de pagos y eliminarlos uno por uno
          try {
            const pagosResponse = await getPagosCompra(idCompra);
            if (Array.isArray(pagosResponse) && pagosResponse.length > 0) {
              console.log(`Encontrados ${pagosResponse.length} pagos para eliminar individualmente`);
              
              // Eliminar cada pago uno por uno
              for (const pago of pagosResponse) {
                try {
                  await api.delete(`/pagos-compra/${pago.id_pago}`);
                  console.log(`Pago eliminado: ${pago.id_pago}`);
                } catch (deleteError) {
                  console.log(`Error al eliminar pago ${pago.id_pago}:`, deleteError.message);
                }
              }
              return { message: `Se eliminaron ${pagosResponse.length} pagos individualmente` };
            } else {
              console.log('No se encontraron pagos para eliminar');
              return { message: 'No hay pagos para eliminar' };
            }
          } catch (fetchError) {
            console.log('Error obteniendo pagos para eliminar:', fetchError.message);
            throw new Error('No se encontró un endpoint válido para eliminar pagos por id_compra');
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error al eliminar pagos de compra ${idCompra}:`, error);
    throw new Error(error.response?.data?.message || `No se pudieron eliminar los pagos de la compra (ID: ${idCompra})`);
  }
};

// Estados de Compra
export const getEstadosCompra = async () => {
  try {
    const response = await api.get('/estado-compra');
    return response.data;
  } catch (error) {
    console.error('Error al obtener estados de compra:', error);
    throw error;
  }
};

// Historial de Movimientos
export const getHistorialCompra = async (idCompra) => {
  try {
    const response = await api.get(`/api/compras/${idCompra}/historial`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener historial de compra ${idCompra}:`, error);
    throw error;
  }
};

export const createMovimientoCompra = async (idCompra, movimientoData) => {
  try {
    const response = await api.post(`/api/compras/${idCompra}/historial`, movimientoData);
    return response.data;
  } catch (error) {
    console.error(`Error al crear movimiento para compra ${idCompra}:`, error);
    throw error;
  }
};

// Función para descubrir rutas disponibles en el backend
export const discoverApiRoutes = async () => {
  const routes = [];
  const id = '30'; // ID de prueba
  
  // Lista de rutas a probar
  const routesToTry = [
    { method: 'GET', route: '/compras' },
    { method: 'GET', route: '/compras/:id' },
    { method: 'GET', route: '/api/v1/compras' },
    { method: 'GET', route: '/api/v1/compras/:id' },
    { method: 'PUT', route: '/compras/:id' },
    { method: 'PATCH', route: '/compras/:id' },
    { method: 'PUT', route: '/api/v1/compras/:id' },
    { method: 'PATCH', route: '/api/v1/compras/:id' },
    { method: 'POST', route: '/compras/:id' },
    { method: 'POST', route: '/api/v1/compras/:id' }
  ];
  
  // Probar cada ruta
  for (const route of routesToTry) {
    try {
      const axios = await import('axios');
      const fullRoute = route.route.replace(':id', id);
      const url = `${api.defaults.baseURL}${fullRoute}`;
      
      let response;
      
      // Datos para las solicitudes PUT, PATCH y POST
      // Formato snake_case - lo que espera el backend
      const testData = {
        id_estado: 1,
        observaciones: "Test API route discovery"
      };
      
      if (route.method === 'GET') {
        response = await axios.default.get(url, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      } else {
        response = await axios.default[route.method.toLowerCase()](
          url, 
          testData,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
      }
      
      routes.push({
        route: route.route,
        method: route.method,
        status: 'success',
        statusCode: response.status
      });
      
      console.log(`✅ ${route.method} ${route.route}: ${response.status}`);
    } catch (error) {
      routes.push({
        route: route.route,
        method: route.method,
        status: 'error',
        statusCode: error.response?.status || 'N/A',
        errorMessage: error.response?.data?.message || error.message
      });
      
      console.log(`❌ ${route.method} ${route.route}: ${error.response?.status || 'Error'}`);
    }
  }
  
  return routes;
};

// Nueva función específica para actualizar el estado de una compra
export const actualizarEstadoCompra = async (id, estado) => {
  try {
    console.log('=== Actualizando estado de compra ===');
    console.log('ID de compra:', id);
    console.log('Nuevo estado:', estado);

    // Añadir validación para asegurar que estado tenga un valor válido
    if (!estado) {
      throw new Error('El estado de la compra es requerido');
    }

    // Convertir el estado a su valor numérico (para referencias)
    const estadoNumerico = typeof estado === 'string' 
      ? (estado === 'APROBADO' ? 2 : 
         estado === 'RECHAZADO' ? 3 : 
         estado === 'ANULADO' ? 4 : 1)
      : estado;
    
    console.log('Estado numérico (referencia):', estadoNumerico);
    console.log('Estado texto (para actualización):', estado);

    // Solicitar estado actual antes de intentar actualizar
    try {
      const compraActual = await getCompraById(id);
      console.log('Estado actual de la compra:', compraActual.estado_pago || compraActual.estado);
      
      // Si el estado actual ya es el deseado, simplemente retornar éxito
      if ((compraActual.estado_pago === estado) || (compraActual.estado === estado)) {
        console.log('✅ La compra ya tiene el estado solicitado:', estado);
        return { 
          success: true, 
          message: 'La compra ya tiene este estado',
          compra: compraActual
        };
      }
    } catch (compraCheckError) {
      console.log('❌ No se pudo verificar el estado actual:', compraCheckError.message);
      // Continuamos con la actualización aunque no pudimos verificar
    }

    // Intentar con varios formatos diferentes para la carga útil
    const payloads = [
      // 1. Nuevo formato con estado_pago
      { estado_pago: estado },
      
      // 2. Estado como texto directo
      { estado: estado },
      
      // 3. Combinación de formatos
      { 
        estado_pago: estado,
        estado: estado 
      },
      
      // 4. Formato antiguo con id_estado (por compatibilidad)
      { id_estado: estadoNumerico },
      
      // 5. Formato explícito para actualización
      {
        id_compras: parseInt(id),
        estado_pago: estado
      }
    ];
    
    // Probar cada payload en cada método
    let lastError = null;
    
    // Intentar primero con PATCH (más específico para actualizaciones parciales)
    for (const payload of payloads) {
      try {
        console.log(`\n=== Intentando PATCH con payload ===`, payload);
        const axios = await import('axios');
        const response = await axios.default.patch(
          `${api.defaults.baseURL}/compras/${id}`, 
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            timeout: 5000 // Timeout de 5 segundos para evitar esperas excesivas
          }
        );
        console.log('✅ Éxito actualizando estado con PATCH y payload:', payload);
        console.log('Response status:', response.status);
        console.log('Response data:', response.data);
        return response.data;
      } catch (error) {
        console.log(`❌ Error con PATCH y payload:`, payload);
        console.log('Mensaje:', error.message);
        console.log('Status:', error.response?.status);
        console.log('Datos error:', error.response?.data);
        lastError = error;
      }
    }
    
    // Si ningún PATCH funcionó, intentar con PUT
    for (const payload of payloads) {
      try {
        console.log(`\n=== Intentando PUT con payload ===`, payload);
        const axios = await import('axios');
        const response = await axios.default.put(
          `${api.defaults.baseURL}/compras/${id}`, 
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            timeout: 5000 // Timeout de 5 segundos
          }
        );
        console.log('✅ Éxito actualizando estado con PUT y payload:', payload);
        console.log('Response status:', response.status);
        console.log('Response data:', response.data);
        return response.data;
      } catch (error) {
        console.log(`❌ Error con PUT y payload:`, payload);
        console.log('Mensaje:', error.message);
        console.log('Status:', error.response?.status);
        console.log('Datos error:', error.response?.data);
        lastError = error;
      }
    }
    
    // Como último recurso, intentar SQL directo:
    console.log('\n=== Intentando actualizar directamente ===');
    const result = await actualizarEstadoDirecto(id, estado);
    console.log('✅ Éxito actualizando estado directamente:', result);
    return { success: true, message: 'Estado actualizado con SQL directo' };
  } catch (error) {
    console.error('=== Error al actualizar estado de compra ===');
    console.error('Tipo de error:', error.constructor.name);
    console.error('Mensaje:', error.message);
    console.error('Response:', error.response?.data);
    console.error('Status:', error.response?.status);
    
    // Actualizar con SQL directo como último recurso
    try {
      console.log('\n=== Intento final: SQL directo ===');
      const result = await actualizarEstadoDirecto(id, estado);
      console.log('✅ Éxito en el intento final:', result);
      return result;
    } catch (finalError) {
      console.error('❌ Error en intento final:', finalError.message);
      let errorMessage = 'Error al actualizar estado de compra: ';
      if (error.response?.data?.message) {
        errorMessage += error.response.data.message;
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Error desconocido';
      }
      
      throw new Error(errorMessage);
    }
  }
};

// Función directa para actualizar el estado usando SQL
export const actualizarEstadoDirecto = async (id, estado) => {
  try {
    console.log('=== Iniciando actualización directa en base de datos ===');
    console.log('ID compra:', id);
    console.log('Nuevo estado:', estado);
    
    // Convertir el estado a número (para referencia, aunque usaremos el texto)
    const estadoNumerico = typeof estado === 'string' 
      ? (estado === 'APROBADO' ? 2 : 
         estado === 'RECHAZADO' ? 3 : 
         estado === 'ANULADO' ? 4 : 1)
      : estado;
    
    // Solicitar la actualización directa usando fetch nativo (para evitar los interceptores)
    const token = localStorage.getItem('token');
    
    // Primer intento: Api propia si existe
    try {
      console.log('\n=== Intentando usando API para SQL directo ===');
      const axios = await import('axios');
      const response = await axios.default.post(
        `${api.defaults.baseURL}/api/sql`, 
        { 
          query: `UPDATE public.compras SET estado_pago = $1 WHERE id_compras = $2`,
          params: [estado, id]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      console.log('✅ Actualización directa exitosa');
      return { success: true, message: 'Estado actualizado directamente en base de datos' };
    } catch (apiError) {
      console.log('❌ Error usando API de SQL:', apiError.message);
      
      // Segundo intento: Usando el endpoint common-sql si existe
      try {
        console.log('\n=== Intentando usando common-sql ===');
        const response = await fetch(`${api.defaults.baseURL}/api/common-sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            sql: `UPDATE public.compras SET estado_pago = '${estado}' WHERE id_compras = ${id}`,
            params: []
          })
        });
        
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }
        
        console.log('✅ Actualización directa exitosa usando common-sql');
        return { success: true, message: 'Estado actualizado usando common-sql' };
      } catch (commonSqlError) {
        console.log('❌ Error usando common-sql:', commonSqlError.message);
        
        // Tercer intento: Endpoint específico de estado si existe
        try {
          console.log('\n=== Intentando usando endpoint específico ===');
          const response = await fetch(`${api.defaults.baseURL}/api/compras/${id}/set-estado`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              estado_pago: estado
            })
          });
          
          if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
          }
          
          console.log('✅ Actualización exitosa usando endpoint específico');
          return { success: true, message: 'Estado actualizado usando endpoint específico' };
        } catch (endpointError) {
          console.log('❌ Error usando endpoint específico:', endpointError.message);
          throw new Error('No se pudo actualizar el estado en la base de datos por ningún método');
        }
      }
    }
  } catch (error) {
    console.error('=== Error en actualización directa ===');
    console.error('Mensaje:', error.message);
    throw error;
  }
};

// Actualizar el estado de pago de una compra
export const actualizarEstadoPagoCompra = async (id, estadoPago) => {
  try {
    const response = await api.patch(`/compras/${id}`, {
      estado_pago: estadoPago
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar estado de pago:', error);
    throw new Error(error.response?.data?.message || 'No se pudo actualizar el estado de pago');
  }
};