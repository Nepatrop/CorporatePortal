cmake_minimum_required(VERSION 3.15)
project(corporate_server)

message(STATUS "Determining build OS...")
if(WIN32)
    message(STATUS "OS detected: Windows")
    # Включаем поддержку vcpkg для Windows
    set(CMAKE_TOOLCHAIN_FILE "C:/dev/vcpkg/scripts/buildsystems/vcpkg.cmake" CACHE STRING "")
else()
    message(STATUS "OS detected: Linux")
endif()

# Устанавливаем стандарт C++20
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

message(STATUS "Searching for required libraries...")

# Находим необходимые пакеты с информативными сообщениями
find_package(PostgreSQL REQUIRED)
if(PostgreSQL_FOUND)
    message(STATUS "Found PostgreSQL: ${PostgreSQL_VERSION}")
else()
    message(FATAL_ERROR "PostgreSQL not found. On Linux, install with: sudo apt-get install postgresql-server-dev-all")
endif()

find_package(libpqxx CONFIG REQUIRED)
if(libpqxx_FOUND)
    message(STATUS "Found libpqxx")
else()
    message(FATAL_ERROR "libpqxx not found. On Linux, install with: sudo apt-get install libpqxx-dev")
endif()

find_package(nlohmann_json CONFIG REQUIRED)
if(nlohmann_json_FOUND)
    message(STATUS "Found nlohmann_json")
else()
    message(FATAL_ERROR "nlohmann_json not found. On Linux, install with: sudo apt-get install nlohmann-json3-dev")
endif()

find_package(websocketpp CONFIG REQUIRED)
if(websocketpp_FOUND)
    message(STATUS "Found websocketpp")
else()
    message(FATAL_ERROR "websocketpp not found. On Linux, install with: sudo apt-get install libwebsocketpp-dev")
endif()

find_package(Boost REQUIRED COMPONENTS system thread)
if(Boost_FOUND)
    message(STATUS "Found Boost: ${Boost_VERSION}")
else()
    message(FATAL_ERROR "Boost not found. On Linux, install with: sudo apt-get install libboost-all-dev")
endif()

# Добавляем директории с исходниками и заголовочными файлами
include_directories(${CMAKE_SOURCE_DIR}/include)
include_directories(${CMAKE_SOURCE_DIR}/src)
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
    src/managers/birthday_manager.cpp  # Добавляем новый файл
)

set(HEADERS
    include/db/get.h
    include/db/post.h
    include/db/put.h
    include/db/config.h
    include/db/delete.h
    include/auth/auth_handler.h
    include/auth/user_auth.h
    include/websocket/ws_server.h
    include/managers/birthday_manager.h  # Добавляем новый файл
)

# Создаем исполняемый файл
add_executable(${PROJECT_NAME} ${SOURCES} ${HEADERS})

# Настраиваем включаемые директории
target_include_directories(${PROJECT_NAME} PRIVATE
    ${PostgreSQL_INCLUDE_DIRS}
    ${libpqxx_INCLUDE_DIRS}
    ${WEBSOCKETPP_INCLUDE_DIR}
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

# Если используется asio standalone (рекомендуется)
find_package(Boost REQUIRED COMPONENTS system)
target_link_libraries(${PROJECT_NAME} PRIVATE Boost::system)

# Настройки компилятора в зависимости от ОС
if(MSVC)
    message(STATUS "Configuring MSVC compiler settings...")
    add_compile_options(/W4 /EHsc)
    target_compile_definitions(${PROJECT_NAME} PRIVATE
        _WIN32_WINNT=0x0601
        _CRT_SECURE_NO_WARNINGS
        _SILENCE_ALL_CXX17_DEPRECATION_WARNINGS
        _SILENCE_ALL_MS_EXT_WARNINGS
    )
else()
    message(STATUS "Configuring GCC/Clang compiler settings...")
    add_compile_options(-Wall -Wextra)
endif()

message(STATUS "Build configuration completed successfully")