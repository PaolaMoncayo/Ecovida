import React from 'react';
import '../styles/Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <p>© {new Date().getFullYear()} EcoVida - Todos los derechos reservados.</p>
    </footer>
  );
}

export default Footer;
