// src/api/ordersService.js
import axios from 'axios';

const ORDERS_API = 'http://localhost:3003';

// Obtener pedidos (admin ve todos, usuario sus pedidos)
export const getOrders = async (token) => {
  return axios.get(`${ORDERS_API}/pedidos`, {
    headers: {
      Authorization: `Bearer ${token}`,  // Asegurar que el token se envía correctamente
    },
  });
};


// Crear pedido desde el carrito
export const createOrder = async (token, direccion_entrega) => {
  return axios.post(
    `${ORDERS_API}/pedidos`,
    { direccion_entrega },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

// Actualizar pedido (cambiar estado o dirección)
export const updateOrder = async (token, id_pedido, data) => {
  try {
    return await axios.put(`${ORDERS_API}/pedidos/${id_pedido}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    console.error('Error al actualizar pedido:', error.response?.data?.message || error.message);
    throw error;
  }
};

// Eliminar pedido (solo admin si está en Pendiente o Cancelado)
export const deleteOrder = async (token, id_pedido) => {
  try {
    return await axios.delete(`${ORDERS_API}/pedidos/${id_pedido}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    console.error('Error al eliminar pedido:', error.response?.data?.message || error.message);
    throw error;
  }
};
