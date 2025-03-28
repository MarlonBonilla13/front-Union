import api from './api';

export const getMovimientos = async () => {
  try {
    const response = await api.get('/movimientos');
    console.log('Movimientos data:', response.data); // Add this for debugging
    return response.data;
  } catch (error) {
    console.error("Error al obtener movimientos:", error);
    throw error;
  }
};

export const createMovimiento = async (movimientoData) => {
  try {
    const response = await api.post('/movimientos', movimientoData);
    return response.data;
  } catch (error) {
    console.error("Error al crear movimiento:", error);
    throw error;
  }
};

export const getMovimientosByMaterial = async (materialId) => {
  try {
    const response = await api.get(`/movimientos/material/${materialId}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener movimientos del material:", error);
    throw error;
  }
};