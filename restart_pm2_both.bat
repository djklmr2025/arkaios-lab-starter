@echo off
SETLOCAL ENABLEEXTENSIONS ENABLEDELAYEDEXPANSION

REM Reinicia ambos procesos gestionados por PM2: cosmos-den y mcp-http
echo Reiniciando procesos PM2: cosmos-den y mcp-http (con --update-env)...

REM Intento de restart con actualización de entorno; si falla, intento start
pm2 restart cosmos-den --update-env >nul 2>&1
IF ERRORLEVEL 1 (
  echo [info] cosmos-den no estaba en ejecución; iniciando...
  pm2 start ecosystem.config.cjs --only cosmos-den --update-env >nul 2>&1
)

pm2 restart mcp-http --update-env >nul 2>&1
IF ERRORLEVEL 1 (
  echo [info] mcp-http no estaba en ejecución; iniciando...
  pm2 start ecosystem.config.cjs --only mcp-http --update-env >nul 2>&1
)

REM Guarda el estado para persistencia en Windows (pm2-windows-startup)
pm2 save >nul 2>&1

echo Listo. Procesos reiniciados (o arrancados si no estaban activos).
pause