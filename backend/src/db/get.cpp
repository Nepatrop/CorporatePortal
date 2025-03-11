#include "db/get.h"
#include "db/config.h"


nlohmann::json Get::resultToJson(pqxx::result& r) {
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

nlohmann::json Get::getOrganizations() {
    try {
        pqxx::connection conn(Config::getConnectionString());
        pqxx::work txn(conn);
        pqxx::result r = txn.exec("SELECT * FROM organizations");
        return resultToJson(r);
    } catch (std::exception const& e) {
        return nlohmann::json::array();
    }
}

nlohmann::json Get::getDepartments() {
    try {
        pqxx::connection conn(Config::getConnectionString());
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

nlohmann::json Get::getLocations() {
    try {
        pqxx::connection conn(Config::getConnectionString());
        pqxx::work txn(conn);
        pqxx::result r = txn.exec("SELECT * FROM locations");
        return resultToJson(r);
    } catch (std::exception const& e) {
        return nlohmann::json::array();
    }
}

nlohmann::json Get::getEmployees() {
    try {
        pqxx::connection conn(Config::getConnectionString());
        pqxx::work txn(conn);
        pqxx::result r = txn.exec(R"(
            SELECT 
                e.id as "id",
                CURRENT_TIMESTAMP as "period",
                e.full_name as "employee",
                e.physical_person_name as "physical_person",
                o.name as "organization",
                d.name as "department",
                e.position as "position",
                e.personnel_number as "personnel_number",
                COALESCE(TO_CHAR(e.dismissal_date, 'YYYY-MM-DD'), '') as "dismissal_date",
                COALESCE(e.service, '') as "service",
                COALESCE(m.personnel_number, '') as "manager",
                COALESCE(e.can_help_with, '') as "can_help_with",
                COALESCE(e.responsibilities, '') as "responsibilities",
                COALESCE(l.name, '') as "location",
                COALESCE(e.makes_decisions, '') as "makes_decisions",
                COALESCE(d.department_code::text, '') as "department_code",
                COALESCE(d.parent_department_code::text, '') as "parent_department_code",
                e.is_dismissed::boolean as "is_dismissed",
                COALESCE(e.work_phone, '') as "work_phone",
                COALESCE(e.work_phone, '') as "physical_person_work_phone",
                COALESCE(TO_CHAR(e.birth_date, 'YYYY-MM-DD'), '') as "birth_date",
                e.is_admin::boolean as "is_admin"
            FROM employees e
            LEFT JOIN organizations o ON e.organization_id = o.id
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN locations l ON e.location_id = l.id
            LEFT JOIN employees m ON e.manager_id = m.id
        )"
        );
        return resultToJson(r);
    } catch (std::exception const& e) {
        return nlohmann::json::array();
    }
}

nlohmann::json Get::getNews() {
    try {
        pqxx::connection conn(Config::getConnectionString());
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

nlohmann::json Get::getNotifications() {
    try {
        pqxx::connection conn(Config::getConnectionString());
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

nlohmann::json Get::getLinks() {
    try {
        pqxx::connection conn(Config::getConnectionString());
        pqxx::work txn(conn);
        pqxx::result r = txn.exec("SELECT * FROM links");
        return resultToJson(r);
    } catch (std::exception const& e) {
        return nlohmann::json::array();
    }
}
