cmake_minimum_required(VERSION 3.10)
project(corporate_portal_backend)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Путь к vcpkg toolchain file
set(CMAKE_TOOLCHAIN_FILE "C:/dev/vcpkg/scripts/buildsystems/vcpkg.cmake" CACHE STRING "Vcpkg toolchain file")

# Находим PostgreSQL и libpqxx
find_package(PostgreSQL REQUIRED)
find_package(libpqxx CONFIG REQUIRED)

add_executable(corporate_portal_backend src/main.cpp)

target_link_libraries(corporate_portal_backend PRIVATE
    PostgreSQL::PostgreSQL
    libpqxx::pqxx
)
