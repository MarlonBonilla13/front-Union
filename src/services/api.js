import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4001', // URL del backend de NestJS
  headers: {
    'Content-Type': 'application/json', // Asegúrate de enviar los datos como JSON
  },
});

export default api;