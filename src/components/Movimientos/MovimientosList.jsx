import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  InputAdornment,
  Tooltip // Add this import
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // Add this import
import CancelIcon from '@mui/icons-material/Cancel'; // Add this import
import { getMovimientos, createMovimiento, updateMovimientoEstado } from '../../services/movimientoService';
import Swal from 'sweetalert2';
import { Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { getMaterials, updateMaterialStock } from '../../services/materialService';
import { API_IMAGE_URL } from '../../config/config';
import { Grid } from '@mui/material'; // Actualizar imports

// Añadir import
import { getEmpleadosActivos } from '../../services/empleadoService';

// Update imports at the top
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import esLocale from 'date-fns/locale/es';
import { Button } from '@mui/material';  // Add to imports

// Añadir el import para el contexto de autenticación
import { useAuth } from '../../contexts/AuthContext';

import ExportPreviewDialog from './ExportPreviewDialog';
import PreviewIcon from '@mui/icons-material/Preview';
import { exportToExcel, exportToPDF } from '../../services/movimientoService';

const MovimientosList = () => {
  // Add these states with your other state declarations at the top of the component
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState([]);

  // Add these functions with your other function declarations
  const handlePreviewExport = () => {
    setPreviewData(filteredMovimientos);
    setPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
  };

  const handleExportToExcel = (dataToExport) => {
    exportToExcel(dataToExport);
    handleClosePreview();
    Swal.fire({
      icon: 'success',
      title: 'Exportación Exitosa',
      text: 'Los datos han sido exportados a Excel correctamente',
      timer: 2000,
      showConfirmButton: false
    });
  };

  // Función para exportar a PDF
  const handleExportToPDF = (data) => {
    try {
      console.log('Iniciando exportación a PDF...');
      const result = exportToPDF(data);
      if (result) {
        console.log('Exportación a PDF completada');
      } else {
        console.error('La exportación a PDF falló');
      }
    } catch (error) {
      console.error('Error al exportar a PDF:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo exportar a PDF'
      });
    }
  };
  // Obtener el usuario y su rol del contexto de autenticación
  const { user } = useAuth();
  
  // Estados existentes...
  // Change the initial state from 0 to empty string
  const [cantidad, setCantidad] = useState('');
  
  const [isStockInsuficiente, setIsStockInsuficiente] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [movimientos, setMovimientos] = useState([]);
  const [filteredMovimientos, setFilteredMovimientos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [materials, setMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [stockActual, setStockActual] = useState(0);
  const [stockMinimo, setStockMinimo] = useState(0);
  const [empleados, setEmpleados] = useState([]);
  const [selectedEmpleado, setSelectedEmpleado] = useState('');
  const [comentario, setComentario] = useState('');

  // Add this function after loadMaterials
  const checkStockLevels = (material) => {
    if (material.stock_actual <= material.stock_minimo) {
      Swal.fire({
        icon: 'warning',
        title: 'Stock Bajo',
        text: `El material "${material.nombre}" tiene un stock actual (${material.stock_actual}) igual o menor al stock mínimo (${material.stock_minimo}).`,
        confirmButtonColor: '#f0ad4e'
      });
    }
  };
  
  // Modify loadMaterials to include stock check
  // Remove or comment out the stock check from loadMaterials
  const loadMaterials = async () => {
    try {
      const data = await getMaterials();
      setMaterials(data);
      
      // Remove the data.forEach check here
    } catch (error) {
      console.error('Error loading materials:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Could not load materials'
      });
    }
  };

  // Add these new states at the top with other states
  const [solicitudMaterial, setSolicitudMaterial] = useState('');
  const [cantidadSolicitada, setCantidadSolicitada] = useState('');
  const [comentarioSolicitud, setComentarioSolicitud] = useState('');
  const [departamentoSolicitud, setDepartamentoSolicitud] = useState(''); 
  const [selectedEmpleadoSolicitud, setSelectedEmpleadoSolicitud] = useState('');

  // Add back the loadMovimientos function
  const loadMovimientos = async () => {
    setIsLoading(true); // Set loading at the start
    try {
      const data = await getMovimientos();
      setMovimientos(data);
      setFilteredMovimientos(data);
    } catch (error) {
      console.error('Error al cargar movimientos:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los movimientos'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add back the loadEmpleados function
  const loadEmpleados = async () => {
    try {
      const data = await getEmpleadosActivos();
      setEmpleados(data);
    } catch (error) {
      console.error('Error loading empleados:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los empleados'
      });
    }
  };

  // Add back the useEffects
  useEffect(() => {
    loadMovimientos();
    loadEmpleados();
    loadMaterials();
  }, []);

  const handleSearch = (event) => {
    const searchTerm = event.target.value.toLowerCase();
    setSearchTerm(searchTerm);
    
    const filtered = movimientos.filter(movimiento =>
      movimiento.nombre.toLowerCase().includes(searchTerm) ||
      movimiento.codigo.toLowerCase().includes(searchTerm) ||
      movimiento.tipo_movimiento.toLowerCase().includes(searchTerm) ||
      (movimiento.empleado?.nombre || '').toLowerCase().includes(searchTerm)
    );
    
    setFilteredMovimientos(filtered);
  };

  const handleMaterialChange = (event) => {
    const selectedId = event.target.value;
    setSelectedMaterial(selectedId);
    
    const material = materials.find(m => m.id_material === selectedId);
    if (material) {
      const currentStock = material.stock_actual || material.Stock_actual;
      const minStock = material.stock_minimo || material.Stock_minimo;
      
      setStockActual(currentStock);
      setStockMinimo(minStock);
      
      // Check if stock is low and show alert
      if (currentStock <= minStock) {
        Swal.fire({
          icon: 'warning',
          title: 'Material Bajo',
          text: `¡Alerta! El material "${material.nombre}" tiene stock insuficiente.\nStock Actual: ${currentStock}\nStock Mínimo: ${minStock}`,
          confirmButtonColor: '#f0ad4e',
          confirmButtonText: 'Entendido'
        });
      }
    } else {
      setStockActual(0);
      setStockMinimo(0);
    }
  };

  const handleStockActualChange = async (event) => {
    const newValue = parseInt(event.target.value);
    const currentStock = stockActual;
    
    if (newValue <= currentStock && newValue >= 0) {
      try {
        await updateMaterialStock(selectedMaterial, newValue);
        setStockActual(newValue);
        loadMaterials();
      } catch (error) {
        console.error('Error updating stock:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo actualizar el stock'
        });
      }
    }
  };

  // Return statement should contain all JSX
  // Agregar el handler que falta
  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
  };
  
  const handleEmpleadoChange = (event) => {
    setSelectedEmpleado(event.target.value);
  };

  const handleCantidadChange = (event) => {
    // Allow only numbers
    const value = event.target.value.replace(/[^0-9]/g, '');
    // Convert to number for comparison, default to 0 if empty
    const numericValue = value === '' ? 0 : parseInt(value);
    
    setCantidad(value); // Store as string to maintain leading zeros
    setIsStockInsuficiente(numericValue > stockActual);
    
    if (numericValue > stockActual) {
      Swal.fire({
        icon: 'warning',
        title: 'Stock Insuficiente',
        text: `La cantidad máxima disponible es ${stockActual}`,
        showConfirmButton: false,
        timer: 2000
      });
    }
  };

  // Add the handleCreateMovimiento function here
  // Corregir la función handleCreateMovimiento
  const handleCreateMovimiento = async () => {
    if (!selectedMaterial || !selectedEmpleado || !cantidad || parseInt(cantidad) <= 0 || !comentario.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos Incompletos',
        text: !comentario.trim() ? 'Por favor ingrese un comentario' : 'Por favor complete todos los campos requeridos'
      });
      return;
    }

    if (isStockInsuficiente) {
      Swal.fire({
        icon: 'error',
        title: 'Stock Insuficiente',
        text: 'La cantidad excede el stock disponible'
      });
      return;
    }

    try {
      // Obtener el material seleccionado
      const materialSeleccionado = materials.find(m => m.id_material === selectedMaterial);
      if (!materialSeleccionado) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Material no encontrado'
        });
        return;
      }

      // Calcular el nuevo stock después de la salida
      const cantidadNumerica = parseInt(cantidad);
      const nuevoStock = stockActual - cantidadNumerica;
      
      // PASO 1: Actualizar el stock del material en la base de datos
      console.log(`Actualizando stock del material ${selectedMaterial} de ${stockActual} a ${nuevoStock}`);
      
      try {
        // Usar la función updateMaterialStock en lugar de fetch directo
        await updateMaterialStock(selectedMaterial, nuevoStock);
        console.log('Stock actualizado correctamente');
      } catch (updateError) {
        console.error('Error al actualizar stock:', updateError);
        throw new Error('No se pudo actualizar el stock del material');
      }
      
      // PASO 2: Crear el registro de movimiento
      const movimientoData = {
        id_material: selectedMaterial,
        codigo: materialSeleccionado.codigo,
        nombre: materialSeleccionado.nombre,
        tipo_movimiento: 'salida',
        cantidad: cantidadNumerica, // Add this line
        Stock_actual: nuevoStock,
        Stock_minimo: materialSeleccionado.stock_minimo || materialSeleccionado.Stock_minimo,
        comentario: comentario.trim(),
        id_empleado: selectedEmpleado
      };

      console.log('Enviando datos de movimiento:', movimientoData);
      
      // Crear el movimiento
      await createMovimiento(movimientoData);
      
      // Recargar los datos
      await loadMovimientos();
      await loadMaterials();
      
      // Resetear formulario
      setSelectedMaterial('');
      setCantidad('');
      setComentario('');
      setSelectedEmpleado('');
      setStockActual(0);
      setStockMinimo(0);

      Swal.fire({
        icon: 'success',
        title: 'Movimiento Creado',
        text: 'El movimiento de salida ha sido registrado correctamente'
      });
    } catch (error) {
      console.error('Error en la operación:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo completar la operación: ' + (error.message || 'Error al actualizar el stock del material')
      });
    }
  };

  // Agregar la función handleSolicitarMaterial aquí
  // Modificar la función handleSolicitarMaterial para eliminar el campo departamento
  const handleSolicitarMaterial = async () => {
    try {
      const selectedMaterial = materials.find(m => m.id_material === solicitudMaterial);
      
      if (!selectedMaterial) {
        throw new Error('Material no encontrado');
      }

      // Crear datos del movimiento sin incluir el campo departamento
      const movimientoData = {
        id_material: solicitudMaterial,
        tipo_movimiento: 'solicitud',
        cantidad: parseInt(cantidadSolicitada),
        comentario: comentarioSolicitud,
        id_empleado: selectedEmpleadoSolicitud || user.id_empleado, // Usar empleado seleccionado o usuario actual
        Stock_actual: selectedMaterial.stock_actual || selectedMaterial.Stock_actual,
        Stock_minimo: selectedMaterial.stock_minimo || selectedMaterial.Stock_minimo,
        nombre: selectedMaterial.nombre,
        codigo: selectedMaterial.codigo
      };

      console.log('Datos a enviar:', movimientoData);
      await createMovimiento(movimientoData);
      
      // Limpiar formulario y recargar datos
      setSolicitudMaterial('');
      setCantidadSolicitada('');
      setComentarioSolicitud('');
      setDepartamentoSolicitud(''); // Seguimos reseteando esto para el formulario
      setSelectedEmpleadoSolicitud('');
      await loadMovimientos();
      
      Swal.fire({
        icon: 'success',
        title: 'Solicitud Creada',
        text: 'La solicitud ha sido enviada correctamente'
      });
    } catch (error) {
      console.error('Error completo:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo crear la solicitud: ' + error.message
      });
    };
  };

  const handleAprobarSolicitud = async (movimiento) => {
    try {
      // Get the current material data
      const material = materials.find(m => m.id_material === movimiento.id_material);
      if (!material) {
        throw new Error('Material no encontrado');
      }
  
      // Calculate new stock
      const stockActual = material.stock_actual || material.Stock_actual;
      const nuevoStock = stockActual - movimiento.cantidad;
      if (nuevoStock < 0) {
        throw new Error('Stock insuficiente para aprobar la solicitud');
      }
  
      // Create the output movement
      const movimientoSalida = {
        id_material: movimiento.id_material,
        tipo_movimiento: 'salida',
        cantidad: movimiento.cantidad,
        comentario: `Aprobación de solicitud: ${movimiento.comentario}`,
        id_empleado: movimiento.id_empleado,
        Stock_actual: nuevoStock,
        Stock_minimo: material.stock_minimo || material.Stock_minimo,
        nombre: material.nombre,
        codigo: material.codigo,
        solicitud: `${movimiento.id_movimiento}`
      };
  
      // Update material stock
      await updateMaterialStock(movimiento.id_material, nuevoStock);
      
      // Create output movement
      await createMovimiento(movimientoSalida);
      
      // Update the local state to show the approval immediately
      const updatedMovimientos = movimientos.map(m => 
        m.id_movimiento === movimiento.id_movimiento 
          ? { ...m, estado: 'aprobado' } 
          : m
      );
      setMovimientos(updatedMovimientos);
      setFilteredMovimientos(
        filteredMovimientos.map(m => 
          m.id_movimiento === movimiento.id_movimiento 
            ? { ...m, estado: 'aprobado' } 
            : m
        )
      );
      
      // Reload data
      await loadMovimientos();
      await loadMaterials();
  
      Swal.fire({
        icon: 'success',
        title: 'Solicitud Aprobada',
        text: 'La solicitud ha sido aprobada y el material ha sido asignado'
      });
    } catch (error) {
      console.error('Error al aprobar solicitud:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo aprobar la solicitud'
      });
    };
  };

  const handleRechazarSolicitud = async (movimiento) => {
    try {
      await updateMovimientoEstado(movimiento.id_movimiento, 'rechazado');
      
      // Update the local state to show the rejection immediately
      const updatedMovimientos = movimientos.map(m => 
        m.id_movimiento === movimiento.id_movimiento 
          ? { ...m, estado: 'rechazado' } 
          : m
      );
      setMovimientos(updatedMovimientos);
      setFilteredMovimientos(
        filteredMovimientos.map(m => 
          m.id_movimiento === movimiento.id_movimiento 
            ? { ...m, estado: 'rechazado' } 
            : m
        )
      );
      
      await loadMovimientos();

      Swal.fire({
        icon: 'info',
        title: 'Solicitud Rechazada',
        text: 'La solicitud ha sido rechazada'
      });
    } catch (error) {
      console.error('Error al rechazar solicitud:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo rechazar la solicitud'
      });
    }
  }; 

  return (
    <Box sx={{ 
      flexGrow: 1,
      p: 2,
      backgroundColor: '#f8f9fa',
      minHeight: '100vh',
      maxWidth: '100%',  // Add this
      overflow: 'hidden' // Add this
    }}>
       <Paper sx={{ 
        p: 3, 
        borderRadius: 2,
        backgroundColor: 'white',
        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
        overflow: 'auto'
      }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#1976d2'}}>
          Historial de Movimientos
        </Typography>
        
        {/* Mostrar interfaz según el rol */}
        {user.role === 'admin' ? (
          // Interfaz para administradores - con todas las funcionalidades
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Seleccionar Material</InputLabel>
                <Select
                  value={selectedMaterial}
                  onChange={handleMaterialChange}
                  label="Seleccionar Material"
                  renderValue={(selected) => {
                    const material = materials.find(m => m.id_material === selected);
                    return material ? material.nombre : 'Sin seleccionar';
                  }}
                >
                  <MenuItem value="" sx={{ fontStyle: 'italic' }}>
                    <em>Sin seleccionar</em>
                  </MenuItem>
                  {materials.map((material) => (
                    <MenuItem key={material.id_material} value={material.id_material} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {material.imagen_url && (
                        <img
                          src={`${API_IMAGE_URL}${material.imagen_url.split('/').pop()}`}
                          alt={material.nombre}
                          style={{ 
                            width: 40, 
                            height: 40, 
                            objectFit: 'contain',
                            borderRadius: '4px'
                          }}
                        />
                      )}
                      <span>{material.nombre}</span>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {/* Remove the state declarations from here */}
            <Grid item xs={12} md={1}>
              <TextField
                label="Cantidad"
                // Change from type="number" to type="text"
                type="text"
                value={cantidad}
                onChange={handleCantidadChange}
                fullWidth
                error={isStockInsuficiente}
                helperText={isStockInsuficiente ? "Stock insuficiente" : ""}
                // Remove InputProps min and max constraints
                InputProps={{
                  inputProps: { 
                    pattern: "[0-9]*"  // Only allow numeric input
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={1}>
              <TextField
                label="Stock Actual"
                value={stockActual}
                disabled
                fullWidth
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={12} md={1}>
              <TextField
                label="Stock Mínimo"
                value={stockMinimo}
                disabled
                fullWidth
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Seleccionar Empleado</InputLabel>
                <Select
                  value={selectedEmpleado}
                  onChange={handleEmpleadoChange}
                  label="Seleccionar Empleado"
                  renderValue={(selected) => {
                    const empleado = empleados.find(e => e.id_empleado === selected);
                    return empleado ? `${empleado.codigo_empleado} - ${empleado.nombre} ${empleado.apellido}` : 'Sin seleccionar';
                  }}
                >
                  <MenuItem value="" sx={{ fontStyle: 'italic' }}>
                    <em>Sin seleccionar</em>
                  </MenuItem>
                  {empleados.map((empleado) => (
                    <MenuItem key={empleado.id_empleado} value={empleado.id_empleado}>
                      <span>{`${empleado.codigo_empleado} - ${empleado.nombre} ${empleado.apellido}`}</span>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={esLocale}>
                <DatePicker
                  label="Fecha"
                  value={selectedDate}
                  onChange={handleDateChange}
                  format="dd/MM/yyyy"
                  sx={{ width: '100%' }}
                  slotProps={{
                    textField: {
                      variant: "outlined",
                      fullWidth: true
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            {/* Add new TextField for comments */}
            <Grid item xs={12} md={5}>
              <TextField
                label="Comentario"
                multiline
                rows={2}
                fullWidth
                placeholder="Ingrese un comentario sobre el movimiento..."
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
              />
            </Grid>
            <Grid item xs={9}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Buscar por código, nombre, tipo de movimiento..."
                value={searchTerm}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            {/* Add Create Button */}
            <Grid item xs={3}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                sx={{ 
                  height: '56px',
                  backgroundColor: '#1976d2',
                  '&:hover': {
                    backgroundColor: '#115293'
                  }
                }}
                onClick={handleCreateMovimiento}
                disabled={!selectedMaterial || !selectedEmpleado || !cantidad || isStockInsuficiente || !comentario.trim()}
              >
                Crear Movimiento
              </Button>
            </Grid>
          </Grid>
        ) : (
          // Interfaz para usuarios normales - búsqueda y solicitud de material
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 3, mb: 2, color: '#555' }}>
                Solicitar Material
              </Typography>
            </Grid>

            {/* Añadir campo de búsqueda para usuarios */}
            <Grid item xs={12} md={12} sx={{ mb: 2 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Buscar material por código o nombre..."
                value={searchTerm}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Seleccionar Material</InputLabel>
                <Select
                  value={solicitudMaterial}
                  onChange={(e) => setSolicitudMaterial(e.target.value)}
                  label="Seleccionar Material"
                >
                  <MenuItem value="" sx={{ fontStyle: 'italic' }}>
                    <em>Sin seleccionar</em>
                  </MenuItem>
                  {materials.map((material) => (
                    <MenuItem key={material.id_material} value={material.id_material}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {material.imagen_url && (
                          <img
                            src={`${API_IMAGE_URL}${material.imagen_url.split('/').pop()}`}
                            alt={material.nombre}
                            style={{ 
                              width: 40, 
                              height: 40, 
                              objectFit: 'contain',
                              borderRadius: '4px'
                            }}
                          />
                        )}
                        <span>{material.nombre}</span>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={1}>
              <TextField
                label="Cantidad"
                type="text"
                value={cantidadSolicitada}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setCantidadSolicitada(value);
                }}
                fullWidth
                InputProps={{
                  inputProps: { 
                    pattern: "[0-9]*"
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Departamento</InputLabel>
                <Select
                  value={departamentoSolicitud}
                  onChange={(e) => setDepartamentoSolicitud(e.target.value)}
                  label="Departamento"
                >
                  <MenuItem value="Produccion">Producción</MenuItem>
                  <MenuItem value="Almacen">Almacén</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Seleccionar Empleado</InputLabel>
                <Select
                  value={selectedEmpleadoSolicitud}
                  onChange={(e) => setSelectedEmpleadoSolicitud(e.target.value)}
                  label="Seleccionar Empleado"
                >
                  <MenuItem value="" sx={{ fontStyle: 'italic' }}>
                    <em>Sin seleccionar</em>
                  </MenuItem>
                  {empleados.map((empleado) => (
                    <MenuItem key={empleado.id_empleado} value={empleado.id_empleado}>
                      <span>{`${empleado.codigo_empleado} - ${empleado.nombre} ${empleado.apellido}`}</span>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                label="Motivo de Solicitud"
                multiline
                rows={2}
                fullWidth
                placeholder="Explique por qué necesita este material..."
                value={comentarioSolicitud}
                onChange={(e) => setComentarioSolicitud(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                sx={{ 
                  height: '56px',
                  backgroundColor: '#1976d2',
                  '&:hover': {
                    backgroundColor: '#115293'
                  }
                }}
                onClick={handleSolicitarMaterial}
                disabled={!solicitudMaterial || !cantidadSolicitada || !comentarioSolicitud.trim() || !departamentoSolicitud || !selectedEmpleadoSolicitud}
              >
                Enviar Solicitud
              </Button>
            </Grid>
          </Grid>
        )}

        {user.role === 'admin' && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={<PreviewIcon />}
              onClick={handlePreviewExport}
              sx={{ 
                borderColor: '#2196f3', 
                color: '#2196f3',
                '&:hover': {
                  backgroundColor: 'rgba(33, 150, 243, 0.04)',
                  borderColor: '#1976d2'
                }
              }}
            >
              Vista Previa Exportación
            </Button>
          </Box>
        )}
        
        {/* La tabla de movimientos se muestra para todos los roles */}
        <Box sx={{ 
          width: '100%', 
          display: 'flex', 
          justifyContent: 'center',
          mt: 2,
          mx: 'auto',
          position: 'relative'
        }}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Código</TableCell>
                  <TableCell>Material</TableCell>
                  <TableCell>Tipo Movimiento</TableCell>
                  <TableCell>Cantidad</TableCell>
                  <TableCell>Stock Actual</TableCell>
                  <TableCell>Stock Mínimo</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Empleado</TableCell>
                  <TableCell>Departamento</TableCell>
                  <TableCell>Comentario</TableCell>
                  {user.role === 'admin' && <TableCell>Acciones</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={user.role === 'admin' ? 12 : 11} align="center">
                      Cargando...
                    </TableCell>
                  </TableRow>
                ) : filteredMovimientos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={user.role === 'admin' ? 12 : 11} align="center">
                      No hay movimientos para mostrar
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMovimientos.map((movimiento) => (
                    <TableRow key={movimiento.id_movimiento}>
                      <TableCell>{new Date(movimiento.fecha).toLocaleDateString()}</TableCell>
                      <TableCell>{movimiento.codigo}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          {movimiento.material?.imagen_url && (
                            <img
                              src={movimiento.material.imagen_url}
                              alt={movimiento.nombre}
                              style={{ 
                                width: 40, 
                                height: 40, 
                                objectFit: 'contain',
                                borderRadius: '4px'
                              }}
                              onError={(e) => {
                                console.error('Error al cargar imagen:', e.target.src);
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                          <span>{movimiento.nombre}</span>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={movimiento.tipo_movimiento}
                          color={
                            movimiento.tipo_movimiento.toLowerCase() === 'entrada' 
                              ? 'success' 
                              : movimiento.tipo_movimiento.toLowerCase() === 'solicitud'
                              ? 'warning'
                              : 'error'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{movimiento.cantidad || '-'}</TableCell>
                      <TableCell>{movimiento.Stock_actual}</TableCell>
                      <TableCell>{movimiento.Stock_minimo}</TableCell>
                      <TableCell>
                        {movimiento.Stock_actual <= movimiento.Stock_minimo && (
                          <Tooltip title="Stock Bajo" arrow>
                            <WarningIcon sx={{ color: '#ff9800' }} />
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell>{movimiento.empleado ? `${movimiento.empleado.nombre} ${movimiento.empleado.apellido}` : 'N/A'}</TableCell>
                      <TableCell>{movimiento.empleado?.departamento || 'N/A'}</TableCell>
                      <TableCell>{movimiento.comentario || '-'}</TableCell>
                      {user.role === 'admin' && (
                        <TableCell>
                          {movimiento.tipo_movimiento.toLowerCase() === 'solicitud' && (
                            <>
                              {movimiento.estado === 'aprobado' ? (
                                <Tooltip title="Solicitud Aprobada" arrow>
                                  <Chip
                                    icon={<CheckCircleIcon />}
                                    label="Aprobado"
                                    color="success"
                                    size="small"
                                  />
                                </Tooltip>
                              ) : movimiento.estado === 'rechazado' ? (
                                <Tooltip title="Solicitud Rechazada" arrow>
                                  <Chip
                                    icon={<CancelIcon />}
                                    label="Rechazado"
                                    color="error"
                                    size="small"
                                  />
                                </Tooltip>
                              ) : (
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="success"
                                    onClick={() => handleAprobarSolicitud(movimiento)}
                                  >
                                    Aprobar
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="error"
                                    onClick={() => handleRechazarSolicitud(movimiento)}
                                  >
                                    Rechazar
                                  </Button>
                                </Box>
                              )}
                            </>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
        {/* Añadir el componente de diálogo de vista previa */}
        <ExportPreviewDialog
          open={previewOpen}
          onClose={handleClosePreview}
          data={previewData}
          onExportExcel={handleExportToExcel}
          onExportPDF={handleExportToPDF}
        />
      </Paper>
    </Box>
  );
};

export default MovimientosList;