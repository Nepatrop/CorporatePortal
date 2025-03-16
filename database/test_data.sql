SET client_encoding = 'UTF8';

-- Очищаем все таблицы
TRUNCATE TABLE notifications, news_comments, news_likes, news, user_auth, employees, locations, links RESTART IDENTITY CASCADE;

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

-- Добавляем тестовые новости с изображениями
INSERT INTO news (title, content, image_data, image_type, publication_time, author_id) VALUES 
('Новый проект запущен', 'Мы рады сообщить о запуске нового проекта, который поможет оптимизировать рабочие процессы.', 
 pg_read_binary_file('img\1.jpg'), 'image/jpg', '2023-05-15 10:30:00', 1),
('Корпоративное мероприятие', 'Не забудьте зарегистрироваться на корпоративное мероприятие, которое состоится в конце месяца.',
 pg_read_binary_file('img\2.jpg'), 'image/jpg', '2023-05-10 15:45:00', 1),
('Новые курсы обучения', 'Доступны новые курсы обучения для всех сотрудников. Успейте записаться!',
 pg_read_binary_file('img\3.jpg'), 'image/jpg', '2023-05-05 09:15:00', 2);

-- Добавляем лайки к новостям (убираем created_at из INSERT)
INSERT INTO news_likes (news_id, employee_id) VALUES
(1, 2),
(2, 1),
(3, 1),
(1, 1);

-- Добавляем комментарии к новостям
INSERT INTO news_comments (news_id, employee_id, text, created_at) VALUES
(1, 2, 'Отличная новость! Жду не дождусь начала работы над проектом.', '2023-05-15 11:30:00'),
(1, 1, 'Интересно, какие технологии будут использоваться?', '2023-05-15 12:15:00'),
(2, 2, 'Обязательно приду!', '2023-05-10 16:30:00');

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
