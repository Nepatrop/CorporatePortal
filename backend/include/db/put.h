#pragma once
#include <nlohmann/json.hpp>

class Put {
public:
    static nlohmann::json putEmployeeWithResponse(int employee_id, const nlohmann::json& data);
    static nlohmann::json updateNews(int news_id, 
                                   const std::string& title,
                                   const std::string& content,
                                   const std::string& image_data = "",
                                   const std::string& image_type = "");
    static nlohmann::json toggleNewsPin(int news_id, bool should_pin);
    static nlohmann::json updatePortal(
        int id, 
        const std::string& name,
        const std::string& description,
        const std::string& url,
        const std::string& icon_data,
        const std::string& icon_type,
        const std::string& icon_emoji
    );
};
