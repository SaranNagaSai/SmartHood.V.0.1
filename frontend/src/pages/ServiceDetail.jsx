import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { API_URL, SERVER_URL, getProfilePhotoUrl } from '../utils/apiConfig';
import VoiceInput from '../components/common/VoiceInput';
import {
    ArrowLeft, Shield, User, Clock, MapPin, Phone, Mail,
    CheckCircle, XCircle, AlertTriangle, Send, DollarSign, Eye
} from 'lucide-react';

const ServiceDetail = () => {
    const { t } = useLanguage();
    const { id } = useParams();
    const navigate = useNavigate();
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [showCompleteModal, setShowCompleteModal] = useState(false);

    // Completion Form State
    const [providerId, setProviderId] = useState('');
    const [amount, setAmount] = useState('');
    const [completing, setCompleting] = useState(false);
    const [showViewersModal, setShowViewersModal] = useState(false);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        setCurrentUser(user);
        fetchService();
    }, [id]);

    const fetchService = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/services/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setService(res.data);
        } catch (error) {
            console.error(error);
            alert(t('failed_load_service'));
            navigate('/home');
        } finally {
            setLoading(false);
        }
    };

    const handleInterest = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/services/${id}/interest`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchService(); // Refresh to show updated interest status
        } catch (error) {
            alert(error.response?.data?.message || t('action_failed'));
        }
    };

    const handleComplete = async () => {
        if (!providerId) {
            alert(t('id_mandatory'));
            return;
        }

        setCompleting(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/services/${id}/complete`, {
                providerUniqueId: providerId,
                amountSpent: Number(amount)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert(t('service_completed_success'));
            setShowCompleteModal(false);
            fetchService(); // Refresh to show completed status
        } catch (error) {
            alert(error.response?.data?.message || t('completion_failed'));
        } finally {
            setCompleting(false);
        }
    };

    if (loading) return <div className="p-10 text-center text-gray-500">{t('processing')}</div>;
    if (!service) return null;

    const isOwner = currentUser && service.createdBy?._id === currentUser._id;
    const isInterested = service.interestedProviders?.some(p => p._id === currentUser?._id);
    const isCompleted = service.status === 'completed';

    return (
        <div className="min-h-screen bg-[var(--col-bg)] pb-24">
            {/* Header */}
            <div className={`sticky top-0 z-20 px-4 py-4 flex items-center gap-4 text-white shadow-lg transition-colors bg-gradient-brand`}>
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold bg-white/20 backdrop-blur-md px-2 py-0.5 rounded uppercase tracking-wider">
                            {service.type}
                        </span>
                        {isCompleted && (
                            <span className="text-xs font-bold bg-white text-green-700 px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                                <CheckCircle size={12} /> {t('completed')}
                            </span>
                        )}
                    </div>
                    <h1 className="font-bold text-lg truncate mt-1">{service.title}</h1>
                </div>
            </div>

            <div className="p-4 max-w-2xl mx-auto space-y-6 mt-2">
                {/* Status Banner */}
                {isCompleted && (
                    <div className="bg-green-100 border border-green-200 p-4 rounded-xl flex items-start gap-3">
                        <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={20} />
                        <div>
                            <h3 className="font-bold text-green-800">{t('job_done')}</h3>
                            <p className="text-sm text-green-700 mt-1">
                                {t('completed_by')} <span className="font-bold">{service.completedBy?.name || service.completedByUniqueId}</span> on {new Date(service.completionDate).toLocaleDateString()}.
                            </p>
                            {service.amountSpent > 0 && (
                                <p className="text-sm font-bold text-green-800 mt-2">
                                    {t('total_spend')}: ₹{service.amountSpent}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Main Details */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white overflow-hidden border-2 border-white/50 ${service.type === 'offer' ? 'bg-blue-500' : 'bg-green-500'
                                }`}>
                                {service.createdBy?.profilePhoto ? (
                                    <img
                                        src={getProfilePhotoUrl(service.createdBy.profilePhoto)}
                                        alt="Creator"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    service.createdBy?.name?.charAt(0)
                                )}
                            </div>
                            <div>
                                <p className="font-bold text-gray-800">{service.createdBy?.name}</p>
                                <p className="text-xs text-gray-500">{service.createdBy?.uniqueId}</p>
                            </div>
                        </div>

                        <div className="text-right">
                            <button
                                onClick={() => setShowViewersModal(true)}
                                className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg mb-1 flex items-center gap-1 hover:bg-blue-100 transition"
                            >
                                <Eye size={12} /> {service.views?.length || 0} {t('views')}
                            </button>
                            <p className="text-xs text-gray-400 flex items-center justify-end gap-1">
                                <Clock size={12} /> {new Date(service.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-lg mt-1 inline-block">
                                {service.locality}
                            </p>
                        </div>
                    </div>


                    {/* Viewers Modal */}


                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {service.description}
                    </p>

                    {/* Attachments */}
                    {service.attachments && service.attachments.length > 0 && (
                        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                            {service.attachments.map((att, idx) => (
                                <div key={idx} className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 border overflow-hidden">
                                    {/* Placeholder for real attachment display */}
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs text-center p-2">
                                        Attachment {idx + 1}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {/* Revealed Contact Details for Interested Providers */}
                    {!isOwner && isInterested && service.type === 'request' && (
                        <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-100 animate-pulse-subtle">
                            <p className="text-xs font-bold text-green-700 uppercase mb-3 flex items-center gap-2">
                                <Shield size={14} /> {t('contact_details_revealed')}
                            </p>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-green-600 shadow-sm">
                                        <Phone size={18} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">{t('phone_label')}</p>
                                        <p className="font-bold text-gray-800">{service.createdBy?.phone}</p>
                                    </div>
                                    <a href={`tel:${service.createdBy?.phone}`} className="ml-auto bg-green-600 text-white p-2 rounded-full shadow-md">
                                        <Phone size={16} />
                                    </a>
                                </div>
                                {service.createdBy?.email && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm">
                                            <Mail size={18} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">{t('email')}</p>
                                            <p className="font-bold text-gray-800">{service.createdBy?.email}</p>
                                        </div>
                                        <a href={`mailto:${service.createdBy?.email}`} className="ml-auto bg-blue-500 text-white p-2 rounded-full shadow-md">
                                            <Mail size={16} />
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Owner Actions: Managed Completion & Interested Providers */}
                {isOwner && !isCompleted && service.type === 'request' && (
                    <div className="space-y-6">
                        {/* Interested Providers List */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <User size={18} className="text-blue-600" />
                                {service.interestedProviders?.length || 0} {t('interested_providers')}
                            </h3>

                            {service.interestedProviders?.length > 0 ? (
                                <div className="space-y-3">
                                    {service.interestedProviders.map(provider => (
                                        <div key={provider._id} className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-blue-600 shadow-sm overflow-hidden border border-blue-100">
                                                    {provider.profilePhoto ? (
                                                        <img
                                                            src={getProfilePhotoUrl(provider.profilePhoto)}
                                                            alt="Provider"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        provider.name.charAt(0)
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800">{provider.name}</p>
                                                    <p className="text-xs text-gray-500 font-mono">{provider.uniqueId}</p>
                                                    <p className="text-xs text-blue-600 font-bold mt-0.5">{provider.professionCategory}</p>
                                                </div>
                                            </div>
                                            {/* Contact visible because interest matches */}
                                            <div className="flex gap-2">
                                                <button className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200">
                                                    <Phone size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-400 text-sm text-center py-4 bg-gray-50 rounded-xl border border-dashed">
                                    {t('no_interest')}
                                </p>
                            )}
                        </div>

                        {/* Complete Action */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="text-amber-500 flex-shrink-0" />
                                <div>
                                    <h3 className="font-bold text-gray-800">{t('work_finished_q')}</h3>
                                    <p className="text-sm text-gray-500 mt-1 mb-4">
                                        {t('work_finished_msg')}
                                    </p>
                                    <button
                                        onClick={() => setShowCompleteModal(true)}
                                        className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 active:scale-95 transition flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle size={18} /> {t('mark_completed')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Provider Logic: Interest Toggle */}
                {!isOwner && !isCompleted && service.type === 'request' && (
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t z-30 md:relative md:border-none md:bg-transparent md:p-0">
                        <button
                            onClick={handleInterest}
                            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition active:scale-95 ${isInterested
                                ? 'bg-gray-100 text-gray-500 border border-gray-200'
                                : 'bg-green-600 text-white hover:bg-green-700'
                                }`}
                        >
                            {isInterested ? (
                                <>
                                    <CheckCircle size={20} /> {t('interest_sent')}
                                </>
                            ) : (
                                <>
                                    <Send size={20} /> {t('im_interested')}
                                </>
                            )}
                        </button>
                    </div>
                )}
                {/* Viewers Modal */}
                {showViewersModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-fade-in">
                            <div className="bg-gray-50 p-4 border-b flex items-center justify-between">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                    <Eye size={18} className="text-blue-600" />
                                    {t('viewed_by')} ({service.views?.length || 0})
                                </h3>
                                <button onClick={() => setShowViewersModal(false)} className="p-1 hover:bg-gray-200 rounded-full">
                                    <XCircle size={20} className="text-gray-500" />
                                </button>
                            </div>
                            <div className="p-4 max-h-80 overflow-y-auto space-y-3">
                                {service.views && service.views.length > 0 ? (
                                    service.views.map((viewer, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden">
                                                {viewer.profilePhoto ? (
                                                    <img
                                                        src={getProfilePhotoUrl(viewer.profilePhoto)}
                                                        alt={viewer.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    viewer.name?.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <span className="text-sm font-medium text-gray-700">{viewer.name}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-400 text-sm py-4">{t('no_views_yet')}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Completion Modal */}
                {showCompleteModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
                            <div className="bg-green-600 p-4 flex items-center justify-between text-white">
                                <h3 className="font-bold text-lg">{t('work_completion_form')}</h3>
                                <button onClick={() => setShowCompleteModal(false)}><XCircle size={24} /></button>
                            </div>
                            <div className="p-6 space-y-6">
                                <p className="text-sm text-gray-600 text-center">
                                    {t('confirm_provider_msg')}
                                </p>

                                {/* Provider ID Input */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">{t('provider_unique_id')} *</label>
                                    <div className="relative">
                                        <VoiceInput
                                            value={providerId}
                                            onChange={(e) => setProviderId(e.target.value.toUpperCase())}
                                            placeholder="e.g. ABC12"
                                            className="font-mono text-center text-lg tracking-widest uppercase"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Amount Input */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">{t('amount_paid')} ({t('others')})</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-4 text-gray-400">₹</span>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0"
                                            className="w-full p-3 pl-8 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-green-500"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleComplete}
                                    disabled={completing}
                                    className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-green-700 active:scale-95 transition disabled:opacity-50"
                                >
                                    {completing ? t('processing') : t('confirm_completion')}
                                </button>
                            </div>
                        </div>
                    </div>
                )
                }
            </div>
        </div>
    );
};

export default ServiceDetail;
