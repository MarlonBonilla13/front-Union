import { useState, useEffect } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Container,
  IconButton,
  Box,
  Button
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../routes/routes.config';
import axios from 'axios';
import Swal from 'sweetalert2';

const MaterialList = () => {
  const [materials, setMaterials] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const TIMEOUT_SECONDS = 10;
      
      const fetchPromise = axios.get('http://localhost:3000/api/materiales');
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), TIMEOUT_SECONDS * 1000)
      );

      Swal.fire({
        title: 'Cargando materiales...',
        text: 'Por favor espere...',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);
      setMaterials(response.data);
      Swal.close();
    } catch (error) {
      console.error('Error al obtener materiales:', error);
      let errorMessage = 'No se pudieron cargar los materiales.';
      
      if (error.message === 'TIMEOUT') {
        errorMessage = 'La operación excedió el tiempo de espera. Por favor, verifique su conexión.';
      } else if (!navigator.onLine) {
        errorMessage = 'No hay conexión a Internet. Por favor, verifique su conexión.';
      }

      await Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: errorMessage,
        confirmButtonColor: '#dc3545'
      });
    }
  };

  const handleEdit = (id) => {
    navigate(ROUTES.MATERIALS.EDIT(id));
  };

  const handleDelete = async (id) => {
    try {
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: "Esta acción no se puede deshacer",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        await axios.delete(`http://localhost:3000/api/materiales/${id}`);
        await fetchMaterials();
        await Swal.fire({
          icon: 'success',
          title: 'Material eliminado',
          text: 'El material ha sido eliminado correctamente',
          confirmButtonColor: '#28a745'
        });
      }
    } catch (error) {
      console.error('Error al eliminar material:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error al eliminar',
        text: 'No se pudo eliminar el material. Por favor, intente nuevamente.',
        confirmButtonColor: '#dc3545'
      });
    }
  };

  const handleAddNew = () => {
    navigate(ROUTES.MATERIALS.NEW);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 10, mb: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
        }}
      >
        <Typography
          component="h1"
          variant="h5"
          align="center"
          sx={{
            mb: 4,
            color: '#1976d2',
            fontWeight: 'bold',
            fontFamily: 'Arial'
          }}
        >
          Lista de Materiales
        </Typography>

        <TableContainer 
          component={Paper} 
          elevation={0}
          sx={{ 
            maxHeight: 440,
            overflowX: 'auto',
            mb: 3,
            "& .MuiTableCell-root": {
              borderColor: '#e0e0e0'
            }
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', color: '#2c3e50' }}>Nombre</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', color: '#2c3e50' }}>Descripción</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', color: '#2c3e50' }}>Stock Actual</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', color: '#2c3e50' }}>Stock Mínimo</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', color: '#2c3e50' }}>Unidad Medida</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', color: '#2c3e50' }}>Precio Unitario</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', color: '#2c3e50' }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', color: '#2c3e50', textAlign: 'center' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {materials.map((material) => (
                <TableRow
                  key={material.id}
                  sx={{
                    '&:nth-of-type(odd)': {
                      backgroundColor: '#f8f9fa',
                    },
                    '&:hover': {
                      backgroundColor: '#e3f2fd',
                      transition: 'background-color 0.2s ease',
                    },
                  }}
                >
                  <TableCell>{material.nombre}</TableCell>
                  <TableCell>{material.descripcion}</TableCell>
                  <TableCell>{material.stockActual}</TableCell>
                  <TableCell>{material.stockMinimo}</TableCell>
                  <TableCell>{material.unidadMedida}</TableCell>
                  <TableCell>Q{material.precioUnitario.toFixed(2)}</TableCell>
                  <TableCell>
                    <Typography
                      sx={{
                        color: material.estado ? '#2e7d32' : '#d32f2f',
                        fontWeight: 'medium',
                        backgroundColor: material.estado ? '#e8f5e9' : '#ffebee',
                        padding: '6px 12px',
                        borderRadius: '16px',
                        display: 'inline-block',
                        fontSize: '0.875rem'
                      }}
                    >
                      {material.estado ? 'Activo' : 'Inactivo'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      onClick={() => handleEdit(material.id)}
                      color="primary"
                      size="small"
                      sx={{ 
                        mr: 1,
                        '&:hover': {
                          backgroundColor: '#e3f2fd'
                        }
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(material.id)}
                      color="error"
                      size="small"
                      sx={{
                        '&:hover': {
                          backgroundColor: '#ffebee'
                        }
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default MaterialList; 