const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
app.use(express.json());

// Configuración de conexión a PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});

// Middleware para validar JWT
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Agregar datos del usuario al request
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token inválido o expirado' });
  }
};

// Ruta raíz para pruebas
app.get('/', (req, res) => {
  res.send('API de carrito de compras está funcionando');
});

// **Ver todos los productos en los carritos (solo admin)**
app.get('/admin/carrito', authenticateJWT, async (req, res) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado: solo los administradores pueden ver todos los carritos' });
  }

  try {
    const result = await pool.query('SELECT * FROM carrito');
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener todos los carritos:', err.message);
    res.status(500).json({ message: 'Error de base de datos', error: err.message });
  }
});

// **Ruta protegida: obtener el carrito del usuario autenticado**
app.get('/carrito', authenticateJWT, async (req, res) => {
  try {
    // Verificar que el perfil del usuario sea "usuario"
    if (req.user.rol !== 'usuario') {
      return res.status(403).json({ message: 'Acceso denegado: solo los usuarios pueden tener un carrito' });
    }

    // Consulta el carrito del usuario autenticado
    const result = await pool.query(
      'SELECT * FROM carrito WHERE id_usuario = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No se encontraron artículos en el carrito para este usuario' });
    }

    res.json({
      message: 'Carrito obtenido con éxito',
      carrito: result.rows,
    });
  } catch (error) {
    console.error('Error al obtener el carrito:', error.message);
    res.status(500).json({ message: 'Error al obtener el carrito', error: error.message });
  }
});

// **Agregar productos al carrito de un usuario específico**
app.post('/carrito', authenticateJWT, async (req, res) => {
  if (req.user.rol !== 'usuario') {
    return res.status(403).json({ message: 'Acceso denegado: solo usuarios pueden agregar productos a su carrito' });
  }

  const { id_producto, cantidad } = req.body;

  try {
    // Verificar si el producto ya existe en el carrito
    const existingProduct = await pool.query(
      'SELECT * FROM carrito WHERE id_usuario = $1 AND id_producto = $2',
      [req.user.id, id_producto]
    );

    if (existingProduct.rows.length > 0) {
      // Si ya existe, actualizar la cantidad
      const updatedProduct = await pool.query(
        'UPDATE carrito SET cantidad = cantidad + $1 WHERE id_usuario = $2 AND id_producto = $3 RETURNING *',
        [cantidad, req.user.id, id_producto]
      );
      return res.json({ message: 'Producto actualizado en el carrito', producto: updatedProduct.rows[0] });
    }

    // Si no existe, insertar un nuevo registro
    const result = await pool.query(
      'INSERT INTO carrito (id_usuario, id_producto, cantidad) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, id_producto, cantidad]
    );
    res.status(201).json({ message: 'Producto agregado al carrito', producto: result.rows[0] });
  } catch (err) {
    console.error('Error al agregar al carrito:', err.message);
    res.status(500).json({ message: 'Error de base de datos', error: err.message });
  }
});

// **Actualizar cantidad de un producto en el carrito**
app.put('/carrito/:id', authenticateJWT, async (req, res) => {
  if (req.user.rol !== 'usuario') {
    return res.status(403).json({ message: 'Acceso denegado: solo usuarios pueden actualizar productos en su carrito' });
  }

  const { id } = req.params;
  const { cantidad } = req.body;

  // Validación de la cantidad
  if (!cantidad || typeof cantidad !== 'number' || cantidad < 1) {
    return res.status(400).json({ message: 'Cantidad inválida. Debe ser un número entero mayor o igual a 1' });
  }

  try {
    // Consulta para actualizar la cantidad
    const result = await pool.query(
      'UPDATE carrito SET cantidad = $1 WHERE id = $2 AND id_usuario = $3 RETURNING *',
      [cantidad, id, req.user.id]
    );

    // Validación de que el producto existe en el carrito del usuario
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Producto no encontrado en el carrito del usuario' });
    }

    // Respuesta exitosa
    res.json({ message: 'Cantidad actualizada', producto: result.rows[0] });
  } catch (err) {
    console.error('Error al actualizar el carrito:', err.message);

    // Manejo de errores de base de datos
    res.status(500).json({ message: 'Error de base de datos', error: err.message });
  }
});

// **Eliminar productos del carrito**
app.delete('/carrito/:id', authenticateJWT, async (req, res) => {
  if (req.user.rol !== 'usuario') {
    return res.status(403).json({ message: 'Acceso denegado: solo usuarios pueden eliminar productos de su carrito' });
  }

  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM carrito WHERE id = $1 AND id_usuario = $2 RETURNING *', [id, req.user.id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Producto no encontrado en el carrito del usuario' });
    }

    res.json({ message: 'Producto eliminado del carrito', producto: result.rows[0] });
  } catch (err) {
    console.error('Error al eliminar del carrito:', err.message);
    res.status(500).json({ message: 'Error de base de datos', error: err.message });
  }
});

// Iniciar el servidor en el puerto 3002
app.listen(3002, () => {
  console.log('API de carrito de compras escuchando en puerto 3002');
});
