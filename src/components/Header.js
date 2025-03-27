"use client"

import { useState, useRef, useEffect } from "react"
import logo from "../logo-white.svg"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faUser, faCopy, faTimes, faPencilAlt, faCheck, faCamera } from "@fortawesome/free-solid-svg-icons"
import { useUser } from "../context/UserContext"
import { api } from "../utils/api"
import styles from "../styles/Header.module.css"

function Header({ onNavigate }) {
  // Добавляем функцию форматирования телефона
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

  // Остальной код компонента...
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showExitWarning, setShowExitWarning] = useState(false)
  const [changedFields, setChangedFields] = useState({})
  const [showCopyNotification, setShowCopyNotification] = useState(false)
  const [copiedText, setCopiedText] = useState("")
  const { currentUser, setCurrentUser, logout, updateUser } = useUser()
  const profileRef = useRef(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [showErrorMessage, setShowErrorMessage] = useState(false)
  const [editedProfile, setEditedProfile] = useState({
    full_name: "",
    position: "",
    work_phone: "",
    can_help_with: "",
    responsibilities: "",
    makes_decisions: "",
  })

  // Состояние для редактируемых полей
  const [editableFields, setEditableFields] = useState({
    interests1: "",
    interests2: "",
    interests3: "",
    projects1: "",
    projects2: "",
    projects3: "",
    email: "",
  })

  // Добавляем возможность изменения фотографии
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)
  const fileInputRef = useRef(null)

  // Инициализация редактируемых полей при открытии режима редактирования
  useEffect(() => {
    if (isEditing && currentUser) {
      setEditableFields({
        interests1: currentUser.interests1 || "",
        interests2: currentUser.interests2 || "",
        interests3: currentUser.interests3 || "",
        projects1: currentUser.projects1 || "",
        projects2: currentUser.projects2 || "",
        projects3: currentUser.projects3 || "",
        email: currentUser.email || "",
      })
      // Сбрасываем список измененных полей при входе в режим редактирования
      setChangedFields({})
      setHasUnsavedChanges(false)
      setPhotoPreview(null)
      setPhotoFile(null)
    }
  }, [isEditing, currentUser])

  // Инициализация editedProfile при монтировании и изменении currentUser
  useEffect(() => {
    if (currentUser) {
      setEditedProfile({
        full_name: currentUser.full_name || "",
        position: currentUser.position || "",
        work_phone: currentUser.work_phone || "",
        can_help_with: currentUser.can_help_with || "",
        responsibilities: currentUser.responsibilities || "",
        makes_decisions: currentUser.makes_decisions || "",
      })
    }
  }, [currentUser])

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
      // Сбрасываем предпросмотр фото
      setPhotoPreview(null)
      setPhotoFile(null)
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
      setHasUnsavedChanges(Object.keys(updatedFields).length > 0 || photoFile !== null)
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
      // Сбрасываем предпросмотр фото
      setPhotoPreview(null)
      setPhotoFile(null)
    }
  }

  // Добавляем функцию для подтверждения выхода без сохранения
  const confirmExit = () => {
    setIsEditing(false)
    setHasUnsavedChanges(false)
    setChangedFields({})
    setShowExitWarning(false)
    // Сбрасываем предпросмотр фото
    setPhotoPreview(null)
    setPhotoFile(null)
  }

  // Обработчик сохранения изменений
  const handleSaveChanges = async () => {
    try {
      console.log("Sending data:", editableFields)

      // Фильтруем пустые значения и undefined
      const changedData = {}
      Object.keys(changedFields).forEach((field) => {
        if (editableFields[field] !== undefined) {
          changedData[field] = editableFields[field]
        }
      })

      // Добавляем фото, если оно было изменено
      if (photoFile) {
        // Здесь должна быть логика для загрузки фото на сервер
        // Для примера просто добавим URL в changedData
        changedData.photo = URL.createObjectURL(photoFile)
      }

      console.log("Changed fields to send:", changedData)

      if (Object.keys(changedData).length === 0 && !photoFile) {
        console.log("No valid fields to update")
        return
      }

      const response = await api.putEmployee(currentUser.id, changedData)

      if (response.ok) {
        const data = await response.json()
        console.log("Server response:", data)

        if (data.success) {
          setCurrentUser((prev) => ({
            ...prev,
            ...changedData,
          }))

          setIsEditing(false)
          setHasUnsavedChanges(false)
          setChangedFields({})
          setShowExitWarning(false)
          setPhotoPreview(null)
          setPhotoFile(null)
          setShowSuccessMessage(true)
          setTimeout(() => setShowSuccessMessage(false), 3000)
        } else {
          console.error("Server returned error:", data.error)
          setShowErrorMessage(true)
          setTimeout(() => setShowErrorMessage(false), 3000)
        }
      } else {
        throw new Error("Network response was not ok")
      }
    } catch (error) {
      console.error("Error saving profile:", error)
      setShowErrorMessage(true)
      setTimeout(() => setShowErrorMessage(false), 3000)
    }
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
    alert(`Информация о руководителе: ${managerName}
В полной версии здесь будет отображаться профиль руководителя.`)
  }

  // Функция для обработки изменения фото
  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result)
        // Добавляем фото в список измененных полей
        setChangedFields((prev) => ({
          ...prev,
          photo: true,
        }))
        setHasUnsavedChanges(true)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <>
      <header className={styles.header}>
        {/* Левая часть с логотипом */}
        <div className={styles.logoContainer}>
          <a
            href="/"
            className={styles.logoLink}
            onClick={(e) => {
              e.preventDefault()
              if (onNavigate) onNavigate("home")
            }}
          >
            <img src={logo || "/placeholder.svg"} alt="ИТ-Элемент29 Logo" className={styles.logo} />
          </a>
        </div>

        {/* Центральная часть с навигацией */}
        <div className={styles.centerNav}>
          <button
            className={styles.textButton}
            onClick={(e) => {
              e.preventDefault()
              if (onNavigate) onNavigate("directory")
            }}
          >
            Справочник сотрудников
          </button>
        </div>

        {/* Правая часть с информацией о пользователе */}
        <div className={styles.userInfoContainer} onClick={() => setIsProfileOpen(true)}>
          <div className={styles.userPhoto}>
            {currentUser?.photo ? (
              <img src={currentUser.photo || "/placeholder.svg"} alt={currentUser.full_name} className={styles.photo} />
            ) : (
              <FontAwesomeIcon icon={faUser} className={styles.userIcon} />
            )}
          </div>
          <div className={styles.userDetails}>
            <div className={styles.userName}>{currentUser ? currentUser.full_name : "Гость"}</div>
            <div className={styles.userPosition}>{currentUser?.position}</div>
          </div>
        </div>
      </header>

      {/* Модальное окно профиля */}
      {isProfileOpen && (
        <div className={styles.modalOverlay} onClick={handleCloseProfile}>
          <div className={styles.profileModal} ref={profileRef} onClick={(e) => e.stopPropagation()}>
            <div className={styles.profileHeader}>
              <h2 className={styles.profileTitle}>Профиль сотрудника</h2>
              <button className={styles.closeButton} onClick={handleCloseProfile}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className={styles.profileContent}>
              {/* Основная информация */}
              <div className={styles.profileMainInfo}>
                {/* Блок с фотографией в профиле */}
                <div
                  className={styles.profilePhoto}
                  style={{
                    boxShadow: showExitWarning && changedFields.photo ? "0 0 0 2px rgba(238, 107, 12, 0.3)" : "none",
                  }}
                  onMouseEnter={() => isEditing && setShowPhotoUpload(true)}
                  onMouseLeave={() => setShowPhotoUpload(false)}
                >
                  {isEditing ? (
                    <>
                      {photoPreview ? (
                        <img
                          src={photoPreview || "/placeholder.svg"}
                          alt={currentUser.full_name}
                          className={styles.profilePhotoImg}
                        />
                      ) : currentUser?.photo ? (
                        <img
                          src={currentUser.photo || "/placeholder.svg"}
                          alt={currentUser.full_name}
                          className={styles.profilePhotoImg}
                        />
                      ) : (
                        <FontAwesomeIcon icon={faUser} className={styles.profilePhotoIcon} />
                      )}
                      {isEditing && (
                        <div
                          className={styles.photoUploadOverlay}
                          style={{
                            opacity: showPhotoUpload ? 1 : 0,
                          }}
                          onClick={() => fileInputRef.current.click()}
                        >
                          <FontAwesomeIcon icon={faCamera} className={styles.cameraIcon} />
                        </div>
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handlePhotoChange}
                        style={{ display: "none" }}
                        accept="image/*"
                      />
                    </>
                  ) : (
                    <>
                      {currentUser?.photo ? (
                        <img
                          src={currentUser.photo || "/placeholder.svg"}
                          alt={currentUser.full_name}
                          className={styles.profilePhotoImg}
                        />
                      ) : (
                        <FontAwesomeIcon icon={faUser} className={styles.profilePhotoIcon} />
                      )}
                    </>
                  )}
                </div>
                <div className={styles.profileNameContainer}>
                  <div className={styles.nameWithEditIcon}>
                    <h3 className={styles.profileName}>{currentUser?.full_name}</h3>
                    {!isEditing && (
                      <button
                        className={styles.editIconButton}
                        onClick={(e) => {
                          e.stopPropagation()
                          setIsEditing(true)
                        }}
                      >
                        <FontAwesomeIcon icon={faPencilAlt} className={styles.editIcon} />
                        <span className={styles.editText}>Изменить</span>
                      </button>
                    )}
                  </div>
                  <p className={styles.profilePosition}>{currentUser?.position}</p>
                </div>
              </div>

              {/* Детальная информация */}
              <div className={styles.profileDetails}>
                <div className={styles.profileSection}>
                  <h4 className={styles.sectionTitle}>Основная информация</h4>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Табельный номер:</span>
                    <span className={styles.infoValue}>{currentUser?.personnel_number}</span>
                  </div>

                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Дата рождения:</span>
                    <span className={styles.infoValue}>{formatDate(currentUser?.birth_date)}</span>
                  </div>

                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Местоположение:</span>
                    <span className={styles.infoValue}>{currentUser?.location || "Не указано"}</span>
                  </div>

                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Организация:</span>
                    <span className={styles.infoValue}>{currentUser?.organization}</span>
                  </div>

                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Подразделение:</span>
                    <span className={styles.infoValue}>{currentUser?.department}</span>
                  </div>
                </div>

                <div className={styles.profileSection}>
                  <h4 className={styles.sectionTitle}>Контактная информация</h4>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Рабочий телефон:</span>
                    <div className={styles.infoValueWithCopy}>
                      <span className={styles.infoValue}>{formatPhoneNumber(currentUser?.work_phone)}</span>
                      {currentUser?.work_phone && (
                        <button
                          className={styles.copyButton}
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

                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Электронная почта:</span>
                    <div className={styles.infoValueWithCopy}>
                      {isEditing ? (
                        <div className={styles.inputContainer}>
                          <input
                            type="email"
                            name="email"
                            value={editableFields.email}
                            onChange={handleFieldChange}
                            className={styles.editInput}
                            style={{
                              boxShadow:
                                showExitWarning && changedFields.email ? "0 0 0 2px rgba(238, 107, 12, 0.3)" : "none",
                            }}
                          />
                        </div>
                      ) : (
                        <span
                          className={styles.clickableValue}
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
                          className={styles.copyButton}
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

                <div className={styles.profileSection}>
                  <h4 className={styles.sectionTitle}>О себе</h4>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Мои интересы:</span>
                    <div className={styles.infoValueWithCopy}>
                      {isEditing ? (
                        <div className={styles.interestsContainer}>
                          <input
                            type="text"
                            name="interests1"
                            value={editableFields.interests1 || ""}
                            onChange={handleFieldChange}
                            placeholder="Интерес 1"
                            className={styles.editInput}
                            style={{
                              marginBottom: "8px",
                              boxShadow:
                                showExitWarning && changedFields.interests1
                                  ? "0 0 0 2px rgba(238, 107, 12, 0.3)"
                                  : "none",
                            }}
                          />
                          <input
                            type="text"
                            name="interests2"
                            value={editableFields.interests2 || ""}
                            onChange={handleFieldChange}
                            placeholder="Интерес 2"
                            className={styles.editInput}
                            style={{
                              marginBottom: "8px",
                              boxShadow:
                                showExitWarning && changedFields.interests2
                                  ? "0 0 0 2px rgba(238, 107, 12, 0.3)"
                                  : "none",
                            }}
                          />
                          <input
                            type="text"
                            name="interests3"
                            value={editableFields.interests3 || ""}
                            onChange={handleFieldChange}
                            placeholder="Интерес 3"
                            className={styles.editInput}
                            style={{
                              boxShadow:
                                showExitWarning && changedFields.interests3
                                  ? "0 0 0 2px rgba(238, 107, 12, 0.3)"
                                  : "none",
                            }}
                          />
                        </div>
                      ) : (
                        <div className={styles.interestsList}>
                          {currentUser?.interests1 && (
                            <div className={styles.interestItem}>{currentUser.interests1}</div>
                          )}
                          {currentUser?.interests2 && (
                            <div className={styles.interestItem}>{currentUser.interests2}</div>
                          )}
                          {currentUser?.interests3 && (
                            <div className={styles.interestItem}>{currentUser.interests3}</div>
                          )}
                          {!currentUser?.interests1 && !currentUser?.interests2 && !currentUser?.interests3 && (
                            <span className={styles.infoValue}>Не указаны</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Мои проекты:</span>
                    <div className={styles.infoValueWithCopy}>
                      {isEditing ? (
                        <div className={styles.interestsContainer}>
                          <input
                            type="text"
                            name="projects1"
                            value={editableFields.projects1 || ""}
                            onChange={handleFieldChange}
                            placeholder="Проект 1"
                            className={styles.editInput}
                            style={{
                              marginBottom: "8px",
                              boxShadow:
                                showExitWarning && changedFields.projects1
                                  ? "0 0 0 2px rgba(238, 107, 12, 0.3)"
                                  : "none",
                            }}
                          />
                          <input
                            type="text"
                            name="projects2"
                            value={editableFields.projects2 || ""}
                            onChange={handleFieldChange}
                            placeholder="Проект 2"
                            className={styles.editInput}
                            style={{
                              marginBottom: "8px",
                              boxShadow:
                                showExitWarning && changedFields.projects2
                                  ? "0 0 0 2px rgba(238, 107, 12, 0.3)"
                                  : "none",
                            }}
                          />
                          <input
                            type="text"
                            name="projects3"
                            value={editableFields.projects3 || ""}
                            onChange={handleFieldChange}
                            placeholder="Проект 3"
                            className={styles.editInput}
                            style={{
                              boxShadow:
                                showExitWarning && changedFields.projects3
                                  ? "0 0 0 2px rgba(238, 107, 12, 0.3)"
                                  : "none",
                            }}
                          />
                        </div>
                      ) : (
                        <div className={styles.interestsList}>
                          {currentUser?.projects1 && <div className={styles.interestItem}>{currentUser.projects1}</div>}
                          {currentUser?.projects2 && <div className={styles.interestItem}>{currentUser.projects2}</div>}
                          {currentUser?.projects3 && <div className={styles.interestItem}>{currentUser.projects3}</div>}
                          {!currentUser?.projects1 && !currentUser?.projects2 && !currentUser?.projects3 && (
                            <span className={styles.infoValue}>Не указаны</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.profileSection}>
                  <h4 className={styles.sectionTitle}>Руководитель</h4>
                  <div className={styles.infoRow}>
                    {currentUser?.manager ? (
                      <span
                        className={styles.clickableValue}
                        onClick={(e) => {
                          e.stopPropagation()
                          showManagerInfo(currentUser.manager)
                        }}
                      >
                        {currentUser.manager}
                      </span>
                    ) : (
                      <span className={styles.infoValue}>Не указан</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Кнопки действий */}
              <div className={styles.profileActions}>
                {isEditing ? (
                  <>
                    <div className={styles.warningContainer}>
                      {showExitWarning && (
                        <span className={styles.warningText}>У вас есть несохраненные изменения</span>
                      )}
                    </div>
                    <div className={styles.actionButtons}>
                      <button
                        className={styles.cancelButton}
                        onClick={showExitWarning ? confirmExit : handleCancelEditing}
                      >
                        {showExitWarning ? "Выйти без сохранения" : "Отмена"}
                      </button>
                      {showExitWarning ? (
                        <button className={styles.cancelButton} onClick={() => setShowExitWarning(false)}>
                          Вернуться к редактированию
                        </button>
                      ) : (
                        <button className={styles.saveButton} onClick={handleSaveChanges}>
                          <FontAwesomeIcon icon={faCheck} style={{ marginRight: "5px" }} />
                          Сохранить
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <button
                    className={styles.logoutButton}
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
      {showCopyNotification && <div className={styles.copyNotification}>{copiedText} скопирован в буфер обмена</div>}
      {showSuccessMessage && <div className={styles.successMessage}>Профиль успешно обновлен</div>}
      {showErrorMessage && <div className={styles.errorMessage}>Ошибка при обновлении профиля</div>}
    </>
  )
}

export default Header

