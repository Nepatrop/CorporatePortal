#pragma once
#include <nlohmann/json.hpp>

class Post {
public:
    static bool postOrganization(const nlohmann::json& data);
    static bool postDepartment(const nlohmann::json& data);
    static bool postLocation(const nlohmann::json& data);
    static bool postEmployee(const nlohmann::json& data);
    static bool postNews(const nlohmann::json& data);
    static bool postNotification(const nlohmann::json& data);
    static bool postLink(const nlohmann::json& data);
};
