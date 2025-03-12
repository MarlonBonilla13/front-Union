import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import MaterialForm from './components/Material/MaterialForm';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/material" element={<MaterialForm />} />  {/* Ruta para MaterialForm */}
      </Routes>
    </Router>
  );
}

export default App;