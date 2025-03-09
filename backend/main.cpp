#include "httplib.h"
#include "db_process.h"

int main() {
    // Инициализируем кэш при запуске
    DBProcess::initCache();
    
    httplib::Server svr;

    // Включаем CORS
    svr.set_default_headers({
        {"Access-Control-Allow-Origin", "*"},
        {"Access-Control-Allow-Methods", "GET, POST, OPTIONS"},
        {"Access-Control-Allow-Headers", "Content-Type"}
    });

    // Обработка OPTIONS запросов
    svr.Options(R"(/.*)", [](const httplib::Request&, httplib::Response& res) {
        res.status = 204; // No Content
    });

    // API endpoints
    svr.Get("/api/news", [](const httplib::Request&, httplib::Response& res) {
        res.set_content(DBProcess::getNews().dump(), "application/json");
    });

    svr.Get("/api/organizations", [](const httplib::Request&, httplib::Response& res) {
        res.set_content(DBProcess::getOrganizations().dump(), "application/json");
    });

    svr.Get("/api/departments", [](const httplib::Request&, httplib::Response& res) {
        res.set_content(DBProcess::getDepartments().dump(), "application/json");
    });

    svr.Get("/api/locations", [](const httplib::Request&, httplib::Response& res) {
        res.set_content(DBProcess::getLocations().dump(), "application/json");
    });

    svr.Get("/api/employees", [](const httplib::Request&, httplib::Response& res) {
        res.set_content(DBProcess::getEmployees().dump(), "application/json");
    });

    svr.Get("/api/notifications", [](const httplib::Request&, httplib::Response& res) {
        res.set_content(DBProcess::getNotifications().dump(), "application/json");
    });

    svr.Get("/api/links", [](const httplib::Request&, httplib::Response& res) {
        res.set_content(DBProcess::getLinks().dump(), "application/json");
    });

    // Добавляем POST endpoints
    svr.Post("/api/organizations", [](const httplib::Request& req, httplib::Response& res) {
        auto json = nlohmann::json::parse(req.body);
        bool success = DBProcess::setOrganization(json);
        res.set_content(nlohmann::json({{"success", success}}).dump(), "application/json");
    });

    svr.Post("/api/departments", [](const httplib::Request& req, httplib::Response& res) {
        auto json = nlohmann::json::parse(req.body);
        bool success = DBProcess::setDepartment(json);
        res.set_content(nlohmann::json({{"success", success}}).dump(), "application/json");
    });

    svr.Post("/api/locations", [](const httplib::Request& req, httplib::Response& res) {
        auto json = nlohmann::json::parse(req.body);
        bool success = DBProcess::setLocation(json);
        res.set_content(nlohmann::json({{"success", success}}).dump(), "application/json");
    });

    svr.Post("/api/employees", [](const httplib::Request& req, httplib::Response& res) {
        auto json = nlohmann::json::parse(req.body);
        bool success = DBProcess::setEmployee(json);
        res.set_content(nlohmann::json({{"success", success}}).dump(), "application/json");
    });

    svr.Post("/api/news", [](const httplib::Request& req, httplib::Response& res) {
        auto json = nlohmann::json::parse(req.body);
        bool success = DBProcess::setNews(json);
        res.set_content(nlohmann::json({{"success", success}}).dump(), "application/json");
    });

    svr.Post("/api/notifications", [](const httplib::Request& req, httplib::Response& res) {
        auto json = nlohmann::json::parse(req.body);
        bool success = DBProcess::setNotification(json);
        res.set_content(nlohmann::json({{"success", success}}).dump(), "application/json");
    });

    svr.Post("/api/links", [](const httplib::Request& req, httplib::Response& res) {
        auto json = nlohmann::json::parse(req.body);
        bool success = DBProcess::setLink(json);
        res.set_content(nlohmann::json({{"success", success}}).dump(), "application/json");
    });

    // Запуск сервера
    std::cout << "Server is running on http://localhost:8080" << std::endl;
    svr.listen("0.0.0.0", 8080);

    return 0;
}