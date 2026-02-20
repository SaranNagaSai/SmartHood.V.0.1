import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import VoiceInput from '../components/common/VoiceInput';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../utils/apiConfig';
import smartHoodLogo from '../assets/images/Smart Hood Logo.png';

const Login = () => {
    const { t } = useLanguage();
    const { login } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', phone: '' });

    const handleLogin = async () => {
        try {
            const res = await axios.post(`${API_URL}/auth/login`, formData);
            login(res.data, res.data.token);
            navigate('/home');
        } catch (error) {
            alert(error.response?.data?.message || 'Login Failed');
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-brand p-4 relative overflow-hidden">
            {/* Decorative Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>

            <div className="w-full max-w-[450px] flex flex-col items-center relative z-10 animate-slide-up">
                <div className="text-center mb-8">
                    <div className="flex flex-col items-center justify-center gap-4 mb-6">
                        <img src={smartHoodLogo} alt="SmartHood" className="w-40 h-40 md:w-56 md:h-56 object-contain drop-shadow-2xl" />
                        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight drop-shadow-md">SmartHood</h2>
                    </div>
                </div>

                <div className="w-full bg-gray-900/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-extrabold text-white">{t('login')}</h1>
                        <p className="text-sm text-gray-200 mt-2 font-medium opacity-80">{t('welcome_back_msg')}</p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-4">
                            <VoiceInput
                                label={t('name_label')}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder={t('name_placeholder')}
                                className="bg-white/90 border-transparent focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all rounded-xl py-3 text-gray-800 placeholder-gray-500"
                                labelClassName="text-white drop-shadow-sm"
                            />
                            <VoiceInput
                                label={t('phone_label')}
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder={t('phone_placeholder')}
                                type="tel"
                                className="bg-white/90 border-transparent focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all rounded-xl py-3 text-gray-800 placeholder-gray-500"
                                labelClassName="text-white drop-shadow-sm"
                            />
                        </div>

                        <button
                            onClick={handleLogin}
                            className="w-full bg-primary text-white p-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-primary/40 hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-2 group border border-white/10"
                        >
                            <span>{t('sign_in')}</span>
                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </button>

                        <p className="text-center text-xs text-gray-300 mt-6 pt-4 border-t border-white/10 flex items-center justify-center gap-2">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]"></span>
                            {t('secure_login')}
                        </p>

                        <div className="text-center mt-4">
                            <button
                                onClick={() => navigate('/register')}
                                className="text-white font-bold hover:text-blue-200 hover:underline transition-colors shadow-sm"
                            >
                                {t('new_user_prompt') || "Don't have an account? Create one"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
