import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MaterialForm from './components/Material/MaterialForm'; // Ajusta la ruta si es necesario

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MaterialForm />} /> {/* Ruta por defecto */}
        {/* Otras rutas que puedas tener */}
      </Routes>
    </Router>
  );
};

export default App;