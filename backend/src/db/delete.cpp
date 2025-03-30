#include "db/delete.h"
#include "db/config.h"
#include <pqxx/pqxx>
#include <iostream>
#include <nlohmann/json.hpp>
#include "../../include/websocket/ws_server.h"

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

        // Проверяем существование новости
        auto result = txn.exec_params(
            "SELECT id FROM news WHERE id = $1",
            news_id
        );

        if (result.empty()) {
            return false;
        }

        // Удаляем все связанные лайки и комментарии
        txn.exec_params("DELETE FROM news_likes WHERE news_id = $1", news_id);
        txn.exec_params("DELETE FROM news_comments WHERE news_id = $1", news_id);
        
        // Удаляем саму новость
        txn.exec_params("DELETE FROM news WHERE id = $1", news_id);
        
        // Отправляем только одно сообщение WebSocket в правильном формате
        nlohmann::json wsMessage = {
            {"type", "news_deleted"},
            {"data", {{"id", news_id}}}
        };
        WebSocketServer::getInstance().broadcast(wsMessage.dump());
        
        txn.commit();
        return true;
    } catch (const std::exception& e) {
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
