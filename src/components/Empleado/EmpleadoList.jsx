import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Chip,
  TextField,
  InputAdornment
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { getEmpleados, deleteEmpleado } from '../../services/empleadoService';
import Swal from 'sweetalert2';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import RestoreIcon from '@mui/icons-material/Restore';

const EmpleadoList = () => {
  const navigate = useNavigate();
  const [empleados, setEmpleados] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('activos');
  const [searchTerm, setSearchTerm] = useState('');

  const loadEmpleados = async () => {
    try {
      const data = await getEmpleados();
      console.log('Empleados cargados:', data); 
      if (Array.isArray(data)) {
        setEmpleados(data);
      } else if (data && Array.isArray(data.empleados)) {
        setEmpleados(data.empleados);
      } else {
        throw new Error('Formato de datos inválido');
      }
    } catch (error) {
      console.error('Error al cargar empleados:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los empleados'
      });
    }
  };

  const handleEdit = (empleadoId) => {
    if (!empleadoId) {
      console.error('ID de empleado no válido');
      return;
    }
    console.log('Editando empleado:', empleadoId);
    navigate(`/empleados/editar/${empleadoId}`);
  };

  const handleDelete = async (id) => {
    try {
      const result = await Swal.fire({
        title: '¿Está seguro?',
        text: "El empleado será marcado como inactivo",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, desactivar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        await deleteEmpleado(id);
        await loadEmpleados();
        Swal.fire('Desactivado', 'El empleado ha sido marcado como inactivo', 'success');
      }
    } catch (error) {
      console.error('Error al desactivar:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo desactivar el empleado'
      });
    }
  };

  const handleToggleEstado = async (id, nuevoEstado) => {
    try {
      const mensaje = nuevoEstado ? 'activar' : 'desactivar';
      const result = await Swal.fire({
        title: '¿Está seguro?',
        text: `El empleado será ${mensaje}do`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: nuevoEstado ? '#28a745' : '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: `Sí, ${mensaje}`,
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        await deleteEmpleado(id, nuevoEstado);
        await loadEmpleados();
        Swal.fire(
          nuevoEstado ? 'Activado' : 'Desactivado', 
          `El empleado ha sido ${mensaje}do`, 
          'success'
        );
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cambiar el estado del empleado'
      });
    }
  };

  const empleadosFiltrados = useMemo(() => {
    return empleados.filter(emp => {
      const matchEstado = 
        filtroEstado === 'todos' ? true : 
        filtroEstado === 'activos' ? emp.estado : 
        !emp.estado;
  
      if (!matchEstado) return false;
  
      if (!searchTerm) return true;
  
      const searchLower = searchTerm.toLowerCase();
      return (
        (emp.codigo_empleado?.toLowerCase() || '').includes(searchLower) ||
        (emp.nombre?.toLowerCase() || '').includes(searchLower) ||
        (emp.departamento?.toLowerCase() || '').includes(searchLower)
      );
    });
  }, [empleados, filtroEstado, searchTerm]);

  useEffect(() => {
    loadEmpleados();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#1976d2' }}>
          Lista de Empleados
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/empleados/nuevo')}
        >
          Nuevo Empleado
        </Button>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar por código, nombre o departamento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="primary" />
              </InputAdornment>
            )
          }}
          sx={{ 
            backgroundColor: 'white',
            minWidth: '300px',
            '& .MuiOutlinedInput-root': {
              '&:hover fieldset': {
                borderColor: 'primary.main',
              },
            },
            boxShadow: 1,
            borderRadius: 1
          }}
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant={filtroEstado === 'activos' ? 'contained' : 'outlined'}
            onClick={() => setFiltroEstado('activos')}
            size="small"
          >
            ACTIVOS
          </Button>
          <Button
            variant={filtroEstado === 'inactivos' ? 'contained' : 'outlined'}
            onClick={() => setFiltroEstado('inactivos')}
            size="small"
          >
            INACTIVOS
          </Button>
          <Button
            variant={filtroEstado === 'todos' ? 'contained' : 'outlined'}
            onClick={() => setFiltroEstado('todos')}
            size="small"
          >
            TODOS
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Código</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Apellido</TableCell>
              <TableCell>Departamento</TableCell>
              <TableCell>Cargo</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Fecha Ingreso</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {empleadosFiltrados.map((empleado) => (
              <TableRow key={empleado.id_empleado || empleado.id}>
                <TableCell>{empleado.codigo_empleado}</TableCell>
                <TableCell>{empleado.nombre}</TableCell>
                <TableCell>{empleado.apellido}</TableCell>
                <TableCell>{empleado.departamento}</TableCell>
                <TableCell>{empleado.cargo}</TableCell>
                <TableCell>{empleado.email}</TableCell>
                <TableCell>{empleado.telefono}</TableCell>
                <TableCell>
                  {new Date(empleado.fecha_ingreso).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={empleado.estado ? 'Activo' : 'Inactivo'}
                    color={empleado.estado ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton 
                    onClick={() => handleEdit(empleado.id_empleado || empleado.id)}
                    color="primary"
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                  {empleado.estado ? (
                    <IconButton 
                      onClick={() => handleToggleEstado(empleado.id_empleado || empleado.id, false)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  ) : (
                    <IconButton 
                      onClick={() => handleToggleEstado(empleado.id_empleado || empleado.id, true)}
                      color="success"
                      size="small"
                    >
                      <RestoreIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default EmpleadoList;