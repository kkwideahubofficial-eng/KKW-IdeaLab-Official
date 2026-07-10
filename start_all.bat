@echo off
title AICTE IDEA Lab and SnapCart Launcher
echo ===================================================
echo Starting AICTE IDEA Lab Ecosystem...
echo ===================================================

echo 1. Starting AICTE IDEA Lab Backend (Port 5000)...
start "AICTE IDEA Lab Backend" cmd /k "cd /d ideahub-backend && npm run dev"

echo 2. Starting AICTE IDEA Lab Frontend (Port 5173)...
start "AICTE IDEA Lab Frontend" cmd /k "cd /d innovate-hub-core && npm run dev"

echo 3. Starting SnapCart Socket Server (Port 4000)...
start "SnapCart Socket" cmd /k "cd /d snapcart\socket && npm run dev"

echo 4. Starting SnapCart Driver App (Port 3000)...
start "SnapCart Driver App" cmd /k "cd /d snapcart\frontend && npm run dev"

echo ===================================================
echo Services launching...
echo If a window closes immediately, there was an error!
echo AICTE IDEA Lab:   http://localhost:5173
echo SnapCart:  http://localhost:3000
echo ===================================================
pause
