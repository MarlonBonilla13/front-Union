import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import Navbar from './components/Navigation/Navbar';
import MaterialForm from './components/Material/MaterialForm';
import MaterialList from './components/MaterialList/MaterialList';
import Welcome from './components/Welcome';

function App() {
  return (
    <Router>
      <Box sx={{ 
        display: 'flex', 
        minHeight: '100vh', 
        bgcolor: '#f8f9fa',
        flexDirection: { xs: 'column', sm: 'row' } // Cambia la dirección en móviles
      }}>
        <Navbar />
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1,
            width: {
              xs: 'calc(100% - 32px)', // Móviles
              sm: 'calc(100% - 48px)', // Tablets
              md: 'calc(100% - 48px)'  // Desktop
            },
            mx: { // Márgenes horizontales responsivos
              xs: '16px', // Más pequeño en móviles
              sm: '24px',
              md: '24px'
            },
            mt: { // Margen superior responsivo
              xs: '56px', // Más pequeño en móviles
              sm: '64px'
            },
            mb: {
              xs: '16px', // Más pequeño en móviles
              sm: '24px'
            },
            p: { // Padding responsivo
              xs: 2, // Más pequeño en móviles
              sm: 3
            },
            overflow: 'auto', // Permite scroll si el contenido es muy largo
            transition: 'all 0.3s', // Suaviza las transiciones
          }}
        >
          <Routes>
            <Route index element={<Welcome />} />
            <Route path="/" element={<Welcome />} />
            <Route path="/materiales" element={<MaterialList />} />
            <Route path="/materiales/nuevo" element={<MaterialForm />} />
            <Route path="/materiales/editar/:id" element={<MaterialForm />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

export default App;