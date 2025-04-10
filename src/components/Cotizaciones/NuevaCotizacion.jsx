import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import CotizacionForm from './CotizacionForm';

const NuevaCotizacion = () => {
  return (
    <Box p={3}>
      <Paper sx={{ p: 3 }}>
        <CotizacionForm />
      </Paper>
    </Box>
  );
};

export default NuevaCotizacion;