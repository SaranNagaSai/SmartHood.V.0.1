import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { ArrowLeft, MapPin, Briefcase, Phone, User, Award } from 'lucide-react';
import axios from 'axios';
import { API_URL, getProfilePhotoUrl } from '../utils/apiConfig';

const StateUsers = () => {
    const { stateName } = useParams();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_URL}/users/state/${encodeURIComponent(stateName)}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUsers(res.data);
            } catch (err) {
                console.error("Failed to fetch state users", err);
            }
            setLoading(false);
        };
        fetchUsers();
    }, [stateName]);

    // Animation variant for cards
    const cardAnimation = "animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both";

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-4 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition">
                    <ArrowLeft size={20} className="text-gray-700" />
                </button>
                <div>
                    <h1 className="font-bold text-lg text-indigo-900">{stateName} Users</h1>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                        {users.length} {t('active_users')}
                    </p>
                </div>
            </div>

            <div className="p-4 space-y-4 max-w-2xl mx-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="text-gray-400 font-medium">{t('loading')}...</p>
                    </div>
                ) : users.length > 0 ? (
                    <div className="grid gap-4">
                        {users.map((u, idx) => (
                            <div
                                key={u._id || idx}
                                className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow ${cardAnimation}`}
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                <div className="p-4 flex gap-4">
                                    {/* Left: Avatar */}
                                    <div className="flex-shrink-0">
                                        <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-indigo-50 shadow-inner bg-slate-100 flex items-center justify-center">
                                            {u.profilePhoto ? (
                                                <img
                                                    src={getProfilePhotoUrl(u.profilePhoto)}
                                                    alt={u.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <User size={32} className="text-slate-300" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="font-bold text-gray-900 truncate pr-2">{u.name}</h3>
                                            <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-[10px] font-mono font-bold whitespace-nowrap">
                                                {u.uniqueId}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 gap-1.5 mt-2">
                                            {/* Contact */}
                                            <div className="flex items-center gap-2 text-green-600 font-bold text-xs">
                                                <Phone size={12} />
                                                <a href={`tel:${u.phone}`} onClick={(e) => e.stopPropagation()}>{u.phone}</a>
                                            </div>

                                            {/* Location */}
                                            <div className="flex items-start gap-2 text-gray-500 text-xs">
                                                <MapPin size={12} className="mt-0.5 flex-shrink-0" />
                                                <span className="truncate">
                                                    {u.locality}, <strong>{u.town}</strong>, {u.district}
                                                </span>
                                            </div>

                                            {/* Profession */}
                                            <div className="flex items-center gap-2 text-indigo-500 text-xs font-medium">
                                                <Briefcase size={12} />
                                                <span className="truncate">
                                                    {u.professionDetails?.jobRole || u.professionCategory}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Bar */}
                                <div className="bg-slate-50 px-4 py-2 border-t border-gray-50 flex justify-between items-center">
                                    <div className="flex items-center gap-1 text-[10px] text-amber-600 font-bold uppercase tracking-tight">
                                        <Award size={10} />
                                        <span>Impact Score: {u.impactScore || 0}</span>
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-medium">
                                        Verified Partner
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 text-gray-400">
                        <p>No users found in this state yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StateUsers;
