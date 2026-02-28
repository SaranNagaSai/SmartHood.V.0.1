import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { ArrowLeft, MapPin, Briefcase, Phone, User, Users, Star } from 'lucide-react';
import axios from 'axios';
import { API_URL, getProfilePhotoUrl } from '../utils/apiConfig';

const StateUsers = () => {
    const { stateName } = useParams();
    const { t, translateValue } = useLanguage();
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

    // Helper: Title case a string (first letter of each word uppercase)
    const toTitleCase = (str) => {
        return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    };

    // Grouping Logic: District -> Town -> Users (case-insensitive, alphabetically sorted)
    const groupedData = useMemo(() => {
        const tempMap = {}; // key: lowercased district -> { displayName, towns: { lowercased town -> { displayName, users[] } } }

        users.forEach(u => {
            const rawDistrict = u.district || 'Unspecified District';
            const rawTown = u.town || 'Unspecified Town';
            const dKey = rawDistrict.trim().toLowerCase();
            const tKey = rawTown.trim().toLowerCase();

            if (!tempMap[dKey]) {
                tempMap[dKey] = { displayName: toTitleCase(rawDistrict.trim()), towns: {} };
            }
            if (!tempMap[dKey].towns[tKey]) {
                tempMap[dKey].towns[tKey] = { displayName: toTitleCase(rawTown.trim()), users: [] };
            }
            tempMap[dKey].towns[tKey].users.push(u);
        });

        // Sort districts alphabetically, then sort towns alphabetically within each district
        const sortedDistricts = {};
        Object.keys(tempMap).sort((a, b) => a.localeCompare(b)).forEach(dKey => {
            const districtInfo = tempMap[dKey];
            const sortedTowns = {};
            Object.keys(districtInfo.towns).sort((a, b) => a.localeCompare(b)).forEach(tKey => {
                sortedTowns[districtInfo.towns[tKey].displayName] = districtInfo.towns[tKey].users;
            });
            sortedDistricts[districtInfo.displayName] = sortedTowns;
        });

        return sortedDistricts;
    }, [users]);


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
                            {translateValue(stateName)} <span className="text-indigo-400 font-medium opacity-80">{t('discovery_hub', 'Discovery Hub')}</span>
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

            <div className="relative z-10 w-full max-w-[100vw] mx-auto px-4 md:px-8 py-8 space-y-16">
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
                        <div key={district} className="space-y-8" style={{ animation: "fadeSlideIn 0.8s ease-out " + (dIdx * 150) + "ms both" }}>

                            {/* District Section Header */}
                            <div className="flex flex-col gap-2 relative">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-indigo-400 shadow-2xl shadow-indigo-500/10 relative overflow-hidden">
                                        <Star size={24} className="relative z-10 fill-indigo-400/20" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">{translateValue(district)}</h2>
                                        <p className="text-[10px] font-bold text-indigo-400/60 uppercase tracking-widest">
                                            {Object.keys(towns).length} {t('major_towns', 'Major Towns')} &bull; {Object.values(towns).reduce((acc, arr) => acc + arr.length, 0)} {t('members', 'Members')}
                                        </p>
                                    </div>
                                </div>
                                <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-transparent rounded-full opacity-50"></div>
                            </div>

                            {/* Towns under this district */}
                            <div className="space-y-8 pl-4 border-l border-white/5">
                                {Object.entries(towns).map(([town, townUsers], tIdx) => {
                                    const isRedundant = town.toLowerCase() === district.toLowerCase();

                                    return (
                                        <div key={town} className="space-y-4">
                                            {/* Town Header - shown once per unique town, skip if same as district */}
                                            {!isRedundant && (
                                                <div className="flex items-center gap-3">
                                                    <div className="h-px w-8 bg-indigo-500/30"></div>
                                                    <MapPin size={14} className="text-indigo-400" />
                                                    <h3 className="font-bold text-indigo-300 uppercase text-xs tracking-[0.2em]">{translateValue(town)}</h3>
                                                    <span className="text-[9px] font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                                                        {townUsers.length} {t('members', 'Members')}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Responsive Grid of Cards */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                                {townUsers.map((u, uIdx) => (
                                                    <div
                                                        key={u._id || uIdx}
                                                        className="bg-white rounded-[1.5rem] border border-slate-100 p-5 group hover:shadow-2xl hover:shadow-indigo-500/30 transition-all duration-500 flex flex-col gap-4 shadow-xl shadow-black/20"
                                                        style={{
                                                            animation: "fadeSlideIn 0.5s ease-out " + (uIdx * 60) + "ms both"
                                                        }}
                                                    >
                                                        <div className="flex gap-4">
                                                            {/* Avatar */}
                                                            <div className="relative">
                                                                <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-slate-100 bg-slate-50 p-0.5 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                                                                    {u.profilePhoto ? (
                                                                        <img
                                                                            src={getProfilePhotoUrl(u.profilePhoto)}
                                                                            alt={u.name}
                                                                            className="w-full h-full object-cover rounded-xl"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-400 rounded-xl">
                                                                            <User size={22} />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-green-500 border-2 border-white rounded-full shadow-lg"></div>
                                                            </div>

                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex justify-between items-start gap-1">
                                                                    <h4 className="font-extrabold text-slate-900 text-sm truncate group-hover:text-indigo-600 transition-colors tracking-tight uppercase">{translateValue(u.name)}</h4>
                                                                    <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100/50 whitespace-nowrap flex-shrink-0">
                                                                        {u.uniqueId}
                                                                    </span>
                                                                </div>

                                                                <div className="mt-1.5 space-y-1">
                                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                                                                        <Briefcase size={11} className="text-indigo-500 flex-shrink-0" />
                                                                        <span className="truncate">{translateValue(u.professionDetails?.jobRole) || translateValue(u.professionCategory)}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                                                        <MapPin size={11} className="text-indigo-300 flex-shrink-0" />
                                                                        <span className="truncate">{translateValue(u.locality)}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Card Action Area */}
                                                        <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100">
                                                            <div className="flex items-center gap-2">
                                                                <div className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-md group-hover:bg-indigo-700 transition-colors">
                                                                    <Phone size={12} />
                                                                </div>
                                                                <a href={`tel:${u.phone}`} className="text-[11px] font-black text-slate-800 hover:text-indigo-600 transition-colors">
                                                                    {u.phone}
                                                                </a>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100 shadow-sm">
                                                                <Star size={10} className="fill-amber-500" />
                                                                <span className="text-[9px] font-black">{u.impactScore || 0} {t('impact_score')}</span>
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
                            <h3 className="text-xl font-bold text-white tracking-tight">{t('community_horizon')}</h3>
                            <p className="text-gray-500 text-sm max-w-xs">{t('no_members_found')} {translateValue(stateName)} {t('yet')}.</p>
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
                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .scrollbar-thin::-webkit-scrollbar { height: 6px; }
                .scrollbar-thin::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); border-radius: 10px; }
                .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 10px; }
                .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,0.5); }
                .scrollbar-thin { scrollbar-width: thin; scrollbar-color: rgba(99,102,241,0.3) rgba(255,255,255,0.03); }
            `}} />
        </div >
    );
};

export default StateUsers;
