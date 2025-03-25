"use client"

import { useState, useEffect } from "react"
import { api } from "../utils/api"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faUser,
  faChevronDown,
  faChevronUp,
  faSearch,
  faCopy,
  faChevronRight,
  faEnvelope,
} from "@fortawesome/free-solid-svg-icons"
import { faTelegram, faSkype } from "@fortawesome/free-brands-svg-icons"
import Header from "./Header"

const EmployeeDirectory = ({ onNavigate }) => {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isFilterOpen, setIsFilterOpen] = useState(true)
  const [expandedEmployee, setExpandedEmployee] = useState(null)
  const [filters, setFilters] = useState({
    name: "",
    position: "",
    phone: "",
  })
  const [activeButton, setActiveButton] = useState(null)
  const [showCopyNotification, setShowCopyNotification] = useState(false)
  const [copiedText, setCopiedText] = useState("")

  // Функция форматирования телефонного номера
  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return ""

    // Удаляем все нецифровые символы
    const numbers = phoneNumber.replace(/\D/g, "")

    if (numbers.length === 0) return ""
    if (numbers.length <= 1) return `+7`
    if (numbers.length <= 4) return `+7 (${numbers.slice(1)}`
    if (numbers.length <= 7) return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4)}`
    if (numbers.length <= 9) return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}-${numbers.slice(7)}`
    return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}-${numbers.slice(7, 9)}-${numbers.slice(9, 11)}`
  }

  // Загрузка данных о сотрудниках
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.get("/api/employees")
        console.log("Данные о сотрудниках:", data)
        setEmployees(data)
        setLoading(false)
      } catch (err) {
        console.error("Ошибка при загрузке данных:", err)
        setError("Ошибка при загрузке данных")
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Обработчик изменения фильтров
  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Применение фильтров
  const applyFilters = () => {
    console.log("Применены фильтры:", filters) // Логируем фильтры для отладки
    setActiveButton("apply")
    setTimeout(() => setActiveButton(null), 300)
  }

  // Сброс фильтров
  const resetFilters = () => {
    setFilters({
      name: "",
      position: "",
      phone: "",
    })
    setActiveButton("reset")
    setTimeout(() => setActiveButton(null), 300)
  }

  // Функция для копирования текста
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(label)
      setShowCopyNotification(true)
      setTimeout(() => {
        setShowCopyNotification(false)
      }, 2000)
    })
  }

  // Функция для переключения раскрытия информации о сотруднике
  const toggleEmployeeDetails = (employeeId) => {
    if (expandedEmployee === employeeId) {
      setExpandedEmployee(null)
    } else {
      setExpandedEmployee(employeeId)
    }
  }

  // Фильтрация сотрудников
  const filteredEmployees = employees.filter((employee) => {
    if (!filters.name && !filters.position && !filters.phone) return true

    const employeeName = employee.employee?.toLowerCase() || ""
    const employeePosition = employee.position?.toLowerCase() || ""
    const employeePhone = employee.work_phone?.toLowerCase() || ""

    const nameMatch = !filters.name || employeeName.includes(filters.name.toLowerCase())
    const positionMatch = !filters.position || employeePosition.includes(filters.position.toLowerCase())
    const phoneMatch = !filters.phone || employeePhone.includes(filters.phone.toLowerCase())

    return nameMatch && positionMatch && phoneMatch
  })

  // Отображение загрузки или ошибки
  if (loading) return <div style={styles.loading}>Загрузка...</div>
  if (error) return <div style={styles.error}>{error}</div>

  return (
    <>
      <Header onNavigate={onNavigate} />
      <div style={styles.container}>
        <div style={styles.layout}>
          {/* Блок с параметрами поиска */}
          <div style={styles.filterSidebar}>
            <div style={styles.filterHeader} onClick={() => setIsFilterOpen(!isFilterOpen)}>
              <h3 style={styles.filterTitle}>Параметры поиска</h3>
              <FontAwesomeIcon icon={isFilterOpen ? faChevronUp : faChevronDown} style={styles.filterIcon} />
            </div>

            {isFilterOpen && (
              <div style={styles.filterContent}>
                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>ФИО</label>
                  <input
                    type="text"
                    name="name"
                    value={filters.name}
                    onChange={handleFilterChange}
                    style={styles.filterInput}
                    placeholder="Введите ФИО"
                  />
                </div>

                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Должность</label>
                  <input
                    type="text"
                    name="position"
                    value={filters.position}
                    onChange={handleFilterChange}
                    style={styles.filterInput}
                    placeholder="Введите должность"
                  />
                </div>

                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Телефон</label>
                  <input
                    type="text"
                    name="phone"
                    value={filters.phone}
                    onChange={handleFilterChange}
                    style={styles.filterInput}
                    placeholder="Введите телефон"
                  />
                </div>

                <div style={styles.filterButtonsContainer}>
                  <button
                    style={
                      activeButton === "apply"
                        ? { ...styles.filterButton, ...styles.activeButton }
                        : styles.filterButton
                    }
                    onClick={applyFilters}
                  >
                    <FontAwesomeIcon icon={faSearch} style={{ marginRight: "5px" }} />
                    Применить
                  </button>
                  <button
                    style={
                      activeButton === "reset"
                        ? { ...styles.filterButton, ...styles.activeButton }
                        : styles.filterButton
                    }
                    onClick={resetFilters}
                  >
                    Сбросить фильтр
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Основной контент */}
          <div style={styles.main}>
            {/* Список сотрудников */}
            <div style={styles.employeeListContainer}>
              {/* Заголовки колонок */}
              <div style={styles.columnHeaders}>
                <div style={styles.nameHeader}>ФИО</div>
                <div style={styles.departmentHeader}>Подразделение</div>
                <div style={styles.contactsHeader}>Контакты</div>
              </div>

              {/* Список сотрудников */}
              <div style={styles.employeeList}>
                {filteredEmployees.map((employee, index) => (
                  <div key={employee.id}>
                    <div style={styles.employeeRow}>
                      <div style={styles.employeePhotoAndInfo}>
                        <div style={styles.employeePhoto}>
                          {employee.photo ? (
                            <img
                              src={employee.photo || "/placeholder.svg"}
                              alt={employee.employee}
                              style={styles.photo}
                            />
                          ) : (
                            <FontAwesomeIcon icon={faUser} style={{ fontSize: "40px", color: "#13454B" }} />
                          )}
                        </div>
                        <div style={styles.employeeMainInfo}>
                          <h4 style={styles.employeeName}>{employee.employee}</h4>
                          <p style={styles.employeePosition}>{employee.position}</p>
                        </div>
                      </div>
                      <div style={styles.employeeDepartment}>
                        <div style={styles.departmentText}>{employee.department}</div>
                      </div>
                      <div style={styles.employeeContacts}>
                        <div style={styles.contactIcons}>
                          <button
                            style={styles.contactIconButton}
                            onClick={(e) => {
                              e.stopPropagation()
                              window.location.href = `mailto:${employee.email || ""}`
                            }}
                            title="Email"
                          >
                            <FontAwesomeIcon icon={faEnvelope} />
                          </button>
                          <button
                            style={styles.contactIconButton}
                            onClick={(e) => {
                              e.stopPropagation()
                              window.location.href = `https://t.me/${employee.telegram || ""}`
                            }}
                            title="Telegram"
                          >
                            <FontAwesomeIcon icon={faTelegram} />
                          </button>
                          <button
                            style={styles.contactIconButton}
                            onClick={(e) => {
                              e.stopPropagation()
                              window.location.href = `skype:${employee.skype || ""}?chat`
                            }}
                            title="Skype"
                          >
                            <FontAwesomeIcon icon={faSkype} />
                          </button>
                        </div>
                        <button
                          style={styles.expandButton}
                          onClick={() => toggleEmployeeDetails(employee.id)}
                          aria-expanded={expandedEmployee === employee.id}
                        >
                          <FontAwesomeIcon
                            icon={faChevronRight}
                            style={{
                              ...styles.expandIcon,
                              transform: expandedEmployee === employee.id ? "rotate(90deg)" : "none",
                              transition: "transform 0.3s ease",
                            }}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Развернутая информация о сотруднике */}
                    {expandedEmployee === employee.id && (
                      <div style={styles.employeeDetails}>
                        <div style={styles.detailsSection}>
                          <h4 style={styles.detailsTitle}>Основная информация</h4>
                          <div style={styles.detailsRow}>
                            <span style={styles.detailsLabel}>Табельный номер:</span>
                            <span style={styles.detailsValue}>{employee.personnel_number || "Не указан"}</span>
                          </div>
                          <div style={styles.detailsRow}>
                            <span style={styles.detailsLabel}>Дата рождения:</span>
                            <span style={styles.detailsValue}>{employee.birth_date || "Не указана"}</span>
                          </div>
                          <div style={styles.detailsRow}>
                            <span style={styles.detailsLabel}>Местоположение:</span>
                            <span style={styles.detailsValue}>{employee.location || "Не указано"}</span>
                          </div>
                          <div style={styles.detailsRow}>
                            <span style={styles.detailsLabel}>Организация:</span>
                            <span style={styles.detailsValue}>{employee.organization || "Не указана"}</span>
                          </div>
                        </div>

                        <div style={styles.detailsSection}>
                          <h4 style={styles.detailsTitle}>Контактная информация</h4>
                          <div style={styles.detailsRow}>
                            <span style={styles.detailsLabel}>Рабочий телефон:</span>
                            <div style={styles.detailsValueWithCopy}>
                              <span style={styles.detailsValue}>
                                {formatPhoneNumber(employee.work_phone) || "Не указан"}
                              </span>
                              {employee.work_phone && (
                                <button
                                  style={styles.copyButton}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    copyToClipboard(employee.work_phone, "Телефон")
                                  }}
                                >
                                  <FontAwesomeIcon icon={faCopy} />
                                </button>
                              )}
                            </div>
                          </div>
                          <div style={styles.detailsRow}>
                            <span style={styles.detailsLabel}>Электронная почта:</span>
                            <div style={styles.detailsValueWithCopy}>
                              <span style={styles.detailsValue}>{employee.email || "Не указана"}</span>
                              {employee.email && (
                                <button
                                  style={styles.copyButton}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    copyToClipboard(employee.email, "Email")
                                  }}
                                >
                                  <FontAwesomeIcon icon={faCopy} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Изменим расположение кнопки "Сообщить об ошибке" в справочнике сотрудников */}
                        <div style={styles.detailsActions}>
                          <div style={styles.actionButtons}>
                            <button style={styles.reportErrorButton}>Сообщить об ошибке</button>
                            <button
                              style={styles.downloadContactButton}
                              onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = "#EE6B0C"
                                e.currentTarget.style.color = "#FFFFFF"
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = "#FFFFFF"
                                e.currentTarget.style.color = "#EE6B0C"
                              }}
                            >
                              Скачать контакт
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Разделитель между сотрудниками */}
                    {index < filteredEmployees.length - 1 && <div style={styles.employeeDivider}></div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Уведомление о копировании */}
      {showCopyNotification && <div style={styles.copyNotification}>{copiedText} скопирован в буфер обмена</div>}
    </>
  )
}

// Стили
const styles = {
  container: {
    fontFamily: "'Open Sans', Arial, sans-serif", // Основной шрифт для всего компонента
    backgroundColor: "#FFFFFF",
    minHeight: "calc(100vh - 72px)",
  },
  layout: {
    display: "flex",
    height: "calc(100vh - 72px)",
  },
  filterSidebar: {
    width: "300px",
    backgroundColor: "#F5F5F5",
    alignSelf: "stretch",
    height: "100%",
    borderRadius: "0",
  },
  filterHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 20px",
    borderBottom: "1px solid #e0e0e0",
    cursor: "pointer",
  },
  filterTitle: {
    margin: 0,
    color: "#13454B",
    fontSize: "18px",
    fontWeight: 600,
    fontFamily: "'Open Sans', Arial, sans-serif", // Шрифт для "Параметры поиска"
  },
  filterIcon: {
    color: "#13454B",
  },
  filterContent: {
    padding: "20px",
  },
  filterGroup: {
    marginBottom: "15px",
  },
  filterLabel: {
    display: "block",
    marginBottom: "5px",
    color: "#13454B",
    fontWeight: 500,
    fontFamily: "'Open Sans', Arial, sans-serif", // Шрифт для меток фильтров
  },
  filterInput: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #e0e0e0",
    borderRadius: "20px",
    fontSize: "14px",
    fontFamily: "'Open Sans', Arial, sans-serif", // Шрифт для полей ввода
  },
  filterButtonsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "20px",
  },
  filterButton: {
    padding: "10px 16px",
    backgroundColor: "#FFFFFF",
    color: "#EE6B0C",
    border: "1px solid #EE6B0C",
    borderRadius: "20px",
    cursor: "pointer",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    fontFamily: "'Open Sans', Arial, sans-serif", // Шрифт для кнопок
  },
  activeButton: {
    backgroundColor: "#EE6B0C",
    color: "#FFFFFF",
  },
  main: {
    flex: 1,
    padding: "0",
    backgroundColor: "#FFFFFF",
    overflowY: "auto",
  },
  employeeListContainer: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
  },
  columnHeaders: {
    display: "flex",
    padding: "15px 2rem",
    backgroundColor: "#F5F5F5",
    borderRadius: "0",
    fontWeight: 600,
    color: "#000000", // Изменено с "#333333" на черный
    fontFamily: "'Open Sans', Arial, sans-serif", // Шрифт для заголовков колонок
  },
  nameHeader: {
    flex: "2",
    paddingLeft: "100px", // Выравнивание с содержимым
  },
  departmentHeader: {
    flex: "1.2", // Увеличиваем ширину для подразделения
    textAlign: "left",
    paddingLeft: "0", // Выравнивание с содержимым
  },
  contactsHeader: {
    flex: "0.8", // Уменьшаем ширину для контактов
    textAlign: "left",
    paddingLeft: "0", // Выравнивание с содержимым
  },
  employeeList: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
  },
  employeeRow: {
    display: "flex",
    alignItems: "center",
    padding: "1rem 2rem",
    backgroundColor: "#FFFFFF",
  },
  employeeDivider: {
    height: "1px",
    backgroundColor: "#E0E0E0",
    margin: "0 2rem",
  },
  employeePhotoAndInfo: {
    display: "flex",
    alignItems: "center",
    flex: "2",
  },
  employeeMainInfo: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  employeeDepartment: {
    flex: "1.2", // Увеличиваем ширину для подразделения
    display: "flex",
    alignItems: "center",
    paddingLeft: "0", // Выравнивание с заголовком
  },
  departmentText: {
    color: "#EE6B0C",
    fontWeight: 500,
    fontFamily: "'Open Sans', Arial, sans-serif",
    wordBreak: "break-word", // Перенос длинных слов
    maxWidth: "100%", // Ограничиваем ширину
  },
  employeeContacts: {
    flex: "0.8", // Уменьшаем ширину для контактов
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: "0", // Выравнивание с заголовком
  },
  contactIcons: {
    display: "flex",
    gap: "10px",
  },
  contactIconButton: {
    background: "none",
    border: "none",
    color: "#13454B",
    cursor: "pointer",
    padding: "5px",
    fontSize: "18px",
  },
  expandButton: {
    background: "none",
    border: "none",
    color: "#AAAAAA",
    cursor: "pointer",
    padding: "5px",
    fontSize: "16px",
  },
  expandIcon: {
    color: "#AAAAAA",
  },
  employeePhoto: {
    flexShrink: 0,
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    overflow: "hidden",
    marginRight: "1rem",
    backgroundColor: "#e0e0e0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  photo: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  employeeName: {
    color: "#000000", // Изменено с "#13454B" на черный
    fontSize: "18px",
    fontWeight: 600,
    margin: 0,
    fontFamily: "'Open Sans', Arial, sans-serif", // Шрифт для ФИО
  },
  employeePosition: {
    color: "#333333",
    fontWeight: 300,
    margin: "0.25rem 0 0 0",
    fontFamily: "'Open Sans', Arial, sans-serif", // Шрифт для должности
  },
  employeeDetails: {
    padding: "1rem 2rem 1rem 8rem",
    backgroundColor: "#F9F9F9",
    borderTop: "1px solid #E0E0E0",
    borderBottom: "1px solid #E0E0E0",
  },
  detailsSection: {
    marginBottom: "1.5rem",
  },
  detailsTitle: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#000000",
    marginBottom: "0.75rem",
    fontFamily: "'Open Sans', Arial, sans-serif",
  },
  detailsRow: {
    display: "flex",
    marginBottom: "0.5rem",
  },
  detailsLabel: {
    width: "180px",
    fontSize: "14px",
    color: "#777",
    fontFamily: "'Open Sans', Arial, sans-serif",
  },
  detailsValue: {
    fontSize: "14px",
    color: "#333",
    fontFamily: "'Open Sans', Arial, sans-serif",
    marginLeft: "0", // Убираем отступ слева
  },
  detailsValueWithCopy: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  detailsActions: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "1.5rem",
  },
  reportErrorButton: {
    padding: "8px 16px",
    backgroundColor: "#FFFFFF",
    color: "#777",
    border: "1px solid #777",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    fontFamily: "'Open Sans', Arial, sans-serif",
  },
  downloadContactButton: {
    padding: "8px 16px",
    backgroundColor: "#FFFFFF",
    color: "#EE6B0C",
    border: "1px solid #EE6B0C",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    fontFamily: "'Open Sans', Arial, sans-serif",
    transition: "background-color 0.3s, color 0.3s",
  },
  loading: {
    textAlign: "center",
    fontSize: "18px",
    marginTop: "20px",
    fontFamily: "'Open Sans', Arial, sans-serif", // Шрифт для сообщения о загрузке
  },
  error: {
    textAlign: "center",
    fontSize: "18px",
    marginTop: "20px",
    color: "red",
    fontFamily: "'Open Sans', Arial, sans-serif", // Шрифт для сообщения об ошибке
  },
  copyButton: {
    background: "none",
    border: "none",
    color: "#EE6B0C", // Оранжевый цвет для иконки копирования
    cursor: "pointer",
    padding: "5px",
    fontSize: "14px",
  },
  copyNotification: {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    backgroundColor: "#13454B",
    color: "#FFFFFF",
    padding: "10px 20px",
    borderRadius: "4px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
    zIndex: 1100,
    fontFamily: "'Open Sans', Arial, sans-serif",
    fontSize: "14px",
  },
  actionButtons: {
    display: "flex",
    gap: "10px",
  },
}

export default EmployeeDirectory

