const isProduction = window.location.hostname !== 'localhost';

export const API_BASE_URL = isProduction
  ? 'https://backend-union-production.up.railway.app'
  : 'http://localhost:4001';

export const API_IMAGE_URL = `${API_BASE_URL}/uploads`;