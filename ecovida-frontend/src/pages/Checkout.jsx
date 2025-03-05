// src/pages/Checkout.jsx
import React, { useState } from 'react';
import { createOrder } from '../api/ordersService';
import { useNavigate } from 'react-router-dom';

function Checkout() {
  const navigate = useNavigate();
  const [direccion, setDireccion] = useState('');
  const token = localStorage.getItem('token');

  if (!token) {
    navigate('/login');
  }

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      const res = await createOrder(token, direccion);
      alert('Pedido creado exitosamente. N°: ' + res.data.pedido.id_pedido);
      navigate('/mis-pedidos');
    } catch (error) {
      console.error('Error al crear pedido:', error);
      alert('No se pudo crear el pedido');
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Checkout</h2>
      <form onSubmit={handleCreateOrder}>
        <label>Dirección de entrega:</label>
        <input
          type="text"
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          required
        />
        <button type="submit">Confirmar Compra</button>
      </form>
    </div>
  );
}

export default Checkout;
