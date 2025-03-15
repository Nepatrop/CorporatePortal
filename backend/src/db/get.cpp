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

nlohmann::json Get::getEmployeeByPersonnelNumber(const std::string& personnel_number) {
    try {
        pqxx::connection conn(Config::getConnectionString());
        pqxx::work txn(conn);
        
        auto result = txn.exec_params(
            "SELECT * FROM employees WHERE personnel_number = $1",
            personnel_number
        );
        
        nlohmann::json json_array = nlohmann::json::array();
        
        for (const auto& row : result) {
            nlohmann::json obj;
            for (const auto& field : row) {
                if (!field.is_null()) {
                    obj[field.name()] = field.as<std::string>();
                }
            }
            json_array.push_back(obj);
        }
        
        return json_array;

    } catch (const std::exception& e) {
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

bool Get::checkIfLikedByEmployee(int newsId, int employeeId, pqxx::work& txn) {
    auto result = txn.exec_params(
        "SELECT 1 FROM news_likes WHERE news_id = $1 AND employee_id = $2",
        newsId, employeeId
    );
    return !result.empty();
}

nlohmann::json Get::getNewsWithDetails(int currentUserId) {
    try {
        pqxx::connection conn(Config::getConnectionString());
        pqxx::work txn(conn);
        txn.exec0("SET TIME ZONE 'UTC';"); // Используем точку с запятой

        pqxx::result r = txn.exec_params(R"(
            WITH comment_details AS (
                SELECT 
                    nc.news_id,
                    jsonb_agg(
                        jsonb_build_object(
                            'id', nc.id,
                            'text', nc.text,
                            'author', e.full_name,
                            'created_at', TO_CHAR(nc.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
                        )
                    ) FILTER (WHERE nc.id IS NOT NULL) as comments
                FROM news_comments nc
                LEFT JOIN employees e ON nc.employee_id = e.id
                GROUP BY nc.news_id
            )
            SELECT 
                n.id,
                n.title,
                n.content,
                encode(n.image_data, 'base64') as image_data,
                n.image_type,
                TO_CHAR(n.publication_time, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as publication_time,
                e.full_name as author_name,
                COUNT(DISTINCT nl.id) as likes_count,
                EXISTS (
                    SELECT 1 
                    FROM news_likes nl2 
                    WHERE nl2.news_id = n.id 
                    AND nl2.employee_id = $1
                ) as is_liked,
                COALESCE(cd.comments, '[]') as comments
            FROM news n
            LEFT JOIN employees e ON n.author_id = e.id
            LEFT JOIN news_likes nl ON n.id = nl.news_id
            LEFT JOIN comment_details cd ON n.id = cd.news_id
            GROUP BY n.id, n.title, n.content, n.image_data, n.image_type, 
                     n.publication_time, e.full_name, cd.comments
            ORDER BY n.publication_time DESC
        )", currentUserId);

        nlohmann::json result = nlohmann::json::array();
        
        for (const auto& row : r) {
            nlohmann::json newsItem = {
                {"id", row["id"].as<int>()},
                {"title", row["title"].as<std::string>()},
                {"content", row["content"].as<std::string>()},
                {"publication_time", row["publication_time"].as<std::string>()},
                {"author_name", row["author_name"].is_null() ? "" : row["author_name"].as<std::string>()},
                {"likes_count", row["likes_count"].as<int>()},
                {"liked", row["is_liked"].as<bool>()},
                {"comments", row["comments"].is_null() ? nlohmann::json::array() : nlohmann::json::parse(row["comments"].as<std::string>())},
                {"image_data", row["image_data"].is_null() ? "" : row["image_data"].as<std::string>()},
                {"image_type", row["image_type"].is_null() ? "" : row["image_type"].as<std::string>()}
            };
            
            result.push_back(newsItem);
        }
        
        return result;
    } catch (const std::exception& e) {
        return nlohmann::json::array();
    }
}

nlohmann::json Get::getNewsComments(int news_id) {
    try {
        pqxx::connection conn(Config::getConnectionString());
        pqxx::work txn(conn);
        
        pqxx::result r = txn.exec_params(R"(
            SELECT 
                nc.id,
                nc.text,
                nc.created_at,
                e.full_name as author_name,
                e.position as author_position
            FROM news_comments nc
            LEFT JOIN employees e ON nc.employee_id = e.id
            WHERE nc.news_id = $1
            ORDER BY nc.created_at ASC
        )", news_id);
        
        return resultToJson(r);
    } catch (std::exception const& e) {
        return nlohmann::json::array();
    }
}
