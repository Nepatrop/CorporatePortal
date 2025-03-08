#include "db_process.h"
#include <iostream>
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

bool DBProcess::setOrganization(const nlohmann::json& data) {
    try {
        pqxx::connection conn(getConnectionString());
        pqxx::work txn(conn);
        txn.exec_params(
            "INSERT INTO organizations (name) VALUES ($1)",
            data["name"].get<std::string>()
        );
        txn.commit();
        return true;
    } catch (std::exception const& e) {
        return false;
    }
}

bool DBProcess::setDepartment(const nlohmann::json& data) {
    try {
        pqxx::connection conn(getConnectionString());
        pqxx::work txn(conn);
        txn.exec_params(
            "INSERT INTO departments (name, organization_id, department_code, parent_department_code) "
            "VALUES ($1, $2, $3, $4)",
            data["name"].get<std::string>(),
            data["organization_id"].get<std::string>(),
            data.contains("department_code") ? data["department_code"].get<std::string>() : nullptr,
            data.contains("parent_department_code") ? data["parent_department_code"].get<std::string>() : nullptr
        );
        txn.commit();
        return true;
    } catch (std::exception const& e) {
        return false;
    }
}

bool DBProcess::setLocation(const nlohmann::json& data) {
    try {
        pqxx::connection conn(getConnectionString());
        pqxx::work txn(conn);
        txn.exec_params(
            "INSERT INTO locations (name) VALUES ($1)",
            data["name"].get<std::string>()
        );
        txn.commit();
        return true;
    } catch (std::exception const& e) {
        return false;
    }
}

bool DBProcess::setEmployee(const nlohmann::json& data) {
    try {
        pqxx::connection conn(getConnectionString());
        pqxx::work txn(conn);
        txn.exec_params(
            "INSERT INTO employees (full_name, physical_person_name, organization_id, department_id, "
            "position, personnel_number, dismissal_date, service, can_help_with, responsibilities, "
            "makes_decisions, is_dismissed, work_phone, mobile_phone, email, manager_id, location_id) "
            "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)",
            data["full_name"].get<std::string>(),
            data["physical_person_name"].get<std::string>(),
            data["organization_id"].get<std::string>(),
            data["department_id"].get<std::string>(),
            data["position"].get<std::string>(),
            data.contains("personnel_number") ? data["personnel_number"].get<std::string>() : nullptr,
            data.contains("dismissal_date") ? data["dismissal_date"].get<std::string>() : nullptr,
            data.contains("service") ? data["service"].get<std::string>() : nullptr,
            data.contains("can_help_with") ? data["can_help_with"].get<std::string>() : nullptr,
            data.contains("responsibilities") ? data["responsibilities"].get<std::string>() : nullptr,
            data.contains("makes_decisions") ? data["makes_decisions"].get<std::string>() : nullptr,
            data.contains("is_dismissed") ? data["is_dismissed"].get<std::string>() : "false",
            data.contains("work_phone") ? data["work_phone"].get<std::string>() : nullptr,
            data.contains("mobile_phone") ? data["mobile_phone"].get<std::string>() : nullptr,
            data.contains("email") ? data["email"].get<std::string>() : nullptr,
            data.contains("manager_id") ? data["manager_id"].get<std::string>() : nullptr,
            data.contains("location_id") ? data["location_id"].get<std::string>() : nullptr
        );
        txn.commit();
        return true;
    } catch (std::exception const& e) {
        return false;
    }
}

bool DBProcess::setNews(const nlohmann::json& data) {
    try {
        pqxx::connection conn(getConnectionString());
        pqxx::work txn(conn);
        txn.exec_params(
            "INSERT INTO news (content, publication_time, author_id) VALUES ($1, NOW(), $2)",
            data["content"].get<std::string>(),
            data["author_id"].get<std::string>()
        );
        txn.commit();
        return true;
    } catch (std::exception const& e) {
        return false;
    }
}

bool DBProcess::setNotification(const nlohmann::json& data) {
    try {
        pqxx::connection conn(getConnectionString());
        pqxx::work txn(conn);
        txn.exec_params(
            "INSERT INTO notifications (message, time, source, employee_id) VALUES ($1, NOW(), $2, $3)",
            data["message"].get<std::string>(),
            data.contains("source") ? data["source"].get<std::string>() : nullptr,
            data["employee_id"].get<std::string>()
        );
        txn.commit();
        return true;
    } catch (std::exception const& e) {
        return false;
    }
}

bool DBProcess::setLink(const nlohmann::json& data) {
    try {
        pqxx::connection conn(getConnectionString());
        pqxx::work txn(conn);
        txn.exec_params(
            "INSERT INTO links (url, description) VALUES ($1, $2)",
            data["url"].get<std::string>(),
            data.contains("description") ? data["description"].get<std::string>() : nullptr
        );
        txn.commit();
        return true;
    } catch (std::exception const& e) {
        return false;
    }
}
