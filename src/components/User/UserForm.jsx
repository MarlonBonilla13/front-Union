import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { createUser, getUserById, updateUser } from '../../services/userService';
import Swal from 'sweetalert2';

const UserForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    apellido: '',
    isActive: true,
    role: 'user'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      loadUser();
    }
  }, [id]);

  const loadUser = async () => {
    try {
      setIsLoading(true);
      const userData = await getUserById(id);
      setFormData({
        ...userData,
        password: '' // No mostramos la contraseña por seguridad
      });
    } catch (error) {
      console.error('Error al cargar usuario:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cargar la información del usuario',
        confirmButtonColor: '#d33'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar campos requeridos según el DTO del backend
    if (!formData.email || !formData.password || !formData.fullName || !formData.apellido) {
      Swal.fire({
        icon: 'error',
        title: 'Campos requeridos',
        text: 'Por favor complete todos los campos obligatorios (email, contraseña, nombre y apellido)',
        confirmButtonColor: '#d33'
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const confirmResult = await Swal.fire({
        title: `¿Está seguro de ${isEditMode ? 'actualizar' : 'crear'} este usuario?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: isEditMode ? '¡Sí, actualizar!' : '¡Sí, crear!',
        cancelButtonText: 'Cancelar'
      });

      if (confirmResult.isConfirmed) {
        // Campos del DTO
        const userData = {
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          apellido: formData.apellido,
          role: formData.role
        };

        const result = isEditMode 
          ? await updateUser(id, userData)
          : await createUser(userData);

        setIsSaved(true);
        await Swal.fire({
          icon: 'success',
          title: '¡Operación exitosa!',
          text: isEditMode 
            ? 'Usuario actualizado correctamente'
            : 'Usuario creado correctamente',
          confirmButtonColor: '#28a745'
        });

        navigate('/usuarios');
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un problema al procesar la solicitud',
        confirmButtonColor: '#d33'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && isEditMode) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flexGrow: 1,
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
        p: 3
      }}
    >
      <Container maxWidth="md">
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4,
            borderRadius: 2,
            border: "1px solid #64B5F6"
          }}
        >
          <Typography
            variant="h5"
            align="center"
            sx={{
              mb: 3,
              fontWeight: 600,
              color: '#1976d2',
              fontFamily: 'Arial',
              borderBottom: '2px solid #64B5F6',
              pb: 2
            }}
          >
            {isEditMode ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
          </Typography>

          {isEditMode && (
            <Box sx={{ mb: 3 }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/usuarios')}
                sx={{ 
                  fontWeight: 'bold',
                  backgroundColor: '#4CAF50',
                  '&:hover': {
                    backgroundColor: '#45a049'
                  }
                }}
              >
                Regresar a la lista
              </Button>
            </Box>
          )}

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'grid', gap: 3 }}>
              <TextField
                required
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />

              <TextField
                required={!isEditMode}
                label="Contraseña"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                helperText={isEditMode ? "Dejar en blanco para mantener la contraseña actual" : ""}
              />

              <TextField
                required
                label="Nombre Completo"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />

              <TextField
                label="Apellido"
                value={formData.apellido}
                onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
              />

              <FormControl>
                <InputLabel>Rol</InputLabel>
                <Select
                  value={formData.role}
                  label="Rol"
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <MenuItem value="user">Usuario</MenuItem>
                  <MenuItem value="admin">Administrador</MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Usuario Activo"
              />

              <Button
                type="submit"
                variant="contained"
                color={isSaved ? "success" : "primary"}
                disabled={isLoading}
                sx={{ 
                  mt: 2,
                  py: 1.5,
                  fontWeight: 'bold',
                  backgroundColor: isSaved ? '#4CAF50' : '#2196F3',
                  '&:hover': {
                    backgroundColor: isSaved ? '#45a049' : '#1976D2'
                  }
                }}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  isEditMode ? "Actualizar Usuario" : "Crear Usuario"
                )}
              </Button>
            </Box>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default UserForm;