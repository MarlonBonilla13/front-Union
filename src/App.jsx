import { useEffect, useState } from 'react';
import api from './services/api'; // Asegúrate de que la ruta sea correcta// Asegúrate de que esta ruta sea correcta
import MaterialForm from './components/Material/MaterialForm.jsx';

function App() {
  const [data, setData] = useState([]); // Estado para los materiales

  useEffect(() => {
    // Cargar los materiales desde la API
    api.get('/materiales') // Ajusta la URL si es necesario
      .then((res) => setData(res.data))
      .catch((err) => console.error(err));
  }, []);

  // Función para manejar la creación de un nuevo material
  const handleMaterialCreated = (newMaterial) => {
    setData((prevData) => [newMaterial, ...prevData]); // Agregar el nuevo material a la lista
  };

  return (
    <>
      <h1>Materiales</h1>
      <MaterialForm onMaterialCreated={handleMaterialCreated} />

      <h2>Lista de Materiales:</h2>
      <ul>
        {data.length === 0 ? (
          <p>No hay materiales disponibles.</p>
        ) : (
          data.map((material) => (
            <li key={material.id_material}>
              {material.nombre} - {material.precio_unitario} - {material.estado ? 'Activo' : 'Inactivo'}
            </li>
          ))
        )}
      </ul>
    </>
  );
}

export default App;
