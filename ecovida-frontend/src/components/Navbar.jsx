import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role'); // Obtener el rol del usuario

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      {/* Logo con imagen */}
      <Link to="/" className="logo">
        <img src="/imgs/logo.jpg"  alt="EcoVida Logo" className="logo-image" />
        <span>EcoVida</span>
      </Link>

      <div className="nav-links">
        <Link to="/productos">Productos</Link>
        <Link to="/carrito">Carrito</Link>

        {token ? (
          <>
            <Link to="/mis-pedidos">Mis Pedidos</Link>
            {role === 'admin' && <Link to="/admin">Admin Dashboard</Link>}
            <button className="nav-button" onClick={handleLogout}>Cerrar Sesión</button>
          </>
        ) : (
          <>
            <Link to="/login">Iniciar Sesión</Link>
            <Link to="/register">Registrarse</Link>
          </>
        )}

      </div>
    </nav>
  );
}

export default Navbar;
