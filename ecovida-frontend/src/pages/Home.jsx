import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css';

function Home() {
  return (
    <div className="home">
      
      {/* 🏠 Sección Hero */}
      <div className="hero-section">
        <div className="hero-text">
          <h1>Bienvenido a <span className="highlight">EcoVida</span></h1>
          <p>Descubre los mejores productos ecológicos y sostenibles para un mundo mejor.</p>
          <Link to="/productos" className="cta-button">Explorar Productos</Link>
        </div>
        <div className="hero-image">
          <img src="/imgs/banner.jpg" alt="EcoVida Banner" />
        </div>
      </div>

      {/* 🛍️ Sección de Categorías */}
      <div className="categories-section">
  
        <div className="categories-container">
          <div className="category-card">
            <img src="/imgs/frutas.jpg" alt="Frutas Orgánicas" />
            <h3>Frutas Orgánicas</h3>
          </div>
          <div className="category-card">
            <img src="/imgs/verduras.jpg" alt="Verduras Frescas" />
            <h3>Verduras Frescas</h3>
          </div>
          <div className="category-card">
            <img src="/imgs/granos.jpg" alt="Granos Naturales" />
            <h3>Granos Naturales</h3>
          </div>
          <div className="category-card">
            <img src="/imgs/vegano.jpg" alt="Productos Veganos" />
            <h3>Productos Veganos</h3>
          </div>
        </div>
      </div>

      {/* 📢 Sección de Promociones */}
      <div className="promo-section">
        <div className="promo-image">
          <img src="/imgs/oferta.jpg" alt="Promoción Especial" />
        </div>
        <div className="promo-text">
          <h2>Descuentos Especiales</h2>
          <p>Aprovecha nuestras ofertas exclusivas en productos ecológicos. ¡Compra hoy mismo!</p>
          <Link to="/productos" className="cta-button">Ver Ofertas</Link>
        </div>
      </div>

      {/* 💬 Sección de Testimonios */}
      <div className="testimonials-section">
        <h2>Lo que dicen nuestros clientes</h2>
        <div className="testimonials-container">
          <div className="testimonial-card">
            <p>"Los productos son de excelente calidad. ¡Me encantó!"</p>
            <h4>- Juan Pérez</h4>
          </div>
          <div className="testimonial-card">
            <p>"Increíble servicio y variedad de productos ecológicos."</p>
            <h4>- María López</h4>
          </div>
          <div className="testimonial-card">
            <p>"Mis cultivos han mejorado desde que uso EcoVida."</p>
            <h4>- Carlos Jiménez</h4>
          </div>
        </div>
      </div>

      {/* 📩 Sección de Suscripción */}
      <div className="newsletter-section">
        <h2>Inicia sesión</h2>
        <p>Inicia sesión para ofertas exclusivas.</p>
        <form className="newsletter-form">
      
          <button type="submit">Entrar</button>
        </form>
      </div>

    </div>
  );
}

export default Home;
