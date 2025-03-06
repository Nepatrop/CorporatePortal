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
};
