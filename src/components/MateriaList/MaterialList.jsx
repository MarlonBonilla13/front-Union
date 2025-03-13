import React from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from "@mui/material";

const MaterialList = ({ materials }) => {
  return (
    <div>
      <Typography variant="h5" align="center" gutterBottom>
        Listado de Materiales
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Stock Actual</TableCell>
              <TableCell>Stock Mínimo</TableCell>
              <TableCell>Unidad de Medida</TableCell>
              <TableCell>Precio Unitario</TableCell>
              <TableCell>Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {materials.map((material) => (
              <TableRow key={material.id_material}>
                <TableCell>{material.nombre}</TableCell>
                <TableCell>{material.descripcion}</TableCell>
                <TableCell>{material.stock_actual}</TableCell>
                <TableCell>{material.stock_minimo}</TableCell>
                <TableCell>{material.unidad_medida}</TableCell>
                <TableCell>{material.precio_unitario}</TableCell>
                <TableCell>{material.estado ? "Activo" : "Desactivado"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default MaterialList;
