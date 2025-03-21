import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  CircularProgress
} from '@mui/material';
// Actualizar la ruta del logo
import logoUnion from '../../assets/Logo Union.png';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { login } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!credentials.email || !credentials.password) {
      Swal.fire({
        icon: 'error',
        title: 'Campos requeridos',
        text: 'Por favor ingrese email y contraseña',
        confirmButtonColor: '#d33'
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await login(credentials);
      console.log('Respuesta del servidor:', response);
      
      // Validar la respuesta del servidor
      if (!response || !response.token || !response.user) {
        throw new Error('Respuesta del servidor inválida');
      }

      // Guardar el usuario en el contexto
      setUser(response.user);
      
      await Swal.fire({
        icon: 'success',
        title: '¡Bienvenido!',
        text: 'Has iniciado sesión correctamente',
        timer: 1500,
        showConfirmButton: false
      });

      // Redirigir según el rol
      switch (response.user.role) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'user':
          navigate('/user/dashboard');
          break;
        default:
          throw new Error('Rol no reconocido');
      }
    } catch (error) {
      console.error('Error detallado:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      
      let errorMessage = 'Credenciales incorrectas';
      if (error.response) {
        switch (error.response.status) {
          case 401:
            errorMessage = 'Usuario o contraseña incorrectos';
            break;
          case 404:
            errorMessage = 'Servicio no disponible';
            break;
          case 500:
            errorMessage = 'Error en el servidor';
            break;
          default:
            errorMessage = error.response.data?.message || 'Error de autenticación';
        }
      }

      Swal.fire({
        icon: 'error',
        title: 'Error de autenticación',
        text: errorMessage,
        confirmButtonColor: '#d33'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2, border: "1px solid #64B5F6" }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <img 
                src={logoUnion}
                alt="Logo Union"
                style={{
                  width: '150px',
                  height: 'auto',
                  marginBottom: '15px',
                  filter: 'drop-shadow(0 0 20px rgba(33,150,243,0.6))',
                }}
              />
            </Box>
            <Typography
              variant="h5"
              align="center"
              sx={{
                fontWeight: 600,
                color: '#1976d2',
                fontFamily: 'Arial',
                borderBottom: '2px solid #64B5F6',
                pb: 2,
                width: '100%'
              }}
            >
              Sistema de Control Administrativo
            </Typography>
          </Box>
          
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'grid', gap: 3 }}>
              <TextField
                required
                label="Correo"
                type="email"
                value={credentials.email}
                onChange={(e) => setCredentials({
                  ...credentials,
                  email: e.target.value
                })}
                fullWidth
              />

              <TextField
                required
                label="Contraseña"
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({
                  ...credentials,
                  password: e.target.value
                })}
                fullWidth
              />

              <Button
                type="submit"
                variant="contained"
                disabled={isLoading}
                sx={{
                  py: 1.5,
                  mt: 2,
                  fontWeight: 'bold',
                  backgroundColor: '#2196F3',
                  '&:hover': {
                    backgroundColor: '#1976D2'
                  }
                }}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </Box>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;