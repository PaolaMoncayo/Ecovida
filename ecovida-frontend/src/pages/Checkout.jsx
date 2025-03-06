import React, { useState, useEffect } from 'react';
import { createOrder } from '../api/ordersService';
import { getCart } from '../api/cartService';
import { getUserProfile } from '../api/userService';
import { useNavigate } from 'react-router-dom';
import { sanitizeInput } from '../utils/sanitize';
import '../styles/Checkout.css';

function Checkout() {
  const navigate = useNavigate();
  const [direccion, setDireccion] = useState('');
  const [cart, setCart] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    // Obtener datos del carrito
    const fetchCart = async () => {
      try {
        const res = await getCart(token);
        setCart(res.data.carrito || []);
      } catch (error) {
        console.error('Error al obtener el carrito:', error);
      }
    };

    // Obtener datos del usuario
    const fetchUserProfile = async () => {
      try {
        const res = await getUserProfile(token);
        setUserProfile(res.data);
      } catch (error) {
        console.error('Error al obtener perfil del usuario:', error);
      }
    };

    fetchCart();
    fetchUserProfile();
  }, [token, navigate]);

  // Calcular el total del carrito
  const totalPrice = cart.reduce(
    (total, item) => total + item.precio * item.cantidad,
    0
  );

  // Manejador para bloquear caracteres prohibidos al teclear
  const handleKeyDown = (e) => {
    const forbiddenChars = ['<', '>', '{', '}', '(', ')', ';', "'", '"'];
    if (forbiddenChars.includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await createOrder(token, direccion);
      alert('Pedido creado exitosamente. N°: ' + res.data.pedido.id_pedido);
      navigate('/mis-pedidos');
    } catch (error) {
      console.error('Error al crear pedido:', error);
      alert('No se pudo crear el pedido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="checkout-wrapper">
      <div className="checkout-container">
        <h2>Checkout</h2>
        
        {/* Datos del usuario */}
        <div className="user-info">
          <h3>Información del Comprador</h3>
          {userProfile ? (
            <div>
              <p><strong>Nombre:</strong> {userProfile.nombre}</p>
              <p><strong>Email:</strong> {userProfile.email}</p>
            </div>
          ) : (
            <p>Cargando información del usuario...</p>
          )}
        </div>
        
        {/* Resumen del carrito */}
        <div className="order-summary">
          <h3>Resumen del Pedido</h3>
          {cart.length > 0 ? (
            <div>
              {cart.map((item) => (
                <div key={item.id_producto} className="order-item">
                  <p>
                    {item.nombre} x {item.cantidad} - ${ (item.precio * item.cantidad).toFixed(2) }
                  </p>
                </div>
              ))}
              <p><strong>Total:</strong> ${ totalPrice.toFixed(2) }</p>
            </div>
          ) : (
            <p>No hay productos en el carrito.</p>
          )}
        </div>
        
        {/* Formulario de dirección */}
        <form onSubmit={handleCreateOrder} className="checkout-form">
          <div className="form-group">
            <label htmlFor="direccion">Dirección de entrega:</label>
            <input
              id="direccion"
              type="text"
              value={direccion}
              placeholder="Ingresa tu dirección"
              required
              onChange={(e) => setDireccion(sanitizeInput(e.target.value))}
              onKeyDown={handleKeyDown}
            />
          </div>
          <button type="submit" disabled={isLoading || !direccion.trim()}>
            {isLoading ? 'Procesando...' : 'Confirmar Compra'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Checkout;
