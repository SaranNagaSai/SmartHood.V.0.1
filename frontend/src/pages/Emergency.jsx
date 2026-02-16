import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import VoiceInput from '../components/common/VoiceInput';
import axios from 'axios';
import {
    AlertTriangle,
    Droplet,
    Car,
    ShieldAlert,
    CloudLightning,
    Coins,
    ArrowLeft,
    CheckCircle2,
    Loader2
} from 'lucide-react';
import { API_URL } from '../utils/apiConfig';

const Emergency = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [subType, setSubType] = useState('');
    const [bloodGroup, setBloodGroup] = useState('A+');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData) setUser(userData);
        else navigate('/login');
    }, [navigate]);

    const emergencyTypes = [
        { id: 'Blood Donation', label: t('blood_donation'), icon: Droplet, color: 'bg-red-500' },
        { id: 'Accident', label: t('accident'), icon: Car, color: 'bg-orange-600' },
        { id: 'Theft', label: t('theft'), icon: ShieldAlert, color: 'bg-slate-800' },
        { id: 'Climate', label: t('climate_alert'), icon: CloudLightning, color: 'bg-blue-600' },
        { id: 'Cash Donation', label: t('cash_donation'), icon: Coins, color: 'bg-emerald-600' },
        { id: 'General', label: 'General', icon: AlertTriangle, color: 'bg-red-700' }
    ];

    const handleSubmit = async () => {
        if (!subType || !description) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const alertData = {
                category: 'Emergency',
                subType,
                bloodGroup: subType === 'Blood Donation' ? bloodGroup : undefined,
                description,
                locality: user.locality,
                town: user.town,
                district: user.district,
                state: user.state
            };

            await axios.post(`${API_URL}/alerts`, alertData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess(true);
            setTimeout(() => navigate('/home'), 3000);
        } catch (error) {
            console.error(error);
            alert(t('alert_failed'));
        }
        setLoading(false);
    };

    if (success) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
                    <CheckCircle2 size={48} />
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('alert_sent_success')}</h1>
                <p className="text-gray-500">{t('check_later')}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-red-600 text-white p-6 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
                <div className="relative z-10 flex items-center gap-4">
                    <button onClick={() => navigate('/home')} className="p-2 bg-white/10 rounded-full">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{t('emergency_center')}</h1>
                        <p className="text-red-100 text-sm opacity-80">{t('emergency_desc')}</p>
                    </div>
                </div>
                <AlertTriangle className="absolute -bottom-6 -right-6 text-white/10 w-32 h-32" />
            </div>

            <div className="p-6 max-w-lg mx-auto -mt-4">
                {/* Step 1: Select Type */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-gray-800 ml-1">{t('select_emergency_type')}</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {emergencyTypes.map(type => (
                            <button
                                key={type.id}
                                onClick={() => setSubType(type.id)}
                                className={`p-5 rounded-2xl flex flex-col items-center gap-3 transition-all duration-300 border-2 ${subType === type.id
                                    ? 'bg-white border-red-500 shadow-lg scale-[1.02]'
                                    : 'bg-white border-transparent shadow-sm hover:border-gray-200'
                                    }`}
                            >
                                <div className={`w-12 h-12 ${type.color} text-white rounded-full flex items-center justify-center shadow-lg`}>
                                    <type.icon size={24} />
                                </div>
                                <span className={`font-bold text-sm ${subType === type.id ? 'text-red-600' : 'text-gray-600'}`}>
                                    {type.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Step 2: Details */}
                {subType && (
                    <div className="mt-8 space-y-6 animate-slide-up">
                        {subType === 'Blood Donation' && (
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-red-100">
                                <label className="block text-center text-xs font-bold text-red-600 uppercase tracking-widest mb-4">
                                    {t('blood_group_req')}
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                                        <button
                                            key={bg}
                                            onClick={() => setBloodGroup(bg)}
                                            className={`py-3 rounded-xl font-bold transition-all ${bloodGroup === bg
                                                ? 'bg-red-600 text-white shadow-md'
                                                : 'bg-red-50 text-red-400 hover:bg-red-100'
                                                }`}
                                        >
                                            {bg}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="bg-white p-2 rounded-3xl shadow-sm border border-gray-100">
                            <VoiceInput
                                type="textarea"
                                label={t('alert_details')}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder={t('alert_desc_placeholder')}
                                required
                                className="border-none focus:ring-0 text-lg"
                            />
                        </div>

                        <button
                            disabled={loading || !description}
                            onClick={handleSubmit}
                            className={`w-full p-5 rounded-2xl font-bold text-white text-lg shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 ${!description ? 'bg-gray-300' : 'bg-red-600 hover:bg-red-700'
                                }`}
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <AlertTriangle size={24} />}
                            {loading ? t('sending_alert') : t('broadcast_alert')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Emergency;
