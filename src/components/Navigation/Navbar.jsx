import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Box,
  Button
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import AddBoxIcon from '@mui/icons-material/AddBox';
import ListAltIcon from '@mui/icons-material/ListAlt';
import PeopleIcon from '@mui/icons-material/People';
import LogoutIcon from '@mui/icons-material/Logout';
import HomeIcon from '@mui/icons-material/Home';
import GroupIcon from '@mui/icons-material/Group';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import BusinessIcon from '@mui/icons-material/Business'; // Importamos el icono para Clientes
import DescriptionIcon from '@mui/icons-material/Description';
import { useAuth } from '../../contexts/AuthContext';
import { logout } from '../../services/authService';
import Swal from 'sweetalert2';
// Add this import with your other icon imports
import InventoryIcon from '@mui/icons-material/Inventory';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useAuth();

  const menuItems = [
    {
      text: 'Inicio',
      icon: <HomeIcon />,
      path: '/welcome',
      roles: ['admin', 'user']
    },
    {
      text: 'Nuevo Material',
      icon: <AddBoxIcon />,
      path: '/materiales/nuevo',
      roles: ['admin']
    },
    {
      text: 'Lista de Materiales',
      icon: <ListAltIcon />,
      path: '/materiales',
      roles: ['admin', 'user']
    },
    {
      text: 'Movimientos',
      icon: <CompareArrowsIcon />,
      path: '/movimientos',
      roles: ['admin', 'user']
    },
    {
      text: 'Nueva Cotización',
      icon: <AddBoxIcon />,
      path: '/cotizaciones/nueva',
      roles: ['admin']
    },
    {
      text: 'Cotizaciones',
      icon: <DescriptionIcon />,
      path: '/cotizaciones',
      roles: ['admin' ]
    },
    {
      text: 'Clientes',
      icon: <BusinessIcon />,
      path: '/clientes',
      roles: ['admin']
    },
    {
      text: 'Proveedores',
      icon: <InventoryIcon />,
      path: '/proveedores',
      roles: ['admin']
    },
    {
      text: 'Empleados',
      icon: <AddBoxIcon />,
      path: '/empleados/nuevo',
      roles: ['admin']
    },
    {
      text: 'Usuarios',
      icon: <PeopleIcon />,
      path: '/usuarios',
      roles: ['admin']
    }
  ];

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: '¿Cerrar sesión?',
      text: "¿Está seguro que desea cerrar sesión?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      logout();
      setUser(null);
      navigate('/login');
    }
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
          backgroundColor: '#1976d2',
          color: 'white'
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Sistema de Control
        </Typography>
        {user && (
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
            {user.fullName}
          </Typography>
        )}
      </Box>
      <Divider sx={{ backgroundColor: 'rgba(255,255,255,0.12)' }} />
      <List sx={{ flexGrow: 1 }}>
        {menuItems
          .filter(item => item.roles.includes(user?.role))
          .map((item) => (
            <ListItem
              button
              key={item.text}
              onClick={() => navigate(item.path)}
              sx={{
                backgroundColor: location.pathname === item.path ? 'rgba(255,255,255,0.1)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              <ListItemIcon sx={{ color: 'white' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
      </List>
      <Divider sx={{ backgroundColor: 'rgba(255,255,255,0.12)' }} />
      <List>
        <ListItem>
          <Button
            fullWidth
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            Cerrar Sesión
          </Button>
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Navbar;