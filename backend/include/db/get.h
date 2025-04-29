#pragma once
#include <nlohmann/json.hpp>
#include <pqxx/pqxx>

class Get {
private:
    static nlohmann::json resultToJson(pqxx::result& r);
    static bool checkIfLikedByEmployee(int newsId, int employeeId, pqxx::work& txn);

public:
    static nlohmann::json getOrganizations();
    static nlohmann::json getDepartments();
    static nlohmann::json getLocations();
    static nlohmann::json getEmployees();
    static nlohmann::json getNotifications();
    static nlohmann::json getLinks();
    static nlohmann::json getEmployeeByPersonnelNumber(const std::string& personnel_number);
    static nlohmann::json getNewsWithDetails(int currentUserId = 0);
    static nlohmann::json getNewsComments(int news_id);
    static nlohmann::json getNewsLikes(int news_id);
    static nlohmann::json getUpcomingBirthdays();
};
