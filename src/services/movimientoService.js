import api from './api';

// Get all movimientos
export const getMovimientos = async () => {
  try {
    const response = await api.get('/movimientos');
    return response.data;
  } catch (error) {
    console.error('Error fetching movimientos:', error);
    throw error;
  }
};

// Create a new movimiento
export const createMovimiento = async (movimientoData) => {
  try {
    const response = await api.post('/movimientos', movimientoData);
    return response.data;
  } catch (error) {
    console.error('Error creating movimiento:', error);
    throw error;
  }
};

// Update movimiento estado
export const updateMovimientoEstado = async (id, estado) => {
  try {
    console.log(`Sending request to update movimiento ${id} with estado: ${estado}`);
    
    // Use a more specific endpoint for updating estado
    const response = await api.put(`/movimientos/estado/${id}`, { estado });
    return response.data;
  } catch (error) {
    console.error('Error updating movimiento estado:', error);
    throw error;
  }
};