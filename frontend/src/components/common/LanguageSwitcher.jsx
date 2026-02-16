import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Globe } from 'lucide-react';

const LanguageSwitcher = ({ compact = false }) => {
    const { language, setLanguage } = useLanguage();

    const toggleLanguage = () => {
        const newLang = language === 'English' ? 'Telugu' : 'English';
        setLanguage(newLang);
    };

    if (compact) {
        return (
            <button
                onClick={toggleLanguage}
                className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded-full text-xs font-medium hover:bg-white/20 transition"
                title="Switch Language"
            >
                <Globe size={14} />
                <span>{language === 'English' ? 'EN' : 'తె'}</span>
            </button>
        );
    }

    return (
        <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--col-primary)] to-[var(--col-secondary)] text-white rounded-xl font-medium hover:opacity-90 transition shadow-md"
        >
            <Globe size={18} />
            <span>{language === 'English' ? 'తెలుగు' : 'English'}</span>
        </button>
    );
};

export default LanguageSwitcher;
