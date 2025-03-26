"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useUser } from "../context/UserContext" // Импортируем useUser
import { api } from "../utils/api"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faUser,
  faCopy,
  faChevronRight,
  faEdit,
  faTrash,
  faThumbtack,
  faTimes,
  faCamera,
  faLink,
} from "@fortawesome/free-solid-svg-icons"

// Компонент Comment
function Comment({ comment }) {
  return (
    <div style={styles.comment}>
      <img src={comment.avatar || "/placeholder.svg"} alt={comment.author} style={styles.avatar} />
      <div style={styles.commentContent}>
        <strong style={styles.userName}>{comment.author}</strong>
        <p style={styles.commentText}>{comment.text}</p>
      </div>
    </div>
  )
}

// Добавляем функцию форматирования времени
const formatDateTime = (utcDateString) => {
  try {
    if (!utcDateString) return ""

    // Строка приходит в формате ISO 8601 с UTC
    const date = new Date(utcDateString)
    if (isNaN(date.getTime())) {
      console.error("Invalid date string:", utcDateString)
      return utcDateString
    }

    // Форматируем в локальное время
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date)
  } catch (error) {
    console.error("Error formatting date:", error, "for string:", utcDateString)
    return utcDateString
  }
}

// Компонент NewsItem
function NewsItem({ news, onLike, onAddComment, onEdit, onDelete, onPin, isAdmin }) {
  const [commentText, setCommentText] = useState("")
  const comments = news.comments || []

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (commentText.trim()) {
      await onAddComment(news.id, commentText)
      setCommentText("")
    }
  }

  return (
    <div
      style={{
        ...styles.newsItem,
        ...(news.isPinned ? styles.pinnedNewsItem : {}),
      }}
    >
      {news.isPinned && (
        <div style={styles.pinnedIndicator}>
          <FontAwesomeIcon icon={faThumbtack} style={styles.pinnedIcon} />
          <span>Закрепленная новость</span>
        </div>
      )}

      <div style={styles.authorInfo}>
        <div style={styles.authorInfoContainer}>
          <div style={styles.authorAvatar}>
            <FontAwesomeIcon icon={faUser} style={{ fontSize: "24px", color: "#13454B" }} />
          </div>
          <div style={styles.authorDetails}>
            <strong style={styles.authorName}>{news.isAdminPost ? "Администрация" : news.author_name}</strong>
            <span style={styles.newsTime}>{formatDateTime(news.publication_time)}</span>
          </div>
        </div>

        {isAdmin && (
          <div style={styles.adminActions}>
            <button
              onClick={() => onPin(news.id, !news.isPinned)}
              style={styles.adminActionButton}
              title={news.isPinned ? "Открепить новость" : "Закрепить новость"}
            >
              <FontAwesomeIcon
                icon={news.isPinned ? faTimes : faThumbtack}
                style={{
                  ...styles.adminActionIcon,
                  color: news.isPinned ? "#EE6B0C" : "#13454B",
                }}
              />
            </button>
            <button onClick={() => onEdit(news)} style={styles.adminActionButton} title="Редактировать новость">
              <FontAwesomeIcon icon={faEdit} style={styles.adminActionIcon} />
            </button>
            <button onClick={() => onDelete(news.id)} style={styles.adminActionButton} title="Удалить новость">
              <FontAwesomeIcon icon={faTrash} style={styles.adminActionIcon} />
            </button>
          </div>
        )}
      </div>

      <h3 style={styles.newsTitle}>{news.title}</h3>
      <p style={styles.newsDescription}>{news.content}</p>

      {news.image_data && news.image_type && (
        <img
          src={`data:${news.image_type};base64,${news.image_data}`}
          alt={news.title}
          style={styles.newsImage}
          onError={(e) => {
            console.error("Image loading error:", e)
            e.target.style.display = "none"
          }}
        />
      )}

      <div style={styles.newsFooter}>
        <button
          onClick={() => onLike(news.id)}
          style={styles.likeButton}
          aria-label={news.liked ? "Убрать лайк" : "Поставить лайк"}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill={news.liked ? "#EE6B0C" : "none"}
            stroke="#13454B"
            strokeWidth="2"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <span style={styles.likeCount}>{news.likes_count}</span>
        </button>
      </div>

      <div style={styles.commentsSection}>
        <h4 style={styles.commentsHeader}>Комментарии ({news.comments?.length || 0})</h4>

        {comments.map((comment, index) => (
          <Comment key={index} comment={comment} />
        ))}

        <form onSubmit={handleSubmitComment} style={styles.commentForm}>
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Написать комментарий..."
            style={styles.commentInput}
          />
          <button type="submit" style={styles.commentSubmit}>
            Отправить
          </button>
        </form>
      </div>
    </div>
  )
}

// Компонент для добавления/редактирования новости
function AddNewsForm({ onAddNews, editingNews, setEditingNews, isAdmin }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [validationError, setValidationError] = useState(false)
  const fileInputRef = useRef(null)
  const { currentUser } = useUser()

  // Инициализация формы при редактировании
  useEffect(() => {
    if (editingNews) {
      setIsExpanded(true)
      setTitle(editingNews.title || "")
      setDescription(editingNews.content || "")

      // Если у новости есть изображение, устанавливаем предпросмотр
      if (editingNews.image_data && editingNews.image_type) {
        setImagePreview(`data:${editingNews.image_type};base64,${editingNews.image_data}`)
      } else {
        setImagePreview(null)
      }
    }
  }, [editingNews])

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) {
      setValidationError(true)
      return
    }

    try {
      const formData = new FormData()
      formData.append("title", title)
      formData.append("content", description)

      // Если это новая новость, добавляем ID автора
      if (!editingNews) {
        formData.append("author_id", currentUser.id.toString())
        // Если публикует админ, добавляем флаг
        if (isAdmin) {
          formData.append("isAdminPost", "true")
        }
      }

      if (image) {
        // Получаем содержимое файла как ArrayBuffer
        const imageBuffer = await image.arrayBuffer()
        // Создаем Blob из ArrayBuffer
        const imageBlob = new Blob([imageBuffer], { type: image.type })
        formData.append("image_data", imageBlob, image.name)
        formData.append("image_type", image.type)
      }

      let response

      if (editingNews) {
        // Обновляем существующую новость
        response = await api.putFormData(`/api/news/${editingNews.id}`, formData)
      } else {
        // Создаем новую новость
        response = await api.postFormData("/api/news", formData)
      }

      if (response.ok) {
        const newsData = await response.json()
        onAddNews(newsData)
        resetForm()

        // Если редактировали новость, сбрасываем режим редактирования
        if (editingNews) {
          setEditingNews(null)
        }
      } else {
        const errorText = await response.text()
        console.error("Error response:", errorText)
      }
    } catch (error) {
      console.error("Error creating/updating news:", error)
    }
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setImage(null)
    setImagePreview(null)
    setValidationError(false)
    setIsExpanded(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleInputClick = () => {
    if (!isExpanded) {
      setIsExpanded(true)
    }
  }

  const handleAttachClick = (e) => {
    e.preventDefault()
    fileInputRef.current.click()
  }

  const handleCancel = () => {
    if (editingNews) {
      setEditingNews(null)
    }
    resetForm()
  }

  return (
    <div style={styles.addNewsFormContainer}>
      <form onSubmit={handleSubmit} style={styles.addNewsForm}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onClick={handleInputClick}
          placeholder={isExpanded ? "Заголовок новости" : "Что у вас нового?"}
          style={{
            ...styles.addNewsInput,
            borderColor: validationError && !title.trim() ? colors.secondary : "#e0e0e0",
          }}
        />

        {(isExpanded || editingNews) && (
          <>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Текст новости..."
              style={{
                ...styles.addNewsTextarea,
                borderColor: validationError && !description.trim() ? colors.secondary : "#e0e0e0",
              }}
              rows={3}
            />

            {validationError && (!title.trim() || !description.trim()) && (
              <p style={styles.validationError}>Не все поля заполнены</p>
            )}

            <div style={styles.addNewsActions}>
              <div style={styles.attachmentContainer}>
                <button onClick={handleAttachClick} style={styles.attachButton} type="button">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                  </svg>
                  <span style={styles.attachText}>Прикрепить файл</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  style={styles.fileInput}
                  accept="image/*"
                />
              </div>

              <div style={styles.formButtons}>
                <button type="button" onClick={handleCancel} style={styles.cancelButton}>
                  Отмена
                </button>
                <button type="submit" style={styles.publishButton}>
                  {editingNews ? "Сохранить" : "Опубликовать"}
                </button>
              </div>
            </div>

            {imagePreview && (
              <div style={styles.imagePreviewContainer}>
                <img src={imagePreview || "/placeholder.svg"} alt="Предпросмотр" style={styles.imagePreview} />
                <button
                  type="button"
                  onClick={() => {
                    setImage(null)
                    setImagePreview(null)
                    if (fileInputRef.current) fileInputRef.current.value = ""
                  }}
                  style={styles.removeImageButton}
                >
                  ✕
                </button>
              </div>
            )}
          </>
        )}
      </form>
    </div>
  )
}

// Компонент для редактирования портала
function PortalEditModal({ isOpen, onClose, portal, onSave, isNewPortal = false, onExitEditMode }) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [url, setUrl] = useState("")
  const [icon, setIcon] = useState("")
  const [iconFile, setIconFile] = useState(null)
  const [iconPreview, setIconPreview] = useState(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showExitWarning, setShowExitWarning] = useState(false)
  const [validationError, setValidationError] = useState(false)
  const modalRef = useRef(null)
  const fileInputRef = useRef(null)
  const [showIconUpload, setShowIconUpload] = useState(false)

  // Инициализация формы при открытии
  useEffect(() => {
    if (isOpen && portal) {
      setName(portal.name || "")
      setDescription(portal.description || "")
      setUrl(portal.url || "")
      setIcon(portal.icon || "")
      setIconPreview(portal.iconPreview || null)
      setHasUnsavedChanges(false)
      setShowExitWarning(false)
      setValidationError(false)
    }
  }, [isOpen, portal])

  // Обработчик клика вне модального окна
  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target) && isOpen) {
        // Определяем handleCloseModal внутри эффекта, чтобы избежать проблем с зависимостями
        const handleCloseModal = () => {
          if (hasUnsavedChanges) {
            setShowExitWarning(true)
          } else {
            onClose()
            // Если это был режим редактирования, выходим из него
            if (onExitEditMode && !isNewPortal) {
              onExitEditMode()
            }
          }
        }

        handleCloseModal()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, hasUnsavedChanges, onClose, onExitEditMode, isNewPortal])

  // Добавляем этот код после существующего useEffect для handleClickOutside:
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      document.body.style.paddingRight = "15px" // Компенсация ширины скроллбара
    } else {
      document.body.style.overflow = ""
      document.body.style.paddingRight = ""
    }
    return () => {
      document.body.style.overflow = ""
      document.body.style.paddingRight = ""
    }
  }, [isOpen])

  // Обработчик закрытия модального окна
  const handleCloseModal = () => {
    if (hasUnsavedChanges) {
      setShowExitWarning(true)
    } else {
      onClose()
      // Если это был режим редактирования, выходим из него
      if (onExitEditMode && !isNewPortal) {
        onExitEditMode()
      }
    }
  }

  // Обработчик изменения полей
  const handleFieldChange = (setter, value, field) => {
    setter(value)
    setHasUnsavedChanges(true)
    setValidationError(false)
  }

  // Обработчик изменения иконки
  const handleIconChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setIconFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setIconPreview(reader.result)
        setHasUnsavedChanges(true)
      }
      reader.readAsDataURL(file)
    }
  }

  // Обработчик сохранения изменений
  const handleSave = () => {
    // Проверка на заполнение обязательных полей
    if (!name.trim()) {
      setValidationError(true)
      return
    }

    const updatedPortal = {
      ...portal,
      name,
      description,
      url,
      icon: iconFile ? null : icon, // Если загружен файл, то текстовую иконку не используем
      iconFile,
      iconPreview,
    }

    onSave(updatedPortal, isNewPortal)
    onClose()
  }

  // Обработчик подтверждения выхода без сохранения
  const confirmExit = () => {
    setShowExitWarning(false)
    onClose()
  }

  return isOpen ? (
    <div style={styles.modalOverlay}>
      <div style={styles.portalModal} ref={modalRef}>
        <div style={styles.portalModalHeader}>
          <h2 style={styles.portalModalTitle}>{isNewPortal ? "Добавление портала" : "Редактирование портала"}</h2>
          <button style={styles.closeButton} onClick={handleCloseModal}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div style={styles.portalModalContent}>
          {/* Блок с иконкой */}
          <div style={styles.portalIconEditContainer}>
            <div
              style={styles.portalIconEdit}
              onMouseEnter={() => setShowIconUpload(true)}
              onMouseLeave={() => setShowIconUpload(false)}
              onClick={() => fileInputRef.current.click()}
            >
              {iconPreview ? (
                <img src={iconPreview || "/placeholder.svg"} alt="Иконка портала" style={styles.portalIconImage} />
              ) : icon ? (
                <span style={styles.portalIconEmoji}>{icon}</span>
              ) : (
                <span style={styles.portalIconPlaceholder}>🔗</span>
              )}

              <div
                style={{
                  ...styles.photoUploadOverlay,
                  opacity: showIconUpload ? 1 : 0,
                }}
              >
                <FontAwesomeIcon icon={faCamera} style={styles.cameraIcon} />
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleIconChange}
              style={{ display: "none" }}
              accept="image/*"
            />
            {!iconPreview && (
              <div style={styles.emojiSelector}>
                <p style={styles.emojiLabel}>Или выберите эмодзи:</p>
                <div style={styles.emojiGrid}>
                  {["🔗", "📚", "👥", "🖥️", "📄", "🎓", "📊", "📱", "🔍", "📝"].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setIcon(emoji)
                        setIconPreview(null)
                        setIconFile(null)
                        setHasUnsavedChanges(true)
                      }}
                      style={{
                        ...styles.emojiButton,
                        backgroundColor: icon === emoji ? "#f0f0f0" : "transparent",
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Поля формы */}
          <div style={styles.portalFormFields}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Название портала*</label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleFieldChange(setName, e.target.value, "name")}
                style={{
                  ...styles.formInput,
                  borderColor: validationError && !name.trim() ? colors.secondary : "#e0e0e0",
                }}
                placeholder="Введите название портала"
              />
              {validationError && !name.trim() && <p style={styles.fieldError}>Название портала обязательно</p>}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Описание</label>
              <textarea
                value={description}
                onChange={(e) => handleFieldChange(setDescription, e.target.value, "description")}
                style={styles.formTextarea}
                placeholder="Введите описание портала"
                rows={3}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Ссылка</label>
              <div style={styles.urlInputContainer}>
                <FontAwesomeIcon icon={faLink} style={styles.urlIcon} />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => handleFieldChange(setUrl, e.target.value, "url")}
                  style={styles.urlInput}
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>

          {/* Кнопки действий */}
          <div style={styles.portalModalActions}>
            {showExitWarning ? (
              <>
                <div style={styles.warningContainer}>
                  <span style={styles.warningText}>У вас есть несохраненные изменения</span>
                </div>
                <div style={styles.actionButtons}>
                  <button style={styles.cancelButton} onClick={confirmExit}>
                    Выйти без сохранения
                  </button>
                  <button style={styles.cancelButton} onClick={() => setShowExitWarning(false)}>
                    Вернуться к редактированию
                  </button>
                </div>
              </>
            ) : (
              <div style={styles.actionButtons}>
                <button style={styles.cancelButton} onClick={handleCloseModal}>
                  Отмена
                </button>
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
                  onClick={handleSave}
                >
                  {isNewPortal ? "Добавить" : "Сохранить"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  ) : null
}

// Компонент Event
function Event({ event }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  const handleRegister = (e) => {
    e.stopPropagation()
    setIsRegistered(!isRegistered)
    // Здесь будет логика для регистрации на мероприятие
  }

  return (
    <div style={styles.eventItem}>
      <div style={styles.eventHeader} onClick={toggleExpand}>
        <div style={styles.eventInfo}>
          <h3 style={styles.eventTitle}>{event.title}</h3>
          <p style={styles.eventShortDescription}>{event.shortDescription}</p>
        </div>
        <div style={styles.eventActions}>
          <button
            style={isRegistered ? styles.registeredButton : styles.registerButton}
            onClick={handleRegister}
            onMouseOver={(e) => {
              if (!isRegistered) {
                e.currentTarget.style.backgroundColor = "#EE6B0C"
                e.currentTarget.style.color = "#FFFFFF"
              }
            }}
            onMouseOut={(e) => {
              if (!isRegistered) {
                e.currentTarget.style.backgroundColor = "#FFFFFF"
                e.currentTarget.style.color = "#EE6B0C"
              }
            }}
          >
            {isRegistered ? "Отменить" : "Записаться"}
          </button>
          <FontAwesomeIcon
            icon={faChevronRight}
            style={{
              ...styles.expandIcon,
              transform: isExpanded ? "rotate(90deg)" : "none",
              transition: "transform 0.3s ease",
            }}
          />
        </div>
      </div>

      {isExpanded && (
        <div style={styles.eventDetails}>
          <p style={styles.eventFullDescription}>{event.fullDescription}</p>

          <div style={styles.eventMetadata}>
            <div style={styles.eventMetaItem}>
              <span style={styles.eventMetaLabel}>Свободных мест:</span>
              <span style={styles.eventMetaValue}>
                {event.availableSeats} из {event.totalSeats}
              </span>
            </div>
            <div style={styles.eventMetaItem}>
              <span style={styles.eventMetaLabel}>Дата:</span>
              <span style={styles.eventMetaValue}>{event.date}</span>
            </div>
            <div style={styles.eventMetaItem}>
              <span style={styles.eventMetaLabel}>Время:</span>
              <span style={styles.eventMetaValue}>{event.time}</span>
            </div>
            <div style={styles.eventMetaItem}>
              <span style={styles.eventMetaLabel}>Место:</span>
              <span style={styles.eventMetaValue}>{event.location}</span>
            </div>
          </div>

          <div style={styles.speakersSection}>
            <h4 style={styles.speakersTitle}>Спикеры:</h4>
            <div style={styles.speakersList}>
              {event.speakers.map((speaker) => (
                <div key={speaker.id} style={styles.speakerItem}>
                  <div style={styles.speakerAvatar}>
                    {speaker.photo ? (
                      <img src={speaker.photo || "/placeholder.svg"} alt={speaker.name} style={styles.speakerPhoto} />
                    ) : (
                      <FontAwesomeIcon icon={faUser} style={{ fontSize: "24px", color: "#13454B" }} />
                    )}
                  </div>
                  <div style={styles.speakerInfo}>
                    <p style={styles.speakerName}>{speaker.name}</p>
                    <p style={styles.speakerPosition}>{speaker.position}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Основной компонент MainContent
function MainContent() {
  const [news, setNews] = useState([])
  const { currentUser, isAdmin } = useUser() // Получаем информацию о роли пользователя
  const [selectedBirthday, setSelectedBirthday] = useState(null)
  const [expandedBirthday, setExpandedBirthday] = useState(null)
  const [showCopyNotification, setShowCopyNotification] = useState(false)
  const [copiedText, setCopiedText] = useState("")
  const [editingNews, setEditingNews] = useState(null) // Состояние для редактирования
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null) // ID новости для подтверждения удаления

  // Состояния для управления порталами
  const [portals, setPortals] = useState([])
  const [editingPortal, setEditingPortal] = useState(null)
  const [isPortalModalOpen, setIsPortalModalOpen] = useState(false)
  const [isNewPortal, setIsNewPortal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [showPortalMenu, setShowPortalMenu] = useState(false)

  // Загрузка новостей
  const loadNews = useCallback(async () => {
    try {
      const newsData = await api.get(`/api/news?current_user_id=${currentUser.id}`)
      const newsWithDefaults = newsData.map((item) => ({
        ...item,
        author: item.author_name,
        description: item.content,
        comments: item.comments || [],
        likes_count: item.likes_count || 0,
        liked: item.liked || false,
        isPinned: item.isPinned || false,
        isAdminPost: item.isAdminPost || false,
        // Время приходит в UTC, так и оставляем его в UTC
        publication_time: item.publication_time,
      }))

      // Сортируем новости: сначала закрепленные, потом по дате (от новых к старым)
      const sortedNews = newsWithDefaults.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1
        if (!a.isPinned && b.isPinned) return 1
        return new Date(b.publication_time) - new Date(a.publication_time)
      })

      setNews(sortedNews)
    } catch (error) {
      console.error("Error fetching news:", error)
    }
  }, [currentUser.id])

  // Инициализация порталов
  useEffect(() => {
    // В реальном приложении здесь будет загрузка порталов с сервера
    setPortals([
      {
        id: 1,
        name: "HR Портал",
        url: "#",
        description:
          "Централизованная платформа для управления кадровыми процессами, включая отпуска, зарплату и персональные данные сотрудников.",
        icon: "👥",
      },
      {
        id: 2,
        name: "База знаний",
        url: "#",
        description:
          "Репозиторий с полезной информацией, руководствами и часто задаваемыми вопросами для быстрого доступа к знаниям компании.",
        icon: "📚",
      },
      {
        id: 3,
        name: "IT Поддержка",
        url: "#",
        description:
          "Система для запроса технической помощи, устранения неполадок и получения консультаций по ИТ-вопросам.",
        icon: "🖥️",
      },
      {
        id: 4,
        name: "Документация",
        url: "#",
        description:
          "Хранилище корпоративных документов, политик и процедур для обеспечения прозрачности и соответствия стандартам.",
        icon: "📄",
      },
      {
        id: 5,
        name: "Обучение",
        url: "#",
        description:
          "Платформа для профессионального развития, предлагающая курсы, тренинги и материалы для повышения квалификации сотрудников.",
        icon: "🎓",
      },
    ])
  }, [])

  useEffect(() => {
    loadNews()
  }, [loadNews])

  const handleLike = async (newsId) => {
    try {
      const response = await api.post(`/api/news/${Number.parseInt(newsId)}/like`, {
        employee_id: Number.parseInt(currentUser.id),
      })

      if (response.ok) {
        const data = await response.json()
        setNews((prevNews) =>
          prevNews.map((item) => {
            if (item.id === newsId) {
              return {
                ...item,
                likes_count: data.action === "liked" ? item.likes_count + 1 : item.likes_count - 1,
                liked: data.action === "liked",
              }
            }
            return item
          }),
        )
      }
    } catch (error) {
      console.error("Error liking news:", error)
    }
  }

  const handleAddComment = async (newsId, text) => {
    try {
      console.log("Sending comment:", { newsId, text, employee_id: currentUser.id }) // Добавляем логирование

      const response = await api.post(`/api/news/${newsId}/comments`, {
        employee_id: currentUser.id,
        text: text,
      })

      if (response.ok) {
        const newComment = await response.json()
        console.log("New comment response:", newComment) // Добавляем логирование
        setNews((prevNews) =>
          prevNews.map((item) => {
            if (item.id === newsId) {
              return {
                ...item,
                comments: [...(item.comments || []), newComment],
              }
            }
            return item
          }),
        )
      } else {
        const errorText = await response.text()
        console.error("Comment error response:", errorText)
      }
    } catch (error) {
      console.error("Error adding comment:", error)
    }
  }

  // Функция для редактирования новости
  const handleEditNews = (newsItem) => {
    setEditingNews(newsItem)
    // Прокручиваем страницу к форме редактирования
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  // Функция для удаления новости
  const handleDeleteNews = async (newsId) => {
    if (showDeleteConfirm === newsId) {
      try {
        const response = await api.delete(`/api/news/${newsId}`)
        if (response.ok) {
          // Удаляем новость из состояния
          setNews((prevNews) => prevNews.filter((item) => item.id !== newsId))
          setShowDeleteConfirm(null)
        } else {
          console.error("Error deleting news")
        }
      } catch (error) {
        console.error("Error deleting news:", error)
      }
    } else {
      // Показываем подтверждение удаления
      setShowDeleteConfirm(newsId)
    }
  }

  // Функция для закрепления/открепления новости
  const handlePinNews = async (newsId, isPinned) => {
    try {
      const response = await api.post(`/api/news/${newsId}/pin`, {
        isPinned: isPinned,
      })

      if (response.ok) {
        // Обновляем состояние новостей
        setNews((prevNews) =>
          prevNews
            .map((item) => (item.id === newsId ? { ...item, isPinned: isPinned } : item))
            .sort((a, b) => {
              if (a.isPinned && !b.isPinned) return -1
              if (!a.isPinned && b.isPinned) return 1
              return new Date(b.publication_time) - new Date(a.publication_time)
            }),
        )
      } else {
        console.error("Error pinning news")
      }
    } catch (error) {
      console.error("Error pinning news:", error)
    }
  }

  // Функция для редактирования портала (помечаем как eslint-disable-next-line, так как она используется в JSX)
  // eslint-disable-next-line no-unused-vars
  const handleEditPortal = (portal) => {
    setEditingPortal(portal)
    setIsNewPortal(false)
    setIsPortalModalOpen(true)
  }

  // Функция для добавления нового портала (помечаем как eslint-disable-next-line, так как она используется в JSX)
  // eslint-disable-next-line no-unused-vars
  const handleAddPortal = () => {
    setEditingPortal({
      id: Date.now(), // Временный ID для нового портала
      name: "",
      description: "",
      url: "#",
      icon: "🔗",
    })
    setIsNewPortal(true)
    setIsPortalModalOpen(true)
  }

  // Функция для сохранения изменений портала
  const handleSavePortal = (updatedPortal, isNew) => {
    if (isNew) {
      // Добавляем новый портал в конец списка
      setPortals((prevPortals) => [...prevPortals, updatedPortal])
    } else {
      // Обновляем существующий портал
      setPortals((prevPortals) =>
        prevPortals.map((portal) => (portal.id === updatedPortal.id ? updatedPortal : portal)),
      )
    }
  }

  const birthdays = [
    {
      id: 1,
      name: "Иван Иванов",
      date: "15 мая 2023",
      department: "Отдел разработки",
      photo: null,
      position: "Разработчик",
      location: "Москва",
      organization: "ИТ-Элемент29",
      personnel_number: "0000-00001",
      phone: "+79160000000",
      email: "ivan.ivanov@example.com",
    },
    {
      id: 2,
      name: "Мария Петрова",
      date: "20 мая 2023",
      department: "Бухгалтерия",
      photo: null,
      position: "Бухгалтер",
      location: "Санкт-Петербург",
      organization: "ИТ-Элемент29",
      personnel_number: "0000-00002",
      phone: "+79210000000",
      email: "maria.petrova@example.com",
    },
  ]

  const events = [
    {
      id: 1,
      title: "Тренинг по кибербезопасности",
      shortDescription: "Основы защиты корпоративных данных и личной информации",
      fullDescription:
        "Интерактивный тренинг, посвященный современным угрозам кибербезопасности и методам защиты от них. Участники узнают о фишинге, социальной инженерии и базовых принципах безопасной работы с данными.",
      date: "25 мая 2023",
      time: "14:00 - 16:30",
      location: "Конференц-зал А, 3 этаж",
      duration: "2.5 часа",
      totalSeats: 15,
      availableSeats: 5,
      speakers: [
        {
          id: 1,
          name: "Алексей Петров",
          position: "Руководитель отдела ИБ",
          photo: null,
        },
        {
          id: 2,
          name: "Елена Сидорова",
          position: "Специалист по защите данных",
          photo: null,
        },
      ],
    },
    {
      id: 2,
      title: "Семинар по проектному управлению",
      shortDescription: "Agile и Scrum методологии для эффективной работы команды",
      fullDescription:
        "Практический семинар по внедрению гибких методологий в рабочие процессы. Будут рассмотрены основные принципы Agile, роли в Scrum и практические инструменты для повышения эффективности командной работы.",
      date: "30 мая 2023",
      time: "10:00 - 13:00",
      location: "Конференц-зал Б, 2 этаж",
      duration: "3 часа",
      totalSeats: 20,
      availableSeats: 10,
      speakers: [
        {
          id: 3,
          name: "Михаил Иванов",
          position: "Scrum-мастер",
          photo: null,
        },
      ],
    },
  ]

  const handleAddNews = async (newNews) => {
    await loadNews()
  }

  // Добавим функцию для отображения информации о сотруднике (помечаем как eslint-disable-next-line, так как она используется в JSX)
  // eslint-disable-next-line no-unused-vars
  const handleBirthdayClick = (person, event) => {
    if (selectedBirthday === person.id) {
      setSelectedBirthday(null)
    } else {
      setSelectedBirthday(person.id)
      // Удаляем строки с setBirthdayPopupPosition, так как эта переменная не используется
    }
  }

  // eslint-disable-next-line no-unused-vars
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      // Можно добавить уведомление о копировании
      console.log(`${label} скопирован в буфер обмена`)
    })
  }

  // Функция для переключения раскрытия информации о сотруднике
  const toggleBirthdayDetails = (personId) => {
    if (expandedBirthday === personId) {
      setExpandedBirthday(null)
    } else {
      setExpandedBirthday(personId)
    }
  }

  // Функция для копирования текста
  const copyToClipboardHandler = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(label)
      setShowCopyNotification(true)
      setTimeout(() => {
        setShowCopyNotification(false)
      }, 2000)
    })
  }

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

  // Добавим CSS для подчеркивания имени при наведении
  return (
    <main style={styles.main}>
      <style>
        {`
      .clickable-name {
        cursor: pointer;
        transition: color 0.3s ease;
      }
    `}
      </style>
      <div style={styles.contentWrapper}>
        <div style={styles.leftColumn}>
          <div style={{ ...styles.block, ...styles.newsBlock }}>
            <h2 style={styles.heading}>Новости и статьи</h2>
            {isAdmin && (
              <AddNewsForm
                onAddNews={handleAddNews}
                editingNews={editingNews}
                setEditingNews={setEditingNews}
                isAdmin={isAdmin}
              />
            )}
            <div style={styles.newsList}>
              {news.map((item) => (
                <div key={item.id}>
                  {showDeleteConfirm === item.id && (
                    <div style={styles.deleteConfirmation}>
                      <p>Вы уверены, что хотите удалить эту новость?</p>
                      <div style={styles.deleteConfirmButtons}>
                        <button onClick={() => handleDeleteNews(item.id)} style={styles.confirmDeleteButton}>
                          Удалить
                        </button>
                        <button onClick={() => setShowDeleteConfirm(null)} style={styles.cancelDeleteButton}>
                          Отмена
                        </button>
                      </div>
                    </div>
                  )}
                  <NewsItem
                    key={item.id}
                    news={item}
                    onLike={handleLike}
                    onAddComment={handleAddComment}
                    onEdit={handleEditNews}
                    onDelete={handleDeleteNews}
                    onPin={handlePinNews}
                    isAdmin={isAdmin}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={styles.rightColumn}>
          <div style={styles.rightColumnFixed}>
            <div style={{ ...styles.block, ...styles.portalBlock }}>
              <div style={styles.portalHeader}>
                <h2 style={styles.heading}>Внутренние порталы</h2>
                {isAdmin && (
                  <div style={styles.portalAdminControls}>
                    <button
                      onClick={() => setShowPortalMenu(!showPortalMenu)}
                      style={styles.editPortalsButton}
                      title="Управление порталами"
                    >
                      <FontAwesomeIcon icon={faEdit} style={styles.editPortalsIcon} />
                    </button>
                    {showPortalMenu && (
                      <div style={styles.portalMenu}>
                        <button
                          style={styles.portalMenuItem}
                          onClick={() => {
                            setEditMode(true)
                            setShowPortalMenu(false)
                          }}
                        >
                          Редактировать существующий портал
                        </button>
                        <button
                          style={styles.portalMenuItem}
                          onClick={() => {
                            setEditingPortal({
                              id: Date.now(),
                              name: "",
                              description: "",
                              url: "#",
                              icon: "🔗",
                            })
                            setIsNewPortal(true)
                            setIsPortalModalOpen(true)
                            setShowPortalMenu(false)
                          }}
                        >
                          Создать новый портал
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {editMode && (
                <div style={styles.editModeNotification}>
                  <span>Режим редактирования. Нажмите на портал для изменения.</span>
                  <button style={styles.exitEditModeButton} onClick={() => setEditMode(false)}>
                    Выйти из режима редактирования
                  </button>
                </div>
              )}
              <div style={styles.portalGrid}>
                {portals.map((portal) => (
                  <div
                    key={portal.id}
                    style={{
                      ...styles.portalContainer,
                      ...(editMode ? styles.portalContainerEditable : {}),
                    }}
                    onClick={() => {
                      if (editMode) {
                        setEditingPortal(portal)
                        setIsNewPortal(false)
                        setIsPortalModalOpen(true)
                      }
                    }}
                  >
                    <a
                      href={portal.url}
                      style={styles.portalLink}
                      onClick={(e) => {
                        if (editMode) {
                          e.preventDefault()
                        } else {
                          e.currentTarget.querySelector(".portalName").style.color = "#EE6B0C"
                        }
                      }}
                      onMouseEnter={(e) => {
                        if (!editMode) {
                          e.currentTarget.querySelector(".portalName").style.color = "#EE6B0C"
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!editMode) {
                          e.currentTarget.querySelector(".portalName").style.color = "#000000"
                        }
                      }}
                    >
                      <div style={styles.portalContent}>
                        <div style={styles.portalIcon}>
                          {portal.iconPreview ? (
                            <img
                              src={portal.iconPreview || "/placeholder.svg"}
                              alt={portal.name}
                              style={styles.portalIconImg}
                            />
                          ) : (
                            <span style={styles.portalIconText}>{portal.icon}</span>
                          )}
                        </div>
                        <div style={styles.portalInfo}>
                          <span className="portalName" style={styles.portalName}>
                            {portal.name}
                          </span>
                          <p style={styles.portalDescription}>{portal.description}</p>
                        </div>
                      </div>
                    </a>
                    {editMode && (
                      <div style={styles.editModeIndicator}>
                        <FontAwesomeIcon icon={faEdit} style={styles.editModeIcon} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ ...styles.block, ...styles.eventsBlock }}>
              <h2 style={styles.heading}>Мероприятия</h2>
              <div style={styles.eventsList}>
                {events.map((event) => (
                  <div key={event.id}>
                    <Event key={event.id} event={event} />
                    {/* Добавляем серую разделительную полоску между мероприятиями */}
                    {event.id !== events[events.length - 1].id && <div style={styles.eventDivider}></div>}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ ...styles.block, ...styles.birthdayBlock }}>
              <h2 style={styles.heading}>Ближайшие дни рождения</h2>
              <div style={styles.birthdayList}>
                {birthdays.map((person) => (
                  <div key={person.id}>
                    <div style={styles.birthdayItem} onClick={() => toggleBirthdayDetails(person.id)}>
                      <div style={styles.birthdayAvatar}>
                        {person.photo ? (
                          <img
                            src={person.photo || "/placeholder.svg"}
                            alt={person.name}
                            style={styles.birthdayPhoto}
                          />
                        ) : (
                          <FontAwesomeIcon icon={faUser} style={{ fontSize: "24px", color: "#13454B" }} />
                        )}
                      </div>
                      <div style={styles.birthdayInfo}>
                        <p style={styles.birthdayName}>
                          {person.name} - {person.date}
                        </p>
                        <p style={styles.birthdayDepartment}>{person.department}</p>
                      </div>
                      <FontAwesomeIcon
                        icon={faChevronRight}
                        style={{
                          ...styles.expandIcon,
                          transform: expandedBirthday === person.id ? "rotate(90deg)" : "none",
                          transition: "transform 0.3s ease",
                        }}
                      />
                    </div>

                    {/* Развернутая информация о сотруднике */}
                    {expandedBirthday === person.id && (
                      <div style={styles.birthdayDetails}>
                        <div style={styles.birthdayDetailsSection}>
                          <h4 style={styles.birthdayDetailsTitle}>Основная информация</h4>
                          <div style={styles.birthdayDetailsRow}>
                            <span style={styles.birthdayDetailsLabel}>Табельный номер:</span>
                            <span style={styles.birthdayDetailsValue}>{person.personnel_number || "Не указан"}</span>
                          </div>
                          <div style={styles.birthdayDetailsRow}>
                            <span style={styles.birthdayDetailsLabel}>Дата рождения:</span>
                            <span style={styles.birthdayDetailsValue}>{person.date}</span>
                          </div>
                          <div style={styles.birthdayDetailsRow}>
                            <span style={styles.birthdayDetailsLabel}>Местоположение:</span>
                            <span style={styles.birthdayDetailsValue}>{person.location || "Не указано"}</span>
                          </div>
                          <div style={styles.birthdayDetailsRow}>
                            <span style={styles.birthdayDetailsLabel}>Организация:</span>
                            <span style={styles.birthdayDetailsValue}>{person.organization || "Не указана"}</span>
                          </div>
                        </div>

                        <div style={styles.birthdayDetailsSection}>
                          <h4 style={styles.birthdayDetailsTitle}>Контактная информация</h4>
                          <div style={styles.birthdayDetailsRow}>
                            <span style={styles.birthdayDetailsLabel}>Рабочий телефон:</span>
                            <div style={styles.birthdayDetailsValueWithCopy}>
                              <span style={styles.birthdayDetailsValue}>
                                {formatPhoneNumber(person.phone) || "Не указан"}
                              </span>
                              {person.phone && (
                                <button
                                  style={styles.copyButton}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    copyToClipboardHandler(person.phone, "Телефон")
                                  }}
                                >
                                  <FontAwesomeIcon icon={faCopy} />
                                </button>
                              )}
                            </div>
                          </div>
                          <div style={styles.birthdayDetailsRow}>
                            <span style={styles.birthdayDetailsLabel}>Электронная почта:</span>
                            <div style={styles.birthdayDetailsValueWithCopy}>
                              <span style={styles.birthdayDetailsValue}>{person.email || "Не указана"}</span>
                              {person.email && (
                                <button
                                  style={styles.copyButton}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    copyToClipboardHandler(person.email, "Email")
                                  }}
                                >
                                  <FontAwesomeIcon icon={faCopy} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Уведомление о копировании */}
      {showCopyNotification && <div style={styles.copyNotification}>{copiedText} скопирован в буфер обмена</div>}

      {/* Модальное окно редактирования портала */}
      <PortalEditModal
        isOpen={isPortalModalOpen}
        onClose={() => {
          setIsPortalModalOpen(false)
          if (!isNewPortal) {
            setEditMode(false)
          }
        }}
        portal={editingPortal}
        onSave={handleSavePortal}
        isNewPortal={isNewPortal}
        onExitEditMode={() => setEditMode(false)}
      />
    </main>
  )
}

// Стили
const colors = {
  primary: "#13454B",
  secondary: "#EE6B0C",
  background: "#F5F5F5",
  blockBackground: "#FFFFFF",
  text: "#333",
  lightText: "#B3B3B3",
}

const fonts = {
  main: "'Manrope', Arial, sans-serif",
  secondary: "'Arial', sans-serif",
}

const baseBlockStyles = {
  backgroundColor: colors.blockBackground,
  borderRadius: "8px",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  padding: "1.5rem",
}

const styles = {
  main: {
    minHeight: "calc(100vh - 72px)",
    fontFamily: fonts.main,
    backgroundColor: colors.background,
    padding: "1rem",
    // Удаляем overflowY: "auto", чтобы оставить только одну прокрутку на уровне body
  },
  contentWrapper: {
    display: "flex",
    width: "100%",
    gap: "1rem",
    alignItems: "flex-start", // Добавляем это свойство для выравнивания блоков по верхнему краю
  },
  leftColumn: {
    flex: "0 0 60%",
    padding: "1rem",
    boxSizing: "border-box",
  },
  rightColumn: {
    flex: "0 0 40%",
    position: "relative",
    boxSizing: "border-box",
  },
  rightColumnFixed: {
    position: "sticky",
    top: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    paddingRight: "1rem",
  },
  block: {
    ...baseBlockStyles,
    marginBottom: "1rem",
  },
  heading: {
    color: "#000000", // Изменено с colors.primary на черный
    borderBottom: `2px solid ${colors.secondary}`,
    fontFamily: fonts.main,
    fontWeight: 600,
    fontSize: "36px",
    lineHeight: "45px",
    letterSpacing: "0.5px",
    padding: "15px 0 12px 0",
    marginBottom: "20px",
    width: "100%", // Добавляем это свойство для растягивания полоски на всю ширину
  },
  portalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    position: "relative",
  },
  editPortalsButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: colors.primary,
    fontSize: "20px",
    padding: "5px",
    marginTop: "15px",
  },
  editPortalsIcon: {
    fontSize: "20px",
  },
  portalMenu: {
    position: "absolute",
    top: "100%",
    right: "0",
    backgroundColor: "#FFFFFF",
    boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)",
    borderRadius: "4px",
    zIndex: 10,
    minWidth: "250px",
  },
  portalMenuItem: {
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "10px 15px",
    border: "none",
    backgroundColor: "transparent",
    cursor: "pointer",
    fontSize: "14px",
    color: "#333",
    transition: "background-color 0.2s",
    "&:hover": {
      backgroundColor: "#f5f5f5",
    },
  },
  portalContainerEditable: {
    cursor: "pointer",
    backgroundColor: "#f9f9f9",
    transition: "background-color 0.2s",
    "&:hover": {
      backgroundColor: "#f0f0f0",
    },
  },
  editModeIndicator: {
    padding: "0 10px",
    color: colors.secondary,
  },
  editModeIcon: {
    fontSize: "16px",
  },
  editModeNotification: {
    backgroundColor: "#FFF8E1",
    padding: "10px 15px",
    borderRadius: "4px",
    marginBottom: "15px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "14px",
    color: "#856404",
  },
  exitEditModeButton: {
    backgroundColor: "transparent",
    border: "1px solid #856404",
    color: "#856404",
    padding: "5px 10px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    "&:hover": {
      backgroundColor: "#856404",
      color: "#FFFFFF",
    },
  },
  portalAdminControls: {
    position: "relative",
  },
  addPortalButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: colors.secondary,
    fontSize: "24px",
    padding: "5px",
    marginTop: "15px",
  },
  addPortalIcon: {
    fontSize: "24px",
  },
  portalGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  portalContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #e0e0e0",
  },
  portalLink: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    textDecoration: "none",
    color: "#000000",
    transition: "transform 0.2s",
    fontFamily: "'Manrope', Arial, sans-serif",
    fontWeight: 500,
    fontSize: "16px",
    padding: "0.5rem 0",
    flex: 1,
  },
  portalContent: {
    display: "flex",
    alignItems: "flex-start",
    width: "100%",
  },
  portalIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "#f0f0f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "15px",
    flexShrink: 0,
    overflow: "hidden",
  },
  portalIconText: {
    fontSize: "20px",
  },
  portalIconImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  portalInfo: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },
  portalName: {
    fontFamily: "'Open Sans', Arial, sans-serif", // Такой же шрифт как в блоке дней рождения
    fontWeight: 500,
    fontSize: "16px",
    marginBottom: "5px",
    transition: "color 0.3s ease",
    color: "#000000", // Черный цвет текста
  },
  portalDescription: {
    fontFamily: "'Open Sans', Arial, sans-serif", // Такой же шрифт как в блоке дней рождения
    fontSize: "14px",
    color: "#999999", // Оставляем серый для описания
    margin: 0,
    lineHeight: "1.4",
  },
  editPortalButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: colors.primary,
    padding: "5px",
  },
  editPortalIcon: {
    fontSize: "16px",
  },
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  listItem: {
    marginBottom: "1rem",
    fontFamily: fonts.main,
    fontWeight: 300,
  },
  date: {
    color: colors.lightText,
    fontSize: "0.9em",
    fontFamily: fonts.secondary,
    fontWeight: 400,
  },
  newsBlock: {
    backgroundColor: colors.blockBackground,
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
    display: "flex",
    flexDirection: "column",
  },
  newsList: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
    marginTop: "1.5rem",
  },
  newsItem: {
    padding: "1.5rem",
    marginBottom: "1rem",
    backgroundColor: colors.blockBackground,
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
    border: "1px solid #e0e0e0",
    position: "relative",
  },
  pinnedNewsItem: {
    borderLeft: `4px solid ${colors.secondary}`,
    backgroundColor: "#FFFAF5",
  },
  pinnedIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    color: colors.secondary,
    fontSize: "14px",
    fontWeight: 500,
    marginBottom: "10px",
  },
  pinnedIcon: {
    fontSize: "14px",
  },
  newsHeader: {
    marginBottom: "1rem",
  },
  authorInfo: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
  },
  authorInfoContainer: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  authorAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "#e0e0e0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  authorDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  authorName: {
    color: colors.primary,
    fontSize: "1rem",
    fontWeight: 600,
  },
  newsTime: {
    color: colors.lightText,
    fontSize: "0.85rem",
  },
  adminActions: {
    display: "flex",
    gap: "10px",
  },
  adminActionButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "5px",
    borderRadius: "4px",
    transition: "background-color 0.2s",
    "&:hover": {
      backgroundColor: "#f0f0f0",
    },
  },
  adminActionIcon: {
    fontSize: "16px",
    color: "#13454B",
  },
  newsImage: {
    width: "100%",
    height: "auto",
    objectFit: "cover",
    borderRadius: "4px",
    marginTop: "1rem",
    marginBottom: "1rem",
  },
  newsTitle: {
    color: colors.primary,
    fontFamily: fonts.main,
    fontWeight: 500,
    fontSize: "1.2rem",
    marginBottom: "0.5rem",
  },
  newsDescription: {
    fontFamily: fonts.main,
    fontWeight: 300,
    fontSize: "1rem",
    color: colors.text,
    marginBottom: "1rem",
    lineHeight: "1.5",
  },
  newsFooter: {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    marginBottom: "1rem",
    borderTop: "1px solid #e0e0e0",
    paddingTop: "1rem",
  },
  likeButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    padding: "0.5rem",
    transition: "transform 0.2s",
  },
  likeCount: {
    marginLeft: "0.5rem",
    color: colors.primary,
    fontFamily: fonts.main,
    fontWeight: 500,
  },
  commentsSection: {
    marginTop: "1rem",
    borderTop: `1px solid #e0e0e0`,
    paddingTop: "1rem",
  },
  commentsHeader: {
    fontSize: "1.1rem",
    fontWeight: 500,
    marginBottom: "0.5rem",
    color: colors.primary,
  },
  comment: {
    display: "flex",
    alignItems: "flex-start",
    marginBottom: "1rem",
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    marginRight: "1rem",
  },
  commentContent: {
    flex: 1,
  },
  userName: {
    fontWeight: 500,
    marginBottom: "0.25rem",
    display: "block",
  },
  commentText: {
    margin: 0,
    fontSize: "0.9rem",
  },
  commentForm: {
    display: "flex",
    marginTop: "1rem",
  },
  commentInput: {
    flex: 1,
    padding: "0.5rem",
    border: `1px solid #e0e0e0`,
    borderRadius: "4px",
    marginRight: "0.5rem",
  },
  commentSubmit: {
    padding: "0.5rem 1rem",
    backgroundColor: colors.secondary,
    color: colors.blockBackground,
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  portalBlock: {
    marginBottom: "1rem",
  },
  birthdayBlock: {
    marginBottom: "1rem",
    height: "calc(100% - 400px)",
  },
  addNewsFormContainer: {
    marginTop: "1rem",
    marginBottom: "1.5rem",
  },
  addNewsForm: {
    backgroundColor: colors.blockBackground,
    borderRadius: "8px",
    padding: "1rem",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    border: "1px solid #e0e0e0",
  },
  addNewsInput: {
    width: "100%",
    padding: "0.75rem",
    borderRadius: "4px",
    border: "1px solid #e0e0e0",
    fontSize: "16px",
    fontFamily: fonts.main,
    marginBottom: "0.75rem",
  },
  addNewsTextarea: {
    width: "100%",
    padding: "0.75rem",
    borderRadius: "4px",
    border: "1px solid #e0e0e0",
    fontSize: "16px",
    fontFamily: fonts.main,
    resize: "vertical",
    marginBottom: "0.75rem",
  },
  addNewsActions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.75rem",
  },
  attachmentContainer: {
    display: "flex",
    alignItems: "center",
  },
  attachButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    background: "none",
    border: "none",
    color: "#777",
    cursor: "pointer",
    padding: "0.5rem",
    fontSize: "14px",
  },
  attachText: {
    color: "#777",
  },
  fileInput: {
    display: "none",
  },
  formButtons: {
    display: "flex",
    gap: "0.75rem",
  },
  cancelButton: {
    padding: "0.5rem 1rem",
    background: "none",
    border: "none",
    color: "#777",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
  },
  publishButton: {
    padding: "0.5rem 1rem",
    background: "none",
    border: "none",
    color: colors.secondary,
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
  },
  imagePreviewContainer: {
    position: "relative",
    marginTop: "0.75rem",
    marginBottom: "0.75rem",
    display: "inline-block",
  },
  imagePreview: {
    maxWidth: "100%",
    maxHeight: "200px",
    borderRadius: "4px",
    border: "1px solid #e0e0e0",
  },
  removeImageButton: {
    position: "absolute",
    top: "5px",
    right: "5px",
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    color: "#fff",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "12px",
  },
  validationError: {
    color: colors.secondary,
    fontSize: "0.9rem",
    marginBottom: "0.75rem",
  },
  // Стили для блока "ближайшие дни рождения"
  birthdayList: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  birthdayItem: {
    display: "flex",
    alignItems: "center",
    padding: "0.5rem 0",
    borderBottom: "1px solid #e0e0e0",
    cursor: "pointer", // Добавляем курсор pointer
  },
  birthdayAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "#e0e0e0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "1rem",
    overflow: "hidden",
  },
  birthdayPhoto: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  birthdayInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  birthdayName: {
    margin: 0,
    fontWeight: 500,
    fontSize: "14px",
    color: "#000000", // Изменено на черный
    cursor: "pointer",
  },
  birthdayDepartment: {
    margin: 0,
    fontSize: "12px",
    color: "#777",
  },
  birthdayDate: {
    fontSize: "14px",
    color: "#000000",
    marginLeft: "1rem",
    fontWeight: 500,
  },
  eventsBlock: {
    marginBottom: "1rem",
  },
  eventsList: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  eventItem: {
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    padding: "0", // Убираем внутренние отступы
    border: "none", // Убираем границу
  },
  eventDivider: {
    height: "1px",
    backgroundColor: "#e0e0e0",
    margin: "0",
    width: "100%",
  },
  eventHeader: {
    display: "flex",
    justifyContent: "space-between",
    padding: "1rem",
    cursor: "pointer",
    borderBottom: "1px solid #e0e0e0",
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    margin: 0,
    marginBottom: "0.5rem",
    fontSize: "16px",
    fontWeight: 600,
    color: "#000000", // Изменено на черный
    fontFamily: "'Open Sans', Arial, sans-serif", // Такой же шрифт как в блоке дней рождения
  },
  eventShortDescription: {
    margin: 0,
    fontSize: "14px",
    color: "#000000", // Изменено на черный
    fontFamily: "'Open Sans', Arial, sans-serif", // Такой же шрифт как в блоке дней рождения
  },
  eventActions: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  eventSeats: {
    fontSize: "14px",
    color: colors.primary,
    fontWeight: 500,
  },
  registerButton: {
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
  registeredButton: {
    padding: "8px 16px",
    backgroundColor: "#4CAF50",
    color: "#FFFFFF",
    border: "1px solid #4CAF50",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    fontFamily: "'Open Sans', Arial, sans-serif",
  },
  expandIcon: {
    color: "#AAAAAA", // Серый цвет
    fontSize: "12px",
    transform: "rotate(0deg)", // Стрелка смотрит вправо по умолчанию
    transition: "transform 0.3s ease",
  },
  eventDetails: {
    padding: "1rem",
    backgroundColor: "#f9f9f9",
  },
  eventFullDescription: {
    margin: "0 0 1rem 0",
    fontSize: "14px",
    lineHeight: "1.5",
    color: "#000000", // Изменено на черный
    fontFamily: "'Open Sans', Arial, sans-serif", // Такой же шрифт как в блоке дней рождения
  },
  eventMetadata: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    marginBottom: "1rem",
  },
  eventMetaItem: {
    display: "flex",
    fontSize: "14px",
  },
  eventMetaLabel: {
    fontWeight: 600,
    width: "150px",
    color: "#000000", // Изменено на черный
    fontFamily: "'Open Sans', Arial, sans-serif", // Такой же шрифт как в блоке дней рождения
  },
  eventMetaValue: {
    color: "#000000", // Изменено на черный
    fontFamily: "'Open Sans', Arial, sans-serif", // Такой же шрифт как в блоке дней рождения
  },
  speakersSection: {
    marginTop: "1rem",
  },
  speakersTitle: {
    margin: "0 0 0.5rem 0",
    fontSize: "16px",
    fontWeight: 600,
    color: "#000000", // Изменено на черный
    fontFamily: "'Open Sans', Arial, sans-serif", // Такой же шрифт как в блоке дней рождения
  },
  speakersList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  speakerItem: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  speakerAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "#e0e0e0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  speakerPhoto: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  speakerInfo: {
    display: "flex",
    flexDirection: "column",
  },
  speakerName: {
    margin: 0,
    fontWeight: 500,
    fontSize: "14px",
    color: colors.primary,
  },
  speakerPosition: {
    margin: 0,
    fontSize: "12px",
    color: "#777",
  },
  birthdayPopup: {
    position: "absolute",
    width: "300px",
    backgroundColor: "#FFFFFF",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    borderRadius: "8px",
    zIndex: 100,
  },
  birthdayPopupHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 15px",
    borderBottom: "1px solid #E0E0E0",
  },
  birthdayPopupTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: 600,
    color: "#000000",
    fontFamily: "'Open Sans', Arial, sans-serif",
  },
  birthdayPopupClose: {
    background: "none",
    border: "none",
    fontSize: "16px",
    color: "#777",
    cursor: "pointer",
  },
  birthdayPopupContent: {
    padding: "15px",
  },
  popupRow: {
    display: "flex",
    marginBottom: "10px",
  },
  popupLabel: {
    width: "120px",
    fontSize: "14px",
    color: "#777",
    fontFamily: "'Open Sans', Arial, sans-serif",
  },
  popupValue: {
    fontSize: "14px",
    color: "#333",
    fontFamily: "'Open Sans', Arial, sans-serif",
  },
  popupValueWithCopy: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  copyButton: {
    background: "none",
    border: "none",
    color: "#EE6B0C",
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
  // Стили для раскрывающейся информации о сотрудниках
  birthdayDetails: {
    padding: "1rem 1rem 1rem 4rem",
    backgroundColor: "#F9F9F9",
    borderTop: "1px solid #E0E0E0",
    borderBottom: "1px solid #E0E0E0",
    marginBottom: "0.5rem",
  },
  birthdayDetailsSection: {
    marginBottom: "1rem",
  },
  birthdayDetailsTitle: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#000000",
    marginBottom: "0.75rem",
    fontFamily: "'Open Sans', Arial, sans-serif",
  },
  birthdayDetailsRow: {
    display: "flex",
    marginBottom: "0.5rem",
  },
  birthdayDetailsLabel: {
    width: "180px",
    fontSize: "14px",
    color: "#777",
    fontFamily: "'Open Sans', Arial, sans-serif",
  },
  birthdayDetailsValue: {
    fontSize: "14px",
    color: "#333",
    fontFamily: "'Open Sans', Arial, sans-serif",
    marginLeft: "0",
  },
  birthdayDetailsValueWithCopy: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  birthdayNameDate: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  // Стили для подтверждения удаления новости
  deleteConfirmation: {
    backgroundColor: "#FFF8F8",
    border: "1px solid #FFCDD2",
    borderRadius: "8px",
    padding: "1rem",
    marginBottom: "1rem",
  },
  deleteConfirmButtons: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "10px",
  },
  confirmDeleteButton: {
    padding: "8px 16px",
    backgroundColor: "#F44336",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
  },
  cancelDeleteButton: {
    padding: "8px 16px",
    backgroundColor: "#FFFFFF",
    color: "#333333",
    border: "1px solid #E0E0E0",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
  },
  // Стили для модального окна редактирования портала
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
  portalModal: {
    width: "45%",
    backgroundColor: "#FFFFFF",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    display: "flex",
    flexDirection: "column",
    maxHeight: "80vh",
    overflowY: "auto",
    // Убираем borderRadius: "8px",
  },
  portalModalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px",
    borderBottom: "1px solid #E0E0E0",
  },
  portalModalTitle: {
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
  portalModalContent: {
    padding: "20px",
  },
  portalIconEditContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: "20px",
  },
  portalIconEdit: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    backgroundColor: "#f0f0f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    position: "relative",
    overflow: "hidden",
    marginBottom: "10px",
  },
  portalIconEmoji: {
    fontSize: "40px",
  },
  portalIconPlaceholder: {
    fontSize: "40px",
    color: "#999",
  },
  portalIconImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  photoUploadOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    opacity: 0,
    transition: "opacity 0.3s ease",
  },
  cameraIcon: {
    fontSize: "24px",
    color: "#FFFFFF",
  },
  emojiSelector: {
    width: "100%",
    marginTop: "10px",
  },
  emojiLabel: {
    fontSize: "14px",
    color: "#777",
    marginBottom: "5px",
    textAlign: "center",
  },
  emojiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: "5px",
  },
  emojiButton: {
    width: "40px",
    height: "40px",
    fontSize: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #e0e0e0",
    borderRadius: "4px",
    cursor: "pointer",
    background: "transparent",
  },
  portalFormFields: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  formLabel: {
    fontSize: "14px",
    fontWeight: 500,
    color: "#333",
  },
  formInput: {
    padding: "10px 12px",
    borderRadius: "4px",
    border: "1px solid #e0e0e0",
    fontSize: "14px",
  },
  formTextarea: {
    padding: "10px 12px",
    borderRadius: "4px",
    border: "1px solid #e0e0e0",
    fontSize: "14px",
    resize: "vertical",
    minHeight: "80px",
  },
  urlInputContainer: {
    position: "relative",
  },
  urlIcon: {
    position: "absolute",
    left: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#777",
  },
  urlInput: {
    padding: "10px 12px 10px 30px",
    borderRadius: "4px",
    border: "1px solid #e0e0e0",
    fontSize: "14px",
    width: "100%",
  },
  fieldError: {
    color: colors.secondary,
    fontSize: "12px",
    marginTop: "2px",
  },
  portalModalActions: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "30px",
    borderTop: "1px solid #E0E0E0",
    paddingTop: "20px",
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
  saveButton: {
    padding: "10px 20px",
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
  birthdayNameWithDate: {
    margin: 0,
    fontWeight: 500,
    fontSize: "14px",
    color: colors.primary,
  },
}

export default MainContent

