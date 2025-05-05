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
  });

  useEffect(() => {
    const fetchMateriales = async () => {
      try {
        const data = await materialService.getMaterials();
        setMateriales(data);
        setMaterialesDisponibles(data);
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar materiales:', error);
        setLoading(false);
      }
    };

    fetchMateriales();
  }, []);

  useEffect(() => {
    // Actualizar materiales disponibles excluyendo los ya agregados
    const materialesAgregadosIds = detalles.map(d => d.idMaterial);
    const disponibles = materiales.filter(m => !materialesAgregadosIds.includes(m.id_material));
    setMaterialesDisponibles(disponibles);
  }, [detalles, materiales]);

  const handleAddDetalle = () => {
    if (!newDetalle.idMaterial || !newDetalle.cantidad || !newDetalle.precioUnitario) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    const material = materiales.find(m => m.id_material === newDetalle.idMaterial);
    const subtotal = newDetalle.cantidad * newDetalle.precioUnitario;
    const ivaMonto = subtotal * (newDetalle.iva / 100);
    const descuentoMonto = subtotal * (newDetalle.descuento / 100);
    const total = subtotal + ivaMonto - descuentoMonto;

    const detalle = {
      idCompra,
      idMaterial: newDetalle.idMaterial,
      material: material.nombre,
      codigo: material.codigo,
      imagen: material.imagen_url,
      cantidad: newDetalle.cantidad,
      precioUnitario: newDetalle.precioUnitario,
      subtotal,
      iva: newDetalle.iva,
      ivaMonto,
      descuento: newDetalle.descuento,
      descuentoMonto,
      total,
    };

    onDetallesChange([...detalles, detalle]);
    setNewDetalle({
      idMaterial: '',
      cantidad: '',
      precioUnitario: '',
      iva: 0,
      descuento: 0,
    });
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
      material.nombre.toLowerCase().includes(searchValue) ||
      material.codigo.toLowerCase().includes(searchValue)
    );
    setMaterialesDisponibles(filtered);
  };

  if (loading) {
    return <Typography>Cargando materiales...</Typography>;
  }

  const totals = calculateTotals();

  const MenuProps = {
    PaperProps: {
      style: {
        maxHeight: 300,
        width: 'auto',
      },
    },
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <FormControl sx={{ minWidth: '300px', flex: 2 }}>
          <InputLabel>Material</InputLabel>
          <Select
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
            <Box sx={{ p: 2, position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar material..."
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
            {materialesDisponibles.map((material) => (
              <MenuItem key={material.id_material} value={material.id_material}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  <Avatar
                    src={material.imagen_url}
                    alt={material.nombre}
                    sx={{ width: 24, height: 24 }}
                  />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography noWrap={false} sx={{ wordBreak: 'break-word' }}>
                      {material.nombre}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                      {material.codigo}
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
                    <Avatar
                      src={detalle.imagen}
                      alt={detalle.material}
                      sx={{ width: 24, height: 24 }}
                    />
                    <Box>
                      <Typography>{detalle.material}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {detalle.codigo}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell align="right">{detalle.cantidad}</TableCell>
                <TableCell align="right">{detalle.precioUnitario.toFixed(2)}</TableCell>
                <TableCell align="right">{detalle.subtotal.toFixed(2)}</TableCell>
                <TableCell align="right">{detalle.ivaMonto.toFixed(2)}</TableCell>
                <TableCell align="right">{detalle.descuentoMonto.toFixed(2)}</TableCell>
                <TableCell align="right">{detalle.total.toFixed(2)}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleRemoveDetalle(index)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={3} align="right">
                <strong>Totales</strong>
              </TableCell>
              <TableCell align="right">{totals.subtotal.toFixed(2)}</TableCell>
              <TableCell align="right">{totals.iva.toFixed(2)}</TableCell>
              <TableCell align="right">{totals.descuento.toFixed(2)}</TableCell>
              <TableCell align="right">{totals.total.toFixed(2)}</TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default DetalleCompra; 