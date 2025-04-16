"use client"

// Заменяем импорты на правильные
import { useState, useEffect, useCallback, useRef } from "react"
import { useUser } from "../context/UserContext"
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
} from "@fortawesome/free-solid-svg-icons"
import styles from "../styles/MainContent.module.css"
import PortalModal from "./PortalModal"

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const comments = news.comments || []

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (commentText.trim()) {
      await onAddComment(news.id, commentText)
      setCommentText("")
    }
  }

  // Добавим функцию для рендеринга модального окна подтверждения удаления
  const renderDeleteConfirmModal = () => {
    if (!showDeleteConfirm) return null

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
            <p className={styles.confirmText}>Вы уверены, что хотите удалить новость "{news.title}"?</p>

            <div className={styles.confirmActions}>
              <button className={styles.cancelButton} onClick={() => setShowDeleteConfirm(false)}>
                Отмена
              </button>
              <button
                className={styles.deleteButton}
                onClick={() => {
                  onDelete(news.id)
                  setShowDeleteConfirm(false)
                }}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      </div>
    )
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
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowDeleteConfirm(true)
              }}
              className={styles.adminActionButton}
              title="Удалить новость"
            >
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

      {/* Модальное окно подтверждения удаления */}
      {renderDeleteConfirmModal()}
    </div>
  )
}

// Компонент для добавления/редактирования новости
function AddNewsForm({ onAddNews, editingNews, setEditingNews, isAdmin, onUpdate, currentUser }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [validationError, setValidationError] = useState(false)
  const fileInputRef = useRef(null)
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
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result) // Показываем превью
        setImage(file) // Сохраняем файл для последующей отправки
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

    // Добавляем проверку
    if (!currentUser || !currentUser.id) {
      console.error("User not authenticated")
      alert("Вы должны быть авторизованы для публикации новостей")
      return
    }

    try {
      // Создаем объект с обязательными полями
      const newsData = {
        title: title.trim(),
        content: description.trim(),
        author_id: currentUser.id.toString(),
      }

      // Обработка изображения при редактировании
      if (editingNews) {
        if (image) {
          // Если выбрано новое изображение
          const reader = new FileReader()
          const imageBase64 = await new Promise((resolve) => {
            reader.onloadend = () => {
              const base64String = reader.result.split(",")[1]
              resolve(base64String)
            }
            reader.readAsDataURL(image)
          })
          newsData.image_data = imageBase64
          newsData.image_type = image.type
        } else if (imagePreview === null) {
          // Если изображение было удалено
          newsData.image_data = "null"
          newsData.image_type = ""
        }
        // Если imagePreview есть, но image нет - значит изображение не менялось
      } else {
        // Для новой новости
        if (image) {
          const reader = new FileReader()
          const imageBase64 = await new Promise((resolve) => {
            reader.onloadend = () => {
              const base64String = reader.result.split(",")[1]
              resolve(base64String)
            }
            reader.readAsDataURL(image)
          })
          newsData.image_data = imageBase64
          newsData.image_type = image.type
        }
      }

      let response

      if (editingNews) {
        response = await api.put(`/api/news/${editingNews.id}`, newsData)
      } else {
        response = await api.post("/api/news", newsData)
      }

      if (response.ok) {
        const responseData = await response.json()
        console.log("Server response:", responseData)

        onAddNews(responseData)
        resetForm()
        setEditingNews(null)

        // Перезагружаем список новостей
        if (onUpdate) {
          await onUpdate()
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save news")
      }
    } catch (error) {
      console.error("Error creating/updating news:", error)
      alert(`Ошибка при ${editingNews ? "обновлении" : "создании"} новости: ${error.message}`)
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
      // Вместо показа модального окна просто показываем предупреждение
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
        {/* Основное содержимое формы */}
        <>
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

          {showCancelWarning && (
            <div className={styles.warningMessage}>
              <p>У вас есть несохраненные изменения.</p>
              <div className={styles.warningActions}>
                <button
                  className={`${styles.warningButton} ${styles.continueEditingButton}`}
                  onClick={() => setShowCancelWarning(false)}
                >
                  Продолжить редактирование
                </button>
                <button className={`${styles.warningButton} ${styles.discardChangesButton}`} onClick={confirmCancel}>
                  Выйти без сохранения
                </button>
              </div>
            </div>
          )}

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
        </>
      </form>
    </div>
  )
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
              {event.speakers &&
                event.speakers.map((speaker) => (
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
  console.log("MainContent рендеринг")

  // Получаем контекст пользователя
  const { currentUser, isAdmin } = useUser()

  // Добавляем проверку на существование currentUser
  if (!currentUser) {
    console.log("currentUser не существует")
    return <div className={styles.loadingContainer}>Пожалуйста, войдите в систему</div>
  }

  // Проверяем наличие id у currentUser
  if (!currentUser.id) {
    console.log("currentUser.id не существует")
    return <div className={styles.loadingContainer}>Ошибка: информация о пользователе неполная</div>
  }

  // Теперь мы уверены, что userContext, currentUser и currentUser.id существуют
  return <MainContentAuthenticated currentUser={currentUser} isAdmin={isAdmin || false} />
}

// Выделяем логику для авторизованного пользователя в отдельный компонент
function MainContentAuthenticated({ currentUser, isAdmin }) {
  // Состояние для модального окна - выносим в начало для лучшей видимости
  const [showPortalModal, setShowPortalModal] = useState(false)
  const [editingPortal, setEditingPortal] = useState(null)

  const [news, setNews] = useState([])

  const [selectedBirthday, setSelectedBirthday] = useState(null)
  const [expandedBirthday, setExpandedBirthday] = useState(null)
  const [showCopyNotification, setShowCopyNotification] = useState(false)
  const [copiedText, setCopiedText] = useState("")
  const [editingNews, setEditingNews] = useState(null) // Состояние для редактирования

  // Состояния для управления порталами
  const [portals, setPortals] = useState([])
  const [editMode, setEditMode] = useState(false)
  const [showPortalMenu, setShowPortalMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Загрузка новостей
  const loadNews = useCallback(async () => {
    try {
      // Добавляем проверку на существование currentUser и currentUser.id
      if (!currentUser || !currentUser.id) {
        console.log("Пользователь не авторизован или отсутствует ID")
        return
      }

      const newsData = await api.get(`/api/news?current_user_id=${currentUser.id}`)
      const newsWithDefaults = newsData.map((item) => ({
        ...item,
        author: item.author_name,
        description: item.content,
        comments: item.comments || [],
        likes_count: item.likes_count || 0,
        liked: item.liked || false,
        isPinned: item.is_pinned === true || item.is_pinned === "t",
        pin_order: item.is_pinned !== null ? Number(item.pin_order) : null,
      }))

      const sortedNews = newsWithDefaults.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
        if (a.isPinned && b.isPinned) {
          return (a.pin_order || 0) - (b.pin_order || 0)
        }
        return new Date(b.publication_time) - new Date(a.publication_time)
      })

      setNews(sortedNews)
    } catch (error) {
      console.error("Error fetching news:", error)
    }
  }, [currentUser])

  // Функция за��рузки порталов
  const loadPortals = useCallback(async () => {
    console.log("Начинаем загрузку порталов...")
    try {
      console.log("Отправляем запрос к API...")
      const response = await api.get("/api/links")
      console.log("Получен ответ от API:", response)

      // Преобразуем ответ сервера в формат для отображения
      const formattedPortals = response.map((portal) => ({
        id: portal.id,
        name: portal.name,
        description: portal.description,
        url: portal.url,
        icon: portal.icon_emoji,
        iconPreview: portal.icon_data ? `data:${portal.icon_type};base64,${portal.icon_data}` : null,
      }))

      setPortals(formattedPortals)
    } catch (error) {
      console.error("Error loading portals:", error)
    }
  }, [])

  // Загружаем порталы при монтировании
  useEffect(() => {
    loadPortals()
  }, [loadPortals])

  // Обновим useEffect для WebSocket
  useEffect(() => {
    // Добавляем проверку
    if (!currentUser || !currentUser.id) {
      console.log("Пользователь не авторизован, не настраиваем WebSocket")
      return
    }

    loadNews()

    // Настройка обработчика сообщений WebSocket
    wsClient.setMessageHandler((data) => {
      switch (data.type) {
        case "news_updated":
          loadNews()
          break

        case "news_deleted":
          setNews((prevNews) => prevNews.filter((news) => news.id !== data.data.id))
          break

        case "news_pin_updated":
          if (data.data && typeof data.data.news_id === "number") {
            setNews((prevNews) => {
              const updatedNews = prevNews.map((news) => {
                if (news.id === data.data.news_id) {
                  return {
                    ...news,
                    isPinned: data.data.is_pinned,
                    pin_order: data.data.pin_order,
                  }
                }
                return news
              })

              return updatedNews.sort((a, b) => {
                if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
                if (a.isPinned && b.isPinned) {
                  return (a.pin_order || 0) - (b.pin_order || 0)
                }
                return new Date(b.publication_time) - new Date(a.publication_time)
              })
            })
          }
          break

        case "comment_added":
          if (data.data && data.newsId) {
            setNews((prevNews) =>
              prevNews.map((news) => {
                if (news.id === data.newsId) {
                  const commentExists = news.comments?.some((comment) => comment.id === data.data.id)

                  if (!commentExists) {
                    return {
                      ...news,
                      comments: [...(news.comments || []), data.data],
                    }
                  }
                }
                return news
              }),
            )
          }
          break

        case "likes_updated":
          if (data.data && data.data.news_id) {
            setNews((prevNews) =>
              prevNews.map((news) => {
                if (news.id === data.data.news_id) {
                  return {
                    ...news,
                    likes_count: data.data.likes_count,
                  }
                }
                return news
              }),
            )
          }
          break
        default:
          break
      }
    })

    // Очистка при размонтировании
    return () => {
      wsClient.setMessageHandler(null)
    }
  }, [loadNews, currentUser])

  // Обновим функцию handleLike
  const handleLike = async (newsId) => {
    try {
      // Добавляем проверку
      if (!currentUser || !currentUser.id) {
        console.log("Пользователь не авторизован или отсутствует ID")
        return
      }

      const response = await api.post(`/api/news/${Number.parseInt(newsId)}/like`, {
        employee_id: Number.parseInt(currentUser.id),
      })

      if (response.ok) {
        const data = await response.json()
        // Обновляем только состояние лайка текущего пользователя
        setNews((prevNews) =>
          prevNews.map((item) => {
            if (item.id === newsId) {
              return {
                ...item,
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

  // Обновим функцию handleAddComment
  const handleAddComment = async (newsId, text) => {
    try {
      // Добавляем проверку
      if (!currentUser || !currentUser.id) {
        console.log("Пользователь не авторизован или отсутствует ID")
        return
      }

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
    setEditingNews(newsItem)
    // Прокручиваем страницу к форме редактирования
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  // Функция для удаления новости
  const handleDeleteNews = async (newsId) => {
    try {
      const response = await api.delete(`/api/news/${newsId}`)
      if (response.ok) {
        // Удаляем новость локально только если она еще существует в состоянии
        setNews((prevNews) => prevNews.filter((news) => news.id !== newsId))
      } else {
        console.error("Error deleting news")
      }
    } catch (error) {
      console.error("Error deleting news:", error)
    }
  }

  // Функция для закрепления/открепления новости
  const handlePinNews = async (newsId, isPinned) => {
    try {
      const response = await api.post(`/api/news/${newsId}/pin`, {
        isPinned: isPinned,
      })

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to pin news")
      }

      // Обновление будет происходить через WebSocket
      console.log("News pin status updated successfully")
    } catch (error) {
      console.error("Error pinning news:", error)
      alert("Failed to update news pin status: " + error.message)
    }
  }

  // Функция для добавления нового портала
  const handleAddPortal = () => {
    console.log("Нажата кнопка создания нового портала")
    setEditingPortal(null)
    setShowPortalModal(true)
    console.log("showPortalModal установлен в:", true)
    setShowPortalMenu(false)
  }

  // Функция для редактирования портала
  const handleEditPortal = (portal) => {
    console.log("Редактирование портала:", portal)
    setEditingPortal(portal)
    setShowPortalModal(true)
  }

  // Функция для сохранения портала
  const handleSavePortal = async (portalData) => {
    try {
      let response
      if (!editingPortal) {
        response = await api.post("/api/links", portalData)
      } else {
        response = await api.put(`/api/links/${editingPortal.id}`, portalData)
      }

      if (response.ok) {
        // Перезагружаем список порталов
        await loadPortals()

        // Закрываем модальное окно
        setShowPortalModal(false)
        setEditingPortal(null)

        console.log("Портал успешно сохранен")
      } else {
        throw new Error("Ошибка при сохранении портала")
      }
    } catch (error) {
      console.error("Error saving portal:", error)
      alert("Ошибка при сохранении портала: " + error.message)
    }
  }

  const handleDeletePortal = async () => {
    if (!editingPortal || !editingPortal.id) return

    try {
      const response = await api.delete(`/api/links/${editingPortal.id}`)
      if (response.ok) {
        // Перезагружаем список порталов
        await loadPortals()

        // Закрываем модальное окно
        setShowDeleteConfirm(false)
        setEditingPortal(null)

        console.log("Портал успешно удален")
      } else {
        throw new Error("Ошибка при удалении портала")
      }
    } catch (error) {
      console.error("Error deleting portal:", error)
      alert("Ошибка при удалении портала: " + error.message)
    }
  }

  const handleAddNews = async (newNews) => {
    await loadNews()
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

  // Добавляем useEffect для блокировки прокрутки при открытии модальных окон
  useEffect(() => {
    // Блокировка прокрутки основного контейнера при открытии модальных окон
    const body = document.body
    if (showPortalModal || showDeleteConfirm) {
      body.style.overflow = "hidden"
    } else {
      body.style.overflow = "auto"
    }

    return () => {
      body.style.overflow = "auto"
    }
  }, [showPortalModal, showDeleteConfirm])

  // Добавляем useEffect для обработки клика вне меню порталов
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Проверяем, открыто ли меню и не является ли клик по самой кнопке меню
      if (showPortalMenu && !event.target.closest(".portalAdminControls")) {
        setShowPortalMenu(false)
      }
    }

    // Добавляем обработчик на весь документ
    document.addEventListener("mousedown", handleClickOutside)

    // Удаляем обработчик при размонтировании
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showPortalMenu])

  // Модальное окно подтверждения удаления портала
  const renderDeleteConfirmModal = () => {
    if (!editingPortal || !showDeleteConfirm) return null

    return (
      <div className={styles.modalOverlay}>
        <div className={styles.confirmModal}>
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>Подтверждение удаления</h2>
            <button
              className={styles.closeButton}
              onClick={() => {
                setShowDeleteConfirm(false)
                setEditingPortal(null)
              }}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <div className={styles.modalContent}>
            <p className={styles.confirmText}>Вы уверены, что хотите удалить портал "{editingPortal?.name}"?</p>

            <div className={styles.confirmActions}>
              <button
                className={styles.cancelButton}
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setEditingPortal(null)
                }}
              >
                Отмена
              </button>
              <button className={styles.deleteButton} onClick={handleDeletePortal}>
                Удалить
              </button>
            </div>
          </div>
        </div>
      </div>
    )
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
                currentUser={currentUser}
              />
            )}
            <div className={styles.newsList}>
              {news.map((item) => (
                <div key={item.id}>
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
                  <div className={`${styles.portalAdminControls} portalAdminControls`}>
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
                            handleAddPortal()
                            setShowPortalMenu(false)
                          }}
                        >
                          Добавить новый портал
                        </button>
                        <div className={styles.menuDivider}></div>
                        <button
                          className={styles.portalMenuItem}
                          onClick={() => {
                            setEditMode(!editMode)
                            setShowPortalMenu(false)
                          }}
                        >
                          {editMode ? "Выйти из режима редактирования" : "Редактировать порталы"}
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

              {/* Заменяем div с классом portalGrid на новую структуру */}
              <div className={styles.portalList}>
                {portals.map((portal, index) => (
                  <div key={portal.id}>
                    <div className={`${styles.portalContainer} ${editMode ? styles.portalContainerEditable : ""}`}>
                      <a
                        href={portal.url}
                        className={styles.portalLink}
                        onClick={(e) => {
                          if (editMode) {
                            e.preventDefault()
                            handleEditPortal(portal)
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
                        <div className={styles.editModeActions}>
                          <button
                            className={styles.editPortalButton}
                            onClick={() => handleEditPortal(portal)}
                            title="Редактировать"
                          >
                            <FontAwesomeIcon icon={faEdit} className={styles.editPortalIcon} />
                          </button>
                          <button
                            className={styles.deletePortalButton}
                            onClick={() => {
                              setEditingPortal(portal)
                              setShowDeleteConfirm(true)
                            }}
                            title="Удалить"
                          >
                            <FontAwesomeIcon icon={faTrash} className={styles.deletePortalIcon} />
                          </button>
                        </div>
                      )}
                    </div>
                    {index < portals.length - 1 && <div className={styles.portalDivider}></div>}
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
      <PortalModal
        isOpen={showPortalModal}
        onClose={() => {
          console.log("Закрытие модального окна")
          setShowPortalModal(false)
        }}
        initialData={editingPortal}
        onSave={handleSavePortal}
      />

      {/* Модальное окно подтверждения удаления */}
      {renderDeleteConfirmModal()}
    </main>
  )
}

export default MainContent
  