import api from './api';

export const createCotizacion = async (cotizacionData) => {
  try {
    const response = await api.post('/cotizaciones', cotizacionData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getCotizaciones = async () => {
  try {
    const response = await api.get('/cotizaciones');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getCotizacionById = async (id) => {
  try {
    const response = await api.get(`/cotizaciones/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateCotizacion = async (id, cotizacionData) => {
  try {
    const response = await api.put(`/cotizaciones/${id}`, cotizacionData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const generatePDF = async (id) => {
  try {
    const response = await api.get(`/cotizaciones/${id}/pdf`, {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cotizacion-${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteCotizacion = async (id) => {
  try {
    const response = await api.delete(`/cotizaciones/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};