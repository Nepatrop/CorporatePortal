"use client"

import { useState } from "react";
import { UserProvider } from './context/UserContext'; // Импортируем UserProvider
import Header from "./components/Header";
import MainContent from "./components/MainContent";
import EmployeeDirectory from "./components/EmployeeDirectory";
import Login from "./components/Login";

function App() {
  const [currentPage, setCurrentPage] = useState("login"); // Изменено на "login" по умолчанию
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    setCurrentPage("home");
  };

  // Если пользователь не аутентифицирован, показываем экран логина
  if (!isAuthenticated) {
    return (
      <UserProvider> {/* Оборачиваем Login в UserProvider */}
        <Login onLogin={handleLogin} />
      </UserProvider>
    );
  }

  return (
    <UserProvider> {/* Оборачиваем приложение в UserProvider */}
      <div className="App" style={styles.app}>
        {currentPage === "home" ? (
          <>
            <Header onNavigate={handleNavigate} />
            <MainContent />
          </>
        ) : currentPage === "directory" ? (
          <EmployeeDirectory onNavigate={handleNavigate} />
        ) : null}
      </div>
    </UserProvider>
  );
}

const styles = {
  app: {
    fontFamily: "'Manrope', Arial, sans-serif",
    backgroundColor: "#FFFFFF", // Изменено на белый фон
    minHeight: "100vh",
  },
};

export default App;

