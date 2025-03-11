#include "db/config.h"

std::string Config::getConnectionString() {
    return "dbname=corporate_portal user=postgres password=diploma host=localhost port=5432";
}
