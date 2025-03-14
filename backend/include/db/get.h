#pragma once
#include <nlohmann/json.hpp>
#include <pqxx/pqxx>

class Get {
private:
    static nlohmann::json resultToJson(pqxx::result& r);

public:
    static nlohmann::json getOrganizations();
    static nlohmann::json getDepartments();
    static nlohmann::json getLocations();
    static nlohmann::json getEmployees();
    static nlohmann::json getNews();
    static nlohmann::json getNotifications();
    static nlohmann::json getLinks();
    static nlohmann::json getEmployeeByPersonnelNumber(const std::string& personnel_number);
};
