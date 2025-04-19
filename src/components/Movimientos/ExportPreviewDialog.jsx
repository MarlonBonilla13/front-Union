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
  MenuItem,
  useTheme
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { getMaterials } from '../../services/materialService';

const ExportPreviewDialog = ({ open, onClose, data, onExportExcel, onExportPDF }) => {
  const theme = useTheme();
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

  const selectStyles = {
    '& .MuiSelect-select': {
      color: theme.palette.text.primary,
      backgroundColor: theme.palette.background.paper,
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.divider,
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.primary.main,
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.primary.main,
    },
    '& .MuiSelect-icon': {
      color: theme.palette.text.primary,
    }
  };

  const menuProps = {
    PaperProps: {
      style: {
        maxHeight: 300,
        marginTop: 8,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        border: `1px solid ${theme.palette.divider}`,
      }
    },
    MenuListProps: {
      style: {
        padding: 0,
      }
    }
  };

  const menuItemStyles = {
    '&.MuiMenuItem-root': {
      color: theme.palette.text.primary,
      '&:hover': {
        backgroundColor: theme.palette.action.hover,
      },
      '&.Mui-selected': {
        backgroundColor: theme.palette.action.selected,
        '&:hover': {
          backgroundColor: theme.palette.action.selected,
        }
      }
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        style: {
          backgroundColor: theme.palette.background.paper,
          minHeight: '80vh',
        }
      }}
    >
      <DialogTitle sx={{ pb: 3 }}>
        <Typography variant="h5" component="div" color="textPrimary" fontWeight="500">
          Vista Previa de Exportación
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 3, marginTop: 2 }}>
          <FormControl sx={{ minWidth: 250 }}>
            <InputLabel sx={{ color: theme.palette.text.primary, backgroundColor: theme.palette.background.paper, px: 1 }}>
              Material
            </InputLabel>
            <Select
              value={selectedMaterial}
              onChange={handleMaterialChange}
              label="Material"
              sx={selectStyles}
              MenuProps={menuProps}
            >
              <MenuItem value="" sx={menuItemStyles}>
                <em>Todos</em>
              </MenuItem>
              {materials.map((material) => (
                <MenuItem 
                  key={material.id_material} 
                  value={material.id_material}
                  sx={menuItemStyles}
                >
                  {material.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel sx={{ color: theme.palette.text.primary, backgroundColor: theme.palette.background.paper, px: 1 }}>
              Mes
            </InputLabel>
            <Select
              value={selectedMonth}
              onChange={handleMonthChange}
              label="Mes"
              sx={selectStyles}
              MenuProps={menuProps}
            >
              <MenuItem value="" sx={menuItemStyles}>
                <em>Todos</em>
              </MenuItem>
              {months.map((month) => (
                <MenuItem 
                  key={month.value} 
                  value={month.value}
                  sx={menuItemStyles}
                >
                  {month.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel sx={{ color: theme.palette.text.primary, backgroundColor: theme.palette.background.paper, px: 1 }}>
              Año
            </InputLabel>
            <Select
              value={selectedYear}
              onChange={handleYearChange}
              label="Año"
              sx={selectStyles}
              MenuProps={menuProps}
            >
              {years.map((year) => (
                <MenuItem 
                  key={year} 
                  value={year}
                  sx={menuItemStyles}
                >
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleApplyFilters}
            sx={{ 
              height: 56,
              px: 4,
              fontSize: '1rem'
            }}
          >
            APLICAR FILTROS
          </Button>
        </Box>

        {filteredData && filteredData.length > 0 ? (
          <TableContainer 
            component={Paper} 
            sx={{ 
              maxHeight: '55vh',
              mb: 2,
              '& .MuiTableCell-root': {
                px: 3,
                py: 2,
                fontSize: '0.95rem'
              },
              '& .MuiTableCell-head': {
                fontWeight: 600,
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.common.white
              }
            }}
          >
            <Table stickyHeader aria-label="tabla de vista previa">
              <TableHead>
                <TableRow>
                  <TableCell width="10%">Fecha</TableCell>
                  <TableCell width="8%">Código</TableCell>
                  <TableCell width="15%">Material</TableCell>
                  <TableCell width="10%">Tipo</TableCell>
                  <TableCell width="8%">Cantidad</TableCell>
                  <TableCell width="10%">Stock Actual</TableCell>
                  <TableCell width="10%">Stock Mínimo</TableCell>
                  <TableCell width="8%">Estado</TableCell>
                  <TableCell width="13%">Empleado</TableCell>
                  <TableCell width="18%">Comentario</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.map((item, index) => (
                  <TableRow 
                    key={index}
                    sx={{
                      '&:nth-of-type(odd)': {
                        backgroundColor: theme.palette.action.hover,
                      },
                      '&:hover': {
                        backgroundColor: theme.palette.action.selected,
                      }
                    }}
                  >
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
                        sx={{ minWidth: 80 }}
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
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6">No hay datos para mostrar</Typography>
          </Box>
        )}
        
        <Box sx={{ mt: 2, textAlign: 'right' }}>
          <Typography variant="h6" color="primary">
            Total de registros: {filteredData.length}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, backgroundColor: theme.palette.background.paper, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button 
          onClick={onClose} 
          sx={{ 
            color: theme.palette.text.primary,
            px: 3,
            py: 1
          }}
        >
          CERRAR
        </Button>
        <Button
          onClick={() => onExportExcel(filteredData)}
          startIcon={<FileDownloadIcon />}
          variant="contained"
          color="primary"
          sx={{ 
            mr: 2,
            px: 3,
            py: 1
          }}
        >
          EXPORTAR A EXCEL
        </Button>
        <Button
          onClick={() => onExportPDF(filteredData)}
          startIcon={<PictureAsPdfIcon />}
          variant="contained"
          color="secondary"
          sx={{ 
            px: 3,
            py: 1
          }}
        >
          EXPORTAR A PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportPreviewDialog;