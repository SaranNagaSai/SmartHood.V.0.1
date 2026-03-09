import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import VoiceInput from '../components/common/VoiceInput';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import Webcam from 'react-webcam';
import { API_URL } from '../utils/apiConfig';
import { User, MapPin, Briefcase, Check, Camera, Upload, X } from 'lucide-react';
import './Register.css';

const Register = () => {
    const { t, language, translateValue } = useLanguage();
    const { login } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
    const [cameraMode, setCameraMode] = useState(false);
    const webcamRef = React.useRef(null);
    const [publicStats, setPublicStats] = useState({ totalUsers: 0, totalLocalities: 0, totalTowns: 0 });

    // OTP related states
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [isPhoneVerified, setIsPhoneVerified] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);

    useEffect(() => {
        const fetchPublicStats = async () => {
            try {
                const res = await axios.get(`${API_URL}/localities/public-stats`);
                if (res.data) {
                    setPublicStats(res.data);
                }
            } catch (err) {
                console.error('Failed to fetch public stats', err);
            }
        };
        fetchPublicStats();
    }, []);
    const isTelugu = (text) => {
        if (!text) return true;
        // Telugu Unicode Range: 0C00-0C7F
        // Also allow numbers, spaces, and common punctuation
        const teluguRegex = /^[\u0C00-\u0C7F0-9\s.,!?-]+$/;
        return teluguRegex.test(text);
    };

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        age: '',
        gender: 'male',
        email: '',
        bloodGroup: 'A+',
        address: '',
        locality: '',
        town: '',
        district: '',
        state: '',
        professionCategory: 'employed',
        professionDetails: {
            jobRole: '',
            sector: '',
            businessType: '',
            educationLevel: '',
            course: '',
            description: ''
        },
        experience: 0
    });

    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const genders = ['male', 'female', 'other_gender'];
    const professionCategories = ['employed', 'business', 'student', 'homemaker', 'others_cat'];
    const educationLevels = ['high_school', 'intermediate', 'undergraduate', 'postgraduate', 'phd', 'others_cat'];

    const indianStates = [
        "Andaman and Nicobar Islands",
        "Andhra Pradesh",
        "Arunachal Pradesh",
        "Assam",
        "Bihar",
        "Chandigarh",
        "Chhattisgarh",
        "Dadra and Nagar Haveli and Daman and Diu",
        "Delhi",
        "Goa",
        "Gujarat",
        "Haryana",
        "Himachal Pradesh",
        "Jammu and Kashmir",
        "Jharkhand",
        "Karnataka",
        "Kerala",
        "Ladakh",
        "Lakshadweep",
        "Madhya Pradesh",
        "Maharashtra",
        "Manipur",
        "Meghalaya",
        "Mizoram",
        "Nagaland",
        "Odisha",
        "Puducherry",
        "Punjab",
        "Rajasthan",
        "Sikkim",
        "Tamil Nadu",
        "Telangana",
        "Tripura",
        "Uttar Pradesh",
        "Uttarakhand",
        "West Bengal"
    ];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        // Reset verification if phone changes
        if (e.target.name === 'phone') {
            setIsPhoneVerified(false);
            setOtpSent(false);
        }
    };

    const handleSendOTP = async () => {
        if (!formData.phone) {
            alert(t('phone_placeholder'));
            return;
        }
        setOtpLoading(true);
        try {
            const res = await axios.post(`${API_URL}/auth/send-registration-otp`, { phone: formData.phone });
            if (res.data.success) {
                setOtpSent(true);
                alert(t('otp_sent_success', 'Verification code sent to your mobile.'));
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to send OTP');
        }
        setOtpLoading(false);
    };

    const handleVerifyOTP = async () => {
        if (!otp) {
            alert('Please enter the OTP');
            return;
        }
        setOtpLoading(true);
        try {
            const res = await axios.post(`${API_URL}/auth/verify-registration-otp`, { phone: formData.phone, otp });
            if (res.data.success) {
                setIsPhoneVerified(true);
                alert(t('phone_verified', 'Phone verified successfully!'));
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Invalid OTP');
        }
        setOtpLoading(false);
    };


    const handleProfessionDetailChange = (field, value) => {
        setFormData({
            ...formData,
            professionDetails: { ...formData.professionDetails, [field]: value }
        });
    };

    const nextStep = () => {
        // Validation for each step
        if (step === 1) {
            if (!formData.name || !formData.phone || !formData.age || !formData.bloodGroup) {
                alert(t('fill_all_error'));
                return;
            }
            if (!isPhoneVerified) {
                alert(t('verify_phone_error', 'Please verify your phone number first.'));
                return;
            }
        }
        if (step === 2) {
            if (!formData.locality || !formData.town || !formData.district || !formData.state) {
                alert(t('fill_location_error'));
                return;
            }
            if (language === 'Telugu') {
                if (!isTelugu(formData.locality) || !isTelugu(formData.town) || !isTelugu(formData.district)) {
                    alert(t('telugu_only_error'));
                    return;
                }
            }
        }
        if (step === 3) {
            const pd = formData.professionDetails;
            if (!formData.professionCategory) {
                alert(t('select_profession_cat_error'));
                return;
            }

            // Mandatory sub-field validation
            if (formData.professionCategory === 'employed' && !pd.jobRole) {
                alert(t('fill_all_error'));
                return;
            }
            if (formData.professionCategory === 'business' && !pd.businessType) {
                alert(t('fill_all_error'));
                return;
            }
            if (formData.professionCategory === 'student' && (!pd.educationLevel || !pd.course)) {
                alert(t('fill_all_error'));
                return;
            }

            if (language === 'Telugu') {
                const fieldsToVerify = [pd.jobRole, pd.sector, pd.businessType, pd.course, pd.description];
                if (fieldsToVerify.some(f => f && !isTelugu(f))) {
                    alert(t('telugu_only_error'));
                    return;
                }
            }
        }
        setStep(step + 1);
    };

    const prevStep = () => setStep(step - 1);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfilePhoto(file);
            setProfilePhotoPreview(URL.createObjectURL(file));
        }
    };

    const capture = React.useCallback(() => {
        const imageSrc = webcamRef.current.getScreenshot();
        setProfilePhotoPreview(imageSrc);

        // Convert base64 to file
        fetch(imageSrc)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], "profile-cam.jpg", { type: "image/jpeg" });
                setProfilePhoto(file);
            });
        setCameraMode(false);
    }, [webcamRef]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formDataToSend = new FormData();

            // Append format data
            Object.keys(formData).forEach(key => {
                if (key === 'professionDetails') {
                    // Flatten or send as JSON string? 
                    // Backend expects flattened or object? 
                    // Let's check authController. It extracts from req.body directly.
                    // Middleware 'multer' processes FormData. Non-file fields are in req.body.
                    // But nested objects in FormData are tricky.
                    // Usually we send them as `professionDetails[jobRole]` or JSON string.
                    // Let's send as JSON string if backend parses it, OR simple flattened keys.
                    // Given the authController `req.body` usage, it likely expects object structure.
                    // But multer form-data text fields handled by body-parser might not parse nested.
                    // Best approach: Send flatten keys structure: professionDetails[jobRole]
                    Object.keys(formData.professionDetails).forEach(detailKey => {
                        formDataToSend.append(`professionDetails[${detailKey}]`, formData.professionDetails[detailKey]);
                    });
                } else {
                    formDataToSend.append(key, formData[key]);
                }
            });

            // Append language
            formDataToSend.append('language', language || 'English');

            // Append Profile Photo
            if (profilePhoto) {
                formDataToSend.append('profilePhoto', profilePhoto);
            }

            const res = await axios.post(`${API_URL}/auth/register`, formDataToSend);

            const successMsg = `${t('registration_success_prefix', 'Registration Successful!')} ${t('unique_id_label', 'Your Unique ID')}: ${res.data.uniqueId}${formData.email ? `\n\n${t('email_confirmation_msg', 'A confirmation is sent to')}: ${formData.email}` : ''}`;
            alert(successMsg);
            login(res.data, res.data.token);
            navigate('/home');
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || t('registration_failed'));
        }
        setLoading(false);
    };

    // Stepper Component
    const Stepper = ({ current }) => (
        <div className="flex items-center justify-center mb-6 md:mb-8 px-2">
            {[1, 2, 3, 4].map((s, idx) => (
                <React.Fragment key={s}>
                    <div className="relative flex flex-col items-center z-10">
                        <div className={`w-9 h-9 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold transition-all duration-500 ${s < current ? 'bg-success text-white' :
                            s === current ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110' :
                                'bg-gray-100 text-gray-400 border border-gray-200'
                            }`}>
                            {s < current ? <Check size={16} strokeWidth={3} /> : (
                                <div className="scale-90 md:scale-100">
                                    {s === 1 && <User size={18} />}
                                    {s === 2 && <MapPin size={18} />}
                                    {s === 3 && <Briefcase size={18} />}
                                    {s === 4 && <Camera size={18} />}
                                </div>
                            )}
                        </div>
                        <span className={`text-[9px] md:text-[10px] uppercase tracking-wider mt-2 md:mt-3 font-bold transition-colors ${s === current ? 'text-primary' : 'text-gray-400'
                            }`}>
                            {s === 1 ? t('personal') : s === 2 ? t('location') : s === 3 ? t('work') : t('photo')}
                        </span>
                    </div>
                    {idx < 3 && (
                        <div className="flex-1 h-0.5 mx-0.5 sm:mx-1 bg-gray-200 relative overflow-hidden rounded-full min-w-[10px] sm:min-w-[30px] max-w-[60px]">
                            <div className={`absolute top-0 left-0 h-full bg-success transition-all duration-500 ease-out ${s < current ? 'w-full' : 'w-0'}`}></div>
                        </div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen w-full bg-gradient-brand flex items-start sm:items-center justify-center p-0 sm:p-4 relative overflow-hidden">
            {/* Animated Background Particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute rounded-full bg-white/10"
                        style={{
                            width: `${Math.random() * 6 + 2}px`,
                            height: `${Math.random() * 6 + 2}px`,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animation: `floatParticle ${Math.random() * 8 + 6}s ease-in-out infinite`,
                            animationDelay: `${Math.random() * 5}s`
                        }}
                    />
                ))}
            </div>

            <div className="w-full max-w-[1100px] flex flex-col lg:flex-row bg-white sm:bg-white/95 backdrop-blur-xl sm:rounded-[2rem] shadow-2xl overflow-hidden animate-slide-up relative z-10 min-h-screen sm:min-h-0">

                {/* Left Side Illustration */}
                <div className="hidden lg:flex lg:w-[420px] bg-gradient-to-br from-[#0a5e75] via-[#0E7490] to-[#4338CA] p-10 flex-col justify-between relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
                            </pattern>
                            <rect width="100%" height="100%" fill="url(#grid)" />
                        </svg>
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                                <span className="text-2xl">🏘️</span>
                            </div>
                            <div>
                                <h2 className="text-white text-xl font-bold tracking-tight">SmartHood</h2>
                                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Community Network</p>
                            </div>
                        </div>
                        <h3 className="text-white text-3xl font-bold leading-tight mb-4">Build Your<br />Neighborhood<br />Network</h3>
                        <p className="text-white/70 text-sm leading-relaxed">Connect with professionals, neighbors, and services in your locality. Join the smart community revolution.</p>
                    </div>

                    {/* Stats */}
                    <div className="relative z-10 grid grid-cols-3 gap-3">
                        {[{ value: publicStats.totalUsers, label: t('active_users') }, { value: publicStats.totalLocalities, label: t('localities') }, { value: publicStats.totalTowns, label: t('towns') }].map((stat, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/10">
                                <p className="text-white text-lg font-bold">{stat.value}+</p>
                                <p className="text-white/50 text-[9px] font-bold uppercase tracking-wider">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mobile Header (Fixed) */}
                <div className="lg:hidden bg-gradient-to-br from-[#0a5e75] via-[#0E7490] to-[#4338CA] p-6 pt-10 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                            <pattern id="gridMobile" width="30" height="30" patternUnits="userSpaceOnUse">
                                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="white" strokeWidth="0.5" />
                            </pattern>
                            <rect width="100%" height="100%" fill="url(#gridMobile)" />
                        </svg>
                    </div>

                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 shadow-xl">
                            <span className="text-2xl">🏘️</span>
                        </div>
                        <h2 className="text-white text-xl font-bold tracking-tight mb-1">{t('join_smarthood')}</h2>
                        <p className="text-white/60 text-[11px] font-bold uppercase tracking-widest mb-6">{t('community_connect')}</p>

                        <div className="grid grid-cols-3 gap-3 w-full">
                            {[{ value: publicStats.totalUsers, label: t('active_users') }, { value: publicStats.totalLocalities, label: t('localities') }, { value: publicStats.totalTowns, label: t('towns') }].map((stat, i) => (
                                <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                                    <p className="text-white text-base font-bold">{stat.value}+</p>
                                    <p className="text-white/50 text-[8px] font-bold uppercase tracking-wider">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side - Registration Form Container */}
                <div className="flex-1 flex flex-col bg-white">
                    <div className="hidden lg:block bg-primary/5 p-8 text-center border-b border-primary/10">
                        <h1 className="text-3xl font-bold text-primary tracking-tight">{t('join_smarthood')}</h1>
                        <p className="text-gray-500 text-sm mt-2">{t('community_connect')}</p>
                    </div>

                    <div className="p-6 sm:p-8 flex-1">
                        <Stepper current={step} />

                        <form onSubmit={(e) => e.preventDefault()} className="animate-fade-in">
                            {/* Step 1: Personal Details */}
                            {step === 1 && (
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <VoiceInput
                                            name="name"
                                            label={t('name_label') + " *"}
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder={t('name_placeholder')}
                                            className="bg-gray-50 border-gray-200 focus:border-primary rounded-xl py-3"
                                            required
                                        />

                                        <div className="relative">
                                            <VoiceInput
                                                name="phone"
                                                label={t('phone_label') + " *"}
                                                value={formData.phone}
                                                onChange={handleChange}
                                                type="tel"
                                                placeholder={t('phone_placeholder')}
                                                className="bg-gray-50 border-gray-200 focus:border-primary rounded-xl py-3 pr-24"
                                                required
                                                disabled={isPhoneVerified}
                                            />
                                            {!isPhoneVerified && !otpSent && (
                                                <button
                                                    type="button"
                                                    onClick={handleSendOTP}
                                                    disabled={otpLoading || !formData.phone}
                                                    className="absolute right-2 top-8 bg-primary text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-primary/90 transition disabled:opacity-50"
                                                >
                                                    {otpLoading ? '...' : t('get_otp', 'Get OTP')}
                                                </button>
                                            )}
                                            {isPhoneVerified && (
                                                <div className="absolute right-3 top-9 text-success flex items-center gap-1">
                                                    <Check size={16} strokeWidth={3} />
                                                    <span className="text-[10px] font-bold uppercase">{t('verified', 'Verified')}</span>
                                                </div>
                                            )}
                                        </div>

                                        {otpSent && !isPhoneVerified && (
                                            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 animate-fade-in">
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t('enter_otp', 'Enter 6-Digit OTP')}</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        maxLength="6"
                                                        value={otp}
                                                        onChange={(e) => setOtp(e.target.value)}
                                                        className="flex-1 p-3 border border-gray-200 rounded-lg text-center font-bold tracking-[0.5em] focus:ring-2 focus:ring-primary outline-none"
                                                        placeholder="000000"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleVerifyOTP}
                                                        disabled={otpLoading || otp.length < 6}
                                                        className="bg-success text-white px-6 py-3 rounded-lg font-bold hover:bg-success/90 transition disabled:opacity-50"
                                                    >
                                                        {otpLoading ? '...' : t('verify', 'Verify')}
                                                    </button>
                                                </div>
                                                <p className="text-[10px] text-gray-400 mt-2 text-center">
                                                    Didn't receive? <button type="button" onClick={handleSendOTP} className="text-primary font-bold">Resend</button>
                                                </p>
                                            </div>
                                        )}

                                        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-300 ${!isPhoneVerified ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                                            <VoiceInput
                                                name="age"
                                                label={t('age') + " *"}
                                                value={formData.age}
                                                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                                type="number"
                                                placeholder={t('age')}
                                                className="bg-gray-50 border-gray-200 focus:border-primary rounded-xl py-3"
                                                required
                                            />
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">{t('gender')} *</label>
                                                <select
                                                    name="gender"
                                                    value={formData.gender}
                                                    onChange={handleChange}
                                                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-primary outline-none transition-all"
                                                >
                                                    {genders.map(g => <option key={g} value={g}>{t(g)}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-300 ${!isPhoneVerified ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">{t('blood_group')} *</label>
                                                <select
                                                    name="bloodGroup"
                                                    value={formData.bloodGroup}
                                                    onChange={handleChange}
                                                    className="w-full p-3 border border-red-100 rounded-xl bg-red-50 focus:ring-2 focus:ring-red-500 outline-none text-red-700 font-bold"
                                                >
                                                    {bloodGroups.map(bg => <option key={bg} value={bg}>{translateValue(bg)}</option>)}
                                                </select>
                                            </div>
                                            <VoiceInput
                                                name="email"
                                                label={t('email') + ` (${t('optional')})`}
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                type="email"
                                                placeholder={t('email_placeholder') || "your@email.com"}
                                                className="bg-gray-50 border-gray-200 focus:border-primary rounded-xl py-3"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={nextStep}
                                        disabled={!isPhoneVerified}
                                        className="w-full bg-primary text-white p-4 rounded-xl font-bold shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {t('continue_location')} →
                                    </button>
                                </div>
                            )}

                            {/* Step 2: Location Details */}
                            {step === 2 && (
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <VoiceInput
                                            name="address"
                                            label={t('address_label')}
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            placeholder={t('address_placeholder')}
                                            type="textarea"
                                            className="bg-gray-50 border-gray-200 focus:border-primary rounded-xl"
                                        />

                                        <VoiceInput
                                            name="locality"
                                            label={t('locality_label') + " *"}
                                            value={formData.locality}
                                            onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                                            placeholder={t('locality_placeholder')}
                                            className="bg-gray-50 border-gray-200 focus:border-primary rounded-xl py-3"
                                            required
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <VoiceInput
                                                name="town"
                                                label={t('town_label') + " *"}
                                                value={formData.town}
                                                onChange={(e) => setFormData({ ...formData, town: e.target.value })}
                                                placeholder={t('town_placeholder')}
                                                className="bg-gray-50 border-gray-200 focus:border-primary rounded-xl py-3"
                                                required
                                            />
                                            <VoiceInput
                                                name="district"
                                                label={t('district_label') + " *"}
                                                value={formData.district}
                                                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                                                placeholder={t('district_placeholder')}
                                                className="bg-gray-50 border-gray-200 focus:border-primary rounded-xl py-3"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">{t('state_label') || "STATE"} *</label>
                                            <select
                                                name="state"
                                                value={formData.state}
                                                onChange={handleChange}
                                                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-primary outline-none transition-all"
                                                required
                                            >
                                                <option value="">-- {t('select_state')} --</option>
                                                {indianStates.map(state => (
                                                    <option key={state} value={state}>{translateValue(state)}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 mt-6">
                                        <button
                                            onClick={prevStep}
                                            className="flex-1 p-4 border border-gray-200 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition"
                                        >
                                            {t('back')}
                                        </button>
                                        <button
                                            onClick={nextStep}
                                            className="flex-1 bg-primary text-white p-4 rounded-xl font-bold shadow-lg hover:shadow-primary/30 transition"
                                        >
                                            {t('next_step')} →
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Professional Details */}
                            {step === 3 && (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">{t('occupation_type')} *</label>
                                        <select
                                            name="professionCategory"
                                            value={formData.professionCategory}
                                            onChange={handleChange}
                                            className="w-full p-4 border-2 border-primary/20 rounded-xl bg-primary/5 font-bold text-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                        >
                                            {professionCategories.map(pc => <option key={pc} value={pc}>{t(pc.toLowerCase()) || pc}</option>)}
                                        </select>
                                    </div>

                                    {/* Dynamic fields based on profession category */}
                                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                                        {formData.professionCategory === 'employed' && (
                                            <>
                                                <VoiceInput
                                                    label={t('job_role_label') + " *"}
                                                    value={formData.professionDetails.jobRole}
                                                    onChange={(e) => handleProfessionDetailChange('jobRole', e.target.value)}
                                                    placeholder={t('job_role_placeholder')}
                                                    className="bg-white border-gray-200 rounded-xl py-3"
                                                    required
                                                />
                                                <VoiceInput
                                                    label={t('sector_label')}
                                                    value={formData.professionDetails.sector}
                                                    onChange={(e) => handleProfessionDetailChange('sector', e.target.value)}
                                                    placeholder={t('sector_placeholder')}
                                                    className="bg-white border-gray-200 rounded-xl py-3"
                                                />
                                                <VoiceInput
                                                    label={t('experience_label')}
                                                    value={formData.experience}
                                                    onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
                                                    type="number"
                                                    placeholder="0"
                                                    className="bg-white border-gray-200 rounded-xl py-3"
                                                />
                                            </>
                                        )}

                                        {formData.professionCategory === 'business' && (
                                            <>
                                                <VoiceInput
                                                    label={t('business_type_label') + " *"}
                                                    value={formData.professionDetails.businessType}
                                                    onChange={(e) => handleProfessionDetailChange('businessType', e.target.value)}
                                                    placeholder={t('business_type_placeholder')}
                                                    className="bg-white border-gray-200 rounded-xl py-3"
                                                    required
                                                />
                                                <VoiceInput
                                                    label={t('experience_label')}
                                                    value={formData.experience}
                                                    onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
                                                    type="number"
                                                    placeholder="0"
                                                    className="bg-white border-gray-200 rounded-xl py-3"
                                                />
                                            </>
                                        )}

                                        {formData.professionCategory === 'student' && (
                                            <>
                                                <div className="space-y-1">
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">{t('education_level_label')} *</label>
                                                    <select
                                                        value={formData.professionDetails.educationLevel}
                                                        onChange={(e) => handleProfessionDetailChange('educationLevel', e.target.value)}
                                                        className="w-full p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary outline-none transition-all"
                                                        required
                                                    >
                                                        <option value="">-- {t('choose_role')} --</option>
                                                        {educationLevels.map(level => (
                                                            <option key={level} value={level}>{t(level)}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <VoiceInput
                                                    label={t('course_label') + " *"}
                                                    value={formData.professionDetails.course}
                                                    onChange={(e) => handleProfessionDetailChange('course', e.target.value)}
                                                    placeholder={t('course_placeholder')}
                                                    className="bg-white border-gray-200 rounded-xl py-3"
                                                    required
                                                />
                                                <VoiceInput
                                                    label={t('experience_label')}
                                                    value={formData.experience}
                                                    onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
                                                    type="number"
                                                    placeholder="0"
                                                    className="bg-white border-gray-200 rounded-xl py-3"
                                                />
                                            </>
                                        )}

                                        {(['homemaker', 'others_cat'].includes(formData.professionCategory)) && (
                                            <>
                                                <VoiceInput
                                                    label={t('description_label')}
                                                    value={formData.professionDetails.description}
                                                    onChange={(e) => handleProfessionDetailChange('description', e.target.value)}
                                                    placeholder={t('description_placeholder')}
                                                    className="bg-white border-gray-200 rounded-xl py-3"
                                                />
                                                <VoiceInput
                                                    label={t('experience_label')}
                                                    value={formData.experience}
                                                    onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
                                                    type="number"
                                                    placeholder="0"
                                                    className="bg-white border-gray-200 rounded-xl py-3"
                                                />
                                            </>
                                        )}
                                    </div>

                                    <div className="flex gap-4 mt-6">
                                        <button
                                            onClick={prevStep}
                                            className="flex-1 p-4 border border-gray-200 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition"
                                        >
                                            {t('back')}
                                        </button>
                                        <button
                                            onClick={nextStep}
                                            className="flex-1 bg-primary text-white p-4 rounded-xl font-bold shadow-lg hover:shadow-primary/30 transition"
                                        >
                                            {t('next_step')} →
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Profile Photo */}
                            {step === 4 && (
                                <div className="space-y-6 text-center">
                                    <h3 className="text-xl font-bold text-gray-800">{t('camera_upload_title') || 'Add a Profile Photo'}</h3>
                                    <p className="text-sm text-gray-500">{t('camera_upload_desc') || 'Help your neighbors recognize you.'}</p>

                                    <div className="flex flex-col items-center justify-center gap-6 py-4">
                                        {/* Preview Area */}
                                        <div className="relative w-40 h-40">
                                            {profilePhotoPreview ? (
                                                <div className="relative w-40 h-40">
                                                    <img
                                                        src={profilePhotoPreview}
                                                        alt="Preview"
                                                        className="w-full h-full object-cover rounded-full border-4 border-white shadow-xl"
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            setProfilePhoto(null);
                                                            setProfilePhotoPreview(null);
                                                        }}
                                                        className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="w-40 h-40 bg-gray-100 rounded-full flex items-center justify-center border-4 border-dashed border-gray-300 text-gray-400">
                                                    <User size={64} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Camera Mode */}
                                        {cameraMode && (
                                            <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
                                                <div className="relative w-full max-w-md bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
                                                    <Webcam
                                                        audio={false}
                                                        ref={webcamRef}
                                                        screenshotFormat="image/jpeg"
                                                        className="w-full h-auto"
                                                        videoConstraints={{ facingMode: "user" }}
                                                    />
                                                    <button
                                                        onClick={() => setCameraMode(false)}
                                                        className="absolute top-4 right-4 text-white p-2"
                                                    >
                                                        <X size={24} />
                                                    </button>
                                                    <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                                                        <button
                                                            onClick={capture}
                                                            className="bg-white rounded-full p-4 shadow-lg hover:scale-110 transition active:scale-95"
                                                        >
                                                            <div className="w-4 h-4 rounded-full bg-red-500 ring-4 ring-offset-2 ring-red-500"></div>
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="text-white mt-4 text-sm">Align your face and click capture</p>
                                            </div>
                                        )}

                                        {/* Controls - Always visible */}
                                        <div className="flex flex-col md:flex-row gap-4 w-full">
                                            <button
                                                onClick={() => setCameraMode(true)}
                                                className="flex-1 flex flex-row md:flex-col items-center justify-center gap-3 md:gap-2 p-4 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 hover:bg-blue-100 transition"
                                            >
                                                <Camera size={24} />
                                                <span className="font-bold text-sm">{t('take_photo') || 'Take Photo'}</span>
                                            </button>
                                            <label className="flex-1 flex flex-row md:flex-col items-center justify-center gap-3 md:gap-2 p-4 bg-green-50 text-green-600 rounded-xl border border-green-100 hover:bg-green-100 transition cursor-pointer">
                                                <Upload size={24} />
                                                <span className="font-bold text-sm">{t('upload_photo') || 'Upload'}</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleFileChange}
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 mt-8">
                                        <button
                                            onClick={prevStep}
                                            className="flex-1 p-4 border border-gray-200 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition"
                                        >
                                            {t('back')}
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={loading}
                                            className="flex-1 bg-gradient-to-r from-success to-emerald-600 text-white p-4 rounded-xl font-bold shadow-lg hover:shadow-success/30 hover:-translate-y-0.5 transition-all disabled:opacity-50"
                                        >
                                            {loading ? t('creating') : t('complete_join')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </form>

                        <p className="text-center text-sm text-gray-500 mt-8">
                            {t('already_account')} {' '}
                            <Link to="/login" className="text-primary font-bold hover:underline">
                                {t('login_here')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
