import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, HeartHandshake, Heart, Megaphone, BarChart2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const BottomNav = () => {
    const { t } = useLanguage();

    const links = [
        { name: t('home'), path: '/home', icon: LayoutDashboard, color: '#3b82f6' },
        { name: t('offer_service'), path: '/service/offer', icon: HeartHandshake, color: '#10b981' },
        { name: t('request_help'), path: '/service/request', icon: Heart, color: '#f97316' },
        { name: t('alerts'), path: '/alerts', icon: Megaphone, color: '#f43f5e' },
        { name: t('my_activity'), path: '/activity', icon: BarChart2, color: '#6366f1' },
    ];

    return (
        <div className="bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.12)] flex justify-around items-center px-2 py-2 pb-safe">
            {links.map((link) => (
                <NavLink
                    key={link.path}
                    to={link.path}
                    className={({ isActive }) =>
                        `relative flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all duration-300 ${isActive
                            ? 'scale-105'
                            : 'text-gray-400 hover:text-gray-600'
                        }`
                    }
                >
                    {({ isActive }) => (
                        <>
                            {/* Active pill background */}
                            {isActive && (
                                <div
                                    className="absolute inset-0 rounded-xl opacity-10"
                                    style={{ backgroundColor: link.color }}
                                />
                            )}
                            {/* Icon */}
                            <link.icon
                                size={22}
                                strokeWidth={isActive ? 2.5 : 1.8}
                                style={isActive ? { color: link.color } : {}}
                                className={`transition-all duration-300 ${isActive ? 'drop-shadow-sm' : ''}`}
                            />
                            {/* Label */}
                            <span
                                className={`text-[10px] font-semibold text-center w-16 truncate transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-70'
                                    }`}
                                style={isActive ? { color: link.color } : {}}
                            >
                                {link.name}
                            </span>
                            {/* Active dot */}
                            {isActive && (
                                <div
                                    className="w-1 h-1 rounded-full mt-0.5"
                                    style={{ backgroundColor: link.color }}
                                />
                            )}
                        </>
                    )}
                </NavLink>
            ))}
        </div>
    );
};

export default BottomNav;
