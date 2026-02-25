import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    Menu, X, Home, Map, HeartHandshake,
    Heart, Megaphone, User, BarChart2,
    Bell, Siren, MessageSquare, LogOut, Shield
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

const HamburgerMenu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { t } = useLanguage();
    const { logout } = useAuth();
    const navigate = useNavigate();

    const menuItems = [
        { name: t('home'), path: '/home', icon: Home },
        { name: t('explore_city'), path: '/explore', icon: Map },
        { name: t('offer_service'), path: '/service/offer', icon: HeartHandshake },
        { name: t('request_help'), path: '/service/request', icon: Heart },
        { name: t('alerts'), path: '/alerts', icon: Megaphone },
        { name: t('profile'), path: '/profile', icon: User },
        { name: t('my_activity'), path: '/activity', icon: BarChart2 },
        { name: t('notifications'), path: '/notifications', icon: Bell },
        { name: t('emergency'), path: '/emergency', icon: Siren },
        { name: t('complaints'), path: '/complaints', icon: MessageSquare },
        { name: t('admin_access'), path: '/admin', icon: Shield },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <>
            {/* Hamburger Toggle Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed top-4 left-4 z-[2000] p-2 bg-white rounded-full shadow-lg border border-gray-100 text-gray-700 active:scale-90 transition-transform md:hidden"
            >
                <Menu size={24} />
            </button>

            {/* Menu Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[3000] md:hidden animate-fade-in"
                    onClick={() => setIsOpen(false)}
                >
                    {/* Drawer */}
                    <div
                        className="absolute top-0 left-0 h-full w-[280px] bg-white shadow-2xl flex flex-col animate-slide-right"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-brand">
                            <h2 className="text-xl font-bold text-white uppercase tracking-wider">SmartHood</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Navigation Links */}
                        <div className="flex-1 overflow-y-auto py-4">
                            {menuItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsOpen(false)}
                                    className={({ isActive }) => `
                                        flex items-center gap-4 px-6 py-4 transition-all
                                        ${isActive
                                            ? 'bg-primary/10 text-primary border-r-4 border-primary font-bold'
                                            : 'text-gray-600 hover:bg-gray-50'
                                        }
                                    `}
                                >
                                    <item.icon size={20} />
                                    <span className="text-sm uppercase tracking-wide">{item.name}</span>
                                </NavLink>
                            ))}
                        </div>

                        {/* Footer / Logout */}
                        <div className="p-6 border-t border-gray-100 mb-safe">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-3 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition shadow-sm"
                            >
                                <LogOut size={18} />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default HamburgerMenu;
