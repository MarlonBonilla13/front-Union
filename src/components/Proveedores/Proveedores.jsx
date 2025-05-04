import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Button, Typography, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, FormControlLabel, Switch,
  MenuItem, Chip, Avatar, Input, CircularProgress, Tabs, Tab, Card, CardContent
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreIcon from '@mui/icons-material/Restore';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
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
  const [selectedFile, setSelectedFile] = useState(null);
  const [tabValue, setTabValue] = useState('ACTIVOS');
  const [proveedor, setProveedor] = useState({
    ruc: '',
    nombre: '',
    contacto: '',
    telefono: '',
    correo: '',
    direccion: '',
    tipo_proveedor: '',
    estado: true,
    notas: '',
    imagen_url: null
  });

  useEffect(() => {
    fetchProveedores();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getFilteredProveedores = () => {
    switch (tabValue) {
      case 'ACTIVOS':
        return proveedores.filter(p => p.estado);
      case 'INACTIVOS':
        return proveedores.filter(p => !p.estado);
      default:
        return proveedores;
    }
  };

  const fetchProveedores = async () => {
    try {
      setLoading(true);
      const data = await proveedorService.getProveedores();
      console.log('Proveedores cargados:', data);
      setProveedores(data);
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
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
    setSelectedFile(null);
    setProveedor({
      ruc: '',
      nombre: '',
      contacto: '',
      telefono: '',
      correo: '',
      direccion: '',
      tipo_proveedor: '',
      estado: true,
      notas: '',
      imagen_url: null
    });
    setOpen(true);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleImageUpload = async (proveedorId) => {
    if (selectedFile) {
      try {
        await proveedorService.uploadProveedorImage(proveedorId, selectedFile);
        await fetchProveedores(); // Recargar para obtener la nueva URL de la imagen
      } catch (error) {
        console.error('Error al subir la imagen:', error);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo subir la imagen',
          icon: 'error'
        });
      }
    }
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
      let response;
      if (editando) {
        response = await proveedorService.updateProveedor(proveedor.id_proveedores, proveedor);
      } else {
        response = await proveedorService.createProveedor(proveedor);
      }

      if (selectedFile) {
        await handleImageUpload(response.id_proveedores);
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
        text: "El proveedor será marcado como inactivo",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, desactivar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        await proveedorService.updateProveedor(id, {
          estado: false
        });
        
        await fetchProveedores();
        Swal.fire({
          title: 'Desactivado',
          text: 'El proveedor ha sido desactivado',
          icon: 'success'
        });
      }
    } catch (error) {
      console.error('Error al desactivar proveedor:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo desactivar el proveedor',
        icon: 'error'
      });
    }
  };

  const handleReactivate = async (id) => {
    try {
      const result = await Swal.fire({
        title: '¿Está seguro?',
        text: "El proveedor será reactivado",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#2e7d32',
        cancelButtonColor: '#d32f2f',
        confirmButtonText: 'Sí, reactivar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        await proveedorService.updateProveedor(id, {
          estado: true
        });
        
        await fetchProveedores();
        Swal.fire({
          title: 'Reactivado',
          text: 'El proveedor ha sido reactivado',
          icon: 'success'
        });
      }
    } catch (error) {
      console.error('Error al reactivar proveedor:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo reactivar el proveedor',
        icon: 'error'
      });
    }
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
              Lista de Proveedores
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

          <Box sx={{ mb: 2 }}>
            <Tabs
              value={tabValue}
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
                label="ACTIVOS" 
                value="ACTIVOS"
                sx={{ 
                  borderTopLeftRadius: 4,
                  borderBottomLeftRadius: 4,
                  mr: 1
                }}
              />
              <Tab 
                label="INACTIVOS" 
                value="INACTIVOS"
                sx={{ mr: 1 }}
              />
              <Tab 
                label="TODOS" 
                value="TODOS"
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
                  <TableCell sx={{ color: 'white' }}>Nit</TableCell>
                  <TableCell sx={{ color: 'white', width: 100 }}>Logo</TableCell>
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
                {getFilteredProveedores().map((prov) => (
                  <TableRow key={prov.id_proveedores}>
                    <TableCell>{prov.ruc}</TableCell>
                    <TableCell>
                      {prov.imagen_url ? (
                        <Box
                          component="img"
                          src={prov.imagen_url}
                          alt={prov.nombre}
                          onError={(e) => {
                            console.error('Error al cargar imagen:', prov.imagen_url);
                            e.target.src = '';
                            e.target.alt = prov.nombre.charAt(0);
                          }}
                          sx={{
                            width: 50,
                            height: 50,
                            objectFit: 'contain',
                            borderRadius: 1,
                            border: '1px solid #e0e0e0'
                          }}
                        />
                      ) : (
                        <Avatar
                          sx={{
                            width: 50,
                            height: 50,
                            bgcolor: '#1976d2'
                          }}
                          variant="rounded"
                        >
                          {prov.nombre.charAt(0)}
                        </Avatar>
                      )}
                    </TableCell>
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
        </CardContent>
      </Card>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#1976d2', color: 'white' }}>
          {editando ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(2, 1fr)', mt: 2 }}>
            <Box sx={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
              {(selectedFile || proveedor.imagen_url) ? (
                <Box
                  component="img"
                  src={selectedFile ? URL.createObjectURL(selectedFile) : proveedor.imagen_url}
                  alt={proveedor.nombre || 'Logo preview'}
                  onError={(e) => {
                    console.error('Error al cargar imagen en preview:', e);
                    e.target.style.display = 'none';
                  }}
                  sx={{
                    width: 150,
                    height: 150,
                    objectFit: 'contain',
                    borderRadius: 1,
                    border: '1px solid #e0e0e0',
                    mb: 2
                  }}
                />
              ) : (
                <Avatar
                  sx={{
                    width: 150,
                    height: 150,
                    bgcolor: '#1976d2',
                    mb: 2
                  }}
                  variant="rounded"
                >
                  <AddPhotoAlternateIcon sx={{ fontSize: 60 }} />
                </Avatar>
              )}
              <Input
                type="file"
                onChange={handleFileChange}
                sx={{ display: 'none' }}
                id="logo-upload"
                accept="image/*"
              />
              <label htmlFor="logo-upload">
                <Button
                  component="span"
                  startIcon={<AddPhotoAlternateIcon />}
                  variant="outlined"
                  size="small"
                >
                  {editando ? 'Cambiar Logo' : 'Subir Logo'}
                </Button>
              </label>
            </Box>

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