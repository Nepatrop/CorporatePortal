"use client";

import { useState, useRef } from "react";
import { useUser } from '../context/UserContext'; // Импортируем useUser

// Компонент Comment
function Comment({ comment }) {
  return (
    <div style={styles.comment}>
      <img src={comment.avatar || "/placeholder.svg"} alt={comment.user} style={styles.avatar} />
      <div style={styles.commentContent}>
        <strong style={styles.userName}>{comment.user}</strong>
        <p style={styles.commentText}>{comment.text}</p>
      </div>
    </div>
  );
}

// Компонент NewsItem
function NewsItem({ news, onLike, onAddComment }) {
  const [commentText, setCommentText] = useState("");

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (commentText.trim()) {
      onAddComment(news.id, commentText);
      setCommentText("");
    }
  };

  // Форматирование времени
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div style={styles.newsItem}>
      <div style={styles.newsHeader}>
        <div style={styles.authorInfo}>
          <strong style={styles.authorName}>{news.author || "Администратор"}</strong>
          <span style={styles.newsTime}>
            {formatTime(news.date)} {new Date(news.date).toLocaleDateString("ru-RU")}
          </span>
        </div>
      </div>

      <h3 style={styles.newsTitle}>{news.title}</h3>
      <p style={styles.newsDescription}>{news.description}</p>

      {news.image && <img src={news.image || "/placeholder.svg"} alt={news.title} style={styles.newsImage} />}

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
          <span style={styles.likeCount}>{news.likes}</span>
        </button>
      </div>

      <div style={styles.commentsSection}>
        <h4 style={styles.commentsHeader}>Комментарии</h4>
        {news.comments.map((comment, index) => (
          <Comment key={index} comment={comment} />
        ))}
        <form onSubmit={handleSubmitComment} style={styles.commentForm}>
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Поделиться мыслями..."
            style={styles.commentInput}
          />
          <button type="submit" style={styles.commentSubmit}>
            Отправить
          </button>
        </form>
      </div>
    </div>
  );
}

// Компонент для добавления новости
function AddNewsForm({ onAddNews }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [validationError, setValidationError] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setValidationError(true);
      return;
    }

    const newNews = {
      id: Date.now(),
      title,
      description,
      image: imagePreview,
      date: new Date().toISOString(),
      author: "Текущий пользователь",
      likes: 0,
      liked: false,
      comments: [],
    };

    onAddNews(newNews);
    resetForm();
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setImage(null);
    setImagePreview(null);
    setValidationError(false);
    setIsExpanded(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleInputClick = () => {
    if (!isExpanded) {
      setIsExpanded(true);
    }
  };

  const handleAttachClick = (e) => {
    e.preventDefault();
    fileInputRef.current.click();
  };

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
                <img src={imagePreview} alt="Предпросмотр" style={styles.imagePreview} />
                <button
                  type="button"
                  onClick={() => {
                    setImage(null);
                    setImagePreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
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
  );
}

// Основной компонент MainContent
function MainContent() {
  const { currentUser } = useUser(); // Используем контекст пользователя

  const internalPortals = [
    { id: 1, name: "HR Портал", url: "#" },
    { id: 2, name: "База знаний", url: "#" },
    { id: 3, name: "IT Поддержка", url: "#" },
    { id: 4, name: "Документация", url: "#" },
    { id: 5, name: "Обучение", url: "#" },
  ];

  const [news, setNews] = useState([
    {
      id: 1,
      title: "Новый проект запущен",
      date: "2023-05-15T10:30:00",
      author: "Иванов Иван Иванович",
      description: "Мы рады сообщить о запуске нового проекта, который поможет оптимизировать рабочие процессы.",
      image:
        "https://img.freepik.com/free-photo/desk-real-estate-office_23-2147653310.jpg?ga=GA1.1.813541660.1734266620&semt=ais_hybrid",
      likes: 0,
      liked: false,
      comments: [
        {
          user: "Анна Анновна",
          avatar: "https://i.pinimg.com/736x/9f/e5/06/9fe5060dabf67f1d5f76b6e52f50c155.jpg",
          text: "Отличная новость! Жду не дождусь начала работы над проектом.",
        },
        {
          user: "Иван Иванов",
          avatar: "https://i.pinimg.com/736x/2b/70/ac/2b70acd9b98a0d769a175f1bd4313fec.jpg",
          text: "Интересно, какие технологии будут использоваться?",
        },
      ],
    },
    {
      id: 2,
      title: "Корпоративное мероприятие",
      date: "2023-05-10T15:45:00",
      author: "Петрова Мария Сергеевна",
      description: "Не забудьте зарегистрироваться на корпоративное мероприятие, которое состоится в конце месяца.",
      image:
        "https://img.freepik.com/free-photo/colleagues-having-fun-business-event_23-2149370528.jpg?ga=GA1.1.813541660.1734266620&semt=ais_hybrid",
      likes: 0,
      liked: false,
      comments: [],
    },
    {
      id: 3,
      title: "Новые курсы обучения",
      date: "2023-05-05T09:15:00",
      author: "Сидоров Алексей Петрович",
      description: "Доступны новые курсы обучения для всех сотрудников. Успейте записаться!",
      image:
        "https://img.freepik.com/free-photo/team-process-creation_23-2147656721.jpg?ga=GA1.1.813541660.1734266620&semt=ais_hybrid",
      likes: 0,
      liked: false,
      comments: [],
    },
  ]);

  const birthdays = [
    { id: 1, name: "Иван Иванов", date: "15 мая" },
    { id: 2, name: "Мария Петрова", date: "20 мая" },
  ];

  const handleLike = (id) => {
    setNews(
      news.map((item) =>
        item.id === id ? { ...item, likes: item.liked ? item.likes - 1 : item.likes + 1, liked: !item.liked } : item,
      ),
    );
  };

  const handleAddComment = (id, text) => {
    setNews(
      news.map((item) =>
        item.id === id
          ? {
              ...item,
              comments: [
                ...item.comments,
                { user: "Текущий пользователь", avatar: "https://i.pravatar.cc/40?img=5", text: text },
              ],
            }
          : item,
      ),
    );
  };

  const handleAddNews = (newNews) => {
    if (currentUser) {
      const newsWithAuthor = {
        ...newNews,
        author: currentUser.full_name, // Используем имя текущего пользователя
        author_id: currentUser.id, // Добавляем ID пользователя
        author_position: currentUser.position, // Добавляем должность пользователя
      };
      setNews([newsWithAuthor, ...news]);
    } else {
      console.error("Пользователь не авторизован");
    }
  };

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
              <ul style={styles.list}>
                {birthdays.map((person) => (
                  <li key={person.id} style={styles.listItem}>
                    <p>
                      {person.name} - <span style={styles.date}>{person.date}</span>
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// Стили
const colors = {
  primary: "#13454B",
  secondary: "#EE6B0C",
  background: "#F5F5F5",
  blockBackground: "#FFFFFF",
  text: "#333",
  lightText: "#B3B3B3",
};

const fonts = {
  main: "'Manrope', Arial, sans-serif",
  secondary: "'Arial', sans-serif",
};

const baseBlockStyles = {
  backgroundColor: colors.blockBackground,
  borderRadius: "8px",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  padding: "1.5rem",
};

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
};

export default MainContent;