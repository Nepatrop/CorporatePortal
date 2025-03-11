#include "db/post.h"
#include "db/config.h"
#include <pqxx/pqxx>
#include <iostream>

bool Post::postOrganization(const nlohmann::json& data) {
    try {
        pqxx::connection conn(Config::getConnectionString());
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

bool Post::postDepartment(const nlohmann::json& data) {
    try {
        pqxx::connection conn(Config::getConnectionString());
        pqxx::work txn(conn);

        // Получаем ID организации по имени
        pqxx::result org_result = txn.exec_params(
            "SELECT id FROM organizations WHERE name = $1",
            data["organization"].get<std::string>()
        );
        if (org_result.empty()) {
            std::cerr << "Organization not found" << std::endl;
            return false;
        }
        std::string organization_id = org_result[0][0].as<std::string>();

        txn.exec_params(
            "INSERT INTO departments (name, organization_id, department_code, parent_department_code) "
            "VALUES ($1, $2, $3, $4)",
            data["department"].get<std::string>(),
            organization_id,
            data["department_code"].get<std::string>(),
            data["parent_department_code"].get<std::string>().empty() ? nullptr : data["parent_department_code"].get<std::string>()
        );
        txn.commit();
        return true;
    } catch (std::exception const& e) {
        std::cerr << "Error creating department: " << e.what() << std::endl;
        return false;
    }
}

bool Post::postLocation(const nlohmann::json& data) {
    try {
        pqxx::connection conn(Config::getConnectionString());
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

bool Post::postEmployee(const nlohmann::json& data) {
    try {
        pqxx::connection conn(Config::getConnectionString());
        pqxx::work txn(conn);

        // Получаем ID организации по имени
        pqxx::result org_result = txn.exec_params(
            "SELECT id FROM organizations WHERE name = $1",
            data["organization"].get<std::string>()
        );
        if (org_result.empty()) {
            std::cerr << "Organization not found" << std::endl;
            return false;
        }
        std::string organization_id = org_result[0][0].as<std::string>();

        // Получаем ID отдела по имени
        pqxx::result dept_result = txn.exec_params(
            "SELECT id FROM departments WHERE name = $1",
            data["department"].get<std::string>()
        );
        if (dept_result.empty()) {
            std::cerr << "Department not found" << std::endl;
            return false;
        }
        std::string department_id = dept_result[0][0].as<std::string>();

        // Получаем ID локации по имени
        pqxx::result loc_result = txn.exec_params(
            "SELECT id FROM locations WHERE name = $1",
            data["location"].get<std::string>()
        );
        if (loc_result.empty()) {
            std::cerr << "Location not found" << std::endl;
            return false;
        }
        std::string location_id = loc_result[0][0].as<std::string>();

        // Получаем ID менеджера по personnel_number
        std::string manager_id = "NULL";
        if (!data["manager"].get<std::string>().empty()) {
            pqxx::result mgr_result = txn.exec_params(
                "SELECT id FROM employees WHERE personnel_number = $1",
                data["manager"].get<std::string>()
            );
            if (!mgr_result.empty()) {
                manager_id = mgr_result[0][0].as<std::string>();
            }
        }

        // Выполняем вставку сотрудника
        txn.exec_params(
            "INSERT INTO employees ("
            "full_name, physical_person_name, organization_id, department_id, "
            "position, personnel_number, dismissal_date, service, can_help_with, "
            "responsibilities, makes_decisions, is_dismissed, work_phone, "
            "location_id, birth_date, is_admin"
            ") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, "
            "$13, $14, $15, $16)",
            data["employee"].get<std::string>(),
            data["physical_person"].get<std::string>(),
            organization_id,
            department_id,
            data["position"].get<std::string>(),
            data["personnel_number"].get<std::string>(),
            data["dismissal_date"].get<std::string>().empty() ? nullptr : data["dismissal_date"].get<std::string>(),
            data["service"].get<std::string>(),
            data["can_help_with"].get<std::string>(),
            data["responsibilities"].get<std::string>(),
            data["makes_decisions"].get<std::string>(),
            data["is_dismissed"].get<std::string>() == "t",
            data["work_phone"].get<std::string>(),
            location_id,
            data["birth_date"].get<std::string>(),
            data["is_admin"].get<std::string>() == "t"
        );

        // Если есть manager_id, обновляем его отдельным запросом
        if (manager_id != "NULL") {
            pqxx::result emp_result = txn.exec("SELECT lastval()");
            std::string employee_id = emp_result[0][0].as<std::string>();
            txn.exec_params(
                "UPDATE employees SET manager_id = $1 WHERE id = $2",
                manager_id, employee_id
            );
        }

        txn.commit();
        return true;
    } catch (std::exception const& e) {
        std::cerr << "Error creating employee: " << e.what() << std::endl;
        return false;
    }
}

bool Post::postNews(const nlohmann::json& data) {
    try {
        pqxx::connection conn(Config::getConnectionString());
        pqxx::work txn(conn);

        // Получаем ID автора по имени
        pqxx::result author_result = txn.exec_params(
            "SELECT id FROM employees WHERE full_name = $1",
            data["author_name"].get<std::string>()
        );
        if (author_result.empty()) {
            std::cerr << "Author not found" << std::endl;
            return false;
        }
        std::string author_id = author_result[0][0].as<std::string>();

        txn.exec_params(
            "INSERT INTO news (content, publication_time, author_id) VALUES ($1, NOW(), $2)",
            data["content"].get<std::string>(),
            author_id
        );
        txn.commit();
        return true;
    } catch (std::exception const& e) {
        std::cerr << "Error creating news: " << e.what() << std::endl;
        return false;
    }
}

bool Post::postNotification(const nlohmann::json& data) {
    try {
        pqxx::connection conn(Config::getConnectionString());
        pqxx::work txn(conn);

        // Получаем ID сотрудника по имени
        pqxx::result emp_result = txn.exec_params(
            "SELECT id FROM employees WHERE full_name = $1",
            data["employee_name"].get<std::string>()
        );
        if (emp_result.empty()) {
            std::cerr << "Employee not found" << std::endl;
            return false;
        }
        std::string employee_id = emp_result[0][0].as<std::string>();

        txn.exec_params(
            "INSERT INTO notifications (message, time, source, employee_id) VALUES ($1, NOW(), $2, $3)",
            data["message"].get<std::string>(),
            data["source"].get<std::string>(),
            employee_id
        );
        txn.commit();
        return true;
    } catch (std::exception const& e) {
        std::cerr << "Error creating notification: " << e.what() << std::endl;
        return false;
    }
}

bool Post::postLink(const nlohmann::json& data) {
    try {
        pqxx::connection conn(Config::getConnectionString());
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