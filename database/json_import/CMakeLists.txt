cmake_minimum_required(VERSION 3.15)
project(departments_import)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Включаем поддержку vcpkg
set(CMAKE_TOOLCHAIN_FILE "C:/dev/vcpkg/scripts/buildsystems/vcpkg.cmake" CACHE STRING "")

# Находим необходимые пакеты
find_package(PostgreSQL REQUIRED)
find_package(libpqxx CONFIG REQUIRED)
find_package(nlohmann_json CONFIG REQUIRED)

add_executable(departments_import main.cpp)

target_link_libraries(departments_import PRIVATE
    PostgreSQL::PostgreSQL
    libpqxx::pqxx
    nlohmann_json::nlohmann_json
)
