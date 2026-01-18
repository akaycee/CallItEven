import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const parsedUser = JSON.parse(userInfo);
      setUser(parsedUser);
      // Set default auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${parsedUser.token}`;
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    localStorage.setItem('userInfo', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
    setUser(userData);
    // Dispatch login event to load user's theme preference
    window.dispatchEvent(new CustomEvent('userLogin', { detail: userData }));
  };

  const logout = () => {
    localStorage.removeItem('userInfo');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    // Dispatch logout event to reset theme
    window.dispatchEvent(new CustomEvent('userLogout'));
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
