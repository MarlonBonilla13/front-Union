import api from './api';

// Compras
export const getCompras = async () => {
  try {
    const response = await api.get('/compras');
    return response.data;
  } catch (error) {
    console.error('Error al obtener compras:', error);
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

export const createCompra = async (compraData) => {
  try {
    const response = await api.post('/compras', compraData);
    return response.data;
  } catch (error) {
    console.error('Error al crear compra:', error);
    throw error;
  }
};

export const updateCompra = async (id, compraData) => {
  try {
    const response = await api.put(`/compras/${id}`, compraData);
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar compra con ID ${id}:`, error);
    throw error;
  }
};

// Detalles de Compra
export const getDetallesCompra = async (idCompra) => {
  try {
    const response = await api.get(`/compras/${idCompra}/detalles`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener detalles de compra ${idCompra}:`, error);
    throw error;
  }
};

export const createDetalleCompra = async (idCompra, detalleData) => {
  try {
    const response = await api.post(`/compras/${idCompra}/detalles`, detalleData);
    return response.data;
  } catch (error) {
    console.error(`Error al crear detalle de compra ${idCompra}:`, error);
    throw error;
  }
};

export const updateDetalleCompra = async (idCompra, idDetalle, detalleData) => {
  try {
    const response = await api.put(`/compras/${idCompra}/detalles/${idDetalle}`, detalleData);
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar detalle ${idDetalle} de compra ${idCompra}:`, error);
    throw error;
  }
};

export const deleteDetalleCompra = async (idCompra, idDetalle) => {
  try {
    const response = await api.delete(`/compras/${idCompra}/detalles/${idDetalle}`);
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar detalle ${idDetalle} de compra ${idCompra}:`, error);
    throw error;
  }
};

// Pagos de Compra
export const getPagosCompra = async (idCompra) => {
  try {
    const response = await api.get(`/compras/${idCompra}/pagos`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener pagos de compra ${idCompra}:`, error);
    throw error;
  }
};

export const createPagoCompra = async (idCompra, pagoData) => {
  try {
    const response = await api.post(`/compras/${idCompra}/pagos`, pagoData);
    return response.data;
  } catch (error) {
    console.error(`Error al crear pago para compra ${idCompra}:`, error);
    throw error;
  }
};

export const updatePagoCompra = async (idCompra, idPago, pagoData) => {
  try {
    const response = await api.put(`/compras/${idCompra}/pagos/${idPago}`, pagoData);
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar pago ${idPago} de compra ${idCompra}:`, error);
    throw error;
  }
};

export const deletePagoCompra = async (idCompra, idPago) => {
  try {
    const response = await api.delete(`/compras/${idCompra}/pagos/${idPago}`);
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar pago ${idPago} de compra ${idCompra}:`, error);
    throw error;
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
    const response = await api.get(`/compras/${idCompra}/historial`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener historial de compra ${idCompra}:`, error);
    throw error;
  }
};

export const createMovimientoCompra = async (idCompra, movimientoData) => {
  try {
    const response = await api.post(`/compras/${idCompra}/historial`, movimientoData);
    return response.data;
  } catch (error) {
    console.error(`Error al crear movimiento para compra ${idCompra}:`, error);
    throw error;
  }
}; 