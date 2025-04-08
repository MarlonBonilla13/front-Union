import React from 'react';
import { useNavigate } from 'react-router-dom';
import ClientesList from '../components/Clientes/ClientesList';

const Clientes = () => {
  const navigate = useNavigate();

  const handleEditCliente = (clienteId) => {
    navigate(`/clientes/edit/${clienteId}`);
  };

  return (
    <div>
      <ClientesList onEditCliente={handleEditCliente} />
    </div>
  );
};

export default Clientes;