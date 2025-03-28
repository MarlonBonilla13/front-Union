import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import { createMaterial, getMaterialById, updateMaterial, uploadMaterialImage } from "../../services/materialService";
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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { styled } from '@mui/material/styles';

// Add this after the imports
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const MaterialForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  // Agregar los nuevos estados aquí, junto a los otros estados
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
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

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

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
        
        // First save the material
        const savedMaterial = await (isEditMode 
          ? updateMaterial(id, materialData)
          : createMaterial(materialData));
        
        // Then upload the image if one was selected
        if (selectedImage) {
          try {
            await uploadMaterialImage(savedMaterial.id_material, selectedImage);
          } catch (error) {
            console.error('Error uploading image:', error);
            // Show warning but don't fail the whole operation
            await Swal.fire({
              icon: 'warning',
              title: 'Advertencia',
              text: 'El material se guardó pero hubo un problema al subir la imagen',
              confirmButtonColor: '#f0ad4e'
            });
          }
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
    <Box sx={{ p: 3, bgcolor: '#f5f5f5' }}>
      <Container maxWidth="md">
        <Box sx={{ 
          bgcolor: 'white', 
          p: 3, 
          borderRadius: 1,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <Typography variant="h5" align="center" sx={{ mb: 3, fontWeight: 600, color: '#1976d2'}}> 
            INGRESO DE MATERIAL
          </Typography>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                required
                label="Código"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
              />
              
              <TextField
                required
                label="Nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
              
              <TextField
                label="Descripción"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                multiline
                rows={3}
              />
    
              {/* Replace the existing image upload button with this updated version */}
              <Box sx={{ mb: 2 }}>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<CloudUploadIcon />}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  SUBIR IMAGEN
                  <VisuallyHiddenInput 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </Button>
                
                {imagePreview && (
                  <Box sx={{ mt: 2 }}>
                    <img 
                      src={imagePreview} 
                      alt="Vista previa" 
                      style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain' }} 
                    />
                  </Box>
                )}
              </Box>
    
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
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
              </Box>
    
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
    
              <Box sx={{ mt: 1 }}>
                <Typography variant="body1" sx={{ color: 'text.primary' }}>Estado del material</Typography>
                <FormGroup row>
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={estado === true} 
                        onChange={() => setEstado(true)}
                      />
                    }
                    label="Activo"
                    sx={{ color: 'text.primary' }}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={estado === false} 
                        onChange={() => setEstado(false)}
                      />
                    }
                    label="Desactivado"
                    sx={{ color: 'text.primary' }}
                  />
                </FormGroup>
              </Box>
    
              <Button
                variant="contained"
                type="submit"
                fullWidth
                sx={{ mt: 2, py: 1.5, bgcolor: '#2196f3' }}
              >
                GUARDAR MATERIAL
              </Button>
            </Box>
          </form>
        </Box>
      </Container>
    </Box>
  );
};

export default MaterialForm;
