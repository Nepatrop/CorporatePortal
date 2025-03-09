"use client"

import { useState } from "react"
import logo from "../logo-white.svg"

function Header({ onNavigate }) {
  const [notifications, setNotifications] = useState(0)

  return (
    <header style={styles.header}>
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

      <div style={styles.centerNav}>
        <button
          style={styles.textButton}
          onClick={(e) => {
            e.preventDefault()
            if (onNavigate) onNavigate("directory")
          }}
        >Справочник сотрудников
        </button>
      </div>

      <nav style={styles.nav}>
        <button style={styles.button}>Личный кабинет</button>
        <button style={styles.button}>Настройки</button>
        <button style={styles.button}>Уведомления</button>
      </nav>
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
  logoContainer: {
    display: "flex",
    alignItems: "center",
  },
  logoLink: {
    cursor: "pointer",
  },
  logo: {
    height: "40px",
    marginRight: "1rem",
  },
  nav: {
    display: "flex",
    gap: "1rem",
  },
  button: {
    padding: "0.5rem 1rem",
    border: "none",
    borderRadius: "4px",
    backgroundColor: "#EE6B0C", // ОРАНЖЕВЫЙ
    color: "#FFFFFF", // БЕЛЫЙ
    cursor: "pointer",
    transition: "background-color 0.3s",
    fontFamily: "'Manrope', Arial, sans-serif", // Основной шрифт
    fontWeight: 500, // Medium для заголовков и кнопок
  },
  centerNav: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
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

