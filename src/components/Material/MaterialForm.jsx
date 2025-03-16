import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import { createMaterial, getMaterialById, updateMaterial } from "../../services/materialService";
import Swal from 'sweetalert2';
import {
  TextField,
  Checkbox,
  FormControlLabel,
  Button,
  Container,
  Typography,
  Box,
  FormGroup,
  CircularProgress
} from "@mui/material";

const MaterialForm = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Para modo edición
  const isEditMode = Boolean(id);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [codigo, setCodigo] = useState(""); // Nuevo estado para el código
  const [stockActual, setStockActual] = useState(0);
  const [stockMinimo, setStockMinimo] = useState(0);
  const [unidadMedida, setUnidadMedida] = useState("");
  const [precioUnitario, setPrecioUnitario] = useState(0);
  const [estado, setEstado] = useState(null);
  const [errorEstado, setErrorEstado] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Cargar datos si estamos en modo edición
  useEffect(() => {
    const loadMaterial = async () => {
      if (isEditMode) {
        try {
          setIsLoading(true);
          const material = await getMaterialById(id);
          if (material) {
            setNombre(material.nombre);
            setDescripcion(material.descripcion || "");
            setCodigo(material.codigo || ""); // Cargar el código
            setStockActual(material.stock_actual);
            setStockMinimo(material.stock_minimo);
            setUnidadMedida(material.unidad_medida);
            setPrecioUnitario(material.precio_unitario);
            setEstado(material.estado);
          }
        } catch (error) {
          Swal.fire({
            icon: 'error',
            title: 'Error al cargar material',
            text: 'No se pudo cargar la información del material',
            confirmButtonColor: '#d33'
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadMaterial();
  }, [id, isEditMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación de formato de datos
    if (!nombre.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Error de validación',
        text: 'El nombre del material es requerido',
        confirmButtonColor: '#d33'
      });
      return;
    }

    if (stockActual < 0 || stockMinimo < 0) {
      Swal.fire({
        icon: 'error',
        title: 'Error de validación',
        text: 'Los valores de stock no pueden ser negativos',
        confirmButtonColor: '#d33'
      });
      return;
    }

    if (precioUnitario <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Error de validación',
        text: 'El precio unitario debe ser mayor a 0',
        confirmButtonColor: '#d33'
      });
      return;
    }

    if (!unidadMedida.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Error de validación',
        text: 'La unidad de medida es requerida',
        confirmButtonColor: '#d33'
      });
      return;
    }

    if (estado === null) {
      setErrorEstado(true);
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'Por favor, seleccione el estado del material',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    const materialData = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      codigo: codigo.trim(), // Incluir el código en los datos
      stock_actual: parseInt(stockActual, 10),
      stock_minimo: parseInt(stockMinimo, 10),
      unidad_medida: unidadMedida.trim(),
      precio_unitario: parseFloat(precioUnitario),
      estado,
    };

    // Confirmar acción
    const confirmResult = await Swal.fire({
      title: `¿Está seguro de ${isEditMode ? 'actualizar' : 'guardar'} este material?`,
      text: isEditMode ? 'Los cambios se guardarán en la base de datos' : '¿Desea guardar este material?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: isEditMode ? '¡Sí, actualizar!' : '¡Sí, guardar!',
      cancelButtonText: 'Cancelar'
    });

    if (confirmResult.isConfirmed) {
      try {
        setIsLoading(true);
        
        // Mostrar loading
        Swal.fire({
          title: `${isEditMode ? 'Actualizando' : 'Guardando'} material...`,
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        const TIMEOUT_SECONDS = 10;
        
        const result = await Promise.race([
          isEditMode 
            ? updateMaterial(id, materialData)
            : createMaterial(materialData),
          new Promise((_, reject) => 
            setTimeout(() => {
              reject(new Error('TIMEOUT'));
            }, TIMEOUT_SECONDS * 1000)
          )
        ]);

        if (!result) {
          throw new Error('DATABASE_ERROR');
        }

        setIsSaved(true);
        await Swal.fire({
          icon: 'success',
          title: '¡Operación exitosa!',
          text: isEditMode 
            ? 'El material ha sido actualizado correctamente'
            : 'El material ha sido registrado correctamente',
          confirmButtonColor: '#28a745'
        });

        // Redireccionar a la lista de materiales
        navigate('/materiales');

      } catch (error) {
        console.error("Error:", error);
        setIsSaved(false);
        await Swal.close();
        
        let errorTitle = 'Error al procesar la operación';
        let errorMessage = 'Hubo un problema al procesar la solicitud.';

        if (error.message === 'TIMEOUT') {
          errorTitle = 'Error de conexión';
          errorMessage = `No se pudo establecer conexión con la base de datos después de ${TIMEOUT_SECONDS} segundos.`;
        } else if (error.message === 'DATABASE_ERROR') {
          errorTitle = 'Error de base de datos';
          errorMessage = 'No se pudo acceder a la base de datos.';
        } else if (!navigator.onLine) {
          errorTitle = 'Sin conexión';
          errorMessage = 'No hay conexión a Internet.';
        }

        await Swal.fire({
          icon: 'error',
          title: errorTitle,
          text: errorMessage,
          confirmButtonColor: '#dc3545',
          confirmButtonText: 'Entendido'
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (isLoading && isEditMode) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        backgroundColor: '#f8f9fa',
        width: '100%',
        minHeight: '100vh',
        pt: 4
      }}
    >
      <Container maxWidth="md">
        <Box
          sx={{
            width: '100%',
            p: 4,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            borderRadius: 2,
            border: "1px solid #64B5F6",
            backgroundColor: '#ffffff',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: 3
          }}
        >
          <Typography 
            variant="h5" 
            align="center" 
            gutterBottom 
            sx={{ 
              fontFamily: "Arial",
              gridColumn: '1 / -1',
              borderBottom: '2px solid #64B5F6',
              pb: 2,
              mb: 3,
              fontWeight: 700,
              fontSize: '1.8rem',
              color: '#2196F3',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            {isEditMode ? 'Editar Material' : 'Ingreso De Material'}
          </Typography>
          
          <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
            <TextField
              required
              label="Código"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}
            />
            
            <TextField
              required
              label="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}
            />
            
            <TextField
              label="Descripción"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              multiline
              rows={3}
              sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}
            />
            
            <TextField
              required
              label="Stock Actual"
              type="number"
              value={stockActual}
              onChange={(e) => setStockActual(e.target.value)}
            />
            
            <TextField
              required
              label="Stock Mínimo"
              type="number"
              value={stockMinimo}
              onChange={(e) => setStockMinimo(e.target.value)}
            />
            
            <TextField
              required
              label="Unidad de Medida"
              value={unidadMedida}
              onChange={(e) => setUnidadMedida(e.target.value)}
            />
            
            <TextField
              required
              label="Precio Unitario"
              type="number"
              value={precioUnitario}
              onChange={(e) => setPrecioUnitario(e.target.value)}
            />

            <Box sx={{ 
              gridColumn: { xs: '1', md: '1 / -1' },
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              mt: 2,
              backgroundColor: '#ffffff'
            }}>
              <Typography 
                sx={{ 
                  fontFamily: "Arial",
                  fontWeight: 500,
                  color: 'rgba(0, 0, 0, 0.87)',
                  ml: 1
                }}
              >
                Estado del material
              </Typography>
              <FormGroup 
                row 
                sx={{ 
                  justifyContent: 'flex-start',
                  ml: 1,
                  '& .MuiFormControlLabel-root': {
                    marginRight: 4,
                    color: 'rgba(0, 0, 0, 0.87)'
                  },
                  '& .MuiFormControlLabel-label': {
                    fontSize: '1rem',
                    fontFamily: 'Arial'
                  }
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={estado === true} 
                      onChange={() => setEstado(true)}
                    />
                  }
                  label="Activo"
                />
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={estado === false} 
                      onChange={() => setEstado(false)}
                    />
                  }
                  label="Desactivado"
                />
              </FormGroup>
            </Box>

            <Button
              variant="contained"
              color={isSaved ? "success" : "primary"}
              type="submit"
              disabled={isLoading}
              sx={{ 
                mt: 3,
                py: 1.5,
                gridColumn: { xs: '1', md: '1 / -1' },
                fontWeight: 'bold',
                backgroundColor: isSaved ? '#4CAF50' : '#2196F3',
                '&:hover': {
                  backgroundColor: isSaved ? '#45a049' : '#1976D2',
                }
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                isEditMode ? "Actualizar Material" : "Guardar Material"
              )}
            </Button>
          </form>
        </Box>
      </Container>
    </Box>
  );
};

export default MaterialForm;
