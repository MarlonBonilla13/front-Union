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
// Add uploadClienteLogo to the imports
import { createCliente, updateCliente, getClienteById, uploadClienteLogo } from '../../services/clienteService';
// Remove notistack import
// import { useSnackbar } from 'notistack';
import Swal from 'sweetalert2'; // Import SweetAlert2 instead
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { styled } from '@mui/material/styles';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const API_BASE_URL = 'http://localhost:4001';

const getImageUrl = (imagePath) => {
  if (!imagePath) {
    console.log('No hay ruta de imagen');
    return null;
  }
  
  // Si la URL ya es absoluta (comienza con http)
  if (imagePath.startsWith('http')) {
    // Extraer el nombre del archivo de la URL completa
    const matches = imagePath.match(/\/uploads\/clientes\/(.*?)$/);
    if (matches && matches[1]) {
      const fileName = matches[1].replace(/^uploads\/clientes\//, '');
      const url = `${API_BASE_URL}/uploads/clientes/${fileName}`;
      console.log('URL procesada:', url);
      return url;
    }
    return imagePath;
  }

  // Si es una ruta relativa
  const cleanPath = imagePath
    .replace(/^\/+|\/+$/g, '')
    .replace(/^uploads\/clientes\/uploads\/clientes\//, 'uploads/clientes/')
    .replace(/^uploads\/clientes\//, '');
  
  const url = `${API_BASE_URL}/uploads/clientes/${cleanPath}`;
  console.log('URL construida:', url);
  return url;
};

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
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (clienteId) {
      setIsEditing(true);
      loadCliente(clienteId);
    } else {
      setIsEditing(false);
      setCliente(initialState);
      setPreviewUrl('');
      setSelectedFile(null);
    }
  }, [clienteId]);

  const loadCliente = async (id) => {
    setLoading(true);
    try {
      const data = await getClienteById(id);
      console.log('Datos del cliente recibidos:', data);
      setCliente(data);
      if (data.imagen_url) {
        console.log('Imagen URL recibida:', data.imagen_url);
        const imageUrl = getImageUrl(data.imagen_url);
        setPreviewUrl(imageUrl);
      }
    } catch (error) {
      console.error("Error detallado al cargar cliente:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al cargar datos del cliente'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log('Archivo seleccionado:', {
        name: file.name,
        type: file.type,
        size: file.size
      });
      
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        const fileUrl = URL.createObjectURL(file);
        console.log('URL de preview creada:', fileUrl);
        setPreviewUrl(fileUrl);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Por favor seleccione un archivo de imagen válido (PNG, JPG, JPEG)'
        });
      }
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
        const updateResponse = await updateCliente(clienteId, cliente);
        console.log('Respuesta de actualización:', updateResponse);
        
        if (selectedFile) {
          try {
            console.log('Subiendo logo...', {
              clienteId,
              fileName: selectedFile.name
            });
            const logoResponse = await uploadClienteLogo(clienteId, selectedFile);
            console.log('Respuesta de subida de logo:', logoResponse);
          } catch (logoError) {
            console.error('Error detallado al subir logo:', logoError);
            throw new Error(`Error al subir el logo: ${logoError.message}`);
          }
        }
      } else {
        const response = await createCliente(cliente);
        console.log('Cliente creado:', response);
        
        if (selectedFile && response.id_cliente) {
          try {
            console.log('Subiendo logo para nuevo cliente...', {
              clienteId: response.id_cliente,
              fileName: selectedFile.name
            });
            const logoResponse = await uploadClienteLogo(response.id_cliente, selectedFile);
            console.log('Respuesta de subida de logo:', logoResponse);
          } catch (logoError) {
            console.error('Error al subir logo:', logoError);
          }
        }
      }

      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: `Cliente ${isEditing ? 'actualizado' : 'registrado'} exitosamente`
      });
      
      if (onSave) onSave();
    } catch (error) {
      console.error('Error detallado al guardar:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Error al guardar el cliente';
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMsg
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
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        {isEditing ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Logo preview */}
              <Box
                sx={{
                  width: 150,
                  height: 150,
                  border: '2px dashed #ccc',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Logo preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain'
                    }}
                    onError={(e) => {
                      console.error('Error cargando preview:', {
                        url: previewUrl
                      });
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    Sin logo
                  </Typography>
                )}
              </Box>
              
              <Button
                component="label"
                variant="contained"
                startIcon={<CloudUploadIcon />}
                sx={{ mb: 2 }}
              >
                Subir Logo
                <VisuallyHiddenInput
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </Button>
            </Box>
          </Grid>

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