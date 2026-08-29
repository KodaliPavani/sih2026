import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      const data = response.data;

      const userObj = {
        userId: data.user_id,
        role: data.role,
        firstLogin: data.first_login,
        studentId: data.student_id,
        name: data.name,
      };

      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(userObj));
      setUser(userObj);

      return { success: true, data: userObj };
    } catch (error) {
      const msg = error.response?.data?.detail || 'Invalid username or password';
      return { success: false, error: msg };
    }
  };

  const resetPassword = async (newPassword, confirmPassword) => {
    try {
      const response = await api.post('/auth/reset-password', {
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      // Update user state to firstLogin = false
      const updatedUser = { ...user, firstLogin: false };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      return { success: true, message: response.data.message };
    } catch (error) {
      const msg = error.response?.data?.detail || 'Failed to reset password';
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, resetPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
