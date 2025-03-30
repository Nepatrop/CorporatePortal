#include "db/put.h"
#include "db/config.h"
#include <pqxx/pqxx>
#include <vector>
#include <string>
#include "../../include/websocket/ws_server.h"

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

nlohmann::json Put::updateNews(int news_id, 
                             const std::string& title,
                             const std::string& content,
                             const std::string& image_data,
                             const std::string& image_type) {
    try {
        pqxx::connection conn(Config::getConnectionString());
        pqxx::work txn(conn);
        
        // Проверяем существование новости
        auto check = txn.exec_params("SELECT id FROM news WHERE id = $1", news_id);
        if (check.empty()) {
            return {{"error", "News not found"}};
        }

        if (image_data == "null") {
            // Если передан специальный маркер "null", удаляем изображение
            txn.exec_params(
                "UPDATE news SET title = $1, content = $2, image_data = NULL, image_type = NULL WHERE id = $3",
                title, content, news_id
            );
        } else if (image_data.empty()) {
            // Если image_data пустое, оставляем старое изображение
            txn.exec_params(
                "UPDATE news SET title = $1, content = $2 WHERE id = $3",
                title, content, news_id
            );
        } else {
            // Обновляем все поля включая изображение
            txn.exec_params(
                "UPDATE news SET title = $1, content = $2, image_data = decode($3, 'base64'), image_type = $4 WHERE id = $5",
                title, content, image_data, image_type, news_id
            );
        }
        
        // Получаем обновленную новость
        auto result = txn.exec_params(R"(
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

        txn.commit();

        nlohmann::json response = {
            {"id", result[0]["id"].as<int>()},
            {"title", result[0]["title"].as<std::string>()},
            {"content", result[0]["content"].as<std::string>()},
            {"publication_time", result[0]["publication_time"].as<std::string>()},
            {"author_name", result[0]["author_name"].as<std::string>()}
        };

        if (!result[0]["image_data"].is_null()) {
            response["image_data"] = result[0]["image_data"].as<std::string>();
            response["image_type"] = result[0]["image_type"].as<std::string>();
        }

        // Отправляем только одно сообщение WebSocket в правильном формате
        nlohmann::json wsMessage = {
            {"type", "news_updated"},
            {"data", response}
        };
        WebSocketServer::getInstance().broadcast(wsMessage.dump());

        return response;
    } catch (const std::exception& e) {
        return {{"error", e.what()}};
    }
}
