import api from './api';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

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
    // Create a new document with landscape orientation
    const doc = new jsPDF('landscape');
    
    // Add title
    doc.setFontSize(18);
    doc.text('Reporte de Movimientos', 14, 22);
    
    // Add generation date
    doc.setFontSize(11);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Create a simple table manually
    const startY = 40;
    const cellWidth = 30;
    const cellHeight = 10;
    const margin = 10;
    
    // Headers
    doc.setFillColor(41, 128, 185);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    
    const headers = ["Fecha", "Código", "Material", "Tipo", "Cantidad", "Stock Actual", "Stock Mínimo", "Empleado", "Comentario"];
    headers.forEach((header, i) => {
      doc.rect(margin + (i * cellWidth), startY, cellWidth, cellHeight, 'F');
      doc.text(header, margin + 5 + (i * cellWidth), startY + 7);
    });
    
    // Data rows
    let y = startY + cellHeight;
    doc.setTextColor(0, 0, 0);
    
    data.forEach((item, rowIndex) => {
      // Alternate row colors
      if (rowIndex % 2 === 0) {
        doc.setFillColor(240, 240, 240);
      } else {
        doc.setFillColor(255, 255, 255);
      }
      
      const rowData = [
        new Date(item.fecha).toLocaleDateString(),
        item.codigo || '',
        item.nombre || '',
        item.tipo_movimiento || '',
        item.cantidad || '-',
        item.Stock_actual || '0',
        item.Stock_minimo || '0',
        item.empleado ? `${item.empleado.nombre} ${item.empleado.apellido}` : 'N/A',
        item.comentario || '-'
      ];
      
      rowData.forEach((cell, i) => {
        doc.rect(margin + (i * cellWidth), y, cellWidth, cellHeight, 'F');
        doc.text(String(cell).substring(0, 15), margin + 5 + (i * cellWidth), y + 7);
      });
      
      y += cellHeight;
      
      // Add new page if needed
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });
    
    // Save the PDF
    doc.save(`movimientos_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`);
    
    return true;
  } catch (error) {
    console.error('Error en exportToPDF:', error);
    alert(`Error al exportar a PDF: ${error.message}`);
    throw error;
  }
};