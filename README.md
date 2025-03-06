# EcoVida E-Commerce System

Bienvenido al repositorio del **Sistema de Comercio Electrónico de la Fundación EcoVida**, una plataforma diseñada para promover la venta de productos orgánicos y sostenibles. Este proyecto utiliza una arquitectura de microservicios con servicios web REST, un frontend en React y un backend en Node.js, orquestado con Docker y Kong como API Gateway.

---

## Descripción del Proyecto

La Fundación "EcoVida" busca apoyar a pequeños agricultores orgánicos y fomentar prácticas sostenibles. Este sistema permite:

- Gestionar un catálogo de productos orgánicos.
- Manejar carritos de compras y pedidos.
- Autenticar usuarios mediante JWT.
- Coordinar envíos y logística.
- Desplegar una interfaz de usuario amigable.

---

## Tecnologías Utilizadas

- Frontend: React
- Backend: Node.js, Express
- API Gateway: Kong
- Base de Datos: PostgreSQL
- Contenerización: Docker, Docker Compose
- Seguridad: JSON Web Tokens (JWT)
- Dependencias: `pg` (PostgreSQL), `cors`, `dotenv`, `jsonwebtoken`

---

## Arquitectura

El sistema está basado en una arquitectura de microservicios:

- **usuarios-service** (puerto 3000): Gestión de cuentas y autenticación.
- **catalogo-service** (puerto 3001): Catálogo de productos.
- **carrito-service** (puerto 3002): Manejo del carrito de compras.
- **pedidos-service** (puerto 3003): Procesamiento de pedidos.
- **envios-service** (puerto 3004): Logística y seguimiento.

Cada microservicio se comunica mediante APIs REST a través de Kong y utiliza PostgreSQL como base de datos.

---

## Requisitos Previos

- [Node.js](https://nodejs.org/en) (v16 o superior)
- [Docker](https://www.docker.com/) y [Docker Compose](https://docs.docker.com/compose/)
- [Git](https://git-scm.com/)

---

## Instalación y Ejecución

Sigue estos pasos para clonar y ejecutar el proyecto localmente:

1. Clonar el repositorio:

```bash
git clone https://github.com/PaolaMoncayo/Ecovida.git
cd ecovida-ecommerce
```

2. Configurar variables de entorno:
   
  - Crea un archivo .env en cada carpeta de microservicio (usuarios-service, catalogo-service, etc.) basado en el ejemplo siguiente:
    
  ```plaintext
  DB_USER=kong
  DB_PASS=kong
  DB_HOST=kong-database
  DB_PORT=5432
  DB_NAME=kong
  JWT_SECRET=supersecreto
  ```

3. Construir y ejecutar los contenedores:
   
```bash
docker-compose up --build
```
Esto iniciará todos los microservicios, Kong y la base de datos en la red `kong-net`.

4. Acceder al sistema:
- Frontend: (Pendiente de definir puerto, e.g., http://localhost:3005)
- APIs:
  - Usuarios: `http://localhost:3000`
  - Catálogo: `http://localhost:3001`
  - Carrito: `http://localhost:3002`
  - Pedidos: `http://localhost:3003`
  - Envíos: `http://localhost:3004`

5. Detener los servicios
```bash
docker-compose down
```

---

## Estructura del Repositorio

El programa se encuentra dividido de la siguiente manera:

```bash
ecovida-ecommerce/
├── usuarios-service/     # Microservicio de usuarios
├── catalogo-service/     # Microservicio de catálogo
├── carrito-service/      # Microservicio de carrito
├── pedidos-service/      # Microservicio de pedidos
├── envios-service/       # Microservicio de envíos
├── frontend/             # Frontend en React (si aplica)
├── docker-compose.yml    # Configuración de Docker
└── README.md             # Este archivo
```

---

## Uso de las APIs

Ejemplo de endpoints del `carrito-service`:

- GET /carrito: Obtener el carrito del usuario autenticado.
  - Header: `Authorization: Bearer <token>`
- POST /carrito: Agregar un producto al carrito.
  - Body: `{ "id_producto": 1, "cantidad": 2 }`
- DELETE /carrito/:id_producto: Eliminar un producto del carrito.
  - Consulta la documentación específica en cada microservicio para más detalles.

---

## Contribuciones

¡Las contribuciones son bienvenidas! Por favor:

- Haz un fork del repositorio.
- Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`).
- Commitea tus cambios (`git commit -m "Añadir nueva funcionalidad"`).
- Sube tu rama (`git push origin feature/nueva-funcionalidad`).
- Abre un Pull Request.

---

## Licencia
Este proyecto está bajo la licencia MIT

---

## Contacto
Para dudas o sugerencias, abre un issue en este repositorio.


