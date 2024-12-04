// frontend/src/contexts/AuthContext.jsx

import React, { createContext, useState, useEffect } from 'react';
import { getUserInfo, logout } from '../utils/auth';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const userInfo = getUserInfo();
        if (userInfo) {
            setUser(userInfo);
        } else {
            setUser(null);
        }
    }, []);

    const handleLogout = () => {
        logout();
        setUser(null);
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ user, setUser, handleLogout }}>
            {children}
        </AuthContext.Provider>
    );
};
