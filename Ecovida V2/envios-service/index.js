const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const cors = require('cors');
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});

// Middleware para verificar el token JWT
const verificarToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(403).json({ message: 'Acceso denegado, token no proporcionado' });
  }

  jwt.verify(token.split(' ')[1], process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token inválido' });
    }
    req.user = decoded;
    next();
  });
};

// Función para verificar si el usuario es admin
const esAdmin = (req) => req.user.rol === 'admin';

// **Obtener todos los envíos (Solo Admin)**
app.get('/envios', verificarToken, async (req, res) => {
  if (!esAdmin(req)) {
    return res.status(403).json({ message: 'Acceso denegado' });
  }

  try {
    const result = await pool.query('SELECT * FROM envios');
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener envíos:', err.message);
    res.status(500).json({ message: 'Error de base de datos' });
  }
});

// **Crear un envío automáticamente cuando el pedido cambia a "Enviado"**
app.post('/envios', verificarToken, async (req, res) => {
  if (!esAdmin(req)) {
    return res.status(403).json({ message: 'Acceso denegado' });
  }

  const { id_pedido } = req.body;

  try {
    // Verificar si el pedido está en "Enviado"
    const pedido = await pool.query('SELECT * FROM pedidos WHERE id_pedido = $1', [id_pedido]);

    if (pedido.rows.length === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    if (pedido.rows[0].estado !== 'Enviado') {
      return res.status(400).json({ message: 'El pedido no está en estado "Enviado". No se puede iniciar el envío.' });
    }

    // Insertar el envío con la fecha de envío actual
    const envio = await pool.query(
      'INSERT INTO envios (id_pedido, direccion_entrega) VALUES ($1, $2) RETURNING *',
      [id_pedido, pedido.rows[0].direccion_entrega]
    );

    res.status(201).json({ message: 'Envío registrado correctamente', envio: envio.rows[0] });
  } catch (err) {
    console.error('Error al registrar envío:', err.message);
    res.status(500).json({ message: 'Error de base de datos' });
  }
});

// **Actualizar estado del envío**
app.put('/envios/:id', verificarToken, async (req, res) => {
  if (!esAdmin(req)) {
    return res.status(403).json({ message: 'Acceso denegado' });
  }

  const { id } = req.params;
  const { estado } = req.body;
  const estadosPermitidos = ["En tránsito", "Entregado"];

  if (!estadosPermitidos.includes(estado)) {
    return res.status(400).json({ message: "Estado inválido. Solo se permite cambiar a 'En tránsito' o 'Entregado'." });
  }

  try {
    const envio = await pool.query('SELECT * FROM envios WHERE id_envio = $1', [id]);

    if (envio.rows.length === 0) {
      return res.status(404).json({ message: 'Envío no encontrado' });
    }

    const estadoActual = envio.rows[0].estado;

    // No permitir modificaciones si ya está en "Entregado"
    if (estadoActual === "Entregado") {
      return res.status(400).json({ message: "El envío ya ha sido entregado y no puede modificarse." });
    }

    // Si se actualiza a "Entregado", registrar la fecha de entrega
    if (estado === "Entregado") {
      await pool.query('UPDATE envios SET estado = $1, fecha_entrega = CURRENT_TIMESTAMP WHERE id_envio = $2', [estado, id]);
    } else {
      await pool.query('UPDATE envios SET estado = $1 WHERE id_envio = $2', [estado, id]);
    }

    res.json({ message: `Estado del envío actualizado a ${estado}` });
  } catch (err) {
    console.error('Error al actualizar el envío:', err.message);
    res.status(500).json({ message: 'Error de base de datos' });
  }
});

// **Iniciar el servidor**
app.listen(3004, () => {
  console.log('API de envíos escuchando en el puerto 3004');
});
