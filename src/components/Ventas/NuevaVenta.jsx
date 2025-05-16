import React from 'react';
import { Box, Paper } from '@mui/material';
import VentaForm from './VentaForm';

const NuevaVenta = () => {
  return (
    <Box p={3}>
      <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
        <VentaForm isNew={true} />
      </Paper>
    </Box>
  );
};

export default NuevaVenta;