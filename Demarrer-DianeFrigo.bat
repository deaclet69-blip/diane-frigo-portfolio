@echo off
title DIANE FRIGO - Demarrage
echo Demarrage de DIANE FRIGO...
echo.
echo Ne fermez pas les fenetres qui vont s'ouvrir - elles doivent rester actives.
echo.

start "DIANE FRIGO - Backend" cmd /k "cd /d %~dp0backend && npm run start:dev"

timeout /t 6 /nobreak >nul

start "DIANE FRIGO - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 6 /nobreak >nul

start http://localhost:5173

echo.
echo DIANE FRIGO est en cours de demarrage dans deux fenetres separees.
echo Votre navigateur va s'ouvrir automatiquement dans quelques secondes.
echo Vous pouvez fermer cette fenetre-ci.
pause
