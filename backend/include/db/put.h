#pragma once
#include <nlohmann/json.hpp>

class Put {
public:
    static nlohmann::json putEmployeeWithResponse(int employee_id, const nlohmann::json& data);
    static nlohmann::json putNews(int news_id, 
                                const std::string& title,
                                const std::string& content,
                                const std::string& image_data = "",
                                const std::string& image_type = "");
    static nlohmann::json pinNews(int news_id, bool should_pin);
};
