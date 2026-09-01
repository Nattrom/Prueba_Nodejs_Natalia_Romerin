# Instalación y ejecución

## Estado preparado

El 31 de agosto de 2026 se ejecutó `npm ci` en este proyecto. Se instalaron 521 paquetes desde `package-lock.json`, sin modificarlo. Esta instalación incluye, entre otros:

- Runtime y servidor: `express`, `cors`, `dotenv` y `ts-node-dev`.
- Datos: `sequelize`, `pg` y `pg-hstore`.
- Seguridad y archivos: `bcryptjs`, `jsonwebtoken` y `multer`.
- Documentación y pruebas: `swagger-jsdoc`, `swagger-ui-express`, `jest` y `ts-jest`.
- Desarrollo TypeScript: `typescript` y los paquetes `@types/*`.

También estaban disponibles en el equipo Node.js `v24.19.0`, npm `11.17.0`, Docker `29.6.2` y Docker Compose `v5.3.1`. Node, npm y Docker no se instalaron durante esta preparación.

> `npm ci` informó paquetes obsoletos y dos vulnerabilidades moderadas. Se mantuvieron las versiones definidas por el proyecto para no cambiar su comportamiento. Ejecuta `npm audit` para ver el detalle antes de actualizar dependencias.

## Requisitos

- Node.js y npm. Este proyecto se verificó con Node.js `v24.19.0`.
- Una base de datos PostgreSQL accesible para el modo local, o Docker Desktop para el modo contenedores.
- Un archivo `.env` con las variables de entorno. No debe subirse al repositorio.

## Preparar variables locales

En PowerShell, crea el archivo a partir de la plantilla:

```powershell
Copy-Item .env.example .env
```

Edita `.env` y define una clave JWT propia. Para PostgreSQL instalado directamente en Windows, ajusta los valores `DB_*` a los de tu servidor. La plantilla usa el puerto `5435`; PostgreSQL suele usar `5432`, así que usa el puerto que realmente esté configurado en tu instalación.

```dotenv
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=riwimedicare_plus
DB_USER=riwi_user
DB_PASSWORD=una_clave_local
JWT_SECRET=una_clave_larga_aleatoria
JWT_EXPIRES_IN=24h
```

La aplicación crea las tablas al iniciar mediante Sequelize, pero la base de datos y el usuario de PostgreSQL deben existir y aceptar esas credenciales.

## Ejecutar localmente

Instala dependencias en futuras copias con el archivo de bloqueo:

```powershell
npm ci
```

Después de configurar PostgreSQL y `.env`, inicia el modo de desarrollo:

```powershell
npm run dev
```

El servidor queda en `http://localhost:3000`. Comprueba que responde con:

```powershell
Invoke-RestMethod http://localhost:3000/health
```

La documentación interactiva está en `http://localhost:3000/api/docs`.

## Ejecutar con Docker

Esta es la forma más directa de levantar API y PostgreSQL juntos, sin instalar PostgreSQL en Windows:

```powershell
docker compose up --build -d
docker compose ps
docker compose logs -f api
```

Docker Compose configura internamente la API con `DB_HOST=postgres` y `DB_PORT=5432`; no necesita el `.env` de desarrollo para los valores por defecto. Puedes cambiar `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` y `JWT_SECRET` en tu entorno antes de iniciarlo.

Detén los contenedores con:

```powershell
docker compose down
```

Para borrar tambien los datos persistidos de PostgreSQL:

```powershell
docker compose down -v
```

## Compilar, iniciar y probar

```powershell
npm run build  # genera dist/
npm start      # ejecuta dist/server.js
npm test       # ejecuta Jest en serie
```

`npm run dev` ejecuta TypeScript directamente y reinicia al detectar cambios. `npm start` requiere ejecutar antes `npm run build`.

## Solución de problemas

| Síntoma | Causa probable | Acción |
| --- | --- | --- |
| `Unable to connect to the database` | PostgreSQL no está iniciado o los `DB_*` no coinciden | Inicia PostgreSQL, revisa host, puerto, base, usuario y contraseña en `.env`. |
| `EADDRINUSE` | El puerto `3000` ya está ocupado | Detén el proceso que lo usa o cambia `PORT` en `.env`. |
| `password authentication failed` | Credenciales de PostgreSQL incorrectas | Ajusta `DB_USER` y `DB_PASSWORD`, o crea el usuario con esas credenciales. |
| `JWT_SECRET must have a value` | Falta la clave del token | Define `JWT_SECRET` en `.env`; usa una clave larga que no sea la de ejemplo. |
| Docker no inicia | Docker Desktop no está activo | Inicia Docker Desktop y vuelve a ejecutar `docker compose up --build -d`. |