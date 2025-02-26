CREATE TABLE Organizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE Departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    organization_id INT,
    FOREIGN KEY (organization_id) REFERENCES Organizations(id)
);

CREATE TABLE Locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    address VARCHAR(255) NOT NULL
);

CREATE TABLE Employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    organization_id INT,
    department_id INT,
    work_phone VARCHAR(20),
    mobile_phone VARCHAR(20),
    email VARCHAR(255),
    manager_id INT,
    location_id INT,
    FOREIGN KEY (organization_id) REFERENCES Organizations(id),
    FOREIGN KEY (department_id) REFERENCES Departments(id),
    FOREIGN KEY (manager_id) REFERENCES Employees(id),
    FOREIGN KEY (location_id) REFERENCES Locations(id)
);

CREATE TABLE News (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content TEXT NOT NULL,
    publication_time TIMESTAMP NOT NULL,
    author_id INT,
    FOREIGN KEY (author_id) REFERENCES Employees(id)
);

CREATE TABLE Notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message TEXT NOT NULL,
    time TIMESTAMP NOT NULL,
    source VARCHAR(255),
    employee_id INT,
    FOREIGN KEY (employee_id) REFERENCES Employees(id)
);

CREATE TABLE Links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    url VARCHAR(255) NOT NULL,
    description TEXT
);