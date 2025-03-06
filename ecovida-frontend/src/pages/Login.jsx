import React, { useState } from 'react';
import { loginUser, getUserProfile } from '../api/userService';
import { useNavigate } from 'react-router-dom';
import { sanitizeInput } from '../utils/sanitize';
import '../styles/Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Manejador para bloquear caracteres prohibidos al teclear
  const handleKeyDown = (e) => {
    const forbiddenChars = ['<', '>', '{', '}', '(', ')', ';', "'", '"'];
    if (forbiddenChars.includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    // Limpiar cualquier sesión anterior
    localStorage.removeItem('token');
    localStorage.removeItem('role');

    try {
      // Se sanitizan los datos antes de enviarlos
      const response = await loginUser({
        email: sanitizeInput(email),
        password: sanitizeInput(password)
      });
      const token = response.data.token;

      if (token) {
        localStorage.setItem('token', token);

        // Obtener perfil del usuario
        const profileResponse = await getUserProfile(token);
        const userRole = profileResponse.data.rol || 'usuario';
        localStorage.setItem('role', userRole);

        navigate(userRole === 'admin' ? '/admin' : '/');
      } else {
        throw new Error('Token no recibido');
      }
    } catch (err) {
      console.error('Error en el login:', err.response?.data?.message || err.message);
      setError('Credenciales inválidas o error del servidor');
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Iniciar Sesión</h2>
      <p className="login-instructions">Por favor, ingresa tu correo y contraseña para acceder a tu cuenta.</p>
      
      <form className="login-form" onSubmit={handleLogin}>
        <label className="login-label">Correo Electrónico</label>
        <input
          type="email"
          className="login-input"
          placeholder="Ejemplo: usuario@correo.com"
          value={email}
          onChange={(e) => setEmail(sanitizeInput(e.target.value))}
          onKeyDown={handleKeyDown}
          required
          pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
        />
        
        <label className="login-label">Contraseña</label>
        <input
          type="password"
          className="login-input"
          placeholder="Ingresa tu contraseña"
          value={password}
          onChange={(e) => setPassword(sanitizeInput(e.target.value))}
          onKeyDown={handleKeyDown}
          required
        />

        {error && <p className="error-message">{error}</p>}
        
        <button type="submit" className="login-button">Entrar</button>
      </form>
    </div>
  );
}

export default Login;
