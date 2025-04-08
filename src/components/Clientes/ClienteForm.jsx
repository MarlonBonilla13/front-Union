import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Grid,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Switch,
  FormControlLabel,
  Divider,
  CircularProgress
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { createCliente, updateCliente, getClienteById } from '../../services/clienteService';
// Remove notistack import
// import { useSnackbar } from 'notistack';
import Swal from 'sweetalert2'; // Import SweetAlert2 instead

const ClienteForm = ({ clienteId, onSave, onCancel }) => {
  const initialState = {
    nombre: '',
    apellido: '',
    telefono: '',
    correo: '',
    lugar: '',
    direccion: '',
    tipo_cliente: 'Regular',
    nombre_comercial: '',
    estado: true,
    terminos_pago: ''
  };

  const [cliente, setCliente] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  // Remove notistack hook
  // const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (clienteId) {
      setIsEditing(true);
      loadCliente(clienteId);
    } else {
      setIsEditing(false);
      setCliente(initialState);
    }
  }, [clienteId]);

  const loadCliente = async (id) => {
    setLoading(true);
    try {
      const data = await getClienteById(id);
      setCliente(data);
    } catch (error) {
      // Replace notistack with SweetAlert2
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al cargar datos del cliente'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    const newValue = name === 'estado' ? checked : value;
    
    setCliente({
      ...cliente,
      [name]: newValue
    });
    
    // Limpiar error cuando se edita el campo
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!cliente.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!cliente.apellido.trim()) newErrors.apellido = 'El apellido es requerido';
    if (!cliente.telefono.trim()) newErrors.telefono = 'El teléfono es requerido';
    if (!cliente.correo.trim()) newErrors.correo = 'El correo es requerido';
    else if (!/\S+@\S+\.\S+/.test(cliente.correo)) newErrors.correo = 'Formato de correo inválido';
    if (!cliente.lugar.trim()) newErrors.lugar = 'El lugar es requerido';
    if (!cliente.direccion.trim()) newErrors.direccion = 'La dirección es requerida';
    if (!cliente.tipo_cliente.trim()) newErrors.tipo_cliente = 'El tipo de cliente es requerido';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      if (isEditing) {
        await updateCliente(clienteId, cliente);
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Cliente actualizado exitosamente'
        });
      } else {
        await createCliente(cliente);
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Cliente registrado exitosamente'
        });
      }
      
      if (onSave) onSave();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Error al guardar el cliente';
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMsg
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        {isEditing ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Nombre"
              name="nombre"
              value={cliente.nombre}
              onChange={handleChange}
              error={!!errors.nombre}
              helperText={errors.nombre}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Apellido"
              name="apellido"
              value={cliente.apellido}
              onChange={handleChange}
              error={!!errors.apellido}
              helperText={errors.apellido}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Teléfono"
              name="telefono"
              value={cliente.telefono}
              onChange={handleChange}
              error={!!errors.telefono}
              helperText={errors.telefono}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Correo Electrónico"
              name="correo"
              type="email"
              value={cliente.correo}
              onChange={handleChange}
              error={!!errors.correo}
              helperText={errors.correo}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Lugar"
              name="lugar"
              value={cliente.lugar}
              onChange={handleChange}
              error={!!errors.lugar}
              helperText={errors.lugar}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="normal" error={!!errors.tipo_cliente}>
              <InputLabel id="tipo-cliente-label">Tipo de Cliente</InputLabel>
              <Select
                labelId="tipo-cliente-label"
                name="tipo_cliente"
                value={cliente.tipo_cliente}
                onChange={handleChange}
                label="Tipo de Cliente"
              >
                <MenuItem value="Regular">Nuevo Cliente</MenuItem>
                <MenuItem value="Frecuente">Cliente Frecuente</MenuItem>
                <MenuItem value="Fiel">Cliente Fiel</MenuItem>
              </Select>
              {errors.tipo_cliente && <FormHelperText>{errors.tipo_cliente}</FormHelperText>}
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="Dirección"
              name="direccion"
              value={cliente.direccion}
              onChange={handleChange}
              error={!!errors.direccion}
              helperText={errors.direccion}
              multiline
              rows={2}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Nombre Comercial"
              name="nombre_comercial"
              value={cliente.nombre_comercial || ''}
              onChange={handleChange}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Términos de Pago"
              name="terminos_pago"
              value={cliente.terminos_pago || ''}
              onChange={handleChange}
              margin="normal"
            />
          </Grid>
          
          {isEditing && (
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={cliente.estado}
                    onChange={handleChange}
                    name="estado"
                    color="primary"
                  />
                }
                label={cliente.estado ? "Cliente Activo" : "Cliente Inactivo"}
              />
            </Grid>
          )}
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={onCancel}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                color="primary"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : isEditing ? 'Actualizar' : 'Guardar'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default ClienteForm;