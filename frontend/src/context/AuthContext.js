import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [familyGroup, setFamilyGroup] = useState(null);

  const fetchFamilyGroup = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/family');
      setFamilyGroup(data);
    } catch {
      setFamilyGroup(null);
    }
  }, []);

  const login = useCallback((userData) => {
    localStorage.setItem('userInfo', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
    setUser(userData);
    // Dispatch login event to load user's theme preference
    window.dispatchEvent(new CustomEvent('userLogin', { detail: userData }));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('userInfo');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setFamilyGroup(null);
    // Dispatch logout event to reset theme
    window.dispatchEvent(new CustomEvent('userLogout'));
  }, []);

  useEffect(() => {
    // Check if user is logged in
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const parsedUser = JSON.parse(userInfo);
        setUser(parsedUser);
        // Set default auth header
        axios.defaults.headers.common['Authorization'] = `Bearer ${parsedUser.token}`;
      } catch (error) {
        // Clear corrupted localStorage data
        console.error('Error parsing user info:', error);
        localStorage.removeItem('userInfo');
      }
    }
    setLoading(false);

    // Global axios interceptor: auto-logout on 401
    const interceptorId = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptorId);
    };
  }, [logout]);

  // Fetch family group data when user is set
  useEffect(() => {
    if (user && !user.isAdmin) {
      fetchFamilyGroup();
    }
  }, [user, fetchFamilyGroup]);

  const value = useMemo(() => ({
    user,
    login,
    logout,
    loading,
    familyGroup,
    fetchFamilyGroup
  }), [user, login, logout, loading, familyGroup, fetchFamilyGroup]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
