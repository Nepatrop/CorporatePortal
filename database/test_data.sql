SET client_encoding = 'UTF8';

TRUNCATE TABLE notifications, news, employees, departments, organizations, locations, links RESTART IDENTITY CASCADE;

-- Organizations
INSERT INTO organizations (name) VALUES 
('ИТ-Элемент29 ООО');

-- Departments
INSERT INTO departments (name, organization_id, department_code, parent_department_code) VALUES 
('Управление развития систем расчета зарплаты и управления персоналом', 1, 'bc855daa-531c-11ee-81a6-00155d1ad303', NULL),
('Отдел поддержки систем управления персоналом (Сухой Лог)', 1, 'f401c2d2-531e-11ee-81a6-00155d1ad303', 'bc855daa-531c-11ee-81a6-00155d1ad303');

-- Locations
INSERT INTO locations (name) VALUES 
('Верхняя Пышма-1'),
('Сухой Лог');

-- Employees
INSERT INTO employees (
    full_name, 
    physical_person_name,
    organization_id,
    department_id,
    position,
    personnel_number,
    service,
    can_help_with,
    responsibilities,
    makes_decisions,
    is_dismissed,
    work_phone,
    location_id
) VALUES 
('Лебедев Александр Сергеевич', 'Лебедев Александр Сергеевич', 1, 1, 'Начальник управления', '0000-00003', '', '', '', '', false, '+73436896204', 1),
('Аккерман Ксения Эдмундовна', 'Аккерман Ксения Эдмундовна', 1, 2, 'Инженер-программист(2519)', '0000-00004', '', '', '', '', false, '+7 (343) 737-11-37', 2);

-- Update manager references
UPDATE employees SET manager_id = (SELECT id FROM employees WHERE personnel_number = '0000-00003') 
WHERE personnel_number = '0000-00004';

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
