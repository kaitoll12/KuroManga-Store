# Manga Store Backend

Backend API para KuroManga Store construido con Node.js, Express y MySQL.

## 🚀 Características

- **Autenticación JWT**: Sistema seguro de registro y login
- **Gestión de Productos**: CRUD completo para mangas
- **Carrito de Compras**: Gestión de carrito con validación de stock
- **Órdenes de Compra**: Sistema completo de pedidos
- **Categorías**: Organización por géneros
- **Búsqueda y Filtros**: Búsqueda por título, autor, género y más
- **Administración**: Panel de administración con permisos
- **Seguridad**: Rate limiting, CORS, helmet y validaciones

## 📋 Requisitos Previos

- Node.js (v14 o superior)
- MySQL (v5.7 o superior)
- npm o yarn

## 🔧 Instalación

1. **Clonar el repositorio**
```bash
cd manga-store/backend
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Edita el archivo `.env` con tus configuraciones:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña_mysql
DB_NAME=manga_store
DB_PORT=3306
PORT=5000
JWT_SECRET=tu_secreto_jwt_super_seguro
```

4. **Crear base de datos en MySQL**
```sql
CREATE DATABASE manga_store;
```

5. **Iniciar el servidor**
```bash
# Modo desarrollo
npm run dev

# Modo producción
npm start
```

6. **Sembrar datos de ejemplo (opcional)**
```bash
npm run seed
```

## 📡 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuarios
- `POST /api/auth/login` - Inicio de sesión
- `GET /api/auth/profile` - Perfil de usuario

### Productos
- `GET /api/products` - Listar productos (con búsqueda y filtros)
- `GET /api/products/:id` - Obtener producto por ID
- `POST /api/products` - Crear producto (admin)
- `PUT /api/products/:id` - Actualizar producto (admin)
- `DELETE /api/products/:id` - Eliminar producto (admin)
- `GET /api/products/filters/genres` - Obtener géneros disponibles

### Carrito
- `GET /api/cart` - Obtener carrito del usuario
- `POST /api/cart/add` - Agregar producto al carrito
- `PUT /api/cart/update/:id` - Actualizar cantidad
- `DELETE /api/cart/remove/:id` - Eliminar producto del carrito
- `DELETE /api/cart/clear` - Vaciar carrito

### Órdenes
- `POST /api/orders/create` - Crear orden desde carrito
- `GET /api/orders/my-orders` - Ver órdenes del usuario
- `GET /api/orders/:id` - Ver detalle de orden
- `PUT /api/orders/:id/status` - Actualizar estado (admin)
- `GET /api/orders/admin/all` - Ver todas las órdenes (admin)

### Categorías
- `GET /api/categories` - Listar categorías
- `GET /api/categories/:id` - Obtener categoría con productos
- `POST /api/categories` - Crear categoría (admin)
- `PUT /api/categories/:id` - Actualizar categoría (admin)
- `DELETE /api/categories/:id` - Eliminar categoría (admin)

## 👥 Usuarios de Prueba

Después de ejecutar `npm run seed`, puedes usar estos usuarios:

**Administrador:**
- Email: admin@mangastore.com
- Contraseña: admin123

**Usuario Regular:**
- Email: user@mangastore.com
- Contraseña: user123

## 🔒 Seguridad

- **JWT Authentication**: Tokens seguros con expiración
- **Password Hashing**: Contraseñas encriptadas con bcrypt
- **Input Validation**: Validación exhaustiva de datos
- **Rate Limiting**: Protección contra ataques de fuerza bruta
- **CORS**: Configuración segura de CORS
- **Helmet**: Headers de seguridad HTTP

## 🗄️ Estructura de la Base de Datos

### Tablas Principales:
- **users**: Usuarios y administradores
- **products**: Mangas y productos
- **categories**: Categorías de productos
- **cart_items**: Items en carrito de usuarios
- **orders**: Órdenes de compra
- **order_items**: Items de cada orden

## 🚀 Despliegue

### Producción:
1. Establece `NODE_ENV=production`
2. Usa un servicio de base de datos confiable
3. Configura variables de entorno seguras
4. Usa HTTPS
5. Configura un proxy reverso (nginx)

### Variables de Entorno Importantes:
```env
NODE_ENV=production
JWT_SECRET=tu_secreto_jwt_muy_seguro
DB_HOST=tu_host_de_bd
DB_PASSWORD=tu_contraseña_segura
CORS_ORIGIN=https://tudominio.com
```

## 📝 Notas

- Los precios se almacenan en centavos (integers)
- Las imágenes pueden ser URLs externas o archivos subidos
- El stock se valida automáticamente al crear órdenes
- Las órdenes tienen estados: pending, confirmed, shipped, delivered, cancelled

## 🐛 Solución de Problemas

**Error de conexión a MySQL:**
- Verifica que MySQL esté ejecutándose
- Revisa las credenciales en `.env`
- Asegúrate de que la base de datos exista

**Puerto ya en uso:**
- Cambia el `PORT` en `.env`
- O mata el proceso que usa el puerto 5000

**Error de CORS:**
- Verifica la configuración de `CORS_ORIGIN` en `.env`
- Asegúrate de que coincida con el dominio de tu frontend

## 📞 Soporte

Para problemas o preguntas:
1. Revisa los logs del servidor
2. Verifica la configuración de la base de datos
3. Asegúrate de que todas las dependencias estén instaladas

---

**KuroManga Store Backend** - Desarrollado con ❤️ para amantes del manga