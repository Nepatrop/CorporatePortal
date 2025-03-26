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

nlohmann::json Put::putNews(int news_id, 
                           const std::string& title,
                           const std::string& content,
                           const std::string& image_data,
                           const std::string& image_type) {
    try {
        pqxx::connection conn(Config::getConnectionString());
        pqxx::work txn(conn);

        std::string query;
        if (image_data.empty()) {
            query = "UPDATE news SET title = $1, content = $2 WHERE id = $3 RETURNING id";
            txn.exec_params(query, title, content, news_id);
        } else {
            query = "UPDATE news SET title = $1, content = $2, image_data = decode($3, 'base64'), image_type = $4 WHERE id = $5 RETURNING id";
            txn.exec_params(query, title, content, image_data, image_type, news_id);
        }

        txn.commit();

        // Получаем обновленную новость
        pqxx::work txn2(conn);
        auto news = txn2.exec_params(R"(
            SELECT 
                n.*, 
                e.full_name as author_name,
                CASE 
                    WHEN n.image_data IS NOT NULL 
                    THEN encode(n.image_data, 'base64') 
                    ELSE NULL 
                END as image_data,
                TO_CHAR(n.publication_time AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as publication_time
            FROM news n 
            LEFT JOIN employees e ON n.author_id = e.id 
            WHERE n.id = $1
        )", news_id);

        if (!news.empty()) {
            nlohmann::json response = {
                {"id", news[0]["id"].as<int>()},
                {"title", news[0]["title"].as<std::string>()},
                {"content", news[0]["content"].as<std::string>()},
                {"publication_time", news[0]["publication_time"].as<std::string>()},
                {"author_name", news[0]["author_name"].as<std::string>()}
            };

            if (!news[0]["image_data"].is_null()) {
                response["image_data"] = news[0]["image_data"].as<std::string>();
                response["image_type"] = news[0]["image_type"].as<std::string>();
            }

            return response;
        }
        throw std::runtime_error("News not found after update");
    } catch (const std::exception& e) {
        return {{"success", false}, {"error", e.what()}};
    }
}

nlohmann::json Put::pinNews(int news_id, bool should_pin) {
    try {
        pqxx::connection conn(Config::getConnectionString());
        pqxx::work txn(conn);

        txn.exec_params(
            "UPDATE news SET is_pinned = $1 WHERE id = $2",
            should_pin,
            news_id
        );

        txn.commit();
        return {{"success", true}};
    } catch (const std::exception& e) {
        return {{"success", false}, {"error", e.what()}};
    }
}
