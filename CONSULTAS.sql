CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,       -- Identificador único del usuario
    nombre VARCHAR(100) NOT NULL,        -- Nombre del usuario
    email VARCHAR(100) UNIQUE NOT NULL,  -- Email del usuario (debe ser único)
    password VARCHAR(255) NOT NULL,      -- Contraseña encriptada
    perfil VARCHAR(50) DEFAULT 'usuario',-- Perfil del usuario (usuario/admin)
    creado_en TIMESTAMP DEFAULT NOW()    -- Fecha de creación
);
-----------------------------------------------------------------

CREATE TABLE productos ( 
  id_producto SERIAL PRIMARY KEY, 
  nombre VARCHAR(100), 
  descripcion TEXT, 
  precio DECIMAL(10, 2), 
  categoria VARCHAR(50), 
  stock_disponible INT NOT NULL DEFAULT 0, 
  creado_en TIMESTAMP DEFAULT NOW()  -- Fecha de creación
);

INSERT INTO productos (nombre, descripcion, precio, categoria, stock_disponible) VALUES 
('Producto 1', 'Descripción del producto 1', 10.50, 'Categoría A', 3), 
('Producto 2', 'Descripción del producto 2', 15.75, 'Categoría B', 3), 
('Producto 3', 'Descripción del producto 3', 20.00, 'Categoría A', 3);


---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS carrito (
  id_usuario INT NOT NULL, 
  id_producto INT NOT NULL, 
  cantidad INT NOT NULL DEFAULT 1, 
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_usuario, id_producto),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE CASCADE
);

-----------------------------------------------------------

CREATE TABLE pedidos ( 
  id_pedido SERIAL PRIMARY KEY, 
  id_usuario INT NOT NULL, 
  total DECIMAL(10, 2) NOT NULL, 
  direccion_entrega VARCHAR(255) NOT NULL,
  estado VARCHAR(50) NOT NULL DEFAULT 'Pendiente', 
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) 
);

--------------------------------------------------------------
CREATE TABLE detalle_pedido (
  id_detalle SERIAL PRIMARY KEY, 
  id_pedido INT NOT NULL, 
  id_producto INT NOT NULL, 
  cantidad INT NOT NULL, 
  precio_unitario DECIMAL(10,2) NOT NULL, 
  FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
  FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
);

------------------------------------------------------------------

CREATE TABLE envios (
  id_envio SERIAL PRIMARY KEY,
  id_pedido INT NOT NULL UNIQUE,
  estado VARCHAR(50) NOT NULL DEFAULT 'Pendiente',
  direccion_entrega VARCHAR(255) NOT NULL,
  fecha_envio TIMESTAMP DEFAULT NULL,
  fecha_entrega TIMESTAMP DEFAULT NULL,
  FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido) ON DELETE CASCADE
);

--------------------------------------------------------------------

SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'productos';

SELECT id_producto, cantidad FROM detalle_pedido WHERE id_pedido = $1;
SELECT * FROM carrito WHERE id_usuario = 3;


SELECT * FROM usuarios;
SELECT * FROM carrito;
SELECT * FROM productos;
SELECT * FROM pedidos;
SELECT * FROM detalle_pedido;
SELECT * FROM envios;

DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS pedidos;
DROP TABLE IF EXISTS detalle_pedido;
DROP TABLE IF EXISTS carrito;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS envios;

DELETE FROM carrito;
DELETE FROM productos;
DELETE FROM pedidos;
DELETE FROM detalle_pedido;
DELETE FROM envios;




SELECT * FROM carrito WHERE id_usuario = 4;

SELECT * FROM carrito
WHERE id_usuario = $1 AND id_producto = $2;


ALTER TABLE carrito ADD CONSTRAINT unique_usuario_producto UNIQUE (id_usuario, id_producto);

INSERT INTO carrito (id_usuario, id_producto, cantidad) VALUES (4, 1, 2); 
INSERT INTO carrito (usuario_id, producto_id, cantidad) VALUES (1, 102, 1); 
INSERT INTO carrito (usuario_id, producto_id, cantidad) VALUES (2, 103, 5);


 





CREATE TABLE envios ( 
  id SERIAL PRIMARY KEY, 
  id_pedido INT NOT NULL, 
  estado VARCHAR(50) NOT NULL, 
  direccion_entrega VARCHAR(255) NOT NULL, 
  fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
  fecha_entrega_estimada TIMESTAMP, 
  fecha_entrega REAL DEFAULT NULL 
); 


INSERT INTO envios (id_pedido, estado, direccion_entrega, fecha_entrega_estimada) 
VALUES  
(1, 'En preparación', 'Calle Falsa 123, Springfield', '2024-12-10 14:00:00'), 
(2, 'En tránsito', 'Av. Principal 45, Quito', '2024-12-09 12:00:00'), 
(3, 'Entregado', 'Calle Secundaria 789, Guayaquil', '2024-12-05 10:00:00'), 
(4, 'Cancelado', 'Av. Interoceánica 111, Cuenca', '2024-12-07 15:00:00'); 



