"use client"

import { useState, useEffect } from "react"
import logo from "../logo.svg"
import { api } from "../utils/api"
import { useUser } from "../context/UserContext"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons"
import styles from "../styles/Login.module.css"

function Login({ onLogin, onNavigate }) {
  const { setCurrentUser } = useUser()
  const [isRegistration, setIsRegistration] = useState(false)
  const [loginData, setLoginData] = useState({
    personnel_number: "",
    password: "",
    rememberMe: false,
  })
  const [registrationData, setRegistrationData] = useState({
    organization: "",
    department: "",
    fullName: "",
    password: "",
    position: "",
    personnel_number: "",
    work_phone: "",
    birth_date: "",
  })
  const [organizations, setOrganizations] = useState([])
  const [departments, setDepartments] = useState([])
  const [searchOrg, setSearchOrg] = useState("")
  const [searchDept, setSearchDept] = useState("")
  const [showOrgDropdown, setShowOrgDropdown] = useState(false)
  const [showDeptDropdown, setShowDeptDropdown] = useState(false)
  const [personnelNumberError, setPersonnelNumberError] = useState("")
  const [loginError, setLoginError] = useState("")
  const [registrationError, setRegistrationError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    // Загружаем список организаций и отделов
    const fetchData = async () => {
      try {
        const [orgsData, deptsData] = await Promise.all([api.get("/api/organizations"), api.get("/api/departments")])
        setOrganizations(orgsData)
        setDepartments(deptsData)
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }
    fetchData()
  }, [])

  // Обновляем обработчики кликов вне выпадающих списков
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".dropdown-container")) {
        setShowOrgDropdown(false)
        setShowDeptDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Добавляем эффект для загрузки сохраненных данных при монтировании
  useEffect(() => {
    const savedData = localStorage.getItem("rememberedLogin")
    if (savedData) {
      try {
        const { personnel_number, password, rememberMe } = JSON.parse(savedData)
        setLoginData((prev) => ({
          ...prev,
          personnel_number,
          password,
          rememberMe,
        }))
      } catch (error) {
        console.error("Error parsing saved login data:", error)
        localStorage.removeItem("rememberedLogin") // Удаляем поврежденные данные
      }
    }
  }, [])

  const handleLoginChange = (e) => {
    const { name, value, type, checked } = e.target
    setLoginData({
      ...loginData,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const checkPersonnelNumber = async (number) => {
    try {
      const data = await api.get(`/api/employees?personnel_number=${number}`)
      if (data && data.length > 0) {
        setPersonnelNumberError("Табельный номер зарегистрирован.")
        return true
      }
      setPersonnelNumberError("")
      return false
    } catch (error) {
      console.error("Error checking personnel number:", error)
      return false
    }
  }

  const handleRegistrationChange = async (e) => {
    const { name, value } = e.target
    setRegistrationData((prev) => ({ ...prev, [name]: value }))
    // Убираем проверку при вводе
    if (personnelNumberError) {
      setPersonnelNumberError("")
    }
  }

  const formatPhoneNumber = (value) => {
    // Удаляем все нецифровые символы
    const numbers = value.replace(/\D/g, "")

    if (numbers.length === 0) return ""

    // Форматируем номер в формат +7 (XXX) XXX-XX-XX
    if (numbers.length <= 1) return `+7`
    if (numbers.length <= 4) return `+7 (${numbers.slice(1)}`
    if (numbers.length <= 7) return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4)}`
    if (numbers.length <= 9) return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}-${numbers.slice(7)}`
    return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}-${numbers.slice(7, 9)}-${numbers.slice(9, 11)}`
  }

  const handlePhoneChange = (e) => {
    const { name, value } = e.target
    setRegistrationData({
      ...registrationData,
      [name]: formatPhoneNumber(value),
    })
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await api.post("/api/auth/login", {
        personnel_number: loginData.personnel_number,
        password: loginData.password,
      })

      if (response.ok) {
        const userData = await response.json()
        console.log("Login successful:", userData)
        setLoginError("")

        // Сохраняем данные пользователя в контекст
        setCurrentUser(userData) // Это обновит isAdmin автоматически через функцию updateUser

        // Сохраняем данные если включео "Запомнить меня"
        if (loginData.rememberMe) {
          localStorage.setItem(
            "rememberedLogin",
            JSON.stringify({
              personnel_number: loginData.personnel_number,
              password: loginData.password,
              rememberMe: true,
            }),
          )
        } else {
          // Очищаем сохраненные данные если "Запомнить меня" выключено
          localStorage.removeItem("rememberedLogin")
        }

        onLogin(userData)
      } else {
        console.error("Login failed")
        setLoginError("Неверный табельный номер или пароль")
      }
    } catch (error) {
      console.error("Error:", error)
      setLoginError("Ошибка сервера. Попробуйте позже")
    }
  }

  const handleRegistrationSubmit = async (e) => {
    e.preventDefault()

    if (await checkPersonnelNumber(registrationData.personnel_number)) {
      return
    }

    try {
      const response = await api.post("/api/auth/register", {
        full_name: registrationData.fullName,
        password: registrationData.password,
        organization: registrationData.organization,
        department: registrationData.department,
        position: registrationData.position,
        personnel_number: registrationData.personnel_number,
        work_phone: registrationData.work_phone,
        birth_date: registrationData.birth_date,
        is_admin: false,
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Registration successful:", data)
        setRegistrationError("") // Очищаем ошибку при успехе

        // Сразу пытаемся выполнить вход с теми же данными
        const loginResponse = await api.post("/api/auth/login", {
          personnel_number: registrationData.personnel_number,
          password: registrationData.password,
        })

        if (loginResponse.ok) {
          const userData = await loginResponse.json()
          console.log("Auto login successful:", userData)
          setCurrentUser(userData) // Сохраняем данные пользователя в контекст
          onLogin(userData) // Сразу переходим в систму
        } else {
          // Если автологин не удался, переходим на страницу входа
          setIsRegistration(false)
          setLoginData({
            personnel_number: registrationData.personnel_number,
            password: registrationData.password,
            rememberMe: false,
          })
        }
      } else {
        const error = await response.json()
        console.error("Registration failed:", error)
        setRegistrationError(error.error || "Ошибка регистрации")
      }
    } catch (error) {
      console.error("Error during registration:", error)
      setRegistrationError("Ошибка сервера при регистрации")
    }
  }

  const toggleRegistration = () => {
    setIsRegistration(!isRegistration)
  }

  // Обновляем функции фильтрации
  const filteredOrganizations = organizations.filter((org) => org.name.toLowerCase().includes(searchOrg.toLowerCase()))

  const filteredDepartments = departments.filter((dept) => dept.name.toLowerCase().startsWith(searchDept.toLowerCase()))

  const renderOrganizationField = () => (
    <div className={styles.inputGroup}>
      <label htmlFor="organization" className={styles.label}>
        Организация
      </label>
      <div className={`${styles.dropdownContainer} dropdown-container`}>
        <input
          type="text"
          id="organization"
          name="organization"
          value={registrationData.organization}
          onChange={(e) => {
            const value = e.target.value
            setSearchOrg(value)
            setRegistrationData((prev) => ({ ...prev, organization: value }))
            setShowOrgDropdown(true)
          }}
          onFocus={() => setShowOrgDropdown(true)}
          placeholder="Выберите организацию"
          className={styles.input}
          required
        />
        {showOrgDropdown && filteredOrganizations.length > 0 && (
          <div className={styles.dropdown}>
            {filteredOrganizations.map((org) => (
              <div
                key={org.id}
                className={`${styles.dropdownItem} ${registrationData.organization === org.name ? styles.dropdownItemSelected : ""}`}
                onClick={() => {
                  setRegistrationData((prev) => ({ ...prev, organization: org.name }))
                  setSearchOrg(org.name)
                  setShowOrgDropdown(false)
                }}
              >
                {org.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const renderDepartmentField = () => (
    <div className={styles.inputGroup}>
      <label htmlFor="department" className={styles.label}>
        Отдел/подразделение
      </label>
      <div className={`${styles.dropdownContainer} dropdown-container`}>
        <input
          type="text"
          id="department"
          name="department"
          value={registrationData.department}
          onChange={(e) => {
            const value = e.target.value
            setSearchDept(value)
            setRegistrationData((prev) => ({ ...prev, department: value }))
            setShowDeptDropdown(true)
          }}
          onFocus={() => setShowDeptDropdown(true)}
          placeholder="Выберите отдел"
          className={styles.input}
          required
        />
        <span className={styles.dropdownArrow} onClick={() => setShowDeptDropdown(!showDeptDropdown)}>
          ▼
        </span>
        {showDeptDropdown && filteredDepartments.length > 0 && (
          <div className={styles.dropdown}>
            {filteredDepartments.map((dept) => (
              <div
                key={dept.id}
                className={`${styles.dropdownItem} ${registrationData.department === dept.name ? styles.dropdownItemSelected : ""}`}
                onClick={() => {
                  setRegistrationData((prev) => ({ ...prev, department: dept.name }))
                  setSearchDept(dept.name)
                  setShowDeptDropdown(false)
                }}
              >
                {dept.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className={styles.container}>
      <style>
        {`
          input::placeholder {
            color: #AAAAAA !important;
          }
          
          input:focus {
            outline: none;
          }
        `}
      </style>

      {/* Логотип над блоком авторизации */}
      <div className={styles.logoContainer}>
        <img src={logo || "/placeholder.svg"} alt="ИТ-Элемент29 Logo" className={styles.logo} />
      </div>

      {/* Блок авторизации */}
      <div className={styles.authBox}>
        <h2 className={styles.title}>{isRegistration ? "Регистрация" : "Вход в систему"}</h2>

        <div className={styles.formContainer}>
          {!isRegistration ? (
            <form onSubmit={handleLoginSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="personnel_number" className={styles.label}>
                  Табельный номер
                </label>
                <input
                  type="text"
                  id="personnel_number"
                  name="personnel_number"
                  value={loginData.personnel_number}
                  onChange={handleLoginChange}
                  placeholder="Введите табельный номер"
                  className={`${styles.input} ${loginError ? styles.inputError : ""}`}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="password" className={styles.label}>
                  Пароль
                </label>
                <div className={styles.passwordContainer}>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    placeholder="Введите ваш пароль"
                    className={`${styles.input} ${loginError ? styles.inputError : ""}`}
                    required
                  />
                  <span className={styles.passwordIcon} onClick={togglePasswordVisibility}>
                    <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} />
                  </span>
                </div>
                {loginError && <div className={styles.errorMessage}>{loginError}</div>}
              </div>

              <div className={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  checked={loginData.rememberMe}
                  onChange={handleLoginChange}
                  className={styles.checkbox}
                />
                <label htmlFor="rememberMe" className={styles.checkboxLabel}>
                  Запомнить меня
                </label>
              </div>

              <button type="submit" className={styles.button}>
                Войти
              </button>

              <p className={styles.switchText}>
                Нет аккаунта?{" "}
                <span className={styles.switchLink} onClick={toggleRegistration}>
                  Регистрация
                </span>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegistrationSubmit} className={styles.form}>
              {renderOrganizationField()}

              {renderDepartmentField()}

              <div className={styles.inputGroup}>
                <label htmlFor="personnel_number" className={styles.label}>
                  Табельный номер
                </label>
                <input
                  type="text"
                  id="personnel_number"
                  name="personnel_number"
                  value={registrationData.personnel_number}
                  onChange={handleRegistrationChange}
                  placeholder="Например: 0000-00001"
                  className={`${styles.input} ${personnelNumberError ? styles.inputError : ""}`}
                  required
                />
                {personnelNumberError && <div className={styles.errorMessage}>{personnelNumberError}</div>}
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="fullName" className={styles.label}>
                  ФИО
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={registrationData.fullName}
                  onChange={handleRegistrationChange}
                  placeholder="Введите ваше ФИО"
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="regPassword" className={styles.label}>
                  Пароль
                </label>
                <div className={styles.passwordContainer}>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="regPassword"
                    name="password"
                    value={registrationData.password}
                    onChange={handleRegistrationChange}
                    placeholder="Создайте пароль"
                    className={styles.input}
                    required
                  />
                  <span className={styles.passwordIcon} onClick={togglePasswordVisibility}>
                    <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} />
                  </span>
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="position" className={styles.label}>
                  Должность
                </label>
                <input
                  type="text"
                  id="position"
                  name="position"
                  value={registrationData.position}
                  onChange={handleRegistrationChange}
                  placeholder="Введите вашу должность"
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="work_phone" className={styles.label}>
                  Рабочий телефон
                </label>
                <input
                  type="tel"
                  id="work_phone"
                  name="work_phone"
                  value={registrationData.work_phone}
                  onChange={handlePhoneChange}
                  placeholder="+7 (343) XXX-XX-XX"
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="birth_date" className={styles.label}>
                  Дата рождения
                </label>
                <input
                  type="date"
                  id="birth_date"
                  name="birth_date"
                  value={registrationData.birth_date}
                  onChange={handleRegistrationChange}
                  className={styles.input}
                  required
                />
              </div>

              <button type="submit" className={styles.button}>
                Зарегистрироваться
              </button>

              {registrationError && <div className={styles.registrationError}>{registrationError}</div>}

              <p className={styles.switchText}>
                Уже есть аккаунт?{" "}
                <span className={styles.switchLink} onClick={toggleRegistration}>
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
