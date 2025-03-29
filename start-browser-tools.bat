@echo off
title BrowserTools Middleware Launcher
echo Starting BrowserTools middleware component...

:: Define port numbers
set MIDDLEWARE_PORT=3026
set MCP_PORT=3025

:: Kill any existing Node.js processes on these ports
echo Stopping any existing processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%MIDDLEWARE_PORT% "') do taskkill /F /PID %%a /T 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%MCP_PORT% "') do taskkill /F /PID %%a /T 2>nul

:: Wait a moment for ports to be freed
timeout /t 2 /nobreak > nul

:: Start the middleware server
echo Starting Middleware Server on port %MIDDLEWARE_PORT%...
cd "%~dp0mcp\browser-tools-mcp\browser-tools-server"
start "BrowserTools Middleware Server" cmd /c "node dist\browser-connector.js --port %MIDDLEWARE_PORT%"

:: Start the MCP server
echo Starting MCP Server on port %MCP_PORT%...
cd ..\browser-tools-mcp
start "BrowserTools MCP Server" cmd /c "node dist\mcp-server.js --port %MCP_PORT%"

echo.
echo BrowserTools servers started!
echo.
echo Remember to:
echo 1. Install the Chrome extension
echo 2. Open Chrome DevTools
echo 3. Look for the BrowserTools tab in DevTools
echo.
echo Press any key to exit...
pause >nul 