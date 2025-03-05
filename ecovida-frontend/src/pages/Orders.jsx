// src/pages/Orders.jsx
import React, { useEffect, useState } from 'react';
import { getOrders } from '../api/ordersService';
import { useNavigate } from 'react-router-dom';

function Orders() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await getOrders(token);
        setOrders(res.data);
      } catch (error) {
        console.error('Error al obtener pedidos:', error);
        if (error.response?.status === 401) {
          navigate('/login');
        }
      }
    };

    fetchOrders();
  }, [token, navigate]);

  if (!orders.length) {
    return <div style={{ padding: '1rem' }}>No tienes pedidos registrados.</div>;
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Mis Pedidos</h2>
      {orders.map((o) => (
        <div key={o.id_pedido} style={{ border: '1px solid #ccc', marginBottom: '1rem', padding: '0.5rem' }}>
          <h4>Pedido #{o.id_pedido}</h4>
          <p>Estado: {o.estado}</p>
          <p>Total: ${o.total}</p>
          <p>Dirección: {o.direccion_entrega}</p>
          <p>Creado en: {o.creado_en}</p>
          <p>Productos:</p>
          <ul>
            {o.productos?.map((prod) => (
              <li key={prod.id_producto}>
                {prod.nombre} - Cant: {prod.cantidad} (Precio Unit.: {prod.precio_unitario})
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default Orders;
