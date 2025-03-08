#pragma once
#include <nlohmann/json.hpp>
#include <pqxx/pqxx>
#include <string>

class DBProcess {
private:
    static std::string getConnectionString();
    static nlohmann::json resultToJson(pqxx::result& r);

public:
    static nlohmann::json getOrganizations();
    static nlohmann::json getDepartments();
    static nlohmann::json getLocations();
    static nlohmann::json getEmployees();
    static nlohmann::json getNews();
    static nlohmann::json getNotifications();
    static nlohmann::json getLinks();

    static bool setOrganization(const nlohmann::json& data);
    static bool setDepartment(const nlohmann::json& data);
    static bool setLocation(const nlohmann::json& data);
    static bool setEmployee(const nlohmann::json& data);
    static bool setNews(const nlohmann::json& data);
    static bool setNotification(const nlohmann::json& data);
    static bool setLink(const nlohmann::json& data);
};
