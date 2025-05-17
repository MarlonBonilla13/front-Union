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
import { getClientes } from '../../services/clienteService';
import { getUsers } from '../../services/userService';
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
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  return null;
};

const ExportPreviewVentasDialog = ({ open, onClose, data }) => {
  const theme = useTheme();
  const [clientes, setClientes] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedEstado, setSelectedEstado] = useState('');
  const [usersMap, setUsersMap] = useState({});

  useEffect(() => {
    if (open) {
      loadClientes();
      loadUsers();
      setFilteredData(data);
    }
  }, [open, data]);

  const loadClientes = async () => {
    try {
      const clientesData = await getClientes();
      setClientes(clientesData);
    } catch (error) {
      console.error('Error cargando clientes:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const usersData = await getUsers();
      setUsers(usersData);
      
      // Crear un mapa para buscar usuarios por id
      const userMap = {};
      usersData.forEach(user => {
        userMap[user.id] = user;
      });
      setUsersMap(userMap);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  };

  // Función para obtener nombre de usuario a partir del ID
  const getUserName = (userId) => {
    if (!userId) return 'N/A';
    
    const user = usersMap[userId];
    if (user) {
      return `${user.fullName || ''} ${user.apellido || ''}`.trim();
    }
    
    return userId; // Si no se encuentra el usuario, mostrar el ID
  };

  const handleClienteChange = (event) => {
    const clienteId = event.target.value;
    setSelectedCliente(clienteId);
    
    applyFilters(clienteId, selectedMonth, selectedYear, selectedEstado);
  };

  const handleMonthChange = (event) => {
    const month = event.target.value;
    setSelectedMonth(month);
    applyFilters(selectedCliente, month, selectedYear, selectedEstado);
  };

  const handleYearChange = (event) => {
    const year = event.target.value;
    setSelectedYear(year);
    applyFilters(selectedCliente, selectedMonth, year, selectedEstado);
  };

  const handleEstadoChange = (event) => {
    const estado = event.target.value;
    setSelectedEstado(estado);
    applyFilters(selectedCliente, selectedMonth, selectedYear, estado);
  };

  const applyFilters = (cliente, month, year, estado) => {
    let filtered = [...data];
    
    // Filtrar por cliente
    if (cliente) {
      filtered = filtered.filter(item => item.id_cliente === parseInt(cliente));
    }
    
    // Filtrar por mes
    if (month) {
      filtered = filtered.filter(item => {
        const date = new Date(item.fecha || item.fecha_creacion || item.created_at);
        return date.getMonth() + 1 === parseInt(month);
      });
    }
    
    // Filtrar por año
    if (year) {
      filtered = filtered.filter(item => {
        const date = new Date(item.fecha || item.fecha_creacion || item.created_at);
        return date.getFullYear() === parseInt(year);
      });
    }
    
    // Filtrar por estado
    if (estado) {
      filtered = filtered.filter(item => item.estado_pago === estado);
    }
    
    setFilteredData(filtered);
  };

  const handleApplyFilters = () => {
    applyFilters(selectedCliente, selectedMonth, selectedYear, selectedEstado);
  };

  // Estas funciones simplemente muestran alertas indicando que la funcionalidad estará disponible más adelante
  const handleExportExcelClick = () => {
    // Cerrar temporalmente el modal para asegurar que la alerta sea visible
    onClose();
    // Pequeña espera para asegurar que el modal se cierre antes de mostrar la alerta
    setTimeout(() => {
      Swal.fire({
        title: 'Exportación a Excel',
        text: 'La funcionalidad estará disponible próximamente',
        icon: 'info',
        ...swalConfig
      });
    }, 100);
  };

  const handleExportPDFClick = () => {
    // Cerrar temporalmente el modal para asegurar que la alerta sea visible
    onClose();
    // Pequeña espera para asegurar que el modal se cierre antes de mostrar la alerta
    setTimeout(() => {
      Swal.fire({
        title: 'Exportación a PDF',
        text: 'La funcionalidad estará disponible próximamente',
        icon: 'info',
        ...swalConfig
      });
    }, 100);
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
  const estados = ['PENDIENTE', 'PAGADO', 'ANULADO'];

  // Obtener color según estado
  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'warning';
      case 'PAGADO':
        return 'success';
      case 'ANULADO':
        return 'error';
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

  // Calcular el total de ventas
  const calcularTotal = (datos) => {
    return datos.reduce((total, venta) => total + parseFloat(venta.total || 0), 0).toFixed(2);
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
            Vista Previa de Exportación - Ventas
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, marginTop: 2, flexWrap: 'wrap' }}>
            <FormControl sx={{ minWidth: 200, flex: '1 0 0' }}>
              <InputLabel sx={{ color: theme.palette.text.primary, backgroundColor: theme.palette.background.paper, px: 1 }}>
                Cliente
              </InputLabel>
              <Select
                value={selectedCliente}
                onChange={handleClienteChange}
                label="Cliente"
                sx={selectStyles}
                MenuProps={menuProps}
              >
                <MenuItem value="" sx={menuItemStyles}>
                  <em>Todos</em>
                </MenuItem>
                {clientes.map((cliente) => (
                  <MenuItem 
                    key={cliente.id_cliente} 
                    value={cliente.id_cliente}
                    sx={menuItemStyles}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body1">{cliente.nombre}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        {cliente.apellido && `${cliente.apellido} `}
                        {cliente.nombre_comercial && `(${cliente.nombre_comercial})`}
                      </Typography>
                    </Box>
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
                    <TableCell width="8%">N° Factura</TableCell>
                    <TableCell width="25%">Cliente</TableCell>
                    <TableCell width="12%">Fecha</TableCell>
                    <TableCell width="10%">Total</TableCell>
                    <TableCell width="10%">Estado</TableCell>
                    <TableCell width="10%">Tipo Pago</TableCell>
                    <TableCell width="15%">Usuario</TableCell>
                    <TableCell width="10%">Observaciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredData.map((venta, index) => (
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
                      <TableCell>{venta.numero_factura}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {venta.cliente?.nombre || 'N/A'}
                          </Typography>
                          {(venta.cliente?.apellido || venta.cliente?.nombre_comercial) && (
                            <Typography 
                              variant="caption" 
                              color="text.secondary" 
                              sx={{ fontSize: '0.75rem', display: 'block' }}
                            >
                              {venta.cliente?.apellido && `${venta.cliente.apellido}`}
                              {venta.cliente?.apellido && venta.cliente?.nombre_comercial && ' - '}
                              {venta.cliente?.nombre_comercial && `${venta.cliente.nombre_comercial}`}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {venta.fecha_creacion 
                          ? new Date(venta.fecha_creacion).toLocaleDateString() 
                          : venta.fecha 
                            ? new Date(venta.fecha).toLocaleDateString()
                            : venta.created_at
                              ? new Date(venta.created_at).toLocaleDateString()
                              : 'N/A'}
                      </TableCell>
                      <TableCell>Q{parseFloat(venta.total || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip
                          label={venta.estado_pago}
                          color={getEstadoColor(venta.estado_pago)}
                          size="small"
                          sx={{ minWidth: 80 }}
                        />
                      </TableCell>
                      <TableCell>{venta.tipo_pago}</TableCell>
                      <TableCell>{getUserName(venta.usuario_creacion)}</TableCell>
                      <TableCell>{venta.observaciones || '-'}</TableCell>
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
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Typography variant="h6" color="primary">
              Total de ventas: Q{calcularTotal(filteredData)}
            </Typography>
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
            onClick={handleExportExcelClick}
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
            onClick={handleExportPDFClick}
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

export default ExportPreviewVentasDialog; 