@echo off
echo Starting Windows build process...

echo Checking vcpkg installation...
if not exist "C:\dev\vcpkg\vcpkg.exe" (
    echo Error: vcpkg not found in C:\dev\vcpkg
    echo Please install vcpkg first
    echo Installation instructions:
    echo 1. mkdir C:\dev
    echo 2. cd C:\dev
    echo 3. git clone https://github.com/Microsoft/vcpkg.git
    echo 4. .\vcpkg\bootstrap-vcpkg.bat
    pause
    exit /b 1
)

echo Checking required packages...
C:\dev\vcpkg\vcpkg install libpqxx:x64-windows
C:\dev\vcpkg\vcpkg install nlohmann-json:x64-windows
C:\dev\vcpkg\vcpkg install websocketpp:x64-windows
C:\dev\vcpkg\vcpkg install boost-system:x64-windows
C:\dev\vcpkg\vcpkg install boost-thread:x64-windows

echo Creating build directory...
if not exist "build" mkdir build

echo Configuring and building...
cd build
cmake .. -DCMAKE_TOOLCHAIN_FILE=C:/dev/vcpkg/scripts/buildsystems/vcpkg.cmake
if errorlevel 1 goto error

echo Building Release configuration...
cmake --build . --config Release
if errorlevel 1 goto error

echo Build completed successfully!
echo Output binary located at: %CD%\Release\corporate_server.exe
goto end

:error
echo Build failed!
pause
exit /b 1

:end
pause
