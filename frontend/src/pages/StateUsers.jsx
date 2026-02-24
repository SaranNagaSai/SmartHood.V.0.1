import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { ArrowLeft, MapPin, Briefcase, Phone, User, Award, ChevronRight } from 'lucide-react';
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

    // Grouping Logic: District -> Town -> Users
    const groupedData = useMemo(() => {
        const districts = {};
        users.forEach(u => {
            const dName = u.district || 'Other Districts';
            const tName = u.town || 'Other Towns';

            if (!districts[dName]) districts[dName] = {};
            if (!districts[dName][tName]) districts[dName][tName] = [];

            districts[dName][tName].push(u);
        });
        return districts;
    }, [users]);

    // Animation variant for cards
    const cardAnimation = "animate-in fade-in slide-in-from-right-4 duration-500 fill-mode-both";

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-4 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition">
                    <ArrowLeft size={20} className="text-gray-700" />
                </button>
                <div>
                    <h1 className="font-bold text-lg text-indigo-900">{stateName} Communities</h1>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                        {users.length} {t('active_users')} across {Object.keys(groupedData).length} districts
                    </p>
                </div>
            </div>

            <div className="p-4 space-y-8 max-w-6xl mx-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="text-gray-400 font-medium">{t('loading')}...</p>
                    </div>
                ) : users.length > 0 ? (
                    Object.entries(groupedData).map(([district, towns], dIdx) => (
                        <div key={district} className="space-y-6">
                            {/* District Header */}
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-1.5 bg-indigo-600 rounded-full"></div>
                                <h2 className="text-xl font-bold text-slate-800 tracking-tight">{district}</h2>
                            </div>

                            <div className="space-y-6 pl-2 md:pl-4">
                                {Object.entries(towns).map(([town, townUsers], tIdx) => (
                                    <div key={town} className="space-y-3">
                                        {/* Town Subheader */}
                                        <div className="flex items-center justify-between pr-4">
                                            <div className="flex items-center gap-2">
                                                <MapPin size={16} className="text-indigo-400" />
                                                <h3 className="font-bold text-slate-600 uppercase text-xs tracking-widest">{town}</h3>
                                            </div>
                                            <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                                                {townUsers.length} Users
                                            </span>
                                        </div>

                                        {/* Horizontal Scroll Container */}
                                        <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar scroll-smooth">
                                            {townUsers.map((u, uIdx) => (
                                                <div
                                                    key={u._id || uIdx}
                                                    className={`min-w-[280px] md:min-w-[320px] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all snap-start flex flex-col ${cardAnimation}`}
                                                    style={{ animationDelay: `${uIdx * 50}ms` }}
                                                >
                                                    <div className="p-4 flex gap-4 flex-1">
                                                        {/* Avatar */}
                                                        <div className="flex-shrink-0">
                                                            <div className="w-14 h-14 rounded-xl overflow-hidden border border-indigo-50 shadow-inner bg-slate-100 flex items-center justify-center">
                                                                {u.profilePhoto ? (
                                                                    <img
                                                                        src={getProfilePhotoUrl(u.profilePhoto)}
                                                                        alt={u.name}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <User size={28} className="text-slate-300" />
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-start mb-1 gap-1">
                                                                <h4 className="font-bold text-gray-900 truncate text-sm">{u.name}</h4>
                                                                <span className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold whitespace-nowrap">
                                                                    {u.uniqueId}
                                                                </span>
                                                            </div>

                                                            <div className="space-y-1.5 mt-2">
                                                                <div className="flex items-center gap-2 text-green-600 font-bold text-[11px]">
                                                                    <Phone size={10} />
                                                                    <a href={`tel:${u.phone}`} onClick={(e) => e.stopPropagation()}>{u.phone}</a>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-indigo-500 text-[11px] font-medium truncate">
                                                                    <Briefcase size={10} />
                                                                    <span className="truncate">{u.professionDetails?.jobRole || u.professionCategory}</span>
                                                                </div>
                                                                <div className="text-[10px] text-slate-400 truncate pl-4 italic">
                                                                    {u.locality}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Impact Bar */}
                                                    <div className="bg-slate-50 px-4 py-2 border-t border-gray-50 flex justify-between items-center text-[9px]">
                                                        <div className="flex items-center gap-1 text-amber-600 font-bold uppercase">
                                                            <Award size={10} />
                                                            <span>Impact: {u.impactScore || 0}</span>
                                                        </div>
                                                        <ChevronRight size={12} className="text-slate-300" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 text-gray-400">
                        <p>No community members found in this state yet.</p>
                    </div>
                )}
            </div>

            {/* Global CSS for hiding scrollbar but keeping functionality */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
        </div>
    );
};

export default StateUsers;
