import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Grid,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,  // Agregar esta importación
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';  // Agregar esta importación
import { getClientes, getClienteById } from '../../services/clienteService';
import { getMaterials, getMaterialById } from '../../services/materialService';
import { createCotizacion, getCotizacionById, updateCotizacion } from '../../services/cotizacionService';
import { API_IMAGE_URL } from '../../config/config';
import Swal from 'sweetalert2';
import CircularProgress from '@mui/material/CircularProgress';
import { toast } from 'react-hot-toast';

// Importamos el servicio de usuario
import { getUserById } from '../../services/userService';

const CotizacionForm = ({ isNew = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null); // Add this line
  const [formData, setFormData] = useState({
    clienteId: '',
    nombreComercial: '',
    direccion: '',
    telefono: '',
    fecha_cotizacion: new Date().toISOString().split('T')[0],
    validez: 0,
    items: [],
    observaciones: '',
    subtotal: 0,
    descuento: 0,
    impuestos: 0,
    total: 0,
    estado: true,
    costo_mano_obra: 0,
    // New fields
    asunto_cotizacion: '',
    trabajo_realizar: '',
    condiciones_adicionales: '',
    tiempo_trabajo: '',
    condicion_pago: ''
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

  // Añadir este useEffect para verificar cuando los materiales se cargan
  useEffect(() => {
    if (materiales.length > 0 && formData.items.length > 0) {
      console.log('Materiales disponibles:', materiales);
      console.log('Items en formData:', formData.items);
      
      // Verificar si los materiales de los items existen en la lista de materiales
      formData.items.forEach(item => {
        const materialEncontrado = materiales.find(m => m.id_material == item.materialId);
        console.log(`Material ID ${item.materialId} encontrado:`, materialEncontrado);
      });
    }
  }, [materiales, formData.items]);

  // Add this useEffect to monitor formData changes
  useEffect(() => {
    console.log('formData state updated:', formData);
  }, [formData]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

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
      console.log('Iniciando carga de cotización:', id); // Debug
      const cotizacion = await getCotizacionById(id);
      console.log('Cotización completa:', cotizacion); // Debug detallado
    
      if (!cotizacion) {
        console.error('No se recibieron datos de la cotización');
        return;
      }
  
      // Asegurarnos de que los detalles sean un array
      const detalles = Array.isArray(cotizacion.detalles) ? cotizacion.detalles : [];
      console.log('Detalles a procesar:', detalles); // Debug
      
      // Extraer el costo de mano de obra - asumimos que es el mismo para todos los detalles
      let costoManoObra = 0;
      if (detalles.length > 0) {
        // Tomamos el valor del primer detalle, ya que debería ser el mismo para todos
        costoManoObra = parseFloat(detalles[0]?.costo_mano_obra || 0);
      }
      console.log('Costo mano de obra extraído:', costoManoObra); // Debug
  
      // Procesar los detalles y cargar los materiales
      const items = [];
      
      // Primero asegurarnos de que los materiales estén cargados
      if (materiales.length === 0) {
        const materialesData = await getMaterials();
        setMateriales(materialesData);
      }
      
      for (const detalle of detalles) {
        try {
          console.log('Procesando detalle:', detalle); // Debug
          
          // Asegurarnos de que tenemos todos los datos necesarios
          if (!detalle.id_material) {
            console.error('Detalle sin id_material:', detalle);
            continue;
          }
          
          // Buscar el material en la lista de materiales
          const materialId = parseInt(detalle.id_material);
          const materialEncontrado = materiales.find(m => m.id_material === materialId);
          
          console.log(`Material ID ${materialId} encontrado:`, materialEncontrado);
          
          items.push({
            materialId: materialId,
            cantidad: parseInt(detalle.cantidad),
            precio: parseFloat(detalle.precio_unitario),
            subtotal: parseFloat(detalle.subtotal),
            costo_mano_obra: parseFloat(detalle.costo_mano_obra || 0) // Make sure to include costo_mano_obra in each item
          });
        } catch (error) {
          console.error('Error al procesar detalle:', error);
        }
      }
      
      console.log('Items procesados:', items); // Debug
  
      // Actualizar el cliente seleccionado
      let clienteInfo = null;
      if (cotizacion.id_cliente) {
        clienteInfo = await getClienteById(cotizacion.id_cliente);
        console.log('Cliente cargado:', clienteInfo); // Debug
        setClienteSeleccionado(clienteInfo);
      }
  
      // Use functional update for setFormData directly
      setFormData(prevData => {
        console.log('Actualizando formData con:', cotizacion);
        
        return {
          ...prevData,
          clienteId: cotizacion.id_cliente.toString(),
          nombreComercial: clienteInfo?.nombre_comercial || '',
          direccion: clienteInfo?.direccion || '',
          telefono: clienteInfo?.telefono || '',
          fecha_cotizacion: cotizacion.fecha_cotizacion ? new Date(cotizacion.fecha_cotizacion).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          validez: parseInt(cotizacion.validez) || 0,
          items: items,
          observaciones: cotizacion.observaciones || '',
          subtotal: parseFloat(cotizacion.subtotal) || 0,
          descuento: parseFloat(cotizacion.descuento) || 0,
          impuestos: parseFloat(cotizacion.impuestos) || 0,
          total: parseFloat(cotizacion.total) || 0,
          estado: cotizacion.estado === "activo",
          costo_mano_obra: costoManoObra,
          usuario_creacion: cotizacion.usuario_creacion,
          // Add these fields from the cotizacion object
          asunto_cotizacion: cotizacion.asunto_cotizacion || '',
          trabajo_realizar: cotizacion.trabajo_realizar || '',
          condiciones_adicionales: cotizacion.condiciones_adicionales || '',
          tiempo_trabajo: cotizacion.tiempo_trabajo || '',
          condicion_pago: cotizacion.condicion_pago || '',
          usuario_creacion_nombre: cotizacion.usuario_info ? 
            `${cotizacion.usuario_info.nombre} ${cotizacion.usuario_info.apellido}` : 
            'Usuario desconocido'
        };
      });

      console.log('setFormData called in cargarCotizacion'); // Debug
      setHasChanges(false); // Reiniciar el estado de cambios después de cargar

    } catch (error) {
      console.error('Error al cargar la cotización:', error);
      toast.error('Error al cargar la cotización');
    }
  };

  const agregarItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { 
        materialId: '', 
        cantidad: 1, 
        precio: 0, 
        subtotal: 0,
        costo_mano_obra: 0 // Inicializamos el costo de mano de obra
      }]
    }));
  };

  useEffect(() => {
    console.log('Materiales actualizados:', materiales);
  }, [materiales]);

  const eliminarItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calcularTotales = (items, descuento = formData.descuento, costoManoObra = formData.costo_mano_obra) => {
    const subtotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const descuentoAmount = (subtotal * (descuento / 100)) || 0;
    const baseImponible = subtotal - descuentoAmount + parseFloat(costoManoObra || 0);
    const impuestos = baseImponible * 0.12; // 12% de IVA
    const total = baseImponible + impuestos;

    return {
      subtotal,
      descuento,
      descuentoAmount,
      impuestos,
      total,
      costo_mano_obra: costoManoObra
    };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setHasChanges(true);
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    const item = updatedItems[index];
    
    if (field === 'materialId') {
      const material = materiales.find(m => m.id_material == value);
      console.log('Material seleccionado:', material);
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
    setHasChanges(true);

    console.log('Item actualizado:', item); // Para debug
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

  const handleManoObraChange = (e) => {
      const costoManoObra = parseFloat(e.target.value) || 0;
      console.log('handleManoObraChange - nuevo valor:', costoManoObra);
      
      // Update all items with the new mano de obra value
      const updatedItems = formData.items.map(item => ({
        ...item,
        costo_mano_obra: costoManoObra
      }));
      
      // Use functional update to ensure calculations are based on the latest state
      setFormData(prev => {
        const totales = calcularTotales(updatedItems, prev.descuento, costoManoObra);
        console.log('handleManoObraChange - nuevos totales:', totales);
        
        return {
          ...prev,
          items: updatedItems, // Update all items with the new cost
          costo_mano_obra: costoManoObra, // Update the cost first
          ...totales // Then update calculated totals based on the new cost
        };
      });
      console.log('Después de setFormData en handleManoObraChange - valor:', costoManoObra); // Nuevo log
      setHasChanges(true);
    };

  // En handleSubmit, agrega más logs
  // Make sure this function is defined before handleSubmit
  const validarFormulario = () => {
    const errores = {};
    
    // Validación de cliente
    if (!formData.clienteId) {
      errores.clienteId = 'Debe seleccionar un cliente';
    }

    // Validación de fecha
    if (!formData.fecha_cotizacion) {
      errores.fecha_cotizacion = 'La fecha es requerida';
    }

    // Validación de items
    if (formData.items.length === 0) {
      errores.items = 'Debe agregar al menos un item a la cotización';
    } else {
      formData.items.forEach((item, index) => {
        if (!item.materialId) {
          errores[`item_${index}_material`] = 'Debe seleccionar un material';
        }
        if (!item.cantidad || item.cantidad <= 0) {
          errores[`item_${index}_cantidad`] = 'La cantidad debe ser mayor a 0';
        }
      });
    }

    // Validación de totales
    if (formData.total <= 0) {
      errores.total = 'El total debe ser mayor a 0';
    }

    return errores;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errores = validarFormulario();
    if (Object.keys(errores).length > 0) {
      Swal.fire({
        title: 'Error de validación',
        html: Object.values(errores).join('<br>'),
        icon: 'error'
      });
      return;
    }

    // Asegurarnos de que el costo_mano_obra sea un número válido
    const costoManoObra = parseFloat(formData.costo_mano_obra || 0);
    console.log('Costo mano de obra a enviar (formData original):', formData.costo_mano_obra);
    console.log('Costo mano de obra a enviar (parseado):', costoManoObra);

    // Preparar los items con el formato correcto según la base de datos
    const items = formData.items.map(item => {
      // Asegurarnos de que el costo_mano_obra sea un número válido para cada item
      const itemCostoManoObra = costoManoObra;
      console.log(`Item para material ${item.materialId} - costo_mano_obra asignado:`, itemCostoManoObra);
      
      return {
        id_material: parseInt(item.materialId),
        cantidad: parseInt(item.cantidad),
        precio_unitario: parseFloat(item.precio),
        subtotal: parseFloat(item.subtotal),
        costo_mano_obra: itemCostoManoObra // Usar el valor global parseado y verificado
      };
    });

    console.log('Items a enviar con costo_mano_obra:', JSON.stringify(items, null, 2));

    // Estructura de la cotización según la base de datos
    // Inside handleSubmit function, update the cotizacionData object
    const cotizacionData = {
    id_cliente: parseInt(formData.clienteId),
    validez: parseInt(formData.validez),
    estado: "activo",
    subtotal: parseFloat(formData.subtotal),
    descuento: parseFloat(formData.descuento),
    impuestos: parseFloat(formData.impuestos),
    total: parseFloat(formData.total),
    observaciones: formData.observaciones || '',
    // Add these fields to be saved
    asunto_cotizacion: formData.asunto_cotizacion,
    trabajo_realizar: formData.trabajo_realizar,
    condiciones_adicionales: formData.condiciones_adicionales,
    tiempo_trabajo: formData.tiempo_trabajo,
    condicion_pago: formData.condicion_pago,
    usuario_creacion: 1,
    items
    };

    setLoading(true);
    let intentos = 0;
    
    const maxIntentos = 3;

    while (intentos < maxIntentos) {
      try {
        let resultado;
        if (id) {
          resultado = await updateCotizacion(id, cotizacionData);
          // Update the quotation's timestamp
          cotizacionData.fecha_cotizacion = new Date().toISOString();
        } else {
          resultado = await createCotizacion(cotizacionData);
        }
        
        console.log('Operación completada:', resultado);
        
        Swal.fire({
          title: '¡Éxito!',
          text: `Cotización ${id ? 'actualizada' : 'creada'} correctamente`,
          icon: 'success'
        });
        // Change sort parameter to descending order (newest first)
        navigate(`/cotizaciones?sort=desc&t=${Date.now()}`);
        return;
      } catch (error) {
        intentos++;
        if (intentos === maxIntentos) {
          console.error('Error detallado:', error);
          Swal.fire({
            title: 'Error',
            html: `No se pudo ${id ? 'actualizar' : 'crear'} la cotización.<br>
                   Error: ${error.response?.data?.message || error.message}`,
            icon: 'error'
          });
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    setLoading(false);
  };

  const confirmExit = async () => {
    if (!hasChanges) return true;
    
    const result = await Swal.fire({
      title: '¿Está seguro?',
      text: 'Tiene cambios sin guardar. ¿Desea salir de todos modos?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar'
    });
    
    return result.isConfirmed;
  };

  const handleNavigation = async (path) => {
    if (await confirmExit()) {
      navigate(path);
    }
  };

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ'
    }).format(valor);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h5" gutterBottom color="primary" fontWeight={600}>
        {id ? 'Editar Cotización' : 'Nueva Cotización'}
      </Typography>
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress />
        </Box>
      )}
      
      <Grid container spacing={3}>
        {/* Primera fila - Información básica */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Cliente</InputLabel>
            <Select
              value={formData?.clienteId || ''}
              onChange={(e) => {
                const clienteSeleccionado = clientes.find(c => c.id_cliente === e.target.value);
                setFormData(prev => ({
                  ...prev,
                  clienteId: e.target.value,
                  nombreComercial: clienteSeleccionado?.nombre_comercial || '',
                  direccion: clienteSeleccionado?.direccion || '',
                  telefono: clienteSeleccionado?.telefono || ''
                }));
              }}
              label="Cliente"
            >
              <MenuItem value="" disabled>Seleccione un cliente</MenuItem>
              {clientes?.map(cliente => (
                <MenuItem key={cliente.id_cliente} value={cliente.id_cliente}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography sx={{ color: 'text.primary', fontWeight: 500 }}>
                      {`${cliente.nombre} ${cliente.apellido}`}
                    </Typography>
                    {cliente.nombre_comercial && (
                      <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                        {cliente.nombre_comercial}
                      </Typography>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

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

        {/* Segunda fila - Detalles del cliente */}
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

        {/* Tercera fila - Validez */}
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

        {/* Sección de Materiales */}
        <Grid item xs={12}>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Material</TableCell>
                  <TableCell>Cantidad</TableCell>
                  <TableCell>Stock Disponible</TableCell>
                  <TableCell>Precio Unitario</TableCell>
                  <TableCell>Subtotal</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formData?.items?.map((item, index) => (
                  <TableRow key={index}>

                    <TableCell sx={{ minWidth: '300px', width: '30%' }}>
                      <FormControl fullWidth>
                        <InputLabel>Material</InputLabel>
                        <Select
                          value={item.materialId || ''}
                          onChange={(e) => handleItemChange(index, 'materialId', e.target.value)}
                          label="Material"
                          MenuProps={{
                            PaperProps: {
                              style: {
                                maxHeight: 300
                              }
                            }
                          }}
                        >
                          <MenuItem value="" disabled>Seleccione un material</MenuItem>            
                          {/* Campo de búsqueda */}
                          <Box sx={{ p: 1, position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1 }}>
                            <TextField
                              autoFocus
                              placeholder="Buscar por nombre o código..."
                              fullWidth
                              variant="outlined"
                              size="small"
                              onChange={(e) => {
                                const searchText = e.target.value.toLowerCase();
                                const filteredItems = document.querySelectorAll('.material-item');
                                filteredItems.forEach(item => {
                                  const itemText = item.getAttribute('data-search').toLowerCase();
                                  if (itemText.includes(searchText)) {
                                    item.style.display = '';
                                  } else {
                                    item.style.display = 'none';
                                  }
                                });
                              }}
                              onClick={(e) => e.stopPropagation()}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <SearchIcon />
                                  </InputAdornment>
                                ),
                              }}
                            />
                          </Box>

                          {/* Lista de materiales */}
                          {materiales?.map(material => (
                            <MenuItem 
                              key={material.id_material} 
                              value={material.id_material}
                              className="material-item"
                              data-search={`${material.nombre} ${material.codigo || ''}`}
                            >
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
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                  <Typography>{material.nombre}</Typography>
                                  <Typography 
                                    variant="caption" 
                                    sx={{ color: 'text.secondary', fontStyle: 'italic' }}
                                  >
                                    {material.codigo || 'Sin código'}
                                  </Typography>
                                </Box>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={item.cantidad || ''}
                        onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)}
                        inputProps={{ min: 1 }}
                      />
                    </TableCell>
                    <TableCell>
                      {item.materialId ? 
                        (() => {
                          const material = materiales.find(m => m.id_material == item.materialId);
                          return material ? 
                            <Typography 
                              color={material.stock_actual >= item.cantidad ? 'success.main' : 'error.main'}
                              fontWeight={500}
                            >
                              {material.stock_actual || 0}
                            </Typography> : 'N/A';
                        })() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {formatearMoneda(item.precio || 0)}
                    </TableCell>
                    <TableCell>
                      {formatearMoneda(item.subtotal || 0)}
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
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={agregarItem}
            >
              Agregar Material
            </Button>
          </Box>
        </Grid>

        {/* Observaciones */}
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

        {/* New Fields Section */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Asunto de la Cotización"
                name="asunto_cotizacion"
                value={formData.asunto_cotizacion}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Trabajo a Realizar"
                name="trabajo_realizar"
                value={formData.trabajo_realizar}
                onChange={handleChange}
                multiline
                rows={4}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Condiciones Adicionales"
                name="condiciones_adicionales"
                value={formData.condiciones_adicionales}
                onChange={handleChange}
                multiline
                rows={3}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tiempo de Trabajo"
                name="tiempo_trabajo"
                value={formData.tiempo_trabajo}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Condición de Pago</InputLabel>
                <Select
                  name="condicion_pago"
                  value={formData.condicion_pago}
                  onChange={handleChange}
                  label="Condición de Pago"
                  required
                >
                  <MenuItem value="Al crédito con efectivo">Al crédito </MenuItem>
                  <MenuItem value="Al contado con efectivo">Al contado con efectivo</MenuItem>
                  <MenuItem value="Al contado con tarjeta">Al contado con tarjeta</MenuItem>
                  <MenuItem value="Transferencia Bancaria">Transferencia Bancaria</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Grid>

        {/* Sección de totales */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Subtotal:</Typography>
                  <Typography>
                    {formatearMoneda(formData?.subtotal || 0)}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography sx={{ mr: 2 }}>Descuento:</Typography>
                  <TextField
                    size="small"
                    type="number"
                    value={formData?.descuento || 0}
                    onChange={handleDescuentoChange}
                    inputProps={{ min: 0, max: 100 }}
                    sx={{ width: '100px' }}
                  />
                  <Typography sx={{ ml: 1 }}>%</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Monto Descuento:</Typography>
                  <Typography color="error">
                    -{formatearMoneda(formData?.descuentoAmount || 0)}
                  </Typography>
                </Box>

                <Divider sx={{ my: 1 }} />

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography sx={{ mr: 2 }}>Mano de Obra:</Typography>
                  <TextField
                    size="small"
                    type="number"
                    value={formData.costo_mano_obra || ''}
                    onChange={(e) => {
                      const valor = parseFloat(e.target.value) || 0;
                      console.log('Nuevo valor de mano de obra:', valor);
                      handleManoObraChange(e);
                    }}
                    inputProps={{ min: 0, step: "0.01" }}
                    sx={{ width: '150px' }}
                  />
                </Box>

                <Divider sx={{ my: 1 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>IVA (12%):</Typography>
                  <Typography>
                    {formatearMoneda(formData?.impuestos || 0)}
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 1 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h6" fontWeight="bold">Total:</Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {formatearMoneda(formData?.total || 0)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Botones de acción */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => handleNavigation('/cotizaciones')}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {id ? 'Actualizar Cotización' : 'Crear Cotización'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default CotizacionForm;


const getMaterialImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // Si la URL ya es absoluta
  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  // Construir la URL correcta para las imágenes de materiales
  return `${API_IMAGE_URL}/uploads/materials/${imagePath}`;
};

// En la parte donde se renderiza la lista de materiales
<TableCell>
  <Box sx={{ 
    width: '50px', 
    height: '50px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    border: '1px solid #ddd',
    borderRadius: '4px',
    padding: '2px',
    backgroundColor: '#f5f5f5'
  }}>
    {material.imagen_url ? (
      <img 
        src={getMaterialImageUrl(material.imagen_url)}
        alt={`Imagen de ${material.nombre}`}
        style={{ 
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        }}
        onError={(e) => {
          console.error('Error cargando imagen:', e.target.src);
          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjOTA5MDkwIj48cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptMCAxOGMtNC40MSAwLTgtMy41OS04LThzMy41OS04IDgtOCA4IDMuNTkgOCA4LTMuNTkgOC04IDh6bTAtMTNhMiAyIDAgMTAwIDQgMiAyIDAgMDAwLTR6Ii8+PC9zdmc+';
          e.target.onerror = null;
        }}
      />
    ) : (
      <Box sx={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#909090'
      }}>
        Sin imagen
      </Box>
    )}
  </Box>
</TableCell>