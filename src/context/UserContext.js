"use client"

import { createContext, useContext, useState } from "react"

// Создаем контекст
const UserContext = createContext()

// Провайдер контекста
export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)

  // Функция для обновления пользователя
  const updateUser = (userData) => {
    setCurrentUser(userData)
    // Проверяем, является ли пользователь администратором
    setIsAdmin(userData?.is_admin === "t" || userData?.is_admin === true)
  }

  // Функция для выхода из системы
  const logout = () => {
    setCurrentUser(null)
    setIsAdmin(false)
    localStorage.removeItem("rememberedLogin")
  }

  return (
    <UserContext.Provider value={{ currentUser, isAdmin, setCurrentUser: updateUser, logout, updateUser }}>
      {children}
    </UserContext.Provider>
  )
}

// Хук для использования контекста
export function useUser() {
  return useContext(UserContext)
}

