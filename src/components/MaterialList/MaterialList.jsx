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
  InputAdornment
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { getMaterials, deleteMaterial } from '../../services/materialService';
import Swal from 'sweetalert2';

const MaterialList = () => {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadMaterials = async () => {
    try {
      setIsLoading(true);
      const data = await getMaterials();
      setMaterials(data);
      setFilteredMaterials(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar los materiales');
      console.error('Error al cargar materiales:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  // Filtrar materiales cuando cambie el término de búsqueda
  useEffect(() => {
    const filtered = materials.filter(material =>
      material.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (material.codigo && material.codigo.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredMaterials(filtered);
  }, [searchTerm, materials]);

  const handleEdit = (id) => {
    navigate(`/materiales/editar/${id}`);
  };

  const handleDelete = async (id) => {
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

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
        p: 3
      }}
    >
      <Container 
        maxWidth="lg" 
        sx={{ 
          backgroundColor: '#f5f5f5',
          height: '100%'
        }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            borderRadius: 2,
            backgroundColor: 'white'
          }}
        >
          <Typography
            variant="h5"
            align="center"
            sx={{
              mb: 3,
              fontWeight: 600,
              color: '#1976d2'
            }}
          >
            Lista de Materiales
          </Typography>

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
                  <TableCell>Código</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Stock Actual</TableCell>
                  <TableCell>Stock Mínimo</TableCell>
                  <TableCell>Unidad Medida</TableCell>
                  <TableCell>Precio Unitario</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMaterials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography sx={{ py: 2, color: 'text.secondary' }}>
                        {searchTerm 
                          ? 'No se encontraron materiales que coincidan con la búsqueda'
                          : 'No hay materiales registrados'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMaterials.map((material) => (
                    <TableRow key={material.id_material}>
                      <TableCell>{material.codigo || 'N/A'}</TableCell>
                      <TableCell>{material.nombre}</TableCell>
                      <TableCell>{material.descripcion}</TableCell>
                      
                      <TableCell>{material.stock_actual}</TableCell>
                      <TableCell>{material.stock_minimo}</TableCell>
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
                      <TableCell align="center">
                        <Tooltip title="Editar">
                          <IconButton
                            onClick={() => handleEdit(material.id_material)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            onClick={() => handleDelete(material.id_material)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
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