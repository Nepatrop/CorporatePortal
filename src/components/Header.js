"use client"

import { useState, useRef, useEffect } from "react"
import logo from "../logo-white.svg"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faUser, faCopy, faTimes, faPencilAlt, faCheck } from "@fortawesome/free-solid-svg-icons"
import { useUser } from "../context/UserContext"

function Header({ onNavigate }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showExitWarning, setShowExitWarning] = useState(false)
  const [changedFields, setChangedFields] = useState({})
  const [showCopyNotification, setShowCopyNotification] = useState(false)
  const [copiedText, setCopiedText] = useState("")
  const { currentUser, logout, updateUser } = useUser()
  const profileRef = useRef(null)

  // Состояние для редактируемых полей
  const [editableFields, setEditableFields] = useState({
    full_name: "",
    position: "",
    work_phone: "",
    mobile_phone: "",
    email: "",
    birth_date: "",
  })

  // Функция для форматирования номера телефона
  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/\D/g, "")
    if (!numbers) return ""
    const firstPart = numbers.slice(1, 4)
    const secondPart = numbers.slice(4, 7)
    const thirdPart = numbers.slice(7, 9)
    const fourthPart = numbers.slice(9, 11)
    return `+7 (${firstPart}) ${secondPart ? `${secondPart}` : ""}${thirdPart ? `-${thirdPart}` : ""}${fourthPart ? `-${fourthPart}` : ""}`
  }

  // Инициализация редактируемых полей при открытии режима редактирования
  useEffect(() => {
    if (isEditing && currentUser) {
      setEditableFields({
        full_name: currentUser.full_name || "",
        position: currentUser.position || "",
        work_phone: currentUser.work_phone || "",
        mobile_phone: currentUser.mobile_phone || "",
        email: currentUser.email || "",
        birth_date: currentUser.birth_date || "",
      })
      // Сбрасываем список измененных полей при входе в режим редактирования
      setChangedFields({})
      setHasUnsavedChanges(false)
    }
  }, [isEditing, currentUser])

  // Обработчик клика вне модального окна
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target) && isProfileOpen) {
        handleCloseProfile()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isProfileOpen, hasUnsavedChanges, isEditing])

  // Обработчик закрытия профиля
  const handleCloseProfile = () => {
    if (hasUnsavedChanges && isEditing) {
      setShowExitWarning(true)
    } else {
      setIsProfileOpen(false)
      setIsEditing(false)
      setHasUnsavedChanges(false)
      setChangedFields({})
      setShowExitWarning(false)
    }
  }

  // Обработчик изменения полей
  const handleFieldChange = (e) => {
    const { name, value } = e.target

    // Сохраняем новое значение поля
    setEditableFields((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Проверяем, отличается ли новое значение от исходного
    const originalValue = currentUser[name] || ""
    if (value !== originalValue) {
      // Если поле изменено, добавляем его в список измененных полей
      setChangedFields((prev) => ({
        ...prev,
        [name]: true,
      }))
      setHasUnsavedChanges(true)
    } else {
      // Если поле вернулось к исходному значению, удаляем его из списка измененных
      setChangedFields((prev) => {
        const newChangedFields = { ...prev }
        delete newChangedFields[name]
        return newChangedFields
      })
      // Проверяем, остались ли еще измененные поля
      const updatedFields = { ...changedFields }
      delete updatedFields[name]
      setHasUnsavedChanges(Object.keys(updatedFields).length > 0)
    }
  }

  // Обработчик фокуса для полей телефона
  const handlePhoneFocus = (e) => {
    const { name, value } = e.target
    if (!value) {
      setEditableFields((prev) => ({
        ...prev,
        [name]: "+7 (",
      }))
    }
  }

  // Обработчик изменения полей телефона
  const handlePhoneFieldChange = (e) => {
    const { name, value } = e.target
    const formattedValue = formatPhoneNumber(value)

    setEditableFields((prev) => ({
      ...prev,
      [name]: formattedValue,
    }))

    // Проверяем, отличается ли новое значение от исходного
    const originalValue = currentUser[name] || ""
    if (formattedValue !== originalValue) {
      setChangedFields((prev) => ({
        ...prev,
        [name]: true,
      }))
      setHasUnsavedChanges(true)
    } else {
      setChangedFields((prev) => {
        const newChangedFields = { ...prev }
        delete newChangedFields[name]
        return newChangedFields
      })
      // Проверяем, остались ли еще измененные поля
      const updatedFields = { ...changedFields }
      delete updatedFields[name]
      setHasUnsavedChanges(Object.keys(updatedFields).length > 0)
    }
  }

  // Добавляем функцию для отмены редактирования
  const handleCancelEditing = () => {
    if (hasUnsavedChanges) {
      setShowExitWarning(true)
    } else {
      setIsEditing(false)
      setHasUnsavedChanges(false)
      setChangedFields({})
    }
  }

  // Добавляем функцию для подтверждения выхода без сохранения
  const confirmExit = () => {
    setIsEditing(false)
    setHasUnsavedChanges(false)
    setChangedFields({})
    setShowExitWarning(false)
  }

  // Обработчик сохранения изменений
  const handleSaveChanges = () => {
    updateUser({
      ...currentUser,
      ...editableFields,
    })
    setIsEditing(false)
    setHasUnsavedChanges(false)
    setChangedFields({})
    setShowExitWarning(false)
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

  // Форматирование даты
  const formatDate = (dateString) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  // Функция для отображения информации о руководителе
  const showManagerInfo = (managerName) => {
    alert(`Информация о руководителе: ${managerName}\nВ полной версии здесь будет отображаться профиль руководителя.`)
  }

  return (
    <>
      <header style={styles.header}>
        {/* Левая часть с логотипом */}
        <div style={styles.logoContainer}>
          <a
            href="/"
            style={styles.logoLink}
            onClick={(e) => {
              e.preventDefault()
              if (onNavigate) onNavigate("home")
            }}
          >
            <img src={logo || "/placeholder.svg"} alt="ИТ-Элемент29 Logo" style={styles.logo} />
          </a>
        </div>

        {/* Центральная часть с навигацией */}
        <div style={styles.centerNav}>
          <button
            style={styles.textButton}
            onClick={(e) => {
              e.preventDefault()
              if (onNavigate) onNavigate("directory")
            }}
          >
            Справочник сотрудников
          </button>
        </div>

        {/* Правая часть с информацией о пользователе */}
        <div style={styles.userInfoContainer} onClick={() => setIsProfileOpen(true)}>
          <div style={styles.userPhoto}>
            {currentUser?.photo ? (
              <img src={currentUser.photo || "/placeholder.svg"} alt={currentUser.full_name} style={styles.photo} />
            ) : (
              <FontAwesomeIcon icon={faUser} style={styles.userIcon} />
            )}
          </div>
          <div style={styles.userDetails}>
            <div style={styles.userName}>{currentUser ? currentUser.full_name : "Гость"}</div>
            <div style={styles.userPosition}>{currentUser?.position}</div>
          </div>
        </div>
      </header>

      {/* Модальное окно профиля */}
      {isProfileOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.profileModal} ref={profileRef}>
            <div style={styles.profileHeader}>
              <h2 style={styles.profileTitle}>Профиль сотрудника</h2>
              <button style={styles.closeButton} onClick={handleCloseProfile}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div style={styles.profileContent}>
              {/* Основная информация */}
              <div style={styles.profileMainInfo}>
                <div style={styles.profilePhoto}>
                  {currentUser?.photo ? (
                    <img
                      src={currentUser.photo || "/placeholder.svg"}
                      alt={currentUser.full_name}
                      style={styles.profilePhotoImg}
                    />
                  ) : (
                    <FontAwesomeIcon icon={faUser} style={styles.profilePhotoIcon} />
                  )}
                </div>
                <div style={styles.profileNameContainer}>
                  <div style={styles.nameWithEditIcon}>
                    {isEditing ? (
                      <input
                        type="text"
                        name="full_name"
                        value={editableFields.full_name}
                        onChange={handleFieldChange}
                        style={{
                          ...styles.editInput,
                          boxShadow:
                            showExitWarning && changedFields.full_name ? "0 0 0 2px rgba(238, 107, 12, 0.3)" : "none",
                        }}
                      />
                    ) : (
                      <>
                        <h3 style={styles.profileName}>{currentUser?.full_name}</h3>
                        <button
                          style={styles.editIconButton}
                          onClick={(e) => {
                            e.stopPropagation()
                            setIsEditing(true)
                          }}
                        >
                          <FontAwesomeIcon icon={faPencilAlt} style={styles.editIcon} />
                          <span style={styles.editText}>изменить</span>
                        </button>
                      </>
                    )}
                  </div>
                  <p style={styles.profilePosition}>{currentUser?.position}</p>
                </div>
              </div>

              {/* Детальная информация */}
              <div style={styles.profileDetails}>
                <div style={styles.profileSection}>
                  <h4 style={styles.sectionTitle}>Основная информация</h4>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Табельный номер:</span>
                    <span style={styles.infoValue}>{currentUser?.personnel_number}</span>
                  </div>

                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Дата рождения:</span>
                    {isEditing ? (
                      <div style={styles.inputContainer}>
                        <input
                          type="date"
                          name="birth_date"
                          value={editableFields.birth_date}
                          onChange={handleFieldChange}
                          style={{
                            ...styles.editInput,
                            boxShadow:
                              showExitWarning && changedFields.birth_date
                                ? "0 0 0 2px rgba(238, 107, 12, 0.3)"
                                : "none",
                          }}
                        />
                      </div>
                    ) : (
                      <span style={styles.infoValue}>{formatDate(currentUser?.birth_date)}</span>
                    )}
                  </div>

                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Организация:</span>
                    <span style={styles.infoValue}>{currentUser?.organization}</span>
                  </div>

                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Подразделение:</span>
                    <span style={styles.infoValue}>{currentUser?.department}</span>
                  </div>
                </div>

                <div style={styles.profileSection}>
                  <h4 style={styles.sectionTitle}>Контактная информация</h4>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Рабочий телефон:</span>
                    <div style={styles.infoValueWithCopy}>
                      {isEditing ? (
                        <div style={styles.inputContainer}>
                          <input
                            type="text"
                            name="work_phone"
                            value={editableFields.work_phone}
                            onChange={handlePhoneFieldChange}
                            onFocus={handlePhoneFocus}
                            placeholder="+7 (XXX) XXX-XX-XX"
                            style={{
                              ...styles.editInput,
                              boxShadow:
                                showExitWarning && changedFields.work_phone
                                  ? "0 0 0 2px rgba(238, 107, 12, 0.3)"
                                  : "none",
                            }}
                          />
                        </div>
                      ) : (
                        <span style={styles.infoValue}>{currentUser?.work_phone}</span>
                      )}
                      {!isEditing && currentUser?.work_phone && (
                        <button
                          style={styles.copyButton}
                          onClick={(e) => {
                            e.stopPropagation()
                            copyToClipboard(currentUser.work_phone, "Рабочий телефон")
                          }}
                        >
                          <FontAwesomeIcon icon={faCopy} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Мобильный телефон:</span>
                    <div style={styles.infoValueWithCopy}>
                      {isEditing ? (
                        <div style={styles.inputContainer}>
                          <input
                            type="text"
                            name="mobile_phone"
                            value={editableFields.mobile_phone}
                            onChange={handlePhoneFieldChange}
                            onFocus={handlePhoneFocus}
                            placeholder="+7 (XXX) XXX-XX-XX"
                            style={{
                              ...styles.editInput,
                              boxShadow:
                                showExitWarning && changedFields.mobile_phone
                                  ? "0 0 0 2px rgba(238, 107, 12, 0.3)"
                                  : "none",
                            }}
                          />
                        </div>
                      ) : (
                        <span style={styles.infoValue}>{currentUser?.mobile_phone || "Не указан"}</span>
                      )}
                      {!isEditing && currentUser?.mobile_phone && (
                        <button
                          style={styles.copyButton}
                          onClick={(e) => {
                            e.stopPropagation()
                            copyToClipboard(currentUser.mobile_phone, "Мобильный телефон")
                          }}
                        >
                          <FontAwesomeIcon icon={faCopy} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Электронная почта:</span>
                    <div style={styles.infoValueWithCopy}>
                      {isEditing ? (
                        <div style={styles.inputContainer}>
                          <input
                            type="email"
                            name="email"
                            value={editableFields.email}
                            onChange={handleFieldChange}
                            style={{
                              ...styles.editInput,
                              boxShadow:
                                showExitWarning && changedFields.email ? "0 0 0 2px rgba(238, 107, 12, 0.3)" : "none",
                            }}
                          />
                        </div>
                      ) : (
                        <span
                          style={styles.clickableValue}
                          onClick={(e) => {
                            e.stopPropagation()
                            window.location.href = `mailto:${currentUser?.email}`
                          }}
                        >
                          {currentUser?.email || "Не указана"}
                        </span>
                      )}
                      {!isEditing && currentUser?.email && (
                        <button
                          style={styles.copyButton}
                          onClick={(e) => {
                            e.stopPropagation()
                            copyToClipboard(currentUser.email, "Email")
                          }}
                        >
                          <FontAwesomeIcon icon={faCopy} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div style={styles.profileSection}>
                  <h4 style={styles.sectionTitle}>Руководитель</h4>
                  <div style={styles.infoRow}>
                    {currentUser?.manager ? (
                      <span
                        style={styles.clickableValue}
                        onClick={(e) => {
                          e.stopPropagation()
                          showManagerInfo(currentUser.manager)
                        }}
                      >
                        {currentUser.manager}
                      </span>
                    ) : (
                      <span style={styles.infoValue}>Не указан</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Кнопки действий */}
              <div style={styles.profileActions}>
                {isEditing ? (
                  <>
                    <div style={styles.warningContainer}>
                      {showExitWarning && <span style={styles.warningText}>У вас есть несохраненные изменения</span>}
                    </div>
                    <div style={styles.actionButtons}>
                      <button style={styles.cancelButton} onClick={showExitWarning ? confirmExit : handleCancelEditing}>
                        {showExitWarning ? "Выйти без сохранения" : "Отмена"}
                      </button>
                      {showExitWarning ? (
                        <button style={styles.cancelButton} onClick={() => setShowExitWarning(false)}>
                          Вернуться к редактированию
                        </button>
                      ) : (
                        <button
                          style={styles.saveButton}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = "#EE6B0C"
                            e.currentTarget.style.color = "#FFFFFF"
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = "#FFFFFF"
                            e.currentTarget.style.color = "#EE6B0C"
                          }}
                          onClick={handleSaveChanges}
                        >
                          <FontAwesomeIcon icon={faCheck} style={{ marginRight: "5px" }} />
                          Сохранить
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <button
                    style={styles.logoutButton}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = "#EE6B0C"
                      e.currentTarget.style.color = "#FFFFFF"
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = "#FFFFFF"
                      e.currentTarget.style.color = "#EE6B0C"
                    }}
                    onClick={() => {
                      logout()
                      handleCloseProfile()
                      if (onNavigate) onNavigate("login")
                    }}
                  >
                    Выйти из аккаунта
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Уведомление о копировании */}
      {showCopyNotification && <div style={styles.copyNotification}>{copiedText} скопирован в буфер обмена</div>}
    </>
  )
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem",
    backgroundColor: "#13454B", // ИЗУМРУДНЫЙ
    color: "#FFFFFF", // БЕЛЫЙ
    fontFamily: "'Manrope', Arial, sans-serif", // Основной шрифт
  },
  userInfoContainer: {
    display: "flex",
    alignItems: "center",
    position: "relative",
    cursor: "pointer",
    padding: "5px 10px",
    borderRadius: "4px",
    transition: "background-color 0.2s",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
  },
  userPhoto: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "#FFFFFF", // Белый фон для кружочка
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginRight: "12px",
  },
  photo: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  userIcon: {
    fontSize: "20px",
    color: "#333333", // Темно-серый цвет для иконки пользователя
  },
  userDetails: {
    display: "flex",
    flexDirection: "column",
  },
  userName: {
    fontSize: "16px",
    fontWeight: 500,
    color: "#FFFFFF",
    marginBottom: "2px",
  },
  userPosition: {
    fontSize: "12px",
    color: "rgba(255, 255, 255, 0.8)",
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start", // Логотип слева
    flex: 1,
  },
  logoLink: {
    cursor: "pointer",
  },
  logo: {
    height: "40px",
  },
  centerNav: {
    display: "flex",
    justifyContent: "center", // Справочник сотрудников по центру
    flex: 1,
  },
  textButton: {
    background: "none",
    border: "none",
    color: "#FFFFFF",
    cursor: "pointer",
    fontFamily: "'Manrope', Arial, sans-serif",
    fontWeight: 500,
    fontSize: "16px",
    padding: "0.5rem 1rem",
  },

  // Стили для модального окна профиля
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    zIndex: 1000,
    paddingTop: "80px",
  },
  profileModal: {
    width: "45%",
    backgroundColor: "#FFFFFF",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    display: "flex",
    flexDirection: "column",
    maxHeight: "80vh",
    overflowY: "auto",
  },
  profileHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px",
    borderBottom: "1px solid #E0E0E0",
  },
  profileTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 600,
    color: "#13454B",
    fontFamily: "'Open Sans', Arial, sans-serif",
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: "20px",
    color: "#777",
    cursor: "pointer",
    padding: "5px",
  },
  profileContent: {
    padding: "20px",
  },
  profileMainInfo: {
    display: "flex",
    alignItems: "center",
    marginBottom: "30px",
  },
  profilePhoto: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    backgroundColor: "#E0E0E0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginRight: "20px",
  },
  profilePhotoImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  profilePhotoIcon: {
    fontSize: "40px",
    color: "#777",
  },
  profileNameContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "15px", // Добавляем отступ между ФИО и должностью
  },
  nameWithEditIcon: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  editIconButton: {
    background: "none",
    border: "none",
    padding: "5px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },
  editIcon: {
    fontSize: "16px",
    color: "#999", // Светло-серый цвет для иконки карандаша
  },
  editText: {
    fontSize: "14px",
    color: "#999",
  },
  profilePosition: {
    margin: 0,
    fontSize: "16px",
    color: "#777",
    fontFamily: "'Open Sans', Arial, sans-serif",
  },
  profileDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "25px",
  },
  profileSection: {
    marginBottom: "15px",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#13454B",
    marginBottom: "15px",
    fontFamily: "'Open Sans', Arial, sans-serif",
  },
  infoRow: {
    display: "flex",
    marginBottom: "12px",
    alignItems: "center",
  },
  infoLabel: {
    width: "180px",
    fontSize: "14px",
    color: "#777",
    fontFamily: "'Open Sans', Arial, sans-serif",
  },
  infoValue: {
    fontSize: "14px",
    color: "#333",
    fontFamily: "'Open Sans', Arial, sans-serif",
  },
  infoValueWithCopy: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  copyButton: {
    background: "none",
    border: "none",
    color: "#EE6B0C", // Изменено на оранжевый
    cursor: "pointer",
    padding: "5px",
    fontSize: "14px",
  },
  profileActions: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "30px",
    borderTop: "1px solid #E0E0E0",
    paddingTop: "20px",
  },
  editButton: {
    padding: "10px 20px",
    backgroundColor: "#13454B",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    fontFamily: "'Open Sans', Arial, sans-serif",
  },
  logoutButton: {
    padding: "10px 20px",
    backgroundColor: "#FFFFFF",
    color: "#EE6B0C",
    border: "1px solid #EE6B0C",
    borderRadius: "20px", // Скругленные углы как у полей ввода
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    fontFamily: "'Open Sans', Arial, sans-serif",
    transition: "background-color 0.3s, color 0.3s",
  },
  saveButton: {
    padding: "10px 20px",
    backgroundColor: "#FFFFFF",
    color: "#EE6B0C",
    border: "1px solid #EE6B0C",
    borderRadius: "20px", // Скругленные углы как у полей ввода
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    fontFamily: "'Open Sans', Arial, sans-serif",
    transition: "background-color 0.3s, color 0.3s",
  },
  cancelButton: {
    padding: "10px 20px",
    backgroundColor: "#FFFFFF",
    color: "#777",
    border: "1px solid #E0E0E0",
    borderRadius: "20px", // Скругленные углы как у кнопки "Сохранить"
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    fontFamily: "'Open Sans', Arial, sans-serif",
  },
  editInput: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #e0e0e0",
    borderRadius: "20px", // Скругленные углы как в справочнике
    fontSize: "14px",
    fontFamily: "'Open Sans', Arial, sans-serif",
  },
  inputContainer: {
    width: "300px", // Фиксированная ширина для всех полей ввода
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
  clickableValue: {
    fontSize: "14px",
    color: "#EE6B0C", // Оранжевый цвет
    fontFamily: "'Open Sans', Arial, sans-serif",
    cursor: "pointer",
    textDecoration: "none",
    "&:hover": {
      textDecoration: "underline",
    },
  },
  warningContainer: {
    flex: 1,
  },
  warningText: {
    color: "#EE6B0C",
    fontSize: "14px",
    fontFamily: "'Open Sans', Arial, sans-serif",
  },
  actionButtons: {
    display: "flex",
    gap: "10px",
  },
}

export default Header

