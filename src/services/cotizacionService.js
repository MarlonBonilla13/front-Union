import api from './api';
// Remove these imports as they're not needed in the service file
// These should be in the component file instead
// import { RestoreIcon } from '@material-ui/icons';
// import { ToggleButtonGroup } from '@material-ui/core';

export const createCotizacion = async (cotizacionData) => {
  try {
    // Extraer los items antes de enviar la cotización
    const { items, ...cotizacionBasica } = cotizacionData;
    const response = await api.post('/cotizaciones', cotizacionBasica);
    
    // Si hay items, crearlos uno por uno
    if (items && items.length > 0) {
      // Crear cada detalle individualmente
      for (const item of items) {
        const detalle = {
          id_cotizacion: response.data.id_cotizacion,
          id_material: parseInt(item.id_material),
          cantidad: parseInt(item.cantidad),
          precio_unitario: parseFloat(item.precio_unitario),
          subtotal: parseFloat(item.subtotal),
          costo_mano_obra: parseFloat(item.costo_mano_obra || 0)
        };

        console.log('Enviando detalle:', detalle);
        
        // Crear el detalle de la cotización
        await api.post('/detalle-cotizacion', detalle);
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('Error en createCotizacion:', error.response?.data || error);
    throw error;
  }
};

export const getCotizaciones = async () => {
  try {
    const response = await api.get('/cotizaciones');
    
    // Map cotizaciones to include user information from usuario_info
    const cotizacionesConUsuario = response.data.map(cotizacion => {
      return {
        ...cotizacion,
        usuario_creacion_nombre: cotizacion.usuario_info ? 
          `${cotizacion.usuario_info.nombre} ${cotizacion.usuario_info.apellido}` : 
          'Usuario desconocido'
      };
    });
    
    return cotizacionesConUsuario;
  } catch (error) {
    console.error('Error al obtener cotizaciones:', error);
    throw error;
  }
};

export const getCotizacionById = async (id) => {
  try {
    console.log('Obteniendo cotización con ID:', id); // Debug
    const response = await api.get(`/cotizaciones/${id}`);
    const cotizacion = response.data;
    
    console.log('Respuesta del servidor:', response); // Debug
    console.log('Datos de cotización recibidos:', cotizacion); // Debug
    
    // Obtener los detalles de la cotización
    const detallesResponse = await api.get(`/detalle-cotizacion/cotizacion/${id}`);
    const detalles = detallesResponse.data;
    console.log('Detalles obtenidos directamente:', detalles); // Debug
    
    // Asignar los detalles a la cotización
    cotizacion.detalles = detalles;
    
    // Asegurarnos de que los detalles tengan el formato correcto
    cotizacion.detalles = cotizacion.detalles.map(detalle => ({
      ...detalle,
      id_material: parseInt(detalle.id_material),
      cantidad: parseInt(detalle.cantidad),
      precio_unitario: parseFloat(detalle.precio_unitario),
      subtotal: parseFloat(detalle.subtotal),
      costo_mano_obra: parseFloat(detalle.costo_mano_obra || 0)
    }));

    // Extraer el costo de mano de obra si existe en los detalles
    if (cotizacion.detalles.length > 0) {
      cotizacion.costo_mano_obra = parseFloat(cotizacion.detalles[0].costo_mano_obra || 0);
    }

    console.log('Cotización procesada:', cotizacion); // Debug
    return cotizacion;
  } catch (error) {
    console.error('Error en getCotizacionById:', error);
    console.error('Detalles del error:', error.response?.data || error.message);
    throw error;
  }
};

export const updateCotizacion = async (id, cotizacionData) => {
  try {
    // Extraer los items antes de enviar la cotización
    const { items, ...cotizacionBasica } = cotizacionData;
    
    // Log para depuración
    console.log('updateCotizacion - datos a enviar:', {
      id,
      cotizacionBasica,
      items
    });
    
    // Actualizar la cotización básica con PATCH
    const response = await api.patch(`/cotizaciones/${id}`, cotizacionBasica);
    
    // Si hay items, actualizarlos uno por uno
    if (items && items.length > 0) {
      try {
        // Primero eliminar los detalles existentes usando el nuevo endpoint
        console.log('Eliminando detalles existentes para la cotización:', id);
        await api.delete(`/detalle-cotizacion/cotizacion/${id}`);
        console.log('Detalles eliminados correctamente');
      } catch (deleteError) {
        console.error('Error al eliminar detalles existentes:', deleteError);
        throw new Error(`No se pudieron eliminar los detalles existentes: ${deleteError.message}`);
      }
      
      // Luego crear los nuevos detalles
      for (const item of items) {
        console.log(`Enviando detalle para material ${item.id_material} con costo_mano_obra:`, item.costo_mano_obra);
        
        // Crear el detalle de la cotización con id_cotizacion como número
        await api.post(`/detalle-cotizacion`, {
          ...item,
          id_cotizacion: parseInt(id)
        });
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('Error en updateCotizacion:', error);
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

// Replace the deleteCotizacion function
export const deleteCotizacion = async (id) => {
  try {
    const response = await api.patch(`/cotizaciones/${id}`, { estado: 'inactivo' });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Replace the reactivateCotizacion function
export const reactivateCotizacion = async (id) => {
  try {
    const response = await api.patch(`/cotizaciones/${id}`, { estado: 'activo' });
    return response.data;
  } catch (error) {
    throw error;
  }
};