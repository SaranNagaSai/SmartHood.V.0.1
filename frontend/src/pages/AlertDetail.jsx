import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { API_URL, getProfilePhotoUrl } from '../utils/apiConfig';
import { 
    ArrowLeft, Bell, MapPin, Clock, Send, CheckCircle, 
    AlertTriangle, Shield, Phone, Mail 
} from 'lucide-react';

const AlertDetail = () => {
    const { t, translateValue } = useLanguage();
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [alert, setAlert] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [isInterested, setIsInterested] = useState(false);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        setCurrentUser(user);
        fetchAlert();
    }, [id]);

    const isOwner = currentUser && alert?.senderId?._id === currentUser._id;
    const categoryColor = alert?.category === 'Emergency' ? 'bg-red-500' : 'bg-blue-600';

    const fetchAlert = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/alerts/detail/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAlert(res.data);
            
            // Check if current user is in interested list
            const user = JSON.parse(localStorage.getItem('user'));
            if (res.data.interestedUsers?.some(u => u._id === user?._id || u === user?._id)) {
                setIsInterested(true);
            }
        } catch (error) {
            console.error(error);
            // Fallback or error handling
        } finally {
            setLoading(false);
        }
    };

    const handleInterest = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/alerts/${id}/interest`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsInterested(res.data.hasInterest);
            if (res.data.hasInterest) {
                alert('Your interest has been sent to the sender! 🚀');
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Action failed');
        }
    };
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        if (alert && queryParams.get('action') === 'interest' && !isInterested) {
            handleInterest();
            navigate(location.pathname, { replace: true });
        }
    }, [alert, location.search, isInterested, navigate]);
    if (loading) return <div className="p-10 text-center text-gray-500">{t('processing')}</div>;
    if (!alert) return (
        <div className="p-10 text-center">
            <p className="text-gray-500">{t('alert_not_found')}</p>
            <button onClick={() => navigate('/home')} className="mt-4 text-indigo-600 font-bold">{t('go_home')}</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* Header */}
            <div className={`sticky top-0 z-20 px-4 py-4 flex items-center gap-4 text-white shadow-lg ${categoryColor}`}>
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1">
                    <span className="text-xs font-bold bg-white/20 backdrop-blur-md px-2 py-0.5 rounded uppercase tracking-wider">
                        {translateValue(alert.category)}
                    </span>
                    <h1 className="font-bold text-lg truncate mt-1">{translateValue(alert.subType)}</h1>
                </div>
            </div>

            <div className="p-4 max-w-2xl mx-auto space-y-6 mt-2">
                {/* Main Content */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-500 overflow-hidden border">
                                {alert.senderId?.profilePhoto ? (
                                    <img src={getProfilePhotoUrl(alert.senderId.profilePhoto)} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    alert.senderId?.name?.charAt(0)
                                )}
                            </div>
                            <div>
                                <p className="font-bold text-gray-800">{translateValue(alert.senderId?.name)}</p>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <MapPin size={12} /> {translateValue(alert.locality)}
                                </p>
                            </div>
                        </div>
                        <div className="text-right text-xs text-gray-400">
                            <Clock size={12} className="inline mr-1" />
                            {new Date(alert.createdAt).toLocaleString()}
                        </div>
                    </div>

                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
                        <p className="text-gray-700 leading-relaxed text-lg italic">
                            "{translateValue(alert.description)}"
                        </p>
                    </div>

                    {alert.bloodGroup && (
                        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-100 mb-6">
                            <div className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center font-bold">
                                {alert.bloodGroup}
                            </div>
                            <div>
                                <p className="text-xs text-red-600 font-bold uppercase">{t('blood_group_required') || 'Blood Group Required'}</p>
                                <p className="text-sm font-bold text-gray-800">{alert.bloodGroup} Donor needed immediately.</p>
                            </div>
                        </div>
                    )}

                    {/* Contact Details (Visible if interested or owner) */}
                    {(isOwner || isInterested) && (
                        <div className="mt-6 p-5 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-4">
                            <p className="text-xs font-bold text-indigo-700 uppercase flex items-center gap-2">
                                <Shield size={14} /> {t('contact_info')}
                            </p>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-sm border">
                                        <Phone size={18} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">{t('phone_label')}</p>
                                        <p className="font-bold text-gray-800">{alert.senderId?.phone || t('na')}</p>
                                    </div>
                                </div>
                                <a href={`tel:${alert.senderId?.phone}`} className="p-3 bg-indigo-600 text-white rounded-full shadow-lg active:scale-95 transition">
                                    <Phone size={18} />
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                {/* Response Action */}
                {!isOwner && (
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t z-30 md:relative md:border-none md:bg-transparent md:p-0">
                        <button
                            onClick={handleInterest}
                            className={`w-full py-4 rounded-2xl font-bold text-lg shadow-xl flex items-center justify-center gap-3 transition active:scale-95 ${
                                isInterested 
                                ? 'bg-green-100 text-green-600 border-2 border-green-200' 
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }`}
                        >
                            {isInterested ? (
                                <>
                                    <CheckCircle size={22} />
                                    {t('response_sent') || 'Response Sent'}
                                </>
                            ) : (
                                <>
                                    <Send size={22} />
                                    {t('i_can_help') || 'I am Interested'}
                                </>
                            )}
                        </button>
                        {isInterested && (
                            <p className="text-center text-[10px] text-gray-400 mt-2">
                                The sender can now see your phone number in their Activity page.
                            </p>
                        )}
                    </div>
                )}

                {isOwner && (
                    <div className="bg-amber-50 border border-amber-200 p-5 rounded-3xl text-center">
                        <AlertTriangle className="mx-auto text-amber-500 mb-2" size={32} />
                        <h3 className="font-bold text-amber-800">{t('you_sent_alert')}</h3>
                        <p className="text-sm text-amber-700 mt-1">
                            Check your <span onClick={() => navigate('/activity')} className="underline font-bold cursor-pointer">Activity Dashboard</span> to see who responded.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AlertDetail;
