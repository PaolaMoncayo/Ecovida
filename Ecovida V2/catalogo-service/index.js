const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const sanitizeHtml = require('sanitize-html');
const multer = require('multer');
const path = require('path');

dotenv.config();

const app = express();
app.use(express.json());

// 📌 **Configuración de Multer para subir imágenes**
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Carpeta donde se guardarán las imágenes
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Nombre único con la extensión original
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen'), false);
  }
};

const upload = multer({ storage, fileFilter });

// 📌 **Configurar conexión a PostgreSQL**
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});

// 📌 **Middleware para validar JWT**
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token inválido o expirado' });
  }
};

// 📌 **Hacer accesibles las imágenes**
app.use('/uploads', express.static('uploads'));

// 📌 **Ruta raíz para pruebas**
app.get('/', (req, res) => {
  res.send('API de catálogo está funcionando');
});

// 📌 **Ver productos con filtros**
app.get('/productos/:id?', async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10, nombre, categoria, precio_min, precio_max } = req.query;
  const offset = (page - 1) * limit;
  const filters = [];
  const values = [];

  if (id) {
    try {
      const result = await pool.query('SELECT * FROM productos WHERE id_producto = $1', [id]);

      if (result.rowCount === 0) {
        return res.status(404).json({ message: 'Producto no encontrado' });
      }
      return res.json(result.rows[0]);
    } catch (err) {
      console.error('Error al obtener el producto:', err.message);
      return res.status(500).json({ message: 'Error de base de datos' });
    }
  }

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
    res.status(500).json({ message: 'Error de base de datos' });
  }
});

// 📌 **Crear producto con imagen**
app.post('/productos', authenticateJWT, upload.single('imagen'), async (req, res) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }

  let { nombre, descripcion, precio, categoria, stock_disponible } = req.body;
  const imagen_url = req.file ? `/uploads/${req.file.filename}` : null;

  if (!nombre || !descripcion || !precio || !categoria || stock_disponible === undefined) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO productos (nombre, descripcion, precio, categoria, stock_disponible, imagen_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [nombre, descripcion, precio, categoria, stock_disponible, imagen_url]
    );

    res.status(201).json({ message: 'Producto creado', producto: result.rows[0] });
  } catch (err) {
    console.error('Error al crear producto:', err.message);
    res.status(500).json({ message: 'Error de base de datos' });
  }
});

// 📌 **Actualizar producto**
app.put('/productos/:id', authenticateJWT, upload.single('imagen'), async (req, res) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }

  const { id } = req.params;
  let { nombre, descripcion, precio, categoria, stock_disponible } = req.body;
  const imagen_url = req.file ? `/uploads/${req.file.filename}` : null; 

  const updates = [];
  const values = [];

  if (nombre) updates.push(`nombre = $${values.push(nombre)}`);
  if (descripcion) updates.push(`descripcion = $${values.push(descripcion)}`);
  if (precio) updates.push(`precio = $${values.push(precio)}`);
  if (categoria) updates.push(`categoria = $${values.push(categoria)}`);
  if (stock_disponible !== undefined) updates.push(`stock_disponible = $${values.push(stock_disponible)}`);
  if (imagen_url) updates.push(`imagen_url = $${values.push(imagen_url)}`);

  try {
    const query = `UPDATE productos SET ${updates.join(', ')} WHERE id_producto = $${values.push(id)} RETURNING *`;
    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json({ message: 'Producto actualizado', producto: result.rows[0] });
  } catch (err) {
    console.error('Error al actualizar producto:', err.message);
    res.status(500).json({ message: 'Error de base de datos' });
  }
});

// 📌 **Iniciar servidor**
app.listen(3001, () => {
  console.log('API de catálogo escuchando en puerto 3001');
});
