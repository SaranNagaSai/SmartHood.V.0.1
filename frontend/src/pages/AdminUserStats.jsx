import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, User, MapPin, Phone, Mail, Briefcase, Award,
    TrendingUp, TrendingDown, DollarSign, Bell, AlertTriangle,
    Activity, Clock, Calendar, BarChart3, PieChart, Star,
    RefreshCw, ChevronRight
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
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 text-white p-6">
                <div className="max-w-6xl mx-auto">
                    <button
                        onClick={() => navigate('/admin/dashboard')}
                        className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition"
                    >
                        <ArrowLeft size={18} /> Back to Dashboard
                    </button>
                    <div className="flex items-center gap-5">
                        <div className="w-32 h-32 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-5xl font-bold overflow-hidden border-2 border-white/30 shadow-xl">
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
                            <h1 className="text-2xl font-bold">{user.name}</h1>
                            <div className="flex items-center gap-4 mt-1 text-white/80 text-sm flex-wrap">
                                <span className="flex items-center gap-1"><MapPin size={14} /> {user.locality}, {user.town}</span>
                                <span className="flex items-center gap-1"><Phone size={14} /> {user.phone}</span>
                                {user.email && <span className="flex items-center gap-1"><Mail size={14} /> {user.email}</span>}
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="px-3 py-1 bg-white/15 rounded-full text-xs font-bold">{user.professionCategory}</span>
                                <span className="px-3 py-1 bg-white/15 rounded-full text-xs font-bold">ID: {user.uniqueId}</span>
                                <span className="px-3 py-1 bg-white/15 rounded-full text-xs font-bold">{user.gender} • Age {user.age}</span>
                                <span className="px-3 py-1 bg-white/15 rounded-full text-xs font-bold">🩸 {user.bloodGroup}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-6 space-y-6">

                {/* ──── Quick Stats Row ──── */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <QuickStat icon={Briefcase} label="Services Offered" value={services.offered} color="blue" />
                    <QuickStat icon={Activity} label="Services Requested" value={services.requested} color="purple" />
                    <QuickStat icon={Star} label="Completed" value={services.completed} color="green" />
                    <QuickStat icon={TrendingUp} label="Earned" value={`₹${financial.earned}`} color="emerald" />
                    <QuickStat icon={TrendingDown} label="Spent" value={`₹${financial.spent}`} color="red" />
                    <QuickStat icon={Award} label="Impact Score" value={engagement.impactScore} color="amber" />
                </div>

                {/* ──── Financial & Services Row ──── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Financial Summary */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <DollarSign className="text-green-600" size={20} /> Financial Overview
                        </h3>
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <div className="p-4 bg-green-50 rounded-xl text-center">
                                <p className="text-2xl font-bold text-green-700">₹{financial.earned}</p>
                                <p className="text-xs text-green-600">Earned</p>
                            </div>
                            <div className="p-4 bg-red-50 rounded-xl text-center">
                                <p className="text-2xl font-bold text-red-700">₹{financial.spent}</p>
                                <p className="text-xs text-red-600">Spent</p>
                            </div>
                            <div className={`p-4 rounded-xl text-center ${financial.net >= 0 ? 'bg-emerald-50' : 'bg-orange-50'}`}>
                                <p className={`text-2xl font-bold ${financial.net >= 0 ? 'text-emerald-700' : 'text-orange-700'}`}>
                                    {financial.net >= 0 ? '+' : ''}₹{financial.net}
                                </p>
                                <p className={`text-xs ${financial.net >= 0 ? 'text-emerald-600' : 'text-orange-600'}`}>Net</p>
                            </div>
                        </div>

                        {/* Monthly Trend Bar Chart */}
                        {(financial.monthlyTrend || []).length > 0 ? (
                            <>
                                <h4 className="text-sm font-bold text-gray-500 mb-3">Monthly Revenue Trend</h4>
                                <div className="flex items-end gap-2 h-32">
                                    {financial.monthlyTrend.map((m, idx) => {
                                        const maxVal = Math.max(...financial.monthlyTrend.map(x => Math.max(x.earned || 0, x.spent || 0)), 1);
                                        return (
                                            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                                                <div className="w-full flex gap-[2px]">
                                                    <div
                                                        className="flex-1 bg-green-400 rounded-t"
                                                        style={{ height: `${((m.earned || 0) / maxVal) * 100}px` }}
                                                        title={`Earned: ₹${m.earned}`}
                                                    />
                                                    <div
                                                        className="flex-1 bg-red-400 rounded-t"
                                                        style={{ height: `${((m.spent || 0) / maxVal) * 100}px` }}
                                                        title={`Spent: ₹${m.spent}`}
                                                    />
                                                </div>
                                                <span className="text-[9px] text-gray-400">{m._id}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-400 rounded-sm" /> Earned</span>
                                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-400 rounded-sm" /> Spent</span>
                                </div>
                            </>
                        ) : (
                            <p className="text-gray-400 text-center text-sm py-4">No financial data yet</p>
                        )}
                    </div>

                    {/* Service Distribution */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <PieChart className="text-blue-600" size={20} /> Service Breakdown
                        </h3>

                        {/* Service Stats Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="p-4 bg-blue-50 rounded-xl text-center">
                                <p className="text-2xl font-bold text-blue-700">{services.offered}</p>
                                <p className="text-xs text-blue-600">Offered</p>
                            </div>
                            <div className="p-4 bg-purple-50 rounded-xl text-center">
                                <p className="text-2xl font-bold text-purple-700">{services.requested}</p>
                                <p className="text-xs text-purple-600">Requested</p>
                            </div>
                            <div className="p-4 bg-green-50 rounded-xl text-center">
                                <p className="text-2xl font-bold text-green-700">{services.completed}</p>
                                <p className="text-xs text-green-600">Completed</p>
                            </div>
                            <div className="p-4 bg-amber-50 rounded-xl text-center">
                                <p className="text-2xl font-bold text-amber-700">{services.active}</p>
                                <p className="text-xs text-amber-600">Active</p>
                            </div>
                        </div>

                        {/* Status Distribution Bar */}
                        {(services.statusDistribution || []).length > 0 && (
                            <>
                                <h4 className="text-sm font-bold text-gray-500 mb-2">Status Distribution</h4>
                                <div className="flex rounded-full overflow-hidden h-6 mb-2">
                                    {services.statusDistribution.map((s, idx) => (
                                        <div
                                            key={idx}
                                            className="h-full transition-all"
                                            style={{
                                                width: `${(s.count / (services.offered + services.requested || 1)) * 100}%`,
                                                backgroundColor: STATUS_COLORS[s._id] || '#94a3b8',
                                                minWidth: s.count > 0 ? '20px' : '0'
                                            }}
                                            title={`${s._id}: ${s.count}`}
                                        />
                                    ))}
                                </div>
                                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                                    {services.statusDistribution.map((s, idx) => (
                                        <span key={idx} className="flex items-center gap-1">
                                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[s._id] || '#94a3b8' }} />
                                            {s._id} ({s.count})
                                        </span>
                                    ))}
                                </div>
                            </>
                        )}

                        <div className="mt-4 p-3 bg-indigo-50 rounded-xl flex items-center justify-between">
                            <span className="text-sm text-indigo-700 font-medium">Showed interest in</span>
                            <span className="text-lg font-bold text-indigo-700">{services.interestedIn} services</span>
                        </div>
                    </div>
                </div>

                {/* ──── Activity Heatmap & Day Chart ──── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Active Hours Heatmap */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Clock className="text-indigo-600" size={20} /> Active Hours
                        </h3>
                        <div className="grid grid-cols-12 gap-1">
                            {hourData.map((count, hr) => (
                                <div
                                    key={hr}
                                    className="aspect-square rounded-md flex items-center justify-center text-[9px] font-bold transition-all hover:scale-110 cursor-default group relative"
                                    style={{
                                        backgroundColor: count === 0
                                            ? '#f1f5f9'
                                            : `rgba(99, 102, 241, ${0.15 + (count / maxHour) * 0.85})`,
                                        color: count > maxHour * 0.5 ? 'white' : '#475569'
                                    }}
                                >
                                    {count > 0 ? count : ''}
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                                        {hr}:00 - {count} actions
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-2 text-[10px] text-gray-400">
                            <span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>11 PM</span>
                        </div>
                        <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                            <span>Less</span>
                            {[0.1, 0.3, 0.5, 0.7, 1].map((opacity, i) => (
                                <span key={i} className="w-4 h-4 rounded" style={{ backgroundColor: `rgba(99, 102, 241, ${opacity})` }} />
                            ))}
                            <span>More</span>
                        </div>
                    </div>

                    {/* Activity by Day of Week */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Calendar className="text-purple-600" size={20} /> Activity by Day
                        </h3>
                        <div className="flex items-end gap-3 h-40">
                            {dayData.map((count, idx) => (
                                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                                    <div
                                        className="w-full rounded-t-lg transition-all hover:opacity-80"
                                        style={{
                                            height: `${count === 0 ? 4 : (count / maxDay) * 120 + 16}px`,
                                            background: `linear-gradient(to top, #7c3aed, #a78bfa)`
                                        }}
                                    >
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                                            {count} actions
                                        </div>
                                    </div>
                                    <span className="text-[11px] font-bold text-gray-500">{DAY_NAMES[idx]}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ──── Alerts & Notifications Row ──── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Alerts */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <AlertTriangle className="text-red-600" size={20} /> Alerts Raised
                        </h3>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-4 bg-red-50 rounded-xl text-center flex-1">
                                <p className="text-3xl font-bold text-red-700">{alerts.total}</p>
                                <p className="text-xs text-red-600">Total Alerts</p>
                            </div>
                            {(alerts.byCategory || []).map((cat, idx) => (
                                <div key={idx} className="p-3 rounded-xl text-center flex-1" style={{ backgroundColor: (CATEGORY_COLORS[cat._id] || '#6366f1') + '15' }}>
                                    <p className="text-xl font-bold" style={{ color: CATEGORY_COLORS[cat._id] || '#6366f1' }}>{cat.count}</p>
                                    <p className="text-[10px] font-bold" style={{ color: CATEGORY_COLORS[cat._id] || '#6366f1' }}>{cat._id}</p>
                                </div>
                            ))}
                        </div>

                        {/* Recent alerts */}
                        {(alerts.recent || []).length > 0 && (
                            <div className="space-y-2 mt-4">
                                <h4 className="text-sm font-bold text-gray-500">Recent Alerts</h4>
                                {alerts.recent.slice(0, 5).map((alert, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[alert.category] || '#6366f1' }} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-700 truncate">{alert.description}</p>
                                            <p className="text-[10px] text-gray-400">{alert.category} • {new Date(alert.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Notifications */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Bell className="text-blue-600" size={20} /> Notifications
                        </h3>
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <div className="p-4 bg-blue-50 rounded-xl text-center">
                                <p className="text-2xl font-bold text-blue-700">{notifications.total}</p>
                                <p className="text-xs text-blue-600">Total</p>
                            </div>
                            <div className="p-4 bg-green-50 rounded-xl text-center">
                                <p className="text-2xl font-bold text-green-700">{notifications.read}</p>
                                <p className="text-xs text-green-600">Read</p>
                            </div>
                            <div className="p-4 bg-orange-50 rounded-xl text-center">
                                <p className="text-2xl font-bold text-orange-700">{notifications.unread}</p>
                                <p className="text-xs text-orange-600">Unread</p>
                            </div>
                        </div>

                        {/* Read rate donut visual */}
                        <div className="flex items-center justify-center gap-6">
                            <div className="relative w-28 h-28">
                                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                                    <circle
                                        cx="18" cy="18" r="15.9" fill="none" stroke="#10b981" strokeWidth="3"
                                        strokeDasharray={`${notifications.total > 0 ? (notifications.read / notifications.total) * 100 : 0}, 100`}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center flex-col">
                                    <span className="text-lg font-bold text-gray-800">
                                        {notifications.total > 0 ? Math.round((notifications.read / notifications.total) * 100) : 0}%
                                    </span>
                                    <span className="text-[10px] text-gray-400">Read Rate</span>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm">
                                <p className="text-gray-600"><span className="font-bold text-green-600">{notifications.read}</span> notifications read</p>
                                <p className="text-gray-600"><span className="font-bold text-orange-600">{notifications.unread}</span> still pending</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ──── Account & Profile Details ──── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Profile Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <User className="text-indigo-600" size={20} /> Profile Details
                        </h3>
                        <div className="space-y-3">
                            <ProfileRow label="Full Name" value={user.name} />
                            <ProfileRow label="Phone" value={user.phone} />
                            <ProfileRow label="Email" value={user.email || 'Not provided'} />
                            <ProfileRow label="Gender" value={user.gender} />
                            <ProfileRow label="Age" value={user.age} />
                            <ProfileRow label="Blood Group" value={user.bloodGroup} />
                            <ProfileRow label="Address" value={user.address || 'Not provided'} />
                        </div>
                    </div>

                    {/* Professional Details */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Briefcase className="text-blue-600" size={20} /> Professional Info
                        </h3>
                        <div className="space-y-3">
                            <ProfileRow label="Category" value={user.professionCategory} />
                            {user.professionDetails?.jobRole && <ProfileRow label="Job Role" value={user.professionDetails.jobRole} />}
                            {user.professionDetails?.sector && <ProfileRow label="Sector" value={user.professionDetails.sector} />}
                            {user.professionDetails?.businessType && <ProfileRow label="Business" value={user.professionDetails.businessType} />}
                            {user.professionDetails?.educationLevel && <ProfileRow label="Education" value={user.professionDetails.educationLevel} />}
                            {user.professionDetails?.course && <ProfileRow label="Course" value={user.professionDetails.course} />}
                            {user.professionDetails?.description && <ProfileRow label="Description" value={user.professionDetails.description} />}
                            <ProfileRow label="Experience" value={`${user.experience || 0} years`} />
                            <ProfileRow label="Revenue" value={`₹${user.revenue || 0}`} />
                        </div>
                    </div>

                    {/* Account Info */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <BarChart3 className="text-purple-600" size={20} /> Account Info
                        </h3>
                        <div className="space-y-3">
                            <ProfileRow label="Unique ID" value={user.uniqueId} />
                            <ProfileRow label="Locality" value={user.locality} />
                            <ProfileRow label="Town" value={user.town} />
                            <ProfileRow label="District" value={user.district} />
                            <ProfileRow label="State" value={user.state} />
                            <ProfileRow label="Language" value={user.language || 'English'} />
                            <ProfileRow label="Account Age" value={`${engagement.accountAgeDays} days`} />
                            <ProfileRow label="Registered" value={new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} />
                        </div>
                    </div>
                </div>

                {/* ──── Recent Services Timeline ──── */}
                {(services.recent || []).length > 0 && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Activity className="text-green-600" size={20} /> Recent Services
                        </h3>
                        <div className="space-y-3">
                            {services.recent.map((svc, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 ${svc.type === 'offer' ? 'bg-blue-500' : 'bg-green-500'
                                        }`}>
                                        {svc.type === 'offer' ? <Briefcase size={18} /> : <Activity size={18} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-800 truncate">{svc.title}</p>
                                        <p className="text-xs text-gray-400">
                                            {svc.type === 'offer' ? 'Offered' : 'Requested'} • {new Date(svc.createdAt).toLocaleDateString()}
                                            {svc.amountSpent > 0 && ` • ₹${svc.amountSpent}`}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold`} style={{
                                        backgroundColor: (STATUS_COLORS[svc.status] || '#94a3b8') + '20',
                                        color: STATUS_COLORS[svc.status] || '#94a3b8'
                                    }}>
                                        {svc.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

/* ──── Sub-components ──── */
const QuickStat = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition">
        <Icon className={`mx-auto mb-2 text-${color}-600`} size={22} />
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-[11px] text-gray-500 font-medium mt-1">{label}</p>
    </div>
);

const ProfileRow = ({ label, value }) => (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
        <span className="text-sm text-gray-500">{label}</span>
        <span className="text-sm font-medium text-gray-800 text-right max-w-[60%] truncate">{value}</span>
    </div>
);

export default AdminUserStats;
