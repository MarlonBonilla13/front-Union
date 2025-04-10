import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,  // Añadido Typography
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate, useParams } from 'react-router-dom';
import { getClientes } from '../../services/clienteService';
import { getMaterials } from '../../services/materialService';
import { createCotizacion, getCotizacionById, updateCotizacion } from '../../services/cotizacionService';
import Swal from 'sweetalert2';

const CotizacionForm = ({ isNew = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [formData, setFormData] = useState({
    clienteId: '',
    fecha: new Date().toISOString().split('T')[0],
    items: [],
    observaciones: '',
    subtotal: 0,
    iva: 0,
    total: 0
  });

  useEffect(() => {
    const inicializarDatos = async () => {
      await cargarDatos();
      if (!isNew && id) {
        await cargarCotizacion();
      }
    };
    inicializarDatos();
  }, [id, isNew]);

  const cargarDatos = async () => {
    try {
      const [clientesData, materialesData] = await Promise.all([
        getClientes(),
        getMaterials()
      ]);
      console.log('Materiales cargados:', materialesData); // Para debugging
      setClientes(clientesData);
      setMateriales(materialesData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      Swal.fire({
        title: 'Error',
        text: 'Error al cargar los datos iniciales',
        icon: 'error'
      });
    }
  };

  const cargarCotizacion = async () => {
    try {
      const cotizacion = await getCotizacionById(id);
      setFormData(cotizacion);
    } catch (error) {
      console.error('Error al cargar cotización:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo cargar la cotización',
        icon: 'error'
      });
    }
  };

  const agregarItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { materialId: '', cantidad: 1, precio: 0, subtotal: 0 }]
    }));
  };

  // Add this useEffect inside the component
useEffect(() => {
  console.log('Materiales actualizados:', materiales);
}, [materiales]);

  const eliminarItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    const item = updatedItems[index];
    
    if (field === 'materialId') {
      const material = materiales.find(m => m.id_material === parseInt(value));
      console.log('Material seleccionado:', material);
      
      if (material) {
        item.materialId = value;
        item.precio = material.precio_unitario;
        item.subtotal = item.precio * item.cantidad;
      }
    } else if (field === 'cantidad') {
      item.cantidad = Math.max(1, parseInt(value) || 0);
      item.subtotal = item.precio * item.cantidad;
    }
    
    updatedItems[index] = item;
    
    const subtotal = updatedItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const iva = subtotal * 0.12;
    const total = subtotal + iva;

    setFormData(prev => ({
      ...prev,
      items: updatedItems,
      subtotal,
      iva,
      total
    }));
  };

  // Add this function before the return statement
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;
    
    try {
      if (id) {
        await updateCotizacion(id, formData);
      } else {
        await createCotizacion(formData);
      }
      
      Swal.fire({
        title: '¡Éxito!',
        text: `Cotización ${id ? 'actualizada' : 'creada'} correctamente`,
        icon: 'success'
      });
      navigate('/cotizaciones');
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: `No se pudo ${id ? 'actualizar' : 'crear'} la cotización`,
        icon: 'error'
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Typography variant="h5" gutterBottom color="primary" fontWeight={600}>
        {id ? 'Editar Cotización' : 'Nueva Cotización'}
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Cliente</InputLabel>
            <Select
              value={formData.clienteId}
              onChange={(e) => setFormData({...formData, clienteId: e.target.value})}
            >
              {clientes.map(cliente => (
                <MenuItem key={cliente.id} value={cliente.id}>
                  {cliente.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={agregarItem}
            sx={{ mb: 2 }}
          >
            Agregar Material
          </Button>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Material</TableCell>
                  <TableCell>Cantidad</TableCell>
                  <TableCell>Precio</TableCell>
                  <TableCell>Subtotal</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formData.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <FormControl fullWidth>
                        <Select
                          value={item.materialId || ''}
                          onChange={(e) => handleItemChange(index, 'materialId', e.target.value)}
                          displayEmpty
                        >
                          <MenuItem value="" disabled>
                            Seleccione un material
                          </MenuItem>
                          {materiales.map(material => (
                            <MenuItem key={material.id_material} value={material.id_material}>
                              {material.nombre} - Q{material.precio_unitario}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={item.cantidad}
                        onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)}
                        inputProps={{ min: 1 }}
                      />
                    </TableCell>
                    <TableCell>{item.precio}</TableCell>
                    <TableCell>{item.subtotal}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => eliminarItem(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Observaciones"
            value={formData.observaciones}
            onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
          />
        </Grid>

        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
          >
            {id ? 'Actualizar' : 'Crear'} Cotización
          </Button>
        </Grid>
      </Grid>
    </form>
  );
};



export default CotizacionForm;