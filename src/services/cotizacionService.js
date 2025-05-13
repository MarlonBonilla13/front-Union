import api from './api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_IMAGE_URL } from '../config/config';
import { getMaterials } from './materialService';
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
    // Validar que el ID existe y es un número
    if (!id || isNaN(id)) {
      throw new Error('ID de cotización no válido');
    }
    
    const response = await api.get(`/cotizaciones/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error en getCotizacionById:', error);
    throw error;
  }
};

export const generatePDF = async (id) => {
  try {
    if (!id || isNaN(id)) throw new Error('ID de cotización no válido');
    const cotizacion = await getCotizacionById(id);

    // Si no tiene detalles, los traemos manualmente
    if (!cotizacion.detalles || !Array.isArray(cotizacion.detalles) || cotizacion.detalles.length === 0) {
      const detallesResp = await api.get(`/detalle-cotizacion/cotizacion/${id}`);
      cotizacion.detalles = detallesResp.data || [];
    }

    // Obtener el costo de mano de obra directamente de la cotización
    cotizacion.costo_mano_obra = parseFloat(cotizacion.costo_mano_obra || 0);

    // Trae los materiales
    const materiales = await getMaterials();

    // Solo mapea si detalles es un array
    if (Array.isArray(cotizacion.detalles)) {
      cotizacion.detalles = cotizacion.detalles.map(detalle => ({
        ...detalle,
        material: materiales.find(m => m.id_material === detalle.id_material)
      }));
    }

    return await generateDetailedPDF(cotizacion);
  } catch (error) {
    console.error('Error al generar PDF:', error);
    throw error;
  }
};

// Modificar la función generateDetailedPDF para recibir la cotización en lugar del ID
export const generateDetailedPDF = async (cotizacion) => {
  try {
    if (!cotizacion) {
      throw new Error('No se encontró la cotización');
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let y = margin;

    // Título centrado
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text('INDUSTRIA UNION: COTIZACIÓN', pageWidth/2, y, { align: 'center' });
    y += 15;

    // Información básica - Alineada a la izquierda y más compacta
    doc.setFontSize(10);
    doc.text(`Cotización No: ${cotizacion.id_cotizacion}`, margin, y);
    y += 6;
    doc.text(`Fecha: ${new Date(cotizacion.fecha_cotizacion).toLocaleDateString()}`, margin, y);
    y += 6;
    doc.text(`Válida por: ${cotizacion.validez} días`, margin, y);
    y += 6;
    doc.text(`Creado por: ${cotizacion.usuario_info ? `${cotizacion.usuario_info.nombre} ${cotizacion.usuario_info.apellido}` : 'Usuario desconocido'}`, margin, y);
    y += 10;

    // Información del cliente con fondo gris claro
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y, pageWidth - 2*margin, 8, 'F');
    doc.setFontSize(11);
    doc.text('INFORMACIÓN DEL CLIENTE', margin + 2, y + 6);
    y += 12;

    // Detalles del cliente más compactos
    doc.setFontSize(10);
    doc.text(`Nombre: ${cotizacion.cliente?.nombre || ''}`, margin, y);
    y += 6;
    doc.text(`Empresa: ${cotizacion.cliente?.nombre_comercial || ''}`, margin, y);
    y += 6;
    doc.text(`Dirección: ${cotizacion.cliente?.direccion || ''}`, margin, y);
    y += 6;
    doc.text(`Teléfono: ${cotizacion.cliente?.telefono || ''}`, margin, y);
    y += 10;

    // Detalles del trabajo
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y, pageWidth - 2*margin, 8, 'F');
    doc.setFontSize(11);
    doc.text('DETALLES DEL TRABAJO', margin + 2, y + 6);
    y += 12;

    // Asunto y trabajo a realizar
    doc.setFontSize(10);
    doc.text(`Asunto: ${cotizacion.asunto_cotizacion || ''}`, margin, y);
    y += 6;  // Reducido de 8 a 6
    doc.text('Trabajo a realizar:', margin, y);
    y += 6;
    doc.text(`- ${cotizacion.trabajo_realizar || ''}`, margin + 5, y);
    y += 15;  // Aumentado de 10 a 15 para dar más espacio antes de la siguiente sección

    // Materiales y costos
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y, pageWidth - 2*margin, 8, 'F');
    doc.setFontSize(11);
    doc.text('MATERIALES Y COSTOS', margin + 2, y + 6);
    y += 12;

    // Tabla simplificada de materiales
    const headers = [['Material', 'Cantidad', 'Total']];
    const dataMateriales = [];
    
    if (cotizacion.detalles && Array.isArray(cotizacion.detalles)) {
      cotizacion.detalles.forEach(detalle => {
        dataMateriales.push([
          detalle.material?.nombre || 'N/A',
          detalle.cantidad.toString(),
          `Q ${parseFloat(detalle.subtotal).toFixed(2)}`
        ]);
      });
    }
    
    // Agregar la mano de obra como última fila
    // Corregimos la forma de acceder al costo_mano_obra
    const costoManoObra = parseFloat(cotizacion.costo_mano_obra || 0);
    dataMateriales.push(['MANO DE OBRA:', '', `Q ${costoManoObra.toFixed(2)}`]);

    // Generar la tabla con estilo más simple
    autoTable(doc, {
      startY: y,
      head: headers,
      body: dataMateriales,
      margin: { left: margin },
      theme: 'plain',
      styles: {
        fontSize: 10,
        cellPadding: 2,
        textColor: [0, 0, 0],
        lineHeight: 1.1
      },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' }
      },
      headStyles: {
        fillColor: false,
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        cellPadding: 2  // Reducido también en el encabezado
      },
      // Asegurarse de que la última fila (mano de obra) tenga un estilo distintivo
      didParseCell: function(data) {
        if (data.row.index === dataMateriales.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.cellPadding = 2;  // Mantener consistencia en el espaciado
        }
      }
    });
    y = doc.lastAutoTable.finalY + 5; // Reducido de 10 a 5

    // Total final alineado a la derecha
    doc.text(`Total: Q ${parseFloat(cotizacion.total).toFixed(2)}`, pageWidth - margin - 12, y, { align: 'right' });
    y += 10; // Reducido de 15 a 10

    // Condiciones adicionales
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y, pageWidth - 2*margin, 8, 'F');
    doc.setFontSize(11);
    doc.text('CONDICIONES ADICIONALES', margin + 2, y + 6);
    y += 12; // Reducido de 12 a 10

    // Texto de condiciones
    doc.setFontSize(10);
    doc.text(cotizacion.condiciones_adicionales || '', margin, y);
    y += 8; // Reducido de 10 a 8

    // Tiempo y condiciones de pago
    doc.text(`Tiempo de trabajo: ${cotizacion.tiempo_trabajo || ''}`, margin, y);
    y += 6;
    doc.text(`Condición de pago: ${cotizacion.condicion_pago || ''}`, margin, y);
    y += 15; // Reducido de 20 a 15

    // Pie de página en gris
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('METAL MECANICA, AUTOMATIZACIONES, DISEÑOS Y MONTAJES INDUSTRIALES', pageWidth/2, y, { align: 'center' });
    y += 4;
    doc.text('Manzana I lote 15 col. Sacramento 2 Palin, Escuintla', pageWidth/2, y, { align: 'center' });
    y += 4;
    doc.text('E-mail: joel—union@hotmail.com tel. 52 901245 - 32821499', pageWidth/2, y, { align: 'center' });

    return doc.output('arraybuffer');
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

export const updateCotizacion = async (id, cotizacionData) => {
  try {
    // Extraer los items antes de enviar la cotización
    const { items, ...cotizacionBasica } = cotizacionData;
    const response = await api.patch(`/cotizaciones/${id}`, cotizacionBasica);
    
    // Si hay items, actualizarlos
    if (items && items.length > 0) {
      // Primero eliminar los detalles existentes
      await api.delete(`/detalle-cotizacion/cotizacion/${id}`);
      
      // Crear cada detalle nuevo
      for (const item of items) {
        const detalle = {
          id_cotizacion: id,
          id_material: parseInt(item.id_material),
          cantidad: parseInt(item.cantidad),
          precio_unitario: parseFloat(item.precio_unitario),
          subtotal: parseFloat(item.subtotal),
          costo_mano_obra: parseFloat(item.costo_mano_obra || 0)
        };
        
        await api.post('/detalle-cotizacion', detalle);
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('Error en updateCotizacion:', error.response?.data || error);
    throw error;
  }
};