import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { getMaterials } from '../../services/materialService';

const ExportPreviewDialog = ({ open, onClose, data, onExportExcel, onExportPDF }) => {
  const [materials, setMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    if (open) {
      loadMaterials();
      setFilteredData(data);
    }
  }, [open, data]);

  const loadMaterials = async () => {
    try {
      const materialsData = await getMaterials();
      setMaterials(materialsData);
    } catch (error) {
      console.error('Error cargando materiales:', error);
    }
  };

  const handleMaterialChange = (event) => {
    const materialId = event.target.value;
    setSelectedMaterial(materialId);
    
    if (materialId === '') {
      // Si se selecciona "Todos", mostrar todos los datos
      applyFilters('', selectedMonth, selectedYear);
    } else {
      // Filtrar por material seleccionado
      applyFilters(materialId, selectedMonth, selectedYear);
    }
  };

  const handleMonthChange = (event) => {
    const month = event.target.value;
    setSelectedMonth(month);
    applyFilters(selectedMaterial, month, selectedYear);
  };

  const handleYearChange = (event) => {
    const year = event.target.value;
    setSelectedYear(year);
    applyFilters(selectedMaterial, selectedMonth, year);
  };

  const applyFilters = (material, month, year) => {
    let filtered = [...data];
    
    // Filtrar por material
    if (material) {
      filtered = filtered.filter(item => item.id_material === material);
    }
    
    // Filtrar por mes
    if (month) {
      filtered = filtered.filter(item => {
        const date = new Date(item.fecha);
        return date.getMonth() + 1 === parseInt(month);
      });
    }
    
    // Filtrar por año
    if (year) {
      filtered = filtered.filter(item => {
        const date = new Date(item.fecha);
        return date.getFullYear() === parseInt(year);
      });
    }
    
    setFilteredData(filtered);
  };

  const handleApplyFilters = () => {
    applyFilters(selectedMaterial, selectedMonth, selectedYear);
  };

  // Generar opciones para los meses
  const months = [
    { value: '1', label: 'enero' },
    { value: '2', label: 'febrero' },
    { value: '3', label: 'marzo' },
    { value: '4', label: 'abril' },
    { value: '5', label: 'mayo' },
    { value: '6', label: 'junio' },
    { value: '7', label: 'julio' },
    { value: '8', label: 'agosto' },
    { value: '9', label: 'septiembre' },
    { value: '10', label: 'octubre' },
    { value: '11', label: 'noviembre' },
    { value: '12', label: 'diciembre' }
  ];

  // Generar opciones para los años (últimos 5 años)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h6" component="div">
          Vista Previa de Exportación
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Material</InputLabel>
            <Select
              value={selectedMaterial}
              onChange={handleMaterialChange}
              label="Material"
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 300,
                    marginTop: 15  // Aumentado a 15 para que sea consistente con los otros
                  }
                }
              }}
            >
              <MenuItem value="">
                <em>Todos</em>
              </MenuItem>
              {materials.map((material) => (
                <MenuItem key={material.id_material} value={material.id_material}>
                  {material.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Mes</InputLabel>
            <Select
              value={selectedMonth}
              onChange={handleMonthChange}
              label="Mes"
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 300,
                    marginTop: 15  // Aumentado a 15 para que sea consistente
                  }
                }
              }}
            >
              <MenuItem value="">
                <em>Todos</em>
              </MenuItem>
              {months.map((month) => (
                <MenuItem key={month.value} value={month.value}>
                  {month.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Año</InputLabel>
            <Select
              value={selectedYear}
              onChange={handleYearChange}
              label="Año"
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 300,
                    marginTop: 15  // Aumentado de 5 a 15 para bajar más el menú
                  }
                }
              }}
            >
              {years.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleApplyFilters}
            sx={{ height: 56 }}
          >
            APLICAR FILTROS
          </Button>
        </Box>

        {filteredData && filteredData.length > 0 ? (
          <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
            <Table stickyHeader aria-label="tabla de vista previa">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Código</TableCell>
                  <TableCell>Material</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Cantidad</TableCell>
                  <TableCell>Stock Actual</TableCell>
                  <TableCell>Stock Mínimo</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Empleado</TableCell>
                  <TableCell>Comentario</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{new Date(item.fecha).toLocaleDateString()}</TableCell>
                    <TableCell>{item.codigo}</TableCell>
                    <TableCell>{item.nombre}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.tipo_movimiento}
                        color={
                          item.tipo_movimiento.toLowerCase() === 'entrada' 
                            ? 'success' 
                            : item.tipo_movimiento.toLowerCase() === 'solicitud'
                            ? 'warning'
                            : 'error'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{item.cantidad || '-'}</TableCell>
                    <TableCell>{item.Stock_actual}</TableCell>
                    <TableCell>{item.Stock_minimo}</TableCell>
                    <TableCell>{item.estado || '-'}</TableCell>
                    <TableCell>
                      {item.empleado 
                        ? `${item.empleado.nombre} ${item.empleado.apellido}` 
                        : 'N/A'}
                    </TableCell>
                    <TableCell>{item.comentario || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body1">No hay datos para mostrar</Typography>
          </Box>
        )}
        
        <Box sx={{ mt: 2, textAlign: 'right' }}>
          <Typography variant="body2">
            Total de registros: {filteredData.length}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose} 
          color="inherit"
        >
          CERRAR
        </Button>
        <Button 
          onClick={() => onExportExcel(filteredData)} 
          startIcon={<FileDownloadIcon />}
          variant="contained" 
          color="primary"
          disabled={!filteredData || filteredData.length === 0}
        >
          EXPORTAR A EXCEL
        </Button>
        <Button 
          onClick={() => onExportPDF(filteredData)} 
          startIcon={<PictureAsPdfIcon />}
          variant="contained" 
          color="secondary"
          disabled={!filteredData || filteredData.length === 0}
        >
          EXPORTAR A PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportPreviewDialog;