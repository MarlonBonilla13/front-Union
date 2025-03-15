import React, { useState } from 'react';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  ListItemButton,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import InventoryIcon from '@mui/icons-material/Inventory';
import AddBoxIcon from '@mui/icons-material/AddBox';
import HomeIcon from '@mui/icons-material/Home';
import { useNavigate, useLocation } from 'react-router-dom';

export const drawerWidth = 240;

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileOpen(false); // Cerrar el drawer en móviles después de navegar
  };

  const handleHomeClick = () => {
    handleNavigation('/');
  };

  const menuItems = [
    {
      text: 'Inicio',
      icon: <HomeIcon />,
      path: '/',
      divider: true
    },
    {
      text: 'Lista de Materiales',
      icon: <InventoryIcon />,
      path: '/materiales'
    },
    {
      text: 'Nuevo Material',
      icon: <AddBoxIcon />,
      path: '/materiales/nuevo'
    }
  ];

  const drawer = (
    <Box sx={{ mt: 2 }}>
      <List>
        {menuItems.map((item) => (
          <React.Fragment key={item.text}>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                selected={location.pathname === item.path}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: '#e3f2fd',
                  },
                  '&:hover': {
                    backgroundColor: '#e3f2fd',
                  },
                  ...(item.text === 'Inicio' && {
                    backgroundColor: '#f5f5f5',
                    '&:hover': {
                      backgroundColor: '#e3f2fd',
                    }
                  })
                }}
              >
                <ListItemIcon sx={{ 
                  color: item.text === 'Inicio' ? '#1976d2' : '#757575',
                  ...(item.text === 'Inicio' && {
                    fontSize: '1.2rem',
                    '& > svg': {
                      fontSize: '1.2rem'
                    }
                  })
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontFamily: 'Arial',
                      color: '#2c3e50',
                      ...(item.text === 'Inicio' && {
                        fontWeight: 'bold',
                        color: '#1976d2'
                      })
                    }
                  }}
                />
              </ListItemButton>
            </ListItem>
            {item.divider && (
              <Box sx={{ my: 1, borderBottom: '1px solid #e0e0e0' }} />
            )}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: '#f8f9fa',
          color: '#1976d2',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography 
            variant="h6" 
            noWrap 
            component="div"
            sx={{ 
              fontFamily: "Arial",
              fontWeight: 'bold',
              color: '#2c3e50',
            }}
          >
            Sistema de Control Administrativo
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ 
          width: { sm: drawerWidth },
          flexShrink: { sm: 0 },
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              backgroundColor: '#f8f9fa',
              borderRight: '1px solid #e0e0e0',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              backgroundColor: '#f8f9fa',
              borderRight: '1px solid #e0e0e0',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
    </Box>
  );
};

export default Navbar; 