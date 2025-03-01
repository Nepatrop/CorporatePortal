#pragma once

#include <pqxx/pqxx>
#include <memory>
#include <string>

class Database {
public:
    Database(const std::string& host, const std::string& port,
            const std::string& dbname, const std::string& user,
            const std::string& password);
    ~Database(); // Добавляем объявление деструктора
    
    bool initialize();
    bool executeQuery(const std::string& query);
    pqxx::result executeSelect(const std::string& query);

private:
    std::string m_connectionString;
    std::unique_ptr<pqxx::connection> m_connection;
};
