#pragma once
#include <nlohmann/json.hpp>
#include <string>

class Post {
public:
    static bool postOrganization(const nlohmann::json& data);
    static bool postDepartment(const nlohmann::json& data);
    static bool postLocation(const nlohmann::json& data);
    static bool postEmployee(const nlohmann::json& data);
    static bool postNews(const nlohmann::json& data);
    static bool postNotification(const nlohmann::json& data);
    static bool postLink(const nlohmann::json& data);
    static nlohmann::json postNewsComment(int news_id, int employee_id, const std::string& text);
    static nlohmann::json toggleNewsLike(int news_id, int employee_id);
    static nlohmann::json postNewsWithImage(const std::string& title, 
                                          const std::string& content, 
                                          const std::string& author_id,
                                          const std::string& image_data = "",
                                          const std::string& image_type = "");
};
