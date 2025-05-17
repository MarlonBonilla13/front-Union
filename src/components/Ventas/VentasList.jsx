import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Avatar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreIcon from '@mui/icons-material/Restore';
import SearchIcon from '@mui/icons-material/Search';
import PreviewIcon from '@mui/icons-material/Preview';
import { getVentas } from '../../services/ventaService';
import * as ventaService from '../../services/ventaService';
import Swal from 'sweetalert2';
import api from '../../services/api'; // Importar api para URL base
import ExportPreviewVentasDialog from './ExportPreviewVentasDialog';

// Configuración común para Swal
const swalConfig = {
  customClass: {
    container: 'swal-higher-z-index' // Esta clase se definirá en el CSS para aumentar el z-index
  }
};

// Función para obtener la URL de la imagen del cliente
const getImageUrl = (imagePath) => {
  if (!imagePath) {
    return null;
  }
  
  // Si la URL ya es absoluta (comienza con http)
  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  // Si es una ruta relativa
  const cleanPath = imagePath.split('/').pop();
  const url = `${api.defaults.baseURL}/uploads/clientes/${cleanPath}`;
  return url;
};

// Constantes para estados de venta
const ESTADOS_VENTA = {
  PENDIENTE: 'PENDIENTE',
  PAGADO: 'PAGADO',
  ANULADO: 'ANULADO'
};

const VentasList = () => {
  const navigate = useNavigate();
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState('ACTIVAS');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState([]);

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

  useEffect(() => {
    loadVentas();
  }, []);

  const loadVentas = async () => {
    try {
      setLoading(true);
      const data = await getVentas();
      setVentas(data);
    } catch (error) {
      console.error('Error al cargar ventas:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudieron cargar las ventas',
        icon: 'error',
        ...swalConfig
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar ventas según la pestaña seleccionada
  const getFilteredVentas = () => {
    let filteredVentas = ventas;

    // Filtrar por texto de búsqueda
    if (searchTerm) {
      filteredVentas = filteredVentas.filter(venta => 
        venta.numero_factura?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venta.cliente?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venta.cliente?.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (venta.cliente?.nombre_comercial && venta.cliente.nombre_comercial.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtrar por estado según la pestaña
    if (tabValue === 'ACTIVAS') {
      return filteredVentas.filter(venta => 
        venta.estado_pago === ESTADOS_VENTA.PENDIENTE || 
        venta.estado_pago === ESTADOS_VENTA.PAGADO
      );
    } else if (tabValue === 'ANULADAS') {
      return filteredVentas.filter(venta => venta.estado_pago === ESTADOS_VENTA.ANULADO);
    }

    return filteredVentas;
  };

  const handleAnularVenta = async (id) => {
    const result = await Swal.fire({
      title: '¿Anular esta venta?',
      text: "La venta será marcada como ANULADA por motivos de auditoría",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, anular',
      cancelButtonText: 'Cancelar',
      ...swalConfig
    });

    if (result.isConfirmed) {
      try {
        // Actualizar estado a ANULADO en lugar de eliminar
        await ventaService.updateVenta(id, { estado_pago: ESTADOS_VENTA.ANULADO });
        
        // Actualizar el estado local
        setVentas(ventas.map(venta => 
          venta.id_venta === id 
            ? { ...venta, estado_pago: ESTADOS_VENTA.ANULADO } 
            : venta
        ));

        Swal.fire({
          title: '¡Anulada!',
          text: 'La venta ha sido anulada y movida a la pestaña de Anuladas.',
          icon: 'success',
          timer: 2000,
          ...swalConfig
        });
      } catch (error) {
        console.error('Error al anular la venta:', error);
        Swal.fire({
          title: 'Error', 
          text: 'No se pudo anular la venta', 
          icon: 'error',
          ...swalConfig
        });
      }
    }
  };

  const handleReactivarVenta = async (id) => {
    const result = await Swal.fire({
      title: '¿Reactivar esta venta?',
      text: "La venta volverá a estado PENDIENTE",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, reactivar',
      cancelButtonText: 'Cancelar',
      ...swalConfig
    });

    if (result.isConfirmed) {
      try {
        // Actualizar estado a PENDIENTE
        await ventaService.updateVenta(id, { estado_pago: ESTADOS_VENTA.PENDIENTE });
        
        // Actualizar el estado local
        setVentas(ventas.map(venta => 
          venta.id_venta === id 
            ? { ...venta, estado_pago: ESTADOS_VENTA.PENDIENTE } 
            : venta
        ));

        Swal.fire({
          title: '¡Reactivada!',
          text: 'La venta ha sido reactivada y movida a la pestaña de Activas.',
          icon: 'success',
          timer: 2000,
          ...swalConfig
        });

        // Cambiar a la pestaña de activas si estamos en anuladas
        if (tabValue === 'ANULADAS') {
          setTabValue('ACTIVAS');
        }
      } catch (error) {
        console.error('Error al reactivar la venta:', error);
        Swal.fire({
          title: 'Error', 
          text: 'No se pudo reactivar la venta', 
          icon: 'error',
          ...swalConfig
        });
      }
    }
  };

  const handlePreviewExport = () => {
    setPreviewData(ventas);
    setPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
  };

  return (
    <Box sx={{ p: 3, mt: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" component="h2" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
          Ventas
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
            onClick={() => navigate('/ventas/nueva')}
            sx={{ backgroundColor: '#1976d2' }}
          >
            Nueva Venta
          </Button>
        </Box>
      </Box>

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Buscar por nombre, apellido, nombre comercial, número de factura..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      <Tabs
        value={tabValue}
        onChange={(e, newValue) => setTabValue(newValue)}
        sx={{ mb: 2 }}
        indicatorColor="primary"
        textColor="primary"
      >
        <Tab value="ACTIVAS" label="Activas" />
        <Tab value="ANULADAS" label="Anuladas" />
      </Tabs>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nº Factura</TableCell>
              <TableCell align="center">Logo</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Nombre Comercial</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {getFilteredVentas().map((venta) => (
              <TableRow key={venta.id_venta}>
                <TableCell>{venta.numero_factura}</TableCell>
                <TableCell align="center">
                  {venta.cliente?.imagen_url ? (
                    <img
                      src={getImageUrl(venta.cliente.imagen_url)}
                      alt={`Logo de ${venta.cliente.nombre}`}
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
                            background-color: ${getColorForName(venta.cliente.nombre)};
                            border-radius: 4px;
                            color: white;
                            font-weight: bold;
                            margin: 0 auto;
                          ">
                            ${venta.cliente.nombre.charAt(0).toUpperCase()}
                          </div>
                        `;
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '50px',
                      height: '50px',
                      backgroundColor: getColorForName(venta.cliente?.nombre || 'C'),
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      margin: '0 auto'
                    }}>
                      {(venta.cliente?.nombre || 'C').charAt(0).toUpperCase()}
                    </div>
                  )}
                </TableCell>
                <TableCell>{`${venta.cliente?.nombre || ''} ${venta.cliente?.apellido || ''}`}</TableCell>
                <TableCell>{venta.cliente?.nombre_comercial || 'N/A'}</TableCell>
                <TableCell>{new Date(venta.fecha_creacion).toLocaleDateString()}</TableCell>
                <TableCell>Q{parseFloat(venta.total).toFixed(2)}</TableCell>
                <TableCell>
                  <Chip 
                    label={venta.estado_pago}
                    color={
                      venta.estado_pago === ESTADOS_VENTA.PENDIENTE 
                        ? 'warning' 
                        : venta.estado_pago === ESTADOS_VENTA.PAGADO 
                          ? 'success' 
                          : 'error'
                    }
                  />
                </TableCell>
                <TableCell align="center">
                  <IconButton 
                    color="primary"
                    onClick={() => navigate(`/ventas/editar/${venta.id_venta}`)}
                  >
                    <EditIcon />
                  </IconButton>
                  
                  {tabValue === 'ACTIVAS' ? (
                    <IconButton 
                      color="error"
                      onClick={() => handleAnularVenta(venta.id_venta)}
                      title="Anular venta"
                    >
                      <DeleteIcon />
                    </IconButton>
                  ) : (
                    <IconButton 
                      color="success"
                      onClick={() => handleReactivarVenta(venta.id_venta)}
                      title="Reactivar venta"
                    >
                      <RestoreIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {getFilteredVentas().length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No hay ventas para mostrar
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <ExportPreviewVentasDialog
        open={previewOpen}
        onClose={handleClosePreview}
        data={previewData}
      />
    </Box>
  );
};

// Función para obtener un color basado en el nombre
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

export default VentasList;