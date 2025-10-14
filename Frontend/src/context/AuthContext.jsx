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
            console.error("Logout request failed:", error);
        } finally {
            localStorage.removeItem('accessToken'); // Ensure token is cleared from localStorage
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
                // The interceptor automatically adds the token from localStorage to this request.
                const response = await apiClient.get('/auth/current-user');
                if (response.data?.success) {
                    setUser(response.data.data);
                    setIsAuthenticated(true);
                }
            } catch (error) {
                localStorage.removeItem('accessToken');
                setUser(null);
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };
        checkAuthStatus();
    }, []);
    
    const login = async (email, password) => {
        const response = await apiClient.post('/auth/login', { email, password });
        if (response.data?.success) {
            const { accessToken, user } = response.data.data;
            localStorage.setItem('accessToken', accessToken); // Store the token
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

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-white">
                <Spinner />
            </div> 
        );
    }

    const value = { user, isAuthenticated, isLoading, login, logout, register };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};