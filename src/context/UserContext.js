import { createContext, useContext, useState } from 'react';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('rememberedLogin');
  };

  const updateUser = (updatedData) => {
    setCurrentUser(prev => ({
      ...prev,
      ...updatedData
    }));
  };

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, logout, updateUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}