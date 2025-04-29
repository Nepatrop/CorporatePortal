#include "db/connection_pool.h"
#include "db/config.h"
#include <iostream>

ConnectionPool::ConnectionPool() 
    : maxSize(10), isInitialized(false) {
    connectionString = Config::getConnectionString();
}

void ConnectionPool::initializeConnections() {
    std::lock_guard<std::mutex> lock(mutex);
    if (isInitialized) return;

    try {
        while (connections.size() < maxSize) {
            auto conn = std::make_unique<pqxx::connection>(connectionString);
            if (conn->is_open()) {
                connections.push(std::move(conn));
            }
        }
        isInitialized = true;
    } catch (const std::exception& e) {
        std::cerr << "Error initializing connections: " << e.what() << std::endl;
        throw;
    }
}

void ConnectionPool::initialize(size_t size) {
    auto& instance = getInstance();
    instance.maxSize = size;
    instance.initializeConnections();
}

std::unique_ptr<pqxx::connection> ConnectionPool::getConnection() {
    auto& instance = getInstance();
    std::unique_lock<std::mutex> lock(instance.mutex);
    
    instance.condition.wait_for(lock, std::chrono::seconds(5), [&instance] {
        return !instance.connections.empty();
    });

    if (instance.connections.empty()) {
        try {
            auto conn = std::make_unique<pqxx::connection>(instance.connectionString);
            if (conn->is_open()) {
                return conn;
            }
        } catch (const std::exception& e) {
            std::cerr << "Error creating new connection: " << e.what() << std::endl;
            throw std::runtime_error("Could not get database connection");
        }
    }

    auto conn = std::move(instance.connections.front());
    instance.connections.pop();

    try {
        if (!conn->is_open()) {
            conn = std::make_unique<pqxx::connection>(instance.connectionString);
        }
        pqxx::work w(*conn);
        w.exec1("SELECT 1");
        w.commit();
    } catch (const std::exception& e) {
        std::cerr << "Connection validation failed: " << e.what() << std::endl;
        try {
            conn = std::make_unique<pqxx::connection>(instance.connectionString);
        } catch (...) {
            throw std::runtime_error("Could not reestablish database connection");
        }
    }

    return conn;
}

void ConnectionPool::releaseConnection(std::unique_ptr<pqxx::connection> conn) {
    if (!conn) return;

    auto& instance = getInstance();
    try {
        if (!conn->is_open()) {
            conn = std::make_unique<pqxx::connection>(instance.connectionString);
        }
        
        std::lock_guard<std::mutex> lock(instance.mutex);
        if (instance.connections.size() < instance.maxSize) {
            instance.connections.push(std::move(conn));
            instance.condition.notify_one();
        }
    } catch (const std::exception& e) {
        std::cerr << "Error releasing connection: " << e.what() << std::endl;
    }
}
