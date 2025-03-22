// Definición centralizada de rutas
export const ROUTES = {
  HOME: '/',
  MATERIALS: {
    LIST: '/materiales',
    NEW: '/materiales/nuevo',
    EDIT: (id) => `/materiales/editar/${id}`,
    DETAIL: (id) => `/materiales/${id}`,
  },
  // módulos de rutas
};

// Metadatos de las rutas (Navbar y permisos)
export const ROUTE_METADATA = {
  [ROUTES.MATERIALS.LIST]: {
    title: 'Lista de Materiales',
    requiresAuth: true,
  },
  [ROUTES.MATERIALS.NEW]: {
    title: 'Nuevo Material',
    requiresAuth: true,
  },
}; 