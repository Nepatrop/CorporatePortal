"use client"

import { useState, useEffect } from "react"
import logo from "../logo.svg"

function Login({ onLogin, onNavigate }) {
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
    birth_date: ""
  })
  const [organizations, setOrganizations] = useState([])
  const [departments, setDepartments] = useState([])
  const [searchOrg, setSearchOrg] = useState("")
  const [searchDept, setSearchDept] = useState("")
  const [showOrgDropdown, setShowOrgDropdown] = useState(false)
  const [showDeptDropdown, setShowDeptDropdown] = useState(false)
  const [personnelNumberError, setPersonnelNumberError] = useState("")
  const [loginError, setLoginError] = useState("");
  const [registrationError, setRegistrationError] = useState("");

  useEffect(() => {
    // Загружаем список организаций при монтировании
    fetch('http://localhost:8081/api/organizations', {
      headers: {
        'X-API-Key': 'cp_e29b7d8f4a6c2135d9f0'
      }
    })
    .then(response => response.json())
    .then(data => setOrganizations(data))
    .catch(error => console.error('Error fetching organizations:', error));

    // Загружаем список отделов
    fetch('http://localhost:8081/api/departments', {
      headers: {
        'X-API-Key': 'cp_e29b7d8f4a6c2135d9f0'
      }
    })
    .then(response => response.json())
    .then(data => setDepartments(data))
    .catch(error => console.error('Error fetching departments:', error));
  }, []);

  // Обновляем обработчики кликов вне выпадающих списков
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setShowOrgDropdown(false);
        setShowDeptDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Добавляем эффект для загрузки сохраненных данных при монтировании
  useEffect(() => {
    const savedData = localStorage.getItem('rememberedLogin');
    if (savedData) {
      const { personnel_number, rememberMe } = JSON.parse(savedData);
      setLoginData(prev => ({
        ...prev,
        personnel_number,
        rememberMe
      }));
    }
  }, []);

  const handleLoginChange = (e) => {
    const { name, value, type, checked } = e.target
    setLoginData({
      ...loginData,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  const checkPersonnelNumber = async (number) => {
    try {
      const response = await fetch(`http://localhost:8081/api/employees?personnel_number=${number}`, {
        headers: {
          'X-API-Key': 'cp_e29b7d8f4a6c2135d9f0'
        }
      });
      const data = await response.json();
      if (data && data.length > 0) {
        setPersonnelNumberError("Табельный номер зарегистрирован.");
        return true;
      }
      setPersonnelNumberError("");
      return false;
    } catch (error) {
      console.error("Error checking personnel number:", error);
      return false;
    }
  };

  const handleRegistrationChange = async (e) => {
    const { name, value } = e.target;
    setRegistrationData(prev => ({...prev, [name]: value}));
    // Убираем проверку при вводе
    if (personnelNumberError) {
      setPersonnelNumberError('');
    }
  };

  const formatPhoneNumber = (value) => {
    // Удаляем все нецифровые символы
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length === 0) return '';
    
    // Форматируем номер в формат +7 (XXX) XXX-XX-XX
    if (numbers.length <= 1) return `+7`;
    if (numbers.length <= 4) return `+7 (${numbers.slice(1)}`;
    if (numbers.length <= 7) return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4)}`;
    if (numbers.length <= 9) return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}-${numbers.slice(7)}`;
    return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}-${numbers.slice(7, 9)}-${numbers.slice(9, 11)}`;
  };

  const handlePhoneChange = (e) => {
    const { name, value } = e.target;
    setRegistrationData({
      ...registrationData,
      [name]: formatPhoneNumber(value)
    });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8081/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'cp_e29b7d8f4a6c2135d9f0'
        },
        body: JSON.stringify({
          personnel_number: loginData.personnel_number,
          password: loginData.password
        })
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('Login successful:', userData);
        setLoginError("");

        // Сохраняем данные если включено "Запомнить меня"
        if (loginData.rememberMe) {
          localStorage.setItem('rememberedLogin', JSON.stringify({
            personnel_number: loginData.personnel_number,
            rememberMe: true
          }));
        } else {
          // Очищаем сохраненные данные если "Запомнить меня" выключено
          localStorage.removeItem('rememberedLogin');
        }

        onLogin(userData);
      } else {
        console.error('Login failed');
        setLoginError("Неверный табельный номер или пароль");
      }
    } catch (error) {
      console.error('Error:', error);
      setLoginError("Ошибка сервера. Попробуйте позже");
    }
  };

  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();
    
    // Проверяем табельный номер перед отправкой формы
    const isPersonnelNumberTaken = await checkPersonnelNumber(registrationData.personnel_number);
    if (isPersonnelNumberTaken) {
      setPersonnelNumberError("Табельный номер зарегистрирован.");
      return; // Прерываем отправку формы
    }

    try {
        const response = await fetch('http://localhost:8081/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': 'cp_e29b7d8f4a6c2135d9f0'
            },
            body: JSON.stringify({
                full_name: registrationData.fullName,
                password: registrationData.password,
                organization: registrationData.organization,
                department: registrationData.department,
                position: registrationData.position,
                personnel_number: registrationData.personnel_number,
                work_phone: registrationData.work_phone,
                birth_date: registrationData.birth_date,
                is_admin: false
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log("Registration successful:", data);
            setRegistrationError(""); // Очищаем ошибку при успехе
            
            // Сразу пытаемся выполнить вход с теми же данными
            const loginResponse = await fetch('http://localhost:8081/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': 'cp_e29b7d8f4a6c2135d9f0'
                },
                body: JSON.stringify({
                    personnel_number: registrationData.personnel_number,
                    password: registrationData.password
                })
            });

            if (loginResponse.ok) {
                const userData = await loginResponse.json();
                console.log('Auto login successful:', userData);
                onLogin(userData); // Сразу переходим в систему
            } else {
                // Если автологин не удался, переходим на страницу входа
                setIsRegistration(false);
                setLoginData({
                    personnel_number: registrationData.personnel_number,
                    password: registrationData.password,
                    rememberMe: false
                });
            }
        } else {
            const error = await response.json();
            console.error("Registration failed:", error);
            setRegistrationError(error.error || "Ошибка регистрации");
        }
    } catch (error) {
        console.error("Error during registration:", error);
        setRegistrationError("Ошибка сервера при регистрации");
    }
  };

  const toggleRegistration = () => {
    setIsRegistration(!isRegistration)
  }

  const handleMouseOver = (e) => {
    e.target.style.backgroundColor = "#EE6B0C" // Оранжевый фон
    e.target.style.color = "#FFFFFF" // Белый текст
  }

  const handleMouseOut = (e) => {
    e.target.style.backgroundColor = "#FFFFFF" // Белый фон
    e.target.style.color = "#EE6B0C" // Оранжевый текст
  }

  // Обновляем функции фильтрации
  const filteredOrganizations = organizations.filter(org => 
    org.name.toLowerCase().includes(searchOrg.toLowerCase())
  );

  const filteredDepartments = departments.filter(dept => 
    dept.name.toLowerCase().startsWith(searchDept.toLowerCase())
  );

  const renderOrganizationField = () => (
    <div style={styles.inputGroup}>
      <label htmlFor="organization" style={styles.label}>
        Организация
      </label>
      <div style={styles.dropdownContainer} className="dropdown-container">
        <input
          type="text"
          id="organization"
          name="organization"
          value={registrationData.organization}
          onChange={(e) => {
            const value = e.target.value;
            setSearchOrg(value);
            setRegistrationData(prev => ({...prev, organization: value}));
            setShowOrgDropdown(true);
          }}
          onFocus={() => setShowOrgDropdown(true)}
          placeholder="Выберите организацию"
          style={styles.input}
          required
        />
        {showOrgDropdown && filteredOrganizations.length > 0 && (
          <div style={styles.dropdown}>
            {filteredOrganizations.map(org => (
              <div
                key={org.id}
                style={{
                  ...styles.dropdownItem,
                  backgroundColor: registrationData.organization === org.name ? '#F5F5F5' : '#FFFFFF',
                }}
                onClick={() => {
                  setRegistrationData(prev => ({...prev, organization: org.name}));
                  setSearchOrg(org.name);
                  setShowOrgDropdown(false);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F5F5F5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 
                    registrationData.organization === org.name ? '#F5F5F5' : '#FFFFFF';
                }}
              >
                {org.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderDepartmentField = () => (
    <div style={styles.inputGroup}>
      <label htmlFor="department" style={styles.label}>
        Отдел/подразделение
      </label>
      <div style={styles.dropdownContainer} className="dropdown-container">
        <input
          type="text"
          id="department"
          name="department"
          value={registrationData.department}
          onChange={(e) => {
            const value = e.target.value;
            setSearchDept(value);
            setRegistrationData(prev => ({...prev, department: value}));
            setShowDeptDropdown(true);
          }}
          onFocus={() => setShowDeptDropdown(true)}
          placeholder="Выберите отдел"
          style={styles.input}
          required
        />
        {showDeptDropdown && filteredDepartments.length > 0 && (
          <div style={styles.dropdown}>
            {filteredDepartments.map(dept => (
              <div
                key={dept.id}
                style={{
                  ...styles.dropdownItem,
                  backgroundColor: registrationData.department === dept.name ? '#F5F5F5' : '#FFFFFF',
                }}
                onClick={() => {
                  setRegistrationData(prev => ({...prev, department: dept.name}));
                  setSearchDept(dept.name);
                  setShowDeptDropdown(false);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F5F5F5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 
                    registrationData.department === dept.name ? '#F5F5F5' : '#FFFFFF';
                }}
              >
                {dept.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <style>
        {`
          input::placeholder {
            color: #AAAAAA !important;
          }
          
          input:focus {
            outline: none;
          }
          
          input:invalid {
            border-color: #EE6B0C;
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
              <div style={{
                ...styles.inputGroup,
                position: 'relative',
                marginBottom: loginError ? '20px' : '0'
              }}>
                <label htmlFor="personnel_number" style={styles.label}>
                  Табельный номер
                </label>
                <input
                  type="text"
                  id="personnel_number"
                  name="personnel_number"
                  value={loginData.personnel_number}
                  onChange={handleLoginChange}
                  placeholder="Введите табельный номер"
                  style={{
                    ...styles.input,
                    border: loginError ? '1px solid #EE6B0C' : '1px solid #CCCCCC',
                  }}
                  required
                />
              </div>

              <div style={{
                ...styles.inputGroup,
                position: 'relative',
                marginBottom: loginError ? '20px' : '0'
              }}>
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
                  style={{
                    ...styles.input,
                    border: loginError ? '1px solid #EE6B0C' : '1px solid #CCCCCC',
                  }}
                  required
                />
                {loginError && (
                  <div style={{
                    position: 'absolute',
                    bottom: '-20px',
                    left: 0,
                    color: '#EE6B0C',
                    fontSize: '12px'
                  }}>
                    {loginError}
                  </div>
                )}
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
                Войти{" "}
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
              {renderOrganizationField()}

              {renderDepartmentField()}

              <div style={{
                ...styles.inputGroup,
                position: 'relative',
                marginBottom: personnelNumberError ? '20px' : '0' // Добавляем отступ если есть ошибка
              }}>
                <label htmlFor="personnel_number" style={{
                  ...styles.label,
                  marginBottom: '8px' // Увеличиваем отступ от label до input
                }}>
                  Табельный номер
                </label>
                <input
                  type="text"
                  id="personnel_number"
                  name="personnel_number"
                  value={registrationData.personnel_number}
                  onChange={handleRegistrationChange}
                  placeholder="Например: 0000-00001"
                  style={{
                    ...styles.input,
                    border: personnelNumberError ? '1px solid #EE6B0C' : '1px solid #CCCCCC',
                  }}
                  required
                />
                {personnelNumberError && (
                  <div style={{
                    position: 'absolute',
                    bottom: '-20px', // Размещаем сообщение под полем ввода
                    left: 0,
                    color: '#EE6B0C',
                    fontSize: '12px'
                  }}>
                    {personnelNumberError}
                  </div>
                )}
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

              <div style={styles.inputGroup}>
                <label htmlFor="position" style={styles.label}>
                  Должность
                </label>
                <input
                  type="text"
                  id="position"
                  name="position"
                  value={registrationData.position}
                  onChange={handleRegistrationChange}
                  placeholder="Введите вашу должность"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label htmlFor="work_phone" style={styles.label}>
                  Рабочий телефон
                </label>
                <input
                  type="tel"
                  id="work_phone"
                  name="work_phone"
                  value={registrationData.work_phone}
                  onChange={handlePhoneChange}
                  placeholder="+7 (343) XXX-XX-XX"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label htmlFor="birth_date" style={styles.label}>
                  Дата рождения
                </label>
                <input
                  type="date"
                  id="birth_date"
                  name="birth_date"
                  value={registrationData.birth_date}
                  onChange={handleRegistrationChange}
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

              {registrationError && (
                <div style={{
                  color: '#EE6B0C',
                  fontSize: '12px',
                  textAlign: 'center',
                  marginTop: '10px'
                }}>
                  {registrationError}
                </div>
              )}

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
    flexDirection: "column",
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
    transition: "border-color 0.2s ease", // Добавляем плавный переход для border
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
    textAlign: "center",
    fontSize: "14px",
    marginTop: "10px",
    color: "#13454B", // Изумрудный цвет текста
  },
  switchLink: {
    color: "#EE6B0C", // Оранжевый цвет для ссылки
    cursor: "pointer",
    textDecoration: "underline",
  },
  dropdownContainer: {
    position: 'relative',
    width: '100%',
    className: 'dropdown-container'
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 5px)',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    border: '1px solid #CCCCCC',
    borderRadius: '8px',
    maxHeight: '200px',
    overflowY: 'auto',
    zIndex: 1000,
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  dropdownItem: {
    padding: '10px 15px',
    cursor: 'pointer',
    color: '#13454B',
    fontSize: '14px',
    transition: 'background-color 0.2s',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
}

export default Login