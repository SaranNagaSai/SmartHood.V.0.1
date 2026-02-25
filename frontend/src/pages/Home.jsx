import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Map, Zap, MapPin, Shield, X, Briefcase, Award, Sparkles, Navigation } from 'lucide-react';
import { API_URL, SERVER_URL, getProfilePhotoUrl } from '../utils/apiConfig';

const Home = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({ professions: [], states: [] });
    const [loading, setLoading] = useState(true);
    const [selectedProfession, setSelectedProfession] = useState(null);
    const [professionUsers, setProfessionUsers] = useState([]);
    const [showUserModal, setShowUserModal] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const userData = JSON.parse(localStorage.getItem('user'));
            const token = localStorage.getItem('token');
            if (userData) {
                setUser(userData);
                try {
                    const res = await fetch(`${API_URL}/users/stats`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const data = await res.json();
                    setStats({
                        professions: data.professions || [],
                        states: data.states || []
                    });
                } catch (err) {
                    console.error("Failed to fetch stats", err);
                }
            } else {
                navigate('/login');
            }
            setLoading(false);
        };
        fetchData();
    }, [navigate]);

    const handleProfessionClick = async (profession) => {
        setSelectedProfession(profession);
        setShowUserModal(true);
        setLoadingUsers(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/users/by-profession/${encodeURIComponent(profession)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            const sorted = (data || []).sort((a, b) => (b.experience || 0) - (a.experience || 0));
            setProfessionUsers(sorted);
        } catch (err) {
            console.error("Failed to fetch profession users", err);
            setProfessionUsers([]);
        }
        setLoadingUsers(false);
    };

    const closeModal = () => {
        setShowUserModal(false);
        setSelectedProfession(null);
        setProfessionUsers([]);
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-sm font-black text-gray-400 uppercase tracking-widest">{t('loading_neighborhood')}</p>
        </div>
    );

    if (!user) return null;

    const getProStyle = (category) => {
        const map = {
            'Software': { icon: '💻', color: 'bg-blue-50 text-blue-600' },
            'Medical': { icon: '⚕️', color: 'bg-red-50 text-red-600' },
            'Teaching': { icon: '📚', color: 'bg-yellow-50 text-yellow-600' },
            'Business': { icon: '💼', color: 'bg-purple-50 text-purple-600' },
            'Plumbing': { icon: '🔧', color: 'bg-gray-50 text-gray-600' }
        };
        return map[category] || { icon: '👷', color: 'bg-emerald-50 text-emerald-600' };
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-24 font-sans overflow-x-hidden">
            {/* Ultra-Premium Identity Banner */}
            <div className="bg-gradient-brand text-white p-8 md:p-12 rounded-b-[3.5rem] shadow-2xl relative overflow-hidden transition-all duration-700">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-white/[0.05] skew-x-12 transform translate-x-1/2"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row items-center md:items-center gap-8 md:gap-12">
                        {/* Profile Photo with Glow */}
                        <div className="relative group">
                            <div className="w-28 h-28 md:w-36 md:h-36 bg-white/20 backdrop-blur-3xl rounded-[2.5rem] p-1.5 border-4 border-white/30 shadow-2xl transform transition-transform group-hover:scale-105 duration-500 overflow-hidden">
                                {user.profilePhoto ? (
                                    <img src={getProfilePhotoUrl(user.profilePhoto)} alt="User" className="w-full h-full object-cover rounded-[1.75rem]" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-5xl font-black">{user.name?.charAt(0).toUpperCase()}</div>
                                )}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-emerald-400 w-8 h-8 rounded-2xl border-4 border-white shadow-xl flex items-center justify-center">
                                <Sparkles size={16} className="text-white" />
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="flex-1 text-center md:text-left">
                            <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] opacity-60 mb-2">{t('welcome_back_user')}</p>
                            <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4 drop-shadow-md">{user.name}</h1>

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
                                <div className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-xl border border-white/10 text-[10px] md:text-xs font-black tracking-widest flex items-center gap-2 uppercase">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></span>
                                    {user.uniqueId}
                                </div>
                                <div className="bg-black/20 px-4 py-1.5 rounded-xl text-[10px] md:text-xs font-black tracking-widest flex items-center gap-2 uppercase">
                                    <MapPin size={12} /> {user.locality}
                                </div>
                                <div className="bg-white/20 px-4 py-1.5 rounded-xl text-[10px] md:text-xs font-black tracking-widest flex items-center gap-2 uppercase">
                                    <Briefcase size={12} /> {user.professionCategory}
                                </div>
                            </div>
                        </div>

                        {/* Honor Display */}
                        <div className="bg-white/10 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/20 text-center md:text-right hidden lg:block min-w-[200px]">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Neighborhood Honor</p>
                            <p className="text-5xl font-black">{user.impactScore || 0}</p>
                            <div className="mt-4 flex items-center gap-2 justify-end">
                                <span className="text-[10px] font-black uppercase tracking-widest">Master Node</span>
                                <Award size={16} className="text-yellow-400" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Action Hub */}
            <div className="max-w-7xl mx-auto px-6 mt-8 space-y-12">
                {/* Simplified Quick Access Navigation */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                        onClick={() => navigate('/explore')}
                        className="p-6 bg-white rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center gap-3 active:scale-95 transition-all hover:shadow-xl hover:-translate-y-1 group"
                    >
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:rotate-12 transition-transform">
                            <Navigation size={24} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('explore_city')}</span>
                    </button>
                    <button
                        onClick={() => navigate('/service/offer')}
                        className="p-6 bg-white rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center gap-3 active:scale-95 transition-all hover:shadow-xl hover:-translate-y-1 group"
                    >
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:rotate-12 transition-transform">
                            <Briefcase size={24} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('offer_service')}</span>
                    </button>
                    <button
                        onClick={() => navigate('/service/request')}
                        className="p-6 bg-white rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center gap-3 active:scale-95 transition-all hover:shadow-xl hover:-translate-y-1 group"
                    >
                        <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl group-hover:rotate-12 transition-transform">
                            <Zap size={24} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('request_help')}</span>
                    </button>
                    <button
                        onClick={() => navigate('/alerts')}
                        className="p-6 bg-white rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center gap-3 active:scale-95 transition-all hover:shadow-xl hover:-translate-y-1 group"
                    >
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:rotate-12 transition-transform">
                            <Megaphone size={24} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('alerts')}</span>
                    </button>
                </div>

                {/* Local Professional Network */}
                <div>
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-black text-gray-800 uppercase tracking-tighter">{t('local_professionals')}</h2>
                        <div className="h-px flex-1 bg-slate-100 mx-6"></div>
                        <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">{t('view_all')}</button>
                    </div>

                    {stats.professions.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {stats.professions.slice(0, 12).map((prof, idx) => {
                                const style = getProStyle(prof._id || 'Others');
                                return (
                                    <div
                                        key={idx}
                                        onClick={() => handleProfessionClick(prof._id || 'Others')}
                                        className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-4 hover:shadow-2xl hover:border-indigo-100 transition-all group cursor-pointer active:scale-95 overflow-hidden relative"
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                            <span className="text-4xl">{style.icon}</span>
                                        </div>
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${style.color} group-hover:scale-110 group-hover:rotate-12 transition-all shadow-inner border border-black/5`}>
                                            {style.icon}
                                        </div>
                                        <div className="text-center">
                                            <h3 className="font-black text-gray-800 text-[10px] uppercase tracking-widest truncate max-w-[120px] mb-1">{t(prof._id.toLowerCase()) || prof._id}</h3>
                                            <div className="flex items-center justify-center gap-1.5">
                                                <div className="w-1 h-1 bg-indigo-600 rounded-full"></div>
                                                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{prof.count} Nodes</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-white p-20 rounded-[3rem] text-center border-4 border-dashed border-slate-100">
                            <Briefcase size={48} className="mx-auto mb-4 opacity-10 text-slate-400" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Grid Synchronization Required</p>
                            <p className="text-xs text-slate-300 mt-2">Zero professionals identified in this sector</p>
                        </div>
                    )}
                </div>
            </div>

            {/* User List Modal - Refined for Home */}
            {showUserModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[5000] flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-300" onClick={closeModal}>
                    <div
                        className="bg-white rounded-t-[3rem] md:rounded-[3rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-500"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="bg-gradient-brand p-8 text-white relative flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-1 opacity-70">Capability Extraction</p>
                                <h3 className="text-2xl font-black uppercase tracking-tight">{selectedProfession}</h3>
                                <p className="text-xs font-medium opacity-60 mt-1">Verified Local Resources: {professionUsers.length}</p>
                            </div>
                            <button onClick={closeModal} className="p-4 bg-white/10 rounded-full hover:bg-white/20 transition active:scale-90 shadow-xl">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 pt-6 custom-scrollbar">
                            {loadingUsers ? (
                                <div className="text-center py-20 flex flex-col items-center gap-4">
                                    <div className="w-10 h-10 border-2 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Querying Neural Network...</p>
                                </div>
                            ) : professionUsers.length > 0 ? (
                                <div className="space-y-4">
                                    {professionUsers.map((u, idx) => (
                                        <div key={idx} className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 hover:bg-white hover:shadow-2xl hover:border-indigo-100/50 transition-all duration-300 flex items-center gap-6 group">
                                            <div className="w-20 h-20 bg-white rounded-3xl p-1 shadow-lg group-hover:rotate-3 transition-transform">
                                                {u.profilePhoto ? (
                                                    <img src={getProfilePhotoUrl(u.profilePhoto)} alt="" className="w-full h-full rounded-2xl object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-indigo-50 text-indigo-400 rounded-2xl flex items-center justify-center font-black text-2xl uppercase">
                                                        {u.name.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                                    <h4 className="font-black text-gray-800 text-xl tracking-tight uppercase truncate">{u.name}</h4>
                                                    <span className="px-3 py-1 bg-white border border-slate-200 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest">{u.uniqueId}</span>
                                                </div>
                                                <p className="text-xs font-black text-indigo-600 mb-2 uppercase tracking-widest flex items-center gap-2">
                                                    <Briefcase size={12} /> {u.professionDetails?.jobRole || u.professionCategory}
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    <div className="px-2.5 py-1 bg-white border border-slate-100 text-[9px] font-black text-slate-400 rounded-lg flex items-center gap-1.5 uppercase">
                                                        <MapPin size={10} /> {u.locality}
                                                    </div>
                                                    <div className="px-2.5 py-1 bg-emerald-50 text-[9px] font-black text-emerald-600 rounded-lg flex items-center gap-1.5 uppercase tracking-widest">
                                                        <Award size={10} /> {u.experience || 0} Years Exp
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="hidden sm:block">
                                                <div className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-200 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all">
                                                    <Navigation size={20} className="rotate-90" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 text-gray-400">
                                    <Sparkles size={48} className="mx-auto mb-4 opacity-10" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No Active Nodes Identified</p>
                                </div>
                            )}
                        </div>

                        <div className="p-8 border-t border-slate-100 bg-slate-50/50">
                            <button className="w-full py-5 bg-gradient-brand text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-transform">Initiate Direct Interlink</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const Megaphone = ({ size, className }) => <Shield size={size} className={className} />;

export default Home;
