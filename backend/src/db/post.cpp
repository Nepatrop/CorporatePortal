#include "db/post.h"
#include "db/config.h"
#include "managers/birthday_manager.h"
#include <pqxx/pqxx>
#include <iostream>
#include "../../include/websocket/ws_server.h"

bool Post::postOrganization(const nlohmann::json& data) {
    try {
        pqxx::connection conn(Config::getConnectionString());
        pqxx::work txn(conn);
        txn.exec_params(
            "INSERT INTO organizations (name) VALUES ($1)",
            data["name"].get<std::string>()
        );
        txn.commit();
        return true;
    } catch (std::exception const& e) {
        return false;
    }
}

bool Post::postDepartment(const nlohmann::json& data) {
    try {
        pqxx::connection conn(Config::getConnectionString());
        pqxx::work txn(conn);

        // Получаем ID организации по имени
        pqxx::result org_result = txn.exec_params(
            "SELECT id FROM organizations WHERE name = $1",
            data["organization"].get<std::string>()
        );
        if (org_result.empty()) {
            std::cerr << "Organization not found" << std::endl;
            return false;
        }
        std::string organization_id = org_result[0][0].as<std::string>();

        txn.exec_params(
            "INSERT INTO departments (name, organization_id, department_code, parent_department_code) "
            "VALUES ($1, $2, $3, $4)",
            data["department"].get<std::string>(),
            organization_id,
            data["department_code"].get<std::string>(),
            data["parent_department_code"].get<std::string>().empty() ? nullptr : data["parent_department_code"].get<std::string>()
        );
        txn.commit();
        return true;
    } catch (std::exception const& e) {
        std::cerr << "Error creating department: " << e.what() << std::endl;
        return false;
    }
}

bool Post::postLocation(const nlohmann::json& data) {
    try {
        pqxx::connection conn(Config::getConnectionString());
        pqxx::work txn(conn);
        txn.exec_params(
            "INSERT INTO locations (name) VALUES ($1)",
            data["name"].get<std::string>()
        );
        txn.commit();
        return true;
    } catch (std::exception const& e) {
        return false;
    }
}

bool Post::postEmployee(const nlohmann::json& data) {
    try {
        pqxx::connection conn(Config::getConnectionString());
        pqxx::work txn(conn);

        // Получаем ID организации по имени
        pqxx::result org_result = txn.exec_params(
            "SELECT id FROM organizations WHERE name = $1",
            data["organization"].get<std::string>()
        );
        if (org_result.empty()) {
            std::cerr << "Organization not found" << std::endl;
            return false;
        }
        std::string organization_id = org_result[0][0].as<std::string>();

        // Получаем ID отдела по имени
        pqxx::result dept_result = txn.exec_params(
            "SELECT id FROM departments WHERE name = $1",
            data["department"].get<std::string>()
        );
        if (dept_result.empty()) {
            std::cerr << "Department not found" << std::endl;
            return false;
        }
        std::string department_id = dept_result[0][0].as<std::string>();

        // Получаем ID локации по имени
        pqxx::result loc_result = txn.exec_params(
            "SELECT id FROM locations WHERE name = $1",
            data["location"].get<std::string>()
        );
        if (loc_result.empty()) {
            std::cerr << "Location not found" << std::endl;
            return false;
        }
        std::string location_id = loc_result[0][0].as<std::string>();

        // Получаем ID менеджера по personnel_number
        std::string manager_id = "NULL";
        if (!data["manager"].get<std::string>().empty()) {
            pqxx::result mgr_result = txn.exec_params(
                "SELECT id FROM employees WHERE personnel_number = $1",
                data["manager"].get<std::string>()
            );
            if (!mgr_result.empty()) {
                manager_id = mgr_result[0][0].as<std::string>();
            }
        }

        // Выполняем вставку сотрудника
        txn.exec_params(
            "INSERT INTO employees ("
            "full_name, physical_person_name, organization_id, department_id, "
            "position, personnel_number, dismissal_date, service, can_help_with, "
            "responsibilities, makes_decisions, is_dismissed, work_phone, "
            "location_id, birth_date, is_admin"
            ") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, "
            "$13, $14, $15, $16)",
            data["employee"].get<std::string>(),
            data["physical_person"].get<std::string>(),
            organization_id,
            department_id,
            data["position"].get<std::string>(),
            data["personnel_number"].get<std::string>(),
            data["dismissal_date"].get<std::string>().empty() ? nullptr : data["dismissal_date"].get<std::string>(),
            data["service"].get<std::string>(),
            data["can_help_with"].get<std::string>(),
            data["responsibilities"].get<std::string>(),
            data["makes_decisions"].get<std::string>(),
            data["is_dismissed"].get<std::string>() == "t",
            data["work_phone"].get<std::string>(),
            location_id,
            data["birth_date"].get<std::string>(),
            data["is_admin"].get<std::string>() == "t"
        );

        // Если есть manager_id, обновляем его отдельным запросом
        if (manager_id != "NULL") {
            pqxx::result emp_result = txn.exec("SELECT lastval()");
            std::string employee_id = emp_result[0][0].as<std::string>();
            txn.exec_params(
                "UPDATE employees SET manager_id = $1 WHERE id = $2",
                manager_id, employee_id
            );
        }

        txn.commit();
        
        // Обновляем список дней рождений после успешного создания сотрудника
        try {
            BirthdayManager::getInstance().forceUpdate();
            std::cout << "Birthday list updated after creating new employee" << std::endl;
        } catch (const std::exception& e) {
            std::cerr << "Error updating birthday list: " << e.what() << std::endl;
        }
        
        return true;
    } catch (std::exception const& e) {
        std::cerr << "Error creating employee: " << e.what() << std::endl;
        return false;
    }
}

bool Post::postNews(const nlohmann::json& data) {
    try {
        pqxx::connection conn(Config::getConnectionString());
        pqxx::work txn(conn);

        // Получаем ID автора по имени
        pqxx::result author_result = txn.exec_params(
            "SELECT id FROM employees WHERE full_name = $1",
            data["author_name"].get<std::string>()
        );
        if (author_result.empty()) {
            std::cerr << "Author not found" << std::endl;
            return false;
        }
        std::string author_id = author_result[0][0].as<std::string>();

        txn.exec_params(
            "INSERT INTO news (content, publication_time, author_id) VALUES ($1, NOW(), $2)",
            data["content"].get<std::string>(),
            author_id
        );
        txn.commit();
        return true;
    } catch (std::exception const& e) {
        std::cerr << "Error creating news: " << e.what() << std::endl;
        return false;
    }
}

void broadcastNewsUpdate(const nlohmann::json& newsData) {
    try {
        nlohmann::json wsMessage = {
            {"type", "news_updated"},
            {"data", newsData}
        };
        std::string message = wsMessage.dump();
        WebSocketServer::getInstance().broadcast(message);
    } catch (const std::exception& e) {
        std::cerr << "Error in broadcastNewsUpdate: " << e.what() << std::endl;
    }
}

nlohmann::json Post::postNewsWithImage(
    const std::string& title,
    const std::string& content,
    const std::string& author_id,
    const std::string& image_data,
    const std::string& image_type
) {
    try {
        pqxx::connection conn(Config::getConnectionString());
        pqxx::work txn(conn);

        pqxx::result r;
        if (!image_data.empty() && !image_type.empty()) {
            // Если есть изображение, сохраняем его как BYTEA
            r = txn.exec_params(
                "INSERT INTO news (title, content, author_id, image_data, image_type) "
                "VALUES ($1, $2, $3, decode($4, 'base64'), $5) "
                "RETURNING id, title, content, author_id, "
                "encode(image_data, 'base64') as image_data, image_type",
                title, content, author_id, image_data, image_type
            );
        } else {
            // Если изображения нет, сохраняем только текстовые данные
            r = txn.exec_params(
                "INSERT INTO news (title, content, author_id) "
                "VALUES ($1, $2, $3) "
                "RETURNING id, title, content, author_id",
                title, content, author_id
            );
        }

        txn.commit();

        nlohmann::json result = nlohmann::json::object();
        for (const auto& field : r[0]) {
            if (!field.is_null()) {
                result[field.name()] = field.as<std::string>();
            }
        }
        return result;

    } catch (const std::exception& e) {
        return nlohmann::json{{"error", e.what()}};
    }
}

bool Post::postNotification(const nlohmann::json& data) {
    try {
        pqxx::connection conn(Config::getConnectionString());
        pqxx::work txn(conn);

        // Получаем ID сотрудника по имени
        pqxx::result emp_result = txn.exec_params(
            "SELECT id FROM employees WHERE full_name = $1",
            data["employee_name"].get<std::string>()
        );
        if (emp_result.empty()) {
            std::cerr << "Employee not found" << std::endl;
            return false;
        }
        std::string employee_id = emp_result[0][0].as<std::string>();

        txn.exec_params(
            "INSERT INTO notifications (message, time, source, employee_id) VALUES ($1, NOW(), $2, $3)",
            data["message"].get<std::string>(),
            data["source"].get<std::string>(),
            employee_id
        );
        txn.commit();
        return true;
    } catch (std::exception const& e) {
        std::cerr << "Error creating notification: " << e.what() << std::endl;
        return false;
    }
}

bool Post::postLink(const nlohmann::json& data) {
    try {
        pqxx::connection conn(Config::getConnectionString());
        pqxx::work txn(conn);
        txn.exec_params(
            "INSERT INTO links (url, description) VALUES ($1, $2)",
            data["url"].get<std::string>(),
            data.contains("description") ? data["description"].get<std::string>() : nullptr
        );
        txn.commit();
        return true;
    } catch (std::exception const& e) {
        return false;
    }
}

nlohmann::json Post::postNewsComment(int news_id, int employee_id, const std::string& text) {
    try {
        pqxx::connection conn(Config::getConnectionString());
        pqxx::work txn(conn);

        // Добавляем проверку корректности ID
        if (news_id <= 0 || employee_id <= 0) {
            throw std::runtime_error("Invalid ID values");
        }

        // Проверяем существование новости
        auto news_check = txn.exec_params("SELECT id FROM news WHERE id = $1", news_id);
        if (news_check.empty()) {
            throw std::runtime_error("News not found");
        }

        // Проверяем существование сотрудника
        auto emp_check = txn.exec_params("SELECT id FROM employees WHERE id = $1", employee_id);
        if (emp_check.empty()) {
            throw std::runtime_error("Employee not found");
        }

        txn.exec0("SET TIME ZONE 'UTC';");

        auto result = txn.exec_params(R"(
            WITH new_comment AS (
                INSERT INTO news_comments (news_id, employee_id, text, created_at)
                VALUES ($1, $2, $3, NOW())
                RETURNING id, text, created_at
            )
            SELECT 
                nc.id,
                nc.text,
                TO_CHAR(nc.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
                e.full_name as author
            FROM new_comment nc
            JOIN employees e ON e.id = $2
        )", news_id, employee_id, text);

        txn.commit();

        if (!result.empty()) {
            nlohmann::json response = {
                {"id", result[0]["id"].as<int>()},
                {"text", result[0]["text"].as<std::string>()},
                {"author", result[0]["author"].as<std::string>()},
                {"created_at", result[0]["created_at"].as<std::string>()}
            };

            // Отправляем только одно сообщение WebSocket в правильном формате
            nlohmann::json wsMessage = {
                {"type", "comment_added"},
                {"data", response},
                {"newsId", news_id}
            };
            WebSocketServer::getInstance().broadcast(wsMessage.dump());

            return response;
        }
        throw std::runtime_error("Failed to create comment");
    } catch (const std::exception& e) {
        std::cerr << "Error in postNewsComment: " << e.what() << std::endl;
        throw;
    }
}

nlohmann::json Post::toggleNewsLike(int news_id, int employee_id) {
    try {
        if (news_id <= 0 || employee_id <= 0) {
            throw std::runtime_error("Invalid ID values");
        }

        pqxx::connection conn(Config::getConnectionString());
        pqxx::work txn(conn);

        // Проверяем существование новости
        auto news_check = txn.exec_params("SELECT id FROM news WHERE id = $1", news_id);
        if (news_check.empty()) {
            throw std::runtime_error("News not found");
        }

        // Проверяем существование сотрудника
        auto emp_check = txn.exec_params("SELECT id FROM employees WHERE id = $1", employee_id);
        if (emp_check.empty()) {
            throw std::runtime_error("Employee not found");
        }

        auto check_result = txn.exec_params(
            "SELECT id FROM news_likes WHERE news_id = $1 AND employee_id = $2",
            news_id, employee_id
        );

        bool isLiked;
        if (check_result.empty()) {
            txn.exec_params(
                "INSERT INTO news_likes (news_id, employee_id) VALUES ($1, $2)",
                news_id, employee_id
            );
            isLiked = true;
        } else {
            txn.exec_params(
                "DELETE FROM news_likes WHERE news_id = $1 AND employee_id = $2",
                news_id, employee_id
            );
            isLiked = false;
        }

        // Получаем обновленное количество лайков
        auto likes_count = txn.exec_params(
            "SELECT COUNT(*) as count FROM news_likes WHERE news_id = $1",
            news_id
        )[0]["count"].as<int>();

        txn.commit();

        nlohmann::json response = {
            {"success", true},
            {"action", isLiked ? "liked" : "unliked"},
            {"likes_count", likes_count}
        };

        // Отправляем WebSocket сообщение
        nlohmann::json wsMessage = {
            {"type", "likes_updated"},
            {"data", {
                {"news_id", news_id},
                {"likes_count", likes_count}
            }}
        };
        WebSocketServer::getInstance().broadcast(wsMessage.dump());

        return response;
    } catch (const std::exception& e) {
        std::cerr << "Error in toggleNewsLike: " << e.what() << std::endl;
        throw;
    }
}

nlohmann::json Post::createPortal(
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

        // Подготавливаем базовый запрос
        std::string query = "INSERT INTO links (name, description, url, icon_data, icon_type, icon_emoji) VALUES (";
        
        if (!icon_data.empty() && !icon_type.empty()) {
            // Если есть изображение
            auto result = txn.exec_params(
                query + "$1, $2, $3, decode($4, 'base64'), $5, NULL) "
                "RETURNING id, name, description, url, encode(icon_data, 'base64') as icon_data, icon_type",
                name, description, url, icon_data, icon_type
            );
            txn.commit();
            
            nlohmann::json response = {
                {"id", result[0]["id"].as<int>()},
                {"name", result[0]["name"].as<std::string>()},
                {"description", result[0]["description"].as<std::string>()},
                {"url", result[0]["url"].as<std::string>()},
                {"icon_data", result[0]["icon_data"].as<std::string>()},
                {"icon_type", result[0]["icon_type"].as<std::string>()}
            };
            return response;
        } else if (!icon_emoji.empty()) {
            // Если есть эмодзи
            auto result = txn.exec_params(
                query + "$1, $2, $3, NULL, NULL, $4) "
                "RETURNING id, name, description, url, icon_emoji",
                name, description, url, icon_emoji
            );
            txn.commit();
            
            nlohmann::json response = {
                {"id", result[0]["id"].as<int>()},
                {"name", result[0]["name"].as<std::string>()},
                {"description", result[0]["description"].as<std::string>()},
                {"url", result[0]["url"].as<std::string>()},
                {"icon_emoji", result[0]["icon_emoji"].as<std::string>()}
            };
            return response;
        } else {
            // Без иконки
            auto result = txn.exec_params(
                query + "$1, $2, $3, NULL, NULL, NULL) "
                "RETURNING id, name, description, url",
                name, description, url
            );
            txn.commit();
            
            nlohmann::json response = {
                {"id", result[0]["id"].as<int>()},
                {"name", result[0]["name"].as<std::string>()},
                {"description", result[0]["description"].as<std::string>()},
                {"url", result[0]["url"].as<std::string>()}
            };
            return response;
        }
    } catch (const std::exception& e) {
        return nlohmann::json{{"error", std::string("Error creating portal: ") + e.what()}};
    }
}