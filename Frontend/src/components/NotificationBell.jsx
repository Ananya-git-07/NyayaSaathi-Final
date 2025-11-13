// --- THIS IS A NEW FILE ---
// FILE: src/components/NotificationBell.jsx

import { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { notifications, setNotifications, unreadCount, setUnreadCount } = useAuth();
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = async (notification) => {
        if (!notification.isRead) {
            try {
                await apiClient.patch(`/notifications/${notification._id}/mark-read`);
                setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n));
                setUnreadCount(prev => prev - 1);
            } catch (error) {
                console.error("Failed to mark notification as read", error);
            }
        }
        setIsOpen(false);
        navigate(notification.link || '/dashboard');
    };

    const handleMarkAllRead = async () => {
        try {
            await apiClient.patch('/notifications/mark-all-read');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 rounded-full text-slate-500 hover:bg-slate-200 transition-colors">
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs font-bold ring-2 ring-white">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200 z-50">
                    <div className="p-3 flex justify-between items-center border-b">
                        <h3 className="font-semibold text-slate-800">Notifications</h3>
                        {unreadCount > 0 && (
                            <button onClick={handleMarkAllRead} className="text-xs text-cyan-600 hover:underline flex items-center gap-1">
                                <CheckCheck size={14} /> Mark all as read
                            </button>
                        )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.map(n => (
                                <div key={n._id} onClick={() => handleNotificationClick(n)} className={`p-3 border-b border-slate-100 cursor-pointer hover:bg-slate-50 ${!n.isRead ? 'bg-cyan-50' : ''}`}>
                                    <p className="text-sm text-slate-700">{n.message}</p>
                                    <p className="text-xs text-slate-500 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                                </div>
                            ))
                        ) : (
                            <p className="p-4 text-center text-sm text-slate-500">No new notifications.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;