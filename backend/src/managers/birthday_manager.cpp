#include "managers/birthday_manager.h"
#include "db/config.h"
#include "db/connection_pool.h"
#include <pqxx/pqxx>
#include <fstream>
#include <chrono>
#include <thread>
#include <filesystem>
#include <iostream>
#include <algorithm>
#include <memory>

BirthdayManager::BirthdayManager() {
    try {
        std::filesystem::path execPath = std::filesystem::current_path();
        configDir = execPath / "config";
        
        if (!std::filesystem::exists(configDir)) {
            std::filesystem::create_directory(configDir);
        }
        
        configPath = configDir / "upcoming_birthdays.ini";
        
        updateBirthdaysList();
        
        if (!std::filesystem::exists(configPath)) {
            saveToFile();
        }
        
        startDailyUpdate();
        
    } catch (const std::exception& e) {
        std::cerr << "Error initializing BirthdayManager: " << e.what() << std::endl;
        throw;
    }
}

BirthdayManager::~BirthdayManager() {
    saveToFile();
}

void BirthdayManager::saveToFile() {
    std::vector<int> birthdaysToSave;
    {
        std::lock_guard<std::mutex> lock(birthdaysMutex);
        birthdaysToSave = upcomingBirthdays;
    }

    try {
        std::ofstream file(configPath);
        if (!file.is_open()) {
            std::cerr << "Cannot open file for writing: " << configPath << std::endl;
            return;
        }

        auto now = std::chrono::system_clock::now();
        auto timestamp = std::chrono::system_clock::to_time_t(now);
        file << "last_update=" << timestamp << std::endl;
        file << "count=" << birthdaysToSave.size() << std::endl;

        for (size_t i = 0; i < birthdaysToSave.size(); ++i) {
            file << "id" << i << "=" << birthdaysToSave[i] << std::endl;
        }

        file.close();
    } catch (const std::exception& e) {
        std::cerr << "Error saving to file: " << e.what() << std::endl;
    }
}

void BirthdayManager::loadFromFile() {
    try {
        if (!std::filesystem::exists(configPath)) {
            updateBirthdaysList();
            return;
        }

        std::vector<int> loadedBirthdays;
        time_t lastUpdate = 0;
        int count = 0;

        // Читаем файл без блокировки
        std::ifstream file(configPath);
        if (!file.is_open()) {
            throw std::runtime_error("Cannot open file for reading: " + configPath.string());
        }

        std::string line;
        while (std::getline(file, line)) {
            if (line.compare(0, 11, "last_update") == 0) {
                lastUpdate = std::stoll(line.substr(12));
            }
            else if (line.compare(0, 5, "count") == 0) {
                count = std::stoi(line.substr(6));
            }
            else if (line.compare(0, 2, "id") == 0) {
                size_t equalsPos = line.find('=');
                if (equalsPos != std::string::npos) {
                    loadedBirthdays.push_back(std::stoi(line.substr(equalsPos + 1)));
                }
            }
        }

        file.close();

        // Проверяем актуальность данных
        auto now = std::chrono::system_clock::now();
        auto currentTime = std::chrono::system_clock::to_time_t(now);

        if (currentTime - lastUpdate > 86400 || loadedBirthdays.size() != static_cast<size_t>(count)) {
            updateBirthdaysList();
            return;
        }

        // Обновляем список под блокировкой
        {
            std::lock_guard<std::mutex> lock(birthdaysMutex);
            upcomingBirthdays = std::move(loadedBirthdays);
        }
    } catch (const std::exception& e) {
        std::cerr << "Error loading from file: " << e.what() << std::endl;
        updateBirthdaysList();
    }
}

void BirthdayManager::updateBirthdaysList() {
    try {
        std::unique_lock<std::mutex> lock(birthdaysMutex, std::defer_lock);
        if (!lock.try_lock()) {
            return;
        }

        auto conn = std::make_unique<pqxx::connection>(Config::getConnectionString());
        pqxx::work txn(*conn);
        
        auto result = txn.exec(R"(
            SELECT id, birth_date
            FROM employees 
            WHERE birth_date IS NOT NULL 
            AND is_dismissed = false
            ORDER BY id
        )");

        std::vector<std::pair<int, int>> employeeDays;
        for (const auto& row : result) {
            int id = row["id"].as<int>();
            std::string birthDate = row["birth_date"].as<std::string>();
            int daysUntil = calculateDaysUntilBirthday(birthDate);
            employeeDays.push_back({id, daysUntil});
        }

        std::sort(employeeDays.begin(), employeeDays.end(),
            [](const auto& a, const auto& b) { return a.second < b.second; });

        upcomingBirthdays.clear();
        int count = 0;
        for (const auto& pair : employeeDays) {
            if (count >= MAX_BIRTHDAYS) break;
            upcomingBirthdays.push_back(pair.first);
            count++;
        }

        // Снимаем блокировку перед сохранением в файл
        lock.unlock();
        saveToFile();

    } catch (const std::exception& e) {
        std::cerr << "Error updating birthdays list: " << e.what() << std::endl;
    }
}

void BirthdayManager::startDailyUpdate() {
    std::thread([this]() {
        while (true) {
            auto now = std::chrono::system_clock::now();
            auto midnight = now + std::chrono::hours(24);
            std::this_thread::sleep_until(midnight);
            updateBirthdaysList();
        }
    }).detach();
}

int BirthdayManager::calculateDaysUntilBirthday(const std::string& birthDate) {
    try {
        time_t now = time(nullptr);
        struct tm today = *localtime(&now);
        
        // Парсим дату рождения
        std::istringstream ss(birthDate);
        std::string year_str, month_str, day_str;
        std::getline(ss, year_str, '-');
        std::getline(ss, month_str, '-');
        std::getline(ss, day_str);
        
        int birth_month = std::stoi(month_str);
        int birth_day = std::stoi(day_str);
        
        // Получаем текущий год
        int current_year = today.tm_year + 1900;
        
        // Создаем время следующего дня рождения
        struct tm next_birthday = today;
        next_birthday.tm_mon = birth_month - 1;
        next_birthday.tm_mday = birth_day;
        
        // Если день рождения в этом году уже прошел, берем следующий год
        if (next_birthday.tm_mon < today.tm_mon || 
            (next_birthday.tm_mon == today.tm_mon && next_birthday.tm_mday < today.tm_mday)) {
            next_birthday.tm_year = today.tm_year + 1;
        } else {
            next_birthday.tm_year = today.tm_year;
        }
        
        // Вычисляем разницу в днях
        time_t birth_time = mktime(&next_birthday);
        time_t current_time = mktime(&today);
        
        return (int)((difftime(birth_time, current_time) + 43200) / 86400); // +12 часов для округления
    } catch (const std::exception& e) {
        std::cerr << "Error calculating days until birthday: " << e.what() << std::endl;
        return 0;
    }
}

nlohmann::json BirthdayManager::getUpcomingBirthdays() {
    try {
        pqxx::connection conn(Config::getConnectionString());
        pqxx::work txn(conn);

        auto result = txn.exec(R"(
            WITH birthday_data AS (
                SELECT 
                    e.id,
                    e.full_name as name,
                    e.birth_date as date,
                    e.position,
                    d.name as department,
                    l.name as location,
                    o.name as organization,
                    e.personnel_number,
                    e.work_phone,
                    CASE
                        WHEN EXTRACT(DOY FROM birth_date) >= EXTRACT(DOY FROM CURRENT_DATE)
                        THEN DATE(DATE_TRUNC('year', CURRENT_DATE) + 
                             (EXTRACT(DOY FROM birth_date) - 1 || ' days')::INTERVAL)
                        ELSE DATE(DATE_TRUNC('year', CURRENT_DATE + INTERVAL '1 year') + 
                             (EXTRACT(DOY FROM birth_date) - 1 || ' days')::INTERVAL)
                    END as next_birthday_date,
                    CASE
                        WHEN EXTRACT(DOY FROM birth_date) >= EXTRACT(DOY FROM CURRENT_DATE)
                        THEN (DATE(DATE_TRUNC('year', CURRENT_DATE) + 
                             (EXTRACT(DOY FROM birth_date) - 1 || ' days')::INTERVAL) - CURRENT_DATE)
                        ELSE (DATE(DATE_TRUNC('year', CURRENT_DATE + INTERVAL '1 year') + 
                             (EXTRACT(DOY FROM birth_date) - 1 || ' days')::INTERVAL) - CURRENT_DATE)
                    END as days_until
                FROM employees e
                LEFT JOIN departments d ON e.department_id = d.id
                LEFT JOIN locations l ON e.location_id = l.id
                LEFT JOIN organizations o ON e.organization_id = o.id
                WHERE e.birth_date IS NOT NULL 
                AND e.is_dismissed = false
            )
            SELECT *
            FROM birthday_data
            ORDER BY days_until ASC
            LIMIT 5
        )");

        nlohmann::json birthdays = nlohmann::json::array();
        for (const auto& row : result) {
            nlohmann::json birthday = {
                {"id", row["id"].as<std::string>()},
                {"name", row["name"].as<std::string>()},
                {"date", row["date"].as<std::string>()},
                {"position", row["position"].is_null() ? "" : row["position"].as<std::string>()},
                {"department", row["department"].is_null() ? "" : row["department"].as<std::string>()},
                {"location", row["location"].is_null() ? "" : row["location"].as<std::string>()},
                {"organization", row["organization"].is_null() ? "" : row["organization"].as<std::string>()},
                {"personnel_number", row["personnel_number"].as<std::string>()},
                {"work_phone", row["work_phone"].is_null() ? "" : row["work_phone"].as<std::string>()},
                {"days_until", row["days_until"].as<int>()}
            };
            birthdays.push_back(birthday);
        }

        return birthdays;

    } catch (const std::exception& e) {
        std::cerr << "Error getting upcoming birthdays: " << e.what() << std::endl;
        return nlohmann::json::array();
    }
}

void BirthdayManager::forceUpdate() {
    updateBirthdaysList();
}

BirthdayManager& BirthdayManager::getInstance() {
    static BirthdayManager instance;
    return instance;
}