#pragma once
#include <nlohmann/json.hpp>
#include <pqxx/pqxx>
#include <string>
#include <mutex>
#include <sw/redis++/redis++.h>

class DBProcess {
private:
    static std::string getConnectionString();
    static nlohmann::json resultToJson(pqxx::result& r);
    
    // Кэш данных
    static nlohmann::json organizations_cache;
    static nlohmann::json departments_cache;
    static nlohmann::json locations_cache;
    static nlohmann::json employees_cache;
    static nlohmann::json news_cache;
    static nlohmann::json notifications_cache;
    static nlohmann::json links_cache;
    
    // Мьютексы для безопасного доступа к кэшу
    static std::mutex organizations_mutex;
    static std::mutex departments_mutex;
    static std::mutex locations_mutex;
    static std::mutex employees_mutex;
    static std::mutex news_mutex;
    static std::mutex notifications_mutex;
    static std::mutex links_mutex;
    
    // Методы обновления кэша
    static void updateOrganizationsCache();
    static void updateDepartmentsCache();
    static void updateLocationsCache();
    static void updateEmployeesCache();
    static void updateNewsCache();
    static void updateNotificationsCache();
    static void updateLinksCache();

    static std::unique_ptr<sw::redis::Redis> redis;
    static const int CACHE_TTL = 3600; // время жизни кэша в секундах
    
    static void initRedis() {
        try {
            redis = std::make_unique<sw::redis::Redis>("tcp://127.0.0.1:6379");
        } catch (const sw::redis::Error& e) {
            std::cerr << "Redis connection failed: " << e.what() << std::endl;
        }
    }
    
    static nlohmann::json getFromCache(const std::string& key) {
        try {
            auto value = redis->get(key);
            if (value) {
                return nlohmann::json::parse(*value);
            }
        } catch (...) {}
        return nlohmann::json::array();
    }
    
    static void setToCache(const std::string& key, const nlohmann::json& data) {
        try {
            redis->set(key, data.dump(), std::chrono::seconds(CACHE_TTL));
        } catch (...) {}
    }

public:
    // Инициализация кэша
    static void initCache();
    
    static nlohmann::json getOrganizations();
    static nlohmann::json getDepartments();
    static nlohmann::json getLocations();
    static nlohmann::json getEmployees();
    static nlohmann::json getNews();
    static nlohmann::json getNotifications();
    static nlohmann::json getLinks();

    static bool setOrganization(const nlohmann::json& data);
    static bool setDepartment(const nlohmann::json& data);
    static bool setLocation(const nlohmann::json& data);
    static bool setEmployee(const nlohmann::json& data);
    static bool setNews(const nlohmann::json& data);
    static bool setNotification(const nlohmann::json& data);
    static bool setLink(const nlohmann::json& data);
};
