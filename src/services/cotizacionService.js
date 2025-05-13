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
    // Validar que el ID existe y es un número
    if (!id || isNaN(id)) {
      throw new Error('ID de cotización no válido');
    }
    
    // Obtener la cotización
    const cotizacion = await getCotizacionById(id);
    
    // Pasar la cotización directamente en lugar del ID
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

    // Información básica
    doc.setFontSize(11);
    doc.text(`Cotización No: ${cotizacion.id_cotizacion}`, margin, y);
    y += 8;
    doc.text(`Fecha: ${new Date(cotizacion.fecha_cotizacion).toLocaleDateString()}`, margin, y);
    y += 8;
    doc.text(`Válida por: ${cotizacion.validez} días`, margin, y);
    y += 8;
    doc.text(`Creado por: ${cotizacion.usuario_info ? `${cotizacion.usuario_info.nombre} ${cotizacion.usuario_info.apellido}` : 'Usuario desconocido'}`, margin, y);
    y += 10;

    // Información del cliente
    doc.setFillColor(220, 220, 220);
    doc.rect(margin, y, pageWidth - 2*margin, 8, 'F');
    doc.text('INFORMACIÓN DEL CLIENTE', margin + 2, y + 6);
    y += 12;

    const cliente = cotizacion.cliente || {};
    doc.setFontSize(10);
    doc.text(`Nombre: ${cliente.nombre || ''} ${cliente.apellido || ''}`, margin, y);
    y += 6;
    doc.text(`Empresa: ${cliente.nombre_comercial || ''}`, margin, y);
    y += 6;
    doc.text(`Dirección: ${cliente.direccion || ''}`, margin, y);
    y += 6;
    if (cliente.telefono) {
      doc.text(`Teléfono: ${cliente.telefono}`, margin, y);
      y += 6;
    }
    y += 4;

    // Detalles del trabajo
    doc.setFontSize(11);
    doc.setFillColor(220, 220, 220);
    doc.rect(margin, y, pageWidth - 2*margin, 8, 'F');
    doc.text('DETALLES DEL TRABAJO', margin + 2, y + 6);
    y += 12;

    doc.setFontSize(10);
    if (cotizacion.asunto_cotizacion) {
      doc.text(`Asunto: ${cotizacion.asunto_cotizacion}`, margin, y);
      y += 8;
    }

    if (cotizacion.trabajo_realizar) {
      doc.text('Trabajo a realizar:', margin, y);
      y += 6;
      
      cotizacion.trabajo_realizar.split('\n').forEach(trabajo => {
        doc.text(`- ${trabajo.trim()}`, margin + 5, y);
        y += 6;
      });
      y += 4;
    }

    // Materiales y costos
    doc.setFontSize(11);
    doc.setFillColor(220, 220, 220);
    doc.rect(margin, y, pageWidth - 2*margin, 8, 'F');
    doc.text('MATERIALES Y COSTOS', margin + 2, y + 6);
    y += 12;

    // Tabla de materiales
    const headers = [['Material', 'Cantidad', 'Precio Unit.', 'Total']];
    const data = [];

    // Verificar y agregar los materiales
    console.log('Detalles de la cotización:', cotizacion.detalles);
    
    if (cotizacion.detalles && Array.isArray(cotizacion.detalles)) {
      cotizacion.detalles.forEach(detalle => {
        data.push([
          detalle.material?.nombre || 'N/A',
          detalle.cantidad.toString(),
          `Q ${parseFloat(detalle.precio_unitario).toFixed(2)}`,
          `Q ${parseFloat(detalle.subtotal).toFixed(2)}`
        ]);
      });
    }

    // Generar la tabla solo si hay datos
    if (data.length > 0) {
      autoTable(doc, {
        startY: y,
        head: headers,
        body: data,
        margin: { left: margin },
        theme: 'grid',
        styles: {
          fontSize: 10,
          cellPadding: 5
        },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 30, halign: 'center' },
          2: { cellWidth: 40, halign: 'right' },
          3: { cellWidth: 40, halign: 'right' }
        }
      });

      y = doc.lastAutoTable.finalY + 10;
    }

    // Agregar la mano de obra como una fila separada
    if (cotizacion.mano_obra && parseFloat(cotizacion.mano_obra) > 0) {
      data.push(['MANO DE OBRA:', '', `Q ${parseFloat(cotizacion.mano_obra).toFixed(2)}`]);
    }

    // Generar la tabla solo si hay datos
    if (data.length > 0) {
      autoTable(doc, {
        startY: y,
        head: headers,
        body: data,
        margin: { left: margin },
        theme: 'grid',
        styles: {
          fontSize: 10,
          cellPadding: 5
        },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 30, halign: 'center' },
          2: { cellWidth: 40, halign: 'right' }
        }
      });

      y = doc.lastAutoTable.finalY + 10;
    }

    // Totales alineados a la derecha
    doc.setFontSize(11);
    const xTotal = pageWidth - margin - 50;
    doc.text(`Subtotal: Q${parseFloat(cotizacion.subtotal).toFixed(2)}`, xTotal, y);
    y += 6;
    doc.text(`Descuento: Q${parseFloat(cotizacion.descuento).toFixed(2)}`, xTotal, y);
    y += 6;
    doc.text(`Impuestos: Q${parseFloat(cotizacion.impuestos).toFixed(2)}`, xTotal, y);
    y += 6;
    doc.text(`Total: Q${parseFloat(cotizacion.total).toFixed(2)}`, xTotal, y);
    y += 15;

    // Condiciones adicionales
    if (cotizacion.condiciones_adicionales) {
      doc.setFillColor(220, 220, 220);
      doc.rect(margin, y, pageWidth - 2*margin, 8, 'F');
      doc.text('CONDICIONES ADICIONALES', margin + 2, y + 6);
      y += 12;
      doc.setFontSize(10);
      doc.text(cotizacion.condiciones_adicionales, margin, y);
      y += 10;
    }

    // Tiempo de trabajo y condición de pago
    if (cotizacion.tiempo_trabajo) {
      doc.text(`Tiempo de trabajo: ${cotizacion.tiempo_trabajo}`, margin, y);
      y += 6;
    }
    if (cotizacion.condicion_pago) {
      doc.text(`Condición de pago: ${cotizacion.condicion_pago}`, margin, y);
      y += 20;
    }

    // Pie de página
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
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