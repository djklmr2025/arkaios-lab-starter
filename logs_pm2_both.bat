@echo off
SETLOCAL ENABLEEXTENSIONS ENABLEDELAYEDEXPANSION

REM Muestra los logs de ambos procesos (cosmos-den y mcp-http)
echo Abriendo logs de PM2 para cosmos-den y mcp-http...
pm2 logs cosmos-den mcp-http

REM Al cerrar la ventana, los logs se detendrán.