"use client"

import { useState, useEffect } from "react"
import { api } from "../utils/api"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faUser, faChevronDown, faChevronUp, faSearch, faCopy } from "@fortawesome/free-solid-svg-icons"
import Header from "./Header"

const EmployeeDirectory = ({ onNavigate }) => {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isFilterOpen, setIsFilterOpen] = useState(true)
  const [filters, setFilters] = useState({
    name: "",
    position: "",
    phone: "",
  })
  const [activeButton, setActiveButton] = useState(null)
  const [showCopyNotification, setShowCopyNotification] = useState(false)
  const [copiedText, setCopiedText] = useState("")

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
                  <div key={employee.id} style={styles.employeeRow}>
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
                    <div style={styles.employeeDepartment}>{employee.department}</div>
                    <div style={styles.employeeContacts}>
                      <div style={styles.employeePhoneContainer}>
                        <p style={styles.employeePhone}>{employee.work_phone}</p>
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
                      {employee.email && <p style={styles.employeeEmail}>{employee.email}</p>}
                    </div>
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
    color: "#333333",
    fontFamily: "'Open Sans', Arial, sans-serif", // Шрифт для заголовков колонок
  },
  nameHeader: {
    flex: "2",
    paddingLeft: "100px",
  },
  departmentHeader: {
    flex: "1",
    textAlign: "left",
    paddingLeft: "0", // Изменено с "20px" на "0"
  },
  contactsHeader: {
    flex: "1",
    textAlign: "left",
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
    borderBottom: "1px solid #E0E0E0",
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
    flex: "1",
    display: "flex",
    alignItems: "center",
    color: "#EE6B0C",
    fontWeight: 500,
    paddingLeft: "0", // Изменено с "20px" на "0"
    fontFamily: "'Open Sans', Arial, sans-serif", // Шрифт для подразделения
  },
  employeeContacts: {
    flex: "1",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  employeePhoneContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
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
    color: "#13454B",
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
  employeePhone: {
    color: "#333333",
    fontWeight: 300,
    margin: 0,
    fontFamily: "'Open Sans', Arial, sans-serif", // Шрифт для телефона
  },
  employeeEmail: {
    color: "#333333",
    fontWeight: 300,
    margin: 0,
    fontFamily: "'Open Sans', Arial, sans-serif", // Шрифт для email
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
}

export default EmployeeDirectory

