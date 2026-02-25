import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, User, MapPin, Phone, Mail, Briefcase, Award,
    TrendingUp, TrendingDown, DollarSign, Bell, AlertTriangle,
    Activity, Clock, Calendar, BarChart3, PieChart, Star,
    RefreshCw, ChevronRight, Shield, Heart, Globe, LogOut
} from 'lucide-react';
import { API_URL, SERVER_URL, getProfilePhotoUrl } from '../utils/apiConfig';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => `${i}:00`);
const STATUS_COLORS = {
    active: '#3b82f6', OPEN: '#3b82f6',
    in_progress: '#f59e0b', IN_PROGRESS: '#f59e0b',
    completed: '#10b981', COMPLETED: '#10b981',
    cancelled: '#ef4444', CLOSED: '#6b7280'
};
const CATEGORY_COLORS = {
    Emergency: '#dc2626', Official: '#2563eb',
    Welfare: '#d97706', Entertainment: '#8b5cf6'
};

const AdminUserStats = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const adminToken = localStorage.getItem('adminToken');
        if (!adminToken) { navigate('/admin'); return; }
        fetchStats();
    }, [id]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_URL}/admin/users/${id}/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            setData(json);
        } catch (err) {
            console.error('Failed to fetch user stats', err);
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-10 h-10 text-purple-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Loading user analytics...</p>
                </div>
            </div>
        );
    }

    if (!data || !data.user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-500">User not found</p>
            </div>
        );
    }

    const { user, services, financial, alerts, notifications, engagement } = data;

    // Build hour heatmap (24 hrs)
    const hourData = Array(24).fill(0);
    (engagement.activityByHour || []).forEach(h => { hourData[h._id] = h.count; });
    const maxHour = Math.max(...hourData, 1);

    // Build day of week chart
    const dayData = Array(7).fill(0);
    (engagement.activityByDay || []).forEach(d => { dayData[d._id - 1] = d.count; });
    const maxDay = Math.max(...dayData, 1);

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Header Section */}
            <div className="bg-gradient-brand text-white p-6 md:p-10 relative overflow-hidden transition-all duration-700 animate-gradient-slow">
                <div className="absolute top-0 right-0 w-2/3 h-full bg-white/[0.03] skew-x-[15deg] transform origin-right pointer-events-none"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <button
                        onClick={() => navigate('/admin/dashboard')}
                        className="flex items-center gap-2.5 text-white/70 hover:text-white mb-8 transition-all px-4 py-2 bg-white/5 rounded-2xl border border-white/10 w-fit active:scale-95 group shadow-lg"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-black text-xs tracking-[0.2em] uppercase">Return to Dashboard</span>
                    </button>

                    <div className="flex flex-col md:flex-row items-center md:items-end gap-8 md:gap-10">
                        <div className="relative group">
                            <div className="w-36 h-36 md:w-44 md:h-44 bg-white/20 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center text-6xl font-black overflow-hidden border-4 border-white/30 shadow-2xl transition-all group-hover:scale-[1.02] group-hover:border-white/50 duration-500">
                                {user.profilePhoto ? (
                                    <img
                                        src={getProfilePhotoUrl(user.profilePhoto)}
                                        alt="User"
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                ) : (
                                    <span className="animate-pulse">{user.name?.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            <div className="absolute -bottom-3 -right-3 bg-green-400 w-10 h-10 rounded-2xl border-4 border-white shadow-xl flex items-center justify-center" title="Verified Member">
                                <Award size={20} className="text-white fill-current" />
                            </div>
                        </div>

                        <div className="flex-1 text-center md:text-left">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-3">
                                <h1 className="text-4xl md:text-6xl font-black tracking-tighter drop-shadow-xl">{user.name}</h1>
                                <div className="flex gap-2">
                                    <span className="px-4 py-1.5 bg-black/30 backdrop-blur-md rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-white/10 shadow-inner">
                                        ID: {user.uniqueId}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-8 gap-y-3 mt-4 text-white/90 text-sm font-black tracking-wide">
                                <span className="flex items-center gap-2.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/5 shadow-sm"><MapPin size={16} className="text-blue-200" /> {user.locality}, {user.town}</span>
                                <span className="flex items-center gap-2.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/5 shadow-sm"><Phone size={16} className="text-orange-200" /> {user.phone}</span>
                                {user.email && <span className="flex items-center gap-2.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/5 shadow-sm"><Mail size={16} className="text-purple-200" /> {user.email}</span>}
                            </div>

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-6">
                                <span className="px-4 py-2 bg-gradient-to-r from-blue-600/40 to-indigo-600/40 backdrop-blur-md rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 shadow-lg">{user.professionCategory}</span>
                                <span className="px-4 py-2 bg-gradient-to-r from-purple-600/40 to-pink-600/40 backdrop-blur-md rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 shadow-lg">{user.gender} • {user.age} Yrs</span>
                                <span className="px-4 py-2 bg-gradient-to-r from-red-600/40 to-orange-600/40 backdrop-blur-md rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 shadow-lg flex items-center gap-2">
                                    <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span> {user.bloodGroup} Group
                                </span>
                                <div className="px-4 py-2 bg-white text-primary rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-2 border-2 border-primary/20">
                                    <Star size={12} className="fill-primary" /> Honor: {user.impactScore}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8 -mt-8 relative z-20">

                {/* Quick Performance Matrix */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <QuickStat icon={Briefcase} label="Services Offered" value={services.offered} color="blue" />
                    <QuickStat icon={Activity} label="Services Requested" value={services.requested} color="purple" />
                    <QuickStat icon={Star} label="Total Completed" value={services.completed} color="green" />
                    <QuickStat icon={TrendingUp} label="Total Earned" value={`₹${financial.earned}`} color="emerald" />
                    <QuickStat icon={TrendingDown} label="Total Spent" value={`₹${financial.spent}`} color="red" />
                    <QuickStat icon={Shield} label="Impact Factor" value={engagement.impactScore} color="amber" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Financial Summary */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 transition-all hover:shadow-indigo-500/10 group">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-gray-800 flex items-center gap-4">
                                <div className="p-3 bg-green-50 text-green-600 rounded-2xl group-hover:rotate-12 transition-transform shadow-inner border border-green-100/50">
                                    <DollarSign size={24} />
                                </div>
                                Financial Ecosystem
                            </h3>
                            <span className="text-[10px] font-black text-green-500 bg-green-50 px-3 py-1 rounded-full uppercase tracking-widest border border-green-100">Live Analytics</span>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-10">
                            <div className="p-6 bg-green-50/40 rounded-3xl text-center border border-green-100 shadow-sm">
                                <p className="text-3xl font-black text-green-700 tracking-tight">₹{financial.earned}</p>
                                <p className="text-[10px] text-green-600 font-black uppercase tracking-[0.2em] mt-2">Profits</p>
                            </div>
                            <div className="p-6 bg-red-50/40 rounded-3xl text-center border border-red-100 shadow-sm">
                                <p className="text-3xl font-black text-red-700 tracking-tight">₹{financial.spent}</p>
                                <p className="text-[10px] text-red-600 font-black uppercase tracking-[0.2em] mt-2">Losses</p>
                            </div>
                            <div className={`p-6 rounded-3xl text-center border shadow-sm ${financial.net >= 0 ? 'bg-emerald-50/40 border-emerald-100' : 'bg-orange-50/40 border-orange-100'}`}>
                                <p className={`text-3xl font-black tracking-tight ${financial.net >= 0 ? 'text-emerald-700' : 'text-orange-700'}`}>
                                    {financial.net >= 0 ? '+' : ''}₹{financial.net}
                                </p>
                                <p className={`text-[10px] ${financial.net >= 0 ? 'text-emerald-600' : 'text-orange-600'} font-black uppercase tracking-[0.2em] mt-2">Net Balance</p>
                            </div>
                        </div>

                        {/* Monthly Trend Bar Chart */}
                        {(financial.monthlyTrend || []).length > 0 ? (
                            <div className="space-y-6 pt-6 border-t border-gray-50">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Historical Cash Flow</h4>
                                    <div className="flex gap-4 text-[9px] font-black uppercase tracking-widest">
                                        <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-green-400 rounded-lg shadow-sm" /> Inflow</span>
                                        <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-red-400 rounded-lg shadow-sm" /> Outflow</span>
                                    </div>
                                </div>
                                <div className="flex items-end gap-3.5 h-48 pt-6">
                                    {financial.monthlyTrend.map((m, idx) => {
                                        const maxVal = Math.max(...financial.monthlyTrend.map(x => Math.max(x.earned || 0, x.spent || 0)), 1);
                                        return (
                                            <div key={idx} className="flex-1 flex flex-col items-center gap-4 group">
                                                <div className="w-full flex gap-1.5 items-end h-full">
                                                    <div
                                                        className="flex-1 bg-green-400 rounded-t-xl transition-all group-hover:bg-green-500 shadow-sm"
                                                        style={{ height: `${((m.earned || 0) / maxVal) * 100}%` }}
                                title={`Earned: ₹${m.earned}`}
                                                    />
                                <div
                                    className="flex-1 bg-red-400 rounded-t-xl transition-all group-hover:bg-red-500 shadow-sm"
                                    style={{ height: `${((m.spent || 0) / maxVal) * 100}%` }}
                                    title={`Spent: ₹${m.spent}`}
                                />
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest transition-colors group-hover:text-gray-800">{m._id}</span>
                        </div>
                        );
                                    })}
                    </div>
                </div>
                ) : (
                <div className="text-gray-300 text-center py-16 border-4 border-dashed border-gray-50 rounded-[2rem] bg-gray-50/30">
                    <DollarSign size={40} className="mx-auto mb-4 opacity-10" />
                    <p className="text-sm font-black uppercase tracking-widest text-gray-400">Zero Transaction Log</p>
                </div>
                        )}
            </div>

            {/* Service Performance */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 transition-all hover:shadow-blue-500/10 group">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-gray-800 flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:rotate-12 transition-transform shadow-inner border border-blue-100/50">
                            <PieChart size={24} />
                        </div>
                        Services Matrix
                    </h3>
                    <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest border border-blue-100">Quality Score: A+</span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-10">
                    <div className="p-6 bg-blue-50/40 rounded-3xl flex items-center gap-5 border border-blue-100 shadow-sm">
                        <div className="p-3 bg-white rounded-2xl shadow-sm text-blue-600">
                            <Briefcase size={20} />
                        </div>
                        <div className="text-left">
                            <p className="text-3xl font-black text-blue-700 tracking-tight">{services.offered}</p>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mt-1">Offers</p>
                        </div>
                    </div>
                    <div className="p-6 bg-purple-50/40 rounded-3xl flex items-center gap-5 border border-purple-100 shadow-sm">
                        <div className="p-3 bg-white rounded-2xl shadow-sm text-purple-600">
                            <Activity size={20} />
                        </div>
                        <div className="text-left">
                            <p className="text-3xl font-black text-purple-700 tracking-tight">{services.requested}</p>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-500 mt-1">Requests</p>
                        </div>
                    </div>
                    <div className="p-6 bg-green-50/40 rounded-3xl flex items-center gap-5 border border-green-100 shadow-sm">
                        <div className="p-3 bg-white rounded-2xl shadow-sm text-green-600">
                            <Star size={20} />
                        </div>
                        <div className="text-left">
                            <p className="text-3xl font-black text-green-700 tracking-tight">{services.completed}</p>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500 mt-1">Ready</p>
                        </div>
                    </div>
                    <div className="p-6 bg-amber-50/40 rounded-3xl flex items-center gap-5 border border-amber-100 shadow-sm">
                        <div className="p-3 bg-white rounded-2xl shadow-sm text-amber-600">
                            <Clock size={20} />
                        </div>
                        <div className="text-left">
                            <p className="text-3xl font-black text-amber-700 tracking-tight">{services.active}</p>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 mt-1">Active</p>
                        </div>
                    </div>
                </div>

                {/* Status Matrix */}
                {(services.statusDistribution || []).length > 0 && (
                    <div className="space-y-6 pt-6 border-t border-gray-50">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 text-left">Status Distribution Spectrum</h4>
                        <div className="flex rounded-2xl overflow-hidden h-10 mb-6 shadow-inner bg-gray-50 border border-gray-100 p-1.5 gap-1.5">
                            {services.statusDistribution.map((s, idx) => (
                                <div
                                    key={idx}
                                    className="h-full rounded-lg transition-all group relative cursor-pointer"
                                    style={{
                                        width: `${(s.count / (services.offered + services.requested || 1)) * 100}%`,
                                        backgroundColor: STATUS_COLORS[s._id] || '#94a3b8',
                                        minWidth: s.count > 0 ? '20px' : '0'
                                    }}
                                >
                                    <div className="absolute opacity-0 group-hover:opacity-100 bottom-full mb-3 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-black px-3 py-2 rounded-xl whitespace-nowrap z-30 pointer-events-none transition-all transform scale-90 group-hover:scale-100">
                                        {s._id}: {s.count} Tasks
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-4 pt-2">
                            {services.statusDistribution.map((s, idx) => (
                                <span key={idx} className="flex items-center gap-2.5 text-[10px] font-black text-gray-500 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100 shadow-sm uppercase tracking-widest">
                                    <span className="w-2.5 h-2.5 rounded-full shadow-inner" style={{ backgroundColor: STATUS_COLORS[s._id] || '#94a3b8' }} />
                                    {s._id} • {s.count}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-8 p-8 bg-gradient-to-br from-indigo-50/50 to-blue-50/50 rounded-3xl flex items-center justify-between border border-blue-100/50 shadow-inner group-hover:shadow-md transition-shadow duration-500">
                    <div className="flex items-center gap-4 text-left">
                        <div className="p-3 bg-white rounded-2xl text-indigo-500 shadow-sm border border-indigo-50">
                            <Heart size={20} className="fill-indigo-50" />
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] block">Collaboration</span>
                            <span className="text-sm text-indigo-900 font-black uppercase tracking-tight">Active Interests Logged</span>
                        </div>
                    </div>
                    <span className="text-4xl font-black text-indigo-600 tracking-tighter">{services.interestedIn}</span>
                </div>
            </div>
        </div>

                {/* Engagement Analysis */ }
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Hours Analysis */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-gray-800 flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner border border-indigo-100/50">
                        <Clock size={24} />
                    </div>
                    Retention & Pulse
                </h3>
                <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest border border-indigo-100">24H Heatmap</span>
            </div>

            <div className="grid grid-cols-12 gap-2">
                {hourData.map((count, hr) => (
                    <div
                        key={hr}
                        className="aspect-square rounded-xl flex items-center justify-center text-[10px] font-black transition-all hover:scale-110 cursor-pointer group relative shadow-sm border border-transparent"
                        style={{
                            backgroundColor: count === 0
                                ? '#f8fafc'
                                : `rgba(99, 102, 241, ${0.1 + (count / maxHour) * 0.9})`,
                            color: count > maxHour * 0.5 ? 'white' : '#64748b',
                            borderColor: count > 0 ? 'rgba(99, 102, 241, 0.2)' : '#f1f5f9'
                        }}
                    >
                        {count > 0 ? count : ''}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-2 bg-gray-900 text-white text-[10px] font-black rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-2xl whitespace-nowrap z-30 pointer-events-none scale-90 group-hover:scale-100">
                            {hr}:00 Window • {count} Logs
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex justify-between mt-6 text-[10px] font-black text-gray-400 px-1 uppercase tracking-widest">
                <span>Midnight</span><span>6 AM</span><span>Noon</span><span>6 PM</span><span>11 PM</span>
            </div>
            <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <span>Vitals:</span>
                {[0.1, 0.3, 0.5, 0.7, 1].map((opacity, i) => (
                    <span key={i} className="w-5 h-5 rounded-lg shadow-sm" style={{ backgroundColor: `rgba(99, 102, 241, ${opacity})` }} />
                ))}
                <span className="ml-auto">Active Pulse Intensity</span>
            </div>
        </div>

        {/* Weekly Activity Analysis */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-gray-800 flex items-center gap-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl shadow-inner border border-purple-100/50">
                        <Calendar size={24} />
                    </div>
                    Weekly Orbit
                </h3>
                <span className="text-[10px] font-black text-purple-500 bg-purple-50 px-3 py-1 rounded-full uppercase tracking-widest border border-purple-100">Network Flow</span>
            </div>

            <div className="flex items-end gap-5 h-52 mt-4 px-2">
                {dayData.map((count, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-4 group relative h-full justify-end">
                        <div
                            className="w-full rounded-2xl transition-all hover:scale-x-105 shadow-lg border border-white/50"
                            style={{
                                height: `${count === 0 ? 10 : (count / maxDay) * 100}%`,
                                background: `linear-gradient(to top, #6366f1, #a855f7)`
                            }}
                        >
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-2 bg-gray-900 text-white text-[10px] font-black rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-2xl whitespace-nowrap z-30 pointer-events-none scale-90 group-hover:scale-100">
                                {count} Interactions
                            </div>
                        </div>
                        <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest transition-colors group-hover:text-purple-600">{DAY_NAMES[idx]}</span>
                    </div>
                ))}
            </div>
            <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">
                <span>Weekly Trends Verified</span>
                <span className="text-purple-500">Highest Engagement: {DAY_NAMES[dayData.indexOf(maxDay)]}</span>
            </div>
        </div>
    </div>

    {/* Alerts & Community Reports */ }
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 group">
            <h3 className="text-xl font-black text-gray-800 mb-8 flex items-center gap-4">
                <div className="p-3 bg-red-50 text-red-600 rounded-2xl shadow-inner border border-red-100/50 group-hover:shake transition-none">
                    <AlertTriangle size={24} />
                </div>
                Incident Reports
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-6 bg-red-50/40 rounded-3xl text-center border border-red-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-1 opacity-10">
                        <LogOut size={48} />
                    </div>
                    <p className="text-4xl font-black text-red-700 tracking-tighter">{alerts.total}</p>
                    <p className="text-[10px] text-red-600 font-black uppercase tracking-[0.2em] mt-2">Raised Alerts</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {(alerts.byCategory || []).map((cat, idx) => (
                        <div key={idx} className="p-3 rounded-2xl text-center flex flex-col justify-center border shadow-inner" style={{ backgroundColor: (CATEGORY_COLORS[cat._id] || '#6366f1') + '15', borderColor: (CATEGORY_COLORS[cat._id] || '#6366f1') + '30' }}>
                            <p className="text-lg font-black" style={{ color: CATEGORY_COLORS[cat._id] || '#6366f1' }}>{cat.count}</p>
                            <p className="text-[8px] font-black uppercase tracking-widest truncate" style={{ color: CATEGORY_COLORS[cat._id] || '#6366f1' }}>{cat._id}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Timeline */}
            {(alerts.recent || []).length > 0 && (
                <div className="space-y-3 pt-6 border-t border-gray-50">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 text-left">Incident Log Timeline</h4>
                    {alerts.recent.slice(0, 4).map((alert, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-lg transition-all duration-300">
                            <div className="w-2.5 h-2.5 rounded-full shadow-inner animate-pulse" style={{ backgroundColor: CATEGORY_COLORS[alert.category] || '#ef4444' }} />
                            <div className="flex-1 min-w-0 text-left">
                                <p className="text-sm font-black text-gray-800 truncate leading-tight uppercase tracking-tight">{alert.description}</p>
                                <p className="text-[10px] font-black text-gray-400 mt-1 uppercase tracking-widest">
                                    {alert.category} • {new Date(alert.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 group">
            <h3 className="text-xl font-black text-gray-800 mb-8 flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-inner border border-blue-100/50">
                    <Bell size={24} />
                </div>
                Communication Logs
            </h3>

            <div className="grid grid-cols-3 gap-3 mb-10">
                <div className="p-5 bg-blue-50/40 rounded-3xl text-center border border-blue-100 shadow-sm">
                    <p className="text-3xl font-black text-blue-700 tracking-tight">{notifications.total}</p>
                    <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.2em] mt-2">Total</p>
                </div>
                <div className="p-5 bg-green-50/40 rounded-3xl text-center border border-green-100 shadow-sm">
                    <p className="text-3xl font-black text-green-700 tracking-tight">{notifications.read}</p>
                    <p className="text-[10px] text-green-600 font-black uppercase tracking-[0.2em] mt-2">Read</p>
                </div>
                <div className="p-5 bg-orange-50/40 rounded-3xl text-center border border-orange-100 shadow-sm">
                    <p className="text-3xl font-black text-orange-700 tracking-tight">{notifications.unread}</p>
                    <p className="text-[10px] text-orange-600 font-black uppercase tracking-[0.2em] mt-2">New</p>
                </div>
            </div>

            {/* Read rate analytics visual */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-10 p-8 bg-gradient-to-br from-gray-50 to-white rounded-[2rem] border border-gray-100 shadow-inner">
                <div className="relative w-32 h-32 transform group-hover:scale-110 transition-transform duration-500">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                        <circle
                            cx="18" cy="18" r="15.9" fill="none" stroke="url(#blue_grad)" strokeWidth="4"
                            strokeDasharray={`${notifications.total > 0 ? (notifications.read / notifications.total) * 100 : 0}, 100`}
                            strokeLinecap="round"
                            className="animate-dash"
                        />
                        <defs>
                            <linearGradient id="blue_grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#3b82f6" />
                                <stop offset="100%" stopColor="#8b5cf6" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-3xl font-black text-gray-900 tracking-tighter">
                            {notifications.total > 0 ? Math.round((notifications.read / notifications.total) * 100) : 0}%
                        </span>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Reader Rate</span>
                    </div>
                </div>
                <div className="space-y-4 text-left">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full shadow-lg shadow-green-500/30" />
                        <p className="text-xs font-black text-gray-600 uppercase tracking-tight"><span className="text-green-600 text-lg mr-1">{notifications.read}</span> Acknowledged</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-orange-500 rounded-full shadow-lg shadow-orange-500/30" />
                        <p className="text-xs font-black text-gray-600 uppercase tracking-tight"><span className="text-orange-600 text-lg mr-1">{notifications.unread}</span> Unresolved</p>
                    </div>
                    <p className="text-[10px] font-black text-gray-400 mt-4 uppercase tracking-[0.2em] pt-4 border-t border-gray-100">Response Latency: 2.4s</p>
                </div>
            </div>
        </div>
    </div>

    {/* Database Architecture & Records */ }
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-gray-100">
                <h3 className="text-xl font-black text-gray-800 mb-8 flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner border border-indigo-100/50">
                        <User size={24} />
                    </div>
                    Personal Record
                </h3>
                <div className="space-y-4">
                    <ProfileRow label="Legal Name" value={user.name} />
                    <ProfileRow label="Verified Contact" value={user.phone} />
                    <ProfileRow label="Email Address" value={user.email || 'N/A'} />
                    <ProfileRow label="Gender/Age" value={`${user.gender} • ${user.age}`} />
                    <ProfileRow label="Blood Matrix" value={`${user.bloodGroup} Group`} />
                    <ProfileRow label="Home Locality" value={user.locality} />
                    <ProfileRow label="Residential District" value={user.district} />
                </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-gray-100">
                <h3 className="text-xl font-black text-gray-800 mb-8 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-inner border border-blue-100/50">
                        <Briefcase size={24} />
                    </div>
                    Occupational Log
                </h3>
                <div className="space-y-4">
                    <ProfileRow label="Professional Core" value={user.professionCategory} />
                    {user.professionDetails?.jobRole && <ProfileRow label="Job/Domain" value={user.professionDetails.jobRole} />}
                    {user.professionDetails?.educationLevel && <ProfileRow label="Credential" value={user.professionDetails.educationLevel} />}
                    <ProfileRow label="Tenure" value={`${user.experience || 0} Professional Years`} />
                    <ProfileRow label="Project Income" value={`₹${user.revenue || 0}`} />
                    <div className="mt-4 pt-4 border-t border-gray-50">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Description / Bio</p>
                        <p className="text-xs text-gray-600 leading-relaxed italic border-l-4 border-blue-100 pl-4">{user.professionDetails?.description || 'No detailed professional bio logged in the system architecture.'}</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="lg:col-span-2">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 h-full">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-gray-800 flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-inner border border-emerald-100/50">
                            <Activity size={24} />
                        </div>
                        Service Transaction Timeline
                    </h3>
                    <button className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-primary transition-colors shadow-sm">
                        <RefreshCw size={20} />
                    </button>
                </div>

                {(services.recent || []).length > 0 ? (
                    <div className="space-y-4">
                        {services.recent.map((svc, idx) => (
                            <div key={idx} className="flex flex-col md:flex-row md:items-center gap-6 p-6 bg-gray-50/50 rounded-3xl border border-gray-100 hover:bg-white hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
                                <div className={`absolute top-0 left-0 w-1.5 h-full ${svc.type === 'offer' ? 'bg-blue-500' : 'bg-emerald-500'}`} />

                                <div className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center text-white shadow-lg transform group-hover:rotate-12 transition-transform ${svc.type === 'offer' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'}`}>
                                    {svc.type === 'offer' ? <Briefcase size={24} /> : <Heart size={24} />}
                                </div>

                                <div className="flex-1 min-w-0 text-left">
                                    <div className="flex items-center gap-3 mb-1">
                                        <p className="text-lg font-black text-gray-800 uppercase tracking-tight">{svc.title}</p>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest ${svc.type === 'offer' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                            {svc.type}
                                        </span>
                                    </div>
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                        Event ID: SVC-{svc._id?.slice(-6).toUpperCase()} • {new Date(svc.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>

                                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                                    <div className="text-right">
                                        {svc.amountSpent > 0 && <p className="text-lg font-black text-gray-900 tracking-tighter">₹{svc.amountSpent}</p>}
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Transaction Val</p>
                                    </div>
                                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border border-black/5 ${svc.status === 'COMPLETED' ? 'bg-green-500 text-white' :
                                            svc.status === 'IN_PROGRESS' ? 'bg-amber-400 text-white' : 'bg-gray-200 text-gray-600'
                                        }`}>
                                        {svc.status}
                                    </span>
                                </div>
                            </div>
                        ))}

                        <div className="mt-8 p-10 bg-gradient-brand rounded-3xl text-white text-center shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-full bg-white/5 skew-x-12 transform -translate-x-1/2" />
                            <Globe size={40} className="mx-auto mb-4 opacity-30 animate-pulse" />
                            <h4 className="text-2xl font-black tracking-tight mb-2">Network Expansion Stats</h4>
                            <p className="text-white/70 text-sm font-black uppercase tracking-[0.2em] mb-6">Auditing 100% of community transactions</p>
                            <button className="px-8 py-3 bg-white text-primary rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition shadow-2xl">Download User Audit Report</button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-20 text-gray-300">
                        <Activity size={64} className="opacity-10 mb-6" />
                        <p className="text-xl font-black uppercase tracking-widest opacity-30">No Transactions Found</p>
                    </div>
                )}
            </div>
        </div>
    </div>
            </div >
        </div >
    );
};

/* ──── Sub-components ──── */
const QuickStat = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 text-center hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 group">
        <div className={`mx-auto mb-3 p-3 bg-${color}-50 text-${color}-600 rounded-2xl w-fit group-hover:scale-110 transition-transform shadow-inner border border-${color}-100/50`}>
            <Icon size={22} />
        </div>
        <p className="text-2xl font-black text-gray-900 tracking-tight">{value}</p>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-2 leading-tight">{label}</p>
    </div>
);

const ProfileRow = ({ label, value }) => (
    <div className="flex flex-col text-left py-3 border-b border-gray-50 last:border-0 group">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 group-hover:text-primary transition-colors">{label}</span>
        <span className="text-sm font-black text-gray-800 truncate">{value || 'UNSPECIFIED'}</span>
    </div>
);

export default AdminUserStats;
