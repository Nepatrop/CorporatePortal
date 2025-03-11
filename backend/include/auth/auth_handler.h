#pragma once
#include <string>
#include "httplib.h"

class AuthHandler {
public:
    static bool validateAuth(const httplib::Request& req);
private:
    static const std::string API_KEY;
    static bool isValidApiKey(const std::string& key);
};
