"use client"

import { useState, useEffect, useCallback } from "react"
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
  faTrash,
} from "@fortawesome/free-solid-svg-icons"
import { faTelegram, faSkype } from "@fortawesome/free-brands-svg-icons"
import Header from "./Header"
// Добавим новые импорты в начало файла
import { faEdit, faTimes, faCheck } from "@fortawesome/free-solid-svg-icons"
import { useUser } from "../context/UserContext" // Импортируем useUser
import ContextMenu from "../context/ContextMenu" // Импортируем компонент контекстного меню из папки context
import styles from "../styles/EmployeeDirectory.module.css" // Импортируем CSS модуль

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

  const [hasUnsavedNewEmployee, setHasUnsavedNewEmployee] = useState(false)
  const [showNewEmployeeExitWarning, setShowNewEmployeeExitWarning] = useState(false)

  const [departments, setDepartments] = useState([])
  const [showDeptDropdown, setShowDeptDropdown] = useState(false)
  const [showEditDeptDropdown, setShowEditDeptDropdown] = useState(false)
  const [searchDept, setSearchDept] = useState("")
  const [searchEditDept, setSearchEditDept] = useState("")

  // Добавим новые состояния для контекстного меню
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    employeeId: null,
  })

  // Состояние для определения, открыта ли хоть одна модалка или развернут хоть один сотрудник
  const [isModalOrDetailsOpen, setIsModalOrDetailsOpen] = useState(false)

  // Функция форматирования телефонного номера
  const formatPhoneNumber = useCallback((phoneNumber) => {
    if (!phoneNumber) return ""

    // Удаляем все нецифровые символы
    const numbers = phoneNumber.replace(/\D/g, "")

    if (numbers.length === 0) return ""
    if (numbers.length <= 1) return `+7`
    if (numbers.length <= 4) return `+7 (${numbers.slice(1)}`
    if (numbers.length <= 7) return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4)}`
    if (numbers.length <= 9) return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}-${numbers.slice(7)}`
    return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}-${numbers.slice(7, 9)}-${numbers.slice(9, 11)}`
  }, [])

  // Добавим функцию для закрытия контекстного меню
  const closeContextMenu = useCallback(() => {
    setContextMenu({
      visible: false,
      x: 0,
      y: 0,
      employeeId: null,
    })
  }, [])

  // Загрузка данных о сотрудниках
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [employeesData, deptsData] = await Promise.all([api.get("/api/employees"), api.get("/api/departments")])
        console.log("Данные о сотрудниках:", employeesData)
        setEmployees(employeesData)
        setDepartments(deptsData)
        setLoading(false)
      } catch (err) {
        console.error("Ошибка при загрузке данных:", err)
        setError("Ошибка при загрузке данных")
        setLoading(false)
      }
    }

    fetchData()
  }, [formatPhoneNumber])

  // Обработчик клика вне контекстного меню
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        closeContextMenu()
      }
    }

    document.addEventListener("click", handleClickOutside)
    return () => {
      document.removeEventListener("click", handleClickOutside)
    }
  }, [contextMenu.visible, closeContextMenu])

  // Обработчик клика вне выпадающих списков
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".dropdown-container")) {
        setShowDeptDropdown(false)
        setShowEditDeptDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Обновление состояния isModalOrDetailsOpen
  useEffect(() => {
    // Обновляем состояние isModalOrDetailsOpen при изменении соответствующих состояний
    setIsModalOrDetailsOpen(isAddEmployeeModalOpen || isEditEmployeeModalOpen || expandedEmployee !== null)

    const body = document.body

    if (isModalOrDetailsOpen) {
      body.style.overflow = "hidden"
    } else {
      body.style.overflow = "auto"
    }

    return () => {
      body.style.overflow = "auto"
    }
  }, [isAddEmployeeModalOpen, isEditEmployeeModalOpen, expandedEmployee, isModalOrDetailsOpen])

  // Функция для обработки изменений в форме сотрудника
  const handleEmployeeChange = (e, isNewEmployee = false) => {
    const { name, value } = e.target

    if (isNewEmployee) {
      setNewEmployee((prev) => ({
        ...prev,
        [name]: value,
      }))
      setHasUnsavedNewEmployee(true)
    } else {
      setEditingEmployee((prev) => ({
        ...prev,
        [name]: value,
      }))
      setHasUnsavedChanges(true)
    }
  }

  const handlePhoneChange = (e, isNewEmployee = false) => {
    const { name, value } = e.target

    if (isNewEmployee) {
      setNewEmployee((prev) => ({
        ...prev,
        [name]: value,
      }))
      setHasUnsavedNewEmployee(true)
    } else {
      setEditingEmployee((prev) => ({
        ...prev,
        [name]: formatPhoneNumber(value),
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
      setHasUnsavedNewEmployee(false)
      setShowNewEmployeeExitWarning(false)
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
    const hasUnsaved = isNewEmployee ? hasUnsavedNewEmployee : hasUnsavedChanges
    const setShowWarning = isNewEmployee ? setShowNewEmployeeExitWarning : setShowExitWarning
    const setIsModalOpen = isNewEmployee ? setIsAddEmployeeModalOpen : setIsEditEmployeeModalOpen
    const setEditing = isNewEmployee ? () => {} : () => setEditingEmployee(null)
    const setUnsaved = isNewEmployee ? setHasUnsavedNewEmployee : setHasUnsavedChanges
    const setWarning = isNewEmployee ? setShowNewEmployeeExitWarning : setShowExitWarning

    if (hasUnsaved) {
      setShowWarning(true)
    } else {
      setIsModalOpen(false)
      setEditing()
      setUnsaved(false)
      setWarning(false)
    }
  }

  // Функция для подтверждения выхода без сохранения
  const confirmExit = () => {
    setShowExitWarning(false)
    setIsEditEmployeeModalOpen(false)
    setEditingEmployee(null)
    setHasUnsavedChanges(false)
  }

  const confirmNewEmployeeExit = () => {
    setShowNewEmployeeExitWarning(false)
    setIsAddEmployeeModalOpen(false)
    setHasUnsavedNewEmployee(false)
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

  const filteredDepartments = departments.filter((dept) => dept.name.toLowerCase().startsWith(searchDept.toLowerCase()))

  const filteredEditDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().startsWith(searchEditDept.toLowerCase()),
  )

  // Заменим функцию handleContextMenu на React-версию
  const handleContextMenu = (e, employeeId) => {
    if (isEditMode && selectedEmployees.includes(employeeId)) {
      e.preventDefault()

      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        employeeId,
      })
    }
  }

  const handleDeleteEmployee = (employee) => {
    setEditingEmployee(employee)
    setShowDeleteConfirm(true)
  }

  // Отображение загрузки или ошибки
  if (loading) return <div className={styles.loading}>Загрузка...</div>
  if (error) return <div className={styles.error}>{error}</div>

  // Модальное окно для добавления нового сотрудника
  const renderAddEmployeeModal = () => {
    if (!isAddEmployeeModalOpen) return null

    return (
      <div className={styles.modalOverlay} onClick={() => handleCloseModal(true)}>
        <div className={styles.employeeModal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>Добавление сотрудника</h2>
            <button className={styles.closeButton} onClick={() => handleCloseModal(true)}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <div className={styles.modalContent}>
            {showNewEmployeeExitWarning ? (
              <div className={styles.warningContainer}>
                <p className={styles.warningText}>У вас есть несохраненные изменения</p>
                <div className={styles.warningActions}>
                  <button className={styles.cancelButton} onClick={confirmNewEmployeeExit}>
                    Выйти без сохранения
                  </button>
                  <button className={styles.cancelButton} onClick={() => setShowNewEmployeeExitWarning(false)}>
                    Вернуться к редактированию
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>Основная информация</h3>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>ФИО*</label>
                    <input
                      type="text"
                      name="employee"
                      value={newEmployee.employee}
                      onChange={(e) => handleEmployeeChange(e, true)}
                      className={styles.formInput}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Должность*</label>
                    <input
                      type="text"
                      name="position"
                      value={newEmployee.position}
                      onChange={(e) => handleEmployeeChange(e, true)}
                      className={styles.formInput}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Табельный номер*</label>
                    <input
                      type="text"
                      name="personnel_number"
                      value={newEmployee.personnel_number}
                      onChange={(e) => handleEmployeeChange(e, true)}
                      className={styles.formInput}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Дата рождения</label>
                    <input
                      type="date"
                      name="birth_date"
                      value={newEmployee.birth_date}
                      onChange={(e) => handleEmployeeChange(e, true)}
                      className={styles.formInput}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Местоположение</label>
                    <input
                      type="text"
                      name="location"
                      value={newEmployee.location}
                      onChange={(e) => handleEmployeeChange(e, true)}
                      className={styles.formInput}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Организация*</label>
                    <input
                      type="text"
                      name="organization"
                      value={newEmployee.organization}
                      onChange={(e) => handleEmployeeChange(e, true)}
                      className={styles.formInput}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Подразделение*</label>
                    <div className={`${styles.dropdownContainer} dropdown-container`}>
                      <input
                        type="text"
                        name="department"
                        value={newEmployee.department}
                        onChange={(e) => {
                          const value = e.target.value
                          setSearchDept(value)
                          handleEmployeeChange({ target: { name: "department", value } }, true)
                          setShowDeptDropdown(true)
                        }}
                        onFocus={() => setShowDeptDropdown(true)}
                        placeholder="Выберите отдел"
                        className={styles.formInput}
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
                              className={`${styles.dropdownItem} ${newEmployee.department === dept.name ? styles.dropdownItemSelected : ""}`}
                              onClick={() => {
                                handleEmployeeChange({ target: { name: "department", value: dept.name } }, true)
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
                </div>

                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>Контактная информация</h3>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Рабочий телефон</label>
                    <input
                      type="tel"
                      name="work_phone"
                      value={newEmployee.work_phone}
                      onChange={(e) => handlePhoneChange(e, true)}
                      className={styles.formInput}
                      placeholder="+7 (XXX) XXX-XX-XX"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Электронная почта</label>
                    <input
                      type="email"
                      name="email"
                      value={newEmployee.email}
                      onChange={(e) => handleEmployeeChange(e, true)}
                      className={styles.formInput}
                    />
                  </div>
                </div>

                <div className={styles.modalActions}>
                  <button className={styles.cancelButton} onClick={() => handleCloseModal(true)}>
                    Отмена
                  </button>
                  <button className={styles.saveButton} onClick={handleSaveNewEmployee}>
                    Добавить
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Модальное окно для редактирования сотрудника
  const renderEditEmployeeModal = () => {
    if (!isEditEmployeeModalOpen || !editingEmployee) return null

    return (
      <div className={styles.modalOverlay} onClick={() => handleCloseModal()}>
        <div className={styles.employeeModal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>Редактирование сотрудника</h2>
            <button className={styles.closeButton} onClick={() => handleCloseModal()}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <div className={styles.modalContent}>
            {showExitWarning ? (
              <div className={styles.warningContainer}>
                <p className={styles.warningText}>У вас есть несохраненные изменения</p>
                <div className={styles.warningActions}>
                  <button className={styles.cancelButton} onClick={confirmExit}>
                    Выйти без сохранения
                  </button>
                  <button className={styles.cancelButton} onClick={() => setShowExitWarning(false)}>
                    Вернуться к редактированию
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>Основная информация</h3>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>ФИО*</label>
                    <input
                      type="text"
                      name="employee"
                      value={editingEmployee.employee || ""}
                      onChange={handleEmployeeChange}
                      className={styles.formInput}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Должность*</label>
                    <input
                      type="text"
                      name="position"
                      value={editingEmployee.position || ""}
                      onChange={handleEmployeeChange}
                      className={styles.formInput}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Табельный номер*</label>
                    <input
                      type="text"
                      name="personnel_number"
                      value={editingEmployee.personnel_number || ""}
                      onChange={handleEmployeeChange}
                      className={styles.formInput}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Дата рождения</label>
                    <input
                      type="date"
                      name="birth_date"
                      value={editingEmployee.birth_date || ""}
                      onChange={handleEmployeeChange}
                      className={styles.formInput}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Местоположение</label>
                    <input
                      type="text"
                      name="location"
                      value={editingEmployee.location || ""}
                      onChange={handleEmployeeChange}
                      className={styles.formInput}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Организация*</label>
                    <input
                      type="text"
                      name="organization"
                      value={editingEmployee.organization || ""}
                      onChange={handleEmployeeChange}
                      className={styles.formInput}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Подразделение*</label>
                    <div className={`${styles.dropdownContainer} dropdown-container`}>
                      <input
                        type="text"
                        name="department"
                        value={editingEmployee.department || ""}
                        onChange={(e) => {
                          const value = e.target.value
                          setSearchEditDept(value)
                          handleEmployeeChange({ target: { name: "department", value } })
                          setShowEditDeptDropdown(true)
                        }}
                        onFocus={() => setShowEditDeptDropdown(true)}
                        placeholder="Выберите отдел"
                        className={styles.formInput}
                        required
                      />
                      <span
                        className={styles.dropdownArrow}
                        onClick={() => setShowEditDeptDropdown(!showEditDeptDropdown)}
                      >
                        ▼
                      </span>
                      {showEditDeptDropdown && filteredEditDepartments.length > 0 && (
                        <div className={styles.dropdown}>
                          {filteredEditDepartments.map((dept) => (
                            <div
                              key={dept.id}
                              className={`${styles.dropdownItem} ${editingEmployee.department === dept.name ? styles.dropdownItemSelected : ""}`}
                              onClick={() => {
                                handleEmployeeChange({ target: { name: "department", value: dept.name } })
                                setSearchEditDept(dept.name)
                                setShowEditDeptDropdown(false)
                              }}
                            >
                              {dept.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>Контактная информация</h3>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Рабочий телефон</label>
                    <input
                      type="tel"
                      name="work_phone"
                      value={editingEmployee.work_phone || ""}
                      onChange={(e) => handlePhoneChange(e)}
                      className={styles.formInput}
                      placeholder="+7 (XXX) XXX-XX-XX"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Электронная почта</label>
                    <input
                      type="email"
                      name="email"
                      value={editingEmployee.email || ""}
                      onChange={handleEmployeeChange}
                      className={styles.formInput}
                    />
                  </div>
                </div>

                <div className={styles.modalActions}>
                  <button className={styles.cancelButton} onClick={() => handleCloseModal()}>
                    Отмена
                  </button>
                  <button className={styles.saveButton} onClick={handleSaveEmployee}>
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

    const deleteText =
      selectedEmployees.length === 1
        ? `Вы уверены, что хотите удалить сотрудника ${editingEmployee?.employee || ""}?`
        : `Вы уверены, что хотите удалить ${selectedEmployees.length} ${
            selectedEmployees.length < 5 ? "сотрудников" : "сотрудников"
          }?`

    return (
      <div className={styles.modalOverlay}>
        <div className={styles.confirmModal}>
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>Подтверждение удаления</h2>
            <button className={styles.closeButton} onClick={() => setShowDeleteConfirm(false)}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <div className={styles.modalContent}>
            <p className={styles.confirmText}>{deleteText}</p>

            <div className={styles.confirmActions}>
              <button className={styles.cancelButton} onClick={() => setShowDeleteConfirm(false)}>
                Отмена
              </button>
              <button className={styles.deleteButton} onClick={deleteSelectedEmployees}>
                Удалить
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Заменим return в конце компонента, добавив компонент контекстного меню
  return (
    <>
      <Header onNavigate={onNavigate} />
      <div className={styles.container}>
        <div className={styles.layout}>
          {/* Блок с параметрами поиска */}
          <div className={styles.filterSidebar}>
            <div className={styles.filterHeader} onClick={() => setIsFilterOpen(!isFilterOpen)}>
              <h3 className={styles.filterTitle}>Параметры поиска</h3>
              <FontAwesomeIcon icon={isFilterOpen ? faChevronUp : faChevronDown} className={styles.filterIcon} />
            </div>

            {isFilterOpen && (
              <div className={styles.filterContent}>
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>ФИО</label>
                  <input
                    type="text"
                    name="name"
                    value={filters.name}
                    onChange={handleFilterChange}
                    className={styles.filterInput}
                    placeholder="Введите ФИО"
                  />
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Должность</label>
                  <input
                    type="text"
                    name="position"
                    value={filters.position}
                    onChange={handleFilterChange}
                    className={styles.filterInput}
                    placeholder="Введите должность"
                  />
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Телефон</label>
                  <input
                    type="text"
                    name="phone"
                    value={filters.phone}
                    onChange={handleFilterChange}
                    className={styles.filterInput}
                    placeholder="Введите телефон"
                  />
                </div>

                <div className={styles.filterButtonsContainer}>
                  <button
                    className={
                      activeButton === "apply" ? `${styles.filterButton} ${styles.activeButton}` : styles.filterButton
                    }
                    onClick={applyFilters}
                  >
                    <FontAwesomeIcon icon={faSearch} style={{ marginRight: "5px" }} />
                    Применить
                  </button>
                  <button
                    className={
                      activeButton === "reset" ? `${styles.filterButton} ${styles.activeButton}` : styles.filterButton
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
          <div className={styles.main}>
            {/* Список сотрудников */}
            <div className={styles.employeeListContainer}>
              {/* Заголовки колонок с добавлением кнопки администратора */}
              <div className={styles.columnHeaders}>
                {isAdmin && !isEditMode && (
                  <div className={styles.adminHeaderControls}>
                    <button
                      onClick={() => setShowAdminMenu(!showAdminMenu)}
                      className={styles.editButton}
                      title="Управление сотрудниками"
                    >
                      <FontAwesomeIcon icon={faEdit} className={styles.editIcon} />
                    </button>
                    {showAdminMenu && (
                      <div className={styles.adminMenu}>
                        <button
                          className={styles.adminMenuItem}
                          onClick={() => {
                            setIsAddEmployeeModalOpen(true)
                            setShowAdminMenu(false)
                          }}
                        >
                          Добавить нового сотрудника
                        </button>
                        <div className={styles.menuDivider}></div>
                        <button
                          className={styles.adminMenuItem}
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
                {isEditMode && <div className={styles.checkboxHeader}></div>}
                <div className={styles.nameHeader}>ФИО</div>
                <div className={styles.departmentHeader}>Подразделение</div>
                <div className={styles.contactsHeader}>Контакты</div>
              </div>

              {/* После заголовков колонок и перед списком сотрудников добавим: */}
              {isEditMode && (
                <div className={styles.editModeBar}>
                  <span
                    className={styles.exitEditModeText}
                    onClick={() => {
                      setIsEditMode(false)
                      setSelectedEmployees([])
                    }}
                  >
                    Выйти из режима редактирования
                  </span>
                  {selectedEmployees.length > 0 && (
                    <span className={styles.selectedCount}>Выбрано: {selectedEmployees.length}</span>
                  )}
                </div>
              )}

              {/* Список сотрудников */}
              <div className={styles.employeeList}>
                {filteredEmployees.map((employee, index) => (
                  <div key={employee.id} onContextMenu={(e) => handleContextMenu(e, employee.id)}>
                    <div className={styles.employeeRow}>
                      {isEditMode && (
                        <div className={styles.checkboxContainer}>
                          <div
                            className={`${styles.checkbox} ${selectedEmployees.includes(employee.id) ? styles.checkboxSelected : ""}`}
                            onClick={() => toggleSelectEmployee(employee.id)}
                          >
                            {selectedEmployees.includes(employee.id) && (
                              <FontAwesomeIcon icon={faCheck} className={styles.checkIcon} />
                            )}
                          </div>
                        </div>
                      )}
                      <div className={styles.employeePhotoAndInfo}>
                        <div className={styles.employeePhoto}>
                          {employee.photo ? (
                            <img
                              src={employee.photo || "/placeholder.svg"}
                              alt={employee.employee}
                              className={styles.photo}
                            />
                          ) : (
                            <FontAwesomeIcon icon={faUser} style={{ fontSize: "40px", color: "#13454B" }} />
                          )}
                        </div>
                        <div className={styles.employeeMainInfo}>
                          <h4 className={styles.employeeName}>{employee.employee}</h4>
                          <p className={styles.employeePosition}>{employee.position}</p>
                        </div>
                      </div>
                      <div className={styles.employeeDepartment}>
                        <div className={styles.departmentText}>{employee.department}</div>
                      </div>
                      <div className={styles.employeeContacts}>
                        <div className={styles.contactIcons}>
                          <button
                            className={styles.contactIconButton}
                            onClick={(e) => {
                              e.stopPropagation()
                              window.location.href = `mailto:${employee.email || ""}`
                            }}
                            title="Email"
                          >
                            <FontAwesomeIcon icon={faEnvelope} />
                          </button>
                          <button
                            className={styles.contactIconButton}
                            onClick={(e) => {
                              e.stopPropagation()
                              window.location.href = `https://t.me/${employee.telegram || ""}`
                            }}
                            title="Telegram"
                          >
                            <FontAwesomeIcon icon={faTelegram} />
                          </button>
                          <button
                            className={styles.contactIconButton}
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
                          <div className={styles.editActions}>
                            <button
                              className={styles.editEmployeeButton}
                              onClick={() => {
                                setEditingEmployee(employee)
                                setIsEditEmployeeModalOpen(true)
                              }}
                              title="Редактировать"
                            >
                              <FontAwesomeIcon icon={faEdit} className={styles.editEmployeeIcon} />
                            </button>
                            <button
                              className={styles.deleteEmployeeButton}
                              onClick={() => handleDeleteEmployee(employee)}
                              title="Удалить"
                            >
                              <FontAwesomeIcon icon={faTrash} className={styles.deleteEmployeeIcon} />
                            </button>
                          </div>
                        ) : (
                          <button
                            className={styles.expandButton}
                            onClick={() => toggleEmployeeDetails(employee.id)}
                            aria-expanded={expandedEmployee === employee.id}
                          >
                            <FontAwesomeIcon
                              icon={faChevronRight}
                              className={`${styles.expandIcon} ${expandedEmployee === employee.id ? styles.expandIconRotated : ""}`}
                            />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Развернутая информация о сотруднике */}
                    {expandedEmployee === employee.id && (
                      <div className={styles.employeeDetails}>
                        <div className={styles.detailsSection}>
                          <h4 className={styles.detailsTitle}>Основная информация</h4>
                          <div className={styles.detailsRow}>
                            <span className={styles.detailsLabel}>Табельный номер:</span>
                            <span className={styles.detailsValue}>{employee.personnel_number || "Не указан"}</span>
                          </div>
                          <div className={styles.detailsRow}>
                            <span className={styles.detailsLabel}>Дата рождения:</span>
                            <span className={styles.detailsValue}>{employee.birth_date || "Не указана"}</span>
                          </div>
                          <div className={styles.detailsRow}>
                            <span className={styles.detailsLabel}>Местоположение:</span>
                            <span className={styles.detailsValue}>{employee.location || "Не указано"}</span>
                          </div>
                          <div className={styles.detailsRow}>
                            <span className={styles.detailsLabel}>Организация:</span>
                            <span className={styles.detailsValue}>{employee.organization || "Не указана"}</span>
                          </div>
                        </div>

                        <div className={styles.detailsSection}>
                          <h4 className={styles.detailsTitle}>Контактная информация</h4>
                          <div className={styles.detailsRow}>
                            <span className={styles.detailsLabel}>Рабочий телефон:</span>
                            <div className={styles.detailsValueWithCopy}>
                              <span className={styles.detailsValue}>
                                {formatPhoneNumber(employee.work_phone) || "Не указан"}
                              </span>
                              {employee.work_phone && (
                                <button
                                  className={styles.copyButton}
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
                          <div className={styles.detailsRow}>
                            <span className={styles.detailsLabel}>Электронная почта:</span>
                            <div className={styles.detailsValueWithCopy}>
                              <span className={styles.detailsValue}>{employee.email || "Не указана"}</span>
                              {employee.email && (
                                <button
                                  className={styles.copyButton}
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
                        <div className={styles.detailsActions}>
                          <div className={styles.actionButtons}>
                            <button className={styles.reportErrorButton}>Сообщить об ошибке</button>
                            <button className={styles.downloadContactButton}>Скачать контакт</button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Разделитель между сотрудниками */}
                    {index < filteredEmployees.length - 1 && <div className={styles.employeeDivider}></div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Уведом��ение о копировании */}
      {showCopyNotification && <div className={styles.copyNotification}>{copiedText} скопирован в буфер обмена</div>}

      {/* Контекстное меню */}
      <ContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        onDelete={() => setShowDeleteConfirm(true)}
        onDownload={downloadSelectedEmployees}
        onClose={closeContextMenu}
      />

      {/* Модальные окна */}
      {renderAddEmployeeModal()}
      {renderEditEmployeeModal()}
      {renderDeleteConfirmModal()}
    </>
  )
}

export default EmployeeDirectory
