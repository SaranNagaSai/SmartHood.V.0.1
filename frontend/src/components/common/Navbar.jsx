import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import {
    Home, Bell, User, LogOut, Shield, Menu, X,
    Briefcase, AlertTriangle, Activity
} from 'lucide-react';
import { useState } from 'react';
import { SERVER_URL, getProfilePhotoUrl } from '../../utils/apiConfig';
import smartHoodLogo from '../../assets/images/Smart Hood Logo.png';

const Navbar = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const { language, t } = useLanguage();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const navLinks = [
        { path: '/home', label: t('home'), icon: Home },
        { path: '/emergency', label: t('emergency'), icon: AlertTriangle, color: 'text-red-400' },
        { path: '/service/offer', label: t('offer_service'), icon: Briefcase },
        { path: '/service/request', label: t('request_help'), icon: Briefcase },
        { path: '/alerts', label: t('alerts'), icon: AlertTriangle },
    ];

    if (user?.professionCategory === 'Student') {
        navLinks.push({ path: '/student/dashboard', label: 'Student', icon: Activity });
    }

    navLinks.push({ path: '/activity', label: t('my_activity'), icon: Activity });

    if (!isAuthenticated) return null;

    return (
        <nav className="bg-gradient-to-r from-[var(--col-primary)] to-[var(--col-secondary)] text-white shadow-lg sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/home" className="flex items-center gap-2">
                        <img src={smartHoodLogo} alt="SmartHood" className="w-10 h-10 object-contain" />
                        <span className="font-bold text-lg">SmartHood</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map(link => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className="px-3 py-2 rounded-lg hover:bg-white/10 transition text-sm font-medium flex items-center gap-1.5"
                            >
                                <link.icon size={16} />
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-3">
                        <LanguageSwitcher compact />

                        {/* Notifications */}
                        <button
                            onClick={() => navigate('/notifications')}
                            className="relative p-2 hover:bg-white/10 rounded-lg transition"
                        >
                            <Bell size={20} />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>

                        {/* Profile Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setProfileOpen(!profileOpen)}
                                className="flex items-center gap-2 p-2 hover:bg-white/10 rounded-lg transition"
                            >
                                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/50 bg-white/20 flex items-center justify-center font-bold text-base">
                                    {user?.profilePhoto ? (
                                        <img
                                            src={getProfilePhotoUrl(user.profilePhoto)}
                                            alt="Profile"
                                            crossOrigin="anonymous"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        user?.name?.charAt(0) || 'U'
                                    )}
                                </div>
                            </button>

                            {profileOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl py-2 text-gray-800 animate-fade-in">
                                    <div className="px-4 py-3 border-b border-gray-100">
                                        <p className="font-bold">{user?.name}</p>
                                        <p className="text-xs text-gray-500 font-mono">{user?.uniqueId}</p>
                                    </div>

                                    <Link
                                        to="/profile"
                                        onClick={() => setProfileOpen(false)}
                                        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition"
                                    >
                                        <User size={16} />
                                        {t('profile')}
                                    </Link>

                                    {user?.isAdmin && (
                                        <Link
                                            to="/admin/dashboard"
                                            onClick={() => setProfileOpen(false)}
                                            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition text-purple-600"
                                        >
                                            <Shield size={16} />
                                            {t('admin_panel')}
                                        </Link>
                                    )}

                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-red-600 transition"
                                    >
                                        <LogOut size={16} />
                                        {t('logout')}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="md:hidden p-2 hover:bg-white/10 rounded-lg transition"
                        >
                            {menuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {menuOpen && (
                    <div className="md:hidden py-4 border-t border-white/10 animate-fade-in">
                        {navLinks.map(link => (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center gap-2 px-4 py-3 hover:bg-white/10 transition rounded-lg"
                            >
                                <link.icon size={18} />
                                {link.label}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
