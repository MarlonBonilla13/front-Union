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
import { getProveedores } from '../../services/proveedorService';
import Swal from 'sweetalert2';

// Configuración para asegurar que las alertas aparezcan por encima del modal
const swalConfig = {
  customClass: {
    container: 'swal-container-highest',
    popup: 'swal-popup-highest'
  }
};

// Agregar estilos globales para las alertas
const SwalStyles = () => {
  useEffect(() => {
    // Crear un elemento de estilo
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      .swal-container-highest {
        z-index: 9999 !important;
      }
      .swal-popup-highest {
        z-index: 9999 !important;
      }
    `;
    // Añadir al head del documento
    document.head.appendChild(styleElement);

    // Limpiar cuando el componente se desmonte
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return null;
};

const ExportPreviewComprasDialog = ({ open, onClose, data, onExportExcel, onExportPDF }) => {
  const theme = useTheme();
  const [proveedores, setProveedores] = useState([]);
  const [selectedProveedor, setSelectedProveedor] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedEstado, setSelectedEstado] = useState('');

  useEffect(() => {
    if (open) {
      loadProveedores();
      setFilteredData(data);
    }
  }, [open, data]);

  const loadProveedores = async () => {
    try {
      const proveedoresData = await getProveedores();
      setProveedores(proveedoresData);
    } catch (error) {
      console.error('Error cargando proveedores:', error);
    }
  };

  const handleProveedorChange = (event) => {
    const proveedorId = event.target.value;
    setSelectedProveedor(proveedorId);
    
    applyFilters(proveedorId, selectedMonth, selectedYear, selectedEstado);
  };

  const handleMonthChange = (event) => {
    const month = event.target.value;
    setSelectedMonth(month);
    applyFilters(selectedProveedor, month, selectedYear, selectedEstado);
  };

  const handleYearChange = (event) => {
    const year = event.target.value;
    setSelectedYear(year);
    applyFilters(selectedProveedor, selectedMonth, year, selectedEstado);
  };

  const handleEstadoChange = (event) => {
    const estado = event.target.value;
    setSelectedEstado(estado);
    applyFilters(selectedProveedor, selectedMonth, selectedYear, estado);
  };

  const applyFilters = (proveedor, month, year, estado) => {
    let filtered = [...data];
    
    // Filtrar por proveedor
    if (proveedor) {
      filtered = filtered.filter(item => item.id_proveedores === proveedor);
    }
    
    // Filtrar por mes
    if (month) {
      filtered = filtered.filter(item => {
        const date = new Date(item.fecha_compra || item.fecha_vencimiento || item.created_at);
        return date.getMonth() + 1 === parseInt(month);
      });
    }
    
    // Filtrar por año
    if (year) {
      filtered = filtered.filter(item => {
        const date = new Date(item.fecha_compra || item.fecha_vencimiento || item.created_at);
        return date.getFullYear() === parseInt(year);
      });
    }
    
    // Filtrar por estado
    if (estado) {
      filtered = filtered.filter(item => 
        (item.estado_pago || item.estado) === estado
      );
    }
    
    setFilteredData(filtered);
  };

  const handleApplyFilters = () => {
    applyFilters(selectedProveedor, selectedMonth, selectedYear, selectedEstado);
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

  // Opciones para estados
  const estados = ['PENDIENTE', 'APROBADO', 'RECHAZADO', 'ANULADO'];

  // Obtener color según estado
  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'warning';
      case 'APROBADA':
      case 'APROBADO':
        return 'success';
      case 'RECHAZADA':
      case 'RECHAZADO':
        return 'error';
      case 'CANCELADA':
      case 'ANULADO':
        return 'info';
      default:
        return 'default';
    }
  };

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

  // Modificar las funciones de exportación para incluir temporalmente cerrar el modal
  const handleExportExcelClick = async (data) => {
    // Cerrar temporalmente el modal para mostrar la alerta
    onClose();
    // Pequeña espera para asegurar que el modal se cierre antes de mostrar la alerta
    setTimeout(() => {
      onExportExcel(data);
    }, 100);
  };

  const handleExportPDFClick = async (data) => {
    // Cerrar temporalmente el modal para mostrar la alerta
    onClose();
    // Pequeña espera para asegurar que el modal se cierre antes de mostrar la alerta
    setTimeout(() => {
      onExportPDF(data);
    }, 100);
  };

  return (
    <>
      <SwalStyles />
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
            Vista Previa de Exportación - Compras
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, marginTop: 2, flexWrap: 'wrap' }}>
            <FormControl sx={{ minWidth: 200, flex: '1 0 0' }}>
              <InputLabel sx={{ color: theme.palette.text.primary, backgroundColor: theme.palette.background.paper, px: 1 }}>
                Proveedor
              </InputLabel>
              <Select
                value={selectedProveedor}
                onChange={handleProveedorChange}
                label="Proveedor"
                sx={selectStyles}
                MenuProps={menuProps}
              >
                <MenuItem value="" sx={menuItemStyles}>
                  <em>Todos</em>
                </MenuItem>
                {proveedores.map((proveedor) => (
                  <MenuItem 
                    key={proveedor.id_proveedores} 
                    value={proveedor.id_proveedores}
                    sx={menuItemStyles}
                  >
                    {proveedor.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl sx={{ minWidth: 150, flex: '1 0 0' }}>
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
            
            <FormControl sx={{ minWidth: 120, flex: '1 0 0' }}>
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

            <FormControl sx={{ minWidth: 150, flex: '1 0 0' }}>
              <InputLabel sx={{ color: theme.palette.text.primary, backgroundColor: theme.palette.background.paper, px: 1 }}>
                Estado
              </InputLabel>
              <Select
                value={selectedEstado}
                onChange={handleEstadoChange}
                label="Estado"
                sx={selectStyles}
                MenuProps={menuProps}
              >
                <MenuItem value="" sx={menuItemStyles}>
                  <em>Todos</em>
                </MenuItem>
                {estados.map((estado) => (
                  <MenuItem 
                    key={estado} 
                    value={estado}
                    sx={menuItemStyles}
                  >
                    {estado}
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
                fontSize: '1rem',
                flex: '0 0 auto'
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
                    <TableCell width="10%">N° Factura</TableCell>
                    <TableCell width="20%">Proveedor</TableCell>
                    <TableCell width="10%">Contacto</TableCell>
                    <TableCell width="10%">Fecha</TableCell>
                    <TableCell width="10%">Total</TableCell>
                    <TableCell width="10%">Estado</TableCell>
                    <TableCell width="10%">Tipo Pago</TableCell>
                    <TableCell width="20%">Observaciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredData.map((compra, index) => (
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
                      <TableCell>{compra.numero_factura}</TableCell>
                      <TableCell>{compra.proveedor?.nombre || 'N/A'}</TableCell>
                      <TableCell>{compra.proveedor?.contacto || 'N/A'}</TableCell>
                      <TableCell>
                        {compra.fecha_compra 
                          ? new Date(compra.fecha_compra).toLocaleDateString() 
                          : compra.fecha_vencimiento 
                            ? new Date(compra.fecha_vencimiento).toLocaleDateString() 
                            : 'N/A'}
                      </TableCell>
                      <TableCell>Q{parseFloat(compra.total || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip
                          label={compra.estado_pago || compra.estado}
                          color={getEstadoColor(compra.estado_pago || compra.estado)}
                          size="small"
                          sx={{ minWidth: 80 }}
                        />
                      </TableCell>
                      <TableCell>{compra.tipo_pago}</TableCell>
                      <TableCell>{compra.observaciones || '-'}</TableCell>
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
            onClick={() => handleExportExcelClick(filteredData)}
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
            onClick={() => handleExportPDFClick(filteredData)}
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
    </>
  );
};

export default ExportPreviewComprasDialog;
