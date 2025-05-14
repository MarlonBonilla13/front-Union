import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Button, Typography, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Chip, Tabs, Tab,
  Card, CardContent, InputAdornment, CircularProgress, Grid, FormControl, InputLabel, Select
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

const tiposPago = ['CONTADO', 'CREDITO'];
const estadosCompra = ['PENDIENTE', 'APROBADO', 'RECHAZADO', 'ANULADO'];

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
    estado: 'PENDIENTE', // Changed from 'NUEVO' to 'PENDIENTE'
    observaciones: '',
    total: 0
  });

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
      case 0:
        filtered = filtered.filter(c => c.estado !== 'CANCELADA');
        break;
      case 1:
        filtered = filtered.filter(c => c.estado === 'CANCELADA');
        break;
    }

    // Aplicar filtro de búsqueda
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(compra => 
        (compra.numero_factura?.toLowerCase() || '').includes(searchLower) ||
        (compra.proveedor?.nombre?.toLowerCase() || '').includes(searchLower)
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
      estado: 'PENDIENTE', // Changed from 'NUEVO' to 'PENDIENTE'
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

      console.log('Detalles antes de enviar:', detalles);

      const compraData = {
        id_proveedor: parseInt(compraForm.id_proveedor),
        fecha: compraForm.fecha,
        numeroFactura: compraForm.numeroFactura,
        tipoPago: compraForm.tipoPago,
        estado: compraForm.estado,
        observaciones: compraForm.observaciones || '',
        detalles: detalles.map(detalle => ({
          idMaterial: detalle.idMaterial,
          cantidad: detalle.cantidad,
          precioUnitario: detalle.precioUnitario,
          iva: detalle.iva,
          descuento: detalle.descuento,
          subtotal: detalle.subtotal,
          ivaMonto: detalle.ivaMonto,
          descuentoMonto: detalle.descuentoMonto
        }))
      };

      console.log('Datos de compra a enviar:', compraData);

      if (isEditing) {
        try {
          // Si estamos cambiando el estado a APROBADO, RECHAZADO o ANULADO
          // vamos a utilizar la función específica para actualizar estado
          const estadoOriginal = compras.find(c => c.id_compras === compraForm.id)?.estado;
          const hayMovimientoDeEstado = estadoOriginal !== compraForm.estado;
          
          if (hayMovimientoDeEstado) {
            console.log('Detectado cambio de estado:', estadoOriginal, '->', compraForm.estado);
            
            // Intentar primero actualizar solo el estado
            await comprasService.actualizarEstadoCompra(compraForm.id, compraForm.estado);
            Swal.fire('Éxito', `El estado de la compra ha sido actualizado a ${compraForm.estado}`, 'success');
            
            // Luego actualizamos el resto de los datos
            await comprasService.updateCompra(compraForm.id, compraData);
            console.log('Datos generales actualizados después del cambio de estado');
          } else {
            // Si no hay cambio de estado, actualizar normalmente
            await comprasService.updateCompra(compraForm.id, compraData);
            Swal.fire('Éxito', 'Compra actualizada correctamente', 'success');
          }
        } catch (updateError) {
          console.error('Error al actualizar compra:', updateError);
          // Actualizar solo la UI si la API falla
          Swal.fire({
            title: 'Problemas con el servidor',
            text: 'No se pudo actualizar en el servidor, pero se actualizará localmente. Por favor, intente sincronizar más tarde.',
            icon: 'warning'
          });
          
          // Actualizar localmente en lugar de hacer la llamada a la API
          setCompras(prevCompras => prevCompras.map(compra => 
            compra.id_compras === compraForm.id ? { 
              ...compra, 
              ...compraData,
              // Asegurarse de que las propiedades tengan los nombres correctos
              id_proveedores: parseInt(compraForm.id_proveedor),
              numero_factura: compraForm.numeroFactura,
              tipo_pago: compraForm.tipoPago,
              estado: compraForm.estado,
              observaciones: compraForm.observaciones || '',
            } : compra
          ));
        }
      } else {
        try {
          const response = await comprasService.createCompra(compraData);
          console.log('Respuesta del servidor:', response);
          Swal.fire('Éxito', 'Compra creada correctamente', 'success');
        } catch (createError) {
          console.error('Error al crear compra:', createError);
          Swal.fire('Error', 'No se pudo crear la compra en el servidor', 'error');
          throw createError; // Re-lanzar para salir de la función
        }
      }

      handleCloseDialog();
      
      try {
        // Intentar actualizar la lista de compras desde el servidor
        const updatedCompras = await comprasService.getCompras();
        setCompras(updatedCompras);
      } catch (fetchError) {
        console.error('Error al obtener compras actualizadas:', fetchError);
        // No es crítico si no se pueden obtener las compras actualizadas
        // Ya se actualizó la UI localmente si fue necesario
      }
    } catch (error) {
      console.error('Error al guardar compra:', error);
      const errorMessage = error.response?.data?.message || error.message || 'No se pudo guardar la compra';
      Swal.fire('Error', errorMessage, 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      const result = await Swal.fire({
        title: '¿Está seguro?',
        text: "La compra será cancelada",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, cancelar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        try {
          // Intentar actualizar el estado utilizando la función específica
          await comprasService.actualizarEstadoCompra(id, 'ANULADO');
          
          // Si la actualización tuvo éxito, actualizar el estado local
          const updatedCompras = await comprasService.getCompras();
          setCompras(updatedCompras);
          
          Swal.fire({
            title: 'Cancelada',
            text: 'La compra ha sido cancelada',
            icon: 'success'
          });
        } catch (error) {
          console.error('Error al actualizar estado de compra:', error);
          
          // Actualizar solo la UI si la API falla
          Swal.fire({
            title: 'Problemas con el servidor',
            text: 'No se pudo actualizar en el servidor, pero se actualizará localmente. Por favor, intente sincronizar más tarde.',
            icon: 'warning'
          });
          
          // Actualizar localmente
          setCompras(prevCompras => prevCompras.map(compra => 
            compra.id_compras === id ? { ...compra, estado: 'ANULADO', id_estado: 4 } : compra
          ));
        }
      }
    } catch (error) {
      console.error('Error al cancelar compra:', error);
      Swal.fire({
        title: 'Error',
        text: 'Error al cancelar la compra',
        icon: 'error'
      });
    }
  };

  const handleEdit = async (compraToEdit) => {
    setIsEditing(true);
    setCompraForm({
      id: compraToEdit.id_compras,
      id_proveedor: compraToEdit.id_proveedores?.toString() || '',
      fecha: compraToEdit.fecha_compra ? new Date(compraToEdit.fecha_compra).toISOString().split('T')[0] : '',
      numeroFactura: compraToEdit.numero_factura || '',
      tipoPago: compraToEdit.tipo_pago || 'CONTADO',
      estado: compraToEdit.estado?.nombre || compraToEdit.estado || 'PENDIENTE', // Cambiado de 'NUEVO' a 'PENDIENTE'
      observaciones: compraToEdit.observaciones || '',
      total: compraToEdit.total || 0
    });

    try {
      // 1. Obtén todos los materiales
      const materiales = await import('../../services/materialService').then(m => m.getMaterials());

      // 2. Solicita los detalles al backend
      const detallesResponse = await comprasService.getDetallesByCompraId(compraToEdit.id_compras);

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
        icon: 'error'
      });
    }
  };

  const handleCloseDetails = () => {
    setSelectedCompra(null);
    setShowDetalle(false);
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
      }
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
              id_estado: 1,
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
              id_estado: 1,
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
        confirmButtonText: 'Entendido'
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
          cancelButtonText: 'Cancelar'
        }).then((result) => {
          if (result.isConfirmed) {
            // Guardar la mejor ruta y formato en localStorage
            localStorage.setItem('bestUpdateRoute', JSON.stringify({
              route: bestRoute.route,
              method: bestRoute.method,
              format: bestFormat,
              lastTested: new Date().toISOString()
            }));
            
            Swal.fire(
              '¡Configuración actualizada!',
              `La configuración ha sido actualizada para usar ${bestRoute.method} ${bestRoute.route} con formato ${bestFormat || 'predeterminado'}.`,
              'success'
            );
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
        icon: 'error'
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
      cancelButtonText: 'Cancelar'
    });

    if (!compraId.isConfirmed || !compraId.value) return;

    const id = compraId.value;
    
    Swal.fire({
      title: 'Ejecutando diagnóstico',
      text: 'Probando distintos métodos para actualizar el estado...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
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
        width: '800px'
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
            cancelButtonText: 'No'
          });
          
          if (confirmResult.isConfirmed) {
            // Intentar actualizar el estado
            await comprasService.actualizarEstadoCompra(id, 'APROBADO');
            Swal.fire('¡Actualizado!', 'La compra ha sido actualizada a APROBADO', 'success');
            
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
        icon: 'error'
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
      cancelButtonText: 'Cancelar'
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
      showCancelButton: true
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
      showCancelButton: true
    });

    if (!metodo) return;

    try {
      Swal.fire({
        title: 'Actualizando estado...',
        text: `Intentando actualizar usando método: ${metodo}`,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
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
        const estadoActual = compraActualizada.estado?.nombre || compraActualizada.estado;
        const idEstadoActual = compraActualizada.id_estado;
        
        console.log('Estado después de actualización:', estadoActual, idEstadoActual);
        
        const estadoNumericoCorrecto = 
          (nuevoEstado === 'APROBADO' && idEstadoActual === 2) ||
          (nuevoEstado === 'RECHAZADO' && idEstadoActual === 3) ||
          (nuevoEstado === 'ANULADO' && idEstadoActual === 4) ||
          (nuevoEstado === 'PENDIENTE' && idEstadoActual === 1);
        
        const estadoTextoCorrecto = estadoActual === nuevoEstado;
        
        if (estadoNumericoCorrecto || estadoTextoCorrecto) {
          Swal.fire('¡Éxito!', `La compra ha sido actualizada a ${nuevoEstado}`, 'success');
        } else {
          // Si no se actualizó en el backend, mostrar opciones adicionales
          Swal.fire({
            title: 'Estado no actualizado',
            html: `
              <p>La operación se completó, pero el estado no parece haber cambiado en la base de datos.</p>
              <p>Estado actual: ${estadoActual || 'Desconocido'}</p>
              <p>ID Estado actual: ${idEstadoActual || 'Desconocido'}</p>
              <p>Intente refrescar la página para ver los cambios más recientes,
              o solicite soporte técnico mencionando que el estado no se actualiza.</p>
            `,
            icon: 'warning',
            confirmButtonText: 'Entendido'
          });
        }
      } else {
        Swal.fire('Operación Completada', 'La operación de actualización se completó, pero no se pudo verificar el nuevo estado. Refresque la página para ver los cambios.', 'info');
      }
    } catch (error) {
      console.error('Error al forzar actualización:', error);
      Swal.fire('Error', `No se pudo actualizar el estado: ${error.message}`, 'error');
    }
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
      <Card sx={{ width: '100%', boxShadow: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" component="h2" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
              Lista de Compras
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleClickOpen}
              sx={{ backgroundColor: '#1976d2' }}
            >
              Nueva Compra
            </Button>
          </Box>

          <TextField
            fullWidth
            variant="outlined"
            placeholder="Buscar por número de factura o proveedor..."
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
                label="CANCELADAS" 
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
                  <TableCell sx={{ color: 'white' }}>Proveedor</TableCell>
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
                    <TableCell>{compra.proveedor?.nombre}</TableCell>
                    <TableCell>{new Date(compra.fecha_compra).toLocaleDateString()}</TableCell>
                    <TableCell>
                      Q{parseFloat(compra.total || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={compra.estado?.nombre || getEstadoNombre(compra.id_estado)} 
                        color={getEstadoColor(compra.id_estado)}
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>{compra.tipo_pago}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleEdit(compra)} sx={{ color: '#1976d2' }}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(compra.id_compras)} sx={{ color: '#d32f2f' }}>
                        <DeleteIcon />
                      </IconButton>
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
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={compraForm.estado}
                    onChange={(e) => setCompraForm({ ...compraForm, estado: e.target.value })}
                    label="Estado"
                    required
                  >
                    {estadosCompra.map((estado) => (
                      <MenuItem key={estado} value={estado}>
                        {estado}
                      </MenuItem>
                    ))}
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

      <Dialog open={showDetalle} onClose={handleCloseDetails} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#1976d2', color: 'white', mb: 3 }}>
          Detalles de la Compra
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedCompra && (
            <>
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(2, 1fr)', mb: 3 }}>
                <Typography variant="subtitle1">
                  <strong>N° Factura:</strong> {selectedCompra.numero_factura}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>Proveedor:</strong> {selectedCompra.proveedor?.nombre}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>Fecha:</strong> {new Date(selectedCompra.fecha_compra).toLocaleDateString()}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>Estado:</strong> {selectedCompra.estado?.nombre || selectedCompra.estado}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>Tipo de Pago:</strong> {selectedCompra.tipo_pago}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>Total:</strong> Q{parseFloat(selectedCompra?.total || 0).toFixed(2)}
                </Typography>
                {selectedCompra.observaciones && (
                  <Typography variant="subtitle1" sx={{ gridColumn: '1 / -1' }}>
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
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Botón flotante para diagnóstico API */}
      <button 
        style={floatingButtonStyle} 
        onClick={testApiRoutes}
        onContextMenu={(e) => {
          e.preventDefault();
          const saved = localStorage.getItem('bestUpdateRoute');
          if (saved) {
            const config = JSON.parse(saved);
            Swal.fire({
              title: 'Configuración API',
              html: `
                <div style="text-align: left;">
                  <p><strong>Ruta:</strong> ${config.route}</p>
                  <p><strong>Método:</strong> ${config.method}</p>
                  <p><strong>Formato:</strong> ${config.format || 'No especificado'}</p>
                  <p><small>Click normal: Diagnóstico completo API</small></p>
                  <p><small>Click derecho: Ver/Reiniciar configuración</small></p>
                  <p><small>Alt+Click: Diagnóstico de estado</small></p>
                  <p><small>Shift+Alt+Click: Forzar actualización de estado</small></p>
                </div>
              `,
              showCancelButton: true,
              cancelButtonText: 'Reiniciar config',
              confirmButtonText: 'OK'
            }).then(r => {
              if (r.dismiss === Swal.DismissReason.cancel) {
                localStorage.removeItem('bestUpdateRoute');
                Swal.fire('Configuración reiniciada', '', 'success');
              }
            });
          } else {
            Swal.fire('Sin configuración', 'Ejecute el diagnóstico primero', 'info');
          }
          return false;
        }}
        onMouseDown={(e) => {
          // Si se presiona Alt+Click, ejecutar diagnóstico de estado
          if (e.altKey && e.shiftKey) {
            e.preventDefault();
            forzarActualizacionEstado();
            return false;
          } else if (e.altKey) {
            e.preventDefault();
            testEstadoCompra();
            return false;
          }
        }}
        title="Clic: Diagnóstico API | Clic derecho: Ver configuración | Alt+Clic: Diagnóstico estado | Shift+Alt+Clic: Forzar actualización"
      >
        🔍
      </button>
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

const getEstadoColor = (idEstado) => {
  switch (idEstado) {
    case 1:
      return 'warning'; // Pendiente
    case 2:
      return 'success'; // Aprobado
    case 3:
      return 'error'; // Rechazado
    case 4:
      return 'default'; // Anulado
    default:
      return 'default';
  }
};
