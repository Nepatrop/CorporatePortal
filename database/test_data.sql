-- Добавление организаций
INSERT INTO organizations (name) VALUES 
('ООО ИТ-Элемент29');

-- Добавление отделов
INSERT INTO departments (name, organization_id) VALUES 
('IT отдел', 1),
('Бухгалтерия', 1),
('Отдел кадров', 1);

-- Добавление локаций
INSERT INTO locations (address) VALUES 
('ул. Пушкина, д. 10'),
('пр. Ленина, д. 25');

-- Добавление сотрудников
INSERT INTO employees (full_name, organization_id, department_id, work_phone, email, location_id) VALUES 
('Иванов Иван Иванович', 1, 1, '555-0100', 'ivanov@test.com', 1);

-- Добавление подчиненных
INSERT INTO employees (full_name, organization_id, department_id, work_phone, email, manager_id, location_id) VALUES 
('Петров Петр Петрович', 1, 1, '555-0101', 'petrov@test.com', 1, 1),
('Сидорова Анна Ивановна', 1, 2, '555-0102', 'sidorova@test.com', 1, 2);

-- Добавление новостей
INSERT INTO news (content, publication_time, author_id) VALUES 
('Важное объявление о работе', NOW(), 1),
('Корпоративное мероприятие', NOW(), 2);

-- Добавление уведомлений
INSERT INTO notifications (message, time, source, employee_id) VALUES 
('Новое сообщение', NOW(), 'system', 1),
('Напоминание о встрече', NOW(), 'calendar', 2);

-- Добавление ссылок
INSERT INTO links (url, description) VALUES 
('http://internal.portal/docs', 'Внутренняя документация'),
('http://internal.portal/wiki', 'База знаний');
