#include "httplib.h"
#include "db/get.h"
#include "db/post.h"
#include "db/delete.h"
#include "auth/auth_handler.h"

int main() {
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

    // Включаем CORS
    svr.set_default_headers({
        {"Access-Control-Allow-Origin", "*"},
        {"Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS"},
        {"Access-Control-Allow-Headers", "Content-Type, X-API-Key"}  // Добавляем X-API-Key
    });

    // Обработка OPTIONS запросов
    svr.Options(R"(/.*)", [](const httplib::Request&, httplib::Response& res) {
        res.status = 204; // No Content
    });

    // GET endpoints
    svr.Get("/api/news", [](const httplib::Request&, httplib::Response& res) {
        res.set_content(Get::getNews().dump(), "application/json");
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

    svr.Get("/api/employees", [](const httplib::Request&, httplib::Response& res) {
        res.set_content(Get::getEmployees().dump(), "application/json");
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
        auto json = nlohmann::json::parse(req.body);
        bool success = Post::postNews(json);
        res.set_content(nlohmann::json({{"success", success}}).dump(), "application/json");
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
        int id = std::stoi(req.matches[1]);
        bool success = Delete::deleteNews(id);
        res.set_content(nlohmann::json({{"success", success}}).dump(), "application/json");
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

    // Запуск сервера
    std::cout << "Server is running on http://localhost:8081" << std::endl;
    svr.listen("0.0.0.0", 8081);

    return 0;
}