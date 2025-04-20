import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import CotizacionForm from './cotizacionform';  // Updated import with correct casing

const NuevaCotizacion = () => {
  return (
    <Box p={3}>
      <Paper 
        sx={{ 
          p: 3,
          borderRadius: 2,
          boxShadow: 3
        }}
      >
        <CotizacionForm isNew={true} />
      </Paper>
    </Box>
  );
};

export default NuevaCotizacion;