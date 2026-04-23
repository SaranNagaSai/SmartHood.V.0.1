import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import VoiceInput from '../components/common/VoiceInput';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_URL, SERVER_URL } from '../utils/apiConfig';
import smartHoodLogo from '../assets/images/Smart Hood Logo.png';

const Login = () => {
    const { t } = useLanguage();
    const { login } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', phone: '', pin: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isOTPStep, setIsOTPStep] = useState(false);
    const [otp, setOtp] = useState('');
    const [serverReady, setServerReady] = useState(false);
    const [warmingUp, setWarmingUp] = useState(true);
    const [sandboxActive, setSandboxActive] = useState(false);
    const retryCountRef = useRef(0);
    const MAX_RETRIES = 3;

    const handleLogin = async () => {
        // Basic validation
        if (!formData.name.trim() || (!formData.phone.trim() && !formData.pin.trim())) {
            setError(t('fill_all_error') || 'Please enter name and (Phone or PIN)');
            return;
        }

        setLoading(true);
        setError('');
        retryCountRef.current = 0;

        const attemptLogin = async () => {
            try {
                const res = await axios.post(`${API_URL}/auth/login`, formData, {
                    timeout: 30000 // 30s timeout for cold starts
                });
                if (res.data.isSandbox) {
                    setSandboxActive(true);
                }
                if (res.data.requireOTP) {
                    setIsOTPStep(true);
                    setLoading(false);
                    return;
                }
                login(res.data, res.data.token);
                // Check for redirect parameter
                const queryParams = new URLSearchParams(window.location.search);
                const redirectTo = queryParams.get('redirect');
                navigate(redirectTo ? decodeURIComponent(redirectTo) : '/home');
            } catch (err) {
                // If it's a network/timeout error and we haven't retried yet, auto-retry
                if (!err.response && retryCountRef.current < MAX_RETRIES) {
                    retryCountRef.current += 1;
                    // Wait 2 seconds and retry
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    return attemptLogin();
                }

                if (err.response) {
                    // Server responded with an error
                    setError(err.response.data?.message || t('login_failed'));
                } else if (err.code === 'ECONNABORTED') {
                    // Request timed out
                    setError(t('server_starting') || 'Server is starting up. Please wait a moment and try again.');
                } else {
                    // Network error
                    setError(t('network_error') || 'Network error. Please check your internet connection and try again.');
                }
                setLoading(false);
            }
        };

        await attemptLogin();
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
                        {!isOTPStep && <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight drop-shadow-md">{t('smarthood') || 'SmartHood'}</h2>}
                    </div>
                </div>

                <div className="w-full bg-gray-900/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-extrabold text-white">{t('login')}</h1>
                        <p className="text-sm text-gray-200 mt-2 font-medium opacity-80">{t('welcome_back_msg')}</p>
                    </div>

                    {/* Server warming up indicator */}
                    {warmingUp && (
                        <div className="mb-4 p-3 bg-amber-500/20 border border-amber-400/30 rounded-xl flex items-center gap-2 text-amber-200 text-xs">
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-amber-300 border-t-transparent flex-shrink-0"></div>
                            <span>{t('server_warming') || 'Connecting to server...'}</span>
                        </div>
                    )}

                    {/* Error message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-xl text-red-200 text-sm flex items-start gap-2">
                            <span className="text-red-400 text-lg leading-none flex-shrink-0">⚠</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {!isOTPStep ? (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-4">
                                    <VoiceInput
                                        label="Name / Unique ID *"
                                        value={formData.name}
                                        onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setError(''); }}
                                        placeholder={t('name_placeholder')}
                                        className="bg-white/90 border-transparent focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all rounded-xl py-3 pr-10 text-gray-800 placeholder-gray-500"
                                        labelClassName="text-white/80 text-[10px] font-black uppercase tracking-widest mb-1 shadow-sm"
                                    />

                                    <VoiceInput
                                        label="Phone Number (For OTP Login)"
                                        value={formData.phone}
                                        onChange={(e) => { setFormData({ ...formData, phone: e.target.value }); setError(''); }}
                                        placeholder={t('phone_placeholder')}
                                        type="tel"
                                        className="bg-white/90 border-2 border-primary/10 focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all rounded-xl py-3 pr-10 text-gray-800 placeholder-gray-500"
                                        labelClassName="text-white/80 text-[10px] font-black uppercase tracking-widest mb-1 shadow-sm"
                                    />
                                </div>

                                <div className="relative flex items-center gap-4 py-2">
                                    <div className="h-px bg-white/10 flex-1"></div>
                                    <span className="text-[10px] font-black text-white/30 tracking-[0.3em]">OR</span>
                                    <div className="h-px bg-white/10 flex-1"></div>
                                </div>

                                <div className="bg-indigo-500/20 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-xl overflow-hidden relative group">
                                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-700"></div>

                                    <label className="block text-center text-[11px] font-black text-indigo-200 uppercase tracking-[0.2em] mb-4">Login with 4-Digit PIN</label>
                                    <div className="flex justify-center relative z-10">
                                        <input
                                            type="text"
                                            value={formData.pin}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                                setFormData({ ...formData, pin: val });
                                                setError('');
                                            }}
                                            placeholder="0 0 0 0"
                                            className="w-full max-w-[220px] bg-white border-2 border-white/20 text-indigo-900 rounded-2xl py-4 text-3xl font-black text-center tracking-[0.5em] focus:ring-8 focus:ring-indigo-500/30 outline-none transition-all shadow-inner placeholder:text-gray-200"
                                            inputMode="numeric"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleLogin}
                                disabled={loading}
                                className="w-full bg-primary text-white p-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-primary/40 hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-2 group border border-white/10 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                        <span>{t('signing_in') || 'Signing in...'}</span>
                                    </>
                                ) : (
                                    <>
                                        <span>{t('sign_in')}</span>
                                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                                    </>
                                )}
                            </button>

                            <p className="text-center text-xs text-gray-300 mt-6 pt-4 border-t border-white/10 flex items-center justify-center gap-2">
                                <span className={`w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)] ${serverReady ? 'bg-green-400' : 'bg-amber-400'}`}></span>
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
                    ) : (
                        <div className="space-y-6 animate-fade-in">
                            <div className="text-center bg-blue-500/10 p-4 rounded-2xl border border-blue-400/20 mb-6 relative overflow-hidden">
                                {sandboxActive && (
                                    <div className="absolute top-0 left-0 w-full bg-amber-500/20 py-1 px-3 border-b border-amber-400/30 flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-amber-200 uppercase tracking-tight italic">Sandbox Mode</span>
                                        <span className="text-[10px] font-bold text-amber-100 uppercase tracking-widest">USE: 123456</span>
                                    </div>
                                )}
                                <p className={`text-blue-200 text-sm ${sandboxActive ? 'mt-4' : ''}`}>{t('otp_sent_to', 'Verification code sent to')} <br /> <span className="font-bold text-white text-base">{formData.phone}</span></p>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-center text-xs font-bold text-gray-300 uppercase tracking-widest mb-4">Enter 6-Digit Code</label>
                                <div className="flex justify-center">
                                    <input
                                        type="text"
                                        maxLength="6"
                                        autoFocus
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="w-full max-w-[280px] p-4 bg-white/10 border border-white/20 rounded-2xl text-center text-3xl font-bold tracking-[0.5em] text-white focus:outline-none focus:ring-4 focus:ring-primary/40 focus:bg-white/20 transition-all font-mono"
                                        placeholder="000000"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3 pt-4">
                                <button
                                    onClick={() => {
                                        const attemptWithOTP = async () => {
                                            setLoading(true);
                                            try {
                                                const res = await axios.post(`${API_URL}/auth/login`, { ...formData, otp });
                                                login(res.data, res.data.token);
                                                navigate('/home');
                                            } catch (err) {
                                                setError(err.response?.data?.message || 'Invalid or expired OTP');
                                                setLoading(false);
                                            }
                                        };
                                        attemptWithOTP();
                                    }}
                                    disabled={loading || otp.length < 6}
                                    className="w-full bg-success text-white p-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-success/40 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? t('verifying', 'Verifying...') : t('verify_login', 'Verify & Sign In')}
                                </button>

                                <button
                                    onClick={() => {
                                        setIsOTPStep(false);
                                        setOtp('');
                                        setError('');
                                    }}
                                    className="w-full bg-transparent text-gray-300 font-bold p-3 hover:text-white transition-colors"
                                >
                                    ← {t('back_to_login', 'Back to Login')}
                                </button>
                            </div>

                            <p className="text-center text-xs text-gray-400 mt-4">
                                Didn't receive the code? <button onClick={handleLogin} className="text-primary font-bold hover:underline">Resend SMS</button>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;
