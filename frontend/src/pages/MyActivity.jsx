import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import {
    Activity, TrendingUp, TrendingDown, DollarSign,
    Briefcase, Award, Star, Clock, BarChart3,
    ArrowUpRight, ArrowDownRight, Calendar, Bell
} from 'lucide-react';
import { API_URL } from '../utils/apiConfig';
import Loader from '../components/common/Loader';

const MyActivity = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        financial: { earned: 0, spent: 0, monthly: [] },
        services: { offered: 0, requested: 0, completed: 0 },
        performance: { impactScore: 0, responseSpeed: 0, ranking: 0 },
        engagement: { badges: [], timeline: [], alertsParticipation: 0 }
    });
    const [activeServices, setActiveServices] = useState([]);
    const [myAlerts, setMyAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchActivity();
        fetchActiveServices();
        fetchMyAlerts();
    }, []);

    const fetchActivity = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/users/activity`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setStats(data);
        } catch (err) {
            console.error('Failed to fetch activity', err);
        }
    };

    const fetchActiveServices = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/services/my`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setActiveServices(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyAlerts = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/alerts/my`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setMyAlerts(data);
        } catch (err) {
            console.error('Failed to fetch my alerts', err);
        }
    };

    const tabs = [
        { id: 'overview', label: t('overview'), icon: BarChart3 },
        { id: 'financial', label: t('financial'), icon: DollarSign },
        { id: 'services', label: t('active_list'), icon: Briefcase },
        { id: 'alerts', label: 'My Alerts', icon: Bell },
        { id: 'engagement', label: t('engagement'), icon: Award }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8 min-h-[50vh]">
                <Loader text={t('loading_activity')} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 pb-24">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-b-[2rem]">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Activity size={24} />
                    {t('my_activity_dashboard')}
                </h1>
                <p className="text-white/70 text-sm mt-1">
                    {t('track_impact')}
                </p>

                {/* Tabs */}
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition ${activeTab === tab.id
                                ? 'bg-white text-indigo-600'
                                : 'bg-white/20 text-white'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-4 mt-4">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-4">
                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-500 text-sm">{t('impact_score')}</span>
                                    <Award className="text-amber-500" size={20} />
                                </div>
                                <p className="text-3xl font-bold text-gray-800">
                                    {stats.performance?.impactScore || 0}
                                </p>
                            </div>
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-500 text-sm">{t('locality_rank')}</span>
                                    <Star className="text-purple-500" size={20} />
                                </div>
                                <p className="text-3xl font-bold text-gray-800">
                                    #{stats.performance?.ranking || '--'}
                                </p>
                            </div>
                        </div>

                        {/* Financial Overview */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-4">{t('financial_summary')}</h3>
                            <div className="flex gap-4">
                                <div className="flex-1 p-4 bg-green-50 rounded-xl">
                                    <div className="flex items-center gap-2 text-green-600 mb-1">
                                        <ArrowUpRight size={16} />
                                        <span className="text-sm font-medium">{t('earned')}</span>
                                    </div>
                                    <p className="text-2xl font-bold text-green-700">
                                        ₹{stats.financial?.earned || 0}
                                    </p>
                                </div>
                                <div className="flex-1 p-4 bg-red-50 rounded-xl">
                                    <div className="flex items-center gap-2 text-red-600 mb-1">
                                        <ArrowDownRight size={16} />
                                        <span className="text-sm font-medium">{t('spent')}</span>
                                    </div>
                                    <p className="text-2xl font-bold text-red-700">
                                        ₹{stats.financial?.spent || 0}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Services Summary */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-4">{t('services_summary')}</h3>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="text-center p-3 bg-blue-50 rounded-xl">
                                    <p className="text-2xl font-bold text-blue-700">
                                        {stats.services?.offered || 0}
                                    </p>
                                    <p className="text-xs text-blue-600">{t('offered')}</p>
                                </div>
                                <div className="text-center p-3 bg-purple-50 rounded-xl">
                                    <p className="text-2xl font-bold text-purple-700">
                                        {stats.services?.requested || 0}
                                    </p>
                                    <p className="text-xs text-purple-600">{t('requested')}</p>
                                </div>
                                <div className="text-center p-3 bg-green-50 rounded-xl">
                                    <p className="text-2xl font-bold text-green-700">
                                        {stats.services?.completed || 0}
                                    </p>
                                    <p className="text-xs text-green-600">{t('completed')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Financial Tab */}
                {activeTab === 'financial' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-5 rounded-2xl text-white">
                                <p className="text-white/70 text-sm">{t('total_revenue_earned')}</p>
                                <p className="text-3xl font-bold mt-2">₹{stats.financial?.earned || 0}</p>
                            </div>
                            <div className="bg-gradient-to-br from-red-500 to-rose-600 p-5 rounded-2xl text-white">
                                <p className="text-white/70 text-sm">{t('total_money_spent')}</p>
                                <p className="text-3xl font-bold mt-2">₹{stats.financial?.spent || 0}</p>
                            </div>
                        </div>

                        {/* Monthly Breakdown */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Calendar size={18} />
                                {t('monthly_breakdown')}
                            </h3>
                            {(stats.financial?.monthly || []).length > 0 ? (
                                <div className="space-y-2">
                                    {stats.financial.monthly.map((month, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                            <span className="font-medium text-gray-700">{month.name}</span>
                                            <div className="flex gap-4 text-sm">
                                                <span className="text-green-600">+₹{month.earned}</span>
                                                <span className="text-red-600">-₹{month.spent}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-400 text-center py-4">{t('no_monthly_data')}</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Services Tab - Now Shows Active List */}
                {activeTab === 'services' && (
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-800 px-2">{t('my_active_posts')}</h3>
                        {activeServices.length > 0 ? (
                            <div className="space-y-3">
                                {activeServices.map(service => (
                                    <div
                                        key={service._id}
                                        onClick={() => navigate(`/service/${service._id}`)}
                                        className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-3 rounded-full ${service.type === 'offer' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                                                }`}>
                                                {service.type === 'offer' ? <Briefcase size={20} /> : <Activity size={20} />}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800">{service.title}</h4>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(service.createdAt).toLocaleDateString()} • {service.targetAudience === 'ALL' ? 'Everyone' : 'Specific'}
                                                </p>
                                                {service.status === 'completed' && (
                                                    <span className="text-xs font-bold text-green-600 uppercase mt-1 block">{t('completed')}</span>
                                                )}
                                            </div>
                                        </div>
                                        <ArrowUpRight className="text-gray-300" size={20} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-white rounded-2xl border border-dashed">
                                <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-500 font-medium">{t('no_active_services')}</p>
                                <p className="text-sm text-gray-400">{t('post_to_start')}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Alerts Tab */}
                {activeTab === 'alerts' && (
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-800 px-2">My Alerts</h3>
                        {myAlerts.length > 0 ? (
                            <div className="space-y-3">
                                {myAlerts.map(alert => (
                                    <div
                                        key={alert._id}
                                        className="bg-white p-4 rounded-xl shadow-sm border border-gray-100"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`p-3 rounded-full flex-shrink-0 ${alert.category === 'Emergency'
                                                ? 'bg-red-100 text-red-600'
                                                : alert.category === 'Community'
                                                    ? 'bg-blue-100 text-blue-600'
                                                    : 'bg-amber-100 text-amber-600'
                                                }`}>
                                                <Bell size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${alert.category === 'Emergency'
                                                        ? 'bg-red-100 text-red-700'
                                                        : alert.category === 'Community'
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                        {alert.category}
                                                    </span>
                                                    {alert.subType && (
                                                        <span className="text-xs text-gray-400">{alert.subType}</span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-700 line-clamp-2">{alert.description}</p>
                                                <p className="text-xs text-gray-400 mt-2">
                                                    {new Date(alert.createdAt).toLocaleDateString('en-IN', {
                                                        day: 'numeric', month: 'short', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit'
                                                    })}
                                                    {alert.locality && ` • ${alert.locality}`}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-white rounded-2xl border border-dashed">
                                <Bell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-500 font-medium">No alerts sent yet</p>
                                <p className="text-sm text-gray-400">Alerts you send will appear here</p>
                            </div>
                        )}
                    </div>
                )}


                {/* Engagement Tab */}
                {activeTab === 'engagement' && (
                    <div className="space-y-4">
                        {/* Badges */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Award size={18} />
                                {t('badges_earned')}
                            </h3>
                            {(stats.engagement?.badges || []).length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {stats.engagement.badges.map((badge, idx) => (
                                        <div key={idx} className="px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 rounded-full text-amber-700 font-medium text-sm">
                                            🏆 {badge}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-400 text-center py-4">
                                    {t('complete_for_badges')}
                                </p>
                            )}
                        </div>

                        {/* Alerts Participation */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-3">{t('alert_participation')}</h3>
                            <p className="text-3xl font-bold text-red-600">
                                {stats.engagement?.alertsParticipation || 0}
                            </p>
                            <p className="text-gray-500 text-sm mt-1">
                                {t('alerts_responded')}
                            </p>
                        </div>

                        {/* Activity Timeline */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-4">{t('recent_activity')}</h3>
                            {(stats.engagement?.timeline || []).length > 0 ? (
                                <div className="space-y-3">
                                    {stats.engagement.timeline.slice(0, 5).map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-700">{item.action}</p>
                                                <p className="text-xs text-gray-400">{item.date}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-400 text-center py-4">{t('no_recent_activity')}</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyActivity;
