#include "database.h"
#include <iostream>

Database::Database(const std::string& host, const std::string& port,
                 const std::string& dbname, const std::string& user,
                 const std::string& password) {
    m_connectionString = "host=" + host + " port=" + port +
                        " dbname=" + dbname + " user=" + user +
                        " password=" + password;
}

Database::~Database() = default;

bool Database::initialize() {
    try {
        m_connection = std::make_unique<pqxx::connection>(m_connectionString);
        return m_connection->is_open();
    } catch (const std::exception& e) {
        std::cerr << "Connection error: " << e.what() << std::endl;
        return false;
    }
}

bool Database::executeQuery(const std::string& query) {
    try {
        pqxx::work txn(*m_connection);
        txn.exec(query);
        txn.commit();
        return true;
    } catch (const std::exception& e) {
        std::cerr << "Query error: " << e.what() << std::endl;
        return false;
    }
}

pqxx::result Database::executeSelect(const std::string& query) {
    try {
        pqxx::work txn(*m_connection);
        pqxx::result result = txn.exec(query);
        txn.commit();
        return result;
    } catch (const std::exception& e) {
        std::cerr << "Query error: " << e.what() << std::endl;
        return pqxx::result();
    }
}
