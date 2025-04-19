import api from './api';

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
    return response.data;
  } catch (error) {
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
    // Extraer los items y costo_mano_obra antes de enviar la cotización
    const { items, costo_mano_obra, ...cotizacionBasica } = cotizacionData;
    
    console.log('Actualizando cotización ID:', id);
    console.log('Datos a enviar:', cotizacionBasica);
    console.log('Items a actualizar:', items);
    
    // Asegurarnos de que el costo_mano_obra sea un número válido y esté disponible
    const costoManoObra = parseFloat(costo_mano_obra || 0);
    console.log('Costo mano de obra a guardar:', costoManoObra);
    
    // Actualizar la cotización básica (sin incluir costo_mano_obra)
    const response = await api.patch(`/cotizaciones/${id}`, cotizacionBasica);

    // Si hay items, actualizar los detalles
    if (items && items.length > 0) {
      // Obtener los detalles existentes
      const detallesExistentes = await api.get(`/detalle-cotizacion/cotizacion/${id}`);
      console.log('Detalles existentes:', detallesExistentes.data);
      
      // Crear un mapa de los detalles existentes por posición
      const detallesExistentesMap = {};
      if (detallesExistentes.data && detallesExistentes.data.length > 0) {
        detallesExistentes.data.forEach((detalle, index) => {
          detallesExistentesMap[index] = detalle;
        });
      }
      
      // Para cada item nuevo, actualizar o crear un detalle
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        // Verificar que tenemos todos los datos necesarios
        const materialId = item.materialId || item.id_material;
        
        if (!materialId) {
          console.error('Item sin ID de material:', item);
          continue;
        }
        
        // Comprobar diferentes propiedades posibles para el precio
        const precio = item.precio || item.precio_unitario;
        
        // Preparar el detalle con los datos actualizados
        const detalleActualizado = {
          id_cotizacion: Number(id),
          id_material: Number(materialId),
          cantidad: Number(item.cantidad || 1),
          precio_unitario: Number(precio || 0),
          subtotal: Number(item.subtotal || 0),
          costo_mano_obra: costoManoObra // Usar el mismo valor para todos los detalles
        };
        
        console.log('Detalle actualizado a enviar:', JSON.stringify(detalleActualizado));
        
        // Si hay un detalle existente en esta posición, actualizarlo
        if (detallesExistentesMap[i]) {
          const detalleExistente = detallesExistentesMap[i];
          console.log(`Actualizando detalle existente ${detalleExistente.id_detalle}:`, JSON.stringify(detalleActualizado));
          
          try {
            // Actualizar el detalle existente
            await api.put(`/detalle-cotizacion/${detalleExistente.id_detalle}`, {
              ...detalleActualizado,
              id_detalle: detalleExistente.id_detalle
            });
            console.log(`Detalle ${detalleExistente.id_detalle} actualizado correctamente`);
          } catch (updateError) {
            console.error(`Error al actualizar detalle ${detalleExistente.id_detalle}:`, updateError);
            
            // Si falla la actualización, intentar eliminar y recrear
            try {
              await api.delete(`/detalle-cotizacion/${detalleExistente.id_detalle}`);
              const nuevoDetalle = await api.post('/detalle-cotizacion', detalleActualizado);
              console.log('Detalle recreado exitosamente:', nuevoDetalle.data);
            } catch (recreateError) {
              console.error('Error al recrear detalle:', recreateError);
            }
          }
        } else {
          // Si no hay un detalle existente en esta posición, crear uno nuevo
          console.log('Creando nuevo detalle:', JSON.stringify(detalleActualizado));
          
          try {
            const nuevoDetalle = await api.post('/detalle-cotizacion', detalleActualizado);
            console.log('Detalle creado exitosamente:', nuevoDetalle.data);
          } catch (createError) {
            console.error('Error al crear nuevo detalle:', createError);
          }
        }
      }
      
      // Si hay más detalles existentes que items nuevos, eliminar los sobrantes
      if (detallesExistentes.data && detallesExistentes.data.length > items.length) {
        for (let i = items.length; i < detallesExistentes.data.length; i++) {
          const detalleAEliminar = detallesExistentes.data[i];
          console.log(`Eliminando detalle sobrante ${detalleAEliminar.id_detalle}`);
          
          try {
            await api.delete(`/detalle-cotizacion/${detalleAEliminar.id_detalle}`);
            console.log(`Detalle sobrante ${detalleAEliminar.id_detalle} eliminado`);
          } catch (deleteError) {
            console.error(`Error al eliminar detalle sobrante ${detalleAEliminar.id_detalle}:`, deleteError);
          }
        }
      }
    } else {
      // Si no hay items, eliminar todos los detalles existentes
      const detallesExistentes = await api.get(`/detalle-cotizacion/cotizacion/${id}`);
      if (detallesExistentes.data && detallesExistentes.data.length > 0) {
        for (const detalle of detallesExistentes.data) {
          try {
            await api.delete(`/detalle-cotizacion/${detalle.id_detalle}`);
            console.log(`Detalle ${detalle.id_detalle} eliminado porque no hay items`);
          } catch (deleteError) {
            console.error(`Error al eliminar detalle ${detalle.id_detalle}:`, deleteError);
          }
        }
      }
    }

    // Verificar que los detalles se hayan actualizado correctamente
    const detallesActualizados = await api.get(`/detalle-cotizacion/cotizacion/${id}`);
    console.log('Detalles después de actualizar:', detallesActualizados.data);

    return response.data;
  } catch (error) {
    console.error('Error en updateCotizacion:', error.response?.data || error);
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