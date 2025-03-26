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
// Добавим новые импорты в начало файла
import { faEdit, faTrash, faTimes, faCheck } from "@fortawesome/free-solid-svg-icons"
import { useUser } from "../context/UserContext" // Импортируем useUser

// Добавим новые состояния в компонент EmployeeDirectory
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
  const { isAdmin } = useUser() // Получаем информацию о роли пользователя

  // Новые состояния для функционала администратора
  const [showAdminMenu, setShowAdminMenu] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false)
  const [isEditEmployeeModalOpen, setIsEditEmployeeModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showExitWarning, setShowExitWarning] = useState(false)
  const [selectedEmployees, setSelectedEmployees] = useState([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [newEmployee, setNewEmployee] = useState({
    employee: "",
    position: "",
    personnel_number: "",
    birth_date: "",
    location: "",
    organization: "",
    department: "",
    work_phone: "",
    email: "",
  })

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

  // Добавим после функции formatPhoneNumber

  // Функция для обработки изменений в форме сотрудника
  const handleEmployeeChange = (e, isNewEmployee = false) => {
    const { name, value } = e.target

    if (isNewEmployee) {
      setNewEmployee((prev) => ({
        ...prev,
        [name]: value,
      }))
    } else {
      setEditingEmployee((prev) => ({
        ...prev,
        [name]: value,
      }))
      setHasUnsavedChanges(true)
    }
  }

  // Функция для сохранения нового сотрудника
  const handleSaveNewEmployee = async () => {
    try {
      // Здесь будет запрос к API для сохранения нового сотрудника
      // const response = await api.post("/api/employees", newEmployee)

      // Временная имитация добавления сотрудника
      const newEmployeeWithId = {
        ...newEmployee,
        id: Date.now(), // Временный ID
      }

      setEmployees((prev) => [...prev, newEmployeeWithId])
      setIsAddEmployeeModalOpen(false)
      setNewEmployee({
        employee: "",
        position: "",
        personnel_number: "",
        birth_date: "",
        location: "",
        organization: "",
        department: "",
        work_phone: "",
        email: "",
      })
    } catch (error) {
      console.error("Error adding employee:", error)
    }
  }

  // Функция для сохранения изменений сотрудника
  const handleSaveEmployee = async () => {
    try {
      // Здесь будет запрос к API для обновления данных сотрудника
      // const response = await api.put(`/api/employees/${editingEmployee.id}`, editingEmployee)

      // Временная имитация обновления сотрудника
      setEmployees((prev) => prev.map((emp) => (emp.id === editingEmployee.id ? editingEmployee : emp)))

      setIsEditEmployeeModalOpen(false)
      setEditingEmployee(null)
      setHasUnsavedChanges(false)
      setShowExitWarning(false)
    } catch (error) {
      console.error("Error updating employee:", error)
    }
  }

  // Функция для обработки закрытия модального окна
  const handleCloseModal = (isNewEmployee = false) => {
    if (!isNewEmployee && hasUnsavedChanges) {
      setShowExitWarning(true)
    } else {
      if (isNewEmployee) {
        setIsAddEmployeeModalOpen(false)
      } else {
        setIsEditEmployeeModalOpen(false)
        setEditingEmployee(null)
      }
      setHasUnsavedChanges(false)
      setShowExitWarning(false)
    }
  }

  // Функция для подтверждения выхода без сохранения
  const confirmExit = () => {
    setShowExitWarning(false)
    setIsEditEmployeeModalOpen(false)
    setEditingEmployee(null)
    setHasUnsavedChanges(false)
  }

  // Функция для выбора сотрудника (чекбокс)
  const toggleSelectEmployee = (employeeId) => {
    setSelectedEmployees((prev) => {
      if (prev.includes(employeeId)) {
        return prev.filter((id) => id !== employeeId)
      } else {
        return [...prev, employeeId]
      }
    })
  }

  // Функция для удаления выбранных сотрудников
  const deleteSelectedEmployees = async () => {
    try {
      // Здесь будет запрос к API для удаления сотрудников
      // await Promise.all(selectedEmployees.map(id => api.delete(`/api/employees/${id}`)))

      // Временная имитация удаления сотрудников
      setEmployees((prev) => prev.filter((emp) => !selectedEmployees.includes(emp.id)))
      setSelectedEmployees([])
      setShowDeleteConfirm(false)
    } catch (error) {
      console.error("Error deleting employees:", error)
    }
  }

  // Функция для скачивания списка выбранных сотрудников
  const downloadSelectedEmployees = () => {
    const selectedEmployeesList = employees.filter((emp) => selectedEmployees.includes(emp.id))

    // Формируем CSV строку
    let csvContent = "ФИО,Должность,Подразделение,Телефон,Email\n"

    selectedEmployeesList.forEach((emp) => {
      const row = [emp.employee || "", emp.position || "", emp.department || "", emp.work_phone || "", emp.email || ""]
        .map((field) => `"${field}"`)
        .join(",")

      csvContent += row + "\n"
    })

    // Создаем Blob и ссылку для скачивания
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "employees.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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

  // Добавим перед return

  // Модальное окно для добавления нового сотрудника
  const renderAddEmployeeModal = () => {
    if (!isAddEmployeeModalOpen) return null

    return (
      <div
        style={styles.modalOverlay}
        onClick={() => handleCloseModal(true)} // Добавляем обработчик клика на затемненную область
      >
        <div
          style={styles.employeeModal}
          onClick={(e) => e.stopPropagation()} // Предотвращаем закрытие при клике на само окно
        >
          <div style={styles.modalHeader}>
            <h2 style={styles.modalTitle}>Добавление сотрудника</h2>
            <button style={styles.closeButton} onClick={() => handleCloseModal(true)}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <div style={styles.modalContent}>
            <div style={styles.formSection}>
              <h3 style={styles.sectionTitle}>Основная информация</h3>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>ФИО*</label>
                <input
                  type="text"
                  name="employee"
                  value={newEmployee.employee}
                  onChange={(e) => handleEmployeeChange(e, true)}
                  style={styles.formInput}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Должность*</label>
                <input
                  type="text"
                  name="position"
                  value={newEmployee.position}
                  onChange={(e) => handleEmployeeChange(e, true)}
                  style={styles.formInput}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Табельный номер*</label>
                <input
                  type="text"
                  name="personnel_number"
                  value={newEmployee.personnel_number}
                  onChange={(e) => handleEmployeeChange(e, true)}
                  style={styles.formInput}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Дата рождения</label>
                <input
                  type="date"
                  name="birth_date"
                  value={newEmployee.birth_date}
                  onChange={(e) => handleEmployeeChange(e, true)}
                  style={styles.formInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Местоположение</label>
                <input
                  type="text"
                  name="location"
                  value={newEmployee.location}
                  onChange={(e) => handleEmployeeChange(e, true)}
                  style={styles.formInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Организация*</label>
                <input
                  type="text"
                  name="organization"
                  value={newEmployee.organization}
                  onChange={(e) => handleEmployeeChange(e, true)}
                  style={styles.formInput}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Подразделение*</label>
                <input
                  type="text"
                  name="department"
                  value={newEmployee.department}
                  onChange={(e) => handleEmployeeChange(e, true)}
                  style={styles.formInput}
                  required
                />
              </div>
            </div>

            <div style={styles.formSection}>
              <h3 style={styles.sectionTitle}>Контактная информация</h3>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Рабочий телефон</label>
                <input
                  type="tel"
                  name="work_phone"
                  value={newEmployee.work_phone}
                  onChange={(e) => handleEmployeeChange(e, true)}
                  style={styles.formInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Электронная почта</label>
                <input
                  type="email"
                  name="email"
                  value={newEmployee.email}
                  onChange={(e) => handleEmployeeChange(e, true)}
                  style={styles.formInput}
                />
              </div>
            </div>

            <div style={styles.modalActions}>
              <button style={styles.cancelButton} onClick={() => handleCloseModal(true)}>
                Отмена
              </button>
              <button
                style={styles.saveButton}
                onClick={handleSaveNewEmployee}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "#EE6B0C"
                  e.currentTarget.style.color = "#FFFFFF"
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "#FFFFFF"
                  e.currentTarget.style.color = "#EE6B0C"
                }}
              >
                Добавить
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Модальное окно для редактирования сотрудника
  const renderEditEmployeeModal = () => {
    if (!isEditEmployeeModalOpen || !editingEmployee) return null

    return (
      <div
        style={styles.modalOverlay}
        onClick={() => handleCloseModal()} // Добавляем обработчик клика на затемненную область
      >
        <div
          style={styles.employeeModal}
          onClick={(e) => e.stopPropagation()} // Предотвращаем закрытие при клике на само окно
        >
          <div style={styles.modalHeader}>
            <h2 style={styles.modalTitle}>Редактирование сотрудника</h2>
            <button style={styles.closeButton} onClick={() => handleCloseModal()}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <div style={styles.modalContent}>
            {showExitWarning ? (
              <div style={styles.warningContainer}>
                <p style={styles.warningText}>У вас есть несохраненные изменения</p>
                <div style={styles.warningActions}>
                  <button style={styles.cancelButton} onClick={confirmExit}>
                    Выйти без сохранения
                  </button>
                  <button style={styles.cancelButton} onClick={() => setShowExitWarning(false)}>
                    Вернуться к редактированию
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={styles.formSection}>
                  <h3 style={styles.sectionTitle}>Основная информация</h3>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>ФИО*</label>
                    <input
                      type="text"
                      name="employee"
                      value={editingEmployee.employee || ""}
                      onChange={handleEmployeeChange}
                      style={styles.formInput}
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Должность*</label>
                    <input
                      type="text"
                      name="position"
                      value={editingEmployee.position || ""}
                      onChange={handleEmployeeChange}
                      style={styles.formInput}
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Табельный номер*</label>
                    <input
                      type="text"
                      name="personnel_number"
                      value={editingEmployee.personnel_number || ""}
                      onChange={handleEmployeeChange}
                      style={styles.formInput}
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Дата рождения</label>
                    <input
                      type="date"
                      name="birth_date"
                      value={editingEmployee.birth_date || ""}
                      onChange={handleEmployeeChange}
                      style={styles.formInput}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Местоположение</label>
                    <input
                      type="text"
                      name="location"
                      value={editingEmployee.location || ""}
                      onChange={handleEmployeeChange}
                      style={styles.formInput}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Организация*</label>
                    <input
                      type="text"
                      name="organization"
                      value={editingEmployee.organization || ""}
                      onChange={handleEmployeeChange}
                      style={styles.formInput}
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Подразделение*</label>
                    <input
                      type="text"
                      name="department"
                      value={editingEmployee.department || ""}
                      onChange={handleEmployeeChange}
                      style={styles.formInput}
                      required
                    />
                  </div>
                </div>

                <div style={styles.formSection}>
                  <h3 style={styles.sectionTitle}>Контактная информация</h3>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Рабочий телефон</label>
                    <input
                      type="tel"
                      name="work_phone"
                      value={editingEmployee.work_phone || ""}
                      onChange={handleEmployeeChange}
                      style={styles.formInput}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Электронная почта</label>
                    <input
                      type="email"
                      name="email"
                      value={editingEmployee.email || ""}
                      onChange={handleEmployeeChange}
                      style={styles.formInput}
                    />
                  </div>
                </div>

                <div style={styles.modalActions}>
                  <button style={styles.cancelButton} onClick={() => handleCloseModal()}>
                    Отмена
                  </button>
                  <button
                    style={styles.saveButton}
                    onClick={handleSaveEmployee}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = "#EE6B0C"
                      e.currentTarget.style.color = "#FFFFFF"
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = "#FFFFFF"
                      e.currentTarget.style.color = "#EE6B0C"
                    }}
                  >
                    Сохранить
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Модальное окно подтверждения удаления
  const renderDeleteConfirmModal = () => {
    if (!showDeleteConfirm) return null

    return (
      <div style={styles.modalOverlay}>
        <div style={styles.confirmModal}>
          <div style={styles.modalHeader}>
            <h2 style={styles.modalTitle}>Подтверждение удаления</h2>
            <button style={styles.closeButton} onClick={() => setShowDeleteConfirm(false)}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <div style={styles.modalContent}>
            <p style={styles.confirmText}>
              Вы уверены, что хотите удалить {selectedEmployees.length}{" "}
              {selectedEmployees.length === 1
                ? "сотрудника"
                : selectedEmployees.length < 5
                  ? "сотрудников"
                  : "сотрудников"}
              ?
            </p>

            <div style={styles.confirmActions}>
              <button style={styles.cancelButton} onClick={() => setShowDeleteConfirm(false)}>
                Отмена
              </button>
              <button style={styles.deleteButton} onClick={deleteSelectedEmployees}>
                Удалить
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Изменим строку сотрудника, добавив обработчик контекстного меню:

  // Добавим новую функцию для обработки контекстного меню
  const handleContextMenu = (e, employeeId) => {
    if (isEditMode && selectedEmployees.includes(employeeId)) {
      e.preventDefault()

      // Создаем контекстное меню
      const contextMenu = document.createElement("div")
      contextMenu.id = "employee-context-menu"
      contextMenu.style.position = "fixed"
      contextMenu.style.left = `${e.clientX}px`
      contextMenu.style.top = `${e.clientY}px`
      contextMenu.style.backgroundColor = "#FFFFFF"
      contextMenu.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.1)"
      contextMenu.style.borderRadius = "4px"
      contextMenu.style.padding = "8px 0"
      contextMenu.style.zIndex = "1000"

      // Создаем пункты меню
      const deleteOption = document.createElement("div")
      deleteOption.innerHTML = '<span style="margin-right: 8px;"><i class="fas fa-trash"></i></span>Удалить сотрудников'
      deleteOption.style.padding = "8px 16px"
      deleteOption.style.cursor = "pointer"
      deleteOption.style.display = "flex"
      deleteOption.style.alignItems = "center"
      deleteOption.style.color = "#333"
      deleteOption.style.fontSize = "14px"
      deleteOption.onmouseover = () => {
        deleteOption.style.backgroundColor = "#f5f5f5"
      }
      deleteOption.onmouseout = () => {
        deleteOption.style.backgroundColor = "transparent"
      }
      deleteOption.onclick = () => {
        document.body.removeChild(contextMenu)
        setShowDeleteConfirm(true)
      }

      const downloadOption = document.createElement("div")
      downloadOption.innerHTML = '<span style="margin-right: 8px;"><i class="fas fa-download"></i></span>Скачать список'
      downloadOption.style.padding = "8px 16px"
      downloadOption.style.cursor = "pointer"
      downloadOption.style.display = "flex"
      downloadOption.style.alignItems = "center"
      downloadOption.style.color = "#333"
      downloadOption.style.fontSize = "14px"
      downloadOption.onmouseover = () => {
        downloadOption.style.backgroundColor = "#f5f5f5"
      }
      downloadOption.onmouseout = () => {
        downloadOption.style.backgroundColor = "transparent"
      }
      downloadOption.onclick = () => {
        document.body.removeChild(contextMenu)
        downloadSelectedEmployees()
      }

      // Добавляем пункты в меню
      contextMenu.appendChild(deleteOption)
      contextMenu.appendChild(downloadOption)

      // Добавляем меню на страницу
      document.body.appendChild(contextMenu)

      // Закрываем меню при клике в любом месте
      const closeMenu = () => {
        if (document.getElementById("employee-context-menu")) {
          document.body.removeChild(contextMenu)
        }
        document.removeEventListener("click", closeMenu)
      }

      document.addEventListener("click", closeMenu)
    }
  }

  // Изменим return, добавив новый функционал

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
              {/* Заголовки колонок с добавлением кнопки администратора */}
              <div style={styles.columnHeaders}>
                {isAdmin && !isEditMode && (
                  <div style={styles.adminHeaderControls}>
                    <button
                      onClick={() => setShowAdminMenu(!showAdminMenu)}
                      style={styles.editButton}
                      title="Управление сотрудниками"
                    >
                      <FontAwesomeIcon icon={faEdit} style={styles.editIcon} />
                    </button>
                    {showAdminMenu && (
                      <div style={styles.adminMenu}>
                        <button
                          style={styles.adminMenuItem}
                          onClick={() => {
                            setIsAddEmployeeModalOpen(true)
                            setShowAdminMenu(false)
                          }}
                        >
                          Добавить нового сотрудника
                        </button>
                        <div style={styles.menuDivider}></div>
                        <button
                          style={styles.adminMenuItem}
                          onClick={() => {
                            setIsEditMode(true)
                            setShowAdminMenu(false)
                          }}
                        >
                          Редактировать данные сотрудников
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {isEditMode && <div style={styles.checkboxHeader}></div>}
                <div style={styles.nameHeader}>ФИО</div>
                <div style={styles.departmentHeader}>Подразделение</div>
                <div style={styles.contactsHeader}>Контакты</div>
              </div>

              {/* После заголовков колонок и перед списком сотрудников добавим: */}
              {isEditMode && (
                <div style={styles.editModeBar}>
                  <span
                    style={styles.exitEditModeText}
                    onClick={() => {
                      setIsEditMode(false)
                      setSelectedEmployees([])
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.color = "#EE6B0C"
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.color = "#777"
                    }}
                  >
                    Выйти из режима редактирования
                  </span>
                  {selectedEmployees.length > 0 && (
                    <span style={styles.selectedCount}>Выбрано: {selectedEmployees.length}</span>
                  )}
                </div>
              )}

              {/* Список сотрудников */}
              <div style={styles.employeeList}>
                {filteredEmployees.map((employee, index) => (
                  <div key={employee.id} onContextMenu={(e) => handleContextMenu(e, employee.id)}>
                    <div style={styles.employeeRow}>
                      {isEditMode && (
                        <div style={styles.checkboxContainer}>
                          <div
                            style={{
                              ...styles.checkbox,
                              backgroundColor: selectedEmployees.includes(employee.id) ? "#EE6B0C" : "#e0e0e0",
                            }}
                            onClick={() => toggleSelectEmployee(employee.id)}
                          >
                            {selectedEmployees.includes(employee.id) && (
                              <FontAwesomeIcon icon={faCheck} style={styles.checkIcon} />
                            )}
                          </div>
                        </div>
                      )}
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
                        {isEditMode ? (
                          <div style={styles.editActions}>
                            <button
                              style={styles.editEmployeeButton}
                              onClick={() => {
                                setEditingEmployee(employee)
                                setIsEditEmployeeModalOpen(true)
                              }}
                              title="Редактировать"
                            >
                              <FontAwesomeIcon icon={faEdit} style={styles.editEmployeeIcon} />
                            </button>
                            <button
                              style={styles.deleteEmployeeButton}
                              onClick={() => {
                                setEditingEmployee(employee)
                                setShowDeleteConfirm(true)
                              }}
                              title="Удалить"
                            >
                              <FontAwesomeIcon icon={faTrash} style={styles.deleteEmployeeIcon} />
                            </button>
                          </div>
                        ) : (
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
                        )}
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

      {/* Модальные окна */}
      {renderAddEmployeeModal()}
      {renderEditEmployeeModal()}
      {renderDeleteConfirmModal()}
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
  adminControls: {
    position: "relative",
    marginLeft: "auto",
  },
  editButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#EE6B0C",
    fontSize: "20px",
    padding: "5px",
  },
  editIcon: {
    fontSize: "20px",
  },
  adminMenu: {
    position: "absolute",
    top: "100%",
    right: "0",
    backgroundColor: "#F5F5F5",
    border: "1px solid #e0e0e0",
    borderRadius: "4px",
    padding: "10px",
    zIndex: 1000,
  },
  adminMenuItem: {
    background: "none",
    border: "none",
    color: "#13454B",
    cursor: "pointer",
    padding: "8px 12px",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "5px",
    width: "100%",
    textAlign: "left",
  },
  menuItemIcon: {
    color: "#EE6B0C",
  },
  editModeExitButton: {
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
  checkboxHeader: {
    width: "40px",
  },
  checkboxContainer: {
    width: "40px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  checkbox: {
    width: "20px",
    height: "20px",
    border: "1px solid #e0e0e0",
    borderRadius: "4px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  checkIcon: {
    color: "#FFFFFF",
    fontSize: "12px",
  },
  editEmployeeButton: {
    background: "none",
    border: "none",
    color: "#EE6B0C",
    cursor: "pointer",
    padding: "5px",
    fontSize: "18px",
  },
  editEmployeeIcon: {
    color: "#EE6B0C",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  employeeModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: "8px",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
    width: "80%",
    maxWidth: "800px",
    overflow: "hidden",
  },
  modalHeader: {
    backgroundColor: "#F5F5F5",
    padding: "16px 24px",
    borderBottom: "1px solid #e0e0e0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 600,
    color: "#13454B",
  },
  closeButton: {
    background: "none",
    border: "none",
    color: "#777",
    cursor: "pointer",
    padding: "8px",
    fontSize: "16px",
  },
  modalContent: {
    padding: "24px",
    overflowY: "auto",
    maxHeight: "600px",
  },
  formSection: {
    marginBottom: "24px",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#13454B",
    marginBottom: "12px",
  },
  formGroup: {
    marginBottom: "16px",
  },
  formLabel: {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: 500,
    color: "#13454B",
  },
  formInput: {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid #e0e0e0",
    borderRadius: "24px",
    fontSize: "16px",
    color: "#333",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "24px",
    gap: "16px",
  },
  cancelButton: {
    padding: "12px 24px",
    backgroundColor: "#FFFFFF",
    color: "#777",
    border: "1px solid #777",
    borderRadius: "24px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: 500,
  },
  saveButton: {
    padding: "12px 24px",
    backgroundColor: "#FFFFFF",
    color: "#EE6B0C",
    border: "1px solid #EE6B0C",
    borderRadius: "24px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: 500,
    transition: "background-color 0.3s, color 0.3s",
  },
  warningContainer: {
    padding: "24px",
    textAlign: "center",
  },
  warningText: {
    fontSize: "18px",
    color: "#EE6B0C",
    marginBottom: "16px",
  },
  warningActions: {
    display: "flex",
    justifyContent: "center",
    gap: "16px",
  },
  confirmModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: "8px",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
    width: "80%",
    maxWidth: "500px",
    overflow: "hidden",
  },
  confirmText: {
    fontSize: "18px",
    color: "#333",
    marginBottom: "24px",
    textAlign: "center",
  },
  confirmActions: {
    display: "flex",
    justifyContent: "center",
    gap: "16px",
  },
  deleteButton: {
    padding: "12px 24px",
    backgroundColor: "#EE6B0C",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "24px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: 500,
  },
  bulkActions: {
    display: "flex",
    gap: "5px",
  },
  bulkActionButton: {
    background: "none",
    border: "none",
    color: "#EE6B0C",
    cursor: "pointer",
    padding: "5px",
    fontSize: "18px",
  },
  adminHeaderControls: {
    position: "relative",
    marginRight: "15px",
  },
  adminMenu: {
    position: "absolute",
    top: "100%",
    left: "0",
    backgroundColor: "#FFFFFF",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    borderRadius: "4px",
    padding: "8px 0",
    zIndex: 1000,
    minWidth: "250px",
  },
  adminMenuItem: {
    background: "none",
    border: "none",
    color: "#333333",
    cursor: "pointer",
    padding: "10px 16px",
    fontSize: "14px",
    width: "100%",
    textAlign: "left",
    transition: "background-color 0.2s",
  },
  menuDivider: {
    height: "1px",
    backgroundColor: "#e0e0e0",
    margin: "4px 0",
  },
  editModeBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 2rem",
    backgroundColor: "#f9f9f9",
    borderBottom: "1px solid #e0e0e0",
  },
  exitEditModeText: {
    color: "#777",
    cursor: "pointer",
    fontSize: "14px",
    transition: "color 0.3s ease",
  },
  selectedCount: {
    fontSize: "14px",
    color: "#EE6B0C",
    fontWeight: 500,
  },
  editActions: {
    display: "flex",
    gap: "10px",
  },
  deleteEmployeeButton: {
    background: "none",
    border: "none",
    color: "#EE6B0C",
    cursor: "pointer",
    padding: "5px",
    fontSize: "18px",
  },
  deleteEmployeeIcon: {
    color: "#EE6B0C",
  },
}

export default EmployeeDirectory

