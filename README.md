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

### Notas
- El MCP intenta primero Gateway (`AIDA_*`) y cae a local (`LOCAL_BASE`) para chat.
- `LOCAL_BASE` debe apuntar al backend del lab, por defecto `http://localhost:8080`.
- El wrapper HTTP habilita CORS básico (`*`) para facilitar pruebas desde UI.
