import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_URL } from '../utils/apiConfig';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { token, isAuthenticated } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data || []);
                setUnreadCount((data || []).filter(n => !n.read).length);
            }
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    const fetchUnreadCount = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/notifications/unread-count`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUnreadCount(data.count || 0);
            }
        } catch (err) {
            console.error('Failed to fetch unread count:', err);
        }
    }, [token]);

    useEffect(() => {
        if (isAuthenticated && token) {
            fetchUnreadCount();
            // Refresh count every 1 minute
            const interval = setInterval(fetchUnreadCount, 60000);
            return () => clearInterval(interval);
        } else {
            setUnreadCount(0);
            setNotifications([]);
        }
    }, [isAuthenticated, token, fetchUnreadCount]);

    const markAsRead = async (id) => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/notifications/${id}/read`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setNotifications(prev =>
                    prev.map(n => n._id === id ? { ...n, read: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
        }
    };

    const markAllRead = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/notifications/read-all`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                setUnreadCount(0);
            }
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    };

    return (
        <NotificationContext.Provider value={{
            unreadCount,
            notifications,
            loading,
            fetchNotifications,
            fetchUnreadCount,
            markAsRead,
            markAllRead
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotificationsContext = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotificationsContext must be used within a NotificationProvider');
    }
    return context;
};
