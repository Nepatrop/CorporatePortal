#include "database.h"
#include <iostream>
#include <fstream>
#include <sstream>

std::string readSqlFile(const std::string& path) {
    std::ifstream file(path);
    std::stringstream buffer;
    buffer << file.rdbuf();
    return buffer.str();
}

int main() {
    Database db("localhost", "5432", "corporate_portal", 
                "postgres", "diploma");
    
    if (!db.initialize()) {
        std::cerr << "Failed to initialize database" << std::endl;
        return 1;
    }

    // Initialize database schema
    std::string initScript = readSqlFile("database/init_db.sql");
    if (!db.executeQuery(initScript)) {
        std::cerr << "Failed to initialize database schema" << std::endl;
        return 1;
    }

    // Загрузим тестовые данные
    std::string testDataScript = readSqlFile("database/test_data.sql");
    if (!db.executeQuery(testDataScript)) {
        std::cerr << "Failed to load test data" << std::endl;
        return 1;
    }

    // Test query (используем нижний регистр)
    auto result = db.executeSelect("SELECT * FROM employees");
    for (const auto& row : result) {
        std::cout << "Employee: " << row["full_name"].as<std::string>() << std::endl;
    }

    return 0;
}