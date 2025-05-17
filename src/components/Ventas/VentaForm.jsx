import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Divider,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../../contexts/AuthContext';

// Agregar los imports necesarios
import * as clienteService from '../../services/clienteService';
import * as materialService from '../../services/materialService';
import * as ventaService from '../../services/ventaService';

// Configuración común para Swal
const swalConfig = {
  customClass: {
    container: 'swal-higher-z-index' // Esta clase se definirá en el CSS para aumentar el z-index
  }
};

const VentaForm = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Obtener el ID de la URL para edición
  const isEditMode = !!id; // Determinar si estamos en modo edición
  const { user } = useAuth(); // Obtenemos el usuario autenticado
  const [formData, setFormData] = useState({
    id_cliente: '',
    numero_factura: '',
    tipo_pago: '', // Inicializado en blanco
    fecha_venta: new Date().toISOString().split('T')[0],
    observaciones: '',
    estado_pago: 'PENDIENTE',
    nombre_comercial: '', // Nuevo campo
    mano_de_obra: 0 // Campo para mano de obra
  });
  
  const [searchMaterial, setSearchMaterial] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditMode); // Cargar datos si estamos en modo edición
  const [detalles, setDetalles] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [totales, setTotales] = useState({
    subtotal: 0,
    ivaTotal: 0,
    descuentoTotal: 0,
    manoDeObra: 0,
    total: 0
  });

  // Añadir estilos globales para que el Swal aparezca por encima de los modales
  useEffect(() => {
    // Crear un elemento de estilo
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      .swal-higher-z-index {
        z-index: 9999 !important;
      }
    `;
    document.head.appendChild(styleEl);

    // Limpieza al desmontar
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  // Cargar datos de venta para edición
  useEffect(() => {
    if (isEditMode) {
      const cargarVenta = async () => {
        setLoadingData(true);
        try {
          const venta = await ventaService.getVentaById(id);
          console.log('Venta cargada:', venta);
          
          // Configurar el estado inicial con los datos de la venta
          setFormData({
            id_cliente: venta.id_cliente,
            numero_factura: venta.numero_factura,
            tipo_pago: venta.tipo_pago,
            fecha_venta: new Date().toISOString().split('T')[0], // Usar fecha actual
            observaciones: venta.observaciones || '',
            estado_pago: venta.estado_pago,
            nombre_comercial: venta.cliente?.nombre_comercial || '',
            mano_de_obra: 0 // Inicializar con 0, actualizaremos abajo
          });
          
          // Cargar detalles si existen
          if (venta.detalles && venta.detalles.length > 0) {
            // Buscar si algún detalle tiene mano_de_obra
            const detalleManoDeObra = venta.detalles.find(d => d.mano_de_obra);
            if (detalleManoDeObra) {
              setFormData(prevData => ({
                ...prevData,
                mano_de_obra: detalleManoDeObra.mano_de_obra
              }));
            }
            
            // Transformar los detalles al formato que espera el componente
            const detallesFormateados = venta.detalles.map(detalle => ({
              id_material: detalle.id_material,
              cantidad: parseFloat(detalle.cantidad),
              precio_unitario: parseFloat(detalle.precio_unitario),
              descuento: parseFloat(detalle.descuento) || 0,
              iva: 0, // Se calculará después
              subtotal: 0 // Se calculará después
            }));
            
            setDetalles(detallesFormateados);
            
            // Recalcular subtotales, IVA y totales
            setTimeout(() => {
              calcularTotales(detallesFormateados);
            }, 100);
          }
        } catch (error) {
          console.error('Error al cargar la venta:', error);
          Swal.fire({
            title: 'Error',
            text: 'No se pudo cargar la información de la venta',
            icon: 'error',
            ...swalConfig
          });
          navigate('/ventas'); // Redirigir en caso de error
        } finally {
          setLoadingData(false);
        }
      };
      
      cargarVenta();
    }
  }, [id, isEditMode, navigate]);

  const handleAddDetalle = () => {
    setDetalles([...detalles, {
      id_material: '',
      cantidad: 1,
      precio_unitario: 0,
      iva: 0,
      descuento: 0,
      subtotal: 0
    }]);
  };

  const handleDeleteDetalle = (index) => {
    const nuevosDetalles = detalles.filter((_, i) => i !== index);
    setDetalles(nuevosDetalles);
    calcularTotales(nuevosDetalles);
  };

  const handleDetalleChange = (index, field, value) => {
    const nuevosDetalles = [...detalles];
    nuevosDetalles[index][field] = value;

    // Si se cambia el material, cargar su precio automáticamente
    if (field === 'id_material') {
      const materialSeleccionado = materiales.find(m => m.id_material === value);
      if (materialSeleccionado && materialSeleccionado.precio_unitario) {
        nuevosDetalles[index].precio_unitario = materialSeleccionado.precio_unitario;
      }
    }

    // Calcular subtotal del detalle
    if (field === 'cantidad' || field === 'precio_unitario' || field === 'descuento') {
      const detalle = nuevosDetalles[index];
      const subtotal = detalle.cantidad * detalle.precio_unitario;
      const descuento = (subtotal * detalle.descuento) / 100;
      const iva = ((subtotal - descuento) * 0.12);
      
      nuevosDetalles[index].subtotal = subtotal;
      nuevosDetalles[index].iva = iva;
    }

    setDetalles(nuevosDetalles);
    calcularTotales(nuevosDetalles);
  };

  const calcularTotales = (detallesActuales) => {
    const subtotal = detallesActuales.reduce((acc, det) => acc + det.subtotal, 0);
    const descuentoTotal = detallesActuales.reduce((acc, det) => 
      acc + (det.subtotal * det.descuento / 100), 0);
    const ivaTotal = detallesActuales.reduce((acc, det) => acc + det.iva, 0);
    // Incluir mano de obra en el total
    const manoDeObra = parseFloat(formData.mano_de_obra) || 0;
    const total = subtotal - descuentoTotal + ivaTotal + manoDeObra;

    setTotales({
      subtotal,
      descuentoTotal,
      ivaTotal,
      manoDeObra,
      total
    });
  };

  // Agregar useEffect para cargar datos iniciales
  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    try {
      const [clientesData, materialesData] = await Promise.all([
        clienteService.getClientes(),
        materialService.getMaterials()
      ]);
      setClientes(clientesData);
      setMateriales(materialesData);
    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudieron cargar los datos iniciales',
        icon: 'error',
        ...swalConfig
      });
    }
  };

  const validarFormulario = () => {
    const errores = [];

    if (!formData.id_cliente) {
      errores.push('Debe seleccionar un cliente');
    }
    if (!formData.numero_factura) {
      errores.push('Debe ingresar un número de factura');
    }
    if (!formData.tipo_pago) {
      errores.push('Debe seleccionar un tipo de pago');
    }
    if (!detalles.length) {
      errores.push('Debe agregar al menos un detalle a la venta');
    }
    
    // Validar detalles
    detalles.forEach((detalle, index) => {
      if (!detalle.id_material) {
        errores.push(`Debe seleccionar un material en la línea ${index + 1}`);
      }
      if (!detalle.cantidad || detalle.cantidad <= 0) {
        errores.push(`La cantidad debe ser mayor a 0 en la línea ${index + 1}`);
      }
      if (!detalle.precio_unitario || detalle.precio_unitario <= 0) {
        errores.push(`El precio unitario debe ser mayor a 0 en la línea ${index + 1}`);
      }
    });

    if (errores.length > 0) {
      throw new Error(errores.join('\n'));
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      validarFormulario();

      // Validar stock disponible con mensaje más detallado
      for (const detalle of detalles) {
        const material = materiales.find(m => m.id_material === detalle.id_material);
        if (!material) {
          throw new Error(`Material no encontrado para el detalle`);
        }
        if (detalle.cantidad > material.stock_actual) {
          throw new Error(`Stock insuficiente para ${material.nombre}.\nStock disponible: ${material.stock_actual}\nCantidad solicitada: ${detalle.cantidad}`);
        }
      }

      try {
        let response;
        if (isEditMode) {
          // Para actualización, enviamos SOLO los campos que el backend acepta
          // según el código del backend, solo se procesan estos tres campos
          const ventaUpdateData = {
            estado_pago: formData.estado_pago || 'PENDIENTE',
            observaciones: formData.observaciones || '',
            tipo_pago: formData.tipo_pago,
            // NO incluir: id_cliente, numero_factura, detalles, etc.
            // El backend los ignora y pueden causar errores
          };
          
          console.log('Datos de actualización (solo campos permitidos):', JSON.stringify(ventaUpdateData, null, 2));
          response = await ventaService.updateVenta(id, ventaUpdateData);
          console.log('Venta actualizada:', response);
        } else {
          const ventaData = {
            id_cliente: parseInt(formData.id_cliente) || 0,
            numero_factura: formData.numero_factura,
            tipo_pago: formData.tipo_pago,
            observaciones: formData.observaciones || '',
            estado_pago: formData.estado_pago || 'PENDIENTE',
            usuario_creacion: user ? parseInt(user.id) || 1 : 1,
            detalles: detalles.map(detalle => ({
              id_material: parseInt(detalle.id_material) || 0,
              cantidad: parseFloat(detalle.cantidad) || 0,
              precio_unitario: parseFloat(detalle.precio_unitario) || 0,
              descuento: parseFloat(detalle.descuento) || 0,
              mano_de_obra: parseFloat(formData.mano_de_obra) || 0
            }))
          };
          
          console.log('Datos de creación:', JSON.stringify(ventaData, null, 2));
          response = await ventaService.createVenta(ventaData);
          console.log('Venta creada:', response);
        }
        
        await Swal.fire({
          title: isEditMode ? '¡Actualizada!' : '¡Éxito!',
          text: isEditMode ? 'Venta actualizada correctamente' : 'Venta creada correctamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          ...swalConfig
        });

        navigate('/ventas');
      } catch (apiError) {
        console.error('Error detallado de la API:', apiError);
        
        // Inspeccionar el objeto de error completo
        if (apiError.response) {
          console.log('Respuesta completa del servidor:', JSON.stringify(apiError.response, null, 2));
          console.log('Estado:', apiError.response.status);
          console.log('Datos completos:', JSON.stringify(apiError.response.data, null, 2));
          
          if (apiError.response.data && apiError.response.data.message) {
            if (Array.isArray(apiError.response.data.message)) {
              console.log('Mensajes de error del servidor:');
              apiError.response.data.message.forEach((msg, index) => {
                console.log(`Error ${index + 1}:`, msg);
              });
            } else {
              console.log('Mensaje de error:', apiError.response.data.message);
            }
          }
        }
        
        // Mostrar mensaje de error más descriptivo
        let errorHtml = 'Error al procesar la venta';
        
        if (apiError.response && apiError.response.data) {
          if (apiError.response.data.message && Array.isArray(apiError.response.data.message)) {
            // Formatear mensajes del array como una lista HTML
            errorHtml = '<ul style="text-align: left; list-style-type: disc; padding-left: 20px;">';
            apiError.response.data.message.forEach(msg => {
              errorHtml += `<li>${msg}</li>`;
            });
            errorHtml += '</ul>';
          } else if (apiError.response.data.message) {
            errorHtml = apiError.response.data.message;
          }
        }
        
        Swal.fire({
          title: 'Error en la validación',
          icon: 'error',
          html: errorHtml,
          confirmButtonText: 'Entendido',
          ...swalConfig
        });
      }
    } catch (error) {
      console.error('Error al procesar venta (validación):', error);
      Swal.fire({
        title: 'Error de validación',
        text: error.message || 'Error al procesar la venta',
        icon: 'error',
        html: error.message ? error.message.replace(/\n/g, '<br>') : 'Error al procesar la venta',
        ...swalConfig
      });
    } finally {
      setLoading(false);
    }
  }

  // Función para manejar el cambio de cliente
  const handleClienteChange = (clienteId) => {
    const clienteSeleccionado = clientes.find(c => c.id_cliente === clienteId);
    setFormData({
      ...formData,
      id_cliente: clienteId,
      nombre_comercial: clienteSeleccionado?.nombre_comercial || ''
    });
  };

  // Mover la función materialesFiltrados aquí
  const filtrarMateriales = () => {
    return materiales.filter(material =>
      material.nombre.toLowerCase().includes(searchMaterial.toLowerCase()) ||
      (material.codigo && material.codigo.toLowerCase().includes(searchMaterial.toLowerCase()))
    );
  };

  // Mover el componente MaterialAvatar aquí
  const MaterialAvatar = ({ material }) => {
    if (material.imagen_url) {
      return (
        <Box sx={{ mr: 2, width: 40, height: 40 }}>
          <img 
            src={material.imagen_url} 
            alt={material.nombre}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              borderRadius: '4px'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'flex';
            }}
          />
          <Box
            sx={{
              display: 'none',
              width: '100%',
              height: '100%',
              backgroundColor: '#757575',
              color: 'white',
              borderRadius: '50%',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              fontWeight: 'bold'
            }}
          >
            {material.nombre.charAt(0).toUpperCase()}
          </Box>
        </Box>
      );
    }

    return (
      <Box
        sx={{
          mr: 2,
          width: 40,
          height: 40,
          backgroundColor: '#757575',
          color: 'white',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.2rem',
          fontWeight: 'bold'
        }}
      >
        {material.nombre.charAt(0).toUpperCase()}
      </Box>
    );
  };

  // Actualizar cualquier uso de materialesFiltrados con la llamada a la función filtrarMateriales()
  const materialesFiltrados = filtrarMateriales();
  
  // Componente personalizado para el menú desplegable con buscador
  const CustomSelect = ({ index, value, onChange }) => {
    // Estado local para el buscador dentro del componente
    const [localSearch, setLocalSearch] = useState('');
    // Estado para controlar si el menú está abierto
    const [menuOpen, setMenuOpen] = useState(false);
    
    // Actualizar el buscador global cuando cambie el local
    const handleSearchChange = (e) => {
      const newValue = e.target.value;
      setLocalSearch(newValue);
      setSearchMaterial(newValue);
    };
    
    // Filtrar materiales basados en la búsqueda
    const filteredMateriales = materiales.filter(material =>
      material.nombre.toLowerCase().includes(localSearch.toLowerCase()) ||
      (material.codigo && material.codigo.toLowerCase().includes(localSearch.toLowerCase()))
    );
    
    return (
      <FormControl fullWidth>
        <Select
          value={value}
          onChange={onChange}
          open={menuOpen}
          onOpen={() => setMenuOpen(true)}
          onClose={() => setMenuOpen(false)}
          // Renderizar el buscador en el componente de renderizado del Select
          renderValue={(selected) => {
            const material = materiales.find(m => m.id_material === selected);
            if (!material) return "Seleccione un material";
            return (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <MaterialAvatar material={material} />
                <Typography>{material.nombre}</Typography>
              </Box>
            );
          }}
          MenuProps={{
            // Importante: Evitar que el menú se cierre automáticamente
            disableAutoFocusItem: true,
            // Evitar que el menú se cierre al hacer clic dentro
            autoFocus: false,
            disableAutoFocus: true,
            disableEnforceFocus: true,
            // Evitar que el menú se cierre al hacer clic/presionar teclas
            // dentro del campo de búsqueda
            disableRestoreFocus: true,
            // Configuración del papel que contiene el menú
            PaperProps: {
              style: { maxHeight: 450 },
            },
            // Función personalizada para controlar cuándo se cierra el menú
            onClose: (event) => {
              // Si el evento proviene del campo de búsqueda, no cerrar el menú
              if (event.target && (event.target.tagName === 'INPUT' || 
                  event.target.closest('.MuiInputBase-root'))) {
                return;
              }
              setMenuOpen(false);
            },
          }}
        >
          {/* Componente de búsqueda como primer item no seleccionable */}
          <Box 
            sx={{ 
              p: 1, 
              position: 'sticky', 
              top: 0, 
              bgcolor: 'background.paper', 
              zIndex: 1 
            }}
            onClick={(e) => {
              // Prevenir que el clic se propague para evitar que se cierre el menú
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar material por nombre o código..."
              value={localSearch}
              onChange={handleSearchChange}
              // Capturar eventos que podrían provocar que se cierre el menú
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onKeyDown={(e) => {
                // Evitar que Escape, Enter, etc. cierren el menú
                if (e.key === 'Escape' || e.key === 'Tab' || e.key === 'Enter') {
                  e.stopPropagation();
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                onClick: (e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }
              }}
              variant="outlined"
              autoFocus
              // Forzar el foco en el campo de texto
              onFocus={(e) => {
                // Para evitar que el foco salga de este campo
                e.stopPropagation();
              }}
            />
          </Box>
          <Divider />
          {filteredMateriales.length > 0 ? (
            filteredMateriales.map((material) => (
              <MenuItem 
                key={material.id_material} 
                value={material.id_material}
                onClick={(e) => {
                  onChange({ target: { value: material.id_material } });
                  setMenuOpen(false);
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <MaterialAvatar material={material} />
                  <Box sx={{ flexGrow: 1 }}>{material.nombre}</Box>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: 'text.secondary',
                      fontStyle: 'italic',
                      ml: 2
                    }}
                  >
                    {material.codigo}
                  </Typography>
                </Box>
              </MenuItem>
            ))
          ) : (
            <MenuItem disabled>
              <Box sx={{ textAlign: 'center', width: '100%', py: 1 }}>
                No se encontraron materiales
              </Box>
            </MenuItem>
          )}
        </Select>
      </FormControl>
    );
  };

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom color="primary">
        {isEditMode ? 'Editar Venta' : 'Nueva Venta'}
      </Typography>

      {loadingData ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {isEditMode && (
            <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: '#fff8e1', border: '1px solid #ffe082', borderRadius: 1 }}>
              <Typography variant="body2" color="warning.dark">
                <strong>Nota:</strong> En modo edición solo puede modificar el tipo de pago y estado de pago. 
                Los detalles de la venta, cliente, descripción y número de factura no pueden ser modificados una vez creada la venta.
              </Typography>
            </Paper>
          )}
          
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={isEditMode}>
                  <InputLabel>Cliente</InputLabel>
                  <Select
                    value={formData.id_cliente}
                    onChange={(e) => handleClienteChange(e.target.value)}
                    label="Cliente"
                    required
                  >
                    {clientes.map((cliente) => (
                      <MenuItem key={cliente.id_cliente} value={cliente.id_cliente}>
                        {`${cliente.nombre} ${cliente.apellido}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nombre Comercial"
                  value={formData.nombre_comercial}
                  disabled
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Número de Factura"
                  value={formData.numero_factura}
                  onChange={(e) => setFormData({ ...formData, numero_factura: e.target.value })}
                  required
                  disabled={isEditMode}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth required>
                  <InputLabel>Tipo de Pago</InputLabel>
                  <Select
                    value={formData.tipo_pago}
                    onChange={(e) => setFormData({ ...formData, tipo_pago: e.target.value })}
                    label="Tipo de Pago"
                  >
                    <MenuItem value="">Seleccione un tipo de pago</MenuItem>
                    <MenuItem value="CONTADO">Contado</MenuItem>
                    <MenuItem value="CREDITO">Crédito</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha de Venta"
                  value={formData.fecha_venta}
                  onChange={(e) => setFormData({ ...formData, fecha_venta: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  disabled={isEditMode}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Mano de Obra (Q)"
                  value={formData.mano_de_obra}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    const newFormData = { ...formData, mano_de_obra: value };
                    setFormData(newFormData);
                    // Recalcular totales cuando cambia la mano de obra
                    const subtotal = detalles.reduce((acc, det) => acc + det.subtotal, 0);
                    const descuentoTotal = detalles.reduce((acc, det) => 
                      acc + (det.subtotal * det.descuento / 100), 0);
                    const ivaTotal = detalles.reduce((acc, det) => acc + det.iva, 0);
                    const total = subtotal - descuentoTotal + ivaTotal + value;
                    
                    setTotales({
                      subtotal,
                      descuentoTotal,
                      ivaTotal,
                      manoDeObra: value,
                      total
                    });
                  }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">Q</InputAdornment>,
                  }}
                  disabled={isEditMode}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Estado de Pago</InputLabel>
                  <Select
                    value={formData.estado_pago}
                    onChange={(e) => setFormData({ ...formData, estado_pago: e.target.value })}
                    label="Estado de Pago"
                  >
                    <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                    <MenuItem value="PAGADO">Pagado</MenuItem>
                    <MenuItem value="ANULADO">Anulado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Descripción de la venta"
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  disabled={isEditMode}
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Materiales para la venta</Typography>
              {!isEditMode && (
                <Button
                  startIcon={<AddIcon />}
                  variant="contained"
                  onClick={handleAddDetalle}
                >
                  Agregar Producto
                </Button>
              )}
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Material</TableCell>
                    <TableCell>Cantidad</TableCell>
                    <TableCell>Precio Unitario</TableCell>
                    <TableCell>Descuento (%)</TableCell>
                    <TableCell>IVA</TableCell>
                    <TableCell>Subtotal</TableCell>
                    {!isEditMode && <TableCell>Acciones</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detalles.map((detalle, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {isEditMode ? (
                          // En modo edición, mostrar solo el nombre del material
                          <Typography>
                            {materiales.find(m => m.id_material === detalle.id_material)?.nombre || 'Material no encontrado'}
                          </Typography>
                        ) : (
                          // En modo creación, permitir seleccionar el material
                          <CustomSelect 
                            index={index}
                            value={detalle.id_material}
                            onChange={(e) => handleDetalleChange(index, 'id_material', e.target.value)}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          label="Cantidad"
                          value={detalle.cantidad || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Solo permitir números
                            if (/^\d*$/.test(value)) {
                              handleDetalleChange(index, 'cantidad', value);
                            }
                          }}
                          inputProps={{
                            inputMode: 'numeric',
                            pattern: '[0-9]*'
                          }}
                          variant="outlined"
                          placeholder="Ingrese la cantidad"
                          disabled={isEditMode}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="text"
                          value={`Q ${detalle.precio_unitario ? detalle.precio_unitario.toFixed(2) : '0.00'}`}
                          InputProps={{
                            readOnly: true,
                          }}
                          disabled
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number" 
                          value={detalle.descuento}
                          onChange={(e) => handleDetalleChange(index, 'descuento', parseFloat(e.target.value))}
                          disabled={isEditMode}
                        />
                      </TableCell>
                      <TableCell>
                        Q{detalle.iva.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        Q{detalle.subtotal.toFixed(2)}
                      </TableCell>
                      {!isEditMode && (
                        <TableCell>
                          <IconButton color="error" onClick={() => handleDeleteDetalle(index)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box mt={3} p={2} bgcolor="grey.100" borderRadius={1}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Typography>Subtotal: Q{totales.subtotal.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Typography>Descuento: Q{totales.descuentoTotal.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Typography>IVA: Q{totales.ivaTotal.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Typography>Mano de Obra: Q{(totales.manoDeObra || 0).toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="h6">Total: Q{totales.total.toFixed(2)}</Typography>
                </Grid>
              </Grid>
            </Box>
          </Paper>

          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : isEditMode ? 'Actualizar Venta' : 'Crear Venta'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/ventas')}
              disabled={loading}
            >
              Cancelar
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

export default VentaForm;