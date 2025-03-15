import React from 'react';
import { Box, Container, Paper, Typography } from '@mui/material';
import logo from '../assets/logos/Logo Union.png';

const Welcome = () => {
  return (
    <Container maxWidth="lg">
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4,
          mt: 2,
          borderRadius: 2,
          textAlign: 'center'
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 600,
            color: '#1976d2',
            mb: 4
          }}
        >
          Bienvenido al Sistema de Control Administrativo
        </Typography>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mb: 4
          }}
        >
          <Box
            component="img"
            src={logo}
            alt="Logo de la empresa"
            sx={{
              width: '300px',
              height: 'auto',
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 20px #64b5f6)',
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': {
                  filter: 'drop-shadow(0 0 15px #64b5f6)'
                },
                '50%': {
                  filter: 'drop-shadow(0 0 25px #64b5f6)'
                },
                '100%': {
                  filter: 'drop-shadow(0 0 15px #64b5f6)'
                }
              }
            }}
          />
        </Box>

        <Typography
          variant="h6"
          sx={{
            color: '#666',
            maxWidth: '600px',
            margin: '0 auto'
          }}
        >
          Gestione sus materiales y recursos de manera eficiente
        </Typography>
      </Paper>
    </Container>
  );
};

export default Welcome; 