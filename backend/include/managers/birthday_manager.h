#pragma once
#include <vector>
#include <string>
#include <nlohmann/json.hpp>
#include <mutex>
#include <filesystem>

class BirthdayManager {
private:
    static const int MAX_BIRTHDAYS = 5;
    std::filesystem::path configDir;
    std::filesystem::path configPath;
    std::vector<int> upcomingBirthdays;
    std::mutex birthdaysMutex;

    void initializeConfigFile();
    void saveToFile();
    void loadFromFile();
    void updateBirthdaysList();
    int calculateDaysUntilBirthday(const std::string& birthDate);

public:
    BirthdayManager();
    ~BirthdayManager();
    
    void startDailyUpdate();
    void forceUpdate();
    nlohmann::json getUpcomingBirthdays();
    static BirthdayManager& getInstance();
};
