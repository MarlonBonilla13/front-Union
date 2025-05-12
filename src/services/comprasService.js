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
    '/compras',
    '/api/compras',
    '/v1/compras',
    '/api/v1/compras'
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
    const response = await api.get(`/compras/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener compra con ID ${id}:`, error);
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
    console.log('Datos a actualizar:', data);

    // Usar solo la ruta correcta
    const route = `/compras/${id}`;
    
    try {
      console.log(`\n=== Intentando ruta: ${route} ===`);
      const response = await api.put(route, data);
      console.log(`✅ Éxito en ruta ${route}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error en ruta ${route}:`, error.message);
      throw error;
    }
  } catch (error) {
    console.error('=== Error en updateCompra ===');
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