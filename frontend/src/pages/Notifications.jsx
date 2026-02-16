import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/apiConfig';
import {
    Bell, Check, Trash2, Eye, Filter, RefreshCw,
    AlertTriangle, Briefcase, MessageCircle, Info
} from 'lucide-react';

const Notifications = () => {
    const { t } = useLanguage();
    const { token, logout } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        if (token) {
            fetchNotifications();
        }
    }, [token]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.status === 401) {
                logout();
                navigate('/login');
                return;
            }

            const data = await res.json();
            setNotifications(data || []);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        }
        setLoading(false);
    };

    const markAsRead = async (id) => {
        try {
            await fetch(`${API_URL}/notifications/${id}/read`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, read: true } : n)
            );
        } catch (err) {
            console.error('Failed to mark as read', err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch(`${API_URL}/notifications/read-all`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (err) {
            console.error('Failed to mark all as read', err);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'alert':
                return <AlertTriangle className="text-red-500" size={20} />;
            case 'service':
                return <Briefcase className="text-blue-500" size={20} />;
            case 'message':
                return <MessageCircle className="text-green-500" size={20} />;
            default:
                return <Info className="text-gray-500" size={20} />;
        }
    };

    const filteredNotifications = filter === 'all'
        ? notifications
        : filter === 'unread'
            ? notifications.filter(n => !n.read)
            : notifications.filter(n => n.type === filter);

    const unreadCount = notifications.filter(n => !n.read).length;

    if (loading) {
        return (
            <div className="p-8 text-center text-gray-500">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                {t('loading_notifications')}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 pb-24">
            {/* Header */}
            <div className="bg-gradient-to-r from-[var(--col-primary)] to-[var(--col-secondary)] text-white p-6 rounded-b-[2rem]">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Bell size={24} />
                            {t('notifications')}
                        </h1>
                        <p className="text-white/70 text-sm mt-1">
                            {unreadCount} {t('unread_notifications')}
                        </p>
                    </div>
                    <button
                        onClick={markAllAsRead}
                        className="flex items-center gap-1 px-3 py-2 bg-white/20 rounded-xl text-sm hover:bg-white/30 transition"
                    >
                        <Check size={16} />
                        {t('mark_all_read')}
                    </button>
                </div>

                {/* Filters */}
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                    {[
                        { id: 'all', label: t('all') },
                        { id: 'unread', label: t('unread') },
                        { id: 'service', label: t('services_summary') },
                        { id: 'alert', label: t('alerts') }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition ${filter === f.id
                                ? 'bg-white text-[var(--col-primary)]'
                                : 'bg-white/10 text-white'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Notification List */}
            <div className="px-4 mt-4 space-y-3">
                {filteredNotifications.length > 0 ? (
                    filteredNotifications.map((notif) => (
                        <div
                            key={notif._id}
                            onClick={() => {
                                markAsRead(notif._id);
                                if (notif.link) navigate(notif.link);
                            }}
                            className={`p-4 rounded-2xl border cursor-pointer transition ${notif.read
                                ? 'bg-white border-gray-100'
                                : 'bg-blue-50 border-blue-100'
                                } hover:shadow-md`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-xl ${notif.read ? 'bg-gray-100' : 'bg-white'}`}>
                                    {getIcon(notif.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className={`font-bold text-gray-800 ${!notif.read && 'text-blue-800'}`}>
                                        {notif.title}
                                    </h4>
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                        {notif.body}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-2">
                                        {new Date(notif.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                {!notif.read && (
                                    <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 text-gray-400">
                        <Bell size={48} className="mx-auto mb-4 opacity-30" />
                        <p>{t('no_notifications')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
