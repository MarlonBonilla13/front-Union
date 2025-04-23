import api from './api';

export const getProveedores = async () => {
  try {
    const response = await api.get('/proveedores');
    return response.data;
  } catch (error) {
    console.error('Error fetching providers:', error);
    throw error;
  }
};

export const getProveedorById = async (id) => {
  try {
    const response = await api.get(`/proveedores/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching provider:', error);
    throw error;
  }
};

export const createProveedor = async (proveedorData) => {
  try {
    const response = await api.post('/proveedores', proveedorData);
    return response.data;
  } catch (error) {
    console.error('Error creating provider:', error);
    throw error;
  }
};

export const updateProveedor = async (id, proveedorData) => {
  try {
    const response = await api.put(`/proveedores/${id}`, proveedorData);
    return response.data;
  } catch (error) {
    console.error('Error updating provider:', error);
    throw error;
  }
};

export const deleteProveedor = async (id) => {
  try {
    const response = await api.patch(`/proveedores/${id}`, { estado: false });
    return response.data;
  } catch (error) {
    console.error('Error deleting provider:', error);
    throw error;
  }
};

export const reactivateProveedor = async (id) => {
  try {
    const response = await api.patch(`/proveedores/${id}`, { estado: true });
    return response.data;
  } catch (error) {
    console.error('Error reactivating provider:', error);
    throw error;
  }
};