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

export const getCompraById = async (id) => {
  try {
    console.log('=== Obteniendo compra por ID ===');
    console.log('ID de compra:', id);

    // Validar ID
    if (!id) throw new Error('El ID de la compra es requerido');

    // Intentar diferentes rutas
    const routes = [
      '/api/compras',
      '/compras',
      '/v1/compras',
      '/api/v1/compras'
    ];
    let lastError = null;

    for (const route of routes) {
      try {
        console.log(`\n=== Intentando ruta: ${route}/${id} ===`);
        const response = await api.get(`${route}/${id}`);
        console.log(`✅ Éxito en ruta ${route}/${id}`);
        return response.data;
      } catch (error) {
        console.log(`❌ Error en ruta ${route}/${id}:`, error.message);
        lastError = error;
        if (error.response?.status !== 404) {
          console.log(`⚠️ Error diferente a 404, no seguimos intentando otras rutas`);
          throw error; // Si el error no es 404, lo propagamos
        }
      }
    }

    // Si llegamos aquí, ninguna ruta funcionó
    console.error('❌ Ninguna ruta funcionó para obtener la compra');
    throw lastError || new Error(`No se pudo obtener la compra con ID ${id}`);
  } catch (error) {
    console.error(`=== Error al obtener compra con ID ${id} ===`);
    console.error('Tipo de error:', error.constructor.name);
    console.error('Mensaje:', error.message);
    console.error('Response:', error.response?.data);
    console.error('Status:', error.response?.status);
    
    // Mensaje de error más detallado
    let errorMessage = `Error al obtener compra con ID ${id}: `;
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
      id_estado: 1,
      numero_factura: compraData.numeroFactura,
      tipo_pago: compraData.tipoPago,
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
    
    // Asegurar que tenemos el id_estado correcto
    const estado_numerico = data.estado === 'APROBADO' ? 2 : (data.estado === 'RECHAZADO' ? 3 : (data.estado === 'ANULADO' ? 4 : 1));
    console.log('Estado convertido a numérico:', estado_numerico);
    
    if (savedRouteConfig) {
      const config = JSON.parse(savedRouteConfig);
      console.log(`\n=== Usando configuración guardada ===`);
      console.log(`Ruta: ${config.route}, Método: ${config.method}, Formato: ${config.format || 'No especificado'}`);
      
      // Formatear datos según el formato preferido
      if (config.format === 'snake_case') {
        datosFormateados = {
          id_estado: estado_numerico,  // Usar el valor numérico calculado
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
          id_estado: estado_numerico,  // Usar el valor numérico calculado
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
        id_estado: estado_numerico,  // Usar el valor numérico calculado
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
          const datosMinimos = {
            id_estado: estado_numerico  // Usar el valor numérico calculado
          };
          
          const axios = await import('axios');
          const response = await axios.default.patch(
            `${api.defaults.baseURL}/compras/${id}`, 
            datosMinimos,
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          console.log('✅ Éxito con PATCH mínimo');
          return response.data;
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

export const deletePagoCompra = async (idPago) => {
  try {
    const response = await api.delete(`/pagos-compra/${idPago}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar pago:', error);
    throw new Error(error.response?.data?.message || 'No se pudo eliminar el pago');
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

    // Convertir el estado a su valor numérico
    const estadoNumerico = typeof estado === 'string' 
      ? (estado === 'APROBADO' ? 2 : 
         estado === 'RECHAZADO' ? 3 : 
         estado === 'ANULADO' ? 4 : 1)
      : estado;
    
    console.log('Estado numérico:', estadoNumerico);

    // Crear payload mínimo solo con el estado
    const payload = { id_estado: estadoNumerico };
    
    // Intentar las tres opciones principales (PUT, PATCH, PATCH solo con ID)
    try {
      // 1. Intentar con PUT
      console.log('\n=== Intentando PUT para actualizar estado ===');
      const axios = await import('axios');
      const putResponse = await axios.default.put(
        `${api.defaults.baseURL}/compras/${id}`, 
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      console.log('✅ Éxito actualizando estado con PUT');
      return putResponse.data;
    } catch (putError) {
      console.log('❌ Error con PUT:', putError.message);
      
      // 2. Intentar con PATCH
      try {
        console.log('\n=== Intentando PATCH para actualizar estado ===');
        const axios = await import('axios');
        const patchResponse = await axios.default.patch(
          `${api.defaults.baseURL}/compras/${id}`, 
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        console.log('✅ Éxito actualizando estado con PATCH');
        return patchResponse.data;
      } catch (patchError) {
        console.log('❌ Error con PATCH:', patchError.message);
        
        // 3. Intentar con endpoint específico de estado
        try {
          console.log('\n=== Intentando endpoint específico de estado ===');
          const axios = await import('axios');
          const endpointResponse = await axios.default.post(
            `${api.defaults.baseURL}/compras/${id}/estado`, 
            payload,
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          console.log('✅ Éxito actualizando estado con endpoint específico');
          return endpointResponse.data;
        } catch (endpointError) {
          console.log('❌ Error con endpoint específico:', endpointError.message);
          throw endpointError;
        }
      }
    }
  } catch (error) {
    console.error('=== Error al actualizar estado de compra ===');
    console.error('Tipo de error:', error.constructor.name);
    console.error('Mensaje:', error.message);
    console.error('Response:', error.response?.data);
    console.error('Status:', error.response?.status);
    
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
};