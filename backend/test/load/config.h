#pragma once
#include <string>

class LoadTestConfig {
private:
    static int requestsPerThread;

public:
    static const int NUM_THREADS = 5;               // Количество потоков
    static const std::string SERVER_URL;            // URL сервера
    static const int REQUEST_TIMEOUT_MS = 10000;    // Таймаут запроса в миллисекундах
    static const bool VERBOSE_OUTPUT = true;        // Выводить ли подробную информацию в консоль
    static const int REQUEST_DELAY_MS = 25;         // Пауза между запросами в миллисекундах
    static const int WARM_UP_REQUESTS = 10;         // Количество разогревающих запросов
    static const int STABILIZATION_DELAY_MS = 2000; // Задержка после разогрева в миллисекундах

    static void setRequestsPerThread(int count) {
        requestsPerThread = count;
    }

    static int getRequestsPerThread() {
        return requestsPerThread;
    }
};

// Initialize static members
const std::string LoadTestConfig::SERVER_URL = "http://localhost:8081";
int LoadTestConfig::requestsPerThread = 20;
