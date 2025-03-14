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
import Navbar from '../Navigation/Navbar';

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

    // Solo proceder si el usuario confirmó
    if (confirmResult.isConfirmed) {
      const newMaterial = {
        nombre,
        descripcion,
        stock_actual: parseInt(stockActual, 10),
        stock_minimo: parseInt(stockMinimo, 10),
        unidad_medida: unidadMedida,
        precio_unitario: parseFloat(precioUnitario),
        estado,
      };

      try {
        // Mostrar loading
        Swal.fire({
          title: 'Guardando material...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        const response = await createMaterial(newMaterial);
        if (response) {
          setIsSaved(true);
          Swal.fire({
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
        }
      } catch (error) {
        console.error("Error al crear material:", error);
        setIsSaved(false);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Hubo un problema al guardar el material. Por favor, intente nuevamente.',
          confirmButtonColor: '#dc3545'
        });
      }
    }
  };

  return (
    <>
      <Navbar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - 240px)` },
          ml: { sm: `240px` },
          mt: '64px',
          backgroundColor: '#f8f9fa', // Fondo gris muy suave
        }}
      >
        <Container maxWidth="md">
          <Box
            sx={{
              mt: 2,
              p: 4,
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              borderRadius: 2,
              border: "1px solid #64B5F6",
              fontFamily: "Arial",
              backgroundColor: '#ffffff', // Mantener el formulario en blanco para contraste
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
              gap: 3,
              '& .MuiTextField-root': {
                backgroundColor: '#ffffff',
              },
              '& .full-width': {
                gridColumn: { xs: '1', md: '1 / -1' }
              }
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
                mt: 2
              }}>
                <Typography 
                  sx={{ 
                    fontFamily: "Arial",
                    fontWeight: 500,
                    color: 'rgba(0, 0, 0, 0.87)',
                    ml: 1  // Añadido margen izquierdo para alinear con los checkboxes
                  }}
                >
                  Estado del material
                </Typography>
                <FormGroup 
                  row 
                  sx={{ 
                    justifyContent: 'flex-start',  // Cambiado de 'center' a 'flex-start'
                    ml: 1  // Añadido margen izquierdo para alinear con el título
                  }}
                >
                  <FormControlLabel
                    control={<Checkbox checked={estado === true} onChange={() => setEstado(true)} />}
                    label="Activo"
                    sx={{ 
                      mr: 4  // Aumentado el margen derecho entre las opciones
                    }}
                  />
                  <FormControlLabel
                    control={<Checkbox checked={estado === false} onChange={() => setEstado(false)} />}
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
    </>
  );
};

export default MaterialForm;
