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
    // Obtener los datos de la cotización
    const cotizacion = await getCotizacionById(id);
    
    // Crear un nuevo documento PDF
    const doc = new jsPDF();
    
    // Configurar la fuente
    doc.setFont('helvetica');

    // Título principal
    doc.setFontSize(18);
    doc.setTextColor(100, 149, 237); // Azul claro
    doc.text('INDUSTRIA UNION: COTIZACIÓN', doc.internal.pageSize.width/2, 20, { align: 'center', fontStyle: 'bold' });
    
    let currentY = 30;

    // Información básica de la cotización con menos espacio
    autoTable(doc, {
      startY: currentY,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 1 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 35 },
        1: { cellWidth: 50 }
      },
      body: [
        ['No. Cotización:', `No ${cotizacion.id_cotizacion}`],
        ['Fecha:', new Date(cotizacion.fecha_cotizacion).toLocaleDateString()],
        ['Válida por:', `${cotizacion.validez} días`]
      ],
      didDrawPage: function(data) {
        currentY = data.cursor.y + 5;
      }
    });

    // Información del cliente
    autoTable(doc, {
      startY: currentY,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { 
        fillColor: [100, 149, 237],
        textColor: 255,
        halign: 'left'
      },
      head: [['INFORMACIÓN DEL CLIENTE']],
      body: [
        ['Nombre:', cotizacion.detalle_cotizacion?.nombre || ''],
        ['Empresa:', cotizacion.detalle_cotizacion?.empresa || ''],
        ['Dirección:', cotizacion.detalle_cotizacion?.direccion || ''],
        ['Teléfono:', cotizacion.detalle_cotizacion?.telefono || '']
      ],
      didDrawPage: function(data) {
        currentY = data.cursor.y + 5;
      }
    });

    // Detalles del trabajo
    autoTable(doc, {
      startY: currentY,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { 
        fillColor: [100, 149, 237],
        textColor: 255,
        halign: 'left'
      },
      head: [['DETALLES DEL TRABAJO']],
      body: [
        ['Asunto:', cotizacion.asunto_cotizacion || ''],
        ['Trabajo a realizar:', cotizacion.trabajo_realizar || '']
      ],
      didDrawPage: function(data) {
        currentY = data.cursor.y + 5;
      }
    });

    // Tabla de materiales y mano de obra
    const materialesBody = cotizacion.detalles.map(detalle => [
      detalle.material?.nombre || '',
      detalle.cantidad,
      `Q ${parseFloat(detalle.subtotal).toFixed(2)}`
    ]);

    // Agregar fila de mano de obra si existe
    const manoDeObra = cotizacion.detalles.find(detalle => detalle.costo_mano_obra);
    if (manoDeObra) {
      materialesBody.push([
        'MANO DE OBRA',
        '1',
        `Q ${parseFloat(manoDeObra.costo_mano_obra).toFixed(2)}`
      ]);
    }

    autoTable(doc, {
      startY: currentY,
      theme: 'grid',
      styles: { 
        fontSize: 9,
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      headStyles: { 
        fillColor: [100, 149, 237],
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 40, halign: 'right' }
      },
      head: [['Material', 'Cantidad', 'Total']],
      body: materialesBody,
      didDrawPage: function(data) {
        currentY = data.cursor.y;
      }
    });

    // Totales con menos espacio
    autoTable(doc, {
      startY: currentY,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 1 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
      },
      body: [
        ['Subtotal:', `Q ${parseFloat(cotizacion.subtotal).toFixed(2)}`],
        [`Descuento (${cotizacion.descuento}%):`, `Q ${(cotizacion.subtotal * cotizacion.descuento / 100).toFixed(2)}`],
        ['Total:', `Q ${parseFloat(cotizacion.total).toFixed(2)}`]
      ],
      margin: { left: 126 },
      didDrawPage: function(data) {
        currentY = data.cursor.y + 5;
      }
    });

    // Condiciones adicionales
    if (cotizacion.condiciones_adicionales) {
      autoTable(doc, {
        startY: currentY,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 2 },
        headStyles: { 
          fillColor: [100, 149, 237],
          textColor: 255,
          halign: 'left'
        },
        head: [['CONDICIONES ADICIONALES']],
        body: [[cotizacion.condiciones_adicionales]],
        didDrawPage: function(data) {
          currentY = data.cursor.y + 5;
        }
      });
    }

    // Información de pago y tiempo con menos espacio
    autoTable(doc, {
      startY: currentY,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 1 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 'auto' }
      },
      body: [
        ['Tiempo de trabajo:', cotizacion.tiempo_trabajo],
        ['Condición de pago:', cotizacion.condicion_pago]
      ],
      didDrawPage: function(data) {
        currentY = data.cursor.y + 5;
      }
    });

    // Pie de página más compacto
    doc.setFontSize(8);
    doc.setTextColor(100, 149, 237);
    const footerText = [
      'METAL MECANICA, AUTOMATIZACIONES, DISEÑOS Y MONTAJES INDUSTRIALES',
      'Manzana I lote 15 col. Sacramento 2 Palín, Escuintla',
      'E-mail: joel—union@hotmail.com tel. 52 901245 - 32821499'
    ];
    
    let footerY = doc.internal.pageSize.height - 20;
    footerText.forEach(line => {
      doc.text(line, doc.internal.pageSize.width / 2, footerY, { align: 'center' });
      footerY += 4; // Reducido de 5 a 4 para más compacto
    });

    // Descargar el PDF
    const pdfBlob = doc.output('blob');
    const url = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cotizacion-${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
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