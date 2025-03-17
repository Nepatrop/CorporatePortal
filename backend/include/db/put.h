#pragma once
#include <nlohmann/json.hpp>

class Put {
public:
    static nlohmann::json putEmployeeWithResponse(int employee_id, const nlohmann::json& data);
};
