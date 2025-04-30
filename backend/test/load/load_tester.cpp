#ifndef _WIN32_WINNT
#define _WIN32_WINNT 0x0601
#endif

#define CPPHTTPLIB_OPENSSL_SUPPORT 0
#define _WINSOCK_DEPRECATED_NO_WARNINGS

// Include order matters for Windows
#ifdef _WIN32
#include <winsock2.h>
#include <ws2tcpip.h>
#pragma comment(lib, "ws2_32.lib")
#endif

#include "httplib.h"
#include "config.h"
#include "metrics.h"
#include <iostream>
#include <thread>
#include <vector>
#include <chrono>
#include <mutex>
#include <iomanip>

class LoadTester {
private:
    Metrics metrics;
    std::mutex console_mutex;
    httplib::Headers headers = {
        {"X-API-Key", "cp_e29b7d8f4a6c2135d9f0"},
        {"Content-Type", "application/json"}
    };

    void runTestThread(const std::string& endpoint) {
        httplib::Client cli(LoadTestConfig::SERVER_URL);
        cli.set_connection_timeout(LoadTestConfig::REQUEST_TIMEOUT_MS);
        cli.set_keep_alive(true);
        
        for (int i = 0; i < LoadTestConfig::getRequestsPerThread(); ++i) {
            auto start = std::chrono::high_resolution_clock::now();
            
            auto res = cli.Get(endpoint.c_str(), headers);
            
            auto end = std::chrono::high_resolution_clock::now();
            double duration = std::chrono::duration<double, std::milli>(end - start).count();

            if (res) {
                metrics.addResponse(duration, res->status);
            } else {
                metrics.addResponse(duration, 0);
            }

            if (LoadTestConfig::VERBOSE_OUTPUT) {
                std::lock_guard<std::mutex> lock(console_mutex);
                // std::cout << std::fixed << std::setprecision(2)
                //          << "Thread " << std::this_thread::get_id() 
                //          << " Request " << i 
                //          << " Status: " << (res ? res->status : 0) 
                //          << " Time: " << duration << "ms\n";
            }
            
            // Добавляем небольшую задержку между запросами
            std::this_thread::sleep_for(std::chrono::milliseconds(LoadTestConfig::REQUEST_DELAY_MS));
        }
    }

    void warmUp(const std::string& endpoint) {
        httplib::Client cli(LoadTestConfig::SERVER_URL);
        cli.set_connection_timeout(LoadTestConfig::REQUEST_TIMEOUT_MS);
        cli.set_keep_alive(true);
        
        std::cout << "Warming up endpoint " << endpoint << "...\n";
        for(int i = 0; i < LoadTestConfig::WARM_UP_REQUESTS; ++i) {
            auto start = std::chrono::high_resolution_clock::now();
            auto res = cli.Get(endpoint.c_str(), headers);
            auto end = std::chrono::high_resolution_clock::now();
            double duration = std::chrono::duration<double, std::milli>(end - start).count();
            
            // std::cout << "Warmup request " << i + 1 << ": " << duration << "ms\n";
            std::this_thread::sleep_for(std::chrono::milliseconds(500));
        }
        std::cout << "Warm up complete.\n";
    }

public:
    void runTest(const std::string& endpoint, const std::string& testName) {
        // Сбрасываем метрики перед каждым тестом
        metrics.reset();

        std::vector<std::thread> threads;

        // Разогрев перед тестом
        warmUp(endpoint);

        metrics.start();

        // Создаем потоки
        for (int i = 0; i < LoadTestConfig::NUM_THREADS; ++i) {
            threads.emplace_back([this, endpoint]() {
                this->runTestThread(endpoint);
            });
        }

        // Ждем завершения всех потоков
        for (auto& thread : threads) {
            thread.join();
        }

        // Выводим результаты
        metrics.printResults(testName);
    }
};

int main() {
    LoadTester tester;
    
    std::cout << "Starting load tests...\n\n";
    
    // Порядок тестов от простого к сложному с указанием количества запросов
    struct TestConfig {
        std::string endpoint;
        std::string name;
        int totalRequests;
    };

    std::vector<TestConfig> tests = {
        {"/api/employees", "Employees Endpoint Test", 510},
        {"/api/news", "News Endpoint Test", 510},
        {"/api/links", "Links Endpoint Test", 510},
        {"/api/departments", "Departments Endpoint Test", 510},
        {"/api/birthdays/upcoming", "Upcoming Birthdays Endpoint Test", 510}
    };
    
    for(const auto& test : tests) {
        std::cout << "\nExecuting test: " << test.name << "\n";
        std::cout << "Endpoint: " << test.endpoint << "\n";
        std::cout << "Total requests planned: " << test.totalRequests << "\n\n";
        
        // Set requests per thread for this test
        LoadTestConfig::setRequestsPerThread(test.totalRequests / LoadTestConfig::NUM_THREADS);
        
        tester.runTest(test.endpoint, test.name);
        
        std::cout << "\nWaiting 5 seconds before next test...\n";
        std::this_thread::sleep_for(std::chrono::seconds(5));
    }

    std::cout << "\nAll tests completed.\n";
    std::cout << "Press Enter to exit...";
    std::cin.get();
    
    return 0;
}
