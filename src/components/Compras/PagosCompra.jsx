import React, { useState, useEffect } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Button, IconButton, TextField, MenuItem, Typography,
  Paper, InputAdornment, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import * as comprasService from '../../services/comprasService';
import Swal from 'sweetalert2';

const tiposPago = ['Efectivo', 'Transferencia', 'Tarjeta de Crédito', 'Cheque'];
const estadosPago = ['PENDIENTE', 'COMPLETADO', 'CANCELADO'];

const PagosCompra = ({ idCompra, totalCompra }) => {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState(false);
  const [pago, setPago] = useState({
    monto: 0,
    tipo_pago: '',
    numero_referencia: '',
    estado_pago: 'PENDIENTE',
    observaciones: '',
    usuario_registro: parseInt(localStorage.getItem('userId')) || 1
  });

  useEffect(() => {
    console.log('ID Compra recibido:', idCompra);
    if (idCompra) {
      fetchPagos();
    }
  }, [idCompra]);

  const fetchPagos = async () => {
    try {
      setLoading(true);
      const data = await comprasService.getPagosCompra(idCompra);
      setPagos(data);

      if (data && data.length > 0) {
        const tieneCompletadoOCancelado = data.some(pago => 
          pago.estado_pago === 'COMPLETADO' || 
          pago.estado_pago === 'CANCELADO'
        );
        
        if (tieneCompletadoOCancelado) {
          try {
            const compraActual = await comprasService.getCompraById(idCompra);
            
            if (compraActual && compraActual.id_estado === 1) {
              await comprasService.updateCompra(idCompra, {
                id_estado: 2,
                estado: 'APROBADO',
                fecha_actualizacion: new Date().toISOString()
              });
              
              window.dispatchEvent(new CustomEvent('compraActualizada', { 
                detail: { idCompra, nuevoEstado: 'APROBADO' } 
              }));
            }
          } catch (error) {
            console.error('Error al actualizar estado de la compra:', error);
            console.log('Detalles del error:', {
              mensaje: error.message,
              respuesta: error.response?.data,
              estado: error.response?.status
            });
          }
        }
      }
    } catch (error) {
      console.error('Error al cargar pagos:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudieron cargar los pagos',
        icon: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClickOpen = () => {
    setEditando(false);
    setPago({
      monto: 0,
      tipo_pago: '',
      numero_referencia: '',
      estado_pago: 'PENDIENTE',
      observaciones: '',
      usuario_registro: parseInt(localStorage.getItem('userId')) || 1
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setPago({
      ...pago,
      [name]: value
    });
  };

  const handleSubmit = async () => {
    try {
      const saldoPendiente = calcularSaldoPendiente();
      
      if (pago.estado_pago === 'COMPLETADO' || pago.estado_pago === 'CANCELADO') {
        try {
          // Usar getCompraById en lugar de getCompra
          const compraActual = await comprasService.getCompraById(idCompra);
          
          if (compraActual.id_estado === 1) {
            await comprasService.updateCompra(idCompra, {
              id_estado: 2
            });
            
            window.dispatchEvent(new CustomEvent('compraActualizada', { 
              detail: { idCompra, nuevoEstado: 'APROBADO' } 
            }));
          }
        } catch (error) {
          console.error('Error al actualizar estado de la compra:', error);
          throw new Error('No se pudo actualizar el estado de la compra');
        }
      }

      if (editando) {
        await comprasService.updatePagoCompra(pago.id_pago, pago);
      } else {
        await comprasService.createPagoCompra(idCompra, pago);
      }
      
      // Actualizar la lista de pagos inmediatamente después de crear/editar
      await fetchPagos();
      handleClose();
      
      // Limpiar el formulario
      setPago({
        monto: 0,
        tipo_pago: '',
        numero_referencia: '',
        estado_pago: 'PENDIENTE',
        observaciones: '',
        usuario_registro: parseInt(localStorage.getItem('userId')) || 1
      });
      
      Swal.fire({
        title: editando ? 'Pago Actualizado' : 'Pago Registrado',
        text: `El pago ha sido ${editando ? 'actualizado' : 'registrado'} exitosamente`,
        icon: 'success'
      });
    } catch (error) {
      console.error('Error al procesar el pago:', error);
      Swal.fire({
        title: 'Error',
        text: error.message || 'Hubo un error al procesar el pago',
        icon: 'error'
      });
    }
};

  const handleDelete = async (id) => {
    try {
      const result = await Swal.fire({
        title: '¿Está seguro?',
        text: "El pago será eliminado",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        await comprasService.deletePagoCompra(id);
        await fetchPagos();
        
        Swal.fire({
          title: 'Eliminado',
          text: 'El pago ha sido eliminado',
          icon: 'success'
        });
      }
    } catch (error) {
      console.error('Error al eliminar pago:', error);
      Swal.fire({
        title: 'Error',
        text: 'Error al eliminar el pago',
        icon: 'error'
      });
    }
  };

  const handleEdit = (pagoToEdit) => {
    setEditando(true);
    setPago(pagoToEdit);
    setOpen(true);
  };

  const calcularTotalPagado = () => {
    // Ensure pagos exists and is an array before reducing
    if (!pagos || !Array.isArray(pagos)) {
      return 0;
    }
    // Convert result to number explicitly
    return Number(pagos.reduce((total, pago) => total + (Number(pago.monto) || 0), 0));
  };

  const calcularSaldoPendiente = () => {
    // Convert totalCompra to number and ensure it's not NaN
    const total = Number(totalCompra) || 0;
    const pagado = calcularTotalPagado();
    return total - pagado;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <Typography>Cargando pagos...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Pagos de la Compra</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleClickOpen}
          sx={{ backgroundColor: '#1976d2' }}
        >
          Nuevo Pago
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
        <Typography variant="subtitle1">
          Total Compra: Q{parseFloat(totalCompra || 0).toFixed(2)}
        </Typography>
        <Typography variant="subtitle1">
          Total Pagado: Q{calcularTotalPagado().toFixed(2)}
        </Typography>
        <Typography variant="subtitle1" sx={{ color: calcularSaldoPendiente() > 0 ? 'error.main' : 'success.main' }}>
          Saldo Pendiente: Q{calcularSaldoPendiente().toFixed(2)}
        </Typography>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#1976d2' }}>
              <TableCell sx={{ color: 'white' }}>Fecha</TableCell>
              <TableCell sx={{ color: 'white' }}>Monto</TableCell>
              <TableCell sx={{ color: 'white' }}>Tipo de Pago</TableCell>
              <TableCell sx={{ color: 'white' }}>N° Referencia</TableCell>
              <TableCell sx={{ color: 'white' }}>Estado</TableCell>
              <TableCell sx={{ color: 'white' }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pagos.map((pago) => (
              <TableRow key={pago.id_pago}>
                <TableCell>{new Date(pago.fecha_pago).toLocaleDateString()}</TableCell>
                <TableCell>Q{Number(pago.monto).toFixed(2)}</TableCell>
                <TableCell>{pago.tipo_pago}</TableCell>
                <TableCell>{pago.numero_referencia}</TableCell>
                <TableCell>
                  <Chip
                    label={pago.estado_pago}
                    color={
                      pago.estado_pago === 'COMPLETADO' ? 'success' :
                      pago.estado_pago === 'PENDIENTE' ? 'warning' : 'error'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleEdit(pago)} sx={{ color: '#1976d2' }}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(pago.id_pago)} sx={{ color: '#d32f2f' }}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#1976d2', color: 'white' }}>
          {editando ? 'Editar Pago' : 'Nuevo Pago'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              name="monto"
              label="Monto"
              type="number"
              value={pago.monto}
              onChange={handleChange}
              fullWidth
              required
              InputProps={{
                startAdornment: <InputAdornment position="start">Q</InputAdornment>,
              }}
            />

            <TextField
              name="fecha_pago"
              label="Fecha de Pago"
              type="date"
              value={pago.fecha_pago}
              onChange={handleChange}
              fullWidth
              required
              InputLabelProps={{
                shrink: true,
              }}
            />

            <TextField
              select
              name="tipo_pago"
              label="Tipo de Pago"
              value={pago.tipo_pago}
              onChange={handleChange}
              fullWidth
              required
            >
              {tiposPago.map((tipo) => (
                <MenuItem key={tipo} value={tipo}>
                  {tipo}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              name="numero_referencia"
              label="Número de Referencia"
              value={pago.numero_referencia}
              onChange={handleChange}
              fullWidth
            />

            <TextField
              select
              name="estado_pago"
              label="Estado del Pago"
              value={pago.estado_pago}
              onChange={handleChange}
              fullWidth
              required
            >
              {estadosPago.map((estado) => (
                <MenuItem key={estado} value={estado}>
                  {estado}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              name="observaciones"
              label="Observaciones"
              value={pago.observaciones}
              onChange={handleChange}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ backgroundColor: '#1976d2' }}>
            {editando ? 'Actualizar' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PagosCompra;