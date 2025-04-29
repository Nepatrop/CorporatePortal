#include "db/delete.h"
#include "db/config.h"
#include <pqxx/pqxx>
#include <iostream>
#include <nlohmann/json.hpp>
#include <filesystem>
#include "../../include/websocket/ws_server.h"
#include "../../include/utils/file_utils.h"

bool Delete::deleteOrganization(int id) {
    try {
        pqxx::connection conn(Config::getConnectionString());
        pqxx::work txn(conn);
        txn.exec_params("DELETE FROM organizations WHERE id = $1", id);
        txn.commit();
        return true;
    } catch (std::exception const& e) {
        return false;
    }
}

bool Delete::deleteDepartment(int id) {
    try {
        pqxx::connection conn(Config::getConnectionString());
        pqxx::work txn(conn);
        txn.exec_params("DELETE FROM departments WHERE id = $1", id);
        txn.commit();
        return true;
    } catch (std::exception const& e) {
        return false;
    }
}

bool Delete::deleteLocation(int id) {
    try {
        pqxx::connection conn(Config::getConnectionString());
        pqxx::work txn(conn);
        txn.exec_params("DELETE FROM locations WHERE id = $1", id);
        txn.commit();
        return true;
    } catch (std::exception const& e) {
        return false;
    }
}

bool Delete::deleteEmployee(int id) {
    try {
        pqxx::connection conn(Config::getConnectionString());
        pqxx::work txn(conn);
        
        // Проверяем существование сотрудника
        pqxx::result check = txn.exec_params("SELECT id FROM employees WHERE id = $1", id);
        if (check.empty()) {
            return false;
        }

        // Сначала удаляем все связанные записи
        txn.exec_params("DELETE FROM news WHERE author_id = $1", id);
        txn.exec_params("DELETE FROM notifications WHERE employee_id = $1", id);
        
        // Обновляем manager_id у подчиненных
        txn.exec_params("UPDATE employees SET manager_id = NULL WHERE manager_id = $1", id);
        
        // Удаляем самого сотрудника
        txn.exec_params("DELETE FROM employees WHERE id = $1", id);
        
        txn.commit();
        return true;
    } catch (std::exception const& e) {
        std::cerr << "Error deleting employee: " << e.what() << std::endl;
        return false;
    }
}

bool Delete::deleteNews(int news_id) {
    try {
        pqxx::connection conn(Config::getConnectionString());
        pqxx::work txn(conn);

        // Получаем URL изображения перед удалением новости
        auto image_result = txn.exec_params(
            "SELECT image_url FROM news WHERE id = $1",
            news_id
        );

        if (image_result.empty()) {
            return false;
        }

        // Если есть изображение, удаляем его
        if (!image_result[0]["image_url"].is_null()) {
            std::string image_url = image_result[0]["image_url"].as<std::string>();
            std::filesystem::path imagePath(image_url);
            std::string filename = imagePath.filename().string();
            FileUtils::deleteImage(filename);
        }

        // Удаляем все связанные лайки и комментарии
        txn.exec_params("DELETE FROM news_likes WHERE news_id = $1", news_id);
        txn.exec_params("DELETE FROM news_comments WHERE news_id = $1", news_id);
        
        // Удаляем саму новость
        txn.exec_params("DELETE FROM news WHERE id = $1", news_id);
        
        txn.commit();
        return true;
    } catch (const std::exception& e) {
        std::cerr << "Error deleting news: " << e.what() << std::endl;
        return false;
    }
}

bool Delete::deleteNotification(int id) {
    try {
        pqxx::connection conn(Config::getConnectionString());
        pqxx::work txn(conn);
        txn.exec_params("DELETE FROM notifications WHERE id = $1", id);
        txn.commit();
        return true;
    } catch (std::exception const& e) {
        return false;
    }
}

bool Delete::deleteLink(int id) {
    try {
        pqxx::connection conn(Config::getConnectionString());
        pqxx::work txn(conn);
        txn.exec_params("DELETE FROM links WHERE id = $1", id);
        txn.commit();
        return true;
    } catch (std::exception const& e) {
        return false;
    }
}
