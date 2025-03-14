SET client_encoding = 'UTF8';
SET standard_conforming_strings = ON;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'corporate_portal') THEN
        PERFORM dblink_exec('dbname=' || current_database(), 
            'CREATE DATABASE corporate_portal WITH ENCODING ''UTF8'' LC_COLLATE ''Russian_Russia.UTF8'' LC_CTYPE ''Russian_Russia.UTF8''');
    END IF;
END
$$;

-- Добавляем поддержку UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    organization_id INT,
    department_code UUID UNIQUE NOT NULL, -- Добавляем UNIQUE и NOT NULL ограничения
    parent_department_code UUID,
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    physical_person_name VARCHAR(255) NOT NULL,
    organization_id INT,
    department_id INT,
    position VARCHAR(255),
    personnel_number VARCHAR(20) UNIQUE NOT NULL, -- Добавляем UNIQUE ограничение
    dismissal_date DATE,
    service VARCHAR(255),
    can_help_with TEXT,
    responsibilities TEXT,
    makes_decisions TEXT,
    is_dismissed BOOLEAN DEFAULT FALSE,
    work_phone VARCHAR(20),
    manager_id INT,
    location_id INT,
    birth_date DATE,
    is_admin BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (manager_id) REFERENCES employees(id),
    FOREIGN KEY (location_id) REFERENCES locations(id)
);

CREATE TABLE news (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    publication_time TIMESTAMP NOT NULL,
    author_id INT,
    FOREIGN KEY (author_id) REFERENCES employees(id)
);

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    time TIMESTAMP NOT NULL,
    source VARCHAR(255),
    employee_id INT,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE links (
    id SERIAL PRIMARY KEY,
    url VARCHAR(255) NOT NULL,
    description TEXT
);

CREATE TABLE user_auth (
    id SERIAL PRIMARY KEY,
    personnel_number VARCHAR(20) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    employee_id INT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (personnel_number) REFERENCES employees(personnel_number)
);

CREATE INDEX idx_user_auth_personnel_number ON user_auth(personnel_number);