import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Button, Typography, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Chip, Tabs, Tab,
  Card, CardContent, InputAdornment, CircularProgress, Grid, FormControl, InputLabel, Select
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Swal from 'sweetalert2';
import * as comprasService from '../../services/comprasService';
import * as proveedorService from '../../services/proveedorService';
import DetalleCompra from './DetalleCompra';
import PagosCompra from './PagosCompra';

const tiposPago = ['CONTADO', 'CREDITO'];
const estadosCompra = ['NUEVO', 'USADO'];

const Compras = () => {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [proveedores, setProveedores] = useState([]);
  const [estados, setEstados] = useState([]);
  const [detalles, setDetalles] = useState([]);
  const [selectedCompra, setSelectedCompra] = useState(null);
  const [showDetalle, setShowDetalle] = useState(false);
  const [compraForm, setCompraForm] = useState({
    id_proveedor: '',
    fecha: new Date().toISOString().split('T')[0],
    numeroFactura: '',
    tipoPago: 'CONTADO',
    estado: 'NUEVO',
    observaciones: '',
    total: 0
  });

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        // Primero cargar los proveedores
        const proveedoresResponse = await proveedorService.getProveedores();
        console.log('Proveedores cargados:', proveedoresResponse);
        
        // Filtrar solo proveedores activos
        const proveedoresActivos = proveedoresResponse.filter(p => p.estado === true);
        setProveedores(proveedoresActivos);

        // Luego cargar las compras
        const comprasResponse = await comprasService.getCompras();
        setCompras(comprasResponse);
        
      } catch (error) {
        console.error('Error al cargar datos:', error);
        Swal.fire({
          title: 'Error',
          text: 'No se pudieron cargar los datos',
          icon: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const getFilteredCompras = () => {
    let filtered = compras;
    
    // Filtrar por estado
    switch (selectedTab) {
      case 0:
        filtered = filtered.filter(c => c.estado !== 'CANCELADA');
        break;
      case 1:
        filtered = filtered.filter(c => c.estado === 'CANCELADA');
        break;
    }

    // Aplicar filtro de búsqueda
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(compra => 
        (compra.numero_factura?.toLowerCase() || '').includes(searchLower) ||
        (compra.proveedor?.nombre?.toLowerCase() || '').includes(searchLower)
      );
    }

    return filtered;
  };

  const handleClickOpen = () => {
    setIsEditing(false);
    setCompraForm({
      id_proveedor: '',
      fecha: new Date().toISOString().split('T')[0],
      numeroFactura: '',
      tipoPago: 'CONTADO',
      estado: 'NUEVO',
      observaciones: '',
      total: 0
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!compraForm.id_proveedor) {
        throw new Error('Debe seleccionar un proveedor');
      }

      const compraData = {
        ...compraForm,
        id_proveedor: compraForm.id_proveedor, // Asegurarse de que se envíe el ID correcto
        detalles: detalles.map(detalle => ({
          idMaterial: detalle.idMaterial,
          cantidad: detalle.cantidad,
          precioUnitario: detalle.precioUnitario,
          iva: detalle.iva,
          descuento: detalle.descuento
        }))
      };

      console.log('Datos de compra a enviar:', compraData);

      if (isEditing) {
        await comprasService.updateCompra(compraForm.id, compraData);
        Swal.fire('Éxito', 'Compra actualizada correctamente', 'success');
      } else {
        await comprasService.createCompra(compraData);
        Swal.fire('Éxito', 'Compra creada correctamente', 'success');
      }

      handleCloseDialog();
      const updatedCompras = await comprasService.getCompras();
      setCompras(updatedCompras);
    } catch (error) {
      console.error('Error al guardar compra:', error);
      Swal.fire('Error', error.message || 'No se pudo guardar la compra', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      const result = await Swal.fire({
        title: '¿Está seguro?',
        text: "La compra será cancelada",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, cancelar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        await comprasService.updateCompra(id, { estado: 'CANCELADA' });
        await fetchCompras();
        
        Swal.fire({
          title: 'Cancelada',
          text: 'La compra ha sido cancelada',
          icon: 'success'
        });
      }
    } catch (error) {
      console.error('Error al cancelar compra:', error);
      Swal.fire({
        title: 'Error',
        text: 'Error al cancelar la compra',
        icon: 'error'
      });
    }
  };

  const handleEdit = (compraToEdit) => {
    setIsEditing(true);
    setCompraForm(compraToEdit);
    setOpenDialog(true);
  };

  const handleViewDetails = (compra) => {
    setSelectedCompra(compra);
    setShowDetalle(true);
  };

  const handleCloseDetails = () => {
    setSelectedCompra(null);
    setShowDetalle(false);
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: 'calc(100vh - 100px)',
        mt: 8 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, mt: 8 }}>
      <Card sx={{ width: '100%', boxShadow: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" component="h2" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
              Lista de Compras
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleClickOpen}
              sx={{ backgroundColor: '#1976d2' }}
            >
              Nueva Compra
            </Button>
          </Box>

          <TextField
            fullWidth
            variant="outlined"
            placeholder="Buscar por número de factura o proveedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ mb: 2 }}>
            <Tabs
              value={selectedTab}
              onChange={handleTabChange}
              sx={{
                '& .MuiTab-root': {
                  minWidth: 'auto',
                  px: 2,
                  py: 1,
                  backgroundColor: '#f5f5f5',
                  '&.Mui-selected': {
                    backgroundColor: '#fff',
                    color: '#1976d2'
                  }
                },
                '& .MuiTabs-indicator': { display: 'none' }
              }}
            >
              <Tab 
                label="ACTIVAS" 
                value={0}
                sx={{ 
                  borderTopLeftRadius: 4,
                  borderBottomLeftRadius: 4,
                  mr: 1
                }}
              />
              <Tab 
                label="CANCELADAS" 
                value={1}
                sx={{ 
                  borderTopRightRadius: 4,
                  borderBottomRightRadius: 4
                }}
              />
            </Tabs>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#1976d2' }}>
                  <TableCell sx={{ color: 'white' }}>N° Factura</TableCell>
                  <TableCell sx={{ color: 'white' }}>Proveedor</TableCell>
                  <TableCell sx={{ color: 'white' }}>Fecha</TableCell>
                  <TableCell sx={{ color: 'white' }}>Total</TableCell>
                  <TableCell sx={{ color: 'white' }}>Estado</TableCell>
                  <TableCell sx={{ color: 'white' }}>Tipo Pago</TableCell>
                  <TableCell sx={{ color: 'white' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredCompras().map((compra) => (
                  <TableRow key={compra.id_compras}>
                    <TableCell>{compra.numero_factura}</TableCell>
                    <TableCell>{compra.proveedor?.nombre}</TableCell>
                    <TableCell>{new Date(compra.fecha_compra).toLocaleDateString()}</TableCell>
                    <TableCell>${compra.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={compra.estado} 
                        color={compra.estado === 'CANCELADA' ? 'error' : 'success'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>{compra.tipo_pago}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleEdit(compra)} sx={{ color: '#1976d2' }}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(compra.id_compras)} sx={{ color: '#d32f2f' }}>
                        <DeleteIcon />
                      </IconButton>
                      <IconButton size="small" sx={{ color: '#2e7d32' }} onClick={() => handleViewDetails(compra)}>
                        <VisibilityIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{isEditing ? 'Editar Compra' : 'Nueva Compra'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Proveedor</InputLabel>
                  <Select
                    value={compraForm.id_proveedor}
                    onChange={(e) => setCompraForm({ ...compraForm, id_proveedor: e.target.value })}
                    label="Proveedor"
                  >
                    {proveedores.map((proveedor) => (
                      <MenuItem 
                        key={proveedor.id_proveedores} 
                        value={proveedor.id_proveedores}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography>{proveedor.nombre}</Typography>
                          <Typography sx={{ color: 'text.secondary', fontSize: '0.9em' }}>
                            ({proveedor.ruc})
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Número de Factura"
                  value={compraForm.numeroFactura}
                  onChange={(e) => setCompraForm({ ...compraForm, numeroFactura: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Fecha"
                  type="date"
                  value={compraForm.fecha}
                  onChange={(e) => setCompraForm({ ...compraForm, fecha: e.target.value })}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Pago</InputLabel>
                  <Select
                    value={compraForm.tipoPago}
                    onChange={(e) => setCompraForm({ ...compraForm, tipoPago: e.target.value })}
                    label="Tipo de Pago"
                    required
                  >
                    {tiposPago.map((tipo) => (
                      <MenuItem key={tipo} value={tipo}>
                        {tipo}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={compraForm.estado}
                    onChange={(e) => setCompraForm({ ...compraForm, estado: e.target.value })}
                    label="Estado"
                    required
                  >
                    {estadosCompra.map((estado) => (
                      <MenuItem key={estado} value={estado}>
                        {estado}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Observaciones"
                  value={compraForm.observaciones}
                  onChange={(e) => setCompraForm({ ...compraForm, observaciones: e.target.value })}
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
              <DetalleCompra
                idCompra={compraForm.id}
                detalles={detalles}
                onDetallesChange={setDetalles}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {isEditing ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showDetalle} onClose={handleCloseDetails} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#1976d2', color: 'white' }}>
          Detalles de la Compra
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedCompra && (
            <Box>
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(2, 1fr)', mb: 3 }}>
                <Typography variant="subtitle1">
                  <strong>N° Factura:</strong> {selectedCompra.numero_factura}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>Proveedor:</strong> {selectedCompra.proveedor?.nombre}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>Fecha:</strong> {new Date(selectedCompra.fecha_compra).toLocaleDateString()}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>Estado:</strong> {selectedCompra.estado}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>Tipo de Pago:</strong> {selectedCompra.tipo_pago}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>Total:</strong> ${selectedCompra.total.toFixed(2)}
                </Typography>
                {selectedCompra.observaciones && (
                  <Typography variant="subtitle1" sx={{ gridColumn: '1 / -1' }}>
                    <strong>Observaciones:</strong> {selectedCompra.observaciones}
                  </Typography>
                )}
              </Box>

              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Materiales
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#1976d2' }}>
                        <TableCell sx={{ color: 'white' }}>Material</TableCell>
                        <TableCell sx={{ color: 'white' }}>Cantidad</TableCell>
                        <TableCell sx={{ color: 'white' }}>Precio Unitario</TableCell>
                        <TableCell sx={{ color: 'white' }}>Subtotal</TableCell>
                        <TableCell sx={{ color: 'white' }}>IVA</TableCell>
                        <TableCell sx={{ color: 'white' }}>Descuento</TableCell>
                        <TableCell sx={{ color: 'white' }}>Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedCompra.detalles?.map((detalle, index) => (
                        <TableRow key={index}>
                          <TableCell>{detalle.material?.nombre}</TableCell>
                          <TableCell>{detalle.cantidad}</TableCell>
                          <TableCell>${detalle.precio_unitario.toFixed(2)}</TableCell>
                          <TableCell>${detalle.subtotal.toFixed(2)}</TableCell>
                          <TableCell>${detalle.iva_monto.toFixed(2)}</TableCell>
                          <TableCell>${detalle.descuento_monto.toFixed(2)}</TableCell>
                          <TableCell>${detalle.total.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              <PagosCompra
                idCompra={selectedCompra.id_compras}
                totalCompra={selectedCompra.total}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Compras; 