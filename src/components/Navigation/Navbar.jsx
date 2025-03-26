import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { logout, isAdmin } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <AppBar position="fixed">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Sistema de Control
        </Typography>
        <Box>
          <Button color="inherit" onClick={() => navigate('/materiales')}>
            Materiales
          </Button>
          {isAdmin && (
            <Button color="inherit" onClick={() => navigate('/usuarios')}>
              Usuarios
            </Button>
          )}
          <Button color="inherit" onClick={handleLogout}>
            Cerrar Sesión
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;