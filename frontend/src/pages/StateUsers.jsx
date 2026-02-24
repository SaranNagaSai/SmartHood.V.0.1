import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { ArrowLeft, MapPin, Briefcase, Phone, User, Award, ChevronRight, Users, Star } from 'lucide-react';
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
    const cardAnimation = "animate-in fade-in slide-in-from-right-8 duration-700 fill-mode-both";

    return (
        <div className="min-h-screen relative overflow-hidden bg-white">
            {/* Mesh Background Design */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-100/40 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-100/30 rounded-full blur-[150px]"></div>
                <div className="absolute top-[20%] right-[5%] w-[30%] h-[30%] bg-blue-50/50 rounded-full blur-[100px]"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white"></div>
            </div>

            {/* Premium Header */}
            <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-xl border-b border-indigo-100/50 px-6 py-5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-5">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 bg-white/80 border border-indigo-50 text-indigo-600 rounded-2xl shadow-sm hover:shadow-md hover:bg-white transition-all active:scale-95"
                    >
                        <ArrowLeft size={22} />
                    </button>
                    <div>
                        <h1 className="font-black text-2xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 via-indigo-700 to-purple-800 tracking-tight leading-none group">
                            {stateName} <span className="text-indigo-400 font-light pr-1">Discovery</span>
                        </h1>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100/60 px-2 py-0.5 rounded-lg border border-slate-100">
                                <Users size={12} className="text-indigo-400" />
                                {users.length} {t('active_users')}
                            </span>
                            <span className="w-1 h-1 bg-indigo-200 rounded-full"></span>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                {Object.keys(groupedData).length} Districts
                            </span>
                        </div>
                    </div>
                </div>

                {/* Visual Accent */}
                <div className="hidden md:flex items-center gap-3">
                    <div className="flex -space-x-3 overflow-hidden">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-indigo-100 flex items-center justify-center overflow-hidden">
                                <User size={16} className="text-indigo-300" />
                            </div>
                        ))}
                    </div>
                    <span className="text-xs font-bold text-indigo-600/60">+ Many more</span>
                </div>
            </div>

            <div className="relative z-10 w-full px-4 md:px-8 py-8 space-y-16">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-6">
                        <div className="relative">
                            <div className="w-16 h-16 border-[5px] border-indigo-100 rounded-full"></div>
                            <div className="absolute top-0 w-16 h-16 border-[5px] border-transparent border-t-indigo-600 rounded-full animate-spin"></div>
                        </div>
                        <p className="text-indigo-900/40 font-black text-sm uppercase tracking-[0.2em] animate-pulse">{t('searching_members')}...</p>
                    </div>
                ) : users.length > 0 ? (
                    Object.entries(groupedData).map(([district, towns], dIdx) => (
                        <div key={district} className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 fill-mode-both" style={{ animationDelay: `${dIdx * 150}ms` }}>
                            {/* District Glass Header */}
                            <div className="flex items-end gap-6 border-b border-indigo-100/50 pb-4">
                                <div className="p-4 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl shadow-xl shadow-indigo-200/50 text-white transform hover:rotate-6 transition-transform">
                                    <MapPin size={28} />
                                </div>
                                <div>
                                    <span className="text-[11px] font-black text-indigo-600/40 uppercase tracking-[0.3em]">District Horizon</span>
                                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">{district}</h2>
                                </div>
                                <div className="ml-auto hidden md:block">
                                    <div className="bg-white/40 backdrop-blur-sm border border-white/60 px-4 py-2 rounded-2xl flex items-center gap-3 text-slate-500 font-bold text-sm">
                                        <Users size={16} className="text-indigo-400" />
                                        {Object.keys(towns).length} Major Towns
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-12 pt-4">
                                {Object.entries(towns).map(([town, townUsers], tIdx) => (
                                    <div key={town} className="space-y-4">
                                        {/* Town Subheader with Gradient Badge */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-4 group">
                                                <div className="w-10 h-1 border-t-2 border-indigo-200 group-hover:w-16 transition-all duration-500"></div>
                                                <h3 className="font-black text-slate-700 uppercase text-xs md:text-sm tracking-[0.2em] group-hover:text-indigo-600 transition-colors">{town}</h3>
                                            </div>
                                            <div className="bg-indigo-50/50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black border border-indigo-100 tracking-wider">
                                                {townUsers.length} MEMBERS
                                            </div>
                                        </div>

                                        {/* Horizontal Premium Scroll - FULL WIDTH */}
                                        <div className="flex overflow-x-auto gap-6 pb-6 snap-x hide-scrollbar scroll-smooth -mx-4 px-4 md:-mx-8 md:px-8">
                                            {townUsers.map((u, uIdx) => (
                                                <div
                                                    key={u._id || uIdx}
                                                    className={`min-w-[320px] md:min-w-[400px] bg-white rounded-[2rem] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.06)] border border-indigo-50/50 overflow-hidden hover:shadow-2xl hover:shadow-indigo-100/50 hover:-translate-y-2 transition-all duration-500 snap-start flex flex-col group/card ${cardAnimation}`}
                                                    style={{ animationDelay: `${uIdx * 70}ms` }}
                                                >
                                                    <div className="p-6 md:p-8 flex gap-6 flex-1 relative overflow-hidden">
                                                        {/* Decorative Gradient Blob in Card */}
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover/card:bg-indigo-100 transition-colors"></div>

                                                        {/* Avatar Container */}
                                                        <div className="flex-shrink-0 relative z-10">
                                                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-[1.75rem] overflow-hidden border-4 border-white shadow-xl shadow-indigo-100 group-hover/card:scale-105 transition-transform duration-500 ring-1 ring-indigo-50">
                                                                {u.profilePhoto ? (
                                                                    <img
                                                                        src={getProfilePhotoUrl(u.profilePhoto)}
                                                                        alt={u.name}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full bg-indigo-50 flex items-center justify-center text-indigo-200">
                                                                        <User size={32} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {/* Verification Badge */}
                                                            <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-1.5 rounded-xl border-4 border-white shadow-lg">
                                                                <Star size={12} fill="currentColor" />
                                                            </div>
                                                        </div>

                                                        {/* User Details */}
                                                        <div className="flex-1 min-w-0 relative z-10">
                                                            <div className="flex flex-col mb-4">
                                                                <h4 className="font-black text-slate-800 text-lg md:text-xl truncate tracking-tight">{u.name}</h4>
                                                                <span className="text-[10px] font-black text-indigo-600/50 uppercase tracking-widest mt-0.5">
                                                                    ID: {u.uniqueId}
                                                                </span>
                                                            </div>

                                                            <div className="space-y-3">
                                                                <div className="flex items-center gap-3 bg-green-50/50 text-green-700 px-3 py-2 rounded-2xl w-fit group-hover/card:bg-green-100 transition-colors">
                                                                    <Phone size={14} className="flex-shrink-0" />
                                                                    <a href={`tel:${u.phone}`} className="font-black text-xs md:text-sm tracking-widest">{u.phone}</a>
                                                                </div>
                                                                <div className="flex items-center gap-3 text-slate-900 font-bold text-xs md:text-sm">
                                                                    <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                                        <Briefcase size={16} />
                                                                    </div>
                                                                    <span className="truncate">{u.professionDetails?.jobRole || u.professionCategory}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-slate-400 pl-1">
                                                                    <MapPin size={12} className="flex-shrink-0" />
                                                                    <span className="text-[11px] font-medium tracking-wide truncate">{u.locality}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Impact Footer Segment */}
                                                    <div className="bg-gradient-to-r from-slate-50 to-white px-6 py-4 flex justify-between items-center relative overflow-hidden border-t border-slate-50">
                                                        <div className="flex items-center gap-3">
                                                            <div className="bg-amber-100/50 text-amber-600 p-2 rounded-xl border border-amber-100">
                                                                <Award size={16} />
                                                            </div>
                                                            <div>
                                                                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Reputation</span>
                                                                <span className="block text-sm font-black text-slate-700 leading-none">Impact {u.impactScore || 0}</span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all transform active:scale-95"
                                                        >
                                                            <ChevronRight size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            {/* Spacer for right padding in scroller */}
                                            <div className="min-w-[1px] md:min-w-[1px]"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-40">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
                            <Users size={40} className="text-slate-200" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">Community Awaits</h3>
                        <p className="text-slate-400 font-medium text-sm">Be the first member to join this state's digital neighborhood!</p>
                    </div>
                )}
            </div>

            {/* Global Smooth Scroller & Animation Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                
                @keyframes mesh-pulse {
                    0% { transform: scale(1); opacity: 0.4; }
                    50% { transform: scale(1.1); opacity: 0.5; }
                    100% { transform: scale(1); opacity: 0.4; }
                }
            `}} />
        </div>
    );
};

export default StateUsers;
