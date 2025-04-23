import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Button, Typography, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, FormControlLabel, Switch,
  MenuItem, Chip, CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreIcon from '@mui/icons-material/Restore';
import Swal from 'sweetalert2';
import * as proveedorService from '../../services/proveedorService';

const tiposProveedor = [
  'Mayorista',
  'Minorista',
  'Fabricante',
  'Distribuidor',
  'Otro'
];

const Proveedores = () => {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState(false);
  const [proveedor, setProveedor] = useState({
    ruc: '',
    nombre: '',
    contacto: '',
    telefono: '',
    correo: '',
    direccion: '',
    tipo_proveedor: '',
    estado: true,
    notas: ''
  });

  useEffect(() => {
    fetchProveedores();
  }, []);

  const fetchProveedores = async () => {
    try {
      setLoading(true);
      const data = await proveedorService.getProveedores();
      setProveedores(data);
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudieron cargar los proveedores',
        icon: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClickOpen = () => {
    setEditando(false);
    setProveedor({
      ruc: '',
      nombre: '',
      contacto: '',
      telefono: '',
      correo: '',
      direccion: '',
      tipo_proveedor: '',
      estado: true,
      notas: ''
    });
    setOpen(true);
  };

  const handleEdit = (proveedorToEdit) => {
    setEditando(true);
    setProveedor(proveedorToEdit);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleChange = (event) => {
    const { name, value, checked } = event.target;
    setProveedor({
      ...proveedor,
      [name]: name === 'estado' ? checked : value
    });
  };

  const handleSubmit = async () => {
    try {
      if (editando) {
        await proveedorService.updateProveedor(proveedor.id_proveedores, proveedor);
      } else {
        await proveedorService.createProveedor(proveedor);
      }
      
      await fetchProveedores();
      handleClose();
      
      Swal.fire({
        title: editando ? 'Proveedor Actualizado' : 'Proveedor Registrado',
        text: `El proveedor ${proveedor.nombre} ha sido ${editando ? 'actualizado' : 'registrado'} exitosamente`,
        icon: 'success'
      });
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'Hubo un error al procesar la operación',
        icon: 'error'
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      const result = await Swal.fire({
        title: '¿Está seguro?',
        text: "Esta acción no se puede revertir",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        await proveedorService.deleteProveedor(id);
        await fetchProveedores();
        Swal.fire({
          title: 'Eliminado',
          text: 'El proveedor ha sido eliminado',
          icon: 'success'
        });
      }
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo eliminar el proveedor',
        icon: 'error'
      });
    }
  };

  const handleReactivate = async (id) => {
    try {
      await proveedorService.reactivateProveedor(id);
      await fetchProveedores();
      Swal.fire({
        title: 'Reactivado',
        text: 'El proveedor ha sido reactivado',
        icon: 'success'
      });
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo reactivar el proveedor',
        icon: 'error'
      });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, mt: 8 }}> {/* Add margin top */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
          Gestión de Proveedores
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleClickOpen}
          sx={{ backgroundColor: '#1976d2' }}
        >
          Nuevo Proveedor
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#1976d2' }}>
              <TableCell sx={{ color: 'white' }}>RUC</TableCell>
              <TableCell sx={{ color: 'white' }}>Nombre</TableCell>
              <TableCell sx={{ color: 'white' }}>Contacto</TableCell>
              <TableCell sx={{ color: 'white' }}>Teléfono</TableCell>
              <TableCell sx={{ color: 'white' }}>Correo</TableCell>
              <TableCell sx={{ color: 'white' }}>Tipo</TableCell>
              <TableCell sx={{ color: 'white' }}>Estado</TableCell>
              <TableCell sx={{ color: 'white' }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {proveedores.map((prov) => (
              <TableRow key={prov.id_proveedores}>
                <TableCell>{prov.ruc}</TableCell>
                <TableCell>{prov.nombre}</TableCell>
                <TableCell>{prov.contacto}</TableCell>
                <TableCell>{prov.telefono}</TableCell>
                <TableCell>{prov.correo}</TableCell>
                <TableCell>{prov.tipo_proveedor}</TableCell>
                <TableCell>
                  <Chip 
                    label={prov.estado ? "Activo" : "Inactivo"}
                    color={prov.estado ? "success" : "error"}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton 
                    size="small" 
                    onClick={() => handleEdit(prov)}
                    sx={{ color: '#1976d2' }}
                  >
                    <EditIcon />
                  </IconButton>
                  {prov.estado ? (
                    <IconButton 
                      size="small" 
                      onClick={() => handleDelete(prov.id_proveedores)}
                      sx={{ color: '#d32f2f' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  ) : (
                    <IconButton 
                      size="small" 
                      onClick={() => handleReactivate(prov.id_proveedores)}
                      sx={{ color: '#2e7d32' }}
                    >
                      <RestoreIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#1976d2', color: 'white' }}>
          {editando ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(2, 1fr)', mt: 2 }}>
            <TextField
              name="ruc"
              label="RUC"
              value={proveedor.ruc}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              name="nombre"
              label="Nombre"
              value={proveedor.nombre}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              name="contacto"
              label="Contacto"
              value={proveedor.contacto}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              name="telefono"
              label="Teléfono"
              value={proveedor.telefono}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              name="correo"
              label="Correo"
              type="email"
              value={proveedor.correo}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              name="direccion"
              label="Dirección"
              value={proveedor.direccion}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              select
              name="tipo_proveedor"
              label="Tipo de Proveedor"
              value={proveedor.tipo_proveedor}
              onChange={handleChange}
              fullWidth
              required
            >
              {tiposProveedor.map((tipo) => (
                <MenuItem key={tipo} value={tipo}>
                  {tipo}
                </MenuItem>
              ))}
            </TextField>
            <FormControlLabel
              control={
                <Switch
                  checked={proveedor.estado}
                  onChange={handleChange}
                  name="estado"
                  color="primary"
                />
              }
              label="Activo"
            />
            <TextField
              name="notas"
              label="Notas"
              value={proveedor.notas}
              onChange={handleChange}
              multiline
              rows={4}
              fullWidth
              sx={{ gridColumn: '1 / -1' }}
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

export default Proveedores;