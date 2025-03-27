"use client"

import { useState } from "react"
import { UserProvider } from "./context/UserContext"
import Header from "./components/Header"
import MainContent from "./components/MainContent"
import EmployeeDirectory from "./components/EmployeeDirectory"
import Login from "./components/Login"
import styles from "./styles/App.module.css"

function App() {
  const [currentPage, setCurrentPage] = useState("login")
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const handleNavigate = (page) => {
    setCurrentPage(page)
  }

  const handleLogin = () => {
    setIsAuthenticated(true)
    setCurrentPage("home")
  }

  // Если пользователь не аутентифицирован, показываем экран логина
  if (!isAuthenticated) {
    return (
      <UserProvider>
        <Login onLogin={handleLogin} />
      </UserProvider>
    )
  }

  return (
    <UserProvider>
      <div className={styles.app}>
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
  )
}

export default App

