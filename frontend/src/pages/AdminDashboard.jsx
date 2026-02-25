import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, TrendingUp, Bell, AlertTriangle, Briefcase,
    MapPin, BarChart3, Activity, DollarSign, PieChart,
    ArrowUp, ArrowDown, RefreshCw, LogOut, ChevronRight,
    Search, Filter, Download, PlusSquare
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { API_URL, SERVER_URL, getProfilePhotoUrl } from '../utils/apiConfig';

const AdminDashboard = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalUsers: 0,
        userGrowth: [],
        serviceStats: { offers: 0, requests: 0 },
        alertStats: { total: 0, byType: [] },
        notificationStats: { sent: 0, delivered: 0 },
        revenueStats: { total: 0, trend: [] },
        localityStats: []
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [users, setUsers] = useState([]);
    const [userLoading, setUserLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const adminToken = localStorage.getItem('adminToken');
        if (!adminToken) {
            navigate('/admin');
            return;
        }

        fetchAnalytics();
    }, [navigate]);

    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers();
        }
    }, [activeTab]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_URL}/admin/analytics`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setStats(data);
        } catch (err) {
            console.error('Failed to fetch analytics', err);
        }
        setLoading(false);
    };

    const fetchUsers = async () => {
        setUserLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_URL}/admin/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            console.error('Failed to fetch users', err);
        }
        setUserLoading(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        navigate('/admin');
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.uniqueId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.locality?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const tabs = [
        { id: 'overview', label: 'Ecosystem', icon: BarChart3 },
        { id: 'users', label: 'Demographics', icon: Users },
        { id: 'services', label: 'Services', icon: Briefcase },
        { id: 'alerts', label: 'Security', icon: AlertTriangle },
        { id: 'notifications', label: 'Broadcasts', icon: Bell }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-brand rounded-3xl animate-spin mx-auto mb-6 flex items-center justify-center shadow-xl">
                        <RefreshCw className="text-white" size={32} />
                    </div>
                    <p className="text-gray-400 font-black uppercase tracking-[0.3em] text-xs">Initializing Master Control</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Premium Header */}
            <div className="bg-gradient-brand text-white p-8 md:p-12 relative overflow-hidden transition-all duration-700">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-white/[0.04] skew-x-[20deg] transform origin-right pointer-events-none"></div>
                <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
                        <div className="text-center md:text-left">
                            <h1 className="text-4xl md:text-6xl font-black tracking-tighter drop-shadow-2xl mb-2">Command Center</h1>
                            <p className="text-white/60 font-black uppercase tracking-[0.4em] text-xs md:text-sm">SmartHood Global Network Analytics</p>
                        </div>

                        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-xl p-2 rounded-[2rem] border border-white/20 shadow-2xl">
                            <button
                                onClick={() => { fetchAnalytics(); if (activeTab === 'users') fetchUsers(); }}
                                className="flex items-center gap-3 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 group"
                            >
                                <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
                                Live Scan
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 px-6 py-3 bg-red-500/80 hover:bg-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg"
                            >
                                <LogOut size={16} />
                                Terminate
                            </button>
                        </div>
                    </div>

                    {/* Modern Tabs */}
                    <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 px-8 py-4 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.15em] transition-all whitespace-nowrap shadow-xl ${activeTab === tab.id
                                    ? 'bg-white text-primary scale-105 border-transparent'
                                    : 'bg-white/5 text-white/70 hover:bg-white/15 border border-white/10'
                                    }`}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-10 -mt-6 relative z-20">

                {activeTab === 'overview' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* Summary Stats Matrix */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <SummaryCard
                                title="Nodes Encrypted"
                                value={stats.totalUsers}
                                icon={Users}
                                trend={+12}
                                color="blue"
                                onClick={() => setActiveTab('users')}
                            />
                            <SummaryCard
                                title="Contribution Logic"
                                value={stats.serviceStats?.offers || 0}
                                icon={Briefcase}
                                trend={+8}
                                color="emerald"
                            />
                            <SummaryCard
                                title="Resource Requests"
                                value={stats.serviceStats?.requests || 0}
                                icon={Activity}
                                trend={-3}
                                color="amber"
                            />
                            <SummaryCard
                                title="Network Value"
                                value={`₹${stats.revenueStats?.total || 0}`}
                                icon={DollarSign}
                                trend={+15}
                                color="purple"
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Growth Chart */}
                            <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 group transition-all hover:shadow-indigo-500/5">
                                <div className="flex items-center justify-between mb-10">
                                    <h3 className="text-xl font-black text-gray-800 flex items-center gap-4">
                                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:rotate-12 transition-transform shadow-inner">
                                            <TrendingUp size={24} />
                                        </div>
                                        Revenue Trajectory
                                    </h3>
                                    <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-4 py-1.5 rounded-full uppercase tracking-widest border border-indigo-100 italic">Financial Audit Log</span>
                                </div>

                                {(stats.revenueStats?.trend || []).length > 0 ? (
                                    <div className="space-y-8">
                                        <div className="flex items-end gap-3 h-64 pt-6 px-2">
                                            {stats.revenueStats.trend.map((item, idx) => {
                                                const max = Math.max(...stats.revenueStats.trend.map(m => m.total)) || 1;
                                                const height = (item.total / max) * 100;
                                                return (
                                                    <div key={idx} className="flex-1 flex flex-col items-center gap-5 group/bar h-full justify-end">
                                                        <div
                                                            style={{ height: `${height}%` }}
                                                            className="w-full bg-gradient-to-t from-indigo-500 to-primary rounded-t-2xl transition-all hover:from-primary hover:to-indigo-400 cursor-pointer shadow-lg group-hover/bar:scale-x-110 relative"
                                                        >
                                                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-2 bg-gray-900 text-white text-[10px] font-black rounded-xl opacity-0 group-hover/bar:opacity-100 transition-all shadow-2xl z-20 whitespace-nowrap scale-90 group-hover/bar:scale-100">
                                                                ₹{item.total}
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest whitespace-nowrap group-hover/bar:text-primary transition-colors">
                                                            {item._id}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-64 flex items-center justify-center border-4 border-dashed border-gray-50 rounded-[2rem] text-gray-300">
                                        <p className="font-black uppercase tracking-widest opacity-20">Zero Financial Footprint</p>
                                    </div>
                                )}
                            </div>

                            {/* Locality Distribution */}
                            <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 transition-all hover:shadow-purple-500/5 group">
                                <h3 className="text-xl font-black text-gray-800 mb-8 flex items-center gap-4">
                                    <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl group-hover:rotate-12 transition-transform shadow-inner">
                                        <MapPin size={24} />
                                    </div>
                                    Geographic Density
                                </h3>
                                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                    {(stats.localityStats || []).length > 0 ? (
                                        stats.localityStats.map((loc, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-5 bg-gray-50/50 rounded-3xl border border-gray-100 hover:bg-white hover:shadow-xl transition-all duration-300 group/item">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-gray-800 text-sm uppercase tracking-tight">{loc._id}</span>
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Active Locality</span>
                                                </div>
                                                <span className="bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-700 px-4 py-1.5 rounded-2xl text-[11px] font-black border border-purple-200 shadow-sm">
                                                    {loc.count} Users
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-300 text-center py-12 italic font-medium">No sector data synchronized</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* User List Header / Filters */}
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 flex flex-col md:flex-row gap-6 items-center justify-between">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="SEARCH NAMES, IDS, OR LOCALITIES..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-gray-50/80 pl-12 pr-4 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-gray-100 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-inner"
                                />
                            </div>
                            <div className="flex gap-3 w-full md:w-auto">
                                <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-gray-600 transition-colors border border-gray-100 shadow-sm">
                                    <Filter size={16} /> Filter
                                </button>
                                <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg transition-all active:scale-95 shadow-xl">
                                    <Download size={16} /> Export CSV
                                </button>
                            </div>
                        </div>

                        {/* User Table Card */}
                        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
                            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/20">
                                <div>
                                    <h3 className="text-xl font-black text-gray-800 tracking-tight">Personnel Directory</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1">{filteredUsers.length} Nodes Synchronized</p>
                                </div>
                                <PlusSquare className="text-gray-200" size={32} />
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50/50 text-gray-400 text-[10px] uppercase tracking-[0.25em] font-black">
                                        <tr>
                                            <th className="px-8 py-6">Node Identity</th>
                                            <th className="px-8 py-6">Occupation Domain</th>
                                            <th className="px-8 py-6">Verified Comm Link</th>
                                            <th className="px-8 py-6 text-center">Protocol ID</th>
                                            <th className="px-8 py-6 text-right">Tenure</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {userLoading ? (
                                            <tr>
                                                <td colSpan="5" className="px-8 py-24 text-center">
                                                    <RefreshCw className="animate-spin inline-block text-primary mb-4" size={32} />
                                                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Hydrating Personnel Data...</p>
                                                </td>
                                            </tr>
                                        ) : filteredUsers.length > 0 ? (
                                            filteredUsers.map(user => (
                                                <tr
                                                    key={user._id}
                                                    className="group hover:bg-indigo-50/30 transition-all cursor-pointer relative"
                                                    onClick={() => navigate(`/admin/user/${user._id}`)}
                                                >
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-5">
                                                            <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-blue-100 text-primary rounded-2xl flex items-center justify-center font-black text-xl overflow-hidden border-2 border-white shadow-lg transition-transform group-hover:scale-110 duration-500">
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
                                                            <div>
                                                                <p className="font-black text-gray-800 text-lg tracking-tight group-hover:text-primary transition-colors">{user.name}</p>
                                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{user.locality}, {user.town}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-black text-gray-700 uppercase tracking-tight">
                                                                {user.professionDetails?.jobRole || user.professionDetails?.businessType || user.professionDetails?.course || user.professionCategory}
                                                            </span>
                                                            <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-1 opacity-60">System Core: {user.professionCategory}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-black text-gray-600 tracking-wider">+{user.phone}</p>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{user.email || 'ENCRYPTED'}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-center">
                                                        <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-[10px] font-black tracking-[0.2em] shadow-inner border border-gray-200">
                                                            {user.uniqueId}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex flex-col items-end">
                                                            <span className="font-black text-gray-800">{user.experience || 0} YRS</span>
                                                            <ChevronRight className="text-gray-200 group-hover:text-primary group-hover:translate-x-1 transition-all" size={20} />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan="5" className="px-8 py-24 text-center text-gray-300 font-black uppercase tracking-widest opacity-20">No Personnel Records Decrypted</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'services' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <AnalysisPanel
                            title="Capital Infusion (Offers)"
                            value={stats.serviceStats?.offers || 0}
                            subtext="Total nodes providing capability"
                            color="emerald"
                            icon={TrendingUp}
                        />
                        <AnalysisPanel
                            title="Demand Signals (Requests)"
                            value={stats.serviceStats?.requests || 0}
                            subtext="Nodes seeking resource allocation"
                            color="blue"
                            icon={Activity}
                        />
                    </div>
                )}

                {activeTab === 'alerts' && (
                    <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-700">
                        <div className="flex items-center justify-between mb-12">
                            <h3 className="text-2xl font-black text-gray-800 flex items-center gap-5">
                                <div className="p-4 bg-red-50 text-red-600 rounded-[2rem] shadow-inner border border-red-100/50">
                                    <AlertTriangle size={32} />
                                </div>
                                Threat Intelligence Matrix
                            </h3>
                            <div className="text-right">
                                <p className="text-4xl font-black text-red-600 tracking-tighter">{stats.alertStats?.total || 0}</p>
                                <p className="text-[10px] text-red-400 font-black uppercase tracking-[0.3em] mt-1">Total Breach Logs</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {['Emergency', 'Official', 'Welfare', 'Entertainment'].map((type, idx) => (
                                <div key={type} className="p-8 bg-gray-50/50 rounded-[2rem] border border-gray-100 text-center transition-all hover:bg-white hover:shadow-2xl hover:-translate-y-2 group duration-500">
                                    <div className={`w-14 h-14 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${type === 'Emergency' ? 'bg-red-500 text-white shadow-red-200' :
                                        type === 'Official' ? 'bg-blue-500 text-white shadow-blue-200' :
                                            type === 'Welfare' ? 'bg-amber-500 text-white shadow-amber-200' :
                                                'bg-purple-500 text-white shadow-purple-200'
                                        }`}>
                                        {type === 'Emergency' ? <AlertTriangle size={24} /> :
                                            type === 'Official' ? <Shield size={24} /> :
                                                type === 'Welfare' ? <Heart size={24} /> : <PieChart size={24} />}
                                    </div>
                                    <p className="text-4xl font-black text-gray-800 tracking-tighter">
                                        {stats.alertStats?.byType?.[idx]?.count || 0}
                                    </p>
                                    <p className="text-[11px] text-gray-400 font-black uppercase tracking-[0.25em] mt-3 group-hover:text-primary transition-colors">{type}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-700">
                        <div className="flex items-center justify-between mb-12">
                            <h3 className="text-2xl font-black text-gray-800 flex items-center gap-5">
                                <div className="p-4 bg-blue-50 text-blue-600 rounded-[2rem] shadow-inner border border-blue-100/50">
                                    <Bell size={32} />
                                </div>
                                Network Broadcast Audit
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="p-10 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100 text-center hover:bg-white hover:shadow-2xl transition-all duration-500 group">
                                <p className="text-6xl font-black text-indigo-700 tracking-tighter drop-shadow-sm group-hover:scale-110 transition-transform">
                                    {stats.notificationStats?.sent || 0}
                                </p>
                                <p className="text-[12px] text-indigo-400 font-black uppercase tracking-[0.4em] mt-6">Packets Dispatched</p>
                                <div className="mt-8 h-2 bg-indigo-100 rounded-full overflow-hidden shadow-inner">
                                    <div className="h-full bg-indigo-500 w-[100%] rounded-full"></div>
                                </div>
                            </div>
                            <div className="p-10 bg-emerald-50/50 rounded-[2.5rem] border border-emerald-100 text-center hover:bg-white hover:shadow-2xl transition-all duration-500 group">
                                <p className="text-6xl font-black text-emerald-700 tracking-tighter drop-shadow-sm group-hover:scale-110 transition-transform">
                                    {stats.notificationStats?.delivered || 0}
                                </p>
                                <p className="text-[12px] text-emerald-400 font-black uppercase tracking-[0.4em] mt-6">Ack Received</p>
                                <div className="mt-8 h-2 bg-emerald-100 rounded-full overflow-hidden shadow-inner">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stats.notificationStats?.sent > 0 ? (stats.notificationStats.delivered / stats.notificationStats.sent) * 100 : 0}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

/* ──── Sub-components ──── */

const SummaryCard = ({ title, value, icon: Icon, trend, color, onClick }) => (
    <div
        onClick={onClick}
        className={`bg-white p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 hover:shadow-indigo-500/10 transition-all duration-500 group relative overflow-hidden ${onClick ? 'cursor-pointer hover:-translate-y-2' : ''}`}
    >
        <div className={`absolute -right-4 -bottom-4 bg-${color}-50 p-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500`}>
            <Icon size={64} className={`text-${color}-200`} />
        </div>

        <div className="flex items-start justify-between relative z-10">
            <div className="space-y-4">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em]">{title}</p>
                <p className="text-5xl font-black text-gray-800 tracking-tighter group-hover:text-primary transition-colors">{value}</p>
                {trend && (
                    <div className={`flex items-center gap-1 text-[11px] font-black uppercase tracking-widest ${trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {trend >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                        <span>{Math.abs(trend)}% Velocity</span>
                    </div>
                )}
            </div>
            <div className={`p-4 rounded-2xl bg-${color}-50 text-${color}-600 shadow-inner group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 border border-${color}-100/50`}>
                <Icon size={28} />
            </div>
        </div>
    </div>
);

const AnalysisPanel = ({ title, value, subtext, color, icon: Icon }) => (
    <div className={`bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 flex flex-col items-center text-center transition-all hover:-translate-y-2 hover:shadow-${color}-500/10 group`}>
        <div className={`w-20 h-20 bg-${color}-50 text-${color}-600 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner border border-${color}-100/50 group-hover:rotate-12 transition-transform`}>
            <Icon size={40} />
        </div>
        <h3 className="text-xl font-black text-gray-500 uppercase tracking-[0.2em] mb-4">{title}</h3>
        <p className={`text-7xl font-black text-gray-800 tracking-tighter group-hover:text-${color}-600 transition-colors`}>{value}</p>
        <p className="text-sm text-gray-400 font-bold mt-6 italic opacity-60">" {subtext} "</p>
    </div>
);

const Shield = ({ size, className }) => <AlertTriangle size={size} className={className} />;
const Heart = ({ size, className }) => <Activity size={size} className={className} />;

export default AdminDashboard;
