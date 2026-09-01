# Guía de estudio: RiwiMediCare Plus API

## Qué resuelve

Esta API REST gestiona el suministro de medicamentos entre clínicas y bodegas. Tiene usuarios con roles, inventario por bodega y solicitudes de suministro. Su regla principal es deliberada: crear una solicitud no descuenta inventario; aprobarla sí lo descuenta de forma atómica.

## Recorrido de una petición

```text
Cliente HTTP
  -> ruta
  -> middleware de autenticación y rol
  -> controlador
  -> servicio
  -> modelo Sequelize
  -> PostgreSQL
  -> respuesta JSON
```

Estudia las capas en ese orden. Cada una tiene una responsabilidad separada:

| Capa | Archivos | Responsabilidad |
| --- | --- | --- |
| Arranque | `src/server.ts`, `src/app.ts` | Crea Express, configura middleware, registra rutas e inicializa la base de datos. |
| Configuración | `src/config/environment.ts`, `src/config/database.ts` | Lee `.env` y crea la conexión Sequelize. |
| Rutas | `src/routes/*.routes.ts` | Declaran verbo, URL, middleware y controlador; incluyen anotaciones OpenAPI. |
| Middleware | `src/middlewares/*.middleware.ts` | Autentica JWT, valida roles y limita el archivo de seed a JSON de 5 MB. |
| Controladores | `src/controllers/*.controller.ts` | Convierten `req` en argumentos para servicios y devuelven códigos/respuestas HTTP. |
| Servicios | `src/services/*.service.ts` | Contienen reglas de negocio, validaciones y consultas/transacciones. |
| Modelos | `src/models/*.model.ts`, `src/models/index.ts` | Definen tablas, campos, restricciones y asociaciones Sequelize. |
| Tipos | `src/types/index.ts` | Declara tipos compartidos, incluido `req.user` para solicitudes autenticadas. |
| Documentación | `src/docs/swagger.ts` | Construye la especificación que Swagger UI sirve en `/api/docs`. |
| Pruebas | `tests/*.test.ts`, `jest.config.js` | Prueban servicios y autorización con mocks y exigen 40% de cobertura global. |

## Arranque y configuración

`src/server.ts` importa la aplicación y la deja escuchando en `PORT`. `src/app.ts` es el centro de composición: activa CORS, los parsers JSON y URL encoded, Swagger, todas las rutas y el endpoint público `GET /health`.

Al importarse, `src/app.ts` ejecuta `initializeDatabase()`. Esta función autentica Sequelize, sincroniza los modelos y agrega dos restricciones de PostgreSQL: `stock >= 0` y `quantity > 0`. Es una segunda línea de defensa adicional a las validaciones del servicio y del modelo.

`src/config/environment.ts` centraliza las variables de entorno. `src/config/database.ts` usa esos datos para configurar Sequelize. La separación evita que servicios y controladores lean `process.env` por su cuenta.

## Modelo de datos

Los modelos de `src/models` representan estas entidades:

| Modelo | Propósito y relación importante |
| --- | --- |
| `User` | Cuenta con rol `ADMIN` o `REQUEST_MANAGER`; su correo es único. |
| `Clinic` | Clínica con NIT único y un `responsibleUserId` que apunta a `User`. |
| `Warehouse` | Bodega física, con nombre y ubicación. |
| `Medicine` | Catálogo de medicamentos. |
| `WarehouseMedicine` | Tabla puente entre bodega y medicamento; guarda el campo `stock` y evita repetir la pareja `(warehouseId, medicineId)`. |
| `SupplyRequest` | Solicitud con clínica, medicamento, bodega, cantidad, notas y estado. |

`src/models/index.ts` conecta las asociaciones `belongsTo` y `hasMany`. La relación conceptual es:

```text
Warehouse 1 -- N WarehouseMedicine N -- 1 Medicine
Clinic    1 -- N SupplyRequest  N -- 1 Medicine
Warehouse 1 -- N SupplyRequest
User      1 -- N Clinic
```

`User`, `Clinic`, `Warehouse`, `Medicine` y `SupplyRequest` usan borrado lógico de Sequelize (`paranoid`). Al eliminarse no desaparecen físicamente: se completa `deletedAt` y las consultas habituales ya no los devuelven. `WarehouseMedicine` no usa borrado lógico porque es un registro de relación de inventario.

## Autenticación y permisos

`auth.service.ts` contiene la lógica de registro e inicio de sesión. En registro normaliza el correo, valida datos, cifra la contraseña con `bcryptjs` y devuelve un usuario seguro sin la contraseña. En inicio de sesión compara el hash y firma un JWT con `id`, `email` y `role`.

`auth.middleware.ts` lee `Authorization: Bearer <token>`, valida la firma y adjunta el usuario a `req.user`. `role.middleware.ts` compara ese rol con los roles permitidos por cada ruta. Por eso el orden en una ruta protegida siempre es `authenticate`, `authorize(...)`, controlador.

| Área | ADMIN | REQUEST_MANAGER |
| --- | --- | --- |
| Clínicas, bodegas, medicamentos e inventario | CRUD | Sin acceso |
| Carga de seed | Permitida | Sin acceso |
| Solicitudes | Crear, consultar, actualizar estado | Crear, consultar activas/historial/detalle, actualizar estado |

Las rutas públicas son `POST /api/auth/register`, `POST /api/auth/login` y `GET /health`.

## Servicios por dominio

Los servicios son la parte más importante para estudiar, porque ahí están las decisiones de negocio.

| Servicio | Qué estudiar |
| --- | --- |
| `auth.service.ts` | Normalización de correo, hash de contraseña, comparación de hash y firma JWT. |
| `clinic.service.ts` | Validación de campos y del usuario responsable antes del CRUD de clínicas. |
| `medicine.service.ts` | CRUD y serialización del catálogo de medicamentos. |
| `warehouse.service.ts` | CRUD y validación de datos de las bodegas. |
| `warehouseMedicine.service.ts` | Comprueba que existen bodega y medicamento, valida `stock >= 0` y mantiene la relación de inventario. |
| `supplyRequest.service.ts` | Crea solicitudes, consulta sus relaciones y aplica transiciones de estado. Es el servicio crítico. |
| `seed.service.ts` | Lee y valida JSON, después crea usuarios, clínicas, bodegas, medicamentos e inventario en orden de dependencia y con transacción. |

Los controladores equivalentes solo manejan HTTP: toman parámetros de URL o cuerpo, invocan al servicio y seleccionan la respuesta. Mantener los controladores finos hace que los servicios puedan probarse sin levantar Express.

## Ciclo de vida de una solicitud

Los estados están en `SupplyRequestStatus` dentro de `src/models/supplyRequest.model.ts`:

```text
PENDING -> APPROVED -> COMPLETED
PENDING -> REJECTED
```

1. `createSupplyRequest()` valida IDs, cantidad positiva, existencia de clínica/medicamento/bodega/inventario y stock suficiente. Crea la solicitud en `PENDING` sin reservar ni descontar stock.
2. `updateSupplyRequestStatus()` controla que la transición sea válida.
3. En `PENDING -> APPROVED` abre una transacción Sequelize, bloquea o consulta de nuevo el inventario, vuelve a comprobar stock, lo disminuye y actualiza el estado. Si una operación falla, la transacción revierte todo.
4. `PENDING -> REJECTED` no modifica inventario. `APPROVED -> COMPLETED` tampoco lo descuenta una segunda vez.

Esta transacción evita una condición de carrera: dos aprobaciones simultáneas no deben dejar un stock negativo.

## Rutas y HTTP

Los archivos `src/routes/*.routes.ts` agrupan el API por recurso. Las rutas CRUD de clínicas, bodegas, medicamentos e inventario están restringidas a `ADMIN`. `supplyRequest.routes.ts` concentra estas rutas:

```text
POST /api/supply-requests                 crea solicitud
GET  /api/supply-requests                 lista todas (ADMIN)
GET  /api/supply-requests/active          lista PENDING y APPROVED
GET  /api/supply-requests/history/:clinicId
GET  /api/supply-requests/:id
PUT  /api/supply-requests/:id/status      cambia estado
```

`seed.routes.ts` usa `upload.single('file')`: espera un `multipart/form-data` cuyo campo se llama `file`. `upload.middleware.ts` lo conserva en memoria, acepta JSON y limita el tamaño a 5 MB.

Swagger lee los comentarios `@openapi` de las rutas. Es útil para experimentar con solicitudes ya autenticadas desde `/api/docs`.

### Archivo de seed para Swagger

El archivo [seed-data.json](seed-data.json) es un ejemplo listo para seleccionar en `POST /api/seed/upload` desde Swagger UI. En una base de datos vacia, registra primero un usuario con rol `ADMIN` en `POST /api/auth/register`; su respuesta devuelve el JWT en `data.token`. En **Authorize** pega solamente el valor de `data.token`, sin escribir `Bearer`, sin comillas y sin copiar el objeto JSON completo: Swagger agrega el prefijo `Bearer ` automaticamente. Luego, en `POST /api/seed/upload`, selecciona el archivo en el campo `file`. Tambien puedes obtener un JWT con `POST /api/auth/login`; en ese caso esta igualmente en `data.token`.

Los datos no fueron obtenidos de una fuente externa: se construyeron a partir del contrato implementado en `src/services/seed.service.ts` y del esquema de `src/database/backup.sql`. Por eso incluyen los cinco arreglos que reconoce el servicio (`users`, `clinics`, `warehouses`, `medicines` y `warehouseMedicines`), usan los roles permitidos (`ADMIN` y `REQUEST_MANAGER`) y cumplen las relaciones requeridas: `responsibleUserEmail` coincide con el correo de un usuario, mientras que `warehouseName` y `medicineName` coinciden exactamente con los nombres creados antes. Las contrasenas de prueba tienen al menos seis caracteres y el inventario es entero no negativo.

La carga es transaccional: si alguno de esos datos ya existe o una referencia no coincide, la API devuelve un error y no inserta parcialmente el archivo. Para cargarlo de nuevo, usa una base de datos limpia o cambia los correos, NIT y nombres repetidos.

## Pruebas

Jest usa `ts-jest`, por lo que ejecuta los archivos TypeScript de `tests/`. Las pruebas de servicios sustituyen modelos, bcrypt o JWT por mocks, y verifican reglas sin depender de PostgreSQL. `authorization.middleware.test.ts` cubre token faltante/inválido y roles no autorizados.

Ejecuta todas las pruebas con:

```powershell
npm test
```

Para estudiar una suite concreta:

```powershell
npx jest tests/auth.service.test.ts --runInBand
```

## Orden recomendado de estudio

1. Lee `README.md` y esta guía para entender el problema y las entidades.
2. Sigue `src/server.ts`, `src/app.ts` y `src/config` para ver cómo se inicia la aplicación.
3. Lee `src/models/*.model.ts` y luego `src/models/index.ts`; dibuja las claves foráneas.
4. Recorre `auth.routes.ts`, los middleware y `auth.controller.ts` hasta `auth.service.ts`.
5. Repite el recorrido para un CRUD pequeño, por ejemplo medicamentos.
6. Estudia `supplyRequest.service.ts` junto a sus pruebas: ahí aparecen transacciones, consistencia de stock y estados.
7. Revisa `seed.service.ts` y Swagger para cerrar con carga de datos y documentación.

Una buena práctica es escoger una petición en Swagger, seguirla archivo por archivo y explicar qué validación se hace en cada capa. Eso convierte la arquitectura en un flujo concreto en vez de una lista de carpetas.