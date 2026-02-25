import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useDevice } from '../context/DeviceContext';
import { useNavigate } from 'react-router-dom';
import { Monitor, Smartphone } from 'lucide-react';
import smartHoodLogo from '../assets/images/Smart Hood Logo.png';

const LanguageSelection = () => {
    const { t, setLanguage } = useLanguage();
    const { setDeviceType } = useDevice();
    const navigate = useNavigate();
    const [selectedDevice, setSelectedDevice] = useState(sessionStorage.getItem('deviceType') || '');

    const handleSelect = (lang) => {
        if (!selectedDevice) {
            alert('Please select your device type first');
            return;
        }
        setLanguage(lang);
        setDeviceType(selectedDevice);
        navigate('/register');
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-brand px-4 relative overflow-hidden">
            {/* Decorative Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>

            <div className="w-full max-w-[450px] flex flex-col items-center relative z-10 animate-slide-up">
                <div className="text-center mb-6">
                    <div className="flex flex-col items-center justify-center gap-3 mb-4">
                        <img src={smartHoodLogo} alt="SmartHood" className="w-28 h-28 md:w-40 md:h-40 object-contain drop-shadow-2xl" />
                        <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight drop-shadow-md">SmartHood</h2>
                    </div>
                </div>

                <div className="w-full bg-gray-900/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 md:p-8">
                    {/* Device Type Selection */}
                    <div className="mb-6">
                        <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-3 text-center">Select Device Type</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setSelectedDevice('mobile')}
                                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300 ${selectedDevice === 'mobile'
                                    ? 'bg-white/20 border-white/60 shadow-lg shadow-white/10 scale-105'
                                    : 'bg-white/5 border-white/15 hover:bg-white/10 hover:border-white/30'
                                    }`}
                            >
                                <Smartphone size={28} className={`${selectedDevice === 'mobile' ? 'text-white' : 'text-white/60'}`} />
                                <span className={`text-sm font-bold ${selectedDevice === 'mobile' ? 'text-white' : 'text-white/60'}`}>Mobile</span>
                                {selectedDevice === 'mobile' && (
                                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                                )}
                            </button>
                            <button
                                onClick={() => setSelectedDevice('desktop')}
                                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300 ${selectedDevice === 'desktop'
                                    ? 'bg-white/20 border-white/60 shadow-lg shadow-white/10 scale-105'
                                    : 'bg-white/5 border-white/15 hover:bg-white/10 hover:border-white/30'
                                    }`}
                            >
                                <Monitor size={28} className={`${selectedDevice === 'desktop' ? 'text-white' : 'text-white/60'}`} />
                                <span className={`text-sm font-bold ${selectedDevice === 'desktop' ? 'text-white' : 'text-white/60'}`}>Desktop</span>
                                {selectedDevice === 'desktop' && (
                                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="text-center mb-5">
                        <h1 className="text-xl font-bold text-white mb-1">{t('login')}</h1>
                        <p className="text-xs text-gray-200 font-medium opacity-80">{t('welcome_back_msg')}</p>
                    </div>

                    <div className="space-y-3 w-full animate-fade-in" style={{ animationDelay: '0.2s' }}>
                        <button
                            onClick={() => handleSelect('English')}
                            className={`w-full backdrop-blur-sm p-4 md:p-5 rounded-2xl shadow-lg hover:transform hover:scale-105 transition-all duration-300 group border-2 ${!selectedDevice ? 'bg-white/40 border-white/20 opacity-60 cursor-not-allowed' : 'bg-white/95 border-transparent hover:border-primary/20'
                                }`}
                            disabled={!selectedDevice}
                        >
                            <h2 className="text-lg md:text-xl font-bold text-[var(--col-primary)] group-hover:text-[var(--col-secondary)]">English</h2>
                            <p className="text-gray-500 text-xs mt-1">Continue in English</p>
                        </button>

                        <button
                            onClick={() => handleSelect('Telugu')}
                            className={`w-full backdrop-blur-sm p-4 md:p-5 rounded-2xl shadow-lg hover:transform hover:scale-105 transition-all duration-300 group border-2 ${!selectedDevice ? 'bg-white/40 border-white/20 opacity-60 cursor-not-allowed' : 'bg-white/95 border-transparent hover:border-primary/20'
                                }`}
                            disabled={!selectedDevice}
                        >
                            <h2 className="text-lg md:text-xl font-bold text-[var(--col-primary)] group-hover:text-[var(--col-secondary)] font-telugu">తెలుగు</h2>
                            <p className="text-gray-500 text-xs mt-1">తెలుగులో కొనసాగండి</p>
                        </button>
                    </div>

                    <div className="mt-6 text-center animate-fade-in border-t border-white/10 pt-4" style={{ animationDelay: '0.4s' }}>
                        <p className="text-gray-300 text-xs mb-3">Already part of the neighborhood?</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="text-white font-bold bg-white/10 px-6 py-2.5 rounded-xl backdrop-blur-sm hover:bg-white/20 transition-all shadow-lg border border-white/10 w-full text-sm"
                        >
                            Login to Account
                        </button>
                    </div>
                </div>

                <p className="text-white/60 text-xs mt-6 bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm border border-white/5">Select device & language • పరికరం & భాష ఎంచుకోండి</p>
            </div>
        </div>
    );
};

export default LanguageSelection;
