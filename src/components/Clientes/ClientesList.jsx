import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Typography,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { getClientes, deleteCliente, cambiarEstadoCliente } from '../../services/clienteService';
import Swal from 'sweetalert2'; // Import SweetAlert2 instead
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../../services/api'; // Add this import

const getImageUrl = (imagePath) => {
  if (!imagePath) {
    console.log('No hay ruta de imagen');
    return null;
  }
  
  // Si la URL ya es absoluta (comienza con http)
  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  // Si es una ruta relativa
  const cleanPath = imagePath.split('/').pop();
  const url = `${api.defaults.baseURL}/uploads/clientes/${cleanPath}`;
  console.log('URL construida:', url);
  return url;
};

const ClientesList = ({ onEditCliente = () => {} }) => {  // Add default empty function
  const [clientes, setClientes] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState(null);
  const [showInactive, setShowInactive] = useState(false);  // Keep only one declaration

  // Move all handlers here, before the return statement
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleEditClick = (cliente) => {
    onEditCliente(cliente.id_cliente);  // Remove the if check since we have a default function
  };

  const handleDeleteClick = (cliente) => {
    setClienteToDelete(cliente);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!clienteToDelete) return;
    
    try {
      await cambiarEstadoCliente(clienteToDelete.id_cliente, false);
      await loadClientes(); // Refresh the list after state change
      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Cliente desactivado exitosamente'
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al desactivar cliente'
      });
    } finally {
      setDeleteDialogOpen(false);
      setClienteToDelete(null);
    }
  };

  const handleToggleEstado = async (id, estadoActual) => {
    try {
      const response = await cambiarEstadoCliente(id, !estadoActual);
      if (response) {
        await loadClientes();
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: `Cliente ${!estadoActual ? 'activado' : 'desactivado'} exitosamente`
        });
      } else {
        throw new Error('No se pudo cambiar el estado del cliente');
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al cambiar estado del cliente: ' + (error.message || 'Error desconocido')
      });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setClienteToDelete(null);
  };

  // Remove notistack hook
  // const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    loadClientes();
  }, []);

  useEffect(() => {
    filterClientes();
  }, [searchTerm, clientes, showInactive]);

  const loadClientes = async () => {
    setLoading(true);
    try {
      const data = await getClientes();
      console.log('Clientes cargados:', data); // Debug log para ver la data completa
      setClientes(data);
      setFilteredClientes(data);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al cargar clientes'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterClientes = () => {  // Keep only one declaration
    let filtered = clientes;
    
    filtered = filtered.filter(cliente => cliente.estado === !showInactive);
    
    if (searchTerm.trim()) {
      const searchTermLower = searchTerm.toLowerCase();
      filtered = filtered.filter(cliente => 
        cliente.nombre.toLowerCase().includes(searchTermLower) ||
        cliente.apellido.toLowerCase().includes(searchTermLower) ||
        cliente.correo.toLowerCase().includes(searchTermLower) ||
        cliente.telefono.includes(searchTerm) ||
        (cliente.nombre_comercial && cliente.nombre_comercial.toLowerCase().includes(searchTermLower))
      );
    }
    
    setFilteredClientes(filtered);
    setPage(0);
  };
  
  // Add this useEffect to trigger filtering when showInactive changes
  useEffect(() => {
    filterClientes();
  }, [searchTerm, clientes, showInactive]);
  
  // Add the toggle button in the Box component near the search field
  return (
    <Paper elevation={3} sx={{ width: '100%', overflow: 'hidden' }}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" component="div">
            {showInactive ? 'Clientes Inactivos' : 'Clientes Activos'}
          </Typography>
          <Button
            variant="outlined"
            onClick={() => setShowInactive(!showInactive)}
            sx={{ mb: 2 }}
          >
            {showInactive ? 'Ver Clientes Activos' : 'Ver Clientes Inactivos'}
          </Button>
        </Box>
        
        <TextField
          fullWidth
          margin="normal"
          placeholder="Buscar por nombre, apellido, correo o teléfono..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader size="small" aria-label="sticky table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 70, maxWidth: 80 }}>Logo</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Nombre</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Nombre Comercial</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Teléfono</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Correo</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Tipo de cliente</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Dirección</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Lugar</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Fecha Registro</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Última Actualización</TableCell>
                  <TableCell sx={{ minWidth: 80 }}>Estado</TableCell>
                  <TableCell align="center" sx={{ minWidth: 100 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredClientes
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((cliente) => (
                    <TableRow hover key={cliente.id_cliente}>
                      <TableCell>
                        {cliente.imagen_url ? (
                          <>
                            <img
                              src={getImageUrl(cliente.imagen_url)}
                              alt={`Logo de ${cliente.nombre}`}
                              style={{
                                width: '50px',
                                height: '50px',
                                objectFit: 'contain',
                                border: '1px solid #ddd',
                                borderRadius: '4px'
                              }}
                              onError={(e) => {
                                console.error('Error cargando imagen:', {
                                  cliente: cliente.nombre,
                                  url: e.target.src,
                                  originalUrl: cliente.imagen_url
                                });
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                              }}
                            />
                          </>
                        ) : (
                          <Box
                            sx={{
                              width: '50px',
                              height: '50px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#f5f5f5'
                            }}
                          >
                            No logo
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>{`${cliente.nombre} ${cliente.apellido}`}</TableCell>
                      <TableCell>{cliente.nombre_comercial || '-'}</TableCell>
                      <TableCell>{cliente.telefono}</TableCell>
                      <TableCell>{cliente.correo}</TableCell>
                      <TableCell>{cliente.tipo_cliente}</TableCell>
                      <TableCell>{cliente.direccion}</TableCell>
                      <TableCell>{cliente.lugar}</TableCell>
                      <TableCell>
                        {cliente.fecha_registro ? 
                          format(new Date(cliente.fecha_registro), 'dd/MM/yyyy', { locale: es }) 
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {cliente.fecha_actualizacion ? 
                          format(new Date(cliente.fecha_actualizacion), 'dd/MM/yyyy', { locale: es }) 
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={cliente.estado ? "Activo" : "Inactivo"}
                          color={cliente.estado ? "success" : "error"}
                          size="small"
                          onClick={() => handleToggleEstado(cliente.id_cliente, cliente.estado)}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Editar">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleEditClick(cliente)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteClick(cliente)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                {filteredClientes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={12} align="center">
                      No se encontraron clientes
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={filteredClientes.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </>
      )}
      
      {/* Diálogo de confirmación para eliminar */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Confirmar desactivación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro que desea desactivar al cliente {clienteToDelete?.nombre} {clienteToDelete?.apellido}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancelar</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Desactivar
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ClientesList;