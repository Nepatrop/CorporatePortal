#include "db_process.h"

std::string DBProcess::getConnectionString() {
    return "dbname=corporate_portal user=postgres password=diploma host=localhost port=5432";
}

nlohmann::json DBProcess::resultToJson(pqxx::result& r) {
    nlohmann::json result = nlohmann::json::array();
    for (const auto& row : r) {
        nlohmann::json obj = nlohmann::json::object();
        for (const auto& field : row) {
            if (!field.is_null()) {
                obj[field.name()] = field.as<std::string>();
            }
        }
        result.push_back(obj);
    }
    return result;
}

nlohmann::json DBProcess::getOrganizations() {
    try {
        pqxx::connection conn(getConnectionString());
        pqxx::work txn(conn);
        pqxx::result r = txn.exec("SELECT * FROM organizations");
        return resultToJson(r);
    } catch (std::exception const& e) {
        return nlohmann::json::array();
    }
}

nlohmann::json DBProcess::getDepartments() {
    try {
        pqxx::connection conn(getConnectionString());
        pqxx::work txn(conn);
        pqxx::result r = txn.exec(
            "SELECT d.*, o.name as organization_name "
            "FROM departments d "
            "LEFT JOIN organizations o ON d.organization_id = o.id"
        );
        return resultToJson(r);
    } catch (std::exception const& e) {
        return nlohmann::json::array();
    }
}

nlohmann::json DBProcess::getLocations() {
    try {
        pqxx::connection conn(getConnectionString());
        pqxx::work txn(conn);
        pqxx::result r = txn.exec("SELECT * FROM locations");
        return resultToJson(r);
    } catch (std::exception const& e) {
        return nlohmann::json::array();
    }
}

nlohmann::json DBProcess::getEmployees() {
    try {
        pqxx::connection conn(getConnectionString());
        pqxx::work txn(conn);
        pqxx::result r = txn.exec(
            "SELECT e.*, "
            "o.name as organization_name, "
            "d.name as department_name, "
            "l.name as location_name, "
            "m.full_name as manager_name "
            "FROM employees e "
            "LEFT JOIN organizations o ON e.organization_id = o.id "
            "LEFT JOIN departments d ON e.department_id = d.id "
            "LEFT JOIN locations l ON e.location_id = l.id "
            "LEFT JOIN employees m ON e.manager_id = m.id"
        );
        return resultToJson(r);
    } catch (std::exception const& e) {
        return nlohmann::json::array();
    }
}

nlohmann::json DBProcess::getNews() {
    try {
        pqxx::connection conn(getConnectionString());
        pqxx::work txn(conn);
        pqxx::result r = txn.exec(
            "SELECT n.*, e.full_name as author_name "
            "FROM news n "
            "LEFT JOIN employees e ON n.author_id = e.id "
            "ORDER BY n.publication_time DESC"
        );
        return resultToJson(r);
    } catch (std::exception const& e) {
        return nlohmann::json::array();
    }
}

nlohmann::json DBProcess::getNotifications() {
    try {
        pqxx::connection conn(getConnectionString());
        pqxx::work txn(conn);
        pqxx::result r = txn.exec(
            "SELECT n.*, e.full_name as employee_name "
            "FROM notifications n "
            "LEFT JOIN employees e ON n.employee_id = e.id "
            "ORDER BY n.time DESC"
        );
        return resultToJson(r);
    } catch (std::exception const& e) {
        return nlohmann::json::array();
    }
}

nlohmann::json DBProcess::getLinks() {
    try {
        pqxx::connection conn(getConnectionString());
        pqxx::work txn(conn);
        pqxx::result r = txn.exec("SELECT * FROM links");
        return resultToJson(r);
    } catch (std::exception const& e) {
        return nlohmann::json::array();
    }
}
