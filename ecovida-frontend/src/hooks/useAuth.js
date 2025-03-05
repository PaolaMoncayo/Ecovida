// src/hooks/useAuth.js
import { useEffect, useState } from 'react';
import { getUserProfile } from '../api/userService';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      try {
        // Verificamos si el token es válido obteniendo el perfil del usuario
        await getUserProfile(token);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Token inválido:', error);
        localStorage.removeItem('token'); // Eliminamos el token inválido
        localStorage.removeItem('role');
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  return { isAuthenticated, loading };
};
