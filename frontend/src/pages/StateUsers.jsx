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
    const cardAnimation = "animate-in fade-in slide-in-from-right-6 duration-500 fill-mode-both";

    return (
        <div className="min-h-screen relative overflow-hidden bg-white">
            {/* VIBRANT GRADIENT BACKGROUND - REFINED */}
            <div className="fixed inset-0 z-0 bg-gradient-to-tr from-indigo-50 via-white to-sky-50">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_15%_15%,rgba(99,102,241,0.08)_0,transparent_50%)]"></div>
                <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_85%_85%,rgba(14,165,233,0.08)_0,transparent_50%)]"></div>
            </div>

            {/* Premium Header - More Compact */}
            <div className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-indigo-100/40 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2.5 bg-white border border-indigo-50 text-indigo-600 rounded-xl shadow-sm hover:shadow-md hover:bg-white transition-all active:scale-95"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="font-black text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 to-indigo-600 tracking-tight leading-none">
                            {stateName} <span className="text-indigo-400 font-light">Hub</span>
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                {users.length} {t('active_users')}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-7 w-7 rounded-full ring-2 ring-white bg-indigo-100 flex items-center justify-center border border-indigo-50">
                                <User size={14} className="text-indigo-300" />
                            </div>
                        ))}
                    </div>
                    <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shadow-lg shadow-indigo-200">
                        {Object.keys(groupedData).length}
                    </div>
                </div>
            </div>

            <div className="relative z-10 w-full px-4 md:px-8 py-6 space-y-12">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="text-indigo-900/30 font-bold text-[10px] uppercase tracking-widest">{t('loading')}...</p>
                    </div>
                ) : users.length > 0 ? (
                    Object.entries(groupedData).map(([district, towns], dIdx) => (
                        <div key={district} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: `${dIdx * 100}ms` }}>
                            {/* District Minimal Header */}
                            <div className="flex items-center gap-4 border-b border-indigo-100/40 pb-3">
                                <div className="p-2.5 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100 text-white transform hover:scale-105 transition-transform">
                                    <MapPin size={20} />
                                </div>
                                <h2 className="text-2xl font-black text-slate-800 tracking-tighter">{district}</h2>
                                <div className="ml-auto">
                                    <span className="bg-white/60 border border-slate-100 px-3 py-1 rounded-xl text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                                        {Object.keys(towns).length} Towns
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {Object.entries(towns).map(([town, townUsers], tIdx) => (
                                    <div key={town} className="space-y-3">
                                        {/* Town Subheader */}
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2 group">
                                                <div className="w-6 h-[2px] bg-indigo-300 group-hover:w-10 transition-all duration-300"></div>
                                                <h3 className="font-black text-slate-600 uppercase text-[10px] tracking-[0.15em] group-hover:text-indigo-600 transition-colors">{town}</h3>
                                            </div>
                                            <span className="text-[9px] font-bold text-slate-300 uppercase letter-spacing-widest">
                                                {townUsers.length} MEMBERS
                                            </span>
                                        </div>

                                        {/* COMPACT HORIZONTAL SCROLL - UPDATED WIDTH */}
                                        <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar scroll-smooth -mx-4 px-4 md:-mx-8 md:px-8">
                                            {townUsers.map((u, uIdx) => (
                                                <div
                                                    key={u._id || uIdx}
                                                    className={`min-w-[280px] md:min-w-[320px] bg-white/90 backdrop-blur-sm rounded-[1.5rem] shadow-sm border border-indigo-50/50 overflow-hidden hover:shadow-xl hover:shadow-indigo-100/20 hover:-translate-y-1 transition-all duration-300 snap-start flex flex-col group/card ${cardAnimation}`}
                                                    style={{ animationDelay: `${uIdx * 50}ms` }}
                                                >
                                                    <div className="p-4 md:p-5 flex gap-4 flex-1">
                                                        {/* Avatar Space - Compact */}
                                                        <div className="flex-shrink-0">
                                                            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-slate-50 flex items-center justify-center ring-1 ring-indigo-50/50 group-hover/card:scale-110 transition-transform duration-500">
                                                                {u.profilePhoto ? (
                                                                    <img
                                                                        src={getProfilePhotoUrl(u.profilePhoto)}
                                                                        alt={u.name}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <User size={24} className="text-slate-200" />
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Info - Compact */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-start mb-1 gap-1">
                                                                <h4 className="font-black text-slate-800 text-sm md:text-base truncate tracking-tight">{u.name}</h4>
                                                                <span className="bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded-lg text-[8px] font-black whitespace-nowrap border border-indigo-100/30 shadow-sm">
                                                                    {u.uniqueId}
                                                                </span>
                                                            </div>

                                                            <div className="space-y-1.5 mt-2">
                                                                <div className="flex items-center gap-2 text-green-600 font-bold text-[10px]">
                                                                    <Phone size={10} className="group-hover/card:animate-bounce" />
                                                                    <a href={`tel:${u.phone}`} className="hover:underline">{u.phone}</a>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-indigo-500 text-[10px] font-bold">
                                                                    <Briefcase size={10} />
                                                                    <span className="truncate">{u.professionDetails?.jobRole || u.professionCategory}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-slate-400 text-[9px] font-medium pl-0.5 opacity-70">
                                                                    <MapPin size={9} />
                                                                    <span className="truncate lowercase">{u.locality}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Compact Footer */}
                                                    <div className="bg-slate-50/50 px-4 py-2.5 flex justify-between items-center border-t border-slate-100/50">
                                                        <div className="flex items-center gap-2 text-amber-500">
                                                            <Award size={12} className="group-hover/card:rotate-12 transition-transform" />
                                                            <span className="text-[10px] font-black uppercase tracking-tighter">Impact {u.impactScore || 0}</span>
                                                        </div>
                                                        <ChevronRight size={14} className="text-slate-300 group-hover/card:text-indigo-400 group-hover/card:translate-x-1 transition-all" />
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="min-w-[1px] md:min-w-[1px]"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-40">
                        <Users size={48} className="text-slate-200 mx-auto mb-4" />
                        <h3 className="text-lg font-black text-slate-700 tracking-tight">Community Horizon</h3>
                        <p className="text-slate-400 text-xs font-medium">No members found in {stateName} yet.</p>
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
        </div>
    );
};

export default StateUsers;
