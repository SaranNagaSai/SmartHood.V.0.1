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
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-brand px-4 relative overflow-hidden">
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
                        <h1 className="text-2xl font-bold text-white mb-2">{t('login')}</h1>
                        <p className="text-sm text-gray-200 font-medium opacity-80">{t('welcome_back_msg')}</p>
                    </div>

                    <div className="space-y-4 md:space-y-6 w-full animate-fade-in" style={{ animationDelay: '0.2s' }}>
                        <button
                            onClick={() => handleSelect('English')}
                            className="w-full bg-white/95 backdrop-blur-sm p-5 md:p-6 rounded-2xl shadow-lg hover:transform hover:scale-105 transition-all duration-300 group border-2 border-transparent hover:border-primary/20"
                        >
                            <h2 className="text-xl md:text-2xl font-bold text-[var(--col-primary)] group-hover:text-[var(--col-secondary)]">English</h2>
                            <p className="text-gray-500 text-xs md:text-sm mt-1">Continue in English</p>
                        </button>

                        <button
                            onClick={() => handleSelect('Telugu')}
                            className="w-full bg-white/95 backdrop-blur-sm p-5 md:p-6 rounded-2xl shadow-lg hover:transform hover:scale-105 transition-all duration-300 group border-2 border-transparent hover:border-primary/20"
                        >
                            <h2 className="text-xl md:text-2xl font-bold text-[var(--col-primary)] group-hover:text-[var(--col-secondary)] font-telugu">తెలుగు</h2>
                            <p className="text-gray-500 text-xs md:text-sm mt-1">తెలుగులో కొనసాగండి</p>
                        </button>
                    </div>

                    <div className="mt-8 text-center animate-fade-in border-t border-white/10 pt-6" style={{ animationDelay: '0.4s' }}>
                        <p className="text-gray-300 text-sm mb-4">Already part of the neighborhood?</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="text-white font-bold bg-white/10 px-8 py-3 rounded-xl backdrop-blur-sm hover:bg-white/20 transition-all shadow-lg border border-white/10 w-full"
                        >
                            Login to Account
                        </button>
                    </div>
                </div>

                <p className="text-white/60 text-xs mt-8 bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm border border-white/5">Select language to proceed • భాషను ఎంచుకోండి</p>
            </div>
        </div>
    );
};

export default LanguageSelection;
