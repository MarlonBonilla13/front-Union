import React, { useState } from "react";
import { createMaterial } from "../../services/materialService";
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
  FormHelperText
} from "@mui/material";

const MaterialForm = () => {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [stockActual, setStockActual] = useState(0);
  const [stockMinimo, setStockMinimo] = useState(0);
  const [unidadMedida, setUnidadMedida] = useState("");
  const [precioUnitario, setPrecioUnitario] = useState(0);
  const [estado, setEstado] = useState(null); // null para que inicie sin selección
  const [errorEstado, setErrorEstado] = useState(false); // Para controlar el error de estado

  const [isSaved, setIsSaved] = useState(false); // Para manejar el estado del botón

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

    // Diálogo de confirmación
    const confirmResult = await Swal.fire({
      title: '¿Está seguro?',
      text: '¿Desea guardar este material?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: '¡Sí, guardar!',
      cancelButtonText: 'Cancelar'
    });

    if (confirmResult.isConfirmed) {
      const newMaterial = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        stock_actual: parseInt(stockActual, 10),
        stock_minimo: parseInt(stockMinimo, 10),
        unidad_medida: unidadMedida.trim(),
        precio_unitario: parseFloat(precioUnitario),
        estado,
      };

      try {
        // Mostrar loading
        Swal.fire({
          title: 'Guardando material...',
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        const TIMEOUT_SECONDS = 10;
        
        const result = await Promise.race([
          createMaterial(newMaterial),
          new Promise((_, reject) => 
            setTimeout(() => {
              reject(new Error('TIMEOUT'));
            }, TIMEOUT_SECONDS * 1000)
          )
        ]);

        // Verificar explícitamente que el resultado sea válido
        if (!result || !result.id) {
          throw new Error('DATABASE_ERROR');
        }

        // Solo si llegamos aquí y tenemos un resultado válido, mostramos éxito
        setIsSaved(true);
        await Swal.fire({
          icon: 'success',
          title: '¡Guardado exitoso!',
          text: 'El material ha sido registrado correctamente',
          confirmButtonColor: '#28a745'
        });

        // Limpiar el formulario después de guardar
        setNombre("");
        setDescripcion("");
        setStockActual(0);
        setStockMinimo(0);
        setUnidadMedida("");
        setPrecioUnitario(0);
        setEstado(null);
        setErrorEstado(false);
        setIsSaved(false);

      } catch (error) {
        console.error("Error al crear material:", error);
        setIsSaved(false);

        // Asegurarse de que cualquier diálogo previo esté cerrado
        await Swal.close();
        
        // Determinar el mensaje de error apropiado
        let errorTitle = 'Error al registrar';
        let errorMessage = 'Hubo un problema al guardar el material.';

        if (error.message === 'TIMEOUT') {
          errorTitle = 'Error de conexión';
          errorMessage = 'No se pudo establecer conexión con la base de datos después de ' + TIMEOUT_SECONDS + ' segundos. Por favor, verifique que el servidor esté disponible e intente nuevamente.';
        } else if (error.message === 'DATABASE_ERROR') {
          errorTitle = 'Error de base de datos';
          errorMessage = 'No se pudo registrar el material en la base de datos. Por favor, verifique que el servidor esté disponible.';
        } else if (!navigator.onLine) {
          errorTitle = 'Sin conexión';
          errorMessage = 'No hay conexión a Internet. Por favor, verifique su conexión y vuelva a intentar.';
        } else if (error.message?.includes('Network Error') || error.message?.includes('Failed to fetch')) {
          errorTitle = 'Error de conexión';
          errorMessage = 'No se pudo establecer conexión con el servidor. Por favor, verifique su conexión e intente nuevamente.';
        }

        // Mostrar el mensaje de error
        await Swal.fire({
          icon: 'error',
          title: errorTitle,
          text: errorMessage,
          confirmButtonColor: '#dc3545',
          confirmButtonText: 'Entendido'
        });
      }
    }
  };

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
      <Container 
        maxWidth="md" 
        sx={{
          display: 'flex',
          justifyContent: 'center',
          px: { xs: 2, sm: 3 }
        }}
      >
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
            Ingreso De Material
          </Typography>
          
          <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
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
              {isSaved ? "Guardado Exitoso" : "Guardar Material"}
            </Button>
          </form>
        </Box>
      </Container>
    </Box>
  );
};

export default MaterialForm;
