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
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreIcon from '@mui/icons-material/Restore';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { createEmpleado, getEmpleado, updateEmpleado, getEmpleados, deleteEmpleado } from '../../services/empleadoService';
import Swal from 'sweetalert2';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';

const EmpleadoForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [empleados, setEmpleados] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('activos');
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado inicial del formulario
  const initialFormState = {
    codigo_empleado: '',
    nombre: '',
    apellido: '',
    departamento: '',
    cargo: '',
    email: '',
    telefono: '',
    fecha_ingreso: new Date().toISOString().split('T')[0],
    estado: true
  };

  const [formData, setFormData] = useState(initialFormState);

  // Función auxiliar para formatear fechas
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  };

  // Función para limpiar el formulario
  const resetForm = () => {
    setFormData(initialFormState);
    setIsEditMode(false);
  };

  // Función para asegurar formato de fecha válido
  const asegurarFormatoFechaValido = (fecha) => {
    // Usamos un formato que sea compatible con NestJS (@IsDate)
    // NestJS espera una fecha que pueda ser convertida a objeto Date

    // Si ya está en formato YYYY-MM-DD, verificar que sea válido
    if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      // Verificar que sea una fecha válida
      const [year, month, day] = fecha.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      if (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
      ) {
        // Formato correcto para backend - añadimos la hora
        return `${fecha}T00:00:00.000Z`;
      }
    }
    
    // Intentar convertir otros formatos
    try {
      // Primero verificar si es MM/DD/YYYY
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(fecha)) {
        const [month, day, year] = fecha.split('/').map(Number);
        const date = new Date(year, month - 1, day);
        return date.toISOString();
      }
      
      // Si no, intentar convertir con Date
      const date = new Date(fecha);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    } catch (error) {
      console.error('Error al convertir fecha:', error);
    }
    
    // Si no se puede convertir, devolver la fecha actual en formato ISO
    return new Date().toISOString();
  };

  // Función para cargar la lista de empleados
  const loadEmpleados = async () => {
    try {
      const data = await getEmpleados();
      if (Array.isArray(data)) {
        const formattedData = data.map(emp => ({
          ...emp,
          fecha_ingreso: formatDate(emp.fecha_ingreso)
        }));
        setEmpleados(formattedData);
      } else if (data && Array.isArray(data.empleados)) {
        const formattedData = data.empleados.map(emp => ({
          ...emp,
          fecha_ingreso: formatDate(emp.fecha_ingreso)
        }));
        setEmpleados(formattedData);
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

  // Función para cargar los datos del empleado
  const loadEmpleadoData = async (empleadoId) => {
    try {
      const empleadoData = await getEmpleado(empleadoId);
      
      // Asegurar que la fecha tenga el formato correcto
      const fechaFormateada = asegurarFormatoFechaValido(empleadoData.fecha_ingreso);
      
      setFormData({
        ...empleadoData,
        fecha_ingreso: fechaFormateada
      });
      setIsEditMode(true);
      
      console.log('Empleado cargado con éxito:', {
        ...empleadoData,
        fecha_ingreso: fechaFormateada
      });
    } catch (error) {
      console.error('Error loading employee:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cargar la información del empleado'
      });
      resetForm();
    }
  };

  // Effect para cargar datos iniciales
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      await loadEmpleados();
      if (id) {
        await loadEmpleadoData(id);
      } else {
        resetForm();
      }
      setIsLoading(false);
    };

    initializeData();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    let loadingDialog = null;
    
    try {
      console.log('Formulario enviado con datos:', formData);
      
      // Validar campos requeridos
      const camposRequeridos = ['codigo_empleado', 'nombre', 'apellido', 'departamento', 'cargo', 'fecha_ingreso'];
      for (const campo of camposRequeridos) {
        if (!formData[campo]) {
          await Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `El campo ${campo.replace('_', ' ')} es requerido`
          });
          return;
        }
      }

      // Validar formato de fecha
      if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.fecha_ingreso)) {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'La fecha debe tener el formato YYYY-MM-DD'
        });
        return;
      }

      // Validar formato de código de empleado
      // Podemos establecer una regla específica, por ejemplo solo letras, números y guiones
      if (!/^[A-Za-z0-9\-]+$/.test(formData.codigo_empleado)) {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'El código de empleado solo debe contener letras, números y guiones'
        });
        return;
      }

      // Validar email si se proporciona
      if (formData.email && !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'El formato del email no es válido'
        });
        return;
      }

      // Preparar datos para envío con fecha validada (o sin fecha si se ha elegido omitirla)
      const empleadoData = {
        codigo_empleado: formData.codigo_empleado.trim(),
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        departamento: formData.departamento.trim(),
        cargo: formData.cargo.trim(),
        email: formData.email?.trim() || null,
        telefono: formData.telefono?.trim() || null,
        estado: formData.estado ?? true
      };

      // Solo incluir la fecha si no se ha elegido omitirla
      if (!opcionesAvanzadas.omitirFecha) {
        empleadoData.fecha_ingreso = asegurarFormatoFechaValido(formData.fecha_ingreso);
      }

      console.log('Modo:', isEditMode ? 'Edición' : 'Creación');
      console.log('Datos a enviar:', empleadoData);

      // Variable para tiempo límite (10 segundos)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('La operación ha tardado demasiado tiempo. Por favor, inténtelo de nuevo.')), 10000);
      });

      // Mostrar indicador de carga
      loadingDialog = Swal.fire({
        title: 'Procesando...',
        text: 'Por favor espere mientras se procesa la solicitud',
        didOpen: () => {
          Swal.showLoading();
        },
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false
      });

      if (isEditMode) {
        // Utilizar Promise.race para manejar tiempos de espera
        const result = await Promise.race([
          updateEmpleado(formData.id_empleado, empleadoData),
          timeoutPromise
        ]);
        
        // Si llegamos aquí, la operación fue exitosa
        if (loadingDialog) {
          Swal.close();
        }
        
        await Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Empleado actualizado correctamente',
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        // Utilizar Promise.race para manejar tiempos de espera
        const result = await Promise.race([
          createEmpleado(empleadoData),
          timeoutPromise
        ]);
        
        // Si llegamos aquí, la operación fue exitosa
        if (loadingDialog) {
          Swal.close();
        }
        
        await Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Empleado registrado correctamente',
          timer: 1500,
          showConfirmButton: false
        });
      }

      // Recargar lista de empleados y reiniciar formulario
      await loadEmpleados();
      resetForm();
    } catch (error) {
      console.error('Error en el envío del formulario:', error);
      
      // Cerrar diálogo de carga si está abierto
      if (loadingDialog) {
        Swal.close();
      }
      
      // Determinar si fue un error de timeout
      const esTiempoExcedido = error.message && error.message.includes('tardado demasiado tiempo');
      
      // Mostrar mensaje de error con detalles específicos
      let errorMsg = error.message || 'Ha ocurrido un error al procesar la solicitud';
      
      // Añadir información más detallada para depuración
      console.error('Detalles completos del error:', {
        mensaje: error.message,
        esTimeout: esTiempoExcedido,
        respuesta: error.response?.data,
        estado: error.response?.status,
        config: error.config,
        datos: formData
      });
      
      // Depuración específica para errores 500
      if (error.response?.status === 500) {
        console.error('Error 500 detectado, información detallada:', {
          url: error.config?.url,
          método: error.config?.method,
          headers: error.config?.headers,
          datosEnviados: error.config?.data
        });
      }
      
      // Determinar si podría ser un problema con la fecha
      const posibleErrorDeFecha = 
        errorMsg.includes('fecha') || 
        errorMsg.includes('date') || 
        errorMsg.includes('500') ||
        esTiempoExcedido;
      
      // Sugerencias específicas según el error
      let sugerenciasFecha = '';
      if (posibleErrorDeFecha) {
        const fechaActual = formData.fecha_ingreso;
        sugerenciasFecha = `
          - Verifique que la fecha tenga el formato YYYY-MM-DD<br>
          - Fecha actual: ${fechaActual}<br>
          - Intente con: ${asegurarFormatoFechaValido(fechaActual)}<br>
        `;
      }
      
      await Swal.fire({
        icon: esTiempoExcedido ? 'warning' : 'error',
        title: esTiempoExcedido ? 'Tiempo excedido' : 'Error',
        text: errorMsg,
        html: `
          <div>
            <p>${errorMsg}</p>
            ${posibleErrorDeFecha ? `
              <div style="margin: 15px 0; text-align: left; border: 1px solid #ddd; padding: 10px; border-radius: 5px;">
                <h4 style="margin-top: 0; color: #d33;">Opciones avanzadas para problemas de fecha</h4>
                <label style="display: flex; align-items: center; margin: 10px 0;">
                  <input type="checkbox" id="omitirFecha" ${opcionesAvanzadas.omitirFecha ? 'checked' : ''}>
                  <span style="margin-left: 5px;">Omitir actualización de fecha</span>
                </label>
                <p style="font-size: 11px; color: #666; margin: 5px 0 0 20px;">
                  Use esta opción si el servidor está rechazando el formato de fecha.
                  Solo los demás campos serán actualizados.
                </p>
              </div>
            ` : ''}
          </div>
        `,
        footer: `
          <div style="text-align: left; font-size: 12px; color: #666; margin-top: 10px;">
            <strong>Sugerencias:</strong><br>
            ${sugerenciasFecha}
            - Compruebe que el código de empleado no esté duplicado<br>
            - Revise que todos los campos obligatorios estén completos<br>
            ${esTiempoExcedido ? '- El servidor podría estar ocupado, intente de nuevo más tarde<br>' : ''}
            - Si el problema persiste, contacte con soporte técnico
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Reintentar',
        cancelButtonText: 'Cancelar',
        allowOutsideClick: true,
        preConfirm: () => {
          // Capturar el valor del checkbox antes de cerrar
          if (posibleErrorDeFecha) {
            const omitirFecha = document.getElementById('omitirFecha')?.checked || false;
            setOpcionesAvanzadas(prev => ({
              ...prev,
              omitirFecha,
              intentosConectividad: prev.intentosConectividad + 1
            }));
            return { omitirFecha };
          }
          return {};
        }
      }).then((result) => {
        if (result.isConfirmed) {
          // Si el usuario elige reintentar, intentamos nuevamente con las opciones actualizadas
          console.log('Reintentando con opciones:', result.value);
          
          // Esperar un momento antes de reenviar
          setTimeout(() => {
            handleSubmit(new Event('submit'));
          }, 500);
        }
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

  const handleEdit = (empleadoId) => {
    if (!empleadoId) {
      console.error('ID de empleado no válido');
      return;
    }
    const empleado = empleados.find(emp => emp.id_empleado === empleadoId);
    if (empleado) {
      // Asegurar que la fecha tenga un formato válido antes de cargarla
      const fechaCorregida = asegurarFormatoFechaValido(empleado.fecha_ingreso);
      console.log(`Fecha original: ${empleado.fecha_ingreso}, Fecha corregida: ${fechaCorregida}`);
      
      setFormData({
        ...empleado,
        fecha_ingreso: fechaCorregida
      });
      setIsEditMode(true);
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

  const handleFiltroChange = (event, nuevoFiltro) => {
    if (nuevoFiltro !== null) {
      setFiltroEstado(nuevoFiltro);
    }
  };

  const empleadosFiltrados = empleados.filter(emp => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (emp.codigo_empleado?.toLowerCase() || '').includes(searchLower) ||
      (emp.nombre?.toLowerCase() || '').includes(searchLower) ||
      (emp.departamento?.toLowerCase() || '').includes(searchLower);

    const matchesEstado = 
      filtroEstado === 'todos' ? true : 
      filtroEstado === 'activos' ? emp.estado : 
      !emp.estado;

    return matchesSearch && matchesEstado;
  });

  // Asegurar que la fecha tenga un valor por defecto válido al cargar el componente
  useEffect(() => {
    if (!formData.fecha_ingreso) {
      setFormData(prev => ({
        ...prev,
        fecha_ingreso: new Date().toISOString().split('T')[0]
      }));
    }
  }, []);

  // Al comienzo del componente, agregar estado para opciones avanzadas
  const [opcionesAvanzadas, setOpcionesAvanzadas] = useState({
    omitirFecha: false,
    intentosConectividad: 0
  });

  return (
    <Box sx={{ p: 3 }}>
      {/* Formulario */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#1976d2', mb: 3 }}>
          {isEditMode ? 'Editar Empleado' : 'Nuevo Empleado'}
        </Typography>

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
                  disabled={isEditMode}
                  InputProps={{
                    readOnly: isEditMode,
                  }}
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
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
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
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Teléfono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Fecha de Ingreso"
                  name="fecha_ingreso"
                  type="date"
                  value={formData.fecha_ingreso}
                  onChange={(e) => {
                    // Validación en tiempo real para asegurar formato YYYY-MM-DD
                    const value = e.target.value;
                    if (!value || /^\d{4}-\d{2}-\d{2}$/.test(value)) {
                      setFormData(prevState => ({
                        ...prevState,
                        fecha_ingreso: value
                      }));
                    } else {
                      // Intentar convertir el formato si no es válido
                      try {
                        const date = new Date(value);
                        if (!isNaN(date.getTime())) {
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          setFormData(prevState => ({
                            ...prevState,
                            fecha_ingreso: `${year}-${month}-${day}`
                          }));
                        }
                      } catch (error) {
                        console.error('Error al convertir fecha:', error);
                      }
                    }
                  }}
                  required
                  InputLabelProps={{
                    shrink: true,
                  }}
                  inputProps={{
                    placeholder: 'yyyy-MM-dd'
                  }}
                  helperText="Formato requerido: YYYY-MM-DD (ej. 2023-05-15)"
                  error={formData.fecha_ingreso && !/^\d{4}-\d{2}-\d{2}$/.test(formData.fecha_ingreso)}
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={() => {
                      setFormData({
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
                    }}
                  >
                    Limpiar
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                  >
                    {isEditMode ? 'Actualizar' : 'Guardar'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        )}
      </Paper>

      {/* Lista de Empleados */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#1976d2', mb: 3 }}>
          Lista de Empleados
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Buscar por código, nombre o departamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
            size="small"
            sx={{ backgroundColor: 'white', flex: 1 }}
          />
          <ToggleButtonGroup
            value={filtroEstado}
            exclusive
            onChange={handleFiltroChange}
            aria-label="filtro de estado"
          >
            <ToggleButton value="activos">
              Activos
            </ToggleButton>
            <ToggleButton value="inactivos">
              Inactivos
            </ToggleButton>
            <ToggleButton value="todos">
              Todos
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <TableContainer>
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
                    {formatDate(empleado.fecha_ingreso)}
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
      </Paper>
    </Box>
  );
};

export default EmpleadoForm;