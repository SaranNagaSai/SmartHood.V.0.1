import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import smartHoodLogo from '../assets/images/Smart Hood Logo.png';

const LanguageSelection = () => {
    const { t, setLanguage } = useLanguage();
    const navigate = useNavigate();

    const handleSelect = (lang) => {
        setLanguage(lang);
        navigate('/register');
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-brand px-6">
            <div className="text-center mb-6 md:mb-8">
                <div className="flex flex-col items-center justify-center gap-4 mb-4 md:mb-6">
                    <img src={smartHoodLogo} alt="SmartHood" className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-2xl" />
                    <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight drop-shadow-lg">SmartHood</h2>
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">{t('login')}</h1>
                <p className="text-xs md:text-sm text-gray-500 mt-2 font-medium">{t('welcome_back_msg')}</p>
            </div>

            <div className="space-y-4 md:space-y-6 w-full max-w-sm animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <button
                    onClick={() => handleSelect('English')}
                    className="w-full bg-white/95 backdrop-blur-sm p-5 md:p-6 rounded-2xl shadow-lg hover:transform hover:scale-105 transition-all duration-300 group"
                >
                    <h2 className="text-xl md:text-2xl font-bold text-[var(--col-primary)] group-hover:text-[var(--col-secondary)]">English</h2>
                    <p className="text-gray-500 text-xs md:text-sm mt-1">Continue in English</p>
                </button>

                <button
                    onClick={() => handleSelect('Telugu')}
                    className="w-full bg-white/95 backdrop-blur-sm p-5 md:p-6 rounded-2xl shadow-lg hover:transform hover:scale-105 transition-all duration-300 group"
                >
                    <h2 className="text-xl md:text-2xl font-bold text-[var(--col-primary)] group-hover:text-[var(--col-secondary)] font-telugu">తెలుగు</h2>
                    <p className="text-gray-500 text-xs md:text-sm mt-1">తెలుగులో కొనసాగండి</p>
                </button>
            </div>

            <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <p className="text-white/80 text-sm mb-2">Already part of the neighborhood?</p>
                <button
                    onClick={() => navigate('/login')}
                    className="text-white font-bold bg-white/20 px-6 py-2 rounded-full backdrop-blur-sm hover:bg-white/30 transition shadow-sm"
                >
                    Login to Account
                </button>
            </div>

            <p className="text-white/60 text-xs mt-12 bg-black/10 px-4 py-2 rounded-full">Select language to proceed • భాషను ఎంచుకోండి</p>
        </div>
    );
};

export default LanguageSelection;
