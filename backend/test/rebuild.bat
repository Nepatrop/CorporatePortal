@echo off
echo Cleaning build directory...
if exist "build" rd /s /q "build"
mkdir build
cd build

echo Configuring CMake...
cmake -A x64 ..

echo Building project...
cmake --build . --config Release

if errorlevel 1 (
    echo Build failed!
    pause
    exit /b 1
)

echo Build completed successfully!
echo Executable located at: %CD%\Release\load_test.exe
cd ..
pause
