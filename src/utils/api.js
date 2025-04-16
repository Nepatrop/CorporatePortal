// Функция для получения IP адреса сервера
const getServerIP = () => {
    // Если мы на localhost, используем его
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "localhost"
    }
    // Иначе используем текущий IP адрес
    return window.location.hostname
  }
  
  const API_URL = `http://${getServerIP()}:8081`
  const API_KEY = "cp_e29b7d8f4a6c2135d9f0"
  const MOCK_MODE = true // Включаем режим имитации API
  
  const defaultHeaders = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json",
  }
  
  // Функция для имитации задержки ответа
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  
  // Массив пользователей для имитации API
  const mockUsers = [
    {
      id: 1,
      username: "admin",
      password: "admin",
      personnel_number: "0000-00001",
      full_name: "Администратор",
      position: "Администратор системы",
      email: "admin@example.com",
      is_admin: true,
      department: "ИТ отдел",
    },
    {
      id: 2,
      username: "user",
      password: "user",
      personnel_number: "0000-00002",
      full_name: "Иван Иванов",
      position: "Разработчик",
      email: "ivan@example.com",
      is_admin: false,
      department: "Отдел разработки",
    },
    {
      id: 3,
      username: "0000-00003",
      password: "admin123",
      personnel_number: "0000-00003",
      full_name: "Лебедев Александр Сергеевич",
      position: "Начальник управления",
      email: "lebedeva@example.com",
      is_admin: true,
      department: "Управление",
    },
  ]
  
  const mockAPI = {
    login: async (data) => {
      await delay(500) // Имитация задержки сети
  
      console.log("Mock login attempt with:", data)
  
      // Приведем имя пользователя и пароль к строкам и удалим пробелы
      const username = String(data.username).trim()
      const password = String(data.password).trim()
  
      // Найдем ��ользователя с таким именем/табельным номером и паролем
      const user = mockUsers.find(
        (u) =>
          (String(u.username).trim() === username || String(u.personnel_number).trim() === username) &&
          String(u.password).trim() === password,
      )
  
      console.log("Found user:", user)
  
      if (user) {
        const { password, ...userData } = user // Удаляем пароль из данных пользователя
        return new Response(JSON.stringify(userData), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      } else {
        return new Response(JSON.stringify({ message: "Неверное имя пользователя или пароль" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      }
    },
  
    register: async (data) => {
      await delay(500)
      // Проверяем, существует ли пользователь с таким именем
      if (mockUsers.some((u) => u.username === data.username)) {
        return new Response(JSON.stringify({ message: "Пользователь с таким именем уже существует" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        })
      }
  
      // Создаем нового пользователя
      const newUser = {
        id: mockUsers.length + 1,
        username: data.username,
        password: data.password,
        full_name: data.full_name,
        position: data.position,
        email: data.email,
        is_admin: false,
        department: data.department,
      }
  
      mockUsers.push(newUser)
  
      const { password, ...userData } = newUser
      return new Response(JSON.stringify(userData), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    },
  
    // Заглушки для других методов API
    get: async (endpoint) => {
      await delay(300)
  
      if (endpoint === "/api/departments") {
        return [
          { id: 1, name: "ИТ отдел" },
          { id: 2, name: "Отдел разработки" },
          { id: 3, name: "Бухгалтерия" },
          { id: 4, name: "Отдел кадров" },
          { id: 5, name: "Маркетинг" },
        ]
      }
  
      if (endpoint.startsWith("/api/news")) {
        return []
      }
  
      if (endpoint === "/api/links") {
        return [
          {
            id: 1,
            name: "Корпоративная почта",
            description: "Доступ к корпоративной почте",
            url: "https://mail.example.com",
            icon_emoji: "📧",
          },
          {
            id: 2,
            name: "Система учета рабочего времени",
            description: "Учет рабочего времени сотрудников",
            url: "https://time.example.com",
            icon_emoji: "⏱️",
          },
          {
            id: 3,
            name: "База знаний",
            description: "Корпоративная база знаний",
            url: "https://kb.example.com",
            icon_emoji: "📚",
          },
        ]
      }
  
      if (endpoint === "/api/employees") {
        return mockUsers.map(({ password, ...user }) => user)
      }
  
      return []
    },
  }
  
  export const api = {
    get: async (endpoint) => {
      if (MOCK_MODE) {
        return mockAPI.get(endpoint)
      }
  
      const response = await fetch(`${API_URL}${endpoint}`, {
        headers: defaultHeaders,
      })
      return response.json()
    },
  
    post: async (endpoint, data) => {
      if (MOCK_MODE) {
        if (endpoint === "/api/login") {
          return mockAPI.login(data)
        }
        if (endpoint === "/api/register") {
          return mockAPI.register(data)
        }
        // Для других эндпоинтов возвращаем успешный ответ
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      }
  
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: defaultHeaders,
        body: JSON.stringify(data),
      })
      return response
    },
  
    put: async (endpoint, data) => {
      if (MOCK_MODE) {
        // Имитация успешного ответа
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      }
  
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "PUT",
        headers: defaultHeaders,
        body: JSON.stringify(data),
      })
      return response
    },
  
    delete: async (endpoint) => {
      if (MOCK_MODE) {
        // Имитация успешного ответа
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      }
  
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "DELETE",
        headers: defaultHeaders,
      })
      return response
    },
  
    // Специальные методы для работы с формами и файлами где не нужен Content-Type: application/json
    postFormData: async (endpoint, formData) => {
      if (MOCK_MODE) {
        // Имитация успешного ответа
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      }
  
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "X-API-Key": API_KEY,
        },
        body: formData,
      })
      return response
    },
  
    putFormData: async (endpoint, formData) => {
      if (MOCK_MODE) {
        // Имитация успешного ответа
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      }
  
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "PUT",
        headers: {
          "X-API-Key": API_KEY,
        },
        body: formData,
      })
      return response
    },
  }
  