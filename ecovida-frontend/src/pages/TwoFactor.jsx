// src/pages/TwoFactor.jsx
import React, { useState } from 'react';
import { verify2FA } from '../api/userService';
import { useNavigate } from 'react-router-dom';

function TwoFactor() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  // Recuperamos email guardado temporalmente
  const email = localStorage.getItem('userEmail');
  if (!email) {
    navigate('/login');
  }

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const res = await verify2FA(email, code);
      const token = res.data.token;
      localStorage.setItem('token', token);
      localStorage.removeItem('userEmail');
      navigate('/');
    } catch (err) {
      console.error('Error verificando 2FA:', err);
      setError('Código inválido o error del servidor');
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Autenticación de Dos Pasos</h2>
      <p>Se ha enviado un código a tu correo/SMS. Ingresa el código:</p>
      <form onSubmit={handleVerify}>
        <input
          type="text"
          placeholder="Código de 6 dígitos"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
        <button type="submit">Verificar</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default TwoFactor;
