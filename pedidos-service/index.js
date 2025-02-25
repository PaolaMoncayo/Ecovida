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

// Middleware para verificar el token JWT
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(403).send({ message: 'Token requerido' });
  }

  try {
    const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
    req.user = decoded; // Guardar información del usuario en req.user
    next();
  } catch (err) {
    res.status(401).send({ message: 'Token inválido' });
  }
};

// Función para verificar permisos según el rol del usuario
const isAdmin = (req) => req.user.rol === 'admin';

// *Endpoint: Obtener pedidos*
app.get('/pedidos', verifyToken, async (req, res) => {
  const { id_usuario } = req.query;

  try {
    if (isAdmin(req)) {
      // Admin: Puede ver todos los pedidos o filtrar por usuario
      const query = id_usuario
        ? 'SELECT * FROM pedidos WHERE id_usuario = $1 ORDER BY creado_en DESC'
        : 'SELECT * FROM pedidos ORDER BY creado_en DESC';
      const params = id_usuario ? [id_usuario] : [];
      const result = await pool.query(query, params);
      return res.json(result.rows);
    }

    // Usuario: Solo puede ver sus propios pedidos
    const result = await pool.query(
      'SELECT * FROM pedidos WHERE id_usuario = $1 ORDER BY creado_en DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener pedidos:', err.message);
    res.status(500).send({ message: 'Error de base de datos' });
  }
});

// *Endpoint: Crear un pedido*
app.post('/pedidos', verifyToken, async (req, res) => {
  const { id_usuario, total } = req.body;

  // Validar permisos: Admin puede crear pedidos para cualquier usuario, Usuario solo para sí mismo
  if (!isAdmin(req) && req.user.id !== parseInt(id_usuario)) {
    return res.status(403).send({ message: 'No tienes permisos para crear este pedido' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO pedidos (id_usuario, total, estado) VALUES ($1, $2, $3) RETURNING *',
      [id_usuario, total, 'Pendiente']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al crear el pedido:', err.message);
    res.status(500).send({ message: 'Error de base de datos' });
  }
});

// *Endpoint: Actualizar estado de un pedido*
app.put('/pedidos/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  try {
    const pedidoResult = await pool.query(
      'SELECT * FROM pedidos WHERE id_pedido = $1',
      [id]
    );

    if (pedidoResult.rows.length === 0) {
      return res.status(404).send({ message: 'Pedido no encontrado' });
    }

    const pedido = pedidoResult.rows[0];

    // Validar permisos: Admin puede actualizar cualquier pedido, Usuario solo los propios y si están "Pendientes"
    if (!isAdmin(req) && (req.user.id !== pedido.id_usuario || pedido.estado !== 'Pendiente')) {
      return res.status(403).send({ message: 'No tienes permisos para actualizar este pedido' });
    }

    await pool.query(
      'UPDATE pedidos SET estado = $1 WHERE id_pedido = $2',
      [estado, id]
    );
    res.send({ message: 'Estado del pedido actualizado' });
  } catch (err) {
    console.error('Error al actualizar pedido:', err.message);
    res.status(500).send({ message: 'Error de base de datos' });
  }
});

// *Endpoint: Eliminar un pedido*
app.delete('/pedidos/:id', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const pedidoResult = await pool.query(
      'SELECT * FROM pedidos WHERE id_pedido = $1',
      [id]
    );

    if (pedidoResult.rows.length === 0) {
      return res.status(404).send({ message: 'Pedido no encontrado' });
    }

    const pedido = pedidoResult.rows[0];

    // Validar permisos: Admin puede eliminar cualquier pedido, Usuario solo los propios y si están "Pendientes"
    if (!isAdmin(req) && (req.user.id !== pedido.id_usuario || pedido.estado !== 'Pendiente')) {
      return res.status(403).send({ message: 'No tienes permisos para eliminar este pedido' });
    }

    await pool.query('DELETE FROM pedidos WHERE id_pedido = $1', [id]);
    res.send({ message: 'Pedido eliminado' });
  } catch (err) {
    console.error('Error al eliminar pedido:', err.message);
    res.status(500).send({ message: 'Error de base de datos' });
  }
});

// *Ruta raíz para pruebas*
app.get('/', (req, res) => {
  res.send('API de pedidos funcionando');
});

// Iniciar el servidor
app.listen(3003, () => {
  console.log('API de pedidos escuchando en el puerto 3003');
});