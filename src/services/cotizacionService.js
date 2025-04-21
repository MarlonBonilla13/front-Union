import api from './api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_IMAGE_URL } from '../config/config';
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
    console.log('Obteniendo cotización con ID:', id);
    const response = await api.get(`/cotizaciones/${id}`);
    const cotizacion = response.data;
    
    // Get client information
    if (cotizacion.id_cliente) {
      const clienteResponse = await api.get(`/clientes/${cotizacion.id_cliente}`);
      cotizacion.cliente = clienteResponse.data;
    }
    
    // Get quotation details
    const detallesResponse = await api.get(`/detalle-cotizacion/cotizacion/${id}`);
    cotizacion.detalles = detallesResponse.data.map(detalle => ({
      ...detalle,
      id_material: parseInt(detalle.id_material),
      cantidad: parseInt(detalle.cantidad),
      precio_unitario: parseFloat(detalle.precio_unitario),
      subtotal: parseFloat(detalle.subtotal),
      costo_mano_obra: parseFloat(detalle.costo_mano_obra || 0)
    }));

    console.log('Cotización procesada completa:', cotizacion);
    return cotizacion;
  } catch (error) {
    console.error('Error en getCotizacionById:', error);
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
    const cotizacion = await getCotizacionById(id);
    
    // Crear nuevo documento PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let y = margin;

    // Título centrado
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0); // Cambiado a negro
    doc.text('INDUSTRIA UNION: COTIZACIÓN', pageWidth/2, y, { align: 'center' });
    y += 15; // Reducido el espacio después del título

    // Información básica - alineada a la izquierda
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Cotización No: ${cotizacion.id_cotizacion}`, margin, y);
    y += 8;
    doc.text(`Fecha: ${new Date(cotizacion.fecha_cotizacion).toLocaleDateString()}`, margin, y);
    y += 8;
    doc.text(`Válida por: ${cotizacion.validez} días`, margin, y);
    y += 10; // Reducido el espacio antes de las secciones

    // Secciones con fondo gris claro
    const drawSection = (title, content) => {
      // Encabezado gris
      doc.setFillColor(220, 220, 220);
      doc.rect(margin, y, pageWidth - 2*margin, 8, 'F');
      doc.setFontSize(11);
      doc.text(title, margin + 2, y + 6);
      y += 12;

      // Contenido
      doc.setFontSize(10);
      content();
      y += 5;
    };

    // Sección de información del cliente
    drawSection('INFORMACIÓN DEL CLIENTE', () => {
      doc.text(`Nombre: ${cotizacion.cliente.nombre} ${cotizacion.cliente.apellido}`, margin, y);
      y += 6;
      doc.text(`Empresa: ${cotizacion.cliente.nombre_comercial}`, margin, y);
      y += 6;
      doc.text(`Dirección: ${cotizacion.cliente.direccion}`, margin, y);
      y += 6;
      doc.text(`Teléfono: ${cotizacion.cliente.telefono}`, margin, y);
      y += 10;
    });

    // Sección de detalles del trabajo
    drawSection('DETALLES DEL TRABAJO', () => {
      doc.text(`Asunto: ${cotizacion.asunto_cotizacion}`, margin, y);
      y += 8;
      doc.text('Trabajo a realizar:', margin, y);
      y += 6;
      
      // Lista con guiones
      cotizacion.trabajo_realizar.split('\n').forEach(trabajo => {
        doc.text(`- ${trabajo.trim()}`, margin + 5, y);
        y += 6;
      });
    });

    // Sección de materiales y costos
    drawSection('MATERIALES Y COSTOS', () => {
      const colMaterial = margin;
      const colCantidad = pageWidth - 80;
      const colTotal = pageWidth - 35;

      // Encabezados de la tabla
      doc.text('Material', colMaterial, y);
      doc.text('Cantidad', colCantidad, y);
      doc.text('Total', colTotal, y);
      y += 8;

      // Filas de materiales
      cotizacion.detalles.forEach(detalle => {
        doc.text(detalle.material?.nombre || '', colMaterial, y);
        doc.text(detalle.cantidad.toString(), colCantidad, y);
        doc.text(`Q ${parseFloat(detalle.subtotal).toFixed(2)}`, colTotal, y);
        y += 6;
      });

      // Solo mostrar el total final
      y += 5;
      doc.text(`Total: Q ${parseFloat(cotizacion.total).toFixed(2)}`, colTotal - 13, y);
    });

    // Sección de condiciones adicionales
    drawSection('CONDICIONES ADICIONALES', () => {
      doc.text(cotizacion.condiciones_adicionales, margin, y);
      y += 15;
      doc.text(`Tiempo de trabajo: ${cotizacion.tiempo_trabajo}`, margin, y);
      y += 6;
      doc.text(`Condición de pago: ${cotizacion.condicion_pago}`, margin, y);
    });

    // Pie de página
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    const footerY = doc.internal.pageSize.height - 15;
    doc.text('METAL MECANICA, AUTOMATIZACIONES, DISEÑOS Y MONTAJES INDUSTRIALES', pageWidth/2, footerY, { align: 'center' });
    doc.text('Manzana I lote 15 col. Sacramento 2 Palín, Escuintla', pageWidth/2, footerY + 4, { align: 'center' });
    doc.text('E-mail: joel—union@hotmail.com tel. 52 901245 - 32821499', pageWidth/2, footerY + 8, { align: 'center' });

    // Descargar el PDF
    doc.save(`cotizacion-${id}.pdf`);
    return true;
  } catch (error) {
    console.error('Error al generar PDF:', error);
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