import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { createEmpleado, getEmpleado, updateEmpleado } from '../../services/empleadoService';
import Swal from 'sweetalert2';

const EmpleadoForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    codigo_empleado: '',
    nombre: '',
    apellido: '',
    departamento: '',
    cargo: '',
    email: '',
    telefono: '',
    fecha_ingreso: new Date().toISOString().split('T')[0],
    estado: true
  });

  useEffect(() => {
    const loadEmpleado = async () => {
      if (id) {
        try {
          setIsLoading(true);
          const empleadoData = await getEmpleado(id);
          console.log('Empleado data loaded:', empleadoData);
          setFormData({
            ...empleadoData,
            fecha_ingreso: empleadoData.fecha_ingreso ? new Date(empleadoData.fecha_ingreso).toISOString().split('T')[0] : ''
          });
        } catch (error) {
          console.error('Error loading employee:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar la información del empleado'
          });
          navigate('/empleados');
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    loadEmpleado();
  }, [id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formattedData = {
        ...formData,
        fecha_ingreso: new Date(formData.fecha_ingreso).toISOString().split('T')[0]
      };

      console.log('Datos a enviar:', formattedData); // Debug

      if (id) {
        const numericId = parseInt(id);
        if (isNaN(numericId)) {
          throw new Error('ID inválido');
        }
        await updateEmpleado(numericId, formattedData);
        await Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Empleado actualizado correctamente',
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        await createEmpleado(formattedData);
        await Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Empleado registrado correctamente',
          timer: 1500,
          showConfirmButton: false
        });
      }
      navigate('/empleados');
    } catch (error) {
      console.error('Error al guardar:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: id ? 'No se pudo actualizar el empleado' : 'No se pudo registrar el empleado'
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton 
            onClick={() => navigate('/empleados')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            {id ? 'Editar Empleado' : 'Nuevo Empleado'}
          </Typography>
        </Box>

        {!isLoading && (
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Código de Empleado"
                  name="codigo_empleado"
                  value={formData.codigo_empleado}
                  onChange={handleChange}
                  required
                  sx={{ mb: 2 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  sx={{ mb: 2 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Apellido"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  required
                  sx={{ mb: 2 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Departamento</InputLabel>
                  <Select
                    name="departamento"
                    value={formData.departamento}
                    onChange={handleChange}
                    label="Departamento"
                    required
                  >
                    <MenuItem value="Almacen">Almacen</MenuItem>
                    <MenuItem value="Produccion">Produccion</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Cargo"
                  name="cargo"
                  value={formData.cargo}
                  onChange={handleChange}
                  required
                  sx={{ mb: 2 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  sx={{ mb: 2 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Teléfono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  sx={{ mb: 2 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Fecha de Ingreso"
                  name="fecha_ingreso"
                  type="date"
                  value={formData.fecha_ingreso}
                  onChange={handleChange}
                  required
                  sx={{ mb: 2 }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/empleados')}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    sx={{ bgcolor: '#1976d2' }}
                  >
                    Guardar
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        )}
      </Paper>
    </Box>
  );
};

export default EmpleadoForm;