@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM Arranca backend (cosmos-den) y wrapper MCP HTTP con PM2 usando --update-env
REM Carga variables desde .env (comentarios con #) para que el wrapper las reciba

cd /d "%~dp0"

IF EXIST ".env" (
  for /f "usebackq eol=# tokens=1,* delims==" %%A in (".env") do (
    if not "%%A"=="" (
      set "%%A=%%B"
    )
  )
)

REM Defaults si no están definidos
if not defined MCP_HTTP_PORT set "MCP_HTTP_PORT=8090"
if not defined LOCAL_BASE set "LOCAL_BASE=http://127.0.0.1:3000"
if not defined AIDA_GATEWAY_URL set "AIDA_GATEWAY_URL=https://arkaios-gateway-open.onrender.com/aida/gateway"

REM Arranque conjunto con env actualizado
pm2 start ecosystem.config.cjs --update-env

REM Opcional: guardar estado para resurrección
pm2 save

echo.
echo [OK] Lanzados procesos con PM2 (cosmos-den + mcp-http). Verifica con:
echo   pm2 list
echo   pm2 logs cosmos-den --lines 20
echo   pm2 logs mcp-http --lines 20
echo.
pause