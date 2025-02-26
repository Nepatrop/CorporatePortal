#include "includes/mysql_driver.h"
#include "includes/mysql_connection.h"
#include <cppconn/statement.h>

int main() {
    try {
        sql::mysql::MySQL_Driver *driver;
        sql::Connection *con;

        driver = sql::mysql::get_mysql_driver_instance();
        con = driver->connect("tcp://127.0.0.1:3306", "root", "your_password");

        con->setSchema("corporate_portal");

        sql::Statement *stmt;
        stmt = con->createStatement();
        stmt->execute("SELECT * FROM Employees");

        delete stmt;
        delete con;
    } catch (sql::SQLException &e) {
        std::cerr << "Error: " << e.what() << std::endl;
    }

    return 0;
}