import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { ArrowLeft, MapPin, Briefcase, Phone, User, Users, Star } from 'lucide-react';
import axios from 'axios';
import { API_URL, getProfilePhotoUrl } from '../utils/apiConfig';

const StateUsers = () => {
    const { stateName } = useParams();
    const { language, t, translateValue } = useLanguage();
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
        if (!users || !Array.isArray(users)) return {};
        const tempMap = {};

        users.forEach(u => {
            const rawDistrict = u.district || 'Unspecified District';
            const rawTown = u.town || 'Unspecified Town';
            const dKey = rawDistrict.trim().toLowerCase();
            const tKey = rawTown.trim().toLowerCase();

            // Only title case if it looks like English/Latin script
            const formatName = (str) => {
                if (!str) return '';
                const isLatin = /^[A-Za-z\s]+$/.test(str);
                return isLatin ? str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()) : str;
            };

            if (!tempMap[dKey]) {
                tempMap[dKey] = { displayName: formatName(rawDistrict.trim()), towns: {} };
            }
            if (!tempMap[dKey].towns[tKey]) {
                tempMap[dKey].towns[tKey] = { displayName: formatName(rawTown.trim()), users: [] };
            }
            tempMap[dKey].towns[tKey].users.push(u);
        });

        // Sort districts alphabetically
        const sortedData = {};
        Object.keys(tempMap).sort((a, b) => a.localeCompare(b)).forEach(dKey => {
            const districtInfo = tempMap[dKey];
            const sortedTowns = {};
            Object.keys(districtInfo.towns).sort((a, b) => a.localeCompare(b)).forEach(tKey => {
                sortedTowns[districtInfo.towns[tKey].displayName] = districtInfo.towns[tKey].users;
            });
            sortedData[districtInfo.displayName] = sortedTowns;
        });

        return sortedData;
    }, [users]);


    return (
        <div className="min-h-screen relative overflow-x-hidden bg-[#050507] text-white">
            {/* PREMIUN STARFIELD BACKGROUND */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[#050507]"></div>
                {/* Simplified Starfield for performance */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(1px_1px_at_10%_10%,#fff_100%,transparent_0),radial-gradient(1px_1px_at_45%_50%,#fff_100%,transparent_0),radial-gradient(1.5px_1.5px_at_70%_20%,#fff_100%,transparent_0),radial-gradient(2px_2px_at_30%_80%,#fff_100%,transparent_0)] bg-[length:400px_400px]"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-purple-500/5"></div>
            </div>

            {/* Premium Glass Header */}
            <div className="sticky top-0 z-50 bg-[#0a0a0c]/80 backdrop-blur-3xl border-b border-white/5 px-4 sm:px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2.5 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all active:scale-95"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="min-w-0">
                        <h1 className="font-extrabold text-lg sm:text-xl lg:text-2xl text-white tracking-tight flex items-center gap-2 truncate">
                            {translateValue(stateName)} <span className="text-indigo-400 font-medium opacity-80 hidden sm:inline">{t('discovery_hub')}</span>
                        </h1>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Users size={9} className="text-indigo-400" />
                            {users.length} {t('active_users')}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-sm">
                        {Object.keys(groupedData).length}
                    </div>
                </div>
            </div>

            <div className="relative z-10 w-full max-w-[100vw] mx-auto px-4 md:px-8 py-8 space-y-12 sm:space-y-16">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-6">
                        <div className="relative">
                            <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 bg-indigo-500/10 blur-xl rounded-full"></div>
                        </div>
                        <p className="text-indigo-400/50 font-bold text-[9px] uppercase tracking-[0.2em]">{t('searching_members')}...</p>
                    </div>
                ) : users.length > 0 ? (
                    Object.entries(groupedData).map(([district, towns], dIdx) => (
                        <div key={district} className="space-y-6 sm:space-y-8">
                            {/* District Header */}
                            <div className="flex flex-col gap-2 relative">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-indigo-400 shadow-2xl relative overflow-hidden">
                                        <Star size={20} sm:size={24} className="relative z-10 fill-indigo-400/20" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight truncate">{translateValue(district)}</h2>
                                        <p className="text-[8px] sm:text-[10px] font-bold text-indigo-400/60 uppercase tracking-widest">
                                            {Object.keys(towns).length} {t('major_towns')} &bull; {Object.values(towns).reduce((acc, arr) => acc + arr.length, 0)} {t('members')}
                                        </p>
                                    </div>
                                </div>
                                <div className="absolute -left-4 top-0 bottom-0 w-0.5 sm:w-1 bg-gradient-to-b from-indigo-500 to-transparent rounded-full opacity-30"></div>
                            </div>

                            {/* Towns Container */}
                            <div className="space-y-8 sm:space-y-10 pl-3 sm:pl-4 border-l border-white/5">
                                {Object.entries(towns).map(([town, townUsers]) => {
                                    const isRedundant = town.toLowerCase() === district.toLowerCase();

                                    return (
                                        <div key={town} className="space-y-4">
                                            {!isRedundant && (
                                                <div className="flex items-center gap-3">
                                                    <div className="h-[1px] w-6 sm:w-8 bg-indigo-500/30"></div>
                                                    <MapPin size={12} className="text-indigo-400" />
                                                    <h3 className="font-bold text-indigo-300 uppercase text-[10px] tracking-[0.15em] truncate max-w-[150px]">{translateValue(town)}</h3>
                                                    <span className="text-[8px] font-black text-gray-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/5 whitespace-nowrap">
                                                        {townUsers.length} {t('members')}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                                                {townUsers.map((u, uIdx) => (
                                                    <div
                                                        key={u._id || uIdx}
                                                        className="bg-white rounded-[1.25rem] sm:rounded-[1.5rem] border border-slate-100 p-4 sm:p-5 group hover:shadow-xl transition-all duration-300 flex flex-col gap-4 shadow-lg"
                                                    >
                                                        <div className="flex gap-3 sm:gap-4">
                                                            <div className="relative flex-shrink-0">
                                                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border-2 border-slate-100 bg-slate-50 p-0.5 group-hover:scale-105 transition-transform duration-300">
                                                                    {u.profilePhoto ? (
                                                                        <img
                                                                            src={getProfilePhotoUrl(u.profilePhoto)}
                                                                            alt=""
                                                                            className="w-full h-full object-cover rounded-xl"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-400 rounded-xl">
                                                                            <User size={20} />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-lg"></div>
                                                            </div>

                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex justify-between items-start gap-1">
                                                                    <div className="flex-1 min-w-0">
                                                                        <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm truncate group-hover:text-indigo-600 transition-colors uppercase">{translateValue(u.name)}</h4>
                                                                        {u.language && u.language !== (language || 'English') && (
                                                                            <span className={`inline-block translate-y-[-2px] text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border ${u.language === 'Telugu'
                                                                                ? 'bg-orange-50 text-orange-600 border-orange-200'
                                                                                : 'bg-blue-50 text-blue-600 border-blue-200'
                                                                                }`}>
                                                                                {u.language === 'Telugu' ? t('telugu_user') : t('english_user')}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-[7px] sm:text-[8px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100/50 whitespace-nowrap flex-shrink-0">
                                                                        {u.uniqueId}
                                                                    </span>
                                                                </div>

                                                                <div className="mt-1 space-y-0.5">
                                                                    <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-slate-600 truncate">
                                                                        <Briefcase size={10} className="text-indigo-500 flex-shrink-0" />
                                                                        <span className="truncate">{translateValue(u.professionDetails?.jobRole) || translateValue(u.professionCategory)}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-slate-400 truncate">
                                                                        <MapPin size={10} className="text-indigo-300 flex-shrink-0" />
                                                                        <span className="truncate">{translateValue(u.locality)}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100">
                                                            <a href={`tel:${u.phone}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                                                                <div className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-sm">
                                                                    <Phone size={10} />
                                                                </div>
                                                                <span className="text-[10px] font-black text-slate-800">
                                                                    {u.phone}
                                                                </span>
                                                            </a>
                                                            <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-1.5 py-1 rounded-lg border border-amber-100">
                                                                <Star size={9} className="fill-amber-500" />
                                                                <span className="text-[8px] font-black">{u.impactScore || 0}</span>
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
                    <div className="flex flex-col items-center justify-center py-40 text-center space-y-4">
                        <Users size={40} className="text-white/10" />
                        <h3 className="text-lg font-bold text-gray-500 uppercase tracking-widest">{t('no_members_found')}</h3>
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes pulse {
                    0%, 100% { opacity: 0.1; }
                    50% { opacity: 0.3; }
                }
                .animate-pulse { animation: pulse 4s ease-in-out infinite; }
            `}} />
        </div >
    );
};

export default StateUsers;
