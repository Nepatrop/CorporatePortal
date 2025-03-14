SET client_encoding = 'UTF8';

-- Очищаем все таблицы кроме organizations и departments
TRUNCATE TABLE notifications, news, user_auth, employees, locations, links RESTART IDENTITY CASCADE;

-- Organizations уже создана в процессе импорта JSON

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
    location_id,
    birth_date,
    is_admin
) VALUES 
('Лебедев Александр Сергеевич', 'Лебедев Александр Сергеевич', 1, 1, 'Начальник управления', '0000-00003', '', '', '', '', false, '+73436896204', 1, '1985-03-15', true),
('Аккерман Ксения Эдмундовна', 'Аккерман Ксения Эдмундовна', 1, 2, 'Инженер-программист(2519)', '0000-00004', '', '', '', '', false, '+7 (343) 737-11-37', 2, '1990-04-12', false);

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

-- Добавляем тестовые учетные записи для существующих сотрудников
INSERT INTO user_auth (personnel_number, password_hash, employee_id) VALUES 
('0000-00003', 'admin123', 1),  -- Временно храним пароль как есть для тестов
('0000-00004', 'user123', 2);   -- Временно храним пароль как есть для тестов
