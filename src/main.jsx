import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const root = ReactDOM.createRoot(document.getElementById('app')); // Asegúrate de que el id coincida con el div en index.html
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
