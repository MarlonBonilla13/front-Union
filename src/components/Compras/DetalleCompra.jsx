import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  ListItemText,
  Avatar,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import * as materialService from '../../services/materialService';
import Swal from 'sweetalert2';
import * as comprasService from '../../services/comprasService';

// Agregar configuración compartida para todas las alertas
const alertConfig = {
  customClass: {
    container: 'swal-container-highest',
    popup: 'swal-popup-highest'
  }
};

const DetalleCompra = ({ idCompra, detalles = [], onDetallesChange }) => {
  const [materiales, setMateriales] = useState([]);
  const [materialesDisponibles, setMaterialesDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newDetalle, setNewDetalle] = useState({
    idMaterial: '',
    cantidad: '',
    precioUnitario: '',
    iva: 0,
    descuento: 0,
    observaciones: '' // Agregar campo de observaciones al estado inicial
  });

  useEffect(() => {
    const fetchMateriales = async () => {
      try {
        setLoading(true);
        const data = await materialService.getMaterials();
        
        // Transform the data to ensure proper structure
        const transformedData = data.map(material => ({
          ...material,
          id_material: material.id_material.toString(),
          imagen_url: material.imagen_url ? `http://localhost:4001/${material.imagen_url}` : null,
          nombre: material.nombre || 'Sin nombre', // Ensure nombre exists
          codigo: material.codigo || 'Sin código' // Ensure codigo exists
        }));
        
        setMateriales(transformedData);
        
        // Filter out materials that are already in detalles
        const materialesAgregadosIds = detalles.map(d => d.idMaterial?.toString());
        const disponibles = transformedData.filter(m => !materialesAgregadosIds.includes(m.id_material));
        setMaterialesDisponibles(disponibles);
      } catch (error) {
        console.error('Error al cargar materiales:', error);
        Swal.fire({
          title: 'Error',
          text: 'Error al cargar los materiales',
          icon: 'error',
          ...alertConfig
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMateriales();
  }, [detalles]);

  const handleAddDetalle = () => {
    try {
      if (!newDetalle.idMaterial) {
        throw new Error('Debe seleccionar un material');
      }

      if (!newDetalle.cantidad || newDetalle.cantidad <= 0) {
        throw new Error('La cantidad debe ser mayor a 0');
      }

      if (!newDetalle.precioUnitario || newDetalle.precioUnitario <= 0) {
        throw new Error('El precio unitario debe ser mayor a 0');
      }

      console.log('Formulario de detalle:', newDetalle);

      const material = materiales.find(m => m.id_material.toString() === newDetalle.idMaterial.toString());
      if (!material) {
        throw new Error('Material no encontrado');
      }

      const subtotal = newDetalle.cantidad * newDetalle.precioUnitario;
      const ivaMonto = (subtotal * (newDetalle.iva || 0)) / 100;
      const descuentoMonto = (subtotal * (newDetalle.descuento || 0)) / 100;
      const total = subtotal + ivaMonto - descuentoMonto;

      console.log('Cálculos del detalle:', {
        subtotal,
        ivaMonto,
        descuentoMonto,
        total
      });

      const detalle = {
        idCompra,
        idMaterial: newDetalle.idMaterial,
        material: material.nombre,
        codigo: material.codigo,
        imagen: material.imagen_url,
        cantidad: parseFloat(newDetalle.cantidad),
        precioUnitario: parseFloat(newDetalle.precioUnitario),
        subtotal,
        iva: parseFloat(newDetalle.iva || 0),
        ivaMonto,
        descuento: parseFloat(newDetalle.descuento || 0),
        descuentoMonto,
        total,
        observaciones: newDetalle.observaciones || '' // Agregar campo de observaciones
      };

      console.log('Nuevo detalle creado:', detalle);

      onDetallesChange([...detalles, detalle]);
      setNewDetalle({
        idMaterial: '',
        cantidad: '',
        precioUnitario: '',
        iva: 0,
        descuento: 0,
      });
    } catch (error) {
      console.error('Error al agregar detalle:', error);
      Swal.fire({
        title: 'Error',
        text: error.message,
        icon: 'error',
        ...alertConfig
      });
    }
  };

  const handleRemoveDetalle = (index) => {
    const newDetalles = detalles.filter((_, i) => i !== index);
    onDetallesChange(newDetalles);
  };

  const calculateTotals = () => {
    return detalles.reduce(
      (acc, detalle) => ({
        subtotal: acc.subtotal + detalle.subtotal,
        iva: acc.iva + detalle.ivaMonto,
        descuento: acc.descuento + detalle.descuentoMonto,
        total: acc.total + detalle.total,
      }),
      { subtotal: 0, iva: 0, descuento: 0, total: 0 }
    );
  };

  const handleSearchChange = (event) => {
    const searchValue = event.target.value.toLowerCase();
    setSearchTerm(searchValue);
    
    const filtered = materiales.filter(material => 
      String(material.nombre || '').toLowerCase().includes(searchValue) ||
      String(material.codigo || '').toLowerCase().includes(searchValue)
    );
    setMaterialesDisponibles(filtered);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
        <Typography component="span">Cargando materiales...</Typography>
      </Box>
    );
  }

  const totals = calculateTotals();

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <FormControl sx={{ minWidth: '300px', flex: 2 }}>
          <InputLabel id="material-select-label">Material</InputLabel>
          <Select
            labelId="material-select-label"
            value={newDetalle.idMaterial}
            onChange={(e) => setNewDetalle({ ...newDetalle, idMaterial: e.target.value })}
            label="Material"
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 300,
                  width: 'auto',
                  minWidth: '300px'
                },
              },
            }}
          >
            {Array.isArray(materialesDisponibles) && materialesDisponibles.map((material) => (
              <MenuItem key={material.id_material} value={material.id_material}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {material.imagen_url && (
                    <Avatar
                      src={material.imagen_url}
                      alt={String(material.nombre || '')}
                      sx={{ width: 32, height: 32 }}
                    />
                  )}
                  <Box>
                    <Typography component="div" variant="body1">
                      {String(material.nombre || '')}
                    </Typography>
                    <Typography component="div" variant="caption" color="text.secondary">
                      Código: {String(material.codigo || '')}
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Cantidad"
          type="number"
          value={newDetalle.cantidad}
          onChange={(e) => setNewDetalle({ ...newDetalle, cantidad: parseFloat(e.target.value) })}
          sx={{ flex: 1 }}
        />
        <TextField
          label="Precio Unitario"
          type="number"
          value={newDetalle.precioUnitario}
          onChange={(e) => setNewDetalle({ ...newDetalle, precioUnitario: parseFloat(e.target.value) })}
          sx={{ flex: 1 }}
        />
        <TextField
          label="IVA (%)"
          type="number"
          value={newDetalle.iva}
          onChange={(e) => setNewDetalle({ ...newDetalle, iva: parseFloat(e.target.value) })}
          sx={{ flex: 1 }}
        />
        <TextField
          label="Descuento (%)"
          type="number"
          value={newDetalle.descuento}
          onChange={(e) => setNewDetalle({ ...newDetalle, descuento: parseFloat(e.target.value) })}
          sx={{ flex: 1 }}
        />
        <Button 
          variant="contained" 
          onClick={handleAddDetalle}
          sx={{ 
            minWidth: '120px',
            height: '56px',
            fontSize: '1rem'
          }}
        >
          Agregar
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Material</TableCell>
              <TableCell align="right">Cantidad</TableCell>
              <TableCell align="right">Precio Unitario</TableCell>
              <TableCell align="right">Subtotal</TableCell>
              <TableCell align="right">IVA</TableCell>
              <TableCell align="right">Descuento</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {detalles.map((detalle, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {detalle.imagen && (
                      <Avatar
                        src={detalle.imagen}
                        alt={String(detalle.material || '')}
                        sx={{ width: 24, height: 24 }}
                      />
                    )}
                    <Box>
                      <Typography component="div">{String(detalle.material || '')}</Typography>
                      <Typography component="div" variant="caption" sx={{ color: 'text.secondary' }}>
                        {String(detalle.codigo || '')}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell align="right">{String(detalle.cantidad || '')}</TableCell>
                <TableCell align="right">{(detalle.precioUnitario || 0).toFixed(2)}</TableCell>
                <TableCell align="right">{(detalle.subtotal || 0).toFixed(2)}</TableCell>
                <TableCell align="right">{(detalle.ivaMonto || 0).toFixed(2)}</TableCell>
                <TableCell align="right">{(detalle.descuentoMonto || 0).toFixed(2)}</TableCell>
                <TableCell align="right">{(detalle.total || 0).toFixed(2)}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleRemoveDetalle(index)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={3} align="right">
                <Typography component="div"><strong>Totales</strong></Typography>
              </TableCell>
              <TableCell align="right">{(totals.subtotal || 0).toFixed(2)}</TableCell>
              <TableCell align="right">{(totals.iva || 0).toFixed(2)}</TableCell>
              <TableCell align="right">{(totals.descuento || 0).toFixed(2)}</TableCell>
              <TableCell align="right">{(totals.total || 0).toFixed(2)}</TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default DetalleCompra;