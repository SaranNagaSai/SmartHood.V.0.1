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
            const dName = u.district || 'Unspecified District';
            const tName = u.town || 'Unspecified Town';

            if (!districts[dName]) districts[dName] = {};
            if (!districts[dName][tName]) districts[dName][tName] = [];

            districts[dName][tName].push(u);
        });
        return districts;
    }, [users]);

    const cardAnimation = "animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both";

    return (
        <div className="min-h-screen relative overflow-hidden bg-[#050507] text-white">
            {/* PREMIUN STARFIELD BACKGROUND */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-[#050507]"></div>
                {/* Simulated Starfield with Radial Gradients */}
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(1px_1px_at_10%_10%,#fff_100%,transparent_0),radial-gradient(1px_1px_at_20%_30%,#fff_100%,transparent_0),radial-gradient(1px_1px_at_45%_50%,#fff_100%,transparent_0),radial-gradient(1.5px_1.5px_at_70%_20%,#fff_100%,transparent_0),radial-gradient(1px_1px_at_85%_75%,#fff_100%,transparent_0),radial-gradient(2px_2px_at_30%_80%,#fff_100%,transparent_0),radial-gradient(1px_1px_at_60%_60%,#fff_100%,transparent_0),radial-gradient(1.5px_1.5px_at_90%_40%,#fff_100%,transparent_0)] bg-[length:200px_200px] animate-pulse"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-purple-500/5"></div>

                {/* Large Blurred Orbs */}
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]"></div>
            </div>

            {/* Premium Glass Header */}
            <div className="sticky top-0 z-50 bg-[#0a0a0c]/80 backdrop-blur-2xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2.5 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all active:scale-95"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="font-extrabold text-xl lg:text-2xl text-white tracking-tight flex items-center gap-2">
                            {stateName} <span className="text-indigo-400 font-medium opacity-80">{t('discovery_hub', 'Discovery Hub')}</span>
                        </h1>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Users size={10} className="text-indigo-400" />
                            {users.length} {t('active_users')}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold">
                        {Object.keys(groupedData).length}
                    </div>
                </div>
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-16">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-6">
                        <div className="relative">
                            <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 bg-indigo-500/10 blur-xl rounded-full"></div>
                        </div>
                        <p className="text-indigo-400/50 font-bold text-[10px] uppercase tracking-[0.2em] animate-pulse">{t('searching_members')}...</p>
                    </div>
                ) : users.length > 0 ? (
                    Object.entries(groupedData).map(([district, towns], dIdx) => (
                        <div key={district} className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both" style={{ animationDelay: `${dIdx * 150}ms` }}>

                            {/* District Section Header */}
                            <div className="flex flex-col gap-2 relative">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-indigo-400 shadow-2xl shadow-indigo-500/10 group overflow-hidden">
                                        <div className="absolute inset-0 bg-indigo-500/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                                        <Star size={24} className="relative z-10 fill-indigo-400/20" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h2 className="text-3xl font-black text-white tracking-tight">{district}</h2>
                                        <p className="text-[10px] font-bold text-indigo-400/60 uppercase tracking-widest">
                                            {Object.keys(towns).length} {t('major_towns', 'Major Towns')}
                                        </p>
                                    </div>
                                </div>
                                <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-transparent rounded-full opacity-50"></div>
                            </div>

                            <div className="space-y-12 pl-4 border-l border-white/5">
                                {Object.entries(towns).map(([town, townUsers], tIdx) => {
                                    // If Town is same as District, and it's the only town, we could style differently
                                    // But user asked to display them once "with all the users at one place only"
                                    const isRedundant = town.toLowerCase() === district.toLowerCase();

                                    return (
                                        <div key={town} className="space-y-6">
                                            {/* Town Header - Only show if not redundant or if explicitly needed */}
                                            {!isRedundant && (
                                                <div className="flex items-center gap-3">
                                                    <div className="h-px w-8 bg-indigo-500/30"></div>
                                                    <h3 className="font-bold text-indigo-300 uppercase text-xs tracking-[0.2em]">{town}</h3>
                                                    <span className="text-[9px] font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                                                        {townUsers.length} {t('members')}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Responsive Grid Layout */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {townUsers.map((u, uIdx) => (
                                                    <div
                                                        key={u._id || uIdx}
                                                        className={`bg-[#0f0f13] backdrop-blur-xl rounded-3xl border border-white/10 p-5 group hover:border-indigo-500/60 transition-all duration-500 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] flex flex-col gap-5 ${cardAnimation}`}
                                                        style={{ animationDelay: `${uIdx * 50}ms` }}
                                                    >
                                                        <div className="flex gap-4">
                                                            {/* Avatar Component */}
                                                            <div className="relative">
                                                                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/20 bg-white/[0.08] p-1 group-hover:scale-110 transition-transform duration-500">
                                                                    {u.profilePhoto ? (
                                                                        <img
                                                                            src={getProfilePhotoUrl(u.profilePhoto)}
                                                                            alt={u.name}
                                                                            className="w-full h-full object-cover rounded-xl"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center bg-indigo-500/10 text-indigo-400">
                                                                            <User size={24} />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-[#15151a] rounded-full shadow-lg"></div>
                                                            </div>

                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex justify-between items-start">
                                                                    <h4 className="font-bold text-white text-base truncate group-hover:text-indigo-400 transition-colors">{u.name}</h4>
                                                                    <span className="text-[8px] font-bold text-indigo-400 border border-indigo-400/30 px-1.5 py-0.5 rounded-lg opacity-60">
                                                                        {u.uniqueId}
                                                                    </span>
                                                                </div>

                                                                <div className="mt-3 space-y-1.5">
                                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                                                                        <Briefcase size={12} className="text-indigo-400" />
                                                                        <span className="truncate">{u.professionDetails?.jobRole || u.professionCategory}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                                                                        <MapPin size={12} className="text-indigo-400" />
                                                                        <span className="truncate">{u.locality}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Card Action Area */}
                                                        <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
                                                            <div className="flex items-center gap-2">
                                                                <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400">
                                                                    <Phone size={14} />
                                                                </div>
                                                                <a href={`tel:${u.phone}`} className="text-xs font-bold text-white/80 hover:text-white transition-colors">
                                                                    {u.phone}
                                                                </a>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-amber-500 bg-amber-500/5 px-3 py-1.5 rounded-xl border border-amber-500/20">
                                                                <Star size={12} className="fill-amber-500" />
                                                                <span className="text-[10px] font-black">{u.impactScore || 0} IMP</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-40 text-center space-y-6">
                        <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-gray-600 animate-pulse">
                            <Users size={40} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-white tracking-tight">{t('community_horizon', 'Community Horizon')}</h3>
                            <p className="text-gray-500 text-sm max-w-xs">{t('no_members_found', 'No members found in')} {stateName} {t('yet')}.</p>
                        </div>
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes pulse {
                    0%, 100% { opacity: 0.4; }
                    50% { opacity: 0.7; }
                }
                .animate-pulse { animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
            `}} />
        </div>
    );
};

export default StateUsers;
