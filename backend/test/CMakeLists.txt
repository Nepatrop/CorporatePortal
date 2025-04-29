cmake_minimum_required(VERSION 3.10)
project(corporate_portal_tests)

# Устанавливаем стандарт C++20
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Отключаем поддержку SSL для cpp-httplib
add_definitions(
    -DCPPHTTPLIB_OPENSSL_SUPPORT=0
    -DCPPHTTPLIB_USE_POLL=0
)

# Windows-specific settings
if(WIN32)
    # Настройки Windows
    add_definitions(
        -D_WIN32_WINNT=0x0601
        -DNOMINMAX
        -DWIN32_LEAN_AND_MEAN
        -D_CRT_SECURE_NO_WARNINGS
    )
endif()

# Source files
set(TEST_SOURCES
    ${CMAKE_CURRENT_SOURCE_DIR}/load/load_tester.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/load/metrics.cpp
)

# Create executable
add_executable(load_test ${TEST_SOURCES})

# Include directories with absolute paths
target_include_directories(load_test PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/load
    ${CMAKE_CURRENT_SOURCE_DIR}/../thirdparty/cpp-httplib
)

# Windows-specific libraries and compiler options
if(MSVC)
    target_compile_options(load_test PRIVATE 
        /W4 
        /wd4996
        /MP
    )
    target_link_libraries(load_test PRIVATE 
        ws2_32
        wsock32
        crypt32
        mswsock
        secur32
    )
endif()

message(STATUS "Build configuration completed")
