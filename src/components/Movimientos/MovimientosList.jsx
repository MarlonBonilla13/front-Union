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
  InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { getMovimientos } from '../../services/movimientoService';
import Swal from 'sweetalert2';
import { Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { getMaterials, updateMaterialStock } from '../../services/materialService';
import { API_IMAGE_URL } from '../../config/config';
import { Grid } from '@mui/material'; // Actualizar imports

// Añadir import
import { getEmpleadosActivos } from '../../services/empleadoService';

// Add new import for date handling
// Update imports at the top
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import esLocale from 'date-fns/locale/es';

const MovimientosList = () => {
  // Keep all state declarations at the top
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

  const loadMaterials = async () => {
    try {
      const data = await getMaterials();
      setMaterials(data);
    } catch (error) {
      console.error('Error loading materials:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Could not load materials'
      });
    }
  };

  // Add back the loadMovimientos function
  const loadMovimientos = async () => {
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
      setStockActual(material.stock_actual || material.Stock_actual); // Handle both cases
      setStockMinimo(material.stock_minimo || material.Stock_minimo); // Handle both cases
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
        width: '-100%',
        overflow: 'auto'  // Add this
      }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#1976d2'}}>
          Historial de Movimientos
        </Typography>
        
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
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Stock Actual"
              type="number"
              value={stockActual}
              onChange={handleStockActualChange}
              disabled={!selectedMaterial}
              InputProps={{
                inputProps: { 
                  max: stockActual,
                  min: 0
                }
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Stock Mínimo"
              type="number"
              value={stockMinimo}
              disabled={true}
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
          <Grid item xs={12}>
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
          </Grid>
    
          {/* Add the table section */}
              <Box sx={{ 
                width: '100%', 
                display: 'flex', 
                justifyContent: 'center',
                mt: 2,
                mx: 'auto',
                position: 'relative'
              }}>
                <TableContainer 
                  component={Paper} 
                  elevation={0}
                  sx={{ 
                    width: '100%',
                    maxWidth: '100%',
                    borderRadius: '8px',
                    border: '1px solid rgba(224, 224, 224, 1)',
                    boxShadow: 'none',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      borderRadius: '8px',
                      border: '1px solid rgba(224, 224, 224, 1)',
                      pointerEvents: 'none'
                    }
                  }}
                >
                  <Table sx={{ 
                    minWidth: 650,
                    borderCollapse: 'separate',
                    borderSpacing: 0
                  }}>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Código</TableCell>
                        <TableCell>Material</TableCell>
                        <TableCell>Tipo Movimiento</TableCell>
                        <TableCell>Stock Actual</TableCell>
                        <TableCell>Stock Mínimo</TableCell>
                        <TableCell>Empleado</TableCell>
                        <TableCell>Comentario</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {!isLoading && filteredMovimientos.map((movimiento) => (
                        <TableRow key={movimiento.id_movimiento}>
                          <TableCell>{new Date(movimiento.fecha).toLocaleDateString()}</TableCell>
                          <TableCell>{movimiento.codigo}</TableCell>
                          <TableCell>{movimiento.nombre}</TableCell>
                          <TableCell>
                            <Chip
                              label={movimiento.tipo_movimiento}
                              color={movimiento.tipo_movimiento.toLowerCase() === 'entrada' ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{movimiento.Stock_actual}</TableCell>
                          <TableCell>{movimiento.Stock_minimo}</TableCell>
                          <TableCell>{movimiento.empleado?.nombre || 'N/A'}</TableCell>
                          <TableCell>{movimiento.comentario || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Paper>
          </Box>
        );
  };


export default MovimientosList;