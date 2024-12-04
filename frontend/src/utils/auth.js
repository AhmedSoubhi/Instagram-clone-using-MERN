// src/utils/auth.js

import { jwtDecode } from 'jwt-decode'; // Named import
import axios from 'axios';

// Function to check if the user is authenticated
export const isAuthenticated = async () => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
        const decoded = jwtDecode(token); // Use the named function
        const currentTime = Date.now() / 1000;
        if (decoded.exp < currentTime) {
            // Token expired, attempt to refresh
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                try {
                    const res = await axios.post('/api/auth/token', { token: refreshToken });
                    localStorage.setItem('token', res.data.accessToken);
                    return true;
                } catch (refreshError) {
                    console.error('Error refreshing token:', refreshError);
                    // Optionally, remove tokens and redirect to login
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                    return false;
                }
            }
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error checking token authentication:', error);
        return false;
    }
};

// Function to decode and get user information from the token
export const getUserInfo = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return { id: payload.id, username: payload.username }; // Adjust based on your JWT payload
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
};

// Function to handle logout (if not already defined)
export const logout = () => {
    localStorage.removeItem('token');
    // Add any additional logout logic here (e.g., redirecting)
};