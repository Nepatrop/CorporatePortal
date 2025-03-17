#include <fstream>
#include <nlohmann/json.hpp>
#include <pqxx/pqxx>
#ifdef _WIN32
    #include <direct.h>
    #define GetCurrentDir _getcwd
#else
    #include <unistd.h>
    #define GetCurrentDir getcwd
#endif

void process_department(pqxx::work& txn, const nlohmann::json& dept, const std::string& parent_code = "") {
    try {
        
        // Игнорируем parent_code если это "5500"
        std::string parent = dept.contains("КодВышестоящегоПодразделения") ? 
            dept["КодВышестоящегоПодразделения"].get<std::string>() : "";
            
        if (parent == "5500") {
            parent = "";
        }
        
        // Вставляем текущий отдел
        txn.exec_params(
            "INSERT INTO departments (name, department_code, parent_department_code, organization_id) "
            "VALUES ($1, $2::uuid, NULLIF($3, '')::uuid, 1) "
            "ON CONFLICT (department_code) DO UPDATE "
            "SET name = EXCLUDED.name, "
            "parent_department_code = NULLIF($3, '')::uuid",
            dept["Подразделение"].get<std::string>(),
            dept["КодПодразделения"].get<std::string>(),
            parent.empty() ? parent_code : parent
        );

        // Рекурсивно обрабатываем подразделения
        if (dept.contains("Подразделения") && !dept["Подразделения"].is_null()) {
            for (const auto& subdept : dept["Подразделения"]) {
                process_department(txn, subdept, dept["КодПодразделения"].get<std::string>());
            }
        }
    } catch (const std::exception& e) {
        std::cerr << "Error processing department '" << dept["Подразделение"].get<std::string>() 
                  << "': " << e.what() << std::endl;
        throw;
    }
}

int main(int argc, char* argv[]) {
    if (argc != 2) {
        std::cerr << "Usage: " << argv[0] << " <json_file_path>" << std::endl;
        return 1;
    }

    try {
        
        // Читаем JSON файл
        std::ifstream file(argv[1]);
        if (!file.is_open()) {
            std::cerr << "Cannot open file: " << argv[1] << std::endl;
            std::cerr << "Current working directory: ";
            char cwd[FILENAME_MAX];
            if (GetCurrentDir(cwd, sizeof(cwd)) != NULL) {
                std::cerr << cwd << std::endl;
            }
            return 1;
        }

        nlohmann::json data;
        try {
            data = nlohmann::json::parse(file);
        } catch (const nlohmann::json::parse_error& e) {
            std::cerr << "JSON parse error: " << e.what() << std::endl;
            return 1;
        }

        // Подключаемся к БД
        pqxx::connection conn(
            "dbname=corporate_portal "
            "user=postgres "
            "password=diploma"
        );
        
        pqxx::work txn(conn);

        // Очищаем только таблицу departments, не затрагивая связанные таблицы
        txn.exec("DELETE FROM departments;");
        
        // Создаем организацию если её нет
        txn.exec(
            "INSERT INTO organizations (id, name) "
            "VALUES (1, 'ИТ-Элемент29 ООО') "
            "ON CONFLICT (id) DO NOTHING;"
        );

        // Обрабатываем структуру отделов
        process_department(txn, data);

        // Фиксируем изменения
        txn.commit();
        return 0;

    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }
}
