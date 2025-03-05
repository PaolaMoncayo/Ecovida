// src/api/cartService.js
import axios from 'axios';

const CART_API = 'http://localhost:3002';

// Obtener carrito del usuario
export const getCart = async (token) => {
  return axios.get(`${CART_API}/carrito`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Agregar producto al carrito
export const addToCart = async (token, { id_producto, cantidad }) => {
  return axios.post(
    `${CART_API}/carrito`,
    { id_producto, cantidad },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

// Actualizar cantidad (PUT /carrito/:id_producto)
export const updateCartItem = async (token, id_producto, cantidad) => {
  return axios.put(
    `${CART_API}/carrito/${id_producto}`,
    { cantidad },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

// Eliminar producto del carrito
export const removeCartItem = async (token, id_producto) => {
  return axios.delete(`${CART_API}/carrito/${id_producto}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
