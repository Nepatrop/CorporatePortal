#!/bin/bash

DB_NAME="corporate_portal"
DB_USER="postgres"
export PGPASSWORD="diploma"  # Устанавливаем пароль как переменную окружения
PSQL="psql -U $DB_USER"

# Запрашиваем подтверждение на удаление существующей БД
echo "Хотите удалить существующую БД? (y/n)"
read drop_db
if [ "$drop_db" = "y" ]; then
    echo "Удаление существующей БД..."
    $PSQL -c "DROP DATABASE $DB_NAME;"
    echo "База данных удалена."
fi

# Проверка существует ли бд
if $PSQL -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo "База данных $DB_NAME уже существует"
else
    echo
    echo "База данных $DB_NAME не найдена. Создать? (y/n)"
    read answer
    if [ "$answer" = "y" ]; then
        # Создаем базу данных с правильной локалью
        $PSQL -c "CREATE DATABASE $DB_NAME WITH TEMPLATE template0 ENCODING 'UTF8' LC_COLLATE 'Russian_Russia.UTF8' LC_CTYPE 'Russian_Russia.UTF8';"
        if [ $? -ne 0 ]; then
            echo "Пробуем альтернативную локаль..."
            $PSQL -c "CREATE DATABASE $DB_NAME WITH TEMPLATE template0 ENCODING 'UTF8' LC_COLLATE 'ru_RU.UTF8' LC_CTYPE 'ru_RU.UTF8';"
            if [ $? -ne 0 ]; then
                echo "Попытка использовать локаль по умолчанию..."
                $PSQL -c "CREATE DATABASE $DB_NAME WITH TEMPLATE template0 ENCODING 'UTF8';"
            fi
        fi
        echo "База данных успешно создана."
    else
        echo "Операция отменена."
        exit 1
    fi
fi

# Проверка таблиц и запись тестовых данных
echo
TABLES=$($PSQL -d $DB_NAME -c "\dt" | grep -E 'organizations|employees|departments|locations|news|notifications|links')
if [ -z "$TABLES" ]; then
    echo
    echo "Таблицы не найдены. Создать необходимые таблицы базы данных? (y/n)"
    read answer
    if [ "$answer" = "y" ]; then
        # При выполнении SQL скриптов добавляем явное указание кодировки и обработку ошибок
        $PSQL -d $DB_NAME -v ON_ERROR_STOP=0 -c "SET client_encoding = 'UTF8';" -f database/init_db.sql
        echo "Таблицы базы данных созданы"
        echo
        
        echo "Загружаем структуру отделов из organizations.json..."
        cd database/json_import
        ./build.bat
        cd ../..
        
        CURRENT_DIR=$(pwd -W)
        JSON_PATH="$CURRENT_DIR\\database\\organizations.json"
        echo "JSON файл: $JSON_PATH"
        
        ./database/json_import/build/Release/departments_import.exe "$JSON_PATH"
        
        if [ $? -eq 0 ]; then
            echo "Структура отделов успешно загружена."
            echo
            echo "Записать тестовые данные в остальные таблицы? (y/n)"
            read answer
            if [ "$answer" = "y" ]; then
                $PSQL -d $DB_NAME -f database/test_data.sql
                echo "Тестовая информация записана успешно."
            fi
        else
            echo "Ошибка при загрузке структуры отделов (код: $?)"
            exit 1
        fi
    else
        echo "Операция отменена."
        exit 1
    fi
else
    echo "Структура базы данных уже существует"
    echo
    echo "Хотите очистить данные в таблицах и перезаписать тестовыми? (y/n)"
    read answer
    if [ "$answer" = "y" ]; then
        echo "Очистка существующих данных..."
        $PSQL -d $DB_NAME -c "TRUNCATE TABLE notifications, news, employees, departments, organizations, locations, links RESTART IDENTITY CASCADE;"
        echo "Запись тестовых данных..."
        $PSQL -d $DB_NAME -f database/test_data.sql
        echo "Тестовые данные успешно записанны."
    fi
fi

echo
echo "Инициализация базы данных завершена."

echo
echo "Нажмите любую клавишу для выхода..."
read -n 1 -s