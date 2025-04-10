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
  Typography
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
      setCotizaciones(data);
    } catch (error) {
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
        Swal.fire('Error', 'No se pudo eliminar la cotización', 'error');
      }
    }
  };

  const handleGeneratePDF = async (id) => {
    try {
      await generatePDF(id);
    } catch (error) {
      Swal.fire('Error', 'No se pudo generar el PDF', 'error');
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} >
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
              <TableCell>Total</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cotizaciones.map((cotizacion) => (
              <TableRow key={cotizacion.id}>
                <TableCell>{cotizacion.id}</TableCell>
                <TableCell>{cotizacion.cliente?.nombre}</TableCell>
                <TableCell>{new Date(cotizacion.fecha).toLocaleDateString()}</TableCell>
                <TableCell>${cotizacion.total.toFixed(2)}</TableCell>
                <TableCell>
                  <IconButton onClick={() => navigate(`/cotizaciones/editar/${cotizacion.id}`)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleGeneratePDF(cotizacion.id)}>
                    <PictureAsPdfIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(cotizacion.id)}>
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