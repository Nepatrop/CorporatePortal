#include <pqxx/pqxx>
#include <iostream>
#include <fstream>
#include <sstream>
#include <vector>
#include <windows.h>

std::string readSqlFile(const std::string& path) {
    std::ifstream file(path);
    std::stringstream buffer;
    buffer << file.rdbuf();
    return buffer.str();
}

void printTableData(pqxx::connection& conn, const std::string& tableName) {
    try {
        pqxx::work txn(conn);
        txn.exec("SET client_encoding TO 'UTF8'");
        
        std::cout << "\n=== " << tableName << " ===" << std::endl;
        
        // Количество
        int count = txn.exec("SELECT COUNT(*) FROM " + txn.quote_name(tableName))[0][0].as<int>();
        std::cout << "Total records: " << count << std::endl;

        // Берем данные
        pqxx::result result = txn.exec("SELECT * FROM " + txn.quote_name(tableName));
        
        if (result.empty()) {
            std::cout << "No data in table" << std::endl;
            return;
        }

        for (const auto& row : result) {
            std::cout << "\nRecord:" << std::endl;
            for (const auto& field : row) {
                std::cout << "  " << field.name() << ": " << field.c_str() << std::endl;
            }
        }
        
        std::cout << "===========================" << std::endl;
        
        txn.commit();
    } catch (const std::exception& e) {
        std::cerr << "Error reading from " << tableName << ": " << e.what() << std::endl;
    }
}

int main() {
    try {
        // Установить вывод консоли в формате UTF-8
        SetConsoleOutputCP(CP_UTF8);
        
        // Подключение к базе данных с явным указанием кодировки
        std::string connectionString = 
            "host=localhost port=5432 dbname=corporate_portal user=postgres password=diploma "
            "client_encoding=UTF8";
        pqxx::connection conn(connectionString);

        if (!conn.is_open()) {
            std::cerr << "Failed to open database" << std::endl;
            return 1;
        }

        std::cout << "Connected to database successfully" << std::endl;

        // Проверяем данные во всех таблицах
        std::vector<std::string> tables = {
            "organizations",
            "departments",
            "locations",
            "employees",
            "news",
            "notifications",
            "links"
        };

        for (const auto& table : tables) {
            printTableData(conn, table);
        }

        return 0;
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }
}