#include "auth/user_auth.h"
#include "db/config.h"
#include <pqxx/pqxx>
#include <cstring>
#include <iostream>

bool UserAuth::validateCredentials(const std::string& personnel_number, const std::string& password) {
    try {
        pqxx::connection conn(Config::getConnectionString());
        pqxx::work txn(conn);
        
        // Проверяем существует ли такой табельный номер
        auto result = txn.exec_params(
            "SELECT ua.password_hash, ua.is_active "
            "FROM user_auth ua "
            "WHERE ua.personnel_number = $1",
            personnel_number
        );

        if (result.empty() || !result[0]["is_active"].as<bool>()) {
            return false;
        }

        bool valid = (password == result[0]["password_hash"].as<std::string>());
        
        if (valid) {
            txn.exec_params(
                "UPDATE user_auth SET last_login = CURRENT_TIMESTAMP WHERE personnel_number = $1",
                personnel_number
            );
            txn.commit();
        }
        return valid;
    } catch (const std::exception& e) {
        return false;
    }
}

nlohmann::json UserAuth::getUserData(const std::string& personnel_number) {
    try {
        pqxx::connection conn(Config::getConnectionString());
        pqxx::work txn(conn);
        
        auto result = txn.exec_params(
            "SELECT e.* "
            "FROM employees e "
            "JOIN user_auth ua ON e.personnel_number = ua.personnel_number "
            "WHERE e.personnel_number = $1",
            personnel_number
        );

        if (result.empty()) {
            return nlohmann::json::object();
        }

        nlohmann::json userData = nlohmann::json::object();
        for (const auto& field : result[0]) {
            if (!field.is_null()) {
                userData[field.name()] = field.as<std::string>();
            }
        }
        return userData;
    } catch (const std::exception& e) {
        return nlohmann::json::object();
    }
}

bool UserAuth::createUser(const nlohmann::json& userData) {
    try {
        pqxx::connection conn(Config::getConnectionString());
        pqxx::work txn(conn);

        // Проверяем не занят ли табельный номер
        auto check_result = txn.exec_params(
            "SELECT COUNT(*) FROM employees WHERE personnel_number = $1",
            userData["personnel_number"].get<std::string>()
        );

        if (check_result[0][0].as<int>() > 0) {
            throw std::runtime_error("Personnel number already exists");
        }

        // Получаем ID департамента
        pqxx::result dept_id = txn.exec_params(
            "SELECT id FROM departments WHERE name = $1",
            userData["department"].get<std::string>()
        );

        if (dept_id.empty()) {
            throw std::runtime_error("Department not found");
        }

        // Создаем запись сотрудника
        pqxx::result emp_result = txn.exec_params(
            "INSERT INTO employees ("
            "full_name, physical_person_name, organization_id, department_id, "
            "position, personnel_number, work_phone, birth_date, is_admin"
            ") VALUES ($1, $1, 1, $2, $3, $4, $5, $6, false) RETURNING id",
            userData["full_name"].get<std::string>(),
            dept_id[0][0].as<int>(),
            userData["position"].get<std::string>(),
            userData["personnel_number"].get<std::string>(),
            userData["work_phone"].get<std::string>(),
            userData["birth_date"].get<std::string>()
        );

        if (emp_result.empty()) {
            throw std::runtime_error("Failed to create employee");
        }

        // Создаем учетную запись пользователя
        txn.exec_params(
            "INSERT INTO user_auth ("
            "personnel_number, password_hash, employee_id, is_active"
            ") VALUES ($1, $2, $3, true)",
            userData["personnel_number"].get<std::string>(),
            userData["password"].get<std::string>(),
            emp_result[0][0].as<int>()
        );

        txn.commit();
        return true;
    } catch (const std::exception& e) {
        std::cerr << "Error creating user: " << e.what() << std::endl;
        return false;
    }
}

std::string UserAuth::hashPassword(const std::string& password) {
    // TODO: Реализовать безопасное хеширование паролей
    return password;
}

bool UserAuth::verifyPassword(const std::string& password, const std::string& hash) {
    // TODO: Реализовать безопасную проверку паролей
    return password == hash;
}
