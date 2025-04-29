#pragma once
#include <vector>
#include <string>
#include <nlohmann/json.hpp>
#include <mutex>
#include <filesystem>
#include <memory>

class BirthdayManager {
private:
    static const int MAX_BIRTHDAYS = 5;
    std::filesystem::path configDir;
    std::filesystem::path configPath;
    std::vector<int> upcomingBirthdays;
    std::mutex birthdaysMutex;

    BirthdayManager();
    ~BirthdayManager();

    void saveToFile();
    void loadFromFile();
    void updateBirthdaysList();
    int calculateDaysUntilBirthday(const std::string& birthDate);
    void startDailyUpdate();

public:
    static BirthdayManager& getInstance();
    void forceUpdate();
    nlohmann::json getUpcomingBirthdays();

    // Запрещаем копирование и присваивание
    BirthdayManager(const BirthdayManager&) = delete;
    BirthdayManager& operator=(const BirthdayManager&) = delete;
};
