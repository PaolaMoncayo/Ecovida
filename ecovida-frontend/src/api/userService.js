// src/api/userService.js
import axios from 'axios';
const USERS_API = 'http://localhost:3000';
 
// Registrar usuario
export const registerUser = async (userData) => {
  // userData tiene { nombre, email, password, perfil }
  return await axios.post(`${USERS_API}/usuarios/registro`, userData);
};

// Iniciar sesión (retorna token, según tu backend)
export const loginUser = async (credentials) => {
  // credentials = { email, password }
  return await axios.post(`${USERS_API}/login`, credentials);
};

// Obtener perfil de usuario autenticado
export const getUserProfile = async (token) => {
  return axios.get(`${USERS_API}/usuarios/perfil`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};


// Obtener todos los usuarios (solo admin)
export const getAllUsers = async (token) => {
  return await axios.get(`${USERS_API}/usuarios`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Actualizar usuario (puede ser uno mismo o admin)
export const updateUser = async (id, data, token) => {
  return await axios.put(`${USERS_API}/usuarios/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Eliminar usuario
export const deleteUser = async (id, token) => {
  return await axios.delete(`${USERS_API}/usuarios/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

/* ----------------------------------
   SIMULACIÓN DE RUTAS PARA 2FA
   Tu backend actual NO las tiene;
   deberías implementarlas si quieres
   2FA real.
---------------------------------- */

// Solicitar envío del código 2FA
export const request2FACode = async (email) => {
  // Ejemplo de endpoint que DEBERÍAS crear en tu backend
  return await axios.post(`${USERS_API}/login/send-2fa`, { email });
};

// Verificar código 2FA y obtener token final
export const verify2FA = async (email, code) => {
  // Endpoint que DEBERÍAS crear
  return await axios.post(`${USERS_API}/login/verify-2fa`, { email, code });
};
