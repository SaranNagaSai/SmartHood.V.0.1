import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Map, Zap, MapPin, Shield, X, Briefcase, Award } from 'lucide-react';
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

    // Fetch users by profession when card is clicked
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
            // Sort by experience (highest first)
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

    if (loading) return <div className="p-8 text-center text-gray-500">{t('loading_neighborhood')}</div>;
    if (!user) return null;

    // Helper to get icon/color based on Pro category
    const getProStyle = (category) => {
        const map = {
            'Software': { icon: '💻', color: 'bg-blue-100 text-blue-700' },
            'Medical': { icon: '⚕️', color: 'bg-red-100 text-red-700' },
            'Teaching': { icon: '📚', color: 'bg-yellow-100 text-yellow-700' },
            'Business': { icon: '💼', color: 'bg-purple-100 text-purple-700' },
            'Plumbing': { icon: '🔧', color: 'bg-gray-100 text-gray-700' }
        };
        return map[category] || { icon: '👷', color: 'bg-green-100 text-green-700' };
    };

    // Helper to get full state name
    const getStateName = (input) => {
        if (!input) return 'Unknown';
        const code = input.toUpperCase().trim();
        const stateMap = {
            'AP': 'Andhra Pradesh',
            'TS': 'Telangana',
            'TN': 'Tamil Nadu',
            'KA': 'Karnataka',
            'KL': 'Kerala',
            'MH': 'Maharashtra',
            'DL': 'Delhi',
            'UP': 'Uttar Pradesh',
            'MP': 'Madhya Pradesh',
            'WB': 'West Bengal',
            'GJ': 'Gujarat',
            'RJ': 'Rajasthan',
            'PB': 'Punjab',
            'HR': 'Haryana'
        };
        return stateMap[code] || input;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100 pb-24">
            {/* Identity Banner */}
            <div className="bg-gradient-brand text-white p-6 md:p-8 rounded-b-[1.5rem] md:rounded-b-[2rem] shadow-lg relative overflow-hidden">
                <div className="relative z-10 flex items-center gap-3 md:gap-4">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-3xl md:text-4xl font-bold overflow-hidden border-2 md:border-4 border-white/30 shadow-2xl flex-shrink-0">
                        {user.profilePhoto ? (
                            <img
                                src={getProfilePhotoUrl(user.profilePhoto)}
                                alt="User"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            user.name?.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="opacity-80 text-[10px] md:text-sm font-medium tracking-wide uppercase truncate">{t('welcome_back_user')}</p>
                        <h1 className="text-xl md:text-2xl font-bold truncate">{user.name}</h1>
                        <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-1">
                            <span className="bg-white/20 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] md:text-xs font-mono tracking-wider flex items-center gap-1 whitespace-nowrap">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                {user.uniqueId}
                            </span>
                            <span className="bg-black/20 px-1.5 py-0.5 rounded text-[9px] md:text-xs flex items-center gap-1 whitespace-nowrap">
                                <MapPin size={8} md:size={10} /> {user.locality}
                            </span>
                        </div>
                    </div>
                </div>
                {/* Decorative background circle */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            </div>

            {/* State Cards (Marquee) */}
            <div className="mt-8 px-4 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-[var(--col-text-primary)]">{t('community_reach')}</h2>
                    <span className="text-xs font-bold text-primary bg-blue-50 px-2 py-1 rounded-md">{t('live')}</span>
                </div>

                {/* Static State Cards */}
                <div className="flex flex-wrap justify-center gap-6 px-4">
                    {(stats.states.length > 0
                        ? stats.states.filter(st => !['Test State', 'telangana', 'Telangana'].includes(st._id) && !['Test State', 'telangana', 'Telangana'].includes(st._id.trim()))
                        : []
                    ).length > 0 ? (
                        stats.states.filter(st => !['Test State', 'telangana', 'Telangana'].includes(st._id) && !['Test State', 'telangana', 'Telangana'].includes(st._id.trim())).map((st, idx) => {
                            const stateName = getStateName(st._id);
                            const isAP = stateName.toLowerCase().includes('andhra');
                            const isTS = stateName.toLowerCase().includes('telangana');

                            return (
                                <div
                                    key={idx}
                                    className={`min-w-[220px] h-64 rounded-2xl p-5 shadow-md flex flex-col justify-between hover:shadow-lg transition-all relative overflow-hidden group`}
                                >
                                    {/* Background Image or Gradient */}
                                    {isAP ? (
                                        <div className="absolute inset-0 z-0 bg-gray-900">
                                            <img
                                                src="/assets/images/AP-REP.jpg"
                                                alt="Andhra Pradesh"
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.parentNode.classList.add('bg-gradient-to-br', 'from-teal-500', 'to-emerald-700');
                                                    e.target.parentNode.classList.remove('bg-gray-900');
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                                        </div>
                                    ) : isTS ? (
                                        <div className="absolute inset-0 z-0 bg-gray-900">
                                            <img
                                                src="/assets/images/TG-REP.jpg"
                                                alt="Telangana"
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.parentNode.classList.add('bg-gradient-to-br', 'from-blue-600', 'to-indigo-800');
                                                    e.target.parentNode.classList.remove('bg-gray-900');
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                                        </div>
                                    ) : (
                                        <div className="absolute inset-0 z-0 bg-gradient-to-br from-indigo-500 to-purple-700"></div>
                                    )}

                                    <Map className="text-white opacity-50 relative z-10" size={24} />
                                    <div className="relative z-10 text-white">
                                        <span className="block font-bold text-lg drop-shadow-md">{stateName}</span>
                                        <span className="text-xs text-white/90 font-medium">{st.count} {t('active_users')}</span>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="w-full text-center text-gray-400 text-sm py-4">{t('no_active_states')}</div>
                    )}
                </div>
            </div>

            {/* Profession Grid */}
            <div className="mt-4 px-4">
                <h2 className="text-lg font-bold text-[var(--col-text-primary)] mb-4">{t('local_professionals')}</h2>
                {stats.professions.length > 0 ? (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                        {stats.professions.map((prof, idx) => {
                            const style = getProStyle(prof._id || 'Others');
                            return (
                                <div
                                    key={idx}
                                    onClick={() => handleProfessionClick(prof._id || 'Others')}
                                    className="bg-white p-4 md:p-5 rounded-xl md:rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 md:gap-3 hover:border-secondary transition-colors group cursor-pointer"
                                >
                                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-xl md:text-2xl ${style.color} group-hover:scale-110 transition-transform`}>
                                        {style.icon}
                                    </div>
                                    <div className="text-center">
                                        <h3 className="font-bold text-gray-800 text-xs md:text-sm truncate max-w-[100px]">{prof._id}</h3>
                                        <span className="text-[9px] md:text-[10px] font-bold text-gray-400 mt-0.5 md:mt-1 block">{prof.count} {t('pros_nearby')}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-gray-50 p-6 rounded-xl text-center text-gray-400 text-sm">
                        {t('no_professionals_locality')}
                    </div>
                )}
            </div>

            {/* Admin Login Button */}
            <div className="px-4 mt-6">
                <button
                    onClick={() => navigate('/admin')}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-center gap-3 hover:from-purple-700 hover:to-indigo-700 transition-all"
                >
                    <Shield size={20} />
                    <span className="font-bold">{t('admin_login')}</span>
                </button>
            </div>

            {/* Quick Explore */}
            <div className="px-4 mt-4">
                <button
                    onClick={() => navigate('/explore')}
                    className="w-full bg-[var(--col-text-primary)] text-white p-5 rounded-2xl shadow-xl flex items-center justify-between group overflow-hidden relative"
                >
                    <div className="relative z-10">
                        <span className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{t('discover')}</span>
                        <span className="block text-xl font-bold">{t('explore_city')}</span>
                    </div>
                    <div className="bg-white/10 p-3 rounded-full group-hover:rotate-45 transition-transform duration-500 relative z-10">
                        <Zap size={24} className="text-[var(--col-accent)]" fill="currentColor" />
                    </div>
                    {/* Background glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                </button>
            </div>

            {/* User List Modal */}
            {showUserModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
                        <div className="bg-gradient-to-r from-[var(--col-primary)] to-[var(--col-secondary)] p-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-white font-bold text-lg">{selectedProfession}</h3>
                                <p className="text-white/70 text-xs">{t('professionals_locality')}</p>
                            </div>
                            <button onClick={closeModal} className="text-white/80 hover:text-white p-1">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="overflow-y-auto max-h-[60vh] p-4">
                            {loadingUsers ? (
                                <div className="text-center py-8 text-gray-400">{t('loading')}</div>
                            ) : professionUsers.length > 0 ? (
                                <div className="space-y-3">
                                    {professionUsers.map((u, idx) => (
                                        <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-100 hover:border-[var(--col-primary)] transition-colors flex items-start gap-3">
                                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-gray-600 shadow-sm overflow-hidden border border-gray-200 flex-shrink-0">
                                                {u.profilePhoto ? (
                                                    <img
                                                        src={getProfilePhotoUrl(u.profilePhoto)}
                                                        alt="Pro"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    u.name.charAt(0)
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h4 className="font-bold text-gray-800">{u.name}</h4>
                                                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                            <MapPin size={10} /> {u.locality}
                                                        </p>
                                                        <p className="text-xs text-[var(--col-secondary)] mt-1">
                                                            <Briefcase size={10} className="inline mr-1" />
                                                            {u.professionDetails?.jobRole || u.professionCategory || t('professional')}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="bg-[var(--col-primary)]/10 text-[var(--col-primary)] px-2 py-1 rounded-md text-xs font-mono font-bold">
                                                            {u.uniqueId}
                                                        </span>
                                                        <div className="flex items-center gap-1 mt-2 text-xs text-amber-600">
                                                            <Award size={12} />
                                                            <span>{u.experience || 0} {t('yrs_exp')}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400">{t('no_professionals_modal')}</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
