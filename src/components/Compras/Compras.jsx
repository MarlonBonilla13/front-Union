import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Button, Typography, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Chip, Tabs, Tab,
  Card, CardContent, InputAdornment, CircularProgress, Grid, FormControl, InputLabel, Select, Avatar
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Swal from 'sweetalert2';
import * as comprasService from '../../services/comprasService';
import * as proveedorService from '../../services/proveedorService';
import DetalleCompra from './DetalleCompra';
import PagosCompra from './PagosCompra';
import RestoreIcon from '@mui/icons-material/Restore';
import CloseIcon from '@mui/icons-material/Close';
import api from '../../services/api';
import ExportPreviewComprasDialog from './ExportPreviewComprasDialog';
import PreviewIcon from '@mui/icons-material/Preview';
import * as XLSX from 'xlsx';

const tiposPago = ['CONTADO', 'CREDITO'];
const estadosCompra = ['PENDIENTE', 'APROBADO', 'RECHAZADO', 'ANULADO'];
// Usar los mismos estados para estado_pago
const estadosPago = estadosCompra;

export const getEstadoColor = (estado) => {
  switch (estado) {
    case 'PENDIENTE':
      return 'warning';
    case 'APROBADA':
    case 'APROBADO':
      return 'success';  // Verde
    case 'RECHAZADA':
    case 'RECHAZADO':
      return 'error';    // Rojo
    case 'CANCELADA':
    case 'ANULADO':
      return 'info';     // Azul celeste
    default:
      return 'default';
  }
};

// Agregar la configuración de alerta compartida (igual que en PagosCompra)
const alertConfig = {
  customClass: {
    container: 'swal-container-highest',
    popup: 'swal-popup-highest'
  }
};

// Función para obtener la URL de la imagen del proveedor
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // Si ya es una URL completa, asegurarse de que use HTTPS en producción
  if (imagePath.startsWith('http')) {
    if (process.env.NODE_ENV === 'production') {
      return imagePath.replace('http://', 'https://');
    }
    return imagePath;
  }

  // Si es una ruta relativa, construir la URL completa
  return `${api.defaults.baseURL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};

// Función para generar colores basados en el nombre
const getColorForName = (name = 'A') => {
  const colors = [
    '#f44336', '#e91e63', '#9c27b0', '#673ab7', 
    '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
    '#009688', '#4caf50', '#8bc34a', '#cddc39', 
    '#ffc107', '#ff9800', '#ff5722'
  ];
  
  let hashCode = 0;
  for (let i = 0; i < name.length; i++) {
    hashCode += name.charCodeAt(i);
  }
  
  return colors[hashCode % colors.length];
};

const Compras = () => {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);  // This is already defined
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [proveedores, setProveedores] = useState([]);
  const [estados, setEstados] = useState([]);
  const [detalles, setDetalles] = useState([]);
  const [selectedCompra, setSelectedCompra] = useState(null);
  const [showDetalle, setShowDetalle] = useState(false);
  const [compraForm, setCompraForm] = useState({
    id_proveedor: '',
    fecha: new Date().toISOString().split('T')[0],
    numeroFactura: '',
    tipoPago: 'CONTADO',
    estado_pago: 'PENDIENTE',
    estado: 'PENDIENTE',
    observaciones: '',
    total: 0
  });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState([]);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        // Check authentication first
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No está autenticado. Por favor, inicie sesión.');
        }

        // Primero cargar los proveedores
        const proveedoresResponse = await proveedorService.getProveedores();
        console.log('Proveedores cargados:', proveedoresResponse);
        
        // Filtrar solo proveedores activos
        const proveedoresActivos = proveedoresResponse.filter(p => p.estado === true);
        setProveedores(proveedoresActivos);

        // Luego cargar las compras
        const comprasResponse = await comprasService.getCompras();
        setCompras(comprasResponse);
        
      } catch (error) {
        console.error('Error al cargar datos:', error);
        if (error.response?.status === 401) {
          Swal.fire({
            title: 'Error de autenticación',
            text: 'Su sesión ha expirado o no está autenticado. Por favor, inicie sesión nuevamente.',
            icon: 'error'
          }).then(() => {
            // Redirect to login
            window.location.href = '/login';
          });
        } else {
          Swal.fire({
            title: 'Error',
            text: 'No se pudieron cargar los datos',
            icon: 'error'
          });
        }
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const getFilteredCompras = () => {
    let filtered = compras;
    
    // Filtrar por estado
    switch (selectedTab) {
      case 0: // Activas
        filtered = filtered.filter(c => 
          c.estado_pago !== 'RECHAZADO' && 
          c.estado_pago !== 'ANULADO' && 
          c.estado !== 'RECHAZADO' && 
          c.estado !== 'ANULADO'
        );
        break;
      case 1: // Rechazadas/Canceladas
        filtered = filtered.filter(c => 
          c.estado_pago === 'RECHAZADO' || 
          c.estado_pago === 'ANULADO' || 
          c.estado === 'RECHAZADO' || 
          c.estado === 'ANULADO'
        );
        break;
    }

    // Aplicar filtro de búsqueda
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(compra => 
        (compra.numero_factura?.toLowerCase() || '').includes(searchLower) ||
        (compra.proveedor?.nombre?.toLowerCase() || '').includes(searchLower) ||
        (compra.proveedor?.contacto?.toLowerCase() || '').includes(searchLower)
      );
    }

    return filtered;
  };

  const handleClickOpen = () => {
    setIsEditing(false);
    setCompraForm({
      id_proveedor: '',
      fecha: new Date().toISOString().split('T')[0],
      numeroFactura: '',
      tipoPago: 'CONTADO',
      estado: 'PENDIENTE', // Aseguramos que tenga un valor inicial
      observaciones: '',
      total: 0
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Verificar conexión con el servidor
      const isConnected = await comprasService.checkServerConnection();
      if (!isConnected) {
        throw new Error('No se pudo conectar con el servidor');
      }

      if (!compraForm.id_proveedor) {
        throw new Error('Debe seleccionar un proveedor');
      }

      if (!detalles.length) {
        throw new Error('Debe agregar al menos un detalle a la compra');
      }

      // Obtener los valores actuales de la compra que se está editando
      let originalCompra = null;
      if (compraForm.id_compras) {
        originalCompra = compras.find(c => c.id_compras === parseInt(compraForm.id_compras));
      }
      
      console.log('Formulario actual:', compraForm);
      console.log('Compra original:', originalCompra);
      
      // Verificar si el estado ha cambiado
      const estadoHaCambiado = originalCompra && compraForm.estado !== (originalCompra.estado_pago || originalCompra.estado);
      console.log('¿Estado ha cambiado?', estadoHaCambiado);
      console.log('Estado original:', originalCompra?.estado_pago || originalCompra?.estado);
      console.log('Nuevo estado:', compraForm.estado);
      
      const compraData = {
        id_proveedor: parseInt(compraForm.id_proveedor),
        fecha: compraForm.fecha,
        numeroFactura: compraForm.numeroFactura,
        tipoPago: compraForm.tipoPago,
        observaciones: compraForm.observaciones || '',
        estado_pago: compraForm.estado, // Usar estado directamente como estado_pago
        estado: compraForm.estado, // Mantener para compatibilidad
        total: parseFloat(compraForm.total || 0),
        detalles: detalles.map(detalle => ({
          idMaterial: detalle.idMaterial,
          cantidad: detalle.cantidad,
          precioUnitario: detalle.precioUnitario,
          iva: detalle.iva || 0,
          descuento: detalle.descuento || 0,
          subtotal: detalle.subtotal,
          ivaMonto: detalle.ivaMonto || 0,
          descuentoMonto: detalle.descuentoMonto || 0
        }))
      };
      
      console.log('Datos para actualizar:', compraData);
      
      // Si es edición (actualizar compra existente)
      if (isEditing && compraForm.id_compras) {
        try {
          if (estadoHaCambiado) {
            // Si solo cambió el estado, usar la función específica para actualizar estado
            console.log(`Actualizando estado a ${compraForm.estado}`);
            await comprasService.actualizarEstadoCompra(compraForm.id_compras, compraForm.estado);
          } else {
            // Actualización completa de la compra
            await comprasService.updateCompra(compraForm.id_compras, compraData);
          }
          
          // Actualizar la lista de compras
          const comprasActualizadas = await comprasService.getCompras();
          setCompras(comprasActualizadas);
          handleCloseDialog();
          
          Swal.fire({
            title: 'Éxito', 
            text: 'Compra actualizada correctamente', 
            icon: 'success',
            ...alertConfig
          });
        } catch (error) {
          console.error('Error al actualizar compra:', error);
          
          // Actualizar localmente para mantener consistencia en la UI, incluso si falla API
          const nuevasCompras = compras.map(c => {
            if (c.id_compras === parseInt(compraForm.id_compras)) {
              return { 
                ...c, 
                id_proveedores: parseInt(compraForm.id_proveedor),
                fecha_compra: compraForm.fecha,
                numero_factura: compraForm.numeroFactura,
                tipo_pago: compraForm.tipoPago,
                observaciones: compraForm.observaciones,
                estado_pago: compraForm.estado,
                estado: compraForm.estado
              };
            }
            return c;
          });
          
          setCompras(nuevasCompras);
          handleCloseDialog();
          
          Swal.fire({
            title: 'Actualización local',
            text: 'La compra ha sido actualizada localmente debido a un problema de conexión con el servidor.',
            icon: 'warning',
            ...alertConfig
          });
        }
      } else {
        // Crear nueva compra
        try {
          console.log('Creando nueva compra:', compraData);
          const response = await comprasService.createCompra(compraData);
          console.log('Respuesta del servidor:', response);
          
          // Actualizar la lista de compras
          const comprasActualizadas = await comprasService.getCompras();
          setCompras(comprasActualizadas);
          handleCloseDialog();
          
          Swal.fire({
            title: 'Éxito', 
            text: 'Compra creada correctamente', 
            icon: 'success',
            ...alertConfig
          });
        } catch (error) {
          console.error('Error al crear compra:', error);
          Swal.fire({
            title: 'Error', 
            text: 'No se pudo crear la compra en el servidor', 
            icon: 'error',
            ...alertConfig
          });
          handleCloseDialog();
        }
      }
    } catch (error) {
      console.error('Error al guardar compra:', error);
      const errorMessage = error.response?.data?.message || error.message || 'No se pudo guardar la compra';
      Swal.fire({
        title: 'Error', 
        text: errorMessage, 
        icon: 'error',
        ...alertConfig
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const result = await Swal.fire({
        title: '¿Está seguro?',
        text: "La compra cambiará a estado RECHAZADO y se moverá a la pestaña de Rechazadas",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, rechazar',
        cancelButtonText: 'Cancelar',
        ...alertConfig
      });

      if (result.isConfirmed) {
        try {
          // Intentar actualizar el estado utilizando la función específica
          await comprasService.actualizarEstadoCompra(id, 'RECHAZADO');
          
          // Si la actualización tuvo éxito, actualizar el estado local
          const updatedCompras = await comprasService.getCompras();
          setCompras(updatedCompras);
          
          Swal.fire({
            title: 'Rechazada',
            text: 'La compra ha sido rechazada y movida a la lista de rechazadas',
            icon: 'success',
            ...alertConfig
          });
        } catch (error) {
          console.error('Error al actualizar estado de compra:', error);
          
          // Actualizar solo la UI si la API falla
          Swal.fire({
            title: 'Problemas con el servidor',
            text: 'No se pudo actualizar en el servidor, pero se actualizará localmente. Por favor, intente sincronizar más tarde.',
            icon: 'warning',
            ...alertConfig
          });
          
          // Actualizar localmente
          setCompras(prevCompras => prevCompras.map(compra => 
            compra.id_compras === id ? { 
              ...compra, 
              estado_pago: 'RECHAZADO',
              estado: 'RECHAZADO'
            } : compra
          ));
        }
      }
    } catch (error) {
      console.error('Error al rechazar compra:', error);
      Swal.fire({
        title: 'Error',
        text: 'Error al rechazar la compra',
        icon: 'error',
        ...alertConfig
      });
    }
  };

  // Nueva función para reactivar una compra (cambiar de RECHAZADO a PENDIENTE)
  const handleReactivate = async (id) => {
    try {
      const result = await Swal.fire({
        title: '¿Reactivar esta compra?',
        text: "La compra cambiará a estado PENDIENTE y volverá a la lista de compras activas",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, reactivar',
        cancelButtonText: 'Cancelar',
        ...alertConfig
      });

      if (result.isConfirmed) {
        try {
          // Intentar actualizar el estado utilizando la función específica
          await comprasService.actualizarEstadoCompra(id, 'PENDIENTE');
          
          // Si la actualización tuvo éxito, actualizar el estado local
          const updatedCompras = await comprasService.getCompras();
          setCompras(updatedCompras);
          
          Swal.fire({
            title: 'Reactivada',
            text: 'La compra ha sido reactivada y movida a la lista de compras activas',
            icon: 'success',
            ...alertConfig
          });
        } catch (error) {
          console.error('Error al reactivar la compra:', error);
          
          // Actualizar solo la UI si la API falla
          Swal.fire({
            title: 'Problemas con el servidor',
            text: 'No se pudo actualizar en el servidor, pero se actualizará localmente. Por favor, intente sincronizar más tarde.',
            icon: 'warning',
            ...alertConfig
          });
          
          // Actualizar localmente
          setCompras(prevCompras => prevCompras.map(compra => 
            compra.id_compras === id ? { 
              ...compra, 
              estado_pago: 'PENDIENTE',
              estado: 'PENDIENTE' 
            } : compra
          ));
        }
      }
    } catch (error) {
      console.error('Error al reactivar compra:', error);
      Swal.fire({
        title: 'Error',
        text: 'Error al reactivar la compra',
        icon: 'error',
        ...alertConfig
      });
    }
  };

  const handleEdit = async (id) => {
    try {
      setIsEditing(true);
      
      // Encontrar la compra en el array local
      const compra = compras.find(c => c.id_compras === id);
      if (!compra) {
        throw new Error('No se encontró la compra');
      }
      
      console.log('Editando compra:', compra);
      
      // Asegurarnos de usar el campo estado_pago para mayor consistencia
      const estadoActual = compra.estado_pago || compra.estado || 'PENDIENTE';
      console.log('Estado actual de la compra:', estadoActual);
      
      // Cargar datos básicos de la compra
      setCompraForm({
        id_compras: compra.id_compras,
        id_proveedor: compra.id_proveedores,
        fecha: compra.fecha_compra?.split('T')[0] || new Date().toISOString().split('T')[0],
        numeroFactura: compra.numero_factura || '',
        tipoPago: compra.tipo_pago || 'CONTADO',
        estado: estadoActual, // Usar estado consistente
        estado_pago: estadoActual, // Duplicar en ambos campos
        observaciones: compra.observaciones || '',
        total: compra.total || 0,
        items: [] // Se cargarán a continuación
      });

      try {
        // 1. Obtén todos los materiales
        const materiales = await import('../../services/materialService').then(m => m.getMaterials());

        // 2. Solicita los detalles al backend
        const detallesResponse = await comprasService.getDetallesByCompraId(compra.id_compras);

        // 3. Mapea los detalles incluyendo el objeto material completo
        const detallesMapeados = detallesResponse.map(detalle => {
          const materialObj = materiales.find(m => m.id_material === detalle.id_material) || {
            nombre: 'Material no encontrado',
            codigo: 'N/A',
            imagen_url: ''
          };
          return {
            idMaterial: detalle.id_material?.toString() || '',
            cantidad: Number(detalle.cantidad) || 0,
            precioUnitario: Number(detalle.precio_unitario) || 0,
            iva: Number(detalle.iva) || 0,
            descuento: Number(detalle.descuento) || 0,
            subtotal: Number(detalle.subtotal) || 0,
            ivaMonto: Number(detalle.iva_monto) || 0,
            descuentoMonto: Number(detalle.descuento_monto) || 0,
            total: (Number(detalle.subtotal) || 0) + (Number(detalle.iva_monto) || 0) - (Number(detalle.descuento_monto) || 0),
            material: materialObj, // Pasa el objeto material completo
            codigo: materialObj.codigo || 'N/A',
            imagen: materialObj.imagen_url || '',
            observaciones: detalle.observaciones || ''
          };
        });

        setDetalles(detallesMapeados);
      } catch (error) {
        console.error('Error al cargar detalles de la compra:', error);
        setDetalles([]);
      }

      setOpenDialog(true);
    } catch (error) {
      console.error('Error al editar compra:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo editar la compra',
        icon: 'error',
        ...alertConfig
      });
    }
  };

  const handleViewDetails = async (compra) => {
    try {
      // Obtener los detalles de la compra
      const detallesResponse = await comprasService.getDetallesByCompraId(compra.id_compras);
      
      // Obtener todos los materiales
      const materiales = await import('../../services/materialService').then(m => m.getMaterials());
      
      // Mapear los detalles con la información completa del material
      const detallesConMateriales = detallesResponse.map(detalle => {
        const material = materiales.find(m => m.id_material === detalle.id_material) || {
          nombre: 'Material no encontrado',
          codigo: 'N/A'
        };
        return {
          ...detalle,
          material: material.nombre,
          codigo: material.codigo
        };
      });
      
      // Actualizar la compra seleccionada con los detalles
      setSelectedCompra({
        ...compra,
        detalles: detallesConMateriales
      });
      setShowDetalle(true);
    } catch (error) {
      console.error('Error al cargar los detalles:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudieron cargar los detalles de la compra',
        icon: 'error',
        ...alertConfig
      });
    }
  };

  const handleCloseDetails = () => {
    setShowDetalle(false);
    setTimeout(() => {
      setSelectedCompra(null);
    }, 100);
  };

  // Manejador para actualizar el estado de la compra desde el componente PagosCompra
  const handleEstadoChange = (nuevoEstado) => {
    console.log('Recibido cambio de estado desde PagosCompra:', nuevoEstado);
    
    // Actualizar la compra seleccionada (en la vista de detalles)
    if (selectedCompra) {
      setSelectedCompra(prevCompra => ({
        ...prevCompra,
        estado_pago: nuevoEstado,
        estado: nuevoEstado
      }));
    }
    
    // También actualizar en la lista principal de compras
    setCompras(prevCompras => prevCompras.map(compra => 
      compra.id_compras === selectedCompra?.id_compras 
        ? { ...compra, estado_pago: nuevoEstado, estado: nuevoEstado } 
        : compra
    ));
  };

  const validateCompra = (compraData) => {
    if (!compraData.id_proveedor) throw new Error('Proveedor requerido');
    if (!compraData.numeroFactura?.trim()) throw new Error('Número de factura requerido');
    if (!compraData.fecha) throw new Error('Fecha requerida');
    if (!compraData.detalles?.length) throw new Error('Debe incluir al menos un detalle');
  };

  const testApiRoutes = async () => {
    Swal.fire({
      title: 'Analizando rutas API',
      text: 'Esto puede tomar unos momentos...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      ...alertConfig
    });

    try {
      const allRoutes = await comprasService.discoverApiRoutes();
      
      // Separar resultados por tipo de solicitud
      const getRoutes = allRoutes.filter(r => r.method === 'GET');
      const updateRoutes = allRoutes.filter(r => ['PUT', 'PATCH', 'POST'].includes(r.method));
      
      // Filtrar las rutas de actualización que funcionaron
      const successfulUpdateRoutes = updateRoutes.filter(r => r.status === 'success');
      
      // Probar formatos de datos en las rutas exitosas
      const testedFormats = [];
      
      if (successfulUpdateRoutes.length > 0) {
        const testRoute = successfulUpdateRoutes[0];
        const testId = '30'; // Usar un ID de prueba

        // Formatos a probar
        const dataFormats = [
          {
            name: "camelCase",
            data: {
              estado_pago: 'PENDIENTE',
              observaciones: "Prueba formato camelCase",
              detalles: [{
                idMaterial: 1,
                cantidad: 1,
                precioUnitario: 100,
                descuento: 0
              }]
            }
          },
          {
            name: "snake_case",
            data: {
              estado_pago: 'PENDIENTE',
              observaciones: "Prueba formato snake_case",
              detalles: [{
                id_material: 1,
                cantidad: 1,
                precio_unitario: 100,
                descuento: 0
              }]
            }
          }
        ];

        // Probar cada formato
        for (const format of dataFormats) {
          try {
            const axios = await import('axios');
            const route = testRoute.route.replace(':id', testId);
            const url = `${api.defaults.baseURL}${route}`;
            
            const response = await axios.default[testRoute.method.toLowerCase()](
              url,
              format.data,
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
              }
            );
            
            testedFormats.push({
              name: format.name,
              status: 'success',
              statusCode: response.status
            });
          } catch (error) {
            testedFormats.push({
              name: format.name,
              status: 'error',
              statusCode: error.response?.status || 'N/A',
              error: error.response?.data?.message || error.message
            });
          }
        }
      }

      // Mostrar resultados
      const resultHtml = `
        <div style="text-align: left; margin-bottom: 20px;">
          <h3>Resumen de Diagnóstico</h3>
          <p><strong>Rutas GET funcionales:</strong> ${getRoutes.filter(r => r.status === 'success').length}/${getRoutes.length}</p>
          <p><strong>Rutas de actualización funcionales:</strong> ${successfulUpdateRoutes.length}/${updateRoutes.length}</p>
          
          ${successfulUpdateRoutes.length > 0 ? `
            <h4>Rutas de actualización funcionales:</h4>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Ruta</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Método</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Estado</th>
                </tr>
              </thead>
              <tbody>
                ${successfulUpdateRoutes.map(route => `
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">${route.route}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${route.method}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${route.status}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}
          
          ${testedFormats.length > 0 ? `
            <h4>Formatos de datos probados:</h4>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Formato</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Estado</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Código</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Mensaje</th>
                </tr>
              </thead>
              <tbody>
                ${testedFormats.map(format => `
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">${format.name}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${format.status}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${format.statusCode}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${format.error || 'N/A'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}
        </div>
      `;

      // Mostrar resultados
      Swal.fire({
        title: 'Diagnóstico de API',
        html: resultHtml,
        icon: successfulUpdateRoutes.length > 0 ? 'success' : 'warning',
        width: '800px',
        ...alertConfig
      });

      // Si hay rutas exitosas, preguntar si desea actualizar la configuración
      if (successfulUpdateRoutes.length > 0) {
        const bestRoute = successfulUpdateRoutes[0];
        const bestFormat = testedFormats.find(f => f.status === 'success')?.name || null;
        
        Swal.fire({
          title: '¿Actualizar configuración?',
          html: `
            <p>Se encontró una ruta funcional:</p>
            <p><strong>${bestRoute.method} ${bestRoute.route}</strong></p>
            ${bestFormat ? `<p>Formato de datos aceptado: <strong>${bestFormat}</strong></p>` : ''}
            <p>¿Desea actualizar la configuración del servicio con esta ruta?</p>
          `,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Actualizar configuración',
          cancelButtonText: 'Cancelar',
          ...alertConfig
        }).then((result) => {
          if (result.isConfirmed) {
            // Guardar la mejor ruta y formato en localStorage
            localStorage.setItem('bestUpdateRoute', JSON.stringify({
              route: bestRoute.route,
              method: bestRoute.method,
              format: bestFormat,
              lastTested: new Date().toISOString()
            }));
            
            Swal.fire({
              title: '¡Configuración actualizada!',
              text: `La configuración ha sido actualizada para usar ${bestRoute.method} ${bestRoute.route} con formato ${bestFormat || 'predeterminado'}.`,
              icon: 'success',
              ...alertConfig
            });
          }
        });
      }

      // Loguear rutas para inspección
      console.log('Todas las rutas probadas:', allRoutes);
      console.log('Formatos probados:', testedFormats);
      
    } catch (error) {
      console.error('Error al probar rutas API:', error);
      Swal.fire({
        title: 'Error',
        text: `Error al probar rutas API: ${error.message}`,
        icon: 'error',
        ...alertConfig
      });
    }
  };

  const testEstadoCompra = async () => {
    const compraId = await Swal.fire({
      title: 'Diagnóstico de Estado',
      text: 'Ingrese el ID de la compra que desea probar:',
      input: 'text',
      inputPlaceholder: 'Ej: 42',
      showCancelButton: true,
      confirmButtonText: 'Iniciar diagnóstico',
      cancelButtonText: 'Cancelar',
      ...alertConfig
    });

    if (!compraId.isConfirmed || !compraId.value) return;

    const id = compraId.value;
    
    Swal.fire({
      title: 'Ejecutando diagnóstico',
      text: 'Probando distintos métodos para actualizar el estado...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      ...alertConfig
    });

    try {
      // Información inicial de la compra
      console.log(`=== Diagnóstico para compra ID: ${id} ===`);
      let compraInfo;
      try {
        compraInfo = await comprasService.getCompraById(id);
        console.log('Estado actual:', compraInfo.estado);
        console.log('ID estado actual:', compraInfo.id_estado);
      } catch (error) {
        throw new Error(`No se pudo obtener información de la compra: ${error.message}`);
      }

      // 1. Probar actualizando solo el campo id_estado con PUT
      const resultados = [];
      
      try {
        const axios = await import('axios');
        console.log('\n=== Probando PUT con campo id_estado ===');
        const response = await axios.default.put(
          `${api.defaults.baseURL}/compras/${id}`,
          { id_estado: 2 }, // APROBADO
          { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` }}
        );
        resultados.push({
          metodo: 'PUT',
          campo: 'id_estado',
          estado: 'success',
          codigo: response.status,
          respuesta: response.data ? 'Con datos' : 'Sin datos'
        });
      } catch (error) {
        resultados.push({
          metodo: 'PUT',
          campo: 'id_estado',
          estado: 'error',
          codigo: error.response?.status || 'N/A',
          mensaje: error.response?.data?.message || error.message
        });
      }

      // 2. Probar actualizando solo el campo id_estado con PATCH
      try {
        const axios = await import('axios');
        console.log('\n=== Probando PATCH con campo id_estado ===');
        const response = await axios.default.patch(
          `${api.defaults.baseURL}/compras/${id}`,
          { id_estado: 2 }, // APROBADO
          { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` }}
        );
        resultados.push({
          metodo: 'PATCH',
          campo: 'id_estado',
          estado: 'success',
          codigo: response.status,
          respuesta: response.data ? 'Con datos' : 'Sin datos'
        });
      } catch (error) {
        resultados.push({
          metodo: 'PATCH',
          campo: 'id_estado',
          estado: 'error',
          codigo: error.response?.status || 'N/A',
          mensaje: error.response?.data?.message || error.message
        });
      }

      // 3. Probar actualizando con endpoint específico estado 
      try {
        const axios = await import('axios');
        console.log('\n=== Probando POST a endpoint específico de estado ===');
        const response = await axios.default.post(
          `${api.defaults.baseURL}/compras/${id}/estado`,
          { id_estado: 2 }, // APROBADO
          { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` }}
        );
        resultados.push({
          metodo: 'POST',
          campo: 'endpoint específico',
          estado: 'success',
          codigo: response.status,
          respuesta: response.data ? 'Con datos' : 'Sin datos'
        });
      } catch (error) {
        resultados.push({
          metodo: 'POST',
          campo: 'endpoint específico',
          estado: 'error',
          codigo: error.response?.status || 'N/A',
          mensaje: error.response?.data?.message || error.message
        });
      }

      // Mostrar resultados
      const resultHtml = `
        <div style="text-align: left;">
          <h4>Diagnóstico de actualizaciones de estado</h4>
          <p><strong>Compra ID:</strong> ${id}</p>
          <p><strong>Estado actual:</strong> ${compraInfo?.estado || 'Desconocido'}</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <thead>
              <tr>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Método</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Campo</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Estado</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Código</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Mensaje</th>
              </tr>
            </thead>
            <tbody>
              ${resultados.map(res => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 8px;">${res.metodo}</td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${res.campo}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; color: ${res.estado === 'success' ? 'green' : 'red'};">
                    ${res.estado === 'success' ? '✅ Éxito' : '❌ Error'}
                  </td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${res.codigo}</td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${res.mensaje || res.respuesta || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      // Buscar si algún método fue exitoso
      const metodosExitosos = resultados.filter(res => res.estado === 'success');
      
      // Mostrar resultados
      Swal.fire({
        title: 'Resultados del diagnóstico',
        html: resultHtml,
        icon: metodosExitosos.length > 0 ? 'success' : 'warning',
        width: '800px',
        ...alertConfig
      }).then(async (result) => {
        if (result.isConfirmed && metodosExitosos.length > 0) {
          // Preguntar si desea aplicar el mejor método encontrado
          const mejorMetodo = metodosExitosos[0];
          const confirmResult = await Swal.fire({
            title: '¿Actualizar ahora?',
            html: `
              <p>Se encontró un método para actualizar el estado:</p>
              <p><strong>${mejorMetodo.metodo} con ${mejorMetodo.campo}</strong></p>
              <p>¿Desea actualizar la compra a APROBADO?</p>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, actualizar',
            cancelButtonText: 'No',
            ...alertConfig
          });
          
          if (confirmResult.isConfirmed) {
            // Intentar actualizar el estado
            await comprasService.actualizarEstadoCompra(id, 'APROBADO');
            Swal.fire({
              title: '¡Actualizado!', 
              text: 'La compra ha sido actualizada a APROBADO', 
              icon: 'success',
              ...alertConfig
            });
            
            // Recargar la lista de compras
            const updatedCompras = await comprasService.getCompras();
            setCompras(updatedCompras);
          }
        }
      });
    } catch (error) {
      console.error('Error durante el diagnóstico:', error);
      Swal.fire({
        title: 'Error',
        text: `Error durante el diagnóstico: ${error.message}`,
        icon: 'error',
        ...alertConfig
      });
    }
  };

  const forzarActualizacionEstado = async () => {
    const { value: compraId } = await Swal.fire({
      title: 'Actualización Forzada',
      text: 'Ingrese el ID de la compra que desea actualizar:',
      input: 'text',
      inputPlaceholder: 'Ej: 30',
      showCancelButton: true,
      confirmButtonText: 'Continuar',
      cancelButtonText: 'Cancelar',
      ...alertConfig
    });

    if (!compraId) return;

    // Preguntar por el nuevo estado
    const { value: nuevoEstado } = await Swal.fire({
      title: 'Seleccione nuevo estado',
      input: 'select',
      inputOptions: {
        'PENDIENTE': 'PENDIENTE',
        'APROBADO': 'APROBADO',
        'RECHAZADO': 'RECHAZADO',
        'ANULADO': 'ANULADO'
      },
      inputPlaceholder: 'Seleccione estado',
      confirmButtonText: 'Actualizar',
      showCancelButton: true,
      ...alertConfig
    });

    if (!nuevoEstado) return;

    // Preguntar por el método de actualización
    const { value: metodo } = await Swal.fire({
      title: 'Método de actualización',
      input: 'radio',
      inputOptions: {
        'api': 'Usar API standard (PUT/PATCH)',
        'directa': 'Actualización directa en base de datos (avanzado)',
        'ambos': 'Intentar ambos métodos (recomendado)'
      },
      inputValue: 'ambos',
      confirmButtonText: 'Actualizar',
      showCancelButton: true,
      ...alertConfig
    });

    if (!metodo) return;

    try {
      Swal.fire({
        title: 'Actualizando estado...',
        text: `Intentando actualizar usando método: ${metodo}`,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
        ...alertConfig
      });

      let result;
      
      // Aplicar según el método seleccionado
      if (metodo === 'api' || metodo === 'ambos') {
        try {
          result = await comprasService.actualizarEstadoCompra(compraId, nuevoEstado);
          console.log('Resultado de actualización API:', result);
        } catch (apiError) {
          console.error('Error actualizando por API:', apiError);
          if (metodo === 'api') throw apiError;
        }
      }

      if (metodo === 'directa' || (metodo === 'ambos' && !result)) {
        console.log('Intentando actualización directa...');
        result = await comprasService.actualizarEstadoDirecto(compraId, nuevoEstado);
        console.log('Resultado de actualización directa:', result);
      }

      // Verificar si funcionó consultando el estado actual
      let compraActualizada;
      try {
        compraActualizada = await comprasService.getCompraById(compraId);
      } catch (error) {
        console.error('Error al verificar estado actualizado:', error);
      }

      // Recargar la lista completa
      await cargarDatos();

      if (compraActualizada) {
        // Usar nombres diferentes para evitar conflictos
        const estadoPagoActual = compraActualizada.estado_pago || 
                               compraActualizada.estado?.nombre || 
                               compraActualizada.estado;
        const idEstadoActual = compraActualizada.id_estado;
        
        console.log('Estado después de actualización:', estadoPagoActual, idEstadoActual);
        
        // Verificar el estado actual contra el esperado (texto principalmente)
        const estadoActualizado = estadoPagoActual === nuevoEstado;
        
        if (estadoActualizado) {
          Swal.fire({
            title: '¡Éxito!', 
            text: `La compra ha sido actualizada a ${nuevoEstado}`, 
            icon: 'success',
            ...alertConfig
          });
        } else {
          // Si no se actualizó en el backend, mostrar opciones adicionales
          Swal.fire({
            title: 'Estado no actualizado',
            html: `
              <p>La operación se completó, pero el estado no parece haber cambiado en la base de datos.</p>
              <p>Estado actual: ${estadoPagoActual || 'Desconocido'}</p>
              <p>ID Estado actual: ${idEstadoActual || 'Desconocido'}</p>
              <p>Intente refrescar la página para ver los cambios más recientes,
              o solicite soporte técnico mencionando que el estado no se actualiza.</p>
            `,
            icon: 'warning',
            ...alertConfig
          });
        }
      } else {
        Swal.fire({
          title: 'Operación Completada',
          text: 'La operación de actualización se completó, pero no se pudo verificar el nuevo estado. Refresque la página para ver los cambios.',
          icon: 'info',
          ...alertConfig
        });
      }
    } catch (error) {
      console.error('Error al forzar actualización:', error);
      Swal.fire({
        title: 'Error',
        text: `No se pudo actualizar el estado: ${error.message}`,
        icon: 'error',
        ...alertConfig
      });
    }
  };

  const handlePreviewExport = () => {
    setPreviewData(compras);
    setPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
  };

  const handleExportToExcel = async (dataToExport) => {
  try {
    // Obtener los detalles de cada compra
    const comprasConDetalles = await Promise.all(dataToExport.map(async (compra) => {
      try {
        const detalles = await comprasService.getDetallesByCompraId(compra.id_compras);
        return {
          ...compra,
          detalles: detalles
        };
      } catch (error) {
        console.error(`Error al obtener detalles de la compra ${compra.id_compras}:`, error);
        return {
          ...compra,
          detalles: []
        };
      }
    }));

    // Formatear los datos para el Excel incluyendo los detalles de materiales
    const formattedData = comprasConDetalles.map(compra => {
      // Obtener los detalles de materiales como string
      const materialesStr = compra.detalles?.map(detalle => 
        `${detalle.material?.nombre || 'N/A'} (${detalle.cantidad} unidades a Q${detalle.precio_unitario})`
      ).join('\n') || 'Sin materiales';

      // Calcular el IVA total de la compra (12% del subtotal)
      const ivaTotal = compra.detalles?.reduce((acc, detalle) => 
        acc + (detalle.iva_monto || 0), 0
      ) || 0;

      return {
        'Número de Factura': compra.numero_factura || '',
        'Proveedor': compra.proveedor?.nombre || '',
        'Contacto': compra.proveedor?.contacto || '',
        'Fecha': new Date(compra.fecha_compra).toLocaleDateString(),
        'Materiales': materialesStr,
        'IVA': `Q${ivaTotal.toFixed(2)} (12%)`,
        'Total': `Q${parseFloat(compra.total || 0).toFixed(2)}`,
        'Estado': compra.estado_pago || compra.estado,
        'Tipo de Pago': compra.tipo_pago || '',
        'Observaciones': compra.observaciones || ''
      };
    });

    // Crear el libro de trabajo
    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Compras');
    
    // Ajustar el ancho de las columnas
    const wscols = [
      {wch: 15}, // Número de Factura
      {wch: 20}, // Proveedor
      {wch: 20}, // Contacto
      {wch: 12}, // Fecha
      {wch: 60}, // Materiales
      {wch: 15}, // IVA (Nueva columna)
      {wch: 12}, // Total
      {wch: 12}, // Estado
      {wch: 12}, // Tipo de Pago
      {wch: 30}  // Observaciones
    ];
    ws['!cols'] = wscols;

    // Configurar que las celdas se ajusten al texto
    ws['!rows'] = formattedData.map(() => ({ hpt: 30 }));

    // Generar el archivo
    XLSX.writeFile(wb, `Compras_${new Date().toISOString().split('T')[0]}.xlsx`);

    // Mostrar mensaje de éxito
    Swal.fire({
      title: '¡Éxito!',
      text: 'El archivo Excel se ha generado correctamente',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
      ...alertConfig
    });
  } catch (error) {
    console.error('Error al exportar a Excel:', error);
    Swal.fire({
      title: 'Error',
      text: 'No se pudo generar el archivo Excel',
      icon: 'error',
      ...alertConfig
    });
  }
};

  const handleExportToPDF = (filteredData) => {
    console.log('Exportando a PDF:', filteredData);
    Swal.fire({
      title: 'Exportación a PDF',
      text: 'La funcionalidad estará disponible próximamente',
      icon: 'info',
      ...alertConfig,
      customClass: {
        container: 'swal-container-highest',
        popup: 'swal-popup-highest'
      }
    });
  };

  // Componente para añadir estilos globales para las alertas con alta prioridad de z-index
  const GlobalSwalStyles = () => {
    useEffect(() => {
      // Crear un elemento de estilo
      const styleElement = document.createElement('style');
      styleElement.innerHTML = `
        .swal-container-highest {
          z-index: 9999 !important;
        }
        .swal-popup-highest {
          z-index: 9999 !important;
        }
      `;
      // Añadir al head del documento
      document.head.appendChild(styleElement);

      // Limpiar cuando el componente se desmonte
      return () => {
        if (document.head.contains(styleElement)) {
          document.head.removeChild(styleElement);
        }
      };
    }, []);

    return null;
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: 'calc(100vh - 100px)',
        mt: 8 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  console.log('loading:', loading, 'compras:', compras);

  // Agregar este estilo en algún lugar antes del return
  const floatingButtonStyle = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 1000,
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3498db',
    color: 'white',
    boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
    cursor: 'pointer',
    border: 'none',
    fontSize: '24px'
  };

  return (
    <Box sx={{ p: 3, mt: 8 }}>
      <GlobalSwalStyles />
      <Card sx={{ width: '100%', boxShadow: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" component="h2" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
              Lista de Compras
            </Typography>
            <Box>
              <Button
                variant="outlined"
                startIcon={<PreviewIcon />}
                onClick={handlePreviewExport}
                sx={{ 
                  borderColor: '#1976d2', 
                  color: '#1976d2',
                  mr: 2
                }}
              >
                Vista Previa Exportación
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleClickOpen}
                sx={{ backgroundColor: '#1976d2' }}
              >
                Nueva Compra
              </Button>
            </Box>
          </Box>

          <TextField
            fullWidth
            variant="outlined"
            placeholder="Buscar por número de factura, proveedor o contacto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ mb: 2 }}>
            <Tabs
              value={selectedTab}
              onChange={handleTabChange}
              sx={{
                '& .MuiTab-root': {
                  minWidth: 'auto',
                  px: 2,
                  py: 1,
                  backgroundColor: '#f5f5f5',
                  '&.Mui-selected': {
                    backgroundColor: '#fff',
                    color: '#1976d2'
                  }
                },
                '& .MuiTabs-indicator': { display: 'none' }
              }}
            >
              <Tab 
                label="ACTIVAS" 
                value={0}
                sx={{ 
                  borderTopLeftRadius: 4,
                  borderBottomLeftRadius: 4,
                  mr: 1
                }}
              />
              <Tab 
                label="RECHAZADAS" 
                value={1}
                sx={{ 
                  borderTopRightRadius: 4,
                  borderBottomRightRadius: 4
                }}
              />
            </Tabs>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#1976d2' }}>
                  <TableCell sx={{ color: 'white' }}>N° Factura</TableCell>
                  <TableCell sx={{ color: 'white', width: 80 }} align="center">Logo</TableCell>
                  <TableCell sx={{ color: 'white' }}>Proveedor</TableCell>
                  <TableCell sx={{ color: 'white' }}>Contacto</TableCell>
                  <TableCell sx={{ color: 'white' }}>Fecha</TableCell>
                  <TableCell sx={{ color: 'white' }}>Total</TableCell>
                  <TableCell sx={{ color: 'white' }}>Estado</TableCell>
                  <TableCell sx={{ color: 'white' }}>Tipo Pago</TableCell>
                  <TableCell sx={{ color: 'white' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredCompras().map((compra) => (
                  <TableRow key={compra.id_compras}>
                    <TableCell>{compra.numero_factura}</TableCell>
                    <TableCell align="center">
                      {compra.proveedor?.imagen_url ? (
                        <img
                          src={getImageUrl(compra.proveedor.imagen_url)}
                          alt={`Logo de ${compra.proveedor.nombre}`}
                          style={{
                            width: '50px',
                            height: '50px',
                            objectFit: 'contain',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                          }}
                          onError={(e) => {
                            console.error('Error cargando imagen:', e.target.src);
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            // Mostrar un avatar con la inicial
                            e.target.parentNode.innerHTML = `
                              <div style="
                                width: 50px;
                                height: 50px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                background-color: ${getColorForName(compra.proveedor.nombre)};
                                border-radius: 4px;
                                color: white;
                                font-weight: bold;
                                margin: 0 auto;
                              ">
                                ${compra.proveedor.nombre.charAt(0).toUpperCase()}
                              </div>
                            `;
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '50px',
                          height: '50px',
                          backgroundColor: getColorForName(compra.proveedor?.nombre || 'P'),
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold',
                          margin: '0 auto'
                        }}>
                          {(compra.proveedor?.nombre || 'P').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{compra.proveedor?.nombre}</TableCell>
                    <TableCell>{compra.proveedor?.contacto || 'N/A'}</TableCell>
                    <TableCell>{compra.fecha_compra ? new Date(compra.fecha_compra).toLocaleDateString() : 
                               compra.fecha_vencimiento ? new Date(compra.fecha_vencimiento).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>
                      Q{parseFloat(compra.total || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={compra.estado_pago || compra.estado}
                        color={getEstadoColor(compra.estado_pago || compra.estado)}
                        size="small"
                        sx={{
                          fontWeight: 'medium',
                          '& .MuiChip-label': {
                            color: 'white'
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>{compra.tipo_pago}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleEdit(compra.id_compras)} sx={{ color: '#1976d2' }}>
                        <EditIcon />
                      </IconButton>
                      
                      {/* Mostrar botón de rechazar o reactivar según la pestaña actual */}
                      {selectedTab === 0 ? (
                        <IconButton size="small" onClick={() => handleDelete(compra.id_compras)} sx={{ color: '#d32f2f' }}>
                          <DeleteIcon />
                        </IconButton>
                      ) : (
                        <IconButton 
                          size="small" 
                          onClick={() => handleReactivate(compra.id_compras)} 
                          sx={{ color: '#4caf50' }}
                          title="Reactivar compra"
                        >
                          <RestoreIcon />
                        </IconButton>
                      )}
                      
                      <IconButton size="small" sx={{ color: '#2e7d32' }} onClick={() => handleViewDetails(compra)}>
                        <VisibilityIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{isEditing ? 'Editar Compra' : 'Nueva Compra'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Proveedor</InputLabel>
                  <Select
                    value={compraForm.id_proveedor}
                    onChange={(e) => setCompraForm({ ...compraForm, id_proveedor: e.target.value })}
                    label="Proveedor"
                  >
                    {proveedores.map((proveedor) => (
                      <MenuItem 
                        key={proveedor.id_proveedores} 
                        value={proveedor.id_proveedores}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography>{proveedor.nombre}</Typography>
                          <Typography sx={{ color: 'text.secondary', fontSize: '0.9em' }}>
                            ({proveedor.ruc})
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Número de Factura"
                  value={compraForm.numeroFactura}
                  onChange={(e) => setCompraForm({ ...compraForm, numeroFactura: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Fecha"
                  type="date"
                  value={compraForm.fecha}
                  onChange={(e) => setCompraForm({ ...compraForm, fecha: e.target.value })}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Pago</InputLabel>
                  <Select
                    value={compraForm.tipoPago}
                    onChange={(e) => setCompraForm({ ...compraForm, tipoPago: e.target.value })}
                    label="Tipo de Pago"
                    required
                  >
                    {tiposPago.map((tipo) => (
                      <MenuItem key={tipo} value={tipo}>
                        {tipo}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel id="estado-select-label">Estado</InputLabel>
                  <Select
                    labelId="estado-select-label"
                    value={compraForm.estado}
                    onChange={(e) => setCompraForm({ 
                      ...compraForm, 
                      estado: e.target.value,
                      estado_pago: e.target.value  // Actualizar ambos campos para consistencia
                    })}
                    label="Estado"
                  >
                    <MenuItem value="PENDIENTE">PENDIENTE</MenuItem>
                    <MenuItem value="APROBADO">APROBADO</MenuItem>
                    <MenuItem value="ANULADO">ANULADO</MenuItem>
                    <MenuItem value="RECHAZADO">RECHAZADO</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Observaciones"
                  value={compraForm.observaciones}
                  onChange={(e) => setCompraForm({ ...compraForm, observaciones: e.target.value })}
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
              <DetalleCompra
                idCompra={compraForm.id}
                detalles={detalles}
                onDetallesChange={setDetalles}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {isEditing ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showDetalle} onClose={handleCloseDetails} maxWidth="md" fullWidth>
        {selectedCompra && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Detalle de Compra #{selectedCompra.id_compras}</Typography>
                <IconButton edge="end" color="inherit" onClick={handleCloseDetails} aria-label="close">
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1">
                  <strong>Factura:</strong> {selectedCompra.numero_factura}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>Proveedor:</strong> {selectedCompra.proveedor?.nombre}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>Fecha:</strong> {
                    selectedCompra.fecha_compra ? 
                      new Date(selectedCompra.fecha_compra).toLocaleDateString() : 
                    selectedCompra.fecha_vencimiento ? 
                      new Date(selectedCompra.fecha_vencimiento).toLocaleDateString() : 
                    selectedCompra.created_at ?
                      new Date(selectedCompra.created_at).toLocaleDateString() :
                    'N/A'
                  }
                </Typography>
                <Typography variant="subtitle1">
                  <strong>Total:</strong> Q{parseFloat(selectedCompra.total || 0).toFixed(2)}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>Estado:</strong> 
                  <Chip 
                    label={selectedCompra.estado_pago || selectedCompra.estado}
                    color={getEstadoColor(selectedCompra.estado_pago || selectedCompra.estado)}
                    size="small"
                    sx={{ ml: 1, fontWeight: 'medium', '& .MuiChip-label': { color: 'white' } }}
                  />
                </Typography>
                {selectedCompra.observaciones && (
                  <Typography variant="subtitle1">
                    <strong>Observaciones:</strong> {selectedCompra.observaciones}
                  </Typography>
                )}
              </Box>

              <Typography variant="h6" sx={{ mb: 2 }}>Materiales</Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#1976d2' }}>
                      <TableCell sx={{ color: 'white' }}>Material</TableCell>
                      <TableCell sx={{ color: 'white' }}>Código</TableCell>
                      <TableCell align="right" sx={{ color: 'white' }}>Cantidad</TableCell>
                      <TableCell align="right" sx={{ color: 'white' }}>Precio Unitario</TableCell>
                      <TableCell align="right" sx={{ color: 'white' }}>Subtotal</TableCell>
                      <TableCell align="right" sx={{ color: 'white' }}>IVA</TableCell>
                      <TableCell align="right" sx={{ color: 'white' }}>Descuento</TableCell>
                      <TableCell align="right" sx={{ color: 'white' }}>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedCompra.detalles?.map((detalle, index) => (
                      <TableRow key={index}>
                        <TableCell>{detalle.material}</TableCell>
                        <TableCell>{detalle.codigo}</TableCell>
                        <TableCell align="right">{detalle.cantidad}</TableCell>
                        <TableCell align="right">Q{parseFloat(detalle.precio_unitario || 0).toFixed(2)}</TableCell>
                        <TableCell align="right">Q{parseFloat(detalle.subtotal || 0).toFixed(2)}</TableCell>
                        <TableCell align="right">Q{parseFloat(detalle.iva_monto || 0).toFixed(2)}</TableCell>
                        <TableCell align="right">Q{parseFloat(detalle.descuento_monto || 0).toFixed(2)}</TableCell>
                        <TableCell align="right">Q{(parseFloat(detalle.subtotal || 0) + parseFloat(detalle.iva_monto || 0) - parseFloat(detalle.descuento_monto || 0)).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <PagosCompra 
                idCompra={selectedCompra.id_compras} 
                totalCompra={selectedCompra.total} 
                onEstadoChange={handleEstadoChange}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDetails}>Cerrar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <ExportPreviewComprasDialog
        open={previewOpen}
        onClose={handleClosePreview}
        data={previewData}
        onExportExcel={handleExportToExcel}
        onExportPDF={handleExportToPDF}
      />
    </Box>
  );
};

export default Compras;
const getEstadoNombre = (idEstado) => {
  switch (idEstado) {
    case 1:
      return 'PENDIENTE';
    case 2:
      return 'APROBADO';
    case 3:
      return 'RECHAZADO';
    case 4:
      return 'ANULADO';
    default:
      return 'DESCONOCIDO';
  }
};
