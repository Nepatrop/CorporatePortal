cmake_minimum_required(VERSION 3.15)
project(corporate_server)

# Устанавливаем стандарт C++20
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Включаем поддержку vcpkg
set(CMAKE_TOOLCHAIN_FILE "C:/dev/vcpkg/scripts/buildsystems/vcpkg.cmake" CACHE STRING "")

# Находим необходимые пакеты
find_package(PostgreSQL REQUIRED)
find_package(libpqxx CONFIG REQUIRED)
find_package(nlohmann_json CONFIG REQUIRED)
find_package(websocketpp CONFIG REQUIRED)
find_package(Boost REQUIRED system thread)

# Добавляем директории с исходниками
include_directories(${CMAKE_SOURCE_DIR}/include)
include_directories(${CMAKE_SOURCE_DIR}/thirdparty/cpp-httplib)

# Устанавливаем правильные пути к исходникам
set(SOURCES
    main.cpp
    src/db/get.cpp
    src/db/post.cpp
    src/db/put.cpp
    src/db/config.cpp
    src/db/delete.cpp
    src/auth/auth_handler.cpp
    src/auth/user_auth.cpp
    src/websocket/ws_server.cpp
)

# Создаем исполняемый файл
add_executable(${PROJECT_NAME} ${SOURCES} ${HEADERS})

# Настраиваем включаемые директории
target_include_directories(${PROJECT_NAME} PRIVATE
    ${PostgreSQL_INCLUDE_DIRS}
    ${libpqxx_INCLUDE_DIRS}
)

# Линкуем библиотеки
target_link_libraries(${PROJECT_NAME} PRIVATE
    PostgreSQL::PostgreSQL
    libpqxx::pqxx
    nlohmann_json::nlohmann_json
    websocketpp::websocketpp
    Boost::system
    Boost::thread
)

# Настройки для MSVC
if(MSVC)
    add_compile_options(/W4 /EHsc)
    target_compile_definitions(${PROJECT_NAME} PRIVATE
        _WIN32_WINNT=0x0601
        _CRT_SECURE_NO_WARNINGS
        _SILENCE_ALL_CXX17_DEPRECATION_WARNINGS
        _SILENCE_ALL_MS_EXT_WARNINGS
    )
endif()