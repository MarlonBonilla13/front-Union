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
const estadosPago = ['PENDIENTE', 'APROBADO', 'RECHAZADO', 'ANULADO'];

const PagosCompra = ({ idCompra, totalCompra }) => {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState(false);
  const [pago, setPago] = useState({
    monto: 0,
    tipo_pago: '',
    numero_referencia: '',
    estado_pago: estadosPago[0],
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
      
      // Verificar si debemos actualizar el estado de la compra basado en los pagos existentes
      await verificarEstadoCompra(data);
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
      estado_pago: estadosPago[0],
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
      // Validar el monto del pago
      if (!pago.monto || pago.monto <= 0) {
        throw new Error('El monto del pago debe ser mayor a 0');
      }
      
      // Validar que no exceda el saldo pendiente si es un pago nuevo
      const saldoPendiente = calcularSaldoPendiente();
      if (!editando && pago.monto > saldoPendiente) {
        throw new Error('El monto del pago no puede ser mayor al saldo pendiente');
      }
      
      // Crear el pago
      await comprasService.createPagoCompra(idCompra, pago);
      
      // Verificar si este pago completa el total de la compra
      const nuevoPagoMonto = Number(pago.monto) || 0;
      const totalPagadoActual = calcularTotalPagado() + (editando ? 0 : nuevoPagoMonto);
      const compraTotal = Number(totalCompra) || 0;
      
      // Si el pago es aprobado y cubre el total, mostrar mensaje sugerido
      if (pago.estado_pago === 'APROBADO' && totalPagadoActual >= compraTotal && saldoPendiente <= nuevoPagoMonto) {
        // Este mensaje se mostrará después de que se muestre el mensaje de pago exitoso
        setTimeout(() => {
          Swal.fire({
            title: 'Sugerencia',
            text: 'Se recomienda actualizar el estado de la compra manualmente a APROBADO desde la lista de compras.',
            icon: 'info',
            confirmButtonText: 'Entendido'
          });
        }, 2000);
      }
      
      // Actualizar la lista de pagos
      await fetchPagos();
      handleClose();
      
      // Limpiar el formulario
      setPago({
        monto: 0,
        tipo_pago: '',
        numero_referencia: '',
        estado_pago: estadosPago[0],
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
  
  // Función para verificar y actualizar el estado de la compra basado en los pagos
  const verificarEstadoCompra = async (pagosData = pagos) => {
    try {
      if (!pagosData || !Array.isArray(pagosData) || pagosData.length === 0) return;
      
      // Calcular el total pagado
      const totalPagado = pagosData.reduce((sum, p) => sum + Number(p.monto || 0), 0);
      const total = Number(totalCompra) || 0;
      
      // Verificar si hay pagos con estado APROBADO
      const tieneAprobados = pagosData.some(p => p.estado_pago === 'APROBADO');
      
      // Si el saldo pendiente es 0 y hay pagos aprobados, mostrar mensaje informativo
      if (tieneAprobados && totalPagado >= total && calcularSaldoPendiente() <= 0) {
        // Mostrar mensaje informativo solo una vez
        if (!window.mensajeMostrado) {
          window.mensajeMostrado = true;
          
          setTimeout(() => {
            Swal.fire({
              title: 'Información',
              text: 'La compra ya tiene todos los pagos completados. Se recomienda actualizar el estado de la compra manualmente a APROBADO.',
              icon: 'info',
              confirmButtonText: 'Entendido'
            });
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error al verificar estado de la compra:', error);
      // No lanzamos error para que el flujo continúe
    }
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
      
      {/* Aviso sobre actualización manual del estado */}
      {calcularSaldoPendiente() <= 0 && pagos.some(p => p.estado_pago === 'APROBADO') && (
        <Box sx={{ 
          backgroundColor: '#e3f2fd', 
          p: 2, 
          mb: 3, 
          borderRadius: 1, 
          border: '1px solid #90caf9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Typography variant="body1" sx={{ fontWeight: 'medium', color: '#0d47a1' }}>
            ⚠️ Esta compra tiene sus pagos completos. Para actualizar su estado a APROBADO, vaya a la lista de compras y edite la compra manualmente.
          </Typography>
        </Box>
      )}
      
      <Box sx={{ backgroundColor: '#f5f5f5', p: 2, mb: 3, borderRadius: 1, border: '1px solid #e0e0e0' }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
          Información de estados:
        </Typography>
        <Typography variant="body2">
          • PENDIENTE: El pago está registrado pero no se ha procesado completamente.
        </Typography>
        <Typography variant="body2">
          • APROBADO: El pago ha sido verificado y aceptado.
        </Typography>
        <Typography variant="body2">
          • RECHAZADO: El pago ha sido rechazado por algún motivo.
        </Typography>
        <Typography variant="body2">
          • ANULADO: El pago ha sido anulado o cancelado.
        </Typography>
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
            {pagos.map((pago, index) => (
              <TableRow key={index}>
                <TableCell>{pago.fecha_creacion ? new Date(pago.fecha_creacion).toLocaleDateString() : 'N/A'}</TableCell>
                <TableCell>Q{Number(pago.monto).toFixed(2)}</TableCell>
                <TableCell>{pago.tipo_pago}</TableCell>
                <TableCell>{pago.numero_referencia}</TableCell>
                <TableCell>
                  <Chip
                    label={pago.estado_pago}
                    color={
                      pago.estado_pago === 'APROBADO' ? 'success' :
                      pago.estado_pago === 'PENDIENTE' ? 'warning' :
                      pago.estado_pago === 'RECHAZADO' ? 'error' : 'default'
                    }
                    size="small"
                    title={
                      pago.estado_pago === 'APROBADO' ? 'Este pago ha sido verificado y aprobado' :
                      pago.estado_pago === 'PENDIENTE' ? 'Este pago está pendiente de verificación' : 
                      pago.estado_pago === 'RECHAZADO' ? 'Este pago ha sido rechazado' :
                      'Este pago ha sido anulado'
                    }
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { 
                        opacity: 0.8,
                        boxShadow: '0 0 5px rgba(0, 0, 0, 0.2)' 
                      }
                    }}
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleEdit(pago)} sx={{ color: '#1976d2' }}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(pago.id)} sx={{ color: '#d32f2f' }}>
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
              helperText="El estado del pago se aplicará automáticamente a la compra"
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