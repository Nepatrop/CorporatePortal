@echo off
echo Starting Corporate Portal...

:: Запускаем backend в фоновом режиме
start "Corporate Portal Backend" cmd /c "cd backend\build\Release && corporate_server.exe"

:: Даем время на запуск сервера
timeout /t 2 /nobreak

:: Запускаем frontend
start "Corporate Portal Frontend" cmd /c "npm start"

echo Corporate Portal is running.
echo Backend: http://localhost:8081
echo Frontend: http://localhost:3000
