import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Typography,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment,
  TextField,
  Tabs,
  Tab
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AddIcon from '@mui/icons-material/Add';
import Swal from 'sweetalert2';
import RestoreIcon from '@mui/icons-material/Restore';
import { getCotizaciones, deleteCotizacion, generatePDF, reactivateCotizacion } from '../../services/cotizacionService';
import SearchIcon from '@mui/icons-material/Search';

const CotizacionesList = () => {
  const navigate = useNavigate();
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState('ACTIVAS');
  // Eliminar esta línea:
  // const [filter, setFilter] = useState('active');

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ'
    }).format(valor);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const filteredCotizaciones = useMemo(() => {
    return cotizaciones.filter(cot => {
      const searchLower = searchTerm.toLowerCase();
      const clienteNombre = cot.cliente?.nombre?.toLowerCase() || '';
      const clienteComercial = cot.cliente?.nombre_comercial?.toLowerCase() || '';
      const id = cot.id_cotizacion?.toString() || '';
      
      const matchesSearch = 
        clienteNombre.includes(searchLower) ||
        clienteComercial.includes(searchLower) ||
        id.includes(searchLower);

      const matchesTab = 
        (tabValue === 'ACTIVAS' && cot.estado) ||
        (tabValue === 'INACTIVAS' && !cot.estado) ||
        tabValue === 'TODAS';

      return matchesSearch && matchesTab;
    });
  }, [cotizaciones, searchTerm, tabValue]);

  useEffect(() => {
    loadCotizaciones();
  }, []);

  const loadCotizaciones = async () => {
    try {
      setLoading(true);
      const data = await getCotizaciones();
      console.log('Cotizaciones cargadas con usuarios:', data);
      setCotizaciones(data);
    } catch (error) {
      console.error('Error al cargar cotizaciones:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudieron cargar las cotizaciones',
        icon: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Está seguro?',
      text: 'La cotización pasará a estado inactivo',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await deleteCotizacion(id);
        await loadCotizaciones();
        Swal.fire('¡Desactivada!', 'La cotización ha sido desactivada.', 'success');
      } catch (error) {
        console.error('Error al desactivar:', error);
        Swal.fire('Error', 'No se pudo desactivar la cotización', 'error');
      }
    }
  };

  const handleReactivate = async (id) => {
    try {
      await reactivateCotizacion(id);
      await loadCotizaciones();
      Swal.fire('¡Reactivada!', 'La cotización ha sido reactivada.', 'success');
    } catch (error) {
      console.error('Error al reactivar:', error);
      Swal.fire('Error', 'No se pudo reactivar la cotización', 'error');
    }
  };

  const handleGeneratePDF = async (id) => {
    try {
      Swal.fire({
        title: 'Generando PDF',
        text: 'Por favor espere...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      await generatePDF(id);
      
      Swal.fire({
        title: '¡PDF Generado!',
        text: 'El PDF se ha descargado correctamente',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error al generar PDF:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo generar el PDF. Por favor intente nuevamente.',
        icon: 'error'
      });
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" color="primary" fontWeight={600}>
          Cotizaciones
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/cotizaciones/nueva')}
          >
            Nueva Cotización
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar por ID, cliente o nombre comercial..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          size="small"
          sx={{ backgroundColor: 'white', flex: 1 }}
        />
      </Box>

      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        sx={{ mb: 2 }}
      >
        <Tab value="ACTIVAS" label="Activas" />
        <Tab value="INACTIVAS" label="Inactivas" />
        <Tab value="TODAS" label="Todas" />
      </Tabs>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Nombre Comercial</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Creado por</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCotizaciones.map((cotizacion) => (
              <TableRow key={cotizacion.id_cotizacion}>
                <TableCell>{cotizacion.id_cotizacion}</TableCell>
                <TableCell>{`${cotizacion.cliente?.nombre || ''} ${cotizacion.cliente?.apellido || ''}`}</TableCell>
                <TableCell>{cotizacion.cliente?.nombre_comercial || '-'}</TableCell>
                <TableCell>{formatearFecha(cotizacion.fecha_cotizacion)}</TableCell>
                <TableCell>{cotizacion.usuario_creacion_nombre || 'Usuario desconocido'}</TableCell>
                <TableCell>{formatearMoneda(cotizacion.total)}</TableCell>
                <TableCell>
                  <Chip 
                    label={cotizacion.estado ? 'Activa' : 'Inactiva'} 
                    color={cotizacion.estado ? 'success' : 'error'}
                  />
                </TableCell>
                <TableCell>
                  {cotizacion.estado ? (
                    <>
                      <IconButton onClick={() => navigate(`/cotizaciones/editar/${cotizacion.id_cotizaciones}`)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleGeneratePDF(cotizacion.id_cotizaciones)}>
                        <PictureAsPdfIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(cotizacion.id_cotizaciones)}>
                        <DeleteIcon />
                      </IconButton>
                    </>
                  ) : (
                    <>
                      <IconButton onClick={() => handleGeneratePDF(cotizacion.id_cotizaciones)}>
                        <PictureAsPdfIcon />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleReactivate(cotizacion.id_cotizaciones)}
                        color="primary"
                      >
                        <RestoreIcon />
                      </IconButton>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default CotizacionesList;