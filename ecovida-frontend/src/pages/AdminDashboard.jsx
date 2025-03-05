import React, { useEffect, useState } from 'react';
import { getAllUsers } from '../api/userService';
import { getOrders, updateOrder, deleteOrder } from '../api/ordersService';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api/productsService';
import { getAllShipments, updateShipmentStatus } from '../api/shippingService';
import { useNavigate } from 'react-router-dom';
import '../styles/AdminDashboard.css';

function AdminDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    categoria: '',
    stock_disponible: '',
    imagen: null
  });

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [token, navigate]);

  const fetchData = async () => {
    try {
      const [resUsers, resOrders, resProducts, resShipments] = await Promise.all([
        getAllUsers(token),
        getOrders(token),
        getProducts(token),
        getAllShipments(token),
      ]);
  
      setUsers(resUsers.data);
      setOrders(resOrders.data);
      setProducts(resProducts.data);
      setShipments(resShipments.data);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      alert(`Error al obtener datos: ${err.response?.data?.message || 'API no disponible'}`);
    }
  };

  const handleChange = (e) => {
    if (e.target.name === 'imagen') {
      if (e.target.files.length > 0) {
        setFormData({ ...formData, imagen: e.target.files[0] });
      }
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };
  
  const handleSaveProduct = async () => {
    if (!formData.nombre || !formData.descripcion || !formData.precio || 
        !formData.categoria || !formData.stock_disponible || !formData.imagen) {
      alert("Todos los campos son obligatorios.");
      return;
    }
  
    try {
      const productFormData = new FormData();
      productFormData.append('nombre', formData.nombre);
      productFormData.append('descripcion', formData.descripcion);
      productFormData.append('precio', formData.precio);
      productFormData.append('categoria', formData.categoria);
      productFormData.append('stock_disponible', formData.stock_disponible);
  
      if (formData.imagen instanceof File) {
        productFormData.append('imagen', formData.imagen);
      }
  
      if (selectedProduct) {
        await updateProduct(token, selectedProduct.id_producto, productFormData);
        alert('Producto actualizado correctamente');
      } else {
        await createProduct(token, productFormData);
        alert('Producto creado correctamente');
      }
  
      fetchData();
      setModalOpen(false);
    } catch (err) {
      alert(`Error al guardar producto: ${err.response?.data?.message || 'Error desconocido'}`);
    }
  };
  
  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setFormData({
      nombre: product.nombre,
      descripcion: product.descripcion,
      precio: product.precio,
      categoria: product.categoria,
      stock_disponible: product.stock_disponible,
      imagen: null
    });
    setModalOpen(true);
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este producto?")) {
      return;
    }
  
    try {
      await deleteProduct(token, id);
      alert('Producto eliminado correctamente');
      fetchData();
    } catch (err) {
      alert(`Error al eliminar producto: ${err.response?.data?.message || 'No se pudo eliminar el producto.'}`);
    }
  };

  const handleOrderStatusChange = async (id_pedido, nuevoEstado) => {
    try {
      await updateOrder(token, id_pedido, { estado: nuevoEstado });
      alert(`Estado del pedido #${id_pedido} actualizado a ${nuevoEstado}`);
      fetchData();
    } catch (err) {
      alert('No se pudo actualizar el estado del pedido');
    }
  };

  const handleDeleteOrder = async (id_pedido) => {
    try {
      await deleteOrder(token, id_pedido);
      alert(`Pedido #${id_pedido} eliminado`);
      fetchData();
    } catch (err) {
      alert('No se pudo eliminar el pedido');
    }
  };

  const handleUpdateShipment = async (id_envio, estado) => {
    try {
      await updateShipmentStatus(token, id_envio, estado);
      alert(`Envío actualizado a ${estado}`);
      fetchData();
    } catch (err) {
      alert('Error al actualizar el envío');
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <h3>Panel de Administración</h3>
        <nav>
          <ul>
            <li><a href="#users-section">Usuarios</a></li>
            <li><a href="#products-section">Productos</a></li>
            <li><a href="#orders-section">Pedidos</a></li>
            <li><a href="#shipments-section">Envíos</a></li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <section id="users-section" className="section-container">
          <h3>Usuarios Registrados</h3>
          <ul>
            {users.length > 0 ? (
              users.map((u) => <li key={u.id}>{u.nombre} - {u.email} ({u.rol})</li>)
            ) : (
              <p>No hay usuarios registrados</p>
            )}
          </ul>
        </section>

        <section id="products-section" className="section-container">
          <h3>Gestión de Productos</h3>
          <button className="add-button" onClick={() => { setSelectedProduct(null); setModalOpen(true); }}>
            Agregar Producto
          </button>
          <div className="products-container">
            {products.length > 0 ? (
              products.map((p) => (
                <div key={p.id_producto} className="product-card">
                  <img 
                    src={p.imagen_url ? `http://localhost:3001${p.imagen_url}` : 'https://via.placeholder.com/100'}
                    alt={p.nombre}
                  />
                  <h4>{p.nombre}</h4>
                  <p>Precio: ${p.precio}</p>
                  <p>Categoría: {p.categoria}</p>
                  <button onClick={() => handleEditProduct(p)}>Editar</button>
                  <button className="delete-button" onClick={() => handleDeleteProduct(p.id_producto)}>Eliminar</button>
                </div>
              ))
            ) : (
              <p>No hay productos registrados</p>
            )}
          </div>
        </section>

        <section id="orders-section" className="section-container">
          <h3>Pedidos</h3>
          {orders.length > 0 ? (
            orders.map((o) => (
              <div key={o.id_pedido} className="item-container">
                <p>Pedido #{o.id_pedido} | Estado: {o.estado} | Total: ${o.total}</p>
                <label>Cambiar estado:</label>
                <select value={o.estado} onChange={(e) => handleOrderStatusChange(o.id_pedido, e.target.value)}>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Procesando">Procesando</option>
                  <option value="Enviado">Enviado</option>
                  <option value="Entregado">Entregado</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
                <button onClick={() => handleDeleteOrder(o.id_pedido)}>Eliminar</button>
              </div>
            ))
          ) : (
            <p>No hay pedidos registrados</p>
          )}
        </section>

        <section id="shipments-section" className="section-container">
          <h3>Envíos</h3>
          {shipments.length > 0 ? (
            shipments.map((s) => (
              <div key={s.id_envio} className="item-container">
                <p>Envío #{s.id_envio} | Estado: {s.estado} | Dirección: {s.direccion_entrega}</p>
                <label>Cambiar estado:</label>
                <select value={s.estado} onChange={(e) => handleUpdateShipment(s.id_envio, e.target.value)}>
                  <option value="Pendiente">Pendiente</option>
                  <option value="En tránsito">En tránsito</option>
                  <option value="Entregado">Entregado</option>
                  <option value="Devuelto">Devuelto</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>
            ))
          ) : (
            <p>No hay envíos registrados</p>
          )}
        </section>
      </main>

      {/* Modal para Crear/Editar Producto */}
      {modalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>{selectedProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
            <input type="text" name="nombre" placeholder="Nombre" value={formData.nombre} onChange={handleChange} required />
            <input type="text" name="descripcion" placeholder="Descripción" value={formData.descripcion} onChange={handleChange} required />
            <input type="number" name="precio" placeholder="Precio" value={formData.precio} onChange={handleChange} required />
            <input type="text" name="categoria" placeholder="Categoría" value={formData.categoria} onChange={handleChange} required />
            <input type="number" name="stock_disponible" placeholder="Stock" value={formData.stock_disponible} onChange={handleChange} required />
            <input type="file" name="imagen" onChange={handleChange} required />
            <div className="modal-buttons">
              <button onClick={handleSaveProduct}>{selectedProduct ? 'Actualizar' : 'Crear'}</button>
              <button onClick={() => setModalOpen(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
