import React from 'react';
import { createMaterial } from "../../services/materialService";  // Asegúrate de importar el servicio correctamente

const MaterialForm = () => {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [stockActual, setStockActual] = useState(0);
  const [stockMinimo, setStockMinimo] = useState(0);
  const [unidadMedida, setUnidadMedida] = useState('');
  const [precioUnitario, setPrecioUnitario] = useState(0);
  const [estado, setEstado] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Convertir los valores a números si es necesario
    const newMaterial = {
      nombre,
      descripcion,
      stock_actual: parseInt(stockActual, 10),  // Convertir a entero
      stock_minimo: parseInt(stockMinimo, 10),  // Convertir a entero
      unidad_medida: unidadMedida,
      precio_unitario: parseInt(precioUnitario, 10),  // Convertir a entero
      estado,
    };
  
    try {
      // Llamar al servicio para enviar los datos al backend
      const response = await createMaterial(newMaterial);
      if (response) {
        alert('Material creado con éxito');
      } else {
        alert('Hubo un error al crear el material');
      }
    } catch (error) {
      console.error("Error al crear material:", error);
      alert('Hubo un error al crear el material');
    }
  };
  

  return (
    <div>
      <h1>Crear Material</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nombre:</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Descripción:</label>
          <input
            type="text"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </div>
        <div>
          <label>Stock Actual:</label>
          <input
            type="number"
            value={stockActual}
            onChange={(e) => setStockActual(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Stock Mínimo:</label>
          <input
            type="number"
            value={stockMinimo}
            onChange={(e) => setStockMinimo(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Unidad de Medida:</label>
          <input
            type="text"
            value={unidadMedida}
            onChange={(e) => setUnidadMedida(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Precio Unitario:</label>
          <input
            type="number"
            value={precioUnitario}
            onChange={(e) => setPrecioUnitario(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Estado:</label>
          <input
            type="checkbox"
            checked={estado}
            onChange={() => setEstado(!estado)}
          />
        </div>
        <button type="submit">Guardar Material</button>
      </form>
    </div>
  );
};

export default MaterialForm;
