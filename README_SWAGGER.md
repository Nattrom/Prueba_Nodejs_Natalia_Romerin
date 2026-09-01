# Manual de Swagger UI: ADMIN y REQUEST_MANAGER

Swagger UI esta disponible en:

```text
http://localhost:3000/api/docs
```

La ruta correcta es `/api/docs`, no `/apl/docs`. Este documento explica como registrar usuarios, obtener sus JWT y probar cada permiso desde el navegador.

## Antes de comenzar

La API y PostgreSQL deben estar activos. Con Docker Compose, ejecuta desde la raiz del proyecto:

```powershell
docker compose up -d --build
```

Comprueba el servicio:

```powershell
Invoke-RestMethod http://localhost:3000/health
```

La respuesta esperada es similar a:

```json
{
  "status": "OK",
  "timestamp": "2026-08-31T12:00:00.000Z"
}
```

Abre `http://localhost:3000/api/docs`. Las operaciones aparecen agrupadas por `Authentication`, `Clinics`, `Warehouses`, `Medicines`, `Warehouse Medicines`, `Supply Requests` y `Seed`.

## Conceptos clave

### Roles

Solo hay dos roles validos. Cuando se menciona "usuario" en esta guia, corresponde al rol `REQUEST_MANAGER`.

| Rol | Permisos |
| --- | --- |
| `ADMIN` | Gestiona clinicas, bodegas, medicamentos, inventario, carga de seed y solicitudes. |
| `REQUEST_MANAGER` | Gestiona las solicitudes de suministro que permite su rol. |

No uses `USER`, `MANAGER`, minusculas ni otro valor: el registro respondera `400`.

### JWT y autorizacion

Al iniciar sesion, la respuesta contiene `data.token`. Es un JWT que Swagger envia como:

```http
Authorization: Bearer <token>
```

Para usarlo en Swagger:

1. Pulsa el boton `Authorize` con el icono de candado, arriba de la pagina.
2. En `bearerAuth`, pega solo el valor completo de `data.token`; no incluyas comillas ni escribas `Bearer`.
3. Pulsa `Authorize` y luego `Close`.

Swagger conserva una unica autorizacion activa. Para probar el otro rol, abre `Authorize`, pulsa `Logout` o reemplaza el valor y autoriza el nuevo token. No compartas tokens: caducan segun `JWT_EXPIRES_IN`, que por defecto es `24h`.

### Ejecutar una operacion

1. Expande la operacion, por ejemplo `POST /api/auth/register`.
2. Pulsa `Try it out`.
3. Completa el cuerpo JSON o los parametros mostrados.
4. Pulsa `Execute`.
5. Revisa `Response code` y `Response body`.

Para cuerpos JSON, Swagger configura `Content-Type: application/json` automaticamente.

## Sesion ADMIN

### 1. Registrar el administrador

En `Authentication`, abre `POST /api/auth/register`. Con `Try it out`, envia un correo que no exista:

```json
{
  "name": "Admin Local",
  "email": "admin.local@example.com",
  "password": "Admin123!",
  "role": "ADMIN"
}
```

Pulsa `Execute`. La respuesta correcta es `201` y su cuerpo no devuelve la contraseña:

```json
{
  "message": "User registered successfully",
  "data": {
    "id": 1,
    "name": "Admin Local",
    "email": "admin.local@example.com",
    "role": "ADMIN"
  }
}
```

Si obtienes `409 Email is already registered`, el usuario ya existe: continua con inicio de sesion. Para `400`, revisa que el correo sea valido y la contraseña tenga seis caracteres o mas.

### 2. Iniciar sesion como administrador

Abre `POST /api/auth/login` y envia:

```json
{
  "email": "admin.local@example.com",
  "password": "Admin123!"
}
```

Una respuesta `200` tiene esta estructura:

```json
{
  "message": "Login successful",
  "data": {
    "token": "eyJ...",
    "user": {
      "id": 1,
      "name": "Admin Local",
      "email": "admin.local@example.com",
      "role": "ADMIN"
    }
  }
}
```

Copia `data.token` y sigue los pasos de `Authorize` descritos antes. Ejecuta `GET /api/clinics` como comprobacion. Un `200` con una lista vacia es valido si aun no se han creado clinicas.

### 3. Permisos ADMIN

| Grupo | Acciones autorizadas |
| --- | --- |
| `Clinics` | Crear, listar, consultar, actualizar y borrar clinicas. |
| `Warehouses` | Crear, listar, consultar, actualizar y borrar bodegas. |
| `Medicines` | Crear, listar, consultar, actualizar y borrar medicamentos. |
| `Warehouse Medicines` | Crear, consultar, actualizar stock y borrar inventario. |
| `Supply Requests` | Crear, consultar todas/activas/historial/detalle y actualizar estado. |
| `Seed` | Subir datos iniciales con `POST /api/seed/upload`. |

## Crear los datos base

Las solicitudes requieren IDs existentes de clinica, bodega, medicamento e inventario. Haz estos pasos usando el token `ADMIN`.

### Clinica: `POST /api/clinics`

Usa como `responsibleUserId` el `id` del administrador devuelto en el registro:

```json
{
  "name": "Clinica Central",
  "nit": "900123456-7",
  "responsibleUserId": 1
}
```

Guarda el ID de respuesta.

### Bodega: `POST /api/warehouses`

```json
{
  "name": "Bodega Principal",
  "location": "Barranquilla"
}
```

Guarda el ID de respuesta.

### Medicamento: `POST /api/medicines`

```json
{
  "name": "Paracetamol",
  "description": "Analgesico"
}
```

Guarda el ID de respuesta.

### Inventario: `POST /api/warehouse-medicines`

Usa los IDs de bodega y medicamento creados:

```json
{
  "warehouseId": 1,
  "medicineId": 1,
  "stock": 100
}
```

No se puede crear ni aprobar una solicitud si esta relacion no existe o el stock es insuficiente.

## Sesion REQUEST_MANAGER

### 1. Registrar el usuario gestor

`POST /api/auth/register` es publico. Abrelo y envia:

```json
{
  "name": "Gestor Local",
  "email": "gestor.local@example.com",
  "password": "Gestor123!",
  "role": "REQUEST_MANAGER"
}
```

Confirma que la respuesta `201` devuelva `"role": "REQUEST_MANAGER"`.

### 2. Iniciar sesion y cambiar el token

En `POST /api/auth/login`, envia:

```json
{
  "email": "gestor.local@example.com",
  "password": "Gestor123!"
}
```

Copia `data.token`. Pulsa `Authorize`, reemplaza o cierra el token ADMIN, pega el token del gestor y confirma con `Authorize`. Verifica `data.user.role` en la respuesta de login antes de ejecutar rutas protegidas.

### 3. Permisos REQUEST_MANAGER

| Ruta | Acción permitida |
| --- | --- |
| `POST /api/supply-requests` | Crear una solicitud. |
| `GET /api/supply-requests/active` | Consultar solicitudes con estado `PENDING` o `APPROVED`. |
| `GET /api/supply-requests/history/{clinicId}` | Consultar historial por clinica. |
| `GET /api/supply-requests/{id}` | Consultar una solicitud concreta. |
| `PUT /api/supply-requests/{id}/status` | Aplicar una transicion de estado valida. |

No puede ejecutar `GET /api/supply-requests` ni ninguna ruta de clinicas, bodegas, medicamentos, inventario o seed. Swagger mostrara respuesta `403` en esos casos. Esta es una prueba util de que el token activo es realmente el del gestor.

## Crear y actualizar una solicitud

Con cualquiera de los dos roles autorizados, abre `POST /api/supply-requests` y usa los IDs creados previamente:

```json
{
  "clinicId": 1,
  "medicineId": 1,
  "warehouseId": 1,
  "quantity": 10,
  "notes": "Solicitud para consulta externa"
}
```

La respuesta correcta es `201` y el estado inicial es `PENDING`. El stock no se reduce al crearla.

Para aprobarla, abre `PUT /api/supply-requests/{id}/status`, pulsa `Try it out`, escribe el ID en el parametro de ruta y envia:

```json
{
  "status": "APPROVED"
}
```

Si la solicitud era de 10 unidades y habia 100, el stock pasa a 90. La API usa una transaccion: si falta stock o falla una operacion, no cambia ni el inventario ni el estado.

Las transiciones permitidas son:

```text
PENDING -> APPROVED -> COMPLETED
PENDING -> REJECTED
```

Rechazar no descuenta stock. Completar una solicitud aprobada tampoco descuenta por segunda vez.

## Cargar datos mediante Seed

Solo `ADMIN` puede usar `POST /api/seed/upload`.

1. Autoriza Swagger con el token ADMIN.
2. Abre la operacion y pulsa `Try it out`.
3. En el campo `file`, selecciona un archivo `.json` de hasta 5 MB.
4. Pulsa `Execute`.

El endpoint recibe `multipart/form-data` y requiere arreglos para usuarios, clinicas, bodegas, medicamentos e inventario. No requiere que escribas el encabezado multipart manualmente.

## Errores frecuentes

| Código | Causa | Acción |
| --- | --- | --- |
| `400` | Datos, ID, cantidad, estado o archivo invalidos | Revisa el esquema de Swagger. IDs y cantidades son enteros positivos; el stock no puede ser negativo. |
| `401` | Falta token, es invalido o expiro | Haz login de nuevo y actualiza `Authorize`. |
| `403` | El rol no tiene permiso | Verifica `data.user.role`; cambia al token ADMIN para administracion. |
| `404` | El ID no existe | Consulta el recurso con su endpoint `GET` y usa un ID existente. |
| `409` | Email, NIT o relacion de inventario duplicada | Usa un dato unico o reutiliza el registro ya existente. |
| `500` | Error interno o de base de datos | Ejecuta `docker compose ps` y `docker compose logs -f api`. |

## Reiniciar la practica

Para detener sin borrar datos:

```powershell
docker compose down
```

Para borrar PostgreSQL y practicar desde cero:

```powershell
docker compose down -v
docker compose up -d --build
```

Despues vuelve a crear primero el ADMIN, los datos base y, finalmente, el REQUEST_MANAGER.

## Checklist

1. Abre `http://localhost:3000/api/docs`.
2. Registra e inicia sesion como `ADMIN`.
3. Autoriza Swagger con su token.
4. Crea clinica, bodega, medicamento e inventario.
5. Registra e inicia sesion como `REQUEST_MANAGER`.
6. Sustituye la autorizacion por el token del gestor.
7. Crea una solicitud y consultala por ID.
8. Prueba una ruta administrativa con el gestor y confirma el `403`.
9. Cambia otra vez al token ADMIN.
10. Aprueba la solicitud y consulta el inventario para confirmar una unica reduccion de stock.