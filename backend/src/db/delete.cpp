#include "db/delete.h"
#include "db/config.h"
#include <pqxx/pqxx>
#include <iostream>


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

bool Delete::deleteNews(int id) {
    try {
        pqxx::connection conn(Config::getConnectionString());
        pqxx::work txn(conn);
        txn.exec_params("DELETE FROM news WHERE id = $1", id);
        txn.commit();
        return true;
    } catch (std::exception const& e) {
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
