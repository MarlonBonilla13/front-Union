import { Routes, Route } from 'react-router-dom';
import MaterialList from '../components/Material/MaterialList';
import MaterialForm from '../components/Material/MaterialForm';
import Layout from '../components/Layout/Layout';
import { ROUTES } from './routes.config';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Ruta principal redirige a materiales */}
        <Route index element={<MaterialList />} />
        
        {/* Rutas de Materiales */}
        <Route path={ROUTES.MATERIALS.LIST} element={<MaterialList />} />
        <Route path={ROUTES.MATERIALS.NEW} element={<MaterialForm />} />
        
        {/* Ruta 404 - Debe ir al final */}
        <Route path="*" element={
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            color: '#666'
          }}>
            Página no encontrada
          </div>
        } />
      </Route>
    </Routes>
  );
};

export default AppRoutes; 