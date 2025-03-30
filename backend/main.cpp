#include "httplib.h"
#include "db/get.h"
#include "db/post.h"
#include "db/delete.h"
#include "db/put.h"
#include "db/config.h"
#include "auth/user_auth.h"
#include "auth/auth_handler.h"
#include "websocket/ws_server.h"
#include <thread>

int main() {
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

            // Отправляем уведомление всем подключенным клиентам
            WebSocketServer::getInstance().broadcast("news_updated");

            res.set_content(result.dump(), "application/json");
        } catch (const std::exception& e) {
            res.status = 500;
            res.set_content(R"({"error":"Internal server error"})", "application/json");
        }
    });

    svr.Post(R"(/api/news/(\d+)/comments)", [](const httplib::Request& req, httplib::Response& res) {
        try {
            auto json = nlohmann::json::parse(req.body);
            int news_id = std::stoi(req.matches[1]);
            
            if (!json.contains("employee_id") || !json.contains("text")) {
                res.status = 400;
                res.set_content(R"({"error": "Missing required fields"})", "application/json");
                return;
            }

            int employee_id = json["employee_id"].is_string() ? 
                std::stoi(json["employee_id"].get<std::string>()) : 
                json["employee_id"].get<int>();

            auto response = Post::postNewsComment(news_id, employee_id, json["text"].get<std::string>());
            res.set_content(response.dump(), "application/json");

        } catch (const std::exception& e) {
            std::cerr << "Error creating comment: " << e.what() << std::endl;
            res.status = 500;
            res.set_content(R"({"error": "Server error", "details": ")" + std::string(e.what()) + R"("})", "application/json");
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

    svr.Post("/api/notifications", [](const httplib::Request& req, httplib::Response& res) {
        auto json = nlohmann::json::parse(req.body);
        bool success = Post::postNotification(json);
        res.set_content(nlohmann::json({{"success", success}}).dump(), "application/json");
    });

    svr.Post("/api/links", [](const httplib::Request& req, httplib::Response& res) {
        auto json = nlohmann::json::parse(req.body);
        bool success = Post::postLink(json);
        res.set_content(nlohmann::json({{"success", success}}).dump(), "application/json");
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
            auto news_id = std::stoi(req.matches[1]);
            if (Delete::deleteNews(news_id)) {
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
            auto news_id = std::stoi(req.matches[1]);
            auto json = nlohmann::json::parse(req.body);
            
            auto result = Put::updateNews(
                news_id,
                json["title"].get<std::string>(), 
                json["content"].get<std::string>(),
                json.value("image_data", ""),
                json.value("image_type", "")
            );

            if (result["error"].is_null()) {
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

    // Слушаем на всех интерфейсах
    const char* host = "0.0.0.0";  // Это позволит принимать подключения со всех сетевых интерфейсов
    int port = 8081;

    std::cout << "Server is running on port " << port << std::endl;
    std::cout << "To access from other computers, use http://<this-computer-ip>:" << port << std::endl;
    
    svr.listen(host, port);

    return 0;
}