import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MaterialForm from './components/Material/MaterialForm';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />  {/* Página principal */}
        <Route path="/material" element={<MaterialForm />} />  {/* Ruta para MaterialForm */}
      </Routes>
    </Router>
  );
}

export default App;
