SET client_encoding = 'UTF8';

TRUNCATE TABLE notifications, news, employees, departments, organizations, locations, links RESTART IDENTITY CASCADE;

-- Organizations
INSERT INTO organizations (name) VALUES 
('ООО ИТ-Элемент29');

-- Departments
INSERT INTO departments (name, organization_id) VALUES 
('ИТ Отдел', 1),
('Бухгалтерия', 1),
('Отдел кадров', 1);

-- Locations
INSERT INTO locations (address) VALUES 
('ул. Пушкина, д. 10'),
('пр. Ленина, д. 25');

-- Employees with explicit IDs to ensure proper references
INSERT INTO employees (id, full_name, organization_id, department_id, work_phone, email, location_id) VALUES 
(1, 'Иванов Иван Иванович', 1, 1, '555-0100', 'ivanov@element29.ru', 1),
(2, 'Петров Петр Петрович', 1, 1, '555-0101', 'petrov@element29.ru', 1),
(3, 'Сидорова Анна Ивановна', 1, 2, '555-0102', 'sidorova@element29.ru', 2);

-- Update manager references
UPDATE employees SET manager_id = 1 WHERE id IN (2, 3);

-- News
INSERT INTO news (content, publication_time, author_id) VALUES 
('Важное объявление о работе', NOW(), 1),
('Корпоративное мероприятие в эту пятницу', NOW(), 1);

-- Notifications
INSERT INTO notifications (message, time, source, employee_id) VALUES 
('Новое сообщение', NOW(), 'система', 1),
('Напоминание о встрече', NOW(), 'календарь', 2);

-- Links
INSERT INTO links (url, description) VALUES 
('http://portal.element29.ru/docs', 'Внутренняя документация'),
('http://portal.element29.ru/wiki', 'База знаний');
