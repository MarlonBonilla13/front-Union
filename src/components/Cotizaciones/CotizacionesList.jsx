import React, { useState, useEffect } from 'react';
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
  ToggleButtonGroup
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AddIcon from '@mui/icons-material/Add';
import Swal from 'sweetalert2';
import RestoreIcon from '@mui/icons-material/Restore';
import { getCotizaciones, deleteCotizacion, generatePDF, reactivateCotizacion } from '../../services/cotizacionService';
// Remove this duplicate import
// import { ToggleButtonGroup, ToggleButton } from '@mui/material';

const CotizacionesList = () => {
  const navigate = useNavigate();
  const [cotizaciones, setCotizaciones] = useState([]);
  // Change initial filter state to 'active'
  const [filter, setFilter] = useState('active');

  // Add formatting functions
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

  useEffect(() => {
    cargarCotizaciones();
  }, []);

  const cargarCotizaciones = async () => {
    try {
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
        await cargarCotizaciones();
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
      await cargarCotizaciones();
      Swal.fire('¡Reactivada!', 'La cotización ha sido reactivada.', 'success');
    } catch (error) {
      console.error('Error al reactivar:', error);
      Swal.fire('Error', 'No se pudo reactivar la cotización', 'error');
    }
  };

  const handleGeneratePDF = async (id) => {
    try {
      await generatePDF(id);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      Swal.fire('Error', 'No se pudo generar el PDF', 'error');
    }
  };

  const filteredCotizaciones = cotizaciones
    .sort((a, b) => {
      // Sort active ones first
      if (a.estado === 'activo' && b.estado !== 'activo') return -1;
      if (a.estado !== 'activo' && b.estado === 'activo') return 1;
      return 0;
    })
    .filter(cotizacion => {
      if (filter === 'active') return cotizacion.estado === 'activo';
      if (filter === 'inactive') return cotizacion.estado === 'inactivo';
      return true; // 'all'
    });

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" color="primary" fontWeight={600}>
          Cotizaciones
        </Typography>
        <Box display="flex" gap={2}>
          <ToggleButtonGroup
            value={filter}
            exclusive
            onChange={(e, newFilter) => setFilter(newFilter || filter)}
            size="small"
          >
            
            <ToggleButton value="active">
              Activas
            </ToggleButton>
            <ToggleButton value="inactive">
              Inactivas
            </ToggleButton>
            <ToggleButton value="all">
              Todas
            </ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/cotizaciones/nueva')}
          >
            Nueva Cotización
          </Button>
        </Box>
      </Box>

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
                    label={cotizacion.estado} 
                    color={cotizacion.estado === 'activo' ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell>
                  {cotizacion.estado === 'activo' ? (
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