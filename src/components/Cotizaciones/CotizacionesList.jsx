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
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AddIcon from '@mui/icons-material/Add';
import Swal from 'sweetalert2';
import { getCotizaciones, deleteCotizacion, generatePDF } from '../../services/cotizacionService';

const CotizacionesList = () => {
  const navigate = useNavigate();
  const [cotizaciones, setCotizaciones] = useState([]);

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
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await deleteCotizacion(id);
        await cargarCotizaciones();
        Swal.fire('¡Eliminado!', 'La cotización ha sido eliminada.', 'success');
      } catch (error) {
        console.error('Error al eliminar:', error);
        Swal.fire('Error', 'No se pudo eliminar la cotización', 'error');
      }
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

  // Función para formatear números como moneda
  const formatearMoneda = (valor) => {
    if (valor === null || valor === undefined) return 'Q 0.00';
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2
    }).format(parseFloat(valor));
  };

  // Función para formatear fechas
  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" color="primary" fontWeight={600}> 
          Cotizaciones
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/cotizaciones/nueva')}
        >
          Nueva Cotización
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Creado por</TableCell> {/* Nueva columna */}
              <TableCell>Total</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cotizaciones.map((cotizacion) => (
              <TableRow key={cotizacion.id_cotizacion}>
                <TableCell>{cotizacion.id_cotizacion}</TableCell>
                <TableCell>{`${cotizacion.cliente?.nombre || ''} ${cotizacion.cliente?.apellido || ''}`}</TableCell>
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
                  <IconButton onClick={() => navigate(`/cotizaciones/editar/${cotizacion.id_cotizacion}`)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleGeneratePDF(cotizacion.id_cotizacion)}>
                    <PictureAsPdfIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(cotizacion.id_cotizacion)}>
                    <DeleteIcon />
                  </IconButton>
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