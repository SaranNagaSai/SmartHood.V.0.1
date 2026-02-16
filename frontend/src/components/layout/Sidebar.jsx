import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, HeartHandshake, Megaphone, BarChart2,
    LogOut, Globe2, UserCircle2, Sparkles, Heart
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

import smartHoodLogo from '../../assets/images/Smart Hood Logo.png';

const Sidebar = () => {
    const navigate = useNavigate();
    const { t, setLanguage } = useLanguage();

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setLanguage(null);
        navigate('/');
    };

    const links = [
        {
            name: t('home'), path: '/home',
            icon: LayoutDashboard,
            gradient: 'from-blue-500 to-cyan-500',
            glow: 'rgba(59, 130, 246, 0.35)'
        },
        {
            name: t('explore_city'), path: '/explore',
            icon: Globe2,
            gradient: 'from-violet-500 to-fuchsia-500',
            glow: 'rgba(139, 92, 246, 0.35)'
        },
        {
            name: t('offer_service'), path: '/service/offer',
            icon: HeartHandshake,
            gradient: 'from-emerald-500 to-teal-500',
            glow: 'rgba(16, 185, 129, 0.35)'
        },
        {
            name: t('request_help'), path: '/service/request',
            icon: Heart,
            gradient: 'from-orange-500 to-amber-500',
            glow: 'rgba(249, 115, 22, 0.35)'
        },
        {
            name: t('alerts'), path: '/alerts',
            icon: Megaphone,
            gradient: 'from-rose-500 to-pink-600',
            glow: 'rgba(244, 63, 94, 0.35)'
        },
        {
            name: t('my_activity'), path: '/activity',
            icon: BarChart2,
            gradient: 'from-indigo-500 to-purple-600',
            glow: 'rgba(99, 102, 241, 0.35)'
        },
        {
            name: t('profile'), path: '/profile',
            icon: UserCircle2,
            gradient: 'from-cyan-500 to-blue-500',
            glow: 'rgba(6, 182, 212, 0.35)'
        },
    ];

    return (
        <div className="h-full bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 flex flex-col justify-between p-5 shadow-2xl relative z-40 overflow-hidden">
            {/* Ambient background blobs */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-20 left-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div>
                {/* Logo Header */}
                <div className="mb-8 px-2">
                    <div className="flex items-center gap-3 mb-1">
                        <img
                            src={smartHoodLogo}
                            alt="Smart Hood"
                            className="w-12 h-12 object-contain filter drop-shadow-lg"
                        />
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent tracking-tight">
                                Smart Hood
                            </h1>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                                <Sparkles size={10} className="text-purple-400" />
                                Community Platform
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="space-y-1.5">
                    {links.map((link) => (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            className={({ isActive }) =>
                                `group relative flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 font-medium overflow-hidden ${isActive
                                    ? `bg-gradient-to-r ${link.gradient} text-white shadow-lg`
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    {/* Active glow */}
                                    {isActive && (
                                        <div
                                            className="absolute inset-0 opacity-30 blur-xl pointer-events-none"
                                            style={{ background: `radial-gradient(circle at 30% 50%, ${link.glow}, transparent 70%)` }}
                                        />
                                    )}

                                    {/* Icon */}
                                    <div className={`relative z-10 p-2 rounded-lg transition-all duration-300 ${isActive
                                        ? 'bg-white/20 shadow-inner'
                                        : 'bg-slate-800/60 group-hover:bg-slate-700/80'
                                        }`}>
                                        <link.icon
                                            size={18}
                                            strokeWidth={isActive ? 2.5 : 2}
                                            className={`transition-all duration-300 ${isActive ? 'text-white drop-shadow-md' : 'text-slate-400 group-hover:text-white'}`}
                                        />
                                    </div>

                                    {/* Label */}
                                    <span className="relative z-10 text-sm tracking-wide">{link.name}</span>

                                    {/* Active dot indicator */}
                                    {isActive && (
                                        <div className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-lg" />
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* Logout Button */}
            <button
                onClick={handleLogout}
                className="group flex items-center gap-3.5 px-4 py-3 text-slate-400 hover:text-red-400 rounded-xl transition-all duration-300 font-medium hover:bg-red-500/10"
            >
                <div className="p-2 rounded-lg bg-slate-800/60 group-hover:bg-red-500/20 transition-all">
                    <LogOut size={18} className="group-hover:rotate-12 transition-transform" />
                </div>
                <span className="flex-1 text-left text-sm">{t('logout')}</span>
            </button>
        </div>
    );
};

export default Sidebar;
