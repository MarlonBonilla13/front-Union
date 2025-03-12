// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import MaterialForm from './components/Material/MaterialForm'; // Asegúrate de que el path sea correcto

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Ruta inicial con un botón */}
        <Route path="/" element={<RedirectToMaterialForm />} />
        {/* Ruta para cargar el componente MaterialForm */}
        <Route path="./components/Material" element={<MaterialForm />} />
      </Routes>
    </Router>
  );
};

// Componente con el botón para redirigir
const RedirectToMaterialForm = () => {
  return (
    <div>
      <h1>Página principal</h1>
      <Link to="./components/Material">
        <button>Ir a Material Form</button>
      </Link>
    </div>
  );
};

export default App;
