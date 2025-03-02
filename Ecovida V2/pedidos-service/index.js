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
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).send({ message: 'Token inválido' });
  }
};

// Función para verificar si el usuario es administrador
const isAdmin = (req) => req.user.rol === 'admin';

// **Obtener pedidos (usuario ve sus pedidos, admin ve todos)**
// **Obtener pedidos con sus productos**
app.get('/pedidos', verifyToken, async (req, res) => {
  try {
    const queryPedidos = isAdmin(req)
      ? 'SELECT * FROM pedidos ORDER BY creado_en DESC'
      : 'SELECT * FROM pedidos WHERE id_usuario = $1 ORDER BY creado_en DESC';
    const values = isAdmin(req) ? [] : [req.user.id];
    
    // Obtener pedidos del usuario o de todos los usuarios si es admin
    const pedidosResult = await pool.query(queryPedidos, values);
    const pedidos = pedidosResult.rows;

    if (pedidos.length === 0) {
      return res.status(404).json({ message: 'No se encontraron pedidos' });
    }

    // Obtener los productos de cada pedido
    for (let pedido of pedidos) {
      const productosResult = await pool.query(
        `SELECT dp.id_producto, p.nombre, dp.cantidad, dp.precio_unitario
         FROM detalle_pedido dp
         JOIN productos p ON dp.id_producto = p.id_producto
         WHERE dp.id_pedido = $1`,
        [pedido.id_pedido]
      );

      pedido.productos = productosResult.rows; // Agregar los productos al pedido
    }

    res.json(pedidos);
  } catch (err) {
    console.error('Error al obtener pedidos:', err.message);
    res.status(500).send({ message: 'Error de base de datos' });
  }
});


// **Crear un pedido desde el carrito**
app.post('/pedidos', verifyToken, async (req, res) => {
  try {
    const { direccion_entrega } = req.body; // Obtener dirección desde el cuerpo de la solicitud

    if (!direccion_entrega || direccion_entrega.trim() === "") {
      return res.status(400).json({ message: 'La dirección de entrega es obligatoria' });
    }

    const carrito = await pool.query(
      'SELECT id_producto, cantidad FROM carrito WHERE id_usuario = $1',
      [req.user.id]
    );
    
    if (carrito.rows.length === 0) {
      return res.status(400).json({ message: 'El carrito está vacío' });
    }

    let total = 0;
    for (const item of carrito.rows) {
      const producto = await pool.query(
        'SELECT precio FROM productos WHERE id_producto = $1',
        [item.id_producto]
      );
      total += producto.rows[0].precio * item.cantidad;
    }

    // Insertar el pedido con la dirección de entrega
    const pedido = await pool.query(
      'INSERT INTO pedidos (id_usuario, total, direccion_entrega) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, total, direccion_entrega]
    );

    for (const item of carrito.rows) {
      await pool.query(
        'INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario) VALUES ($1, $2, $3, (SELECT precio FROM productos WHERE id_producto = $2))',
        [pedido.rows[0].id_pedido, item.id_producto, item.cantidad]
      );
    }

    // Vaciar el carrito del usuario después de realizar el pedido
    await pool.query('DELETE FROM carrito WHERE id_usuario = $1', [req.user.id]);

    res.status(201).json({ message: 'Pedido creado con éxito', pedido: pedido.rows[0] });

  } catch (err) {
    console.error('Error al crear pedido:', err.message);
    res.status(500).send({ message: 'Error de base de datos' });
  }
});


// **Actualizar estado del pedido**
// **Actualizar estado del pedido o dirección de entrega**
app.put('/pedidos/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { estado, direccion_entrega } = req.body;

  // Definir las transiciones de estado permitidas
  const transicionesValidas = {
    "Pendiente": ["Procesando", "Cancelado"], 
    "Procesando": ["Enviado"], 
    "Enviado": ["Entregado"], 
    "Entregado": [],  
    "Cancelado": []   
  };

  try {
    const pedido = await pool.query('SELECT * FROM pedidos WHERE id_pedido = $1', [id]);

    if (pedido.rows.length === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    const pedidoActual = pedido.rows[0];

    // 🚀 **Si el pedido ya está en "Cancelado" o "Entregado", no permitir cambios**
    if (pedidoActual.estado === 'Cancelado' || pedidoActual.estado === 'Entregado') {
      return res.status(400).json({ message: `Este pedido ya está en estado ${pedidoActual.estado} y no puede ser modificado.` });
    }

    // 🚀 **Si el usuario NO es admin, solo puede modificar la dirección o cancelar el pedido**
    if (!isAdmin(req)) {
      if (estado && pedidoActual.estado !== 'Pendiente') {
        return res.status(400).json({ message: 'Solo puedes cancelar pedidos en estado Pendiente' });
      }
      if (estado && estado !== 'Cancelado') {
        return res.status(403).json({ message: 'No tienes permisos para cambiar a este estado' });
      }

      // Si el usuario quiere actualizar la dirección de entrega
      if (direccion_entrega) {
        await pool.query(
          'UPDATE pedidos SET direccion_entrega = $1 WHERE id_pedido = $2',
          [direccion_entrega, id]
        );
        return res.json({ message: 'Dirección de entrega actualizada correctamente' });
      }

      // Si el usuario quiere cancelar el pedido
      if (estado === 'Cancelado') {
        const productos = await pool.query(
          'SELECT id_producto, cantidad FROM detalle_pedido WHERE id_pedido = $1', 
          [id]
        );

        for (const item of productos.rows) {
          await pool.query(
            `INSERT INTO carrito (id_usuario, id_producto, cantidad) 
             VALUES ($1, $2, $3)
             ON CONFLICT (id_usuario, id_producto) 
             DO UPDATE SET cantidad = carrito.cantidad + EXCLUDED.cantidad`,
            [pedidoActual.id_usuario, item.id_producto, item.cantidad]
          );
        }

        await pool.query('UPDATE pedidos SET estado = $1 WHERE id_pedido = $2', ['Cancelado', id]);
        return res.json({ message: `Pedido ${id} cancelado y productos devueltos al carrito` });
      }
    }

    // 🚀 **Si el usuario ES admin, validar la transición de estado**
    if (isAdmin(req) && estado) {
      if (!transicionesValidas[pedidoActual.estado].includes(estado)) {
        return res.status(400).json({
          message: `No puedes cambiar directamente de ${pedidoActual.estado} a ${estado}. Sigue el flujo correcto: Pendiente → Procesando → Enviado → Entregado.`
        });
      }

      // 🚀 **Si el estado cambia a "Enviado", registrar automáticamente en `envios`**
      if (estado === "Enviado") {
        const envioExistente = await pool.query('SELECT * FROM envios WHERE id_pedido = $1', [id]);

        if (envioExistente.rows.length === 0) {
          await pool.query(
            'INSERT INTO envios (id_pedido, direccion_entrega, estado, fecha_envio) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
            [id, pedidoActual.direccion_entrega, "En tránsito"]
          );
        }
      }

      // 🚀 **Si el estado cambia a "Entregado", validar que el envío también esté en "Entregado"**
      if (estado === "Entregado") {
        const envio = await pool.query('SELECT * FROM envios WHERE id_pedido = $1', [id]);

        if (envio.rows.length === 0) {
          return res.status(400).json({ message: "No se encontró un envío asociado a este pedido." });
        }

        if (envio.rows[0].estado !== "Entregado") {
          return res.status(400).json({ message: "No puedes marcar el pedido como 'Entregado' hasta que el envío esté en 'Entregado'." });
        }

        // Si la validación pasa, actualizar el estado del pedido
        await pool.query('UPDATE pedidos SET estado = $1 WHERE id_pedido = $2', [estado, id]);
        return res.json({ message: `Estado del pedido actualizado a ${estado}` });
      }

      // Si no es "Entregado", simplemente actualizar el estado del pedido
      await pool.query('UPDATE pedidos SET estado = $1 WHERE id_pedido = $2', [estado, id]);
      return res.json({ message: `Estado del pedido actualizado a ${estado}` });
    }

    res.status(400).json({ message: 'No se realizó ninguna actualización' });

  } catch (err) {
    console.error('Error al actualizar pedido:', err.message);
    res.status(500).send({ message: 'Error de base de datos' });
  }
});


// **Eliminar un pedido (Solo Admin y si está "Pendiente" o "Cancelado")**
app.delete('/pedidos/:id', verifyToken, async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).send({ message: 'No tienes permisos para eliminar pedidos' });
  }

  const { id } = req.params;
  try {
    const pedido = await pool.query('SELECT estado FROM pedidos WHERE id_pedido = $1', [id]);

    if (pedido.rows.length === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    const estadoActual = pedido.rows[0].estado;

    if (estadoActual !== 'Pendiente' && estadoActual !== 'Cancelado') {
      return res.status(400).json({ message: 'Solo se pueden eliminar pedidos en estado Pendiente o Cancelado' });
    }

    await pool.query('DELETE FROM detalle_pedido WHERE id_pedido = $1', [id]);
    await pool.query('DELETE FROM pedidos WHERE id_pedido = $1', [id]);

    res.send({ message: `Pedido ${id} eliminado correctamente` });
  } catch (err) {
    console.error('Error al eliminar pedido:', err.message);
    res.status(500).send({ message: 'Error de base de datos' });
  }
});

// **Iniciar el servidor**
app.listen(3003, () => {
  console.log('API de pedidos escuchando en el puerto 3003');
});
