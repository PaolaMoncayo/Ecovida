// src/api/productsService.js
import axios from 'axios';

const CATALOG_API = 'http://localhost:3001';

// Listar productos (con filtros opcionales)
export const getProducts = async (token, params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  return axios.get(`${CATALOG_API}/productos?${queryParams}`, {
    headers: { Authorization: `Bearer ${token}` },  // 📌 Se pasa el token
  });
};

// Obtener producto por ID
export const getProductById = async (id) => {
  return axios.get(`${CATALOG_API}/productos/${id}`);
};

// Crear producto (admin)
export const createProduct = async (token, productData) => {
  const formData = new FormData();
  formData.append('nombre', productData.get('nombre'));
  formData.append('descripcion', productData.get('descripcion'));
  formData.append('precio', productData.get('precio'));
  formData.append('categoria', productData.get('categoria'));
  formData.append('stock_disponible', productData.get('stock_disponible'));
  
  if (productData.get('imagen')) {
    formData.append('imagen', productData.get('imagen'));
  }

  return axios.post(`${CATALOG_API}/productos`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`,
    },
  });
};

export const updateProduct = async (token, id, productData) => {
  const formData = new FormData();
  formData.append('nombre', productData.get('nombre'));
  formData.append('descripcion', productData.get('descripcion'));
  formData.append('precio', productData.get('precio'));
  formData.append('categoria', productData.get('categoria'));
  formData.append('stock_disponible', productData.get('stock_disponible'));

  // ✅ Si hay una nueva imagen, se agrega al formulario
  if (productData.get('imagen')) {
    formData.append('imagen', productData.get('imagen'));
  }

  return axios.put(`${CATALOG_API}/productos/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`,
    },
  });
};



// Eliminar producto (admin)
export const deleteProduct = async (token, id) => {
  try {
    const response = await axios.delete(`http://localhost:3001/productos/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar producto:', error.response?.data?.message || error.message);
    throw error;
  }
};




