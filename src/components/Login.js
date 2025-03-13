"use client"

import { useState } from "react"
import logo from "../logo.svg"

function Login({ onLogin, onNavigate }) {
  const [isRegistration, setIsRegistration] = useState(false)
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })
  const [registrationData, setRegistrationData] = useState({
    organization: "",
    department: "",
    fullName: "",
    email: "",
    password: "",
  })

  const handleLoginChange = (e) => {
    const { name, value, type, checked } = e.target
    setLoginData({
      ...loginData,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  const handleRegistrationChange = (e) => {
    const { name, value } = e.target
    setRegistrationData({
      ...registrationData,
      [name]: value,
    })
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    console.log("Login data:", loginData)

    // Здесь будет запрос к API для авторизации пользователя
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Login successful:", data)
        if (onLogin) {
          onLogin(data) // Передача данных авторизации в родительский компонент
        }
      } else {
        console.error("Login failed:", response.statusText)
      }
    } catch (error) {
      console.error("Error during login:", error)
    }
  }

  const handleRegistrationSubmit = async (e) => {
    e.preventDefault()
    console.log("Registration data:", registrationData)

    // Здесь будет запрос к API для регистрации пользователя
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationData),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Registration successful:", data)
        setIsRegistration(false)
        setLoginData({
          ...loginData,
          email: registrationData.email,
        })
      } else {
        console.error("Registration failed:", response.statusText)
      }
    } catch (error) {
      console.error("Error during registration:", error)
    }
  }

  const toggleRegistration = () => {
    setIsRegistration(!isRegistration)
  }

  // Функция для изменения стилей при наведении
  const handleMouseOver = (e) => {
    e.target.style.backgroundColor = "#EE6B0C" // Оранжевый фон
    e.target.style.color = "#FFFFFF" // Белый текст
  }

  // Функция для возврата стилей при уходе курсора
  const handleMouseOut = (e) => {
    e.target.style.backgroundColor = "#FFFFFF" // Белый фон
    e.target.style.color = "#EE6B0C" // Оранжевый текст
  }

  return (
    <div style={styles.container}>
      <style>
        {`
          input::placeholder {
            color: #AAAAAA !important;
          }
          
          input:focus {
            outline: none;
            border: 1px solid #EE6B0C !important;
          }
          
          input[type="password"] {
            color: #13454B !important;
          }
          
          input[type="password"]::placeholder {
            color: #AAAAAA !important;
          }
        `}
      </style>

      <div style={styles.authContainer}>
        <div style={styles.logoContainer}>
          <img src={logo || "/placeholder.svg"} alt="ИТ-Элемент29 Logo" style={styles.logo} />
        </div>

        <div style={styles.authBox}>
          <h2 style={styles.title}>{isRegistration ? "Регистрация" : "Вход в систему"}</h2>

          {!isRegistration ? (
            <form onSubmit={handleLoginSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <label htmlFor="email" style={styles.label}>
                  Логин (почта)
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={loginData.email}
                  onChange={handleLoginChange}
                  placeholder="Введите вашу почту"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label htmlFor="password" style={styles.label}>
                  Пароль
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  placeholder="Введите ваш пароль"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  checked={loginData.rememberMe}
                  onChange={handleLoginChange}
                  style={styles.checkbox}
                />
                <label htmlFor="rememberMe" style={styles.checkboxLabel}>
                  Запомнить меня
                </label>
              </div>

              <button
                type="submit"
                style={styles.button}
                onMouseOver={handleMouseOver}
                onMouseOut={handleMouseOut}
              >
                Войти
              </button>

              <p style={styles.switchText}>
                Нет аккаунта?{" "}
                <span style={styles.switchLink} onClick={toggleRegistration}>
                  Регистрация
                </span>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegistrationSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <label htmlFor="organization" style={styles.label}>
                  Организация
                </label>
                <input
                  type="text"
                  id="organization"
                  name="organization"
                  value={registrationData.organization}
                  onChange={handleRegistrationChange}
                  placeholder="Введите название организации"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label htmlFor="department" style={styles.label}>
                  Отдел/подразделение
                </label>
                <input
                  type="text"
                  id="department"
                  name="department"
                  value={registrationData.department}
                  onChange={handleRegistrationChange}
                  placeholder="Введите отдел/подразделение"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label htmlFor="fullName" style={styles.label}>
                  ФИО
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={registrationData.fullName}
                  onChange={handleRegistrationChange}
                  placeholder="Введите ваше ФИО"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label htmlFor="regEmail" style={styles.label}>
                  Логин (почта)
                </label>
                <input
                  type="email"
                  id="regEmail"
                  name="email"
                  value={registrationData.email}
                  onChange={handleRegistrationChange}
                  placeholder="Введите вашу почту"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label htmlFor="regPassword" style={styles.label}>
                  Пароль
                </label>
                <input
                  type="password"
                  id="regPassword"
                  name="password"
                  value={registrationData.password}
                  onChange={handleRegistrationChange}
                  placeholder="Создайте пароль"
                  style={styles.input}
                  required
                />
              </div>

              <button
                type="submit"
                style={styles.button}
                onMouseOver={handleMouseOver}
                onMouseOut={handleMouseOut}
              >
                Зарегистрироваться
              </button>

              <p style={styles.switchText}>
                Уже есть аккаунт?{" "}
                <span style={styles.switchLink} onClick={toggleRegistration}>
                  Войти
                </span>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#FFFFFF",
    fontFamily: "'Manrope', Arial, sans-serif",
  },
  authContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "400px",
  },
  logoContainer: {
    marginBottom: "20px",
    display: "flex",
    justifyContent: "center",
    width: "100%",
  },
  logo: {
    height: "80px",
    width: "auto",
  },
  authBox: {
    width: "100%",
    backgroundColor: "#F5F5F5", // Светло-серый фон
    borderRadius: "10px",
    padding: "30px",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
  },
  title: {
    color: "#13454B", // Изумрудный цвет текста
    textAlign: "center",
    marginBottom: "30px",
    fontSize: "24px",
    fontWeight: 600,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  label: {
    color: "#13454B", // Изумрудный цвет текста
    fontSize: "14px",
    fontWeight: 500,
  },
  input: {
    padding: "12px 15px",
    borderRadius: "8px",
    border: "1px solid #CCCCCC",
    backgroundColor: "#FFFFFF",
    fontSize: "16px",
    color: "#13454B", // Изумрудный цвет текста
  },
  checkboxGroup: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  checkbox: {
    accentColor: "#EE6B0C", // Оранжевый цвет для чекбокса
    width: "16px",
    height: "16px",
    cursor: "pointer",
  },
  checkboxLabel: {
    color: "#13454B", // Изумрудный цвет текста
    fontSize: "14px",
    cursor: "pointer",
  },
  button: {
    padding: "12px 15px",
    backgroundColor: "#FFFFFF", // Белый фон
    color: "#EE6B0C", // Оранжевый текст
    border: "1px solid #EE6B0C",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background-color 0.3s, color 0.3s", // Плавный переход
  },
  switchText: {
    color: "#13454B", // Изумрудный цвет текста
    textAlign: "center",
    fontSize: "14px",
    marginTop: "10px",
  },
  switchLink: {
    color: "#EE6B0C", // Оранжевый цвет для ссылки
    cursor: "pointer",
    textDecoration: "underline",
  },
}

export default Login