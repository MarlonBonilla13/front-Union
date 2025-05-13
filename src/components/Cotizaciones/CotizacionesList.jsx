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

  useEffect(() => {
    loadCotizaciones();
  }, []);

  // Eliminar el segundo useEffect que estaba causando problemas
  
  const loadCotizaciones = async () => {
    try {
      setLoading(true);
      const data = await getCotizaciones();
      console.log('Cotizaciones cargadas:', data); // Para debugging
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

      // Filtro universal para estado
      const isActiva = cot.estado === true || cot.estado === 'activo' || cot.estado === 1 || cot.estado === '1';
      const isInactiva = cot.estado === false || cot.estado === 'inactivo' || cot.estado === 0 || cot.estado === '0';

      switch (tabValue) {
        case 'ACTIVAS':
          return matchesSearch && isActiva;
        case 'INACTIVAS':
          return matchesSearch && isInactiva;
        case 'TODAS':
          return matchesSearch;
        default:
          return false;
      }
    });
  }, [cotizaciones, searchTerm, tabValue]);

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
        // Actualizar el estado local y recargar las cotizaciones
        await loadCotizaciones();
        setTabValue('INACTIVAS'); // Cambiar automáticamente a la pestaña de inactivas
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
      // Validar que el ID sea un número válido
      if (!id || isNaN(id)) {
        throw new Error('ID de cotización no válido');
      }
      
      const response = await generatePDF(id);
      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cotizacion-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
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
                    label={cotizacion.estado === true || cotizacion.estado === 'activo' || cotizacion.estado === 1 || cotizacion.estado === '1' ? 'Activa' : 'Inactiva'} 
                    color={cotizacion.estado === true || cotizacion.estado === 'activo' || cotizacion.estado === 1 || cotizacion.estado === '1' ? 'success' : 'error'}
                  />
                </TableCell>
                <TableCell>
                  {cotizacion.estado === true || cotizacion.estado === 'activo' || cotizacion.estado === 1 || cotizacion.estado === '1' ? (
                    <>
                      <IconButton onClick={() => navigate(`/cotizaciones/editar/${cotizacion.id_cotizacion}`)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleGeneratePDF(cotizacion.id_cotizacion)}>
                        <PictureAsPdfIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(cotizacion.id_cotizacion)}>
                        <DeleteIcon />
                      </IconButton>
                    </>
                  ) : (
                    <>
                      <IconButton onClick={() => handleGeneratePDF(cotizacion.id_cotizacion)}>
                        <PictureAsPdfIcon />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleReactivate(cotizacion.id_cotizacion)}
                        color="success"
                        title="Reactivar cotización"
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