import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './components/Material/MaterialForm.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode basename="/">
    <App />
  </StrictMode>
);
