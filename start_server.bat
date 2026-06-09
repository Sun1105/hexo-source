@echo off
setlocal enabledelayedexpansion

:: Switch to UTF-8 code page to support Chinese/Japanese characters if needed
chcp 65001 >nul

:: Force change to script directory
cd /d "%~dp0"

echo =======================================================
echo Hexo Local Server Starter
echo =======================================================
echo Current Directory: %cd%
echo.

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
  echo Error: Node.js is not installed.
  pause
  exit /b
)

:: Check Hexo Config
if not exist _config.yml (
  echo Error: _config.yml not found. 
  echo Please make sure this script is in the Hexo root directory.
  pause
  exit /b
)

:: Check node_modules
if not exist node_modules (
  echo node_modules not found. Installing dependencies...
  call npm install
  if %errorlevel% neq 0 (
    echo Error: npm install failed.
    pause
    exit /b
  )
)

:: Define Hexo Path
set HEXO_BIN=node_modules\.bin\hexo.cmd

if not exist "%HEXO_BIN%" (
  echo Error: Hexo binary not found at %HEXO_BIN%
  pause
  exit /b
)

echo Cleaning cache...
call "%HEXO_BIN%" clean

echo.
echo Starting Hexo server...
echo URL: http://localhost:4000
echo.
echo Press Ctrl+C to stop the server.
echo.

:: Run Server
call "%HEXO_BIN%" server

if %errorlevel% neq 0 (
  echo.
  echo Server stopped with error.
  pause
)

pause
