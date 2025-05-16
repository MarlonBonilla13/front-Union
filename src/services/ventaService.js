import api from './api';

export const getVentas = async () => {
  try {
    const response = await api.get('/ventas');
    return response.data;
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    throw error;
  }
};

export const getVentaById = async (id) => {
  try {
    const response = await api.get(`/ventas/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener venta:', error);
    throw error;
  }
};

export const createVenta = async (ventaData) => {
  try {
    const response = await api.post('/ventas', ventaData);
    return response.data;
  } catch (error) {
    console.error('Error al crear venta:', error);
    throw error;
  }
};

export const updateVenta = async (id, ventaData) => {
  try {
    const response = await api.patch(`/ventas/${id}`, ventaData);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar venta:', error);
    throw error;
  }
};

export const deleteVenta = async (id) => {
  try {
    const response = await api.delete(`/ventas/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar venta:', error);
    throw error;
  }
};