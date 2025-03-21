import React, { createContext, useState, useContext, useEffect } from 'react';
import { getCurrentUser, isAuthenticated } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (isAuthenticated()) {
          const currentUser = getCurrentUser();
          // Validar que el usuario tenga un rol asignado
          if (!currentUser || !currentUser.role) {
            console.error('Usuario sin rol definido');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          } else {
            setUser(currentUser);
          }
        }
      } catch (error) {
        console.error('Error al inicializar la autenticación:', error);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const value = {
    user,
    setUser,
    isLoading,
    isAuthenticated: !!user,
    // Agregar helpers para roles
    role: user?.role || null,
    isAdmin: user?.role === 'admin',
    isUser: user?.role === 'user',
  };

  if (isLoading) {
    return null;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};