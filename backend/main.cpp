#include "httplib.h"
#include "db/get.h"
#include "db/post.h"
#include "db/delete.h"
#include "db/put.h"
#include "db/config.h"
#include "auth/user_auth.h"
#include "auth/auth_handler.h"
#include "websocket/ws_server.h"
#include "managers/birthday_manager.h"
#include <thread>

int main() {
    // Инициализируем BirthdayManager при запуске сервера
    try {
        BirthdayManager::getInstance();
    } catch (const std::exception& e) {
        std::cerr << "Error initializing BirthdayManager: " << e.what() << std::endl;
    }

    // Запускаем WebSocket сервер в отдельном потоке
    std::thread ws_thread([]() {
        try {
            WebSocketServer::getInstance().run(8082); // WebSocket на порту 8082
        } catch (const std::exception& e) {
            std::cerr << "WebSocket thread error: " << e.what() << std::endl;
        }
    });
    ws_thread.detach();

    httplib::Server svr;

    // Middleware для проверки аутентификации
    svr.set_pre_routing_handler(
        [](const httplib::Request& req, httplib::Response& res) -> httplib::Server::HandlerResponse {
            // Пропускаем OPTIONS запросы
            if (req.method == "OPTIONS") return httplib::Server::HandlerResponse::Unhandled;

            // Проверяем аутентификацию для всех остальных запросов
            if (!AuthHandler::validateAuth(req)) {
                res.status = 401;
                res.set_content(R"({"error": "Unauthorized"})", "application/json");
                return httplib::Server::HandlerResponse::Handled;
            }
            return httplib::Server::HandlerResponse::Unhandled;
        }
    );

    // Разрешаем CORS для всех клиентов в локальной сети
    svr.set_default_headers({
        {"Access-Control-Allow-Origin", "*"},
        {"Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS"},
        {"Access-Control-Allow-Headers", "Content-Type, X-API-Key"},
        {"Access-Control-Max-Age", "86400"} // Кэширование preflight запросов на 24 часа
    });

    svr.Options(R"(/.*)", [](const httplib::Request&, httplib::Response& res) {
        res.status = 204; // No Content
    });

    // GET endpoints
    svr.Get("/api/news", [](const httplib::Request& req, httplib::Response& res) {
        // Получаем current_user_id из параметров запроса
        int currentUserId = 0;
        try {
            auto userId = req.get_param_value("current_user_id");
            if (!userId.empty()) {
                currentUserId = std::stoi(userId);
            }
        } catch (...) {
            // Игнорируем ошибки преобразования
        }
        res.set_content(Get::getNewsWithDetails(currentUserId).dump(), "application/json");
    });

    svr.Get("/api/organizations", [](const httplib::Request&, httplib::Response& res) {
        res.set_content(Get::getOrganizations().dump(), "application/json");
    });

    svr.Get("/api/departments", [](const httplib::Request&, httplib::Response& res) {
        res.set_content(Get::getDepartments().dump(), "application/json");
    });

    svr.Get("/api/locations", [](const httplib::Request&, httplib::Response& res) {
        res.set_content(Get::getLocations().dump(), "application/json");
    });

    svr.Get("/api/employees", [](const httplib::Request& req, httplib::Response& res) {
        auto personnel_number = req.get_param_value("personnel_number");
        if (!personnel_number.empty()) {
            res.set_content(Get::getEmployeeByPersonnelNumber(personnel_number).dump(), "application/json");
        } else {
            res.set_content(Get::getEmployees().dump(), "application/json");
        }
    });

    svr.Get("/api/notifications", [](const httplib::Request&, httplib::Response& res) {
        res.set_content(Get::getNotifications().dump(), "application/json");
    });

    svr.Get("/api/links", [](const httplib::Request&, httplib::Response& res) {
        res.set_content(Get::getLinks().dump(), "application/json");
    });

    svr.Get("/api/birthdays/upcoming", [](const httplib::Request&, httplib::Response& res) {
        res.set_content(Get::getUpcomingBirthdays().dump(), "application/json");
    });

    // POST endpoints
    svr.Post("/api/organizations", [](const httplib::Request& req, httplib::Response& res) {
        auto json = nlohmann::json::parse(req.body);
        bool success = Post::postOrganization(json);
        res.set_content(nlohmann::json({{"success", success}}).dump(), "application/json");
    });

    svr.Post("/api/departments", [](const httplib::Request& req, httplib::Response& res) {
        auto json = nlohmann::json::parse(req.body);
        bool success = Post::postDepartment(json);
        res.set_content(nlohmann::json({{"success", success}}).dump(), "application/json");
    });

    svr.Post("/api/locations", [](const httplib::Request& req, httplib::Response& res) {
        auto json = nlohmann::json::parse(req.body);
        bool success = Post::postLocation(json);
        res.set_content(nlohmann::json({{"success", success}}).dump(), "application/json");
    });

    svr.Post("/api/employees", [](const httplib::Request& req, httplib::Response& res) {
        auto json = nlohmann::json::parse(req.body);
        bool success = Post::postEmployee(json);
        res.set_content(nlohmann::json({{"success", success}}).dump(), "application/json");
    });

    svr.Post("/api/news", [](const httplib::Request& req, httplib::Response& res) {
        try {
            auto json = nlohmann::json::parse(req.body);
            
            // Проверяем обязательные поля
            if (!json.contains("title") || !json.contains("content") || !json.contains("author_id")) {
                res.status = 400;
                res.set_content(R"({"error":"Missing required fields"})", "application/json");
                return;
            }

            // Используем postNewsWithImage вместо postNews
            auto result = Post::postNewsWithImage(
                json["title"].get<std::string>(),
                json["content"].get<std::string>(),
                json["author_id"].get<std::string>(),
                json.value("image_data", ""),
                json.value("image_type", "")
            );

            // Исправляем отправку уведомления через WebSocket
            WebSocketServer::getInstance().broadcast(
                nlohmann::json({
                    {"type", "news_updated"},
                    {"action", "created"},
                    {"data", result}  // Добавляем данные новой новости
                }).dump()
            );

            res.set_content(result.dump(), "application/json");
        } catch (const std::exception& e) {
            res.status = 500;
            res.set_content(R"({"error":"Internal server error"})", "application/json");
        }
    });

    svr.Post(R"(/api/news/(\d+)/comments)", [](const httplib::Request& req, httplib::Response& res) {
        try {
            auto json = nlohmann::json::parse(req.body);
            int newsId = std::stoi(req.matches[1].str());
            int employeeId = json["employee_id"].get<int>();
            std::string text = json["text"].get<std::string>();

            auto result = Post::postNewsComment(newsId, employeeId, text);
            
            // Отправляем уведомление всем подключенным клиентам
            WebSocketServer::getInstance().broadcast(
                nlohmann::json({
                    {"type", "comment_added"},
                    {"newsId", newsId},
                    {"data", result}
                }).dump()
            );
            
            res.set_content(result.dump(), "application/json");
        } catch (const std::exception& e) {
            std::cerr << "Error posting comment: " << e.what() << std::endl;
            res.status = 500;
            res.set_content(nlohmann::json({{"error", e.what()}}).dump(), "application/json");
        }
    });

    svr.Post(R"(/api/news/(\d+)/like)", [](const httplib::Request& req, httplib::Response& res) {
        try {
            auto json = nlohmann::json::parse(req.body);
            // Конвертируем строковый ID в число
            int news_id = std::stoi(req.matches[1].str());
            
            if (!json.contains("employee_id")) {
                res.status = 400;
                res.set_content(R"({"error": "Missing employee_id"})", "application/json");
                return;
            }

            // Убеждаемся, что employee_id является числом
            int employee_id = json["employee_id"].get<int>();

            auto response = Post::toggleNewsLike(news_id, employee_id);
            res.set_content(response.dump(), "application/json");

        } catch (const std::exception& e) {
            std::cerr << "Error handling like: " << e.what() << std::endl;
            res.status = 500;
            res.set_content(R"({"error": "Server error"})", "application/json");
        }
    });

    svr.Post("/api/news/([0-9]+)/pin", [](const httplib::Request& req, httplib::Response& res) {
        try {
            const std::string news_id_str = req.matches[1];
            const int news_id = std::stoi(news_id_str);
            
            // Парсим тело запроса для получения флага isPinned
            auto json = nlohmann::json::parse(req.body);
            bool should_pin = json["isPinned"].get<bool>();

            // Вызываем метод для изменения состояния закрепления
            auto result = Put::toggleNewsPin(news_id, should_pin);
            
            res.set_content(result.dump(), "application/json");
        } catch (const std::exception& e) {
            res.status = 500;
            res.set_content(nlohmann::json({{"error", e.what()}}).dump(), "application/json");
        }
    });

    svr.Post("/api/notifications", [](const httplib::Request& req, httplib::Response& res) {
        auto json = nlohmann::json::parse(req.body);
        bool success = Post::postNotification(json);
        res.set_content(nlohmann::json({{"success", success}}).dump(), "application/json");
    });

    svr.Post("/api/links", [](const httplib::Request& req, httplib::Response& res) {
        try {
            auto json = nlohmann::json::parse(req.body);
            
            // Проверяем обязательные поля
            if (!json.contains("name") || !json.contains("url")) {
                res.status = 400;
                res.set_content(R"({"error":"Missing required fields"})", "application/json");
                return;
            }

            auto result = Post::createPortal(
                json["name"].get<std::string>(),
                json.value("description", ""),
                json["url"].get<std::string>(),
                json.value("icon_data", ""),
                json.value("icon_type", ""),
                json.value("icon_emoji", "")
            );

            res.set_content(result.dump(), "application/json");
        } catch (const std::exception& e) {
            res.status = 500;
            res.set_content(nlohmann::json({
                {"error", e.what()}
            }).dump(), "application/json");
        }
    });

    svr.Post("/api/auth/login", [](const httplib::Request& req, httplib::Response& res) {
        auto json = nlohmann::json::parse(req.body);
        bool success = UserAuth::validateCredentials(
            json["personnel_number"].get<std::string>(),
            json["password"].get<std::string>()
        );
        
        if (success) {
            // Получаем данные пользователя по табельному номеру
            auto userData = UserAuth::getUserData(json["personnel_number"].get<std::string>());
            res.set_content(userData.dump(), "application/json");
        } else {
            res.status = 401;
            res.set_content(R"({"error": "Invalid credentials"})", "application/json");
        }
    });

    svr.Post("/api/auth/register", [](const httplib::Request& req, httplib::Response& res) {
        try {
            auto json = nlohmann::json::parse(req.body);
            
            // Проверяем обязательные поля
            if (!json.contains("personnel_number") || !json.contains("password") || 
                !json.contains("full_name") || !json.contains("department") ||
                !json.contains("position") || !json.contains("work_phone") ||
                !json.contains("birth_date")) {
                res.status = 400;
                res.set_content(R"({"error": "Missing required fields"})", "application/json");
                return;
            }

            bool success = UserAuth::createUser(json);
            
            if (success) {
                auto userData = UserAuth::getUserData(json["personnel_number"].get<std::string>());
                res.set_content(userData.dump(), "application/json");
            } else {
                res.status = 400;
                res.set_content(R"({"error": "Registration failed"})", "application/json");
            }
        } catch (const std::exception& e) {
            std::cerr << "Registration error: " << e.what() << std::endl;
            res.status = 500;
            res.set_content(R"({"error": "Server error"})", "application/json");
        }
    });

    // Delete endpoints
    svr.Delete(R"(/api/organizations/(\d+))", [](const httplib::Request& req, httplib::Response& res) {
        int id = std::stoi(req.matches[1]);
        bool success = Delete::deleteOrganization(id);
        res.set_content(nlohmann::json({{"success", success}}).dump(), "application/json");
    });

    svr.Delete(R"(/api/departments/(\d+))", [](const httplib::Request& req, httplib::Response& res) {
        int id = std::stoi(req.matches[1]);
        bool success = Delete::deleteDepartment(id);
        res.set_content(nlohmann::json({{"success", success}}).dump(), "application/json");
    });

    svr.Delete(R"(/api/locations/(\d+))", [](const httplib::Request& req, httplib::Response& res) {
        int id = std::stoi(req.matches[1]);
        bool success = Delete::deleteLocation(id);
        res.set_content(nlohmann::json({{"success", success}}).dump(), "application/json");
    });

    svr.Delete(R"(/api/employees/(\d+))", [](const httplib::Request& req, httplib::Response& res) {
        int id = std::stoi(req.matches[1]);
        bool success = Delete::deleteEmployee(id);
        res.set_content(nlohmann::json({{"success", success}}).dump(), "application/json");
    });

    svr.Delete(R"(/api/news/(\d+))", [](const httplib::Request& req, httplib::Response& res) {
        try {
            int newsId = std::stoi(req.matches[1].str());
            bool success = Delete::deleteNews(newsId);
            
            if (success) {
                // Отправляем уведомление через WebSocket в формате JSON
                WebSocketServer::getInstance().broadcast(
                    nlohmann::json({
                        {"type", "news_updated"}
                    }).dump()
                );
                
                res.status = 200;
                res.set_content("{\"success\":true}", "application/json");
            } else {
                res.status = 404;
                res.set_content("{\"error\":\"News not found\"}", "application/json");
            }
        } catch (const std::exception& e) {
            res.status = 500;
            res.set_content("{\"error\":\"Internal server error\"}", "application/json");
        }
    });

    svr.Delete(R"(/api/notifications/(\d+))", [](const httplib::Request& req, httplib::Response& res) {
        int id = std::stoi(req.matches[1]);
        bool success = Delete::deleteNotification(id);
        res.set_content(nlohmann::json({{"success", success}}).dump(), "application/json");
    });

    svr.Delete(R"(/api/links/(\d+))", [](const httplib::Request& req, httplib::Response& res) {
        int id = std::stoi(req.matches[1]);
        bool success = Delete::deleteLink(id);
        res.set_content(nlohmann::json({{"success", success}}).dump(), "application/json");
    });

    // Put endpoints
    svr.Put(R"(/api/employees/(\d+))", [](const httplib::Request& req, httplib::Response& res) {
        try {
            auto json = nlohmann::json::parse(req.body);
            int employee_id = std::stoi(req.matches[1]);
            
            auto result = Put::putEmployeeWithResponse(employee_id, json);
            res.set_content(result.dump(), "application/json");
            
        } catch (const std::exception& e) {
            std::cerr << "Error updating employee: " << e.what() << std::endl;
            res.status = 500;
            res.set_content(R"({"error": "Server error"})", "application/json");
        }
    });

    svr.Put(R"(/api/news/(\d+))", [](const httplib::Request& req, httplib::Response& res) {
        try {
            auto json = nlohmann::json::parse(req.body);
            int newsId = std::stoi(req.matches[1].str());
            
            auto result = Put::updateNews(
                newsId,
                json["title"].get<std::string>(),
                json["content"].get<std::string>(),
                json.contains("image_data") ? json["image_data"].get<std::string>() : "",
                json.contains("image_type") ? json["image_type"].get<std::string>() : ""
            );

            if (!result.contains("error")) {
                // Отправляем уведомление всем подключенным клиентам
                WebSocketServer::getInstance().broadcast("news_updated");
                res.set_content(result.dump(), "application/json");
            } else {
                res.status = 404;
                res.set_content(result.dump(), "application/json");
            }
        } catch (const std::exception& e) {
            res.status = 500;
            res.set_content(R"({"error":"Internal server error"})", "application/json");
        }
    });

    // Добавляем PUT endpoint для обновления портала
    svr.Put(R"(/api/links/(\d+))", [](const httplib::Request& req, httplib::Response& res) {
        try {
            auto json = nlohmann::json::parse(req.body);
            int portalId = std::stoi(req.matches[1]);
            
            auto result = Put::updatePortal(
                portalId,
                json["name"].get<std::string>(),
                json.value("description", ""),
                json["url"].get<std::string>(),
                json.value("icon_data", ""),
                json.value("icon_type", ""),
                json.value("icon_emoji", "")
            );

            res.set_content(result.dump(), "application/json");
        } catch (const std::exception& e) {
            res.status = 500;
            res.set_content(nlohmann::json({
                {"error", e.what()}
            }).dump(), "application/json");
        }
    });

    // Слушаем на всех интерфейсах
    const char* host = "0.0.0.0";  // Это позволит принимать подключения со всех сетевых интерфейсов
    int port = 8081;

    std::cout << "Server is running on port " << port << std::endl;
    std::cout << "To access from other computers, use http://<this-computer-ip>:" << port << std::endl;
    
    svr.listen(host, port);

    return 0;
}