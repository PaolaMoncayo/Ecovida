import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById } from '../api/productsService';
import { addToCart } from '../api/cartService';
import '../styles/ProductDetail.css';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [cantidad, setCantidad] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await getProductById(id);
        setProduct(res.data);
      } catch (err) {
        console.error('Error al obtener producto:', err);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Debes iniciar sesión para agregar al carrito');
      navigate('/login');
      return;
    }

    try {
      await addToCart(token, { id_producto: id, cantidad });
      alert('Producto agregado al carrito');
    } catch (error) {
      console.error('Error al agregar al carrito:', error);
      alert('Error al agregar producto al carrito');
    }
  };

  if (!product) return <div className="loading">Cargando...</div>;

  return (
  <main class="main-wrapper">
    <div className="product-detail-container">
      {/* Imagen del producto */}
      <div className="product-image-container">
        <img
          src={product.imagen_url ? `http://localhost:3001${product.imagen_url}` : 'https://via.placeholder.com/400'}
          alt={product.nombre}
          className="product-image"
        />
      </div>

      {/* Información del producto */}
      <div className="product-info-container">
        <h2 className="product-title">{product.nombre}</h2>
        <p className="product-description">{product.descripcion}</p>
        <p className="product-price">Precio: <span>${product.precio}</span></p>
        <p className="product-stock">Stock disponible: {product.stock_disponible}</p>
      </div>

      {/* Sección de compra */}
      <div className="product-buy-container">
        <p className="buy-price">Subtotal: <span>${(product.precio * cantidad).toFixed(2)}</span></p>
        <input
          type="number"
          min="1"
          value={cantidad}
          className="quantity-input"
          onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value, 10)))}
        />
        <button className="buy-button" onClick={handleAddToCart}>Agregar al Carrito</button>
      </div>
    </div>
    </main>
  );
}

export default ProductDetail;
