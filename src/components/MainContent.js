"use client"

import { useState } from "react"

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
  )
}

// Компонент NewsItem
function NewsItem({ news, onLike, onAddComment }) {
  const [commentText, setCommentText] = useState("")

  const handleSubmitComment = (e) => {
    e.preventDefault()
    if (commentText.trim()) {
      onAddComment(news.id, commentText)
      setCommentText("")
    }
  }

  return (
    <div style={styles.newsItem}>
      <h3 style={styles.newsTitle}>{news.title}</h3>
      <p style={styles.newsDescription}>{news.description}</p>
      <img src={news.image || "/placeholder.svg"} alt={news.title} style={styles.newsImage} />
      <div style={styles.newsFooter}>
        <span style={styles.newsDate}>{news.date}</span>
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
  )
}

// Основной компонент MainContent
function MainContent() {
  const internalPortals = [
    { id: 1, name: "HR Портал", url: "#", icon: "👥" },
    { id: 2, name: "База знаний", url: "#", icon: "🎓" },
    { id: 3, name: "IT Поддержка", url: "#", icon: "💻" },
    { id: 4, name: "Документация", url: "#", icon: "📄" },
    { id: 5, name: "Обучение", url: "#", icon: "🎓" },
  ]

  const [news, setNews] = useState([
    {
      id: 1,
      title: "Новый проект запущен",
      date: "2023-05-15",
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
      date: "2023-05-10",
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
      date: "2023-05-05",
      description: "Доступны новые курсы обучения для всех сотрудников. Успейте записаться!",
      image:
        "https://img.freepik.com/free-photo/team-process-creation_23-2147656721.jpg?ga=GA1.1.813541660.1734266620&semt=ais_hybrid",
      likes: 0,
      liked: false,
      comments: [],
    },
  ])

  const birthdays = [
    { id: 1, name: "Иван Иванов", date: "15 мая" },
    { id: 2, name: "Мария Петрова", date: "20 мая" },
  ]

  const handleLike = (id) => {
    setNews(
      news.map((item) =>
        item.id === id ? { ...item, likes: item.liked ? item.likes - 1 : item.likes + 1, liked: !item.liked } : item,
      ),
    )
  }

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
    )
  }

  return (
    <main style={styles.main}>
      <div style={styles.leftColumn}>
        <div style={{ ...styles.block, ...styles.newsBlock }}>
          <h2 style={styles.heading}>Новости и статьи</h2>
          <div style={styles.newsList}>
            {news.map((item) => (
              <NewsItem key={item.id} news={item} onLike={handleLike} onAddComment={handleAddComment} />
            ))}
          </div>
        </div>
      </div>
      <div style={styles.rightColumn}>
        <div style={{ ...styles.block, ...styles.portalBlock }}>
          <h2 style={styles.heading}>Внутренние порталы</h2>
          <div style={styles.portalGrid}>
            {internalPortals.map((portal) => (
              <a key={portal.id} href={portal.url} style={styles.portalLink}>
                <div style={styles.portalIcon}>{portal.icon}</div>
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
    </main>
  )
}

const colors = {
  primary: "#13454B",
  secondary: "#EE6B0C",
  background: "#FFFFFF",
  text: "#333",
  lightText: "#B3B3B3",
};

const fonts = {
  main: "'Manrope', Arial, sans-serif",
  secondary: "'Arial', sans-serif",
};

const baseBlockStyles = {
  backgroundColor: colors.background,
  borderRadius: "8px",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  padding: "1.5rem",
};

const styles = {
  main: {
    display: "flex",
    height: "calc(100vh - 72px)",
    fontFamily: fonts.main,
    overflowX: "hidden",
    padding: "1rem",
  },
  leftColumn: {
    flex: "0 0 60%",
    padding: "2rem",
    backgroundColor: colors.background,
    boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
    borderRadius: "8px",
    marginRight: "1rem",
    overflowY: "auto",
    boxSizing: "border-box",
  },
  rightColumn: {
    flex: "0 0 40%",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    boxSizing: "border-box",
    paddingRight: "1rem",
  },
  block: {
    ...baseBlockStyles,
    flex: 1,
    overflow: "hidden",
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
    marginBottom: "40px",
  },
  portalGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: "1.5rem",
  },
  portalLink: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textDecoration: "none",
    color: colors.primary,
    transition: "transform 0.2s",
  },
  portalIcon: {
    fontSize: "2rem",
    marginBottom: "0.5rem",
  },
  portalName: {
    textAlign: "center",
    fontFamily: fonts.main,
    fontWeight: 300,
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
    ...baseBlockStyles,
    flex: 2,
    backgroundColor: "transparent", // Убираем фон
    boxShadow: "none", // Убираем тень
  },
  newsList: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  newsItem: {
    ...baseBlockStyles,
    padding: "1rem",
    marginBottom: "1rem",
  },
  newsImage: {
    width: "100%",
    height: "auto",
    objectFit: "cover",
    borderRadius: "4px",
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
  },
  newsFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
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
    color: colors.background,
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
};

export default MainContent