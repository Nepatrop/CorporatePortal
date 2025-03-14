#pragma once
#include <string>
#include <nlohmann/json.hpp>

class UserAuth {
public:
    static bool validateCredentials(const std::string& email, const std::string& password);
    static nlohmann::json getUserData(const std::string& email);
    static bool createUser(const nlohmann::json& userData);
    
private:
    static std::string hashPassword(const std::string& password);
    static bool verifyPassword(const std::string& password, const std::string& hash);
};
