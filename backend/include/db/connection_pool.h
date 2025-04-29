#pragma once
#include <pqxx/pqxx>
#include <queue>
#include <mutex>
#include <memory>
#include <condition_variable>

class ConnectionPool {
private:
    std::queue<std::unique_ptr<pqxx::connection>> connections;
    std::mutex mutex;
    std::condition_variable condition;
    size_t maxSize;
    std::string connectionString;
    bool isInitialized;

    ConnectionPool();  // Приватный конструктор для синглтона
    void initializeConnections();

    static ConnectionPool& getInstance() {
        static ConnectionPool instance;
        return instance;
    }

public:
    ConnectionPool(const ConnectionPool&) = delete;
    ConnectionPool& operator=(const ConnectionPool&) = delete;

    static void initialize(size_t size = 10);
    static std::unique_ptr<pqxx::connection> getConnection();
    static void releaseConnection(std::unique_ptr<pqxx::connection> conn);
};
