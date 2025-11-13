// PASTE THIS ENTIRE FILE INTO src/context/AuthContext.jsx

import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const logout = useCallback(async () => {
        try {
            await apiClient.post('/auth/logout');
        } catch (error) {
            console.error("Server logout request failed (this is often okay):", error);
        } finally {
            localStorage.removeItem('accessToken'); 
            setUser(null);
            setIsAuthenticated(false);
            navigate('/login', { replace: true });
        }
    }, [navigate]);
    
    useEffect(() => {
        const checkAuthStatus = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await apiClient.get('/auth/current-user');
                if (response.data?.success) {
                    setUser(response.data.data);
                    setIsAuthenticated(true);
                } else {
                    throw new Error("Invalid user session data.");
                }
            } catch (error) {
                console.warn("Auth check failed. Forcing logout.");
                logout(); 
            } finally {
                setIsLoading(false);
            }
        };
        checkAuthStatus();
    }, [logout]);
    
    const login = async (email, password) => {
        const response = await apiClient.post('/auth/login', { email, password });
        if (response.data?.success) {
            const { accessToken, user } = response.data.data;
            localStorage.setItem('accessToken', accessToken);
            setUser(user);
            setIsAuthenticated(true);
            const targetPath = user.role === 'admin' ? '/admin' : '/dashboard';
            navigate(targetPath, { replace: true });
            toast.success('Login successful!');
        }
        return response.data;
    };
    
    const register = async (userData) => {
        try {
            const response = await apiClient.post('/auth/register', userData);
            if (response.data?.success) {
                toast.success('Registration successful! Logging you in...');
                await login(userData.email, userData.password);
            }
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Registration failed.';
            toast.error(errorMessage);
            throw new Error(errorMessage);
        }
    };

    const updateAvatar = async (avatarFile) => {
        const toastId = toast.loading("Uploading new avatar...");
        try {
            const formData = new FormData();
            formData.append("avatar", avatarFile);
    
            const response = await apiClient.put("/users/update-avatar", formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
    
            if (response.data.success) {
                toast.success("Avatar updated!", { id: toastId });
                setUser(response.data.data);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update avatar.", { id: toastId });
        }
    };
    
    const deleteAvatar = async () => {
        const toastId = toast.loading("Removing avatar...");
        try {
            const response = await apiClient.delete("/users/remove-avatar");
            if (response.data.success) {
                toast.success("Avatar removed!", { id: toastId });
                setUser(response.data.data);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to remove avatar.", { id: toastId });
        }
    };

    if (isLoading) {
        return (
            // --- THIS IS THE FIX: Made the loading screen theme-aware ---
            <div className="flex h-screen w-full items-center justify-center bg-white dark:bg-slate-900">
                <Spinner />
            </div> 
        );
    }

    const value = { user, setUser,  isAuthenticated, isLoading, login, logout, register, updateAvatar, deleteAvatar };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};