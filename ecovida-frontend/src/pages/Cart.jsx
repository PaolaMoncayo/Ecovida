// src/pages/Cart.jsx
import React, { useEffect, useState } from 'react';
import { getCart, removeCartItem, updateCartItem } from '../api/cartService';
import { useNavigate } from 'react-router-dom';
import '../styles/Cart.css';

function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const token = localStorage.getItem('token');

  const fetchCart = async () => {
    try {
      const res = await getCart(token);
      // Se espera la respuesta en { message, carrito: [...] }
      setCart(res.data.carrito || []);
    } catch (error) {
      console.error('Error al obtener carrito:', error);
      if (error.response?.status === 401) {
        alert('Debes iniciar sesión');
        navigate('/login');
      }
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchCart();
    // eslint-disable-next-line
  }, []);

  const handleRemove = async (id_producto) => {
    try {
      await removeCartItem(token, id_producto);
      fetchCart();
    } catch (error) {
      console.error('Error al eliminar producto:', error);
    }
  };

  // Enviar delta (±1) para actualizar la cantidad
  const handleUpdateQuantity = async (id_producto, delta) => {
    try {
      await updateCartItem(token, id_producto, delta);
      fetchCart();
    } catch (error) {
      console.error('Error al actualizar cantidad:', error);
    }
  };

  // Si el carrito está vacío, mostrar el mensaje personalizado
  if (!cart.length) {
    return <div className="cart-empty">No hay carritos.</div>;
  }

  const totalPrice = cart.reduce((total, item) => total + item.precio * item.cantidad, 0);

  return (
    <main className="main-cart"> 
      <div className="cart-container">
        <h2>Mi Carrito</h2>
        <div className="cart-items">
          {cart.map((item) => (
            <div key={item.id_producto} className="cart-item">
              <div className="cart-item-image">
                <img 
                  src={item.imagen_url ? `http://127.0.0.1:3001${item.imagen_url}` : 'https://via.placeholder.com/100'}
                  alt={item.nombre} 
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/100'; }}
                />
              </div>
              <div className="cart-item-details">
                <h4 className="cart-item-name">{item.nombre}</h4>
                <p className="cart-item-price">Precio: ${item.precio}</p>
                <div className="cart-item-quantity">
                  <button 
                    onClick={() => handleUpdateQuantity(item.id_producto, -1)}
                    className="quantity-btn"
                  >-</button>
                  <span>{item.cantidad}</span>
                  <button 
                    onClick={() => handleUpdateQuantity(item.id_producto, 1)}
                    className="quantity-btn"
                  >+</button>
                </div>
                <button onClick={() => handleRemove(item.id_producto)} className="remove-btn">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
        <div className="cart-summary">
          <p className="total-label">Total:</p>
          <p className="total-amount">${totalPrice.toFixed(2)}</p>
        </div>
        <button onClick={() => navigate('/checkout')} className="checkout-btn">Ir a Checkout</button>
      </div>
    </main>
  );
}

export default Cart;
