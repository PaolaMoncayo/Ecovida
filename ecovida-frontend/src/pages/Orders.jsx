// src/pages/Orders.jsx
import React, { useEffect, useState } from 'react';
import { getOrders } from '../api/ordersService';
import { useNavigate } from 'react-router-dom';
import '../styles/Orders.css';

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
    return (
      <div className="orders-empty">
        <h2>No tienes pedidos registrados.</h2>
      </div>
    );
  }

  return (
    <div className="orders-container">
      <h2 className="orders-title">Mis Pedidos</h2>
      <div className="orders-list">
        {orders.map((o) => (
          <div key={o.id_pedido} className="order-card">
            <h3 className="order-number">Pedido #{o.id_pedido}</h3>
            <p className="order-status">Estado: {o.estado}</p>
            <p className="order-total">Total: ${o.total}</p>
            <p className="order-address">Dirección: {o.direccion_entrega}</p>
            <p className="order-date">Creado en: {o.creado_en}</p>

            <div className="order-products">
              <h4>Productos:</h4>
              <ul>
                {o.productos?.map((prod) => (
                  <li key={prod.id_producto} className="order-product-item">
                
                    <div className="order-product-details">
                      <span className="order-product-title">{prod.nombre}</span>
                      <span className="order-product-qty">Cant: {prod.cantidad}</span>
                      <span className="order-product-unit-price">Precio Unit.: ${prod.precio_unitario}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Orders;