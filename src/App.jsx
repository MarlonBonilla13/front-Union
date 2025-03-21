import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import Navbar from './components/Navigation/Navbar';
import MaterialForm from './components/Material/MaterialForm';
import MaterialList from './components/MaterialList/MaterialList'; // Corregida la ruta
import Welcome from './components/Welcome';
import UserList from './components/User/UserList';
import UserForm from './components/User/UserForm';

function App() {
  return (
    <Router>
      <Box sx={{ 
        display: 'flex', 
        minHeight: '100vh', 
        bgcolor: '#f8f9fa',
        flexDirection: { xs: 'column', sm: 'row' }
      }}>
        <Navbar />
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1,
            width: {
              xs: 'calc(100% - 32px)',
              sm: 'calc(100% - 48px)',
              md: 'calc(100% - 48px)'
            },
            mx: {
              xs: '16px',
              sm: '24px',
              md: '24px'
            },
            mt: {
              xs: '56px',
              sm: '64px'
            },
            mb: {
              xs: '16px',
              sm: '24px'
            },
            p: {
              xs: 2,
              sm: 3
            },
            overflow: 'auto',
            transition: 'all 0.3s',
          }}
        >
          <Routes>
            <Route index element={<Welcome />} />
            <Route path="/" element={<Welcome />} />
            <Route path="/materiales" element={<MaterialList />} />
            <Route path="/materiales/nuevo" element={<MaterialForm />} />
            <Route path="/materiales/editar/:id" element={<MaterialForm />} />
            <Route path="/usuarios" element={<UserList />} />
            <Route path="/usuarios/nuevo" element={<UserForm />} />
            <Route path="/usuarios/editar/:id" element={<UserForm />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

export default App;