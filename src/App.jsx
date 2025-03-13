import { Routes, Route } from "react-router-dom";
import MaterialForm from "./components/Material/MaterialForm";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MaterialForm />} />
    </Routes>
  );
}

export default App;