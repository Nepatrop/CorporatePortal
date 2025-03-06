s@echo off
echo Building Corporate Portal Backend...

rem Create build directory if it doesn't exist
if not exist "build" mkdir build

rem Configure and build
cmake .. -DCMAKE_TOOLCHAIN_FILE=C:/dev/vcpkg/scripts/buildsystems/vcpkg.cmake
if errorlevel 1 goto error

cmake --build --config Release
if errorlevel 1 goto error

echo Build completed successfully!
goto end

:error
echo Build failed!
pause
exit /b 1

:end
pause
