import api from './api';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Función auxiliar para transformar URLs de imágenes de materiales
const transformImageUrl = (movimiento) => {
  if (movimiento.material?.imagen_url) {
    // Si la URL ya es absoluta (comienza con http:// o https://), la dejamos como está
    if (!movimiento.material.imagen_url.startsWith('http')) {
      // Extraer solo el nombre del archivo
      const fileName = movimiento.material.imagen_url.split('/').pop();
      // Construir la URL completa
      movimiento.material.imagen_url = `${api.defaults.baseURL}/uploads/materiales/${fileName}`;
      
      // Log para debugging
      console.log('URL de imagen transformada en movimiento:', movimiento.material.imagen_url);
    }
  }
  return movimiento;
};

// Get all movimientos
export const getMovimientos = async () => {
  try {
    const response = await api.get('/movimientos');
    return response.data.map(movimiento => transformImageUrl(movimiento));
  } catch (error) {
    console.error('Error fetching movimientos:', error);
    throw error;
  }
};

// Create a new movimiento
export const createMovimiento = async (movimientoData) => {
  try {
    const response = await api.post('/movimientos', movimientoData);
    return transformImageUrl(response.data);
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
    return transformImageUrl(response.data);
  } catch (error) {
    console.error('Error updating movimiento estado:', error);
    throw error;
  }
};

// Add new export functions
export const exportToExcel = (data, fileName = 'movimientos.xlsx') => {
  try {
    const formattedData = data.map(item => ({
      Fecha: new Date(item.fecha).toLocaleDateString(),
      Código: item.codigo || '',
      Material: item.nombre || '',
      'Tipo Movimiento': item.tipo_movimiento || '',
      Cantidad: item.cantidad || '',
      'Stock Actual': item.Stock_actual || '',
      'Stock Mínimo': item.Stock_minimo || '',
      Estado: item.estado || '',
      Empleado: item.empleado ? `${item.empleado.nombre} ${item.empleado.apellido}` : 'N/A',
      Departamento: item.empleado?.departamento || 'N/A',
      Comentario: item.comentario || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Movimientos');
    
    worksheet['!cols'] = [
      { wch: 12 }, // Fecha
      { wch: 10 }, // Código
      { wch: 25 }, // Material
      { wch: 15 }, // Tipo Movimiento
      { wch: 10 }, // Cantidad
      { wch: 12 }, // Stock Actual
      { wch: 12 }, // Stock Mínimo
      { wch: 10 }, // Estado
      { wch: 25 }, // Empleado
      { wch: 15 }, // Departamento
      { wch: 30 }  // Comentario
    ];
    
    XLSX.writeFile(workbook, fileName);
    return true;
  } catch (error) {
    console.error('Error al exportar a Excel:', error);
    throw error;
  }
};

// Añadir o modificar la función exportToPDF
export const exportToPDF = (data) => {
  try {
    // Crear un nuevo documento con orientación horizontal
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    // Configurar fuentes y colores
    doc.setFont('helvetica');
    
    // Añadir título
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text('Reporte de Movimientos', 15, 20);
    
    // Añadir fecha de generación
    doc.setFontSize(11);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 15, 30);

    // Configurar la tabla usando autoTable
    autoTable(doc, {
      startY: 35,
      head: [[
        'Fecha',
        'Código',
        'Material',
        'Tipo',
        'Cantidad',
        'Stock Actual',
        'Stock Mínimo',
        'Estado',
        'Empleado',
        'Comentario'
      ]],
      body: data.map(item => [
        new Date(item.fecha).toLocaleDateString(),
        item.codigo || '',
        item.nombre || '',
        item.tipo_movimiento || '',
        item.cantidad || '-',
        item.Stock_actual || '0',
        item.Stock_minimo || '0',
        item.estado || '-',
        item.empleado ? `${item.empleado.nombre} ${item.empleado.apellido}` : 'N/A',
        item.comentario || '-'
      ]),
      styles: {
        fontSize: 9,
        cellPadding: 3,
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        textColor: 50,
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 25 },  // Fecha
        1: { cellWidth: 20 },  // Código
        2: { cellWidth: 40 },  // Material
        3: { cellWidth: 20 },  // Tipo
        4: { cellWidth: 20 },  // Cantidad
        5: { cellWidth: 25 },  // Stock Actual
        6: { cellWidth: 25 },  // Stock Mínimo
        7: { cellWidth: 20 },  // Estado
        8: { cellWidth: 35 },  // Empleado
        9: { cellWidth: 40 }   // Comentario
      },
      margin: { top: 35, right: 15, bottom: 15, left: 15 },
      didDrawPage: function(data) {
        // Agregar número de página
        doc.setFontSize(8);
        doc.text(
          `Página ${doc.internal.getCurrentPageInfo().pageNumber} de ${doc.internal.getNumberOfPages()}`,
          doc.internal.pageSize.width - 20, 
          doc.internal.pageSize.height - 10
        );
      }
    });

    // Guardar el PDF
    const fileName = `movimientos_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`;
    doc.save(fileName);
    
    return true;
  } catch (error) {
    console.error('Error en exportToPDF:', error);
    throw error;
  }
};