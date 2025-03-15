import React from 'react';
import { Box, Container, Typography } from '@mui/material';

const Welcome = () => {
  return (
    <Box
      sx={{
        backgroundColor: '#f8f9fa',
        minHeight: '100vh',
        width: '100%',
        p: 3
      }}
    >
      <Container maxWidth="md">
        <Box
          sx={{
            p: 4,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            borderRadius: 2,
            border: "1px solid #64B5F6",
            backgroundColor: '#ffffff',
            textAlign: 'center'
          }}
        >
          <Typography 
            variant="h4" 
            gutterBottom 
            sx={{ 
              fontFamily: "Arial",
              borderBottom: '2px solid #64B5F6',
              pb: 2,
              mb: 3,
              fontWeight: 700,
              color: '#2196F3',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            Bienvenido al Sistema de Control Administrativo
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Welcome; 