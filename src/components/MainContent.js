"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useUser } from "../context/UserContext" // Импортируем useUser
import { api } from "../utils/api"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faUser } from "@fortawesome/free-solid-svg-icons"

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
function NewsItem({ news, onLike, onAddComment }) {
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
    <div style={styles.newsItem}>
      <div style={styles.authorInfo}>
        <div style={styles.authorInfoContainer}>
          <div style={styles.authorAvatar}>
            <FontAwesomeIcon icon={faUser} style={{ fontSize: "24px", color: "#13454B" }} />
          </div>
          <div style={styles.authorDetails}>
            <strong style={styles.authorName}>{news.author_name}</strong>
            <span style={styles.newsTime}>{formatDateTime(news.publication_time)}</span>
          </div>
        </div>
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

// Компонент для добавления новости
function AddNewsForm({ onAddNews }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [validationError, setValidationError] = useState(false)
  const fileInputRef = useRef(null)
  const { currentUser } = useUser()

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
      formData.append("author_id", currentUser.id.toString())

      if (image) {
        // Получаем содержимое файла как ArrayBuffer
        const imageBuffer = await image.arrayBuffer()
        // Создаем Blob из ArrayBuffer
        const imageBlob = new Blob([imageBuffer], { type: image.type })
        formData.append("image_data", imageBlob, image.name)
        formData.append("image_type", image.type)
      }

      console.log("Sending form data:", formData) // Для отладки

      const response = await api.postFormData("/api/news", formData)

      if (response.ok) {
        const newNews = await response.json()
        console.log("New news response:", newNews) // Для отладки
        onAddNews(newNews)
        resetForm()
      } else {
        const errorText = await response.text()
        console.error("Error response:", errorText)
      }
    } catch (error) {
      console.error("Error creating news:", error)
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

        {isExpanded && (
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
                <button type="button" onClick={resetForm} style={styles.cancelButton}>
                  Отмена
                </button>
                <button type="submit" style={styles.publishButton}>
                  Опубликовать
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

// Основной компонент MainContent
function MainContent() {
  const [news, setNews] = useState([])
  const { currentUser } = useUser()

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
        // Время приходит в UTC, так и оставляем его в UTC
        publication_time: item.publication_time,
      }))
      setNews(newsWithDefaults)
    } catch (error) {
      console.error("Error fetching news:", error)
    }
  }, [currentUser.id])

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

  const internalPortals = [
    { id: 1, name: "HR Портал", url: "#" },
    { id: 2, name: "База знаний", url: "#" },
    { id: 3, name: "IT Поддержка", url: "#" },
    { id: 4, name: "Документация", url: "#" },
    { id: 5, name: "Обучение", url: "#" },
  ]

  const birthdays = [
    {
      id: 1,
      name: "Иван Иванов",
      date: "15 мая 2023",
      department: "Отдел разработки",
      photo: null,
    },
    {
      id: 2,
      name: "Мария Петрова",
      date: "20 мая 2023",
      department: "Бухгалтерия",
      photo: null,
    },
  ]

  const handleAddNews = async (newNews) => {
    await loadNews()
  }

  return (
    <main style={styles.main}>
      <div style={styles.contentWrapper}>
        <div style={styles.leftColumn}>
          <div style={{ ...styles.block, ...styles.newsBlock }}>
            <h2 style={styles.heading}>Новости и статьи</h2>
            <AddNewsForm onAddNews={handleAddNews} />
            <div style={styles.newsList}>
              {news.map((item) => (
                <NewsItem key={item.id} news={item} onLike={handleLike} onAddComment={handleAddComment} />
              ))}
            </div>
          </div>
        </div>

        <div style={styles.rightColumn}>
          <div style={styles.rightColumnFixed}>
            <div style={{ ...styles.block, ...styles.portalBlock }}>
              <h2 style={styles.heading}>Внутренние порталы</h2>
              <div style={styles.portalGrid}>
                {internalPortals.map((portal) => (
                  <a key={portal.id} href={portal.url} style={styles.portalLink}>
                    <span style={styles.portalName}>{portal.name}</span>
                  </a>
                ))}
              </div>
            </div>
            <div style={{ ...styles.block, ...styles.birthdayBlock }}>
              <h2 style={styles.heading}>Ближайшие дни рождения</h2>
              <div style={styles.birthdayList}>
                {birthdays.map((person) => (
                  <div key={person.id} style={styles.birthdayItem}>
                    <div style={styles.birthdayAvatar}>
                      {person.photo ? (
                        <img src={person.photo || "/placeholder.svg"} alt={person.name} style={styles.birthdayPhoto} />
                      ) : (
                        <FontAwesomeIcon icon={faUser} style={{ fontSize: "24px", color: "#13454B" }} />
                      )}
                    </div>
                    <div style={styles.birthdayInfo}>
                      <p style={styles.birthdayName}>{person.name}</p>
                      <p style={styles.birthdayDepartment}>{person.department}</p>
                    </div>
                    <div style={styles.birthdayDate}>
                      <span>{person.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
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
    height: "calc(100vh - 72px)",
    fontFamily: fonts.main,
    backgroundColor: colors.background,
    overflowY: "auto",
    padding: "1rem",
  },
  contentWrapper: {
    display: "flex",
    width: "100%",
    gap: "1rem",
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
    color: colors.primary,
    borderBottom: `2px solid ${colors.secondary}`,
    fontFamily: fonts.main,
    fontWeight: 600,
    fontSize: "36px",
    lineHeight: "45px",
    letterSpacing: "0.5px",
    padding: "15px 0 12px 0",
    marginBottom: "20px",
  },
  portalGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
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
    borderBottom: "1px solid #e0e0e0",
  },
  portalName: {
    textAlign: "left",
    fontFamily: "'Manrope', Arial, sans-serif",
    fontWeight: 500,
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
  },
  newsHeader: {
    marginBottom: "1rem",
  },
  authorInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
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
    color: colors.primary,
  },
  birthdayDepartment: {
    margin: 0,
    fontSize: "12px",
    color: "#777",
  },
  birthdayDate: {
    fontSize: "14px",
    color: colors.lightText,
    marginLeft: "1rem",
  },
}

export default MainContent

