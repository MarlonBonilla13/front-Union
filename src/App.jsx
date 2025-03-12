import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MaterialForm from './components/Material/MaterialForm';

const App = () => {
  return (
    <Router basename="/">
      <Routes>
        <Route path="/" element={<MaterialForm />} />  {/* Esto hace que MaterialForm se cargue por defecto */}
      </Routes>
    </Router>
  );
};

export default App;
