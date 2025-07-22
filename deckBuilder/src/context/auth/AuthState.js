// Mock AuthState for standalone deck builder
import React, { createContext, useContext } from 'react';

const AuthContext = createContext();

export const AuthState = ({ children }) => {
  const state = {
    isAuthenticated: false,
    user: null,
    token: null,
    loading: false
  };

  return (
    <AuthContext.Provider value={state}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;