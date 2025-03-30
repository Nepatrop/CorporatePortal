"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useUser } from "../context/UserContext" // Импортируем useUser
import { api } from "../utils/api"
import { wsClient } from "../utils/websocket"
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
import styles from "../styles/MainContent.module.css"

// Компонент Comment
function Comment({ comment }) {
  return (
    <div className={styles.comment}>
      <img src={comment.avatar || "/placeholder.svg"} alt={comment.author} className={styles.avatar} />
      <div className={styles.commentContent}>
        <strong className={styles.userName}>{comment.author}</strong>
        <p className={styles.commentText}>{comment.text}</p>
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
    <div className={`${styles.newsItem} ${news.isPinned ? styles.pinnedNewsItem : ""}`}>
      {news.isPinned && (
        <div className={styles.pinnedIndicator}>
          <FontAwesomeIcon icon={faThumbtack} className={styles.pinnedIcon} />
          <span>Закрепленная новость</span>
        </div>
      )}

      <div className={styles.authorInfo}>
        <div className={styles.authorInfoContainer}>
          <div className={styles.authorAvatar}>
            <FontAwesomeIcon icon={faUser} style={{ fontSize: "24px", color: "#13454B" }} />
          </div>
          <div className={styles.authorDetails}>
            <strong className={styles.authorName}>{news.isAdminPost ? "Администрация" : news.author_name}</strong>
            <span className={styles.newsTime}>{formatDateTime(news.publication_time)}</span>
          </div>
        </div>

        {isAdmin && (
          <div className={styles.adminActions}>
            <button
              onClick={() => onPin(news.id, !news.isPinned)}
              className={styles.adminActionButton}
              title={news.isPinned ? "Открепить новость" : "Закрепить новость"}
            >
              <FontAwesomeIcon
                icon={news.isPinned ? faTimes : faThumbtack}
                className={styles.adminActionIcon}
                style={{
                  color: news.isPinned ? "#EE6B0C" : "#13454B",
                }}
              />
            </button>
            <button onClick={() => onEdit(news)} className={styles.adminActionButton} title="Редактировать новость">
              <FontAwesomeIcon icon={faEdit} className={styles.adminActionIcon} />
            </button>
            <button onClick={() => onDelete(news.id)} className={styles.adminActionButton} title="Удалить новость">
              <FontAwesomeIcon icon={faTrash} className={styles.adminActionIcon} />
            </button>
          </div>
        )}
      </div>

      <h3 className={styles.newsTitle}>{news.title}</h3>
      <p className={styles.newsDescription}>{news.content}</p>

      {news.image_data && news.image_type && (
        <img
          src={`data:${news.image_type};base64,${news.image_data}`}
          alt={news.title}
          className={styles.newsImage}
          onError={(e) => {
            console.error("Image loading error:", e)
            e.target.style.display = "none"
          }}
        />
      )}

      <div className={styles.newsFooter}>
        <button
          onClick={() => onLike(news.id)}
          className={styles.likeButton}
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
          <span className={styles.likeCount}>{news.likes_count}</span>
        </button>
      </div>

      <div className={styles.commentsSection}>
        <h4 className={styles.commentsHeader}>Комментарии ({news.comments?.length || 0})</h4>

        {comments.map((comment, index) => (
          <Comment key={index} comment={comment} />
        ))}

        <form onSubmit={handleSubmitComment} className={styles.commentForm}>
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Написать комментарий..."
            className={styles.commentInput}
          />
          <button type="submit" className={styles.commentSubmit}>
            Отправить
          </button>
        </form>
      </div>
    </div>
  )
}

// Компонент для добавления/редактирования новости
function AddNewsForm({ onAddNews, editingNews, setEditingNews, isAdmin, onUpdate }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [validationError, setValidationError] = useState(false)
  const fileInputRef = useRef(null)
  const { currentUser } = useUser()
  const [showCancelWarning, setShowCancelWarning] = useState(false)

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
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
        setValidationError(true);
        return;
    }

    try {
        // Создаем объект с обязательными полями
        const newsData = {
            title: title.trim(),
            content: description.trim(),
            author_id: currentUser.id.toString()
        };

        // Обработка изображения при редактировании
        if (editingNews) {
            if (image) {
                // Если выбрано новое изображение
                const reader = new FileReader();
                const imageBase64 = await new Promise((resolve) => {
                    reader.onloadend = () => {
                        const base64String = reader.result.split(',')[1];
                        resolve(base64String);
                    };
                    reader.readAsDataURL(image);
                });
                newsData.image_data = imageBase64;
                newsData.image_type = image.type;
            } else if (imagePreview === null) {
                // Если изображение было удалено
                newsData.image_data = "null";
                newsData.image_type = "";
            }
            // Если imagePreview есть, но image нет - значит изображение не менялось
        } else {
            // Для новой новости
            if (image) {
                const reader = new FileReader();
                const imageBase64 = await new Promise((resolve) => {
                    reader.onloadend = () => {
                        const base64String = reader.result.split(',')[1];
                        resolve(base64String);
                    };
                    reader.readAsDataURL(image);
                });
                newsData.image_data = imageBase64;
                newsData.image_type = image.type;
            }
        }

        let response;

        if (editingNews) {
            response = await api.put(`/api/news/${editingNews.id}`, newsData);
        } else {
            response = await api.post("/api/news", newsData);
        }

        if (response.ok) {
            const responseData = await response.json();
            console.log("Server response:", responseData);
            
            onAddNews(responseData);
            resetForm();
            setEditingNews(null);

            // Перезагружаем список новостей
            if (onUpdate) {
                await onUpdate();
            }
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to save news');
        }
    } catch (error) {
        console.error("Error creating/updating news:", error);
        alert(`Ошибка при ${editingNews ? 'обновлении' : 'создании'} новости: ${error.message}`);
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
    if (title.trim() || description.trim() || imagePreview) {
      setShowCancelWarning(true)
    } else {
      if (editingNews) {
        setEditingNews(null)
      }
      resetForm()
    }
  }

  const confirmCancel = () => {
    if (editingNews) {
      setEditingNews(null)
    }
    resetForm()
    setShowCancelWarning(false)
  }

  return (
    <div className={styles.addNewsFormContainer}>
      <form onSubmit={handleSubmit} className={styles.addNewsForm}>
        {showCancelWarning && (
          <div className={styles.cancelWarning}>
            <p>Вы уверены, что хотите отменить? Все несохраненные изменения будут потеряны.</p>
            <div className={styles.cancelWarningButtons}>
              <button onClick={() => setShowCancelWarning(false)} className={styles.cancelWarningBackButton}>
                Вернуться к редактированию
              </button>
              <button onClick={confirmCancel} className={styles.cancelWarningConfirmButton}>
                Да, отменить
              </button>
            </div>
          </div>
        )}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onClick={handleInputClick}
          placeholder={isExpanded ? "Заголовок новости" : "Что у вас нового?"}
          className={styles.addNewsInput}
          style={{
            borderColor: validationError && !title.trim() ? "#EE6B0C" : "#e0e0e0",
          }}
        />

        {(isExpanded || editingNews) && (
          <>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Текст новости..."
              className={styles.addNewsTextarea}
              style={{
                borderColor: validationError && !description.trim() ? "#EE6B0C" : "#e0e0e0",
              }}
              rows={3}
            />

            {validationError && (!title.trim() || !description.trim()) && (
              <p className={styles.validationError}>Не все поля заполнены</p>
            )}

            <div className={styles.addNewsActions}>
              <div className={styles.attachmentContainer}>
                <button onClick={handleAttachClick} className={styles.attachButton} type="button">
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
                  <span className={styles.attachText}>Прикрепить файл</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className={styles.fileInput}
                  accept="image/*"
                />
              </div>
              <div className={styles.formButtons}>
                <button type="button" onClick={handleCancel} className={styles.cancelButton}>
                  Отмена
                </button>
                <button
                  type="submit"
                  className={styles.publishButton}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = "#ee6b0c"
                    e.currentTarget.style.color = "#ffffff"
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "#ffffff"
                    e.currentTarget.style.color = "#ee6b0c"
                  }}
                >
                  {editingNews ? "Сохранить" : "Опубликовать"}
                </button>
              </div>
            </div>

            {imagePreview && (
              <div className={styles.imagePreviewContainer}>
                <img src={imagePreview || "/placeholder.svg"} alt="Предпросмотр" className={styles.imagePreview} />
                <button
                  type="button"
                  onClick={() => {
                    setImage(null)
                    setImagePreview(null)
                    if (fileInputRef.current) fileInputRef.current.value = ""
                  }}
                  className={styles.removeImageButton}
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

        handleClickOutside()
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
    <div className={styles.modalOverlay}>
      <div className={styles.portalModal} ref={modalRef}>
        <div className={styles.portalModalHeader}>
          <h2 className={styles.portalModalTitle}>{isNewPortal ? "Добавление портала" : "Редактирование портала"}</h2>
          <button className={styles.closeButton} onClick={handleCloseModal}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className={styles.portalModalContent}>
          {/* Блок с иконкой */}
          <div className={styles.portalIconEditContainer}>
            <div
              className={styles.portalIconEdit}
              onMouseEnter={() => setShowIconUpload(true)}
              onMouseLeave={() => setShowIconUpload(false)}
              onClick={() => fileInputRef.current.click()}
            >
              {iconPreview ? (
                <img src={iconPreview || "/placeholder.svg"} alt="Иконка портала" className={styles.portalIconImage} />
              ) : icon ? (
                <span className={styles.portalIconEmoji}>{icon}</span>
              ) : (
                <span className={styles.portalIconPlaceholder}>🔗</span>
              )}

              <div
                className={styles.photoUploadOverlay}
                style={{
                  opacity: showIconUpload ? 1 : 0,
                }}
              >
                <FontAwesomeIcon icon={faCamera} className={styles.cameraIcon} />
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
              <div className={styles.emojiSelector}>
                <p className={styles.emojiLabel}>Или выберите эмодзи:</p>
                <div className={styles.emojiGrid}>
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
                      className={`${styles.emojiButton} ${icon === emoji ? styles.emojiButtonSelected : ""}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Поля формы */}
          <div className={styles.portalFormFields}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Название портала*</label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleFieldChange(setName, e.target.value, "name")}
                className={styles.formInput}
                style={{
                  borderColor: validationError && !name.trim() ? "#EE6B0C" : "#e0e0e0",
                }}
                placeholder="Введите название портала"
              />
              {validationError && !name.trim() && <p className={styles.fieldError}>Название портала обязательно</p>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Описание</label>
              <textarea
                value={description}
                onChange={(e) => handleFieldChange(setDescription, e.target.value, "description")}
                className={styles.formTextarea}
                placeholder="Введите описание портала"
                rows={3}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Ссылка</label>
              <div className={styles.urlInputContainer}>
                <FontAwesomeIcon icon={faLink} className={styles.urlIcon} />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => handleFieldChange(setUrl, e.target.value, "url")}
                  className={styles.urlInput}
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>

          {/* Кнопки действий */}
          <div className={styles.portalModalActions}>
            {showExitWarning ? (
              <>
                <div className={styles.warningContainer}>
                  <span className={styles.warningText}>У вас есть несохраненные изменения</span>
                </div>
                <div className={styles.actionButtons}>
                  <button className={styles.cancelButton} onClick={confirmExit}>
                    Выйти без сохранения
                  </button>
                  <button className={styles.cancelButton} onClick={() => setShowExitWarning(false)}>
                    Вернуться к редактированию
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.actionButtons}>
                <button className={styles.cancelButton} onClick={handleCloseModal}>
                  Отмена
                </button>
                <button
                  className={styles.saveButton}
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
    <div className={styles.eventItem}>
      <div className={styles.eventHeader} onClick={toggleExpand}>
        <div className={styles.eventInfo}>
          <h3 className={styles.eventTitle}>{event.title}</h3>
          <p className={styles.eventShortDescription}>{event.shortDescription}</p>
        </div>
        <div className={styles.eventActions}>
          <button
            className={isRegistered ? styles.registeredButton : styles.registerButton}
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
            className={styles.expandIcon}
            style={{
              transform: isExpanded ? "rotate(90deg)" : "none",
              transition: "transform 0.3s ease",
            }}
          />
        </div>
      </div>

      {isExpanded && (
        <div className={styles.eventDetails}>
          <p className={styles.eventFullDescription}>{event.fullDescription}</p>

          <div className={styles.eventMetadata}>
            <div className={styles.eventMetaItem}>
              <span className={styles.eventMetaLabel}>Свободных мест:</span>
              <span className={styles.eventMetaValue}>
                {event.availableSeats} из {event.totalSeats}
              </span>
            </div>
            <div className={styles.eventMetaItem}>
              <span className={styles.eventMetaLabel}>Дата:</span>
              <span className={styles.eventMetaValue}>{event.date}</span>
            </div>
            <div className={styles.eventMetaItem}>
              <span className={styles.eventMetaLabel}>Время:</span>
              <span className={styles.eventMetaValue}>{event.time}</span>
            </div>
            <div className={styles.eventMetaItem}>
              <span className={styles.eventMetaLabel}>Место:</span>
              <span className={styles.eventMetaValue}>{event.location}</span>
            </div>
          </div>

          <div className={styles.speakersSection}>
            <h4 className={styles.speakersTitle}>Спикеры:</h4>
            <div className={styles.speakersList}>
              {event.speakers.map((speaker) => (
                <div key={speaker.id} className={styles.speakerItem}>
                  <div className={styles.speakerAvatar}>
                    {speaker.photo ? (
                      <img
                        src={speaker.photo || "/placeholder.svg"}
                        alt={speaker.name}
                        className={styles.speakerPhoto}
                      />
                    ) : (
                      <FontAwesomeIcon icon={faUser} style={{ fontSize: "24px", color: "#13454B" }} />
                    )}
                  </div>
                  <div className={styles.speakerInfo}>
                    <p className={styles.speakerName}>{speaker.name}</p>
                    <p className={styles.speakerPosition}>{speaker.position}</p>
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
    loadNews();

    wsClient.setMessageHandler((data) => {
        switch (data.type) {
            case "news_updated":
                loadNews();
                break;
                
            case "news_deleted":
                setNews(prevNews => prevNews.filter(news => news.id !== data.data.id));
                break;
                
            case "comment_added":
                if (data.data && data.newsId) {
                    setNews(prevNews => prevNews.map(news => {
                        if (news.id === data.newsId) {
                            const commentExists = news.comments?.some(
                                comment => comment.id === data.data.id
                            );
                            
                            if (!commentExists) {
                                return {
                                    ...news,
                                    comments: [...(news.comments || []), data.data]
                                };
                            }
                        }
                        return news;
                    }));
                }
                break;

            case "likes_updated":
                if (data.data && data.data.news_id) {
                    setNews(prevNews => prevNews.map(news => {
                        if (news.id === data.data.news_id) {
                            return {
                                ...news,
                                likes_count: data.data.likes_count
                            };
                        }
                        return news;
                    }));
                }
                break;
        }
    });
}, [loadNews]);

  const handleLike = async (newsId) => {
    try {
        const response = await api.post(`/api/news/${Number.parseInt(newsId)}/like`, {
            employee_id: Number.parseInt(currentUser.id),
        });

        if (response.ok) {
            const data = await response.json();
            // Обновляем только состояние лайка текущего пользователя
            setNews((prevNews) =>
                prevNews.map((item) => {
                    if (item.id === newsId) {
                        return {
                            ...item,
                            liked: data.action === "liked"
                        };
                    }
                    return item;
                })
            );
        }
    } catch (error) {
        console.error("Error liking news:", error);
    }
};

  const handleAddComment = async (newsId, text) => {
    try {
        const response = await api.post(`/api/news/${newsId}/comments`, {
            employee_id: Number(currentUser.id),
            text: text,
        })

        // Убираем обновление состояния здесь, т.к. оно придет через WebSocket
        if (!response.ok) {
            const errorText = await response.text()
            console.error("Comment error response:", errorText)
        }
    } catch (error) {
        console.error("Error adding comment:", error)
    }
  }

  // Функция для редактирования новости
  const handleEditNews = async (newsItem) => {
    setEditingNews(newsItem);
    // Прокручиваем страницу к форме редактирования
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
  };

  // Функция для удаления новости
  const handleDeleteNews = async (newsId) => {
    if (showDeleteConfirm === newsId) {
        try {
            const response = await api.delete(`/api/news/${newsId}`);
            if (response.ok) {
                setShowDeleteConfirm(null);
                // Локально удаляем новость сразу
                setNews(prevNews => prevNews.filter(news => news.id !== newsId));
            } else {
                console.error("Error deleting news");
            }
        } catch (error) {
            console.error("Error deleting news:", error);
        }
    } else {
        setShowDeleteConfirm(newsId);
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
    <main className={styles.main}>
      <style>
        {`
        .clickable-name {
          cursor: pointer;
          transition: color 0.3s ease;
        }
      `}
      </style>
      <div className={styles.contentWrapper}>
        <div className={styles.leftColumn}>
          <div className={styles.block}>
            <h2 className={styles.heading}>Новости и статьи</h2>
            {isAdmin && (
              <AddNewsForm
                onAddNews={handleAddNews}
                editingNews={editingNews}
                setEditingNews={setEditingNews}
                isAdmin={isAdmin}
                onUpdate={loadNews}
              />
            )}
            <div className={styles.newsList}>
              {news.map((item) => (
                <div key={item.id}>
                  {showDeleteConfirm === item.id && (
                    <div className={styles.deleteConfirmation}>
                      <p>Вы уверены, что хотите удалить эту новость?</p>
                      <div className={styles.deleteConfirmButtons}>
                        <button onClick={() => handleDeleteNews(item.id)} className={styles.confirmDeleteButton}>
                          Удалить
                        </button>
                        <button onClick={() => setShowDeleteConfirm(null)} className={styles.cancelDeleteButton}>
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

        <div className={styles.rightColumn}>
          <div className={styles.rightColumnFixed}>
            <div className={styles.block}>
              <div className={styles.portalHeader}>
                <h2 className={styles.heading}>Внутренние порталы</h2>
                {isAdmin && (
                  <div className={styles.portalAdminControls}>
                    <button
                      onClick={() => setShowPortalMenu(!showPortalMenu)}
                      className={styles.editPortalsButton}
                      title="Управление порталами"
                    >
                      <FontAwesomeIcon icon={faEdit} className={styles.editPortalsIcon} />
                    </button>
                    {showPortalMenu && (
                      <div className={styles.portalMenu}>
                        <button
                          className={styles.portalMenuItem}
                          onClick={() => {
                            setEditMode(true)
                            setShowPortalMenu(false)
                          }}
                        >
                          Редактировать существующий портал
                        </button>
                        <button
                          className={styles.portalMenuItem}
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
                <div className={styles.editModeNotification}>
                  <span>Режим редактирования. Нажмите на портал для изменения.</span>
                  <button className={styles.exitEditModeButton} onClick={() => setEditMode(false)}>
                    Выйти из режима редактирования
                  </button>
                </div>
              )}
              <div className={styles.portalGrid}>
                {portals.map((portal) => (
                  <div
                    key={portal.id}
                    className={`${styles.portalContainer} ${editMode ? styles.portalContainerEditable : ""}`}
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
                      className={styles.portalLink}
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
                      <div className={styles.portalContent}>
                        <div className={styles.portalIcon}>
                          {portal.iconPreview ? (
                            <img
                              src={portal.iconPreview || "/placeholder.svg"}
                              alt={portal.name}
                              className={styles.portalIconImg}
                            />
                          ) : (
                            <span className={styles.portalIconText}>{portal.icon}</span>
                          )}
                        </div>
                        <div className={styles.portalInfo}>
                          <span className={`portalName ${styles.portalName}`}>{portal.name}</span>
                          <p className={styles.portalDescription}>{portal.description}</p>
                        </div>
                      </div>
                    </a>
                    {editMode && (
                      <div className={styles.editModeIndicator}>
                        <FontAwesomeIcon icon={faEdit} className={styles.editModeIcon} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.block}>
              <h2 className={styles.heading}>Мероприятия</h2>
              <div className={styles.eventsList}>
                {events.map((event) => (
                  <div key={event.id}>
                    <Event key={event.id} event={event} />
                    {/* Добавляем серую разделительную полоску между мероприятиями */}
                    {event.id !== events[events.length - 1].id && <div className={styles.eventDivider}></div>}
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.block}>
              <h2 className={styles.heading}>Ближайшие дни рождения</h2>
              <div className={styles.birthdayList}>
                {birthdays.map((person) => (
                  <div key={person.id}>
                    <div className={styles.birthdayItem} onClick={() => toggleBirthdayDetails(person.id)}>
                      <div className={styles.birthdayAvatar}>
                        {person.photo ? (
                          <img
                            src={person.photo || "/placeholder.svg"}
                            alt={person.name}
                            className={styles.birthdayPhoto}
                          />
                        ) : (
                          <FontAwesomeIcon icon={faUser} style={{ fontSize: "24px", color: "#13454B" }} />
                        )}
                      </div>
                      <div className={styles.birthdayInfo}>
                        <p className={styles.birthdayName}>
                          {person.name} - {person.date}
                        </p>
                        <p className={styles.birthdayDepartment}>{person.department}</p>
                      </div>
                      <FontAwesomeIcon
                        icon={faChevronRight}
                        className={styles.expandIcon}
                        style={{
                          transform: expandedBirthday === person.id ? "rotate(90deg)" : "none",
                          transition: "transform 0.3s ease",
                        }}
                      />
                    </div>

                    {/* Развернутая информация о сотруднике */}
                    {expandedBirthday === person.id && (
                      <div className={styles.birthdayDetails}>
                        <div className={styles.birthdayDetailsSection}>
                          <h4 className={styles.birthdayDetailsTitle}>Основная информация</h4>
                          <div className={styles.birthdayDetailsRow}>
                            <span className={styles.birthdayDetailsLabel}>Табельный номер:</span>
                            <span className={styles.birthdayDetailsValue}>
                              {person.personnel_number || "Не указан"}
                            </span>
                          </div>
                          <div className={styles.birthdayDetailsRow}>
                            <span className={styles.birthdayDetailsLabel}>Дата рождения:</span>
                            <span className={styles.birthdayDetailsValue}>{person.date}</span>
                          </div>
                          <div className={styles.birthdayDetailsRow}>
                            <span className={styles.birthdayDetailsLabel}>Местоположение:</span>
                            <span className={styles.birthdayDetailsValue}>{person.location || "Не указано"}</span>
                          </div>
                          <div className={styles.birthdayDetailsRow}>
                            <span className={styles.birthdayDetailsLabel}>Организация:</span>
                            <span className={styles.birthdayDetailsValue}>{person.organization || "Не указана"}</span>
                          </div>
                        </div>

                        <div className={styles.birthdayDetailsSection}>
                          <h4 className={styles.birthdayDetailsTitle}>Контактная информация</h4>
                          <div className={styles.birthdayDetailsRow}>
                            <span className={styles.birthdayDetailsLabel}>Рабочий телефон:</span>
                            <div className={styles.birthdayDetailsValueWithCopy}>
                              <span className={styles.birthdayDetailsValue}>
                                {formatPhoneNumber(person.phone) || "Не указан"}
                              </span>
                              {person.phone && (
                                <button
                                  className={styles.copyButton}
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
                          <div className={styles.birthdayDetailsRow}>
                            <span className={styles.birthdayDetailsLabel}>Электронная почта:</span>
                            <div className={styles.birthdayDetailsValueWithCopy}>
                              <span className={styles.birthdayDetailsValue}>{person.email || "Не указана"}</span>
                              {person.email && (
                                <button
                                  className={styles.copyButton}
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
      {showCopyNotification && <div className={styles.copyNotification}>{copiedText} скопирован в буфер обмена</div>}

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

export default MainContent

