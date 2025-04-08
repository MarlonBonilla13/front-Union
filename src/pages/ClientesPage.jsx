import React, { useState } from 'react';
import { Container, Typography, Box, Button, Divider } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ClienteForm from '../components/Clientes/ClienteForm';
import ClientesList from '../components/Clientes/ClientesList';

const ClientesPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedClienteId, setSelectedClienteId] = useState(null);
  const [refreshList, setRefreshList] = useState(false);

  const handleAddNew = () => {
    setSelectedClienteId(null);
    setShowForm(true);
  };

  const handleEditCliente = (clienteId) => {
    setSelectedClienteId(clienteId);
    setShowForm(true);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedClienteId(null);
  };

  const handleFormSave = () => {
    setShowForm(false);
    setSelectedClienteId(null);
    setRefreshList(prev => !prev); // Trigger list refresh
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" color={'#1976d2'} fontWeight={600} gutterBottom >
          Gestión de Clientes
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        {!showForm ? (
          <>
            <Box sx={{ mb: 3 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddNew}
              >
                Nuevo Cliente
              </Button>
            </Box>
            
            <ClientesList 
              onEditCliente={handleEditCliente} 
              refresh={refreshList}
              onStateChange={() => setRefreshList(prev => !prev)}
            />
          </>
        ) : (
          <>
            <Box sx={{ mb: 3 }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={handleFormCancel}
              >
                Volver al Listado
              </Button>
            </Box>
            
            <ClienteForm 
              clienteId={selectedClienteId}
              onSave={handleFormSave}
              onCancel={handleFormCancel}
            />
          </>
        )}
      </Box>
    </Container>
  );
};

export default ClientesPage;