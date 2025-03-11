#include "auth/auth_handler.h"

const std::string AuthHandler::API_KEY = "cp_e29b7d8f4a6c2135d9f0";

bool AuthHandler::validateAuth(const httplib::Request& req) {
    // Проверяем наличие заголовка API-ключа
    auto apiKey = req.get_header_value("X-API-Key");
    if (apiKey.empty()) {
        return false;
    }
    return isValidApiKey(apiKey);
}

bool AuthHandler::isValidApiKey(const std::string& key) {
    return key == API_KEY;
}
