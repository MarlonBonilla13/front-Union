import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import { SnackbarProvider } from 'notistack';
import Navbar from './components/Navigation/Navbar';
import MaterialForm from './components/Material/MaterialForm';
import MaterialList from './components/MaterialList/MaterialList';
import Welcome from './components/Welcome';
import UserList from './components/User/UserList';
import UserForm from './components/User/UserForm';
import Login from './components/Auth/Login';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import EmpleadoForm from './components/Empleado/EmpleadoForm';
import EmpleadoList from './components/Empleado/EmpleadoList';
import MovimientosList from './components/Movimientos/MovimientosList';
import ClientesPage from './pages/ClientesPage'; // Importar ClientesPage
import CotizacionesList from './components/Cotizaciones/CotizacionesList';
import NuevaCotizacion from './components/Cotizaciones/NuevaCotizacion';
import CotizacionForm from './components/Cotizaciones/CotizacionForm';

function App() {
  return (
    <SnackbarProvider maxSnack={3}>
      <Router>
        <AuthProvider>
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
                        <Route
                          path="/empleados/nuevo"
                          element={
                            <ProtectedRoute roles={['admin']}>
                              <EmpleadoForm />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/empleados/editar/:id"
                          element={
                            <ProtectedRoute roles={['admin']}>
                              <EmpleadoForm />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/empleados"
                          element={
                            <ProtectedRoute roles={['admin']}>
                              <EmpleadoList />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/movimientos"
                          element={
                            <ProtectedRoute>
                              <MovimientosList />
                            </ProtectedRoute>
                          }
                        />
                        <Route 
                          path="/clientes" 
                          element={
                            <ProtectedRoute roles={['admin']}>
                              <ClientesPage />
                            </ProtectedRoute>
                          } 
                        />
                        {/* Agregar rutas de cotizaciones aquí */}
                        <Route 
                          path="/cotizaciones" 
                          element={
                            <ProtectedRoute roles={['admin']}>
                              <CotizacionesList />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/cotizaciones/nueva" 
                          element={
                            <ProtectedRoute roles={['admin']}>
                              <NuevaCotizacion />
                            </ProtectedRoute>
                          } 
                        />
                        // Asegúrate de que la ruta esté correctamente definida
                        <Route 
                          path="/cotizaciones/editar/:id" 
                          element={
                            <ProtectedRoute roles={['admin']}>
                              <CotizacionForm />
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
        </AuthProvider>
      </Router>
    </SnackbarProvider>
  );
}

export default App;