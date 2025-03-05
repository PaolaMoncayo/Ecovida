import React, { useState } from 'react';
import { registerUser } from '../api/userService';
import { useNavigate } from 'react-router-dom';
import '../styles/Register.css';

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    perfil: 'usuario',
  });
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({ label: 'Débil', color: 'weak' });
  const [passwordMatchError, setPasswordMatchError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });

    if (e.target.name === 'password') {
      evaluatePasswordStrength(e.target.value);
    }

    if (e.target.name === 'confirmPassword') {
      validatePasswordMatch(e.target.value, form.password);
    }
  };

  const evaluatePasswordStrength = (password) => {
    let strength = { label: 'Débil', color: 'weak' };

    if (password.length >= 8) {
      strength = { label: 'Media', color: 'medium' };
    }
    if (password.length >= 12 && /[A-Z]/.test(password) && /\d/.test(password) && /[!@#$%^&*()]/.test(password)) {
      strength = { label: 'Fuerte', color: 'strong' };
    }

    setPasswordStrength(strength);
  };

  const validatePasswordMatch = (confirmPassword, password) => {
    if (confirmPassword !== password) {
      setPasswordMatchError('Las contraseñas no coinciden.');
    } else {
      setPasswordMatchError('');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setPasswordMatchError('Las contraseñas no coinciden.');
      return;
    }

    if (passwordStrength.label !== 'Fuerte') {
      setError('La contraseña debe ser "Fuerte" para registrarte.');
      return;
    }

    try {
      await registerUser(form);
      alert('Usuario registrado con éxito. Ahora puedes iniciar sesión.');
      navigate('/login');
    } catch (err) {
      setError('No se pudo registrar. Verifica los datos o contacta al admin.');
    }
  };

  return (
    <div className="register-container">
      <h2 className="register-title">Crear una cuenta</h2>
      <p className="register-instructions">Completa los siguientes campos para registrarte en nuestra plataforma.</p>
      
      <form className="register-form" onSubmit={handleRegister}>
        <label className="register-label">Nombre</label>
        <input
          type="text"
          className="register-input"
          placeholder="Ejemplo: Juan Pérez"
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          required
        />

        <label className="register-label">Correo Electrónico</label>
        <input
          type="email"
          className="register-input"
          placeholder="Ejemplo: usuario@correo.com"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <label className="register-label">Contraseña</label>
        <input
          type="password"
          className="register-input"
          placeholder="Debe contener 12 caracteres, mayúscula, número y símbolo"
          name="password"
          value={form.password}
          onChange={handleChange}
          required
        />

        {/* 📊 Indicador de seguridad de contraseña */}
        <div className={`password-strength ${passwordStrength.color}`}>
          {passwordStrength.label}
        </div>

        <label className="register-label">Confirmar Contraseña</label>
        <input
          type="password"
          className="register-input"
          placeholder="Repite tu contraseña"
          name="confirmPassword"
          value={form.confirmPassword}
          onChange={handleChange}
          required
        />

        {passwordMatchError && <p className="error-message">{passwordMatchError}</p>}
        {error && <p className="error-message">{error}</p>}

        <button 
          type="submit" 
          className="register-button" 
          disabled={passwordStrength.label !== 'Fuerte' || passwordMatchError !== ''}
        >
          Registrarse
        </button>
      </form>
    </div>
  );
}

export default Register;
