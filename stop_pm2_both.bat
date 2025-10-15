@echo off
SETLOCAL ENABLEEXTENSIONS ENABLEDELAYEDEXPANSION

REM Detiene ambos procesos gestionados por PM2: cosmos-den y mcp-http
echo Deteniendo procesos PM2: cosmos-den y mcp-http...
pm2 stop cosmos-den >nul 2>&1
pm2 stop mcp-http >nul 2>&1

REM Guarda el estado para persistencia en Windows (pm2-windows-startup)
pm2 save >nul 2>&1

echo Listo. Procesos detenidos. Puedes cerrar esta ventana.
pause