#include "db/put.h"
#include "db/config.h"
#include <pqxx/pqxx>
#include <vector>
#include <string>

// Вспомогательная функция для объединения строк с разделителем
std::string join(const std::vector<std::string>& elements, const std::string& delimiter) {
    if (elements.empty()) return "";
    
    std::string result = elements[0];
    for (size_t i = 1; i < elements.size(); ++i) {
        result += delimiter + elements[i];
    }
    return result;
}

nlohmann::json Put::putEmployeeWithResponse(int employee_id, const nlohmann::json& data) {
    try {
        pqxx::connection conn(Config::getConnectionString());
        pqxx::work txn(conn);
        
        std::vector<std::string> setClauses;
        std::vector<std::string> values;

        // Для каждого поля формируем отдельный SQL запрос, чтобы избежать проблем с параметрами
        if (data.contains("birth_date")) {
            std::string query = "UPDATE employees SET birth_date = $1 WHERE id = $2";
            pqxx::result result = txn.exec_params(query, data["birth_date"].get<std::string>(), employee_id);
            
            if (result.affected_rows() == 0) {
                return {{"success", false}, {"error", "Employee not found"}};
            }
        }

        if (data.contains("full_name")) {
            std::string query = "UPDATE employees SET full_name = $1 WHERE id = $2";
            txn.exec_params(query, data["full_name"].get<std::string>(), employee_id);
        }

        if (data.contains("work_phone")) {
            std::string query = "UPDATE employees SET work_phone = $1 WHERE id = $2";
            txn.exec_params(query, data["work_phone"].get<std::string>(), employee_id);
        }

        txn.commit();
        return {{"success", true}};
    } catch (const std::exception& e) {
        return {{"success", false}, {"error", e.what()}};
    }
}
