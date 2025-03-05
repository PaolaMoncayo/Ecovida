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

// Middleware para validar JWT
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

// **Ruta raíz para pruebas**
app.get('/', (req, res) => {
  res.send('API de carrito de compras está funcionando');
});

// **Obtener el carrito del usuario con detalles de productos**
// Obtener el carrito del usuario con detalles de productos
app.get('/carrito', authenticateJWT, async (req, res) => {
  try {
    if (req.user.rol !== 'usuario') {
      return res.status(403).json({ message: 'Acceso denegado: solo los usuarios pueden tener un carrito' });
    }

    const result = await pool.query(
      `SELECT c.id_usuario, c.id_producto, c.cantidad, 
              p.nombre, p.precio, p.stock_disponible, p.imagen_url 
       FROM carrito c
       JOIN productos p ON c.id_producto = p.id_producto
       WHERE c.id_usuario = $1`,
      [req.user.id]
    );

    // Si no hay artículos, retornar un array vacío con status 200
    return res.json({ message: 'Carrito obtenido con éxito', carrito: result.rows });
  } catch (error) {
    console.error('Error al obtener el carrito:', error.message);
    res.status(500).json({ message: 'Error al obtener el carrito', error: error.message });
  }
});


// **Agregar productos al carrito con actualización si ya existe**
app.post('/carrito', authenticateJWT, async (req, res) => {
  if (req.user.rol !== 'usuario') {
    return res.status(403).json({ message: 'Acceso denegado: solo usuarios pueden agregar productos a su carrito' });
  }

  const { id_producto, cantidad } = req.body;

  if (!id_producto || !cantidad || typeof cantidad !== 'number' || cantidad < 1) {
    return res.status(400).json({ message: 'Datos inválidos: ID de producto y cantidad deben ser válidos' });
  }

  try {
    // 1️⃣ Verificar si el producto existe y tiene stock suficiente
    const productResult = await pool.query(
      'SELECT stock_disponible FROM productos WHERE id_producto = $1',
      [id_producto]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    const stockDisponible = productResult.rows[0].stock_disponible;

    if (stockDisponible < cantidad) {
      return res.status(400).json({ message: 'Stock insuficiente para agregar este producto al carrito' });
    }

    // 2️⃣ Verificar si el producto ya está en el carrito del usuario
    const existingProduct = await pool.query(
      'SELECT cantidad FROM carrito WHERE id_usuario = $1 AND id_producto = $2',
      [req.user.id, id_producto]
    );

    if (existingProduct.rows.length > 0) {
      // 3️⃣ Si el producto ya está en el carrito, actualizar la cantidad
      const cantidadNueva = existingProduct.rows[0].cantidad + cantidad;

      // Verificar si la cantidad nueva supera el stock disponible
      if (cantidadNueva > stockDisponible) {
        return res.status(400).json({ message: 'No se puede agregar más productos, stock insuficiente' });
      }

      const updatedProduct = await pool.query(
        'UPDATE carrito SET cantidad = $1 WHERE id_usuario = $2 AND id_producto = $3 RETURNING *',
        [cantidadNueva, req.user.id, id_producto]
      );

      // Restar la cantidad agregada del stock disponible
      await pool.query(
        'UPDATE productos SET stock_disponible = stock_disponible - $1 WHERE id_producto = $2',
        [cantidad, id_producto]
      );

      return res.json({ message: 'Producto actualizado en el carrito', producto: updatedProduct.rows[0] });
    }

    // 4️⃣ Si el producto no estaba en el carrito, agregarlo
    const result = await pool.query(
      'INSERT INTO carrito (id_usuario, id_producto, cantidad) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, id_producto, cantidad]
    );

    // Restar la cantidad comprada del stock disponible
    await pool.query(
      'UPDATE productos SET stock_disponible = stock_disponible - $1 WHERE id_producto = $2',
      [cantidad, id_producto]
    );

    res.status(201).json({ message: 'Producto agregado al carrito', producto: result.rows[0] });
  } catch (err) {
    console.error('Error al agregar al carrito:', err.message);
    res.status(500).json({ message: 'Error de base de datos', error: err.message });
  }
});

// ACTUALIZAR PRODUCTO EN EL CARRITO (SUMANDO CANTIDAD)
app.put('/carrito/:id_producto', authenticateJWT, async (req, res) => {
  if (req.user.rol !== 'usuario') {
    return res.status(403).json({ message: 'Acceso denegado: solo usuarios pueden modificar su carrito' });
  }

  const { id_producto } = req.params;
  const { cantidad } = req.body;

  if (!cantidad || typeof cantidad !== 'number' || cantidad < 1) {
    return res.status(400).json({ message: 'Cantidad inválida. Debe ser un número mayor o igual a 1' });
  }

  try {
    // 1️⃣ Verificar si el producto está en el carrito
    const carritoResult = await pool.query(
      'SELECT cantidad FROM carrito WHERE id_usuario = $1 AND id_producto = $2',
      [req.user.id, id_producto]
    );

    const cantidadActual = carritoResult.rows.length > 0 ? carritoResult.rows[0].cantidad : 0;

    // 2️⃣ Verificar stock disponible
    const productResult = await pool.query(
      'SELECT stock_disponible FROM productos WHERE id_producto = $1',
      [id_producto]
    );

    if (productResult.rowCount === 0) {
      return res.status(404).json({ message: 'Producto no encontrado en la base de datos' });
    }

    const stockDisponible = productResult.rows[0].stock_disponible;

    // 3️⃣ Verificar si hay suficiente stock para el incremento
    if (cantidadActual + cantidad > stockDisponible + cantidadActual) {
      return res.status(400).json({ message: 'No se puede agregar más productos, stock insuficiente' });
    }

    let updateCarrito;

    if (cantidadActual > 0) {
      // 4️⃣ Si el producto ya está en el carrito, actualizar la cantidad
      updateCarrito = await pool.query(
        'UPDATE carrito SET cantidad = cantidad + $1 WHERE id_usuario = $2 AND id_producto = $3 RETURNING *',
        [cantidad, req.user.id, id_producto]
      );
    } else {
      // 5️⃣ Si el producto no estaba en el carrito, insertarlo
      updateCarrito = await pool.query(
        'INSERT INTO carrito (id_usuario, id_producto, cantidad) VALUES ($1, $2, $3) RETURNING *',
        [req.user.id, id_producto, cantidad]
      );
    }

    // 6️⃣ Ajustar stock en la tabla de productos
    await pool.query(
      'UPDATE productos SET stock_disponible = stock_disponible - $1 WHERE id_producto = $2',
      [cantidad, id_producto]
    );

    res.json({ message: 'Cantidad incrementada en el carrito', producto: updateCarrito.rows[0] });
  } catch (err) {
    console.error('Error al actualizar cantidad:', err.message);
    res.status(500).json({ message: 'Error de base de datos', error: err.message });
  }
});




// **Eliminar un producto del carrito y restaurar stock**
app.delete('/carrito/:id_producto', authenticateJWT, async (req, res) => {
  if (req.user.rol !== 'usuario') {
    return res.status(403).json({ message: 'Acceso denegado: solo usuarios pueden eliminar productos de su carrito' });
  }

  const { id_producto } = req.params;

  try {
    // Obtener la cantidad del producto en el carrito antes de eliminarlo
    const productResult = await pool.query(
      'SELECT cantidad FROM carrito WHERE id_usuario = $1 AND id_producto = $2',
      [req.user.id, id_producto]
    );

    if (productResult.rowCount === 0) {
      return res.status(404).json({ message: 'Producto no encontrado en el carrito' });
    }

    const cantidad = productResult.rows[0].cantidad;

    // Eliminar el producto del carrito
    const result = await pool.query(
      'DELETE FROM carrito WHERE id_usuario = $1 AND id_producto = $2 RETURNING *',
      [req.user.id, id_producto]
    );

    // Restaurar el stock en la tabla de productos
    await pool.query(
      'UPDATE productos SET stock_disponible = stock_disponible + $1 WHERE id_producto = $2',
      [cantidad, id_producto]
    );

    res.json({ message: 'Producto eliminado del carrito y stock restaurado', producto: result.rows[0] });
  } catch (err) {
    console.error('Error al eliminar del carrito:', err.message);
    res.status(500).json({ message: 'Error de base de datos', error: err.message });
  }
});


// Iniciar el servidor en el puerto 3002
app.listen(3002, () => {
  console.log('API de carrito de compras escuchando en puerto 3002');
});
