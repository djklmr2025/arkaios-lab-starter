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
