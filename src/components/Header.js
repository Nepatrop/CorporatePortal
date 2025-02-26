import { useState } from "react";
import logo from '../logo-white.svg'; // Исправленный путь к логотипу

function Header() {
  const [notifications, setNotifications] = useState(0);

  return (
    <header style={styles.header}>
      <div style={styles.logoContainer}>
        <img
          src={logo} // Используем импортированный логотип
          alt="ИТ-Элемент29 Logo"
          style={styles.logo}
        />
      </div>
      <nav style={styles.nav}>
        <button style={styles.button}>Личный кабинет</button>
        <button style={styles.button}>Настройки</button>
        <button style={styles.button} onClick={() => setNotifications((prev) => prev + 1)}>
          Уведомления ({notifications})
        </button>
      </nav>
    </header>
  );
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
  };

export default Header;