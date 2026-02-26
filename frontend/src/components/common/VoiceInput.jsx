import React, { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

import PropTypes from 'prop-types';

const VoiceInput = ({ label, value, onChange, placeholder, type = 'text', required = false, className, labelClassName, name }) => {
    // ... (rest of component body same as before, essentially just wrapping export and adding propTypes)
    // Actually, because the component is long, I will use MultiReplace or just replace the end.
    // Replacing the whole file is safer to ensure imports are at top.
    const { language, t } = useLanguage();
    // ... [RE-IMPLEMENTING COMPONENT BODY TO ENSURE NO LOSS]
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState(null);
    const valueRef = React.useRef(value);

    React.useEffect(() => {
        valueRef.current = value;
    }, [value]);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognizer = new SpeechRecognition();
            recognizer.continuous = false;
            recognizer.interimResults = false;

            // Map our language keys to BCP 47 codes
            const langMap = {
                'English': 'en-IN',
                'Telugu': 'te-IN'
            };
            recognizer.lang = langMap[language] || 'en-IN';

            recognizer.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                // Use ref value to ensure we have the latest
                const currentValue = valueRef.current;
                const updatedValue = currentValue ? `${currentValue} ${transcript}` : transcript;
                const simulatedEvent = { target: { value: updatedValue, name } };
                onChange(simulatedEvent);
                setIsListening(false);
            };

            recognizer.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };

            recognizer.onend = () => setIsListening(false);
            setRecognition(recognizer);
        }
    }, [onChange, name, language]); // value removed from dependencies

    const toggleListening = () => {
        if (isListening) {
            recognition.stop();
        } else {
            try {
                recognition.start();
                setIsListening(true);
            } catch (e) {
                console.warn("Recognition already started or error:", e);
            }
        }
    };

    const baseInputStyles = "w-full p-3 pr-10 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition font-medium text-gray-700 placeholder-gray-400 text-sm md:text-base";
    const combinedStyles = className ? `${baseInputStyles} ${className}` : baseInputStyles;
    const currentPlaceholder = isListening ? `${t('listening')} (${language || 'English'})...` : placeholder;

    return (
        <div className="mb-4">
            {label && <label className={`block text-xs font-bold uppercase mb-2 ml-1 ${labelClassName || 'text-gray-500'}`}>{label}</label>}
            <div className="relative group">
                {type === 'textarea' ? (
                    <textarea
                        className={`${combinedStyles} h-32 resize-none ${isListening ? 'bg-blue-50/30' : ''}`}
                        value={value}
                        onChange={onChange}
                        placeholder={currentPlaceholder}
                        required={required}
                        name={name}
                    />
                ) : (
                    <input
                        type={type}
                        className={`${combinedStyles} ${isListening ? 'bg-blue-50/30' : ''}`}
                        value={value}
                        onChange={onChange}
                        placeholder={currentPlaceholder}
                        required={required}
                        name={name}
                    />
                )}

                {recognition && (
                    <button
                        type="button"
                        onClick={toggleListening}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all flex-shrink-0 ${isListening
                            ? 'bg-red-50 text-red-500 animate-pulse ring-2 ring-red-100'
                            : 'text-gray-400 hover:text-primary hover:bg-primary/5'
                            }`}
                        title="Voice Input"
                    >
                        {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                    </button>
                )}
            </div>
        </div>
    );
};

VoiceInput.propTypes = {
    label: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    placeholder: PropTypes.string,
    type: PropTypes.string,
    required: PropTypes.bool,
    className: PropTypes.string,
    labelClassName: PropTypes.string,
    name: PropTypes.string
};

export default VoiceInput;
