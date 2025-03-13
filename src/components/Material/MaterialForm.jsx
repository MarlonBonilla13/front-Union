import React, { useState } from "react";
import { createMaterial } from "../../services/materialService";
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

    if (estado === null) {
      setErrorEstado(true); // Muestra el mensaje de error si no se seleccionó un estado
      return; // No enviar el formulario si no se ha seleccionado estado
    }

    const newMaterial = {
      nombre,
      descripcion,
      stock_actual: parseInt(stockActual, 10),
      stock_minimo: parseInt(stockMinimo, 10),
      unidad_medida: unidadMedida,
      precio_unitario: parseFloat(precioUnitario),
      estado, // El estado ahora será true o false dependiendo de lo que seleccione el usuario
    };

    try {
      const response = await createMaterial(newMaterial);
      if (response) {
        setIsSaved(true); // Cambiar el estado del botón a "Guardado Exitoso"
      } else {
        setIsSaved(false); // Si hay un error, no cambia el estado del botón
      }
    } catch (error) {
      console.error("Error al crear material:", error);
      setIsSaved(false); // Error en la creación, mantenemos el botón sin cambios
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          mt: 4,
          p: 3,
          boxShadow: 3,
          borderRadius: 2,
          border: "2px solid #87CEFA", // Orilla de color celeste claro
          fontFamily: "Arial",
          backgroundColor: "white",
        }}
      >
        <Typography variant="h5" align="center" gutterBottom sx={{ fontFamily: "Arial" }}>
          Ingreso De Material
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            required
            label="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            margin="dense"
            sx={{ fontFamily: "Arial" }}
          />
          <TextField
            fullWidth
            label="Descripción"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            margin="dense"
            sx={{ fontFamily: "Arial" }}
          />
          <TextField
            fullWidth
            required
            label="Stock Actual"
            type="number"
            value={stockActual}
            onChange={(e) => setStockActual(e.target.value)}
            margin="dense"
            sx={{ fontFamily: "Arial" }}
          />
          <TextField
            fullWidth
            required
            label="Stock Mínimo"
            type="number"
            value={stockMinimo}
            onChange={(e) => setStockMinimo(e.target.value)}
            margin="dense"
            sx={{ fontFamily: "Arial" }}
          />
          <TextField
            fullWidth
            required
            label="Unidad de Medida"
            value={unidadMedida}
            onChange={(e) => setUnidadMedida(e.target.value)}
            margin="dense"
            sx={{ fontFamily: "Arial" }}
          />
          <TextField
            fullWidth
            required
            label="Precio Unitario"
            type="number"
            value={precioUnitario}
            onChange={(e) => setPrecioUnitario(e.target.value)}
            margin="dense"
            sx={{ fontFamily: "Arial" }}
          />

          <Typography sx={{ mt: 2, fontFamily: "Arial" }}>Estado:</Typography>
          <FormGroup row>
            <FormControlLabel
              control={<Checkbox checked={estado === true} onChange={() => setEstado(true)} />}
              label="Activo"
              sx={{ fontFamily: "Arial" }}
            />
            <FormControlLabel
              control={<Checkbox checked={estado === false} onChange={() => setEstado(false)} />}
              label="Desactivado"
              sx={{ fontFamily: "Arial" }}
            />
          </FormGroup>

          {errorEstado && (
            <FormHelperText error sx={{ fontFamily: "Arial" }}>
              Por favor, seleccione el tipo de estado.
            </FormHelperText>
          )}

          <Button
            variant="contained"
            color={isSaved ? "success" : "primary"} // Cambia el color a verde si guardado
            type="submit"
            fullWidth
            sx={{ mt: 2, fontFamily: "Arial" }}
          >
            {isSaved ? "Guardado Exitoso" : "Guardar Material"} {/* Cambia el texto del botón */}
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default MaterialForm;
