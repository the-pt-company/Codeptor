import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    useEffect(() => {
        const checkAuth = async () => {
            if (token) {
                try {
                    const response = await authAPI.getMe();
                    setUser(response.data);
                } catch (error) {
                    console.error('Auth check failed:', error);
                    localStorage.removeItem('token');
                    setToken(null);
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, [token]);

    const login = async (email, password) => {
        const response = await authAPI.login({ email, password });
        const { access_token, user: userData } = response.data;
        localStorage.setItem('token', access_token);
        setToken(access_token);
        setUser(userData);
        return userData;
    };

    const register = async (userData) => {
        const response = await authAPI.register(userData);
        const { access_token, user: newUser } = response.data;
        localStorage.setItem('token', access_token);
        setToken(access_token);
        setUser(newUser);
        return newUser;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const googleLogin = async (credential) => {
        const response = await authAPI.googleLogin({ credential });
        const { access_token, user: userData } = response.data;
        localStorage.setItem('token', access_token);
        setToken(access_token);
        setUser(userData);
        return userData;
    };

    const updateUser = async (data) => {
        const response = await authAPI.updateMe(data);
        setUser(response.data);
        return response.data;
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        googleLogin,
        updateUser,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
