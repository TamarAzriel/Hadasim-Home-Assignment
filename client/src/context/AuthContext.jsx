import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [teacherId, setTeacherId] = useState(
    () => sessionStorage.getItem('teacherId') || ''
  );

  function login(id) {
    sessionStorage.setItem('teacherId', id);
    setTeacherId(id);
  }

  function logout() {
    sessionStorage.removeItem('teacherId');
    setTeacherId('');
  }

  return (
    <AuthContext.Provider value={{ teacherId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
