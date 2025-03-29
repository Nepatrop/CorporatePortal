#pragma once
#include <nlohmann/json.hpp>

class Delete {
public:
    static bool deleteOrganization(int id);
    static bool deleteDepartment(int id);
    static bool deleteLocation(int id);
    static bool deleteEmployee(int id);
    static bool deleteNews(int news_id);
    static bool deleteNotification(int id);
    static bool deleteLink(int id);
};
