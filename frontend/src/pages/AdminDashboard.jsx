import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, TrendingUp, Bell, AlertTriangle, Briefcase,
    MapPin, BarChart3, Activity, DollarSign, PieChart,
    ArrowUp, ArrowDown, RefreshCw, LogOut
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

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
            const res = await fetch('http://localhost:5000/api/admin/analytics', {
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
            const res = await fetch('http://localhost:5000/api/admin/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            console.error('Failed to fetch users', err);
        }
        setUserLoading(false);
    };

    const StatCard = ({ title, value, icon: Icon, change, color = 'blue', onClick }) => (
        <div
            onClick={onClick}
            className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition ${onClick ? 'cursor-pointer hover:border-blue-200' : ''}`}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-gray-500 text-sm font-medium">{title}</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
                    {change !== undefined && (
                        <div className={`flex items-center gap-1 mt-2 text-sm ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {change >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                            <span>{Math.abs(change)}% from last month</span>
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-xl bg-${color}-100`}>
                    <Icon className={`text-${color}-600`} size={24} />
                </div>
            </div>
        </div>
    );

    const tabs = [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'services', label: 'Services', icon: Briefcase },
        { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
        { id: 'notifications', label: 'Notifications', icon: Bell }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-10 h-10 text-purple-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Loading analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">Admin Analytics</h1>
                            <p className="text-purple-200 text-sm mt-1">SmartHood Dashboard</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => { fetchAnalytics(); if (activeTab === 'users') fetchUsers(); }}
                                className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl hover:bg-white/20 transition"
                            >
                                <RefreshCw size={18} />
                                Refresh
                            </button>
                            <button
                                onClick={() => { localStorage.removeItem('adminToken'); navigate('/admin'); }}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-100 rounded-xl hover:bg-red-500/20 transition"
                            >
                                <LogOut size={18} />
                                Logout
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mt-6 overflow-x-auto pb-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-white text-purple-700'
                                    : 'bg-white/10 text-white hover:bg-white/20'
                                    }`}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto p-6">
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Overview Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard
                                title={t('total_users')}
                                value={stats.totalUsers}
                                icon={Users}
                                change={12}
                                color="blue"
                                onClick={() => setActiveTab('users')}
                            />
                            <StatCard
                                title={t('service_offers')}
                                value={stats.serviceStats?.offers || 0}
                                icon={Briefcase}
                                change={8}
                                color="green"
                            />
                            <StatCard
                                title={t('service_requests')}
                                value={stats.serviceStats?.requests || 0}
                                icon={Activity}
                                change={-3}
                                color="amber"
                            />
                            <StatCard
                                title={t('total_revenue')}
                                value={`₹${stats.revenueStats?.total || 0}`}
                                icon={DollarSign}
                                change={15}
                                color="purple"
                            />
                        </div>

                        {/* Revenue Trend Chart Simple Visualization */}
                        {(stats.revenueStats?.trend || []).length > 0 && (
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <TrendingUp className="text-green-600" size={20} />
                                    Revenue Growth
                                </h3>
                                <div className="flex items-end gap-2 h-48">
                                    {stats.revenueStats.trend.map((item, idx) => {
                                        const max = Math.max(...stats.revenueStats.trend.map(m => m.total)) || 1;
                                        const height = (item.total / max) * 100;
                                        return (
                                            <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                                                <div
                                                    style={{ height: `${height}%` }}
                                                    className="w-full bg-indigo-500 rounded-t-lg transition-all hover:bg-indigo-600 cursor-pointer"
                                                >
                                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition">
                                                        ₹{item.total}
                                                    </div>
                                                </div>
                                                <span className="text-[10px] text-gray-400 font-bold whitespace-nowrap">
                                                    {item._id}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Locality Distribution */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <MapPin className="text-purple-600" size={20} />
                                User Growth by Locality
                            </h3>
                            <div className="space-y-3">
                                {(stats.localityStats || []).length > 0 ? (
                                    stats.localityStats.map((loc, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                            <span className="font-medium text-gray-700">{loc._id}</span>
                                            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-bold">
                                                {loc.count} users
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-400 text-center py-4">No locality data available</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">User Statistics</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-blue-50 rounded-xl text-center">
                                    <p className="text-3xl font-bold text-blue-700">{stats.totalUsers}</p>
                                    <p className="text-blue-600 text-sm">Total Registered</p>
                                </div>
                                <div className="p-4 bg-green-50 rounded-xl text-center">
                                    <p className="text-3xl font-bold text-green-700">{stats.localityStats?.length || 0}</p>
                                    <p className="text-green-600 text-sm">Active Localities</p>
                                </div>
                                <div className="p-4 bg-purple-50 rounded-xl text-center">
                                    <p className="text-3xl font-bold text-purple-700">
                                        {stats.userGrowth?.reduce((acc, curr) => acc + curr.count, 0) || 0}
                                    </p>
                                    <p className="text-purple-600 text-sm">This Week</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-800">Complete User List</h3>
                                <span className="text-sm text-gray-500 font-medium">{users.length} Users Found</span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-bold">
                                        <tr>
                                            <th className="px-6 py-4">User Details</th>
                                            <th className="px-6 py-4">Profession</th>
                                            <th className="px-6 py-4">Contact</th>
                                            <th className="px-6 py-4">Unique ID</th>
                                            <th className="px-6 py-4 text-center">Experience</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {userLoading ? (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                                                    <RefreshCw className="animate-spin inline-block mr-2" size={16} />
                                                    Fetching user records...
                                                </td>
                                            </tr>
                                        ) : users.length > 0 ? (
                                            users.map(user => (
                                                <tr key={user._id} className="hover:bg-purple-50/50 transition cursor-pointer" onClick={() => navigate(`/admin/user/${user._id}`)}>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-bold overflow-hidden border border-purple-200">
                                                                {user.profilePhoto ? (
                                                                    <img src={`http://localhost:5000${user.profilePhoto}`} alt="User" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    user.name?.charAt(0)
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-purple-700 hover:underline">{user.name}</p>
                                                                <p className="text-xs text-gray-500">{user.locality}, {user.town}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium text-gray-700">
                                                                {user.professionDetails?.jobRole || user.professionDetails?.businessType || user.professionDetails?.course || user.professionCategory}
                                                            </span>
                                                            <span className="text-[10px] text-gray-400 font-bold uppercase">{user.professionCategory}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm font-mono text-gray-600">{user.phone}</p>
                                                        <p className="text-[10px] text-gray-400">{user.email || 'No Email'}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-mono font-bold">
                                                            {user.uniqueId}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="font-bold text-gray-700">{user.experience || 0} yrs</span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400">No users found</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'services' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Service Offers</h3>
                            <div className="text-center py-8">
                                <p className="text-5xl font-bold text-green-600">{stats.serviceStats?.offers || 0}</p>
                                <p className="text-gray-500 mt-2">Total offers posted</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Service Requests</h3>
                            <div className="text-center py-8">
                                <p className="text-5xl font-bold text-blue-600">{stats.serviceStats?.requests || 0}</p>
                                <p className="text-gray-500 mt-2">Total requests posted</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'alerts' && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Alert Statistics</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {['Emergency', 'Official', 'Welfare', 'Entertainment'].map((type, idx) => (
                                <div key={type} className="p-4 bg-gray-50 rounded-xl text-center">
                                    <p className="text-2xl font-bold text-gray-700">
                                        {stats.alertStats?.byType?.[idx]?.count || 0}
                                    </p>
                                    <p className="text-gray-500 text-sm">{type}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Notification Delivery</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 bg-blue-50 rounded-xl text-center">
                                <p className="text-4xl font-bold text-blue-700">{stats.notificationStats?.sent || 0}</p>
                                <p className="text-blue-600 mt-2">Total Sent</p>
                            </div>
                            <div className="p-6 bg-green-50 rounded-xl text-center">
                                <p className="text-4xl font-bold text-green-700">{stats.notificationStats?.delivered || 0}</p>
                                <p className="text-green-600 mt-2">Successfully Delivered</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
