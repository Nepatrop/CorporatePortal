#!/bin/bash

echo "Starting Linux build process..."

# Проверка наличия необходимых пакетов
check_package() {
    if ! dpkg -l | grep -q "^ii  $1 "; then
        echo "Error: Package $1 is not installed"
        echo "Install it with: sudo apt-get install $1"
        exit 1
    fi
}

echo "Checking required packages..."
REQUIRED_PACKAGES=(
    "build-essential"
    "cmake"
    "postgresql-server-dev-all"
    "libpqxx-dev"
    "nlohmann-json3-dev"
    "libwebsocketpp-dev"
    "libboost-all-dev"
)

for package in "${REQUIRED_PACKAGES[@]}"; do
    echo "Checking $package..."
    check_package "$package"
done

echo "All required packages are installed"

# Создание и переход в директорию сборки
echo "Creating build directory..."
mkdir -p build
cd build

# Конфигурация и сборка
echo "Configuring CMake..."
cmake .. || exit 1

echo "Building project..."
cmake --build . || exit 1

echo "Build completed successfully!"
echo "Binary location: $(pwd)/corporate_server"
