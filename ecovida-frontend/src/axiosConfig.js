import axios from 'axios';

// Configurar el interceptor de respuestas
axios.interceptors.response.use(
  (response) => response, // Si la respuesta es exitosa, la retorna sin cambios
  (error) => {
    if (error.response && error.response.status === 401) {
      alert("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      window.location.href = '/login'; // Redirige a la página de login
    }
    return Promise.reject(error);
  }
);

export default axios;
