// Definición centralizada de rutas
export const ROUTES = {
  HOME: '/',
  MATERIALS: {
    LIST: '/materiales',
    NEW: '/materiales/nuevo',
    EDIT: (id) => `/materiales/editar/${id}`,
    DETAIL: (id) => `/materiales/${id}`,
  },
  // Aquí puedes agregar más módulos de rutas según necesites
};

// Metadatos de las rutas (útil para el Navbar y permisos)
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