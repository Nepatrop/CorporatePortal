"use client"

import { useState, useRef, useEffect } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faTimes, faCamera, faLink, faCheck } from "@fortawesome/free-solid-svg-icons"

function PortalModal({ isOpen, onClose, initialData = null, onSave }) {
  console.log("PortalModal render, isOpen:", isOpen)

  // Состояния для формы
  const [portalName, setPortalName] = useState("")
  const [portalDescription, setPortalDescription] = useState("")
  const [portalUrl, setPortalUrl] = useState("")
  const [portalIcon, setPortalIcon] = useState("🔗")
  const [portalIconFile, setPortalIconFile] = useState(null)
  const [portalIconPreview, setPortalIconPreview] = useState(null)
  const [validationError, setValidationError] = useState({
    name: false,
    url: false,
  })
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showExitWarning, setShowExitWarning] = useState(false)

  const fileInputRef = useRef(null)

  // Инициализация формы при открытии
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Режим редактирования
        setPortalName(initialData.name || "")
        setPortalDescription(initialData.description || "")
        setPortalUrl(initialData.url || "")
        setPortalIcon(initialData.icon || "🔗")
        setPortalIconPreview(initialData.iconPreview || null)
      } else {
        // Режим создания
        resetForm()
      }
      setHasUnsavedChanges(false)
    }
  }, [isOpen, initialData])

  // Блокировка прокрутки при открытом модальном окне
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isOpen])

  // Сброс формы
  const resetForm = () => {
    setPortalName("")
    setPortalDescription("")
    setPortalUrl("")
    setPortalIcon("🔗")
    setPortalIconFile(null)
    setPortalIconPreview(null)
    setValidationError({
      name: false,
      url: false,
    })
  }

  // Обработчик изменения полей
  const handleFieldChange = (e, field) => {
    const value = e.target.value
    switch (field) {
      case "name":
        setPortalName(value)
        setValidationError((prev) => ({ ...prev, name: false }))
        break
      case "description":
        setPortalDescription(value)
        break
      case "url":
        setPortalUrl(value)
        setValidationError((prev) => ({ ...prev, url: false }))
        break
    }
    setHasUnsavedChanges(true)
  }

  // Обработчик изменения иконки
  const handleIconChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPortalIconFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPortalIconPreview(reader.result)
      }
      reader.readAsDataURL(file)
      setHasUnsavedChanges(true)
    }
  }

  // Обработчик закрытия модального окна
  const handleCloseModal = (e) => {
    if (e) {
      e.stopPropagation()
    }
    if (hasUnsavedChanges) {
      setShowExitWarning(true)
    } else {
      onClose()
    }
  }

  // Обработчик клика на оверлей
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCloseModal()
    }
  }

  // Подтверждение выхода без сохранения
  const confirmExit = () => {
    setShowExitWarning(false)
    onClose()
  }

  // Валидация формы
  const validateForm = () => {
    const errors = {
      name: !portalName.trim(),
      url: !portalUrl.trim(),
    }
    setValidationError(errors)
    return !errors.name && !errors.url
  }

  // Обработчик сохранения
  const handleSave = async () => {
    if (!validateForm()) {
      return
    }

    try {
      const portalData = {
        name: portalName.trim(),
        description: portalDescription.trim(),
        url: portalUrl.trim(),
        icon_emoji: portalIcon,
      }

      // Если есть файл иконки, добавляем его в данные
      if (portalIconFile) {
        const reader = new FileReader()
        const base64Data = await new Promise((resolve) => {
          reader.onloadend = () => {
            const base64String = reader.result.split(",")[1]
            resolve(base64String)
          }
          reader.readAsDataURL(portalIconFile)
        })

        portalData.icon_data = base64Data
        portalData.icon_type = portalIconFile.type
      }

      onSave(portalData)
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error("Error saving portal:", error)
    }
  }

  // Если модальное окно закрыто, не рендерим ничего
  if (!isOpen) {
    return null
  }

  // Используем максимально простую структуру из PortalModalSimple.js
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1100,
      }}
      onClick={handleOverlayClick}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          width: "45%",
          maxWidth: "600px",
          maxHeight: "80vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
          <h2 style={{ margin: 0 }}>{initialData ? "Редактирование портала" : "Создание нового портала"}</h2>
          <button
            onClick={handleCloseModal}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px" }}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {showExitWarning ? (
          <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#fff3cd", borderRadius: "5px" }}>
            <div style={{ marginBottom: "15px" }}>
              <p style={{ margin: 0 }}>У вас есть несохраненные изменения. Вы уверены, что хотите выйти?</p>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => setShowExitWarning(false)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "20px",
                  cursor: "pointer",
                }}
              >
                Вернуться к редактированию
              </button>
              <button
                onClick={confirmExit}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "20px",
                  cursor: "pointer",
                }}
              >
                Выйти без сохранения
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Блок с иконкой */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
              <div
                onClick={() => fileInputRef.current.click()}
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  backgroundColor: "#f0f0f0",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  position: "relative",
                  cursor: "pointer",
                  overflow: "hidden",
                }}
              >
                {portalIconPreview ? (
                  <img
                    src={portalIconPreview || "/placeholder.svg"}
                    alt="Иконка портала"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span style={{ fontSize: "32px" }}>{portalIcon}</span>
                )}
                {initialData && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: "rgba(0, 0, 0, 0.5)",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      opacity: 0,
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.opacity = 1)}
                    onMouseOut={(e) => (e.currentTarget.style.opacity = 0)}
                  >
                    <FontAwesomeIcon icon={faCamera} style={{ color: "white", fontSize: "24px" }} />
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleIconChange}
                style={{ display: "none" }}
                accept="image/*"
              />
            </div>

            {/* Поля формы */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Название портала*</label>
                <input
                  type="text"
                  value={portalName}
                  onChange={(e) => handleFieldChange(e, "name")}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: validationError.name ? "1px solid #dc3545" : "1px solid #ced4da",
                    borderRadius: "4px",
                  }}
                  placeholder="Введите название портала"
                />
                {validationError.name && (
                  <p style={{ color: "#dc3545", fontSize: "14px", margin: "5px 0 0" }}>Название портала обязательно</p>
                )}
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Описание</label>
                <textarea
                  value={portalDescription}
                  onChange={(e) => handleFieldChange(e, "description")}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #ced4da",
                    borderRadius: "4px",
                    minHeight: "80px",
                    resize: "vertical",
                  }}
                  placeholder="Введите описание портала"
                  rows={3}
                />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Ссылка*</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}>
                    <FontAwesomeIcon icon={faLink} style={{ color: "#6c757d" }} />
                  </span>
                  <input
                    type="url"
                    value={portalUrl}
                    onChange={(e) => handleFieldChange(e, "url")}
                    style={{
                      width: "100%",
                      padding: "8px 12px 8px 35px",
                      border: validationError.url ? "1px solid #dc3545" : "1px solid #ced4da",
                      borderRadius: "4px",
                    }}
                    placeholder="https://example.com"
                  />
                </div>
                {validationError.url && (
                  <p style={{ color: "#dc3545", fontSize: "14px", margin: "5px 0 0" }}>Ссылка обязательна</p>
                )}
              </div>
            </div>

            {/* Кнопки действий */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
              <button
                onClick={handleCloseModal}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "20px",
                  cursor: "pointer",
                }}
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#ee6b0c",
                  color: "white",
                  border: "none",
                  borderRadius: "20px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <FontAwesomeIcon icon={faCheck} />
                {initialData ? "Сохранить" : "Создать"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default PortalModal
