// src/api/shippingService.js
import axios from 'axios';

const SHIPPING_API = 'http://localhost:3004';

// Obtener todos los envíos (admin)
export const getAllShipments = async (token) => {
  return axios.get(`${SHIPPING_API}/envios`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Crear envío cuando un pedido cambia a "Enviado" (admin)
export const createShipment = async (token, id_pedido) => {
  return axios.post(
    `${SHIPPING_API}/envios`,
    { id_pedido },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

// Actualizar estado del envío (En tránsito -> Entregado)
export const updateShipmentStatus = async (token, id_envio, estado) => {
  return axios.put(
    `${SHIPPING_API}/envios/${id_envio}`,
    { estado },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};
