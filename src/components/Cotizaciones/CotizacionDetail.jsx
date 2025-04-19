import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Divider,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert
} from '@mui/material';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import PrintIcon from '@mui/icons-material/Print';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import { getCotizacionById } from '../../services/cotizacionService';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import HistoryIcon from '@mui/icons-material/History';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
import { toast } from 'react-toastify';

const CotizacionDetail = ({ cotizacionId, onConvertToVenta }) => {
  const [cotizacion, setCotizacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getEstadoColor = (estado) => {
    const colors = {
      'PENDIENTE': 'warning',
      'APROBADA': 'success',
      'RECHAZADA': 'error',
      'VENCIDA': 'default',
      'FACTURADA': 'info'
    };
    return colors[estado] || 'default';
  };

  useEffect(() => {
    const loadCotizacion = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Cargando cotización:', cotizacionId);
        const data = await getCotizacionById(cotizacionId);
        
        // Validar datos requeridos
        if (!data || !data.id_cotizacion) {
          throw new Error('Datos de cotización inválidos');
        }

        // Asegurar que los campos numéricos sean números
        const processedData = {
          ...data,
          subtotal: parseFloat(data.subtotal) || 0,
          descuento: parseFloat(data.descuento) || 0,
          impuestos: parseFloat(data.impuestos) || 0,
          total: parseFloat(data.total) || 0,
          validez: parseInt(data.validez) || 30,
          detalles: Array.isArray(data.detalles) ? data.detalles.map(detalle => ({
            ...detalle,
            cantidad: parseFloat(detalle.cantidad) || 0,
            precio_unitario: parseFloat(detalle.precio_unitario) || 0,
            subtotal: parseFloat(detalle.subtotal) || 0
          })) : []
        };

        console.log('Cotización cargada exitosamente:', processedData);
        setCotizacion(processedData);
      } catch (error) {
        console.error('Error al cargar la cotización:', error);
        setError(error.message || 'Error al cargar la cotización');
        toast.error('Error al cargar los detalles de la cotización');
      } finally {
        setLoading(false);
      }
    };

    if (cotizacionId) {
      loadCotizacion();
    }
  }, [cotizacionId]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    try {
      const response = await fetch(`/api/cotizaciones/${cotizacionId}/pdf`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cotizacion-${cotizacionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al exportar el PDF'
      });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!cotizacion) {
    return (
      <Alert severity="info">
        No se encontró la cotización solicitada
      </Alert>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          Cotización #{cotizacion.id_cotizacion}
        </Typography>
        <Box>
          <Button
            startIcon={<PictureAsPdfIcon />}
            onClick={handleExportPDF}
            sx={{ mr: 1 }}
          >
            Exportar PDF
          </Button>
          <Button
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            sx={{ mr: 1 }}
          >
            Imprimir
          </Button>
          {cotizacion.estado === 'APROBADA' && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<PointOfSaleIcon />}
              onClick={() => onConvertToVenta(cotizacion.id_cotizacion)}
            >
              Convertir a Venta
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            Cliente
          </Typography>
          <Typography>
            {`${cotizacion.cliente.nombre} ${cotizacion.cliente.apellido}`}
          </Typography>
          <Typography color="textSecondary">
            {cotizacion.cliente.email}
          </Typography>
          <Typography color="textSecondary">
            {cotizacion.cliente.telefono}
          </Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box display="flex" justifyContent="flex-end" alignItems="flex-start">
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Estado
              </Typography>
              <Chip
                label={cotizacion.estado}
                color={getEstadoColor(cotizacion.estado)}
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" color="textSecondary">
                Fecha: {format(new Date(cotizacion.fecha_cotizacion), 'dd/MM/yyyy', { locale: es })}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Válida hasta: {format(addDays(new Date(cotizacion.fecha_cotizacion), cotizacion.validez), 'dd/MM/yyyy', { locale: es })}
              </Typography>
            </Box>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>
            Detalles de la Cotización
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Material</TableCell>
                  <TableCell align="right">Cantidad</TableCell>
                  <TableCell align="right">Precio Unitario</TableCell>
                  <TableCell align="right">Subtotal</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cotizacion.detalles.map((detalle, index) => (
                  <TableRow key={index}>
                    <TableCell>{detalle.material.nombre}</TableCell>
                    <TableCell align="right">{detalle.cantidad}</TableCell>
                    <TableCell align="right">
                      ${detalle.precio_unitario.toFixed(2)}
                    </TableCell>
                    <TableCell align="right">
                      ${detalle.subtotal.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper' }}>
            <Grid container spacing={2} justifyContent="flex-end">
              <Grid item xs={12} md={4}>
                <Typography>
                  Subtotal: ${cotizacion.subtotal.toFixed(2)}
                </Typography>
                <Typography>
                  Descuento: ${cotizacion.descuento.toFixed(2)}
                </Typography>
                <Typography>
                  IVA (12%): ${cotizacion.impuestos.toFixed(2)}
                </Typography>
                <Typography variant="h6">
                  Total: ${cotizacion.total.toFixed(2)}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Grid>

        {cotizacion.observaciones && (
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Observaciones
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {cotizacion.observaciones}
            </Typography>
          </Grid>
        )}

        {cotizacion.historial && cotizacion.historial.length > 0 && (
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              <HistoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Historial de Cambios
            </Typography>
            
            <Timeline>
              {cotizacion.historial.map((cambio, index) => (
                <TimelineItem key={index}>
                  <TimelineOppositeContent color="text.secondary">
                    {format(new Date(cambio.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot color={getEstadoColor(cambio.estado_nuevo)} />
                    {index < cotizacion.historial.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography variant="body1">
                      Cambio a: <Chip
                        label={cambio.estado_nuevo}
                        color={getEstadoColor(cambio.estado_nuevo)}
                        size="small"
                      />
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Por: {cambio.usuario.nombre}
                    </Typography>
                    {cambio.observacion && (
                      <Typography variant="body2" color="text.secondary">
                        Observación: {cambio.observacion}
                      </Typography>
                    )}
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default CotizacionDetail;