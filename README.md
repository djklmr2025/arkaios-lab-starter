# arkaios-lab-starter
nuevo laboratorio

## Despliegue (Render + Vercel)

- Backend (API) en Render:
  - Conecta este repo y usa `render.yaml` automáticamente.
  - Variables necesarias: `AIDA_GATEWAY_URL` y `AIDA_AUTH_TOKEN` (configúralas en el dashboard).
  - `SERVE_STATIC` se deja en `false` (la UI se sirve desde Vercel).
  - Endpoint de salud: `GET https://<tu-servicio>.onrender.com/health`.

- Frontend (UI) en Vercel:
  - Vercel leerá `vercel.json` en la raíz y construirá `apps/ui`.
  - Las rutas `/api/*` se reescriben al backend en Render (ajusta el dominio si difiere).
  - No pongas secretos en Vercel; la UI usa el proxy y CORS del API.

- Pruebas rápidas:
  - `GET https://<render>.onrender.com/health` debe responder `{"status":"ok"}`.
  - Desde Vercel, abre `/bridge.html` o la UI y prueba `POST /api/chat`.

## MCP Daemon (STDIO) y Wrapper HTTP

Este repo incluye un daemon MCP mínimo por STDIO y un wrapper HTTP opcional.

- STDIO (por línea):
  - Env vars: `AIDA_GATEWAY_URL`, `AIDA_AUTH_TOKEN`, `LOCAL_BASE` (por defecto `http://localhost:8080`).
  - Ejecuta: `npm run mcp`
  - Ejemplos:
    - `echo '{"command":"arkaios.health"}' | node apps/mcp/server.mjs`
    - `echo '{"command":"arkaios.chat","params":{"prompt":"Hola"}}' | node apps/mcp/server.mjs`

- HTTP (wrapper sin dependencias externas):
  - Env vars: `MCP_HTTP_PORT` (default `8090`), `AIDA_GATEWAY_URL`, `AIDA_AUTH_TOKEN`, `LOCAL_BASE`.
  - Ejecuta: `npm run mcp:http`
  - Endpoints:
    - `GET http://localhost:8090/mcp/health`
    - `POST http://localhost:8090/mcp/run` con cuerpo `{ "command": "arkaios.chat", "params": { "prompt": "Hola" } }`

### Conexión con A.I.D.A. Gateway (builderOS_Lab)

- Repo del Gateway y documentación: `https://github.com/djklmr2025/builderOS_Lab`
- Modo OPEN (sin token):
  - `AIDA_GATEWAY_URL=https://arkaios-gateway-open.onrender.com/aida/gateway`
  - `AIDA_AUTH_TOKEN=` (vacío)
  - Ejemplo:
    - `GET http://localhost:8090/mcp/health` → `gateway.ok: true`
    - `POST http://localhost:8090/mcp/run` body `{"command":"arkaios.chat","params":{"prompt":"Explorar BuilderOS"}}` → `via: gateway`
- Modo SECURE (con token):
  - `AIDA_AUTH_TOKEN=Bearer <TOKEN>` (o sólo `<TOKEN>`; el wrapper añade `Bearer` si lo proporcionas completo)
  - Requiere autorización previa (ver README del Gateway)

### Notas
- El MCP intenta primero Gateway (`AIDA_*`) y cae a local (`LOCAL_BASE`) para chat.
- `LOCAL_BASE` debe apuntar al backend del lab, por defecto `http://localhost:8080`.
- El wrapper HTTP habilita CORS básico (`*`) para facilitar pruebas desde UI.
- Usa Node ESM (Node >= 18); `apps/mcp/http.mjs` importa `node:http`.

## Ejecución permanente (PM2)

- Archivo: `ecosystem.config.cjs` (incluido)
- Scripts sugeridos:
  - `pm2 start ecosystem.config.cjs --only mcp-http --update-env`
  - `pm2 restart mcp-http`
  - `pm2 logs mcp-http`
  - Arranque conjunto:
    - `npm run pm2:start:both` (backend `cosmos-den` + wrapper `mcp-http`)
    - `npm run pm2:start:cosmos` (sólo backend)
- Variables de entorno a exportar antes de iniciar:
  - `MCP_HTTP_PORT=8090`
  - `LOCAL_BASE=http://localhost:8080` (o `http://127.0.0.1:3000` en dev)
  - `AIDA_GATEWAY_URL=https://arkaios-gateway-open.onrender.com/aida/gateway`
  - `AIDA_AUTH_TOKEN=<TOKEN>` (puede ser sólo el token o con prefijo `Bearer`)
- Nota: el wrapper detecta si el token ya incluye `Bearer ` y evita duplicarlo.

### Persistencia tras reinicios (Windows)

- Guarda procesos actuales: `pm2 save`
- Instala el inicio automático (Windows):
  - `npm i -g pm2-windows-startup`
  - `pm2-startup install`
  - Esto crea una tarea programada que ejecuta `pm2 resurrect` al iniciar sesión.
- Si cambias variables de entorno, reinicia procesos con `--update-env` y vuelve a ejecutar `pm2 save`.

### Detalles del arranque conjunto

- El backend `cosmos-den` se lanza vía PM2 apuntando al build `dist/server/node-build.mjs`.
- Esto evita problemas con `npm.cmd` en Windows y garantiza un arranque estable.
