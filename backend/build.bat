echo off
echo Building Corporate Portal Backend bin...

rem Create build directory if it doesn't exist
if not exist "build" mkdir build

rem Configure and build
echo ------------------------
cd build
cmake .. -DCMAKE_TOOLCHAIN_FILE=C:/dev/vcpkg/scripts/buildsystems/vcpkg.cmake
if errorlevel 1 goto error

echo ------------------------

cmake --build . --config Release
if errorlevel 1 goto error

echo ------------------------
echo Build completed successfully!
echo Output binary is located at: build/Release/CorporatePortalBackend.exe
echo ------------------------
goto end

:error
echo Build failed!
pause
exit /b 1

:end
pause
