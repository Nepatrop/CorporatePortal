import { createContext, useContext, useState } from 'react';

// Создаем контекст
const UserContext = createContext();

// Провайдер контекста
export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);

  // Функция для обновления данных пользователя
  const updateUser = (userData) => {
    setCurrentUser(userData);
    // Можно также сохранить в localStorage для персистентности
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // Функция для выхода пользователя
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('user');
  };

  return (
    <UserContext.Provider value={{ 
      currentUser, 
      setCurrentUser: updateUser,
      logout 
    }}>
      {children}
    </UserContext.Provider>
  );
}

// Хук для использования контекста
export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}