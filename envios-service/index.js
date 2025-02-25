const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken'); // Importamos JWT para autenticar

dotenv.config();

const app = express();
app.use(express.json()); // Para parsear el body en formato JSON

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});

// Función para verificar el token JWT (solo para endpoints que lo necesiten)
const verificarToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(403).send('Acceso denegado, token no proporcionado');
  }

  // Verificamos el token JWT usando la clave secreta del JWT que está en el .env
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send('Token inválido');
    }
    req.user = decoded; // Almacenamos la información del usuario en la request
    next(); // Llamamos al siguiente middleware o ruta
  });
};

// Ruta raíz para pruebas
app.get('/', (req, res) => {
  res.send('API de envíos está funcionando');
});

// **Endpoint para obtener todos los envíos** (acceso público)
app.get('/envios', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM envios');
    res.json(result.rows);
  } catch (err) {
    console.error('Error de base de datos:', err);
    res.status(500).send('Error de base de datos');
  }
});

// **Endpoint para crear un envío** (solo accesible por admin)
app.post('/envios', verificarToken, async (req, res) => {
  const { nombre, destino } = req.body;
  if (req.user.rol !== 'admin') {
    return res.status(403).send('Acceso denegado, solo administradores pueden crear envíos');
  }

  try {
    const result = await pool.query(
      'INSERT INTO envios (nombre, destino) VALUES ($1, $2) RETURNING *',
      [nombre, destino]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error de base de datos:', err);
    res.status(500).send('Error de base de datos');
  }
});

// **Endpoint para actualizar un envío** (solo accesible por admin)
app.put('/envios/:id', verificarToken, async (req, res) => {
  const { nombre, destino } = req.body;
  const { id } = req.params;

  if (req.user.rol !== 'admin') {
    return res.status(403).send('Acceso denegado, solo administradores pueden actualizar envíos');
  }

  try {
    const result = await pool.query(
      'UPDATE envios SET nombre = $1, destino = $2 WHERE id = $3 RETURNING *',
      [nombre, destino, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).send('Envío no encontrado');
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error de base de datos:', err);
    res.status(500).send('Error de base de datos');
  }
});

// **Endpoint para eliminar un envío** (solo accesible por admin)
app.delete('/envios/:id', verificarToken, async (req, res) => {
  const { id } = req.params;

  if (req.user.rol !== 'admin') {
    return res.status(403).send('Acceso denegado, solo administradores pueden eliminar envíos');
  }

  try {
    const result = await pool.query(
      'DELETE FROM envios WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).send('Envío no encontrado');
    }
    res.json({ message: 'Envío eliminado correctamente' });
  } catch (err) {
    console.error('Error de base de datos:', err);
    res.status(500).send('Error de base de datos');
  }
});

// Iniciamos el servidor en el puerto 3004
app.listen(3004, () => {
  console.log('API de envíos escuchando en el puerto 3004');
});
