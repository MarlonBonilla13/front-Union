import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MaterialForm from "./components/Material/MaterialForm.jsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/materiales" />} />
        <Route path="/materiales" element={<MaterialForm />} />
      </Routes>
    </Router>
  );
}

export default App;
