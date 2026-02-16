import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import VoiceInput from '../components/common/VoiceInput';
import { Shield, Lock, Mail, ArrowRight } from 'lucide-react';
import axios from 'axios';

const Admin = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.username.trim() || !formData.email.trim()) {
            setError('Please fill all fields');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await axios.post('http://localhost:5000/api/admin/login', formData);

            if (res.data.success) {
                localStorage.setItem('adminToken', res.data.token);
                localStorage.setItem('admin', JSON.stringify(res.data.admin));
                navigate('/admin/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Admin login failed');
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Logo Header */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
                        <Shield size={40} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">Admin Portal</h1>
                    <p className="text-purple-200 mt-2">SmartHood Administration</p>
                </div>

                {/* Login Card */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-2">
                                Username
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    placeholder="Enter admin username"
                                    className="w-full p-4 pl-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-purple-500 outline-none transition"
                                />
                                <Lock className="absolute left-4 top-4 text-purple-300" size={20} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="admin@smarthood.com"
                                    className="w-full p-4 pl-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-purple-500 outline-none transition"
                                />
                                <Mail className="absolute left-4 top-4 text-purple-300" size={20} />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/20 border border-red-500/50 p-3 rounded-xl text-red-200 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-4 rounded-xl font-bold shadow-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? 'Authenticating...' : (
                                <>
                                    Access Dashboard
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-white/10 text-center">
                        <p className="text-purple-200 text-sm">
                            Only authorized administrators can access this portal.
                        </p>
                        <button
                            onClick={() => navigate('/home')}
                            className="text-white font-medium mt-2 hover:underline"
                        >
                            ← Back to Home
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Admin;
