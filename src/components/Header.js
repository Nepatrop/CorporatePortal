"use client"

import { useState, useRef, useEffect } from "react"
import logo from "../logo-white.svg"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faUser, faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons"
import { useUser } from '../context/UserContext'; // Импортируем useUser

function Header({ onNavigate }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const { currentUser, logout } = useUser(); // Используем контекст пользователя

  // Закрываем меню при клике вне его
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Обработчик переключения меню
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
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
      <div style={styles.userInfoContainer}>
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
        <div style={styles.menuToggle} onClick={toggleMenu}>
          <FontAwesomeIcon icon={isMenuOpen ? faChevronUp : faChevronDown} style={styles.menuIcon} />
        </div>

        {/* Выпадающее меню */}
        {isMenuOpen && (
          <div style={styles.dropdownMenu} ref={menuRef}>
            <div
              style={styles.menuItem}
              onClick={() => {
                setIsMenuOpen(false)
                // Здесь будет переход на страницу профиля
                console.log("Переход в профиль")
              }}
            >
              Мой профиль
            </div>
            <div
              style={styles.menuItem}
              onClick={() => {
                setIsMenuOpen(false)
                // Здесь будет переход на страницу уведомлений
                console.log("Переход в уведомления")
              }}
            >
              Уведомления
            </div>
            <div
              style={styles.menuItem}
              onClick={() => {
                setIsMenuOpen(false)
                // Здесь будет переход на страницу настроек
                console.log("Переход в настройки")
              }}
            >
              Настройки
            </div>
            <div
              style={{ ...styles.menuItem, ...styles.logoutItem }}
              onClick={() => {
                setIsMenuOpen(false)
                // Логика выхода из аккаунта
                logout()
                if (onNavigate) onNavigate("login")
              }}
            >
              Выйти
            </div>
          </div>
        )}
      </div>
    </header>
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
  menuToggle: {
    marginLeft: "8px",
    cursor: "pointer",
    padding: "5px",
  },
  menuIcon: {
    fontSize: "14px",
    color: "#FFFFFF",
  },
  dropdownMenu: {
    position: "absolute",
    top: "calc(100% + 5px)",
    left: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: "4px",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
    width: "200px",
    zIndex: 1000,
  },
  menuItem: {
    padding: "12px 16px",
    color: "#333333",
    fontSize: "14px",
    cursor: "pointer",
    transition: "background-color 0.2s",
    "&:hover": {
      backgroundColor: "#F5F5F5",
    },
  },
  logoutItem: {
    borderTop: "1px solid #E0E0E0",
    color: "#EE6B0C", // ОРАНЖЕВЫЙ
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
}

export default Header