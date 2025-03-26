import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navigation/navbar.jsx';
import MaterialForm from './components/Material/materialform.jsx';
import MaterialList from './components/MaterialList/materiallist.jsx';
import Welcome from './components/Welcome';
import UserList from './components/User/userlist.jsx';
import UserForm from './components/User/userform.jsx';
import Login from './components/Auth/login.jsx';
import ProtectedRoute from './components/Auth/protectedroute.jsx';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8f9fa' }}>
                  <Navbar />
                  <Box component="main" sx={{ flexGrow: 1 }}>
                    <Routes>
                      <Route path="/welcome" element={<Welcome />} />
                      <Route path="/materiales" element={<MaterialList />} />
                      <Route 
                        path="/materiales/nuevo" 
                        element={
                          <ProtectedRoute roles={['admin']}>
                            <MaterialForm />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/materiales/editar/:id" 
                        element={
                          <ProtectedRoute roles={['admin']}>
                            <MaterialForm />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/usuarios" 
                        element={
                          <ProtectedRoute roles={['admin']}>
                            <UserList />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/usuarios/nuevo" 
                        element={
                          <ProtectedRoute roles={['admin']}>
                            <UserForm />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/usuarios/editar/:id" 
                        element={
                          <ProtectedRoute roles={['admin']}>
                            <UserForm />
                          </ProtectedRoute>
                        } 
                      />
                    </Routes>
                  </Box>
                </Box>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;