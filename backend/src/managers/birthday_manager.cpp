#include "managers/birthday_manager.h"
#include "db/config.h"
#include "utils/file_utils.h"
#include <pqxx/pqxx>
#include <fstream>
#include <chrono>
#include <thread>
#include <filesystem>
#include <iostream>
#include <algorithm>

BirthdayManager::BirthdayManager() {
    try {
        // Используем FileUtils для получения пути к конфигурационному файлу
        configPath = FileUtils::getConfigPath() / "upcoming_birthdays.ini";
        
        // Создаем файл если его нет
        if (!std::filesystem::exists(configPath)) {
            std::ofstream file(configPath);
            if (file.is_open()) {
                auto now = std::chrono::system_clock::now();
                auto timestamp = std::chrono::system_clock::to_time_t(now);
                file << "last_update=" << timestamp << std::endl;
                file << "count=0" << std::endl;
                file.close();
                std::cout << "Created configuration file at: " << configPath << std::endl;
            }
        }

        loadFromFile();
        updateBirthdaysList();
        startDailyUpdate();
        std::cout << "BirthdayManager initialized successfully" << std::endl;
    } catch (const std::exception& e) {
        std::cerr << "Error in BirthdayManager constructor: " << e.what() << std::endl;
        throw;
    }
}

BirthdayManager::~BirthdayManager() {
    saveToFile();
}

void BirthdayManager::saveToFile() {
    try {
        // Создаем временный список для сохранения под блокировкой
        std::vector<int> birthdaysToSave;
        {
            std::lock_guard<std::mutex> lock(birthdaysMutex);
            birthdaysToSave = upcomingBirthdays;
        }

        // Сохраняем данные без блокировки мьютекса
        std::ofstream file(configPath);
        if (!file.is_open()) {
            throw std::runtime_error("Cannot open file for writing: " + configPath.string());
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
        pqxx::connection conn(Config::getConnectionString());
        pqxx::work txn(conn);
        
        // Получаем всех активных сотрудников с днями рождения
        auto result = txn.exec(R"(
            SELECT 
                id,
                birth_date
            FROM employees 
            WHERE birth_date IS NOT NULL 
            AND is_dismissed = false
        )");

        std::vector<std::pair<int, int>> employeeDays;
        
        // Собираем дни рождения в вектор
        for (const auto& row : result) {
            int id = row["id"].as<int>();
            std::string birthDate = row["birth_date"].as<std::string>();
            int daysUntil = calculateDaysUntilBirthday(birthDate);
            employeeDays.push_back({id, daysUntil});
        }

        // Сортируем по количеству дней до дня рождения
        std::sort(employeeDays.begin(), employeeDays.end(),
            [](const auto& a, const auto& b) { return a.second < b.second; });

        // Обновляем список под блокировкой
        {
            std::lock_guard<std::mutex> lock(birthdaysMutex);
            upcomingBirthdays.clear();
            
            // Берем первые MAX_BIRTHDAYS записей
            for (size_t i = 0; i < std::min(employeeDays.size(), static_cast<size_t>(MAX_BIRTHDAYS)); ++i) {
                upcomingBirthdays.push_back(employeeDays[i].first);
            }
        }
        // Сохраняем в файл
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
        // Получаем текущую дату
        auto now = std::chrono::system_clock::now();
        auto today = std::chrono::floor<std::chrono::days>(now);
        
        // Парсим дату рождения
        std::istringstream ss(birthDate);
        std::string year_str, month_str, day_str;
        std::getline(ss, year_str, '-');
        std::getline(ss, month_str, '-');
        std::getline(ss, day_str);
        
        int month = std::stoi(month_str);
        int day = std::stoi(day_str);
        
        // Получаем текущий год
        auto currentYear = std::chrono::year_month_day(today).year();
        
        // Создаем дату следующего дня рождения в текущем году
        auto birthday = std::chrono::year_month_day(currentYear, std::chrono::month(month), std::chrono::day(day));
        
        // Если день рождения в этом году уже прошел, берем следующий год
        if (birthday < today) {
            birthday = std::chrono::year_month_day(currentYear + std::chrono::years(1), std::chrono::month(month), std::chrono::day(day));
        }
        
        // Вычисляем количество дней
        return (std::chrono::sys_days(birthday) - std::chrono::sys_days(today)).count();
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
            WITH birthdays AS (
                SELECT 
                    e.id,
                    e.full_name as name,
                    e.birth_date as date,
                    e.personnel_number,
                    l.name as location,
                    e.work_phone,
                    o.name as organization,
                    CASE
                        WHEN (DATE_PART('month', current_date) < DATE_PART('month', e.birth_date)) 
                            OR (DATE_PART('month', current_date) = DATE_PART('month', e.birth_date) 
                                AND DATE_PART('day', current_date) <= DATE_PART('day', e.birth_date))
                        THEN MAKE_DATE(DATE_PART('year', current_date)::INTEGER, 
                                     DATE_PART('month', e.birth_date)::INTEGER, 
                                     DATE_PART('day', e.birth_date)::INTEGER)
                        ELSE MAKE_DATE(DATE_PART('year', current_date)::INTEGER + 1, 
                                     DATE_PART('month', e.birth_date)::INTEGER, 
                                     DATE_PART('day', e.birth_date)::INTEGER)
                    END as next_birthday
                FROM employees e
                LEFT JOIN locations l ON e.location_id = l.id
                LEFT JOIN organizations o ON e.organization_id = o.id
                WHERE e.birth_date IS NOT NULL 
                AND e.is_dismissed = false
            ),
            birthdays_with_days AS (
                SELECT 
                    *,
                    next_birthday - current_date as days_until
                FROM birthdays
            )
            SELECT *
            FROM birthdays_with_days
            ORDER BY next_birthday ASC
            LIMIT 10
        )");

        nlohmann::json birthdaysList = nlohmann::json::array();
        
        for (const auto& row : result) {
            nlohmann::json person = {
                {"id", row["id"].as<int>()},
                {"name", row["name"].as<std::string>()},
                {"date", row["date"].as<std::string>()},
                {"days_until", row["days_until"].as<int>()},
                {"personnel_number", row["personnel_number"].is_null() ? "" : row["personnel_number"].as<std::string>()},
                {"location", row["location"].is_null() ? "" : row["location"].as<std::string>()},
                {"organization", row["organization"].is_null() ? "" : row["organization"].as<std::string>()},
                {"work_phone", row["work_phone"].is_null() ? "" : row["work_phone"].as<std::string>()}
            };
            birthdaysList.push_back(person);
        }
        
        return birthdaysList;
        
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