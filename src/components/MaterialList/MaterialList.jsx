import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
  TextField,
  InputAdornment,
  Button
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import { 
  getMaterials, 
  deleteMaterial, 
  getInactiveMaterials,
  reactivateMaterial 
} from '../../services/materialService';
import { useAuth } from '../../contexts/AuthContext';
import Swal from 'sweetalert2';
import RestoreIcon from '@mui/icons-material/Restore';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ImageIcon from '@mui/icons-material/Image';
import { API_IMAGE_URL } from '../../config/config';
import WarningIcon from '@mui/icons-material/Warning';

const MaterialList = () => {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAdmin } = useAuth();
  const { user } = useAuth();
  const [showInactive, setShowInactive] = useState(false);

  // En la función loadMaterials, después de obtener los datos:
  const loadMaterials = async () => {
    try {
      setIsLoading(true);
      const data = showInactive ? 
        await getInactiveMaterials() : 
        await getMaterials();
      // Ordenar los materiales con lógica invertida
      const sortedData = [...data].sort((a, b) => {
      // Tratar "0" como si no tuviera código
      const aHasValidCode = a.codigo && a.codigo !== "0";
      const bHasValidCode = b.codigo && b.codigo !== "0";
      
      // Primero ordenar por presencia de código válido
      if (aHasValidCode !== bHasValidCode) {
        return aHasValidCode ? -1 : 1;
      }
      
      // Si ambos tienen código válido, ordenar alfabéticamente
      if (aHasValidCode && bHasValidCode) {
        return a.codigo.localeCompare(b.codigo);
      }
      
      // Si ninguno tiene código válido, ordenar por ID más reciente
      return b.id_material - a.id_material;
    });
    setMaterials(sortedData);
    setFilteredMaterials(sortedData);
    setError(null);
    } catch (err) {
      console.error('Error al cargar materiales:', err);
      await Swal.fire({
        icon: 'error',
        title: 'Error al cargar materiales',
        text: 'No se pudieron cargar los materiales. Por favor, intente nuevamente.',
        confirmButtonColor: '#d33',
        confirmButtonText: 'Entendido'
      });
      setMaterials([]);
      setFilteredMaterials([]);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Actualizar el useEffect para que se ejecute cuando cambie showInactive
  useEffect(() => {
    loadMaterials();
  }, [showInactive]);

  // Filtrar materiales cuando cambie el término de búsqueda
  // Modificar el useEffect del filtrado
  useEffect(() => {
    const filtered = materials.filter(material => {
      const matchesSearch = material.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (material.codigo && material.codigo.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filtrar por estado (activo/inactivo)
      const matchesState = showInactive ? !material.estado : material.estado;
      
      return matchesSearch && matchesState;
    });
    setFilteredMaterials(filtered);
  }, [searchTerm, materials, showInactive]);

  const handleEdit = (id) => {
    if (!isAdmin) {
      Swal.fire({
        icon: 'error',
        title: 'Acceso denegado',
        text: 'No tienes permisos para editar materiales',
        confirmButtonColor: '#d33'
      });
      return;
    }
    navigate(`/materiales/editar/${id}`);
  };

  const handleDelete = async (id) => {
    if (!isAdmin) {
      Swal.fire({
        icon: 'error',
        title: 'Acceso denegado',
        text: 'No tienes permisos para eliminar materiales',
        confirmButtonColor: '#d33'
      });
      return;
    }
    try {
      const result = await Swal.fire({
        title: '¿Está seguro?',
        text: "Esta acción no se puede deshacer",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });
  
      if (result.isConfirmed) {
        setIsLoading(true);
        await deleteMaterial(id);
        await loadMaterials();
        
        await Swal.fire(
          '¡Eliminado!',
          'El material ha sido eliminado correctamente.',
          'success'
        );
      }
    } catch (error) {
      console.error('Error al eliminar:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error al eliminar',
        text: 'No se pudo eliminar el material. Por favor, intente nuevamente.',
        confirmButtonColor: '#d33'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Modificamos esta parte para que no se muestre el botón de reintentar
  // sino que siempre se muestre la tabla (incluso vacía)
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Eliminamos la condición de error que mostraba el botón de reintentar
  // y dejamos que siempre se muestre la tabla

  const handleReactivate = async (id) => {
    try {
      const result = await Swal.fire({
        title: '¿Reactivar material?',
        text: "El material volverá a estar disponible",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, reactivar',
        cancelButtonText: 'Cancelar'
      });
  
      if (result.isConfirmed) {
        setIsLoading(true);
        try {
          await reactivateMaterial(id);
          setShowInactive(false); // Cambiamos a la vista de activos
          await loadMaterials();
          
          await Swal.fire({
            icon: 'success',
            title: '¡Reactivado!',
            text: 'El material ha sido reactivado correctamente.',
            confirmButtonColor: '#3085d6'
          });
        } catch (error) {
          console.error('Error específico al reactivar:', error.response?.data || error.message);
          await Swal.fire({
            icon: 'error',
            title: 'Error al reactivar',
            text: error.response?.data?.message || 'No se pudo reactivar el material. Por favor, intente nuevamente.',
            confirmButtonColor: '#d33'
          });
        }
      }
    } catch (error) {
      console.error('Error general:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error del sistema',
        text: 'Ocurrió un error inesperado. Por favor, intente nuevamente.',
        confirmButtonColor: '#d33'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Modificar el return para incluir el botón de filtro y la lógica de mostrar inactivos
  return (
    <Box component="main" sx={{ flexGrow: 1, backgroundColor: '#f5f5f5', minHeight: '100vh', p: 3 }}>
      <Container maxWidth="lg" sx={{ backgroundColor: '#f5f5f5', height: '100%' }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2, backgroundColor: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1976d2' }}>
              Lista de Materiales
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color={showInactive ? "secondary" : "primary"}
                startIcon={<VisibilityOffIcon />}
                onClick={() => setShowInactive(!showInactive)}
                sx={{
                  backgroundColor: showInactive ? '#f50057' : '#4caf50',
                  '&:hover': {
                    backgroundColor: showInactive ? '#c51162' : '#388e3c'
                  }
                }}
              >
                {showInactive ? 'Ver Activos' : 'Ver Inactivos'}
              </Button>
              {isAdmin && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/materiales/nuevo')}
                >
                  Nuevo Material
                </Button>
              )}
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Buscar material por nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                sx: {
                  backgroundColor: 'white',
                  '&:hover': {
                    backgroundColor: '#fafafa'
                  }
                }
              }}
            />
          </Box>

          <TableContainer 
            component={Paper} 
            elevation={0}
            sx={{ 
              flexGrow: 1,
              backgroundColor: 'transparent'
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Imagen</TableCell>
                  <TableCell>Código</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Stock Actual</TableCell>
                  <TableCell>Stock Mínimo</TableCell>
                  <TableCell>Estado Stock</TableCell> {/* New column */}
                  <TableCell>Unidad Medida</TableCell>
                  <TableCell>Precio Unitario</TableCell>
                  <TableCell>Estado</TableCell>
                  {isAdmin && <TableCell align="center">Acciones</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMaterials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 10 : 9} align="center">
                      <Box sx={{ py: 2 }}>
                        <Typography sx={{ color: 'text.secondary', mb: 2 }}>
                          {searchTerm 
                            ? 'No se encontraron materiales que coincidan con la búsqueda'
                            : 'No hay materiales registrados'}
                        </Typography>
                        {/* Añadimos un botón para reintentar cargar los materiales */}
                        <Button 
                          variant="contained" 
                          color="primary" 
                          onClick={loadMaterials}
                          startIcon={<RefreshIcon />}
                          size="small"
                        >
                          Reintentar cargar materiales
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMaterials.map((material) => (
                    <TableRow key={material.id_material}>
                      <TableCell>
                        {material.imagen_url && (
                          <img
                            src={`${API_IMAGE_URL}${material.imagen_url.split('/').pop()}`}
                            alt={material.nombre}
                            style={{
                              width: '50px',
                              height: '50px',
                              objectFit: 'contain'
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell>{material.codigo || 'N/A'}</TableCell>
                      <TableCell>{material.nombre}</TableCell>
                      <TableCell>{material.descripcion}</TableCell>
                      <TableCell>{material.stock_actual}</TableCell>
                      <TableCell>{material.stock_minimo}</TableCell>
                      <TableCell>
                        {material.stock_actual <= material.stock_minimo && (
                          <Tooltip title="Stock Bajo" arrow>
                            <WarningIcon sx={{ color: '#ff9800' }} />
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell>{material.unidad_medida}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('es-GT', {
                          style: 'currency',
                          currency: 'GTQ'
                        }).format(material.precio_unitario)}
                      </TableCell>
                      <TableCell>
                        <Typography
                          sx={{
                            color: material.estado ? 'success.main' : 'error.main',
                            fontWeight: 'medium'
                          }}
                        >
                          {material.estado ? 'Activo' : 'Desactivado'}
                        </Typography>
                      </TableCell>
                      {isAdmin && (
                        <TableCell align="center">
                          {material.estado ? (
                            <>
                              <Tooltip title="Editar">
                                <IconButton onClick={() => handleEdit(material.id_material)} color="primary">
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Eliminar">
                                <IconButton onClick={() => handleDelete(material.id_material)} color="error">
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </>
                          ) : (
                            <Tooltip title="Reactivar">
                              <IconButton onClick={() => handleReactivate(material.id_material)} color="success">
                                <RestoreIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>
    </Box>
  );
};

export default MaterialList;