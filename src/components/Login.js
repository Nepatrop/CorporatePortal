"use client"

import { useState, useEffect } from "react"
import { useUser } from "../context/UserContext"
import { api } from "../utils/api"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faEye, faEyeSlash, faChevronDown } from "@fortawesome/free-solid-svg-icons"
import logo from "../logo.svg"
import styles from "../styles/Login.module.css"

function Login({ onLogin }) {
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [validationErrors, setValidationErrors] = useState({})
  const { setCurrentUser } = useUser()

  // Поля для регистрации
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [position, setPosition] = useState("")
  const [department, setDepartment] = useState("")
  const [departments, setDepartments] = useState([])
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false)
  const [searchDepartment, setSearchDepartment] = useState("")
  const [registrationError, setRegistrationError] = useState("")

  // Загрузка списка отделов при монтировании компонента
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await api.get("/api/departments")
        setDepartments(data)
      } catch (error) {
        console.error("Error fetching departments:", error)
      }
    }

    fetchDepartments()

    // Проверяем, есть ли сохраненные данные для входа
    const savedUsername = localStorage.getItem("rememberedLogin")
    if (savedUsername) {
      setUsername(savedUsername)
      setRememberMe(true)
    }
  }, [])

  // Фильтрация отделов при поиске
  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(searchDepartment.toLowerCase()),
  )

  // Обработчик входа
  const handleLogin = async (e) => {
    e.preventDefault()

    // Валидация
    const errors = {}
    if (!username.trim()) errors.username = "Введите имя пользователя"
    if (!password.trim()) errors.password = "Введите пароль"

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    try {
      // Отправляем запрос на сервер для аутентификации
      const response = await api.post("/api/login", {
        username,
        password,
      })

      // Добавим отладочную информацию
      console.log("Login response:", response)

      // Проверяем статус ответа
      if (response.ok) {
        // Пытаемся получить данные из ответа
        try {
          const userData = await response.json()
          console.log("User data:", userData)

          // Сохраняем имя пользователя, если выбрана опция "Запомнить меня"
          if (rememberMe) {
            localStorage.setItem("rememberedLogin", username)
          } else {
            localStorage.removeItem("rememberedLogin")
          }

          // Обновляем контекст пользователя
          setCurrentUser(userData)

          // Вызываем функцию обратного вызова для перехода на главную страницу
          onLogin()
        } catch (jsonError) {
          console.error("Error parsing JSON response:", jsonError)
          setErrorMessage("Ошибка при обработке ответа сервера")
        }
      } else {
        let errorMessage = "Неверное имя пользователя или пароль"
        try {
          const errorText = await response.text()
          console.log("Error response text:", errorText)

          if (errorText) {
            try {
              const errorJson = JSON.parse(errorText)
              errorMessage = errorJson.message || errorMessage
            } catch (e) {
              console.error("Error parsing error response:", e)
            }
          }
        } catch (e) {
          console.error("Error reading error response:", e)
        }
        setErrorMessage(errorMessage)
      }
    } catch (error) {
      console.error("Login error:", error)
      setErrorMessage("Ошибка при входе. Пожалуйста, попробуйте позже.")
    }
  }

  // Обработчик регистрации
  const handleRegister = async (e) => {
    e.preventDefault()

    // Валидация
    const errors = {}
    if (!fullName.trim()) errors.fullName = "Введите ФИО"
    if (!username.trim()) errors.username = "Введите имя пользователя"
    if (!password.trim()) errors.password = "Введите пароль"
    if (!email.trim()) errors.email = "Введите email"
    if (!position.trim()) errors.position = "Введите должность"
    if (!department.trim()) errors.department = "Выберите отдел"

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    try {
      // Отправляем запрос на сервер для регистрации
      const response = await api.post("/api/register", {
        full_name: fullName,
        username,
        password,
        email,
        position,
        department,
      })

      if (response.ok) {
        const userData = await response.json()

        // Обновляем контекст пользователя
        setCurrentUser(userData)

        // Вызываем функцию обратного вызова для перехода на главную страницу
        onLogin()
      } else {
        const errorData = await response.json()
        setRegistrationError(errorData.message || "Ошибка при регистрации")
      }
    } catch (error) {
      console.error("Registration error:", error)
      setRegistrationError("Ошибка при регистрации. Пожалуйста, попробуйте позже.")
    }
  }

  // Переключение между режимами входа и регистрации
  const toggleMode = () => {
    setIsLoginMode(!isLoginMode)
    setErrorMessage("")
    setRegistrationError("")
    setValidationErrors({})
  }

  // Переключение видимости пароля
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className={styles.container}>
      <div className={styles.logoContainer}>
        <img src={logo || "/placeholder.svg"} alt="ИТ-Элемент29 Logo" className={styles.logo} />
      </div>

      <div className={styles.authBox}>
        <h2 className={styles.title}>{isLoginMode ? "Вход в систему" : "Регистрация"}</h2>

        <div className={styles.formContainer}>
          {isLoginMode ? (
            // Форма входа
            <form onSubmit={handleLogin} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="username" className={styles.label}>
                  Имя пользователя или табельный номер
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    setValidationErrors((prev) => ({ ...prev, username: "" }))
                  }}
                  className={`${styles.input} ${validationErrors.username ? styles.inputError : ""}`}
                />
                {validationErrors.username && <span className={styles.errorMessage}>{validationErrors.username}</span>}
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="password" className={styles.label}>
                  Пароль
                </label>
                <div className={styles.passwordContainer}>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setValidationErrors((prev) => ({ ...prev, password: "" }))
                    }}
                    className={`${styles.input} ${validationErrors.password ? styles.inputError : ""}`}
                  />
                  <FontAwesomeIcon
                    icon={showPassword ? faEyeSlash : faEye}
                    className={styles.passwordIcon}
                    onClick={togglePasswordVisibility}
                  />
                </div>
                {validationErrors.password && <span className={styles.errorMessage}>{validationErrors.password}</span>}
              </div>

              <div className={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className={styles.checkbox}
                />
                <label htmlFor="rememberMe" className={styles.checkboxLabel}>
                  Запомнить меня
                </label>
              </div>

              {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}

              <button type="submit" className={styles.button}>
                Войти
              </button>

              <p className={styles.switchText}>
                Нет аккаунта?{" "}
                <span className={styles.switchLink} onClick={toggleMode}>
                  Зарегистрироваться
                </span>
              </p>
            </form>
          ) : (
            // Форма регистрации
            <form onSubmit={handleRegister} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="fullName" className={styles.label}>
                  ФИО*
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value)
                    setValidationErrors((prev) => ({ ...prev, fullName: "" }))
                  }}
                  className={`${styles.input} ${validationErrors.fullName ? styles.inputError : ""}`}
                />
                {validationErrors.fullName && <span className={styles.errorMessage}>{validationErrors.fullName}</span>}
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="regUsername" className={styles.label}>
                  Имя пользователя*
                </label>
                <input
                  type="text"
                  id="regUsername"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    setValidationErrors((prev) => ({ ...prev, username: "" }))
                  }}
                  className={`${styles.input} ${validationErrors.username ? styles.inputError : ""}`}
                />
                {validationErrors.username && <span className={styles.errorMessage}>{validationErrors.username}</span>}
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="regPassword" className={styles.label}>
                  Пароль*
                </label>
                <div className={styles.passwordContainer}>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="regPassword"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setValidationErrors((prev) => ({ ...prev, password: "" }))
                    }}
                    className={`${styles.input} ${validationErrors.password ? styles.inputError : ""}`}
                  />
                  <FontAwesomeIcon
                    icon={showPassword ? faEyeSlash : faEye}
                    className={styles.passwordIcon}
                    onClick={togglePasswordVisibility}
                  />
                </div>
                {validationErrors.password && <span className={styles.errorMessage}>{validationErrors.password}</span>}
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="email" className={styles.label}>
                  Email*
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setValidationErrors((prev) => ({ ...prev, email: "" }))
                  }}
                  className={`${styles.input} ${validationErrors.email ? styles.inputError : ""}`}
                />
                {validationErrors.email && <span className={styles.errorMessage}>{validationErrors.email}</span>}
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="position" className={styles.label}>
                  Должность*
                </label>
                <input
                  type="text"
                  id="position"
                  value={position}
                  onChange={(e) => {
                    setPosition(e.target.value)
                    setValidationErrors((prev) => ({ ...prev, position: "" }))
                  }}
                  className={`${styles.input} ${validationErrors.position ? styles.inputError : ""}`}
                />
                {validationErrors.position && <span className={styles.errorMessage}>{validationErrors.position}</span>}
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="department" className={styles.label}>
                  Отдел*
                </label>
                <div className={styles.dropdownContainer}>
                  <input
                    type="text"
                    id="department"
                    value={department}
                    onChange={(e) => {
                      setDepartment(e.target.value)
                      setSearchDepartment(e.target.value)
                      setShowDepartmentDropdown(true)
                      setValidationErrors((prev) => ({ ...prev, department: "" }))
                    }}
                    onFocus={() => setShowDepartmentDropdown(true)}
                    className={`${styles.input} ${validationErrors.department ? styles.inputError : ""}`}
                    placeholder="Выберите отдел"
                  />
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className={styles.dropdownArrow}
                    onClick={() => setShowDepartmentDropdown(!showDepartmentDropdown)}
                  />
                  {showDepartmentDropdown && filteredDepartments.length > 0 && (
                    <div className={styles.dropdown}>
                      {filteredDepartments.map((dept) => (
                        <div
                          key={dept.id}
                          className={`${styles.dropdownItem} ${department === dept.name ? styles.dropdownItemSelected : ""}`}
                          onClick={() => {
                            setDepartment(dept.name)
                            setShowDepartmentDropdown(false)
                          }}
                        >
                          {dept.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {validationErrors.department && (
                  <span className={styles.errorMessage}>{validationErrors.department}</span>
                )}
              </div>

              {registrationError && <div className={styles.registrationError}>{registrationError}</div>}

              <button type="submit" className={styles.button}>
                Зарегистрироваться
              </button>

              <p className={styles.switchText}>
                Уже есть аккаунт?{" "}
                <span className={styles.switchLink} onClick={toggleMode}>
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

export default Login
