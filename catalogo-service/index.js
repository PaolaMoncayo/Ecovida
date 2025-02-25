const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const argon2 = require('argon2');
const validator = require('validator');
const sanitizeHtml = require('sanitize-html');

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

// **Ruta raíz para pruebas**
app.get('/', (req, res) => {
  res.send('API de catálogo está funcionando');
});

// **Ver todos los productos o un producto por ID con paginación y filtros**
app.get('/productos/:id?', async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10, nombre, categoria, precio_min, precio_max } = req.query;

  // Si se proporciona un ID, busca un producto específico
  if (id) {
    try {
      const result = await pool.query('SELECT * FROM productos WHERE id_producto = $1', [id]);

      if (result.rowCount === 0) {
        return res.status(404).json({ message: 'Producto no encontrado' });
      }

      return res.json(result.rows[0]);
    } catch (err) {
      console.error('Error al obtener el producto:', err.message);
      return res.status(500).json({ message: 'Error de base de datos', error: err.message });
    }
  }

  // Si no hay ID, busca todos los productos con filtros y paginación
  const offset = (page - 1) * limit;
  const filters = [];
  const values = [];

  if (nombre) {
    filters.push('LOWER(nombre) LIKE $' + (filters.length + 1));
    values.push(`%${nombre.toLowerCase()}%`);
  }
  if (categoria) {
    filters.push('LOWER(categoria) = $' + (filters.length + 1));
    values.push(categoria.toLowerCase());
  }
  if (precio_min) {
    filters.push('precio >= $' + (filters.length + 1));
    values.push(precio_min);
  }
  if (precio_max) {
    filters.push('precio <= $' + (filters.length + 1));
    values.push(precio_max);
  }

  try {
    const query = `
      SELECT * FROM productos
      ${filters.length > 0 ? 'WHERE ' + filters.join(' AND ') : ''}
      LIMIT $${filters.length + 1} OFFSET $${filters.length + 2}
    `;
    values.push(parseInt(limit), offset);

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener productos:', err.message);
    res.status(500).json({ message: 'Error de base de datos', error: err.message });
  }
});


// **Crear producto** (Solo administradores)
app.post('/productos', authenticateJWT, async (req, res) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado: solo los administradores pueden crear productos' });
  }

  let { nombre, descripcion, precio, categoria } = req.body;

  if (!nombre || !descripcion || !precio || !categoria) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  nombre = sanitizeHtml(validator.escape(nombre));
  descripcion = sanitizeHtml(validator.escape(descripcion));
  categoria = sanitizeHtml(validator.escape(categoria));

  if (!validator.isFloat(precio.toString(), { min: 0 })) {
    return res.status(400).json({ message: 'El precio debe ser un número positivo' });
  }

  try {
    const productoExiste = await pool.query(
      'SELECT * FROM productos WHERE nombre = $1 AND categoria = $2',
      [nombre, categoria]
    );
    if (productoExiste.rowCount > 0) {
      return res.status(400).json({ message: 'El producto ya existe en esta categoría' });
    }

    const result = await pool.query(
      'INSERT INTO productos (nombre, descripcion, precio, categoria, creado_por) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [nombre, descripcion, precio, categoria, req.user.id]
    );
    res.status(201).json({ message: 'Producto creado', producto: result.rows[0] });
  } catch (err) {
    console.error('Error al crear producto:', err.message);
    res.status(500).json({ message: 'Error de base de datos', error: err.message });
  }
});

// **Actualizar producto** (Solo administradores)
app.put('/productos/:id', authenticateJWT, async (req, res) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado: solo los administradores pueden actualizar productos' });
  }

  const { id } = req.params;
  let { nombre, descripcion, precio, categoria } = req.body;

  if (!nombre && !descripcion && !precio && !categoria) {
    return res.status(400).json({ message: 'Se debe proporcionar al menos un campo para actualizar' });
  }

  const updates = [];
  const values = [];

  if (nombre) {
    updates.push('nombre = $' + (updates.length + 1));
    values.push(sanitizeHtml(validator.escape(nombre)));
  }
  if (descripcion) {
    updates.push('descripcion = $' + (updates.length + 1));
    values.push(sanitizeHtml(validator.escape(descripcion)));
  }
  if (precio) {
    if (!validator.isFloat(precio.toString(), { min: 0 })) {
      return res.status(400).json({ message: 'El precio debe ser un número positivo' });
    }
    updates.push('precio = $' + (updates.length + 1));
    values.push(precio);
  }
  if (categoria) {
    updates.push('categoria = $' + (updates.length + 1));
    values.push(sanitizeHtml(validator.escape(categoria)));
  }

  try {
    const query = `
      UPDATE productos
      SET ${updates.join(', ')}
      WHERE id_producto = $${updates.length + 1}
      RETURNING *
    `;
    values.push(id);

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json({ message: 'Producto actualizado', producto: result.rows[0] });
  } catch (err) {
    console.error('Error al actualizar producto:', err.message);
    res.status(500).json({ message: 'Error de base de datos', error: err.message });
  }
});

// **Eliminar producto** (Solo administradores)
app.delete('/productos/:id', authenticateJWT, async (req, res) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado: solo los administradores pueden eliminar productos' });
  }

  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM productos WHERE id_producto = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json({ message: 'Producto eliminado', producto: result.rows[0] });
  } catch (err) {
    console.error('Error al eliminar producto:', err.message);
    res.status(500).json({ message: 'Error de base de datos', error: err.message });
  }
});

// Iniciar el servidor en el puerto 3001
app.listen(3001, () => {
  console.log('API de catálogo escuchando en puerto 3001');
});
