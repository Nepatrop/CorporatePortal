@echo off
echo Starting load tests...

REM Очищаем кэш и освобождаем память
ipconfig /flushdns
echo Cleared DNS cache

REM Запускаем тесты
echo Running tests...
.\build\Release\load_test.exe

echo.
echo Tests completed.
pause
