import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MaterialForm from './components/Material/MaterialForm';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MaterialForm />} />  {/* Carga MaterialForm en la ruta raíz */}
      </Routes>
    </Router>
  );
};

export default App;