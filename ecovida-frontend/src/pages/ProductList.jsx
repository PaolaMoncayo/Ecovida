import React, { useState, useEffect } from 'react';
import { getProducts } from '../api/productsService';
import { Link } from 'react-router-dom';
import '../styles/ProductList.css';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    nombre: '',
    categoria: '',
  });

  const fetchData = async () => {
    try {
      const response = await getProducts(filters);
      setProducts(response.data);
    } catch (error) {
      console.error('Error al obtener productos:', error);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchData();
  };

  return (
    <div className="product-container">
      <h2 className="title">Catálogo de Productos</h2>
      
      <form className="search-form" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={filters.nombre}
          onChange={(e) => setFilters({ ...filters, nombre: e.target.value })}
          className="search-input"
        />
        <input
          type="text"
          placeholder="Categoría..."
          value={filters.categoria}
          onChange={(e) => setFilters({ ...filters, categoria: e.target.value })}
          className="search-input"
        />
        <button type="submit" className="search-button">Buscar</button>
      </form>

      <div className="product-list">
        {products.length > 0 ? (
          products.map((p) => (
            <div key={p.id_producto} className="product-card">
              <img 
                src={p.imagen_url ? `http://localhost:3001${p.imagen_url}` : 'https://via.placeholder.com/150'}
                alt={p.nombre}
                className="product-image"
              />
              <div className="product-info">
                <h3 className="product-name">{p.nombre}</h3>
                <p className="product-description">{p.descripcion}</p>
                <p className="product-price">Precio: ${p.precio}</p>
                <p className="product-category">Categoría: {p.categoria}</p>
                <Link to={`/productos/${p.id_producto}`} className="product-link">Ver Detalle</Link>
              </div>
            </div>
          ))
        ) : (
          <p className="no-products">No hay productos disponibles</p>
        )}
      </div>
    </div>
  );
}

export default ProductList;
