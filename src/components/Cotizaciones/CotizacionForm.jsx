import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Container
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate, useParams } from 'react-router-dom';
import { getClientes } from '../../services/clienteService';
import { getMaterials } from '../../services/materialService';
import { createCotizacion, getCotizacionById, updateCotizacion } from '../../services/cotizacionService';
import { API_IMAGE_URL } from '../../config/config';
import Swal from 'sweetalert2';

const CotizacionForm = ({ isNew = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [formData, setFormData] = useState({
    clienteId: '',
    nombreComercial: '',
    direccion: '',
    telefono: '',
    fecha_cotizacion: new Date().toISOString().split('T')[0],
    validez: 30, // Valor por defecto de 30 días
    items: [],
    observaciones: '',
    subtotal: 0,
    descuento: 0,
    impuestos: 0,
    total: 0,
    estado: true
  });

  useEffect(() => {
    const inicializarDatos = async () => {
      await cargarDatos();
      if (!isNew && id) {
        await cargarCotizacion();
      }
    };
    inicializarDatos();
  }, [id, isNew]);

  const cargarDatos = async () => {
    try {
      const [clientesData, materialesData] = await Promise.all([
        getClientes(),
        getMaterials()
      ]);
      console.log('Materiales cargados:', materialesData); // Para debugging
      setClientes(clientesData);
      setMateriales(materialesData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      Swal.fire({
        title: 'Error',
        text: 'Error al cargar los datos iniciales',
        icon: 'error'
      });
    }
  };

  const cargarCotizacion = async () => {
    try {
      const cotizacion = await getCotizacionById(id);
      setFormData(cotizacion);
    } catch (error) {
      console.error('Error al cargar cotización:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo cargar la cotización',
        icon: 'error'
      });
    }
  };

  const agregarItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { materialId: '', cantidad: 1, precio: 0, subtotal: 0 }]
    }));
  };

  // Add this useEffect inside the component
useEffect(() => {
  console.log('Materiales actualizados:', materiales);
}, [materiales]);

  const eliminarItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calcularTotales = (items, descuento = formData.descuento) => {
    const subtotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const descuentoAmount = (subtotal * (descuento / 100)) || 0;
    const baseImponible = subtotal - descuentoAmount;
    const impuestos = baseImponible * 0.12; // 12% de IVA
    const total = baseImponible + impuestos;

    return {
      subtotal,
      descuento,
      descuentoAmount,
      impuestos,
      total
    };
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    const item = updatedItems[index];
    
    if (field === 'materialId') {
      const material = materiales.find(m => m.id_material === parseInt(value));
      if (material) {
        item.materialId = value;
        item.precio = material.precio_unitario;
        item.subtotal = item.precio * item.cantidad;
      }
    } else if (field === 'cantidad') {
      item.cantidad = Math.max(1, parseInt(value) || 0);
      item.subtotal = item.precio * item.cantidad;
    }
    
    updatedItems[index] = item;
    const totales = calcularTotales(updatedItems);
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems,
      ...totales
    }));
  };

  const handleDescuentoChange = (e) => {
    const descuento = Math.min(100, Math.max(0, Number(e.target.value) || 0));
    const totales = calcularTotales(formData.items, descuento);
    setFormData(prev => ({
      ...prev,
      descuento,
      ...totales
    }));
  };

  // Add this function before the return statement
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;
    
    try {
      if (id) {
        await updateCotizacion(id, formData);
      } else {
        await createCotizacion(formData);
      }
      
      Swal.fire({
        title: '¡Éxito!',
        text: `Cotización ${id ? 'actualizada' : 'creada'} correctamente`,
        icon: 'success'
      });
      navigate('/cotizaciones');
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: `No se pudo ${id ? 'actualizar' : 'crear'} la cotización`,
        icon: 'error'
      });
    }
  };

  return (
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h5" gutterBottom color="primary" fontWeight={600}>
            {id ? 'Editar Cotización' : 'Nueva Cotización'}
          </Typography>
          
          <Grid container spacing={3}>
            {/* Primera fila */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Cliente</InputLabel>
                <Select
                  value={formData.clienteId || ''}
                  onChange={(e) => {
                    const clienteSeleccionado = clientes.find(c => c.id_cliente === e.target.value);
                    setFormData({
                      ...formData,
                      clienteId: e.target.value,
                      nombreComercial: clienteSeleccionado?.nombre_comercial || '',
                      direccion: clienteSeleccionado?.direccion || '',
                      telefono: clienteSeleccionado?.telefono || ''
                    });
                  }}
                  label="Cliente"
                >
                  <MenuItem value="" disabled>Seleccione un cliente</MenuItem>
                  {clientes.map(cliente => (
                    <MenuItem key={cliente.id_cliente} value={cliente.id_cliente}>
                      {`${cliente.nombre} ${cliente.apellido}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Segunda fila */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Fecha de Cotización"
                value={formData.fecha_cotizacion}
                onChange={(e) => setFormData({...formData, fecha_cotizacion: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Tercera fila */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Nombre Comercial"
                value={formData.nombreComercial}
                disabled
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Dirección"
                value={formData.direccion}
                disabled
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Teléfono"
                value={formData.telefono}
                disabled
              />
            </Grid>

            {/* Cuarta fila */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Validez (días)"
                value={formData.validez}
                onChange={(e) => setFormData({...formData, validez: Math.max(1, parseInt(e.target.value) || 0)})}
                inputProps={{ min: 1 }}
              />
            </Grid>

            {/* Tabla de materiales */}
            <Grid item xs={12}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={agregarItem}
                sx={{ mb: 2 }}
              >
                Agregar Material
              </Button>

              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Material</TableCell>
                      <TableCell>Cantidad</TableCell>
                      <TableCell>Precio Unitario</TableCell>
                      <TableCell>Subtotal</TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <FormControl fullWidth>
                            <Select
                              value={item.materialId || ''}
                              onChange={(e) => handleItemChange(index, 'materialId', e.target.value)}
                            >
                              <MenuItem value="" disabled>Seleccione un material</MenuItem>
                              {materiales.map(material => (
                                <MenuItem key={material.id_material} value={material.id_material}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    {material.imagen_url ? (
                                      <Box
                                        component="img"
                                        src={`${API_IMAGE_URL}${material.imagen_url.split('/').pop()}`}
                                        alt={material.nombre}
                                        sx={{
                                          width: 40,
                                          height: 40,
                                          objectFit: 'contain',
                                          borderRadius: 1
                                        }}
                                      />
                                    ) : (
                                      <Box
                                        sx={{
                                          width: 40,
                                          height: 40,
                                          bgcolor: 'grey.200',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          borderRadius: 1,
                                          fontSize: '0.75rem'
                                        }}
                                      >
                                        No img
                                      </Box>
                                    )}
                                    <Typography>
                                      {material.nombre}
                                    </Typography>
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={item.cantidad}
                            onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)}
                            inputProps={{ min: 1 }}
                          />
                        </TableCell>
                        <TableCell>
                          {new Intl.NumberFormat('es-GT', {
                            style: 'currency',
                            currency: 'GTQ'
                          }).format(item.precio || 0)}
                        </TableCell>
                        <TableCell>
                          {new Intl.NumberFormat('es-GT', {
                            style: 'currency',
                            currency: 'GTQ'
                          }).format(item.subtotal || 0)}
                        </TableCell>
                        <TableCell>
                          <IconButton onClick={() => eliminarItem(index)} color="error">
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Observaciones - Movido aquí */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Observaciones"
                    value={formData.observaciones}
                    onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                  />
                </Grid>

                {/* Sección de totales - Ajustada al lado derecho */}
                <Grid item xs={12} md={4}>
                  <Paper elevation={2} sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography>Subtotal:</Typography>
                          <Typography>
                            {new Intl.NumberFormat('es-GT', {
                              style: 'currency',
                              currency: 'GTQ'
                            }).format(formData.subtotal)}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography sx={{ mr: 2 }}>Descuento:</Typography>
                          <TextField
                            size="small"
                            type="number"
                            value={formData.descuento}
                            onChange={handleDescuentoChange}
                            inputProps={{ min: 0, max: 100 }}
                            sx={{ width: '100px' }}
                          />
                          <Typography sx={{ ml: 1 }}>%</Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography>Monto Descuento:</Typography>
                          <Typography color="error">
                            -{new Intl.NumberFormat('es-GT', {
                              style: 'currency',
                              currency: 'GTQ'
                            }).format(formData.descuentoAmount || 0)}
                          </Typography>
                        </Box>
                        
                        <Divider sx={{ my: 1 }} />
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography>IVA (12%):</Typography>
                          <Typography>
                            {new Intl.NumberFormat('es-GT', {
                              style: 'currency',
                              currency: 'GTQ'
                            }).format(formData.impuestos)}
                          </Typography>
                        </Box>
                        
                        <Divider sx={{ my: 1 }} />
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="h6" fontWeight="bold">Total:</Typography>
                          <Typography variant="h6" fontWeight="bold">
                            {new Intl.NumberFormat('es-GT', {
                              style: 'currency',
                              currency: 'GTQ'
                            }).format(formData.total)}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>

              {/* Botón de guardar */}
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  onClick={handleSubmit}
                >
                  {id ? 'Actualizar Cotización' : 'Crear Cotización'}
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Paper>
  );
};

export default CotizacionForm;