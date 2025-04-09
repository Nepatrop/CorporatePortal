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
        
        // Обновляем запрос для получения обновленной новости
        auto result = txn.exec_params(R"(
            SELECT 
                n.*, 
                e.full_name as author_name,
                CASE 
                    WHEN n.image_data IS NOT NULL 
                    THEN encode(n.image_data, 'base64') 
                    ELSE NULL 
                END as image_data,
                TO_CHAR(n.publication_time AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as publication_time,
                n.is_pinned,
                n.pin_order
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
            {"author_name", result[0]["author_name"].as<std::string>()},
            {"is_pinned", result[0]["is_pinned"].as<bool>()}
        };

        // Добавляем pin_order
        if (result[0]["is_pinned"].as<bool>() && !result[0]["pin_order"].is_null()) {
            response["pin_order"] = result[0]["pin_order"].as<int>();
        } else {
            response["pin_order"] = nlohmann::json::value_t::null;
        }

        // Добавляем изображение, если оно есть
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

nlohmann::json Put::toggleNewsPin(int news_id, bool should_pin) {
    try {
        pqxx::connection conn(Config::getConnectionString());
        pqxx::work txn(conn);

        if (should_pin) {
            // Проверяем количество закрепленных новостей
            auto pinned_count = txn.exec1("SELECT COUNT(*) FROM news WHERE is_pinned = true")[0].as<int>();
            if (pinned_count >= 3) {
                txn.abort();
                return {
                    {"success", false}, 
                    {"error", "Maximum number of pinned news (3) reached"}
                };
            }

            // Получаем следующий pin_order
            auto max_order = txn.exec1("SELECT COALESCE(MAX(pin_order), 0) FROM news WHERE is_pinned = true")[0].as<int>();
            
            // Закрепляем новость
            txn.exec_params(
                "UPDATE news SET is_pinned = true, pin_order = $1 WHERE id = $2",
                max_order + 1, news_id
            );
        } else {
            // Получаем текущий pin_order новости
            auto current_order = txn.exec_params1(
                "SELECT pin_order FROM news WHERE id = $1",
                news_id
            )[0].as<int>();

            // Открепляем новость
            txn.exec_params(
                "UPDATE news SET is_pinned = false, pin_order = NULL WHERE id = $1",
                news_id
            );

            // Обновляем порядок оставшихся закрепленных новостей
            txn.exec_params(
                "UPDATE news SET pin_order = pin_order - 1 "
                "WHERE is_pinned = true AND pin_order > $1",
                current_order
            );
        }

        auto updatedNews = txn.exec_params1(R"(
            SELECT id, is_pinned, pin_order, 
                   TO_CHAR(publication_time, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as publication_time
            FROM news 
            WHERE id = $1
        )", news_id);

        txn.commit();

        nlohmann::json pin_order_value = nullptr;
        if (updatedNews["is_pinned"].as<bool>()) {
            pin_order_value = updatedNews["pin_order"].as<int>();
        }

        nlohmann::json wsMessage = {
            {"type", "news_pin_updated"},
            {"data", {
                {"news_id", news_id},
                {"is_pinned", updatedNews["is_pinned"].as<bool>()},
                {"pin_order", pin_order_value}
            }}
        };
        WebSocketServer::getInstance().broadcast(wsMessage.dump());

        return {{"success", true}};
    } catch (const std::exception& e) {
        std::cerr << "Error toggling news pin: " << e.what() << std::endl;
        return {{"success", false}, {"error", e.what()}};
    }
}

nlohmann::json Put::updatePortal(
    int id,
    const std::string& name,
    const std::string& description,
    const std::string& url,
    const std::string& icon_data,
    const std::string& icon_type,
    const std::string& icon_emoji
) {
    try {
        pqxx::connection conn(Config::getConnectionString());
        pqxx::work txn(conn);

        pqxx::result result;
        if (!icon_data.empty() && !icon_type.empty()) {
            // Если предоставлено новое изображение
            result = txn.exec_params(
                "UPDATE links SET "
                "name = $1, description = $2, url = $3, "
                "icon_data = decode($4, 'base64'), icon_type = $5, "
                "icon_emoji = NULL, updated_at = CURRENT_TIMESTAMP "
                "WHERE id = $6 "
                "RETURNING id, name, description, url, "
                "encode(icon_data, 'base64') as icon_data, icon_type",
                name, description, url, icon_data, icon_type, id
            );
        } else if (!icon_emoji.empty()) {
            // Если предоставлен эмодзи
            result = txn.exec_params(
                "UPDATE links SET "
                "name = $1, description = $2, url = $3, "
                "icon_emoji = $4, icon_data = NULL, icon_type = NULL, "
                "updated_at = CURRENT_TIMESTAMP "
                "WHERE id = $5 "
                "RETURNING id, name, description, url, icon_emoji",
                name, description, url, icon_emoji, id
            );
        } else {
            // Обновляем только текстовые поля, сохраняя существующую иконку
            result = txn.exec_params(
                "UPDATE links SET "
                "name = $1, description = $2, url = $3, "
                "updated_at = CURRENT_TIMESTAMP "
                "WHERE id = $4 "
                "RETURNING id, name, description, url, "
                "encode(icon_data, 'base64') as icon_data, icon_type, icon_emoji",
                name, description, url, id
            );
        }

        txn.commit();

        if (result.empty()) {
            return {{"error", "Portal not found"}};
        }

        nlohmann::json response;
        for (const auto& field : result[0]) {
            if (!field.is_null()) {
                response[field.name()] = field.as<std::string>();
            }
        }
        return response;

    } catch (const std::exception& e) {
        return {{"error", std::string("Error updating portal: ") + e.what()}};
    }
}
