import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User, Mail, Phone, MapPin, Briefcase,
    Calendar, Droplet, Camera, Edit2, Save,
    X, LogOut, Shield, Award, Users, Heart,
    Upload, Globe
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useDevice } from '../context/DeviceContext';
import { API_URL, SERVER_URL, getProfilePhotoUrl } from '../utils/apiConfig';

const Profile = () => {
    const { t } = useLanguage();
    const { logout } = useAuth();
    const { isMobile } = useDevice();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});
    const [loading, setLoading] = useState(true);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [photoLoading, setPhotoLoading] = useState(false);

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user'));
        const token = localStorage.getItem('token');

        if (!userData || !token) {
            navigate('/login');
            return;
        }

        const fetchProfile = async () => {
            try {
                const res = await fetch(`${API_URL}/users/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                setUser(data);
                setEditData(data);
            } catch (err) {
                console.error('Failed to fetch profile', err);
                setUser(userData);
                setEditData(userData);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(editData)
            });

            if (res.ok) {
                const updatedUser = await res.json();
                setUser(updatedUser);
                setIsEditing(false);
                localStorage.setItem('user', JSON.stringify({ ...updatedUser, token }));
            }
        } catch (err) {
            console.error('Failed to update profile', err);
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setPhotoLoading(true);
        const formData = new FormData();
        formData.append('profilePhoto', file);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/users/profile-photo`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setUser(prev => ({ ...prev, profilePhoto: data.profilePhoto }));
                setShowPhotoModal(false);
                const currentLocal = JSON.parse(localStorage.getItem('user'));
                localStorage.setItem('user', JSON.stringify({ ...currentLocal, profilePhoto: data.profilePhoto }));
            }
        } catch (err) {
            console.error('Photo upload failed', err);
        } finally {
            setPhotoLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className={`min-h-screen bg-gray-50 ${isMobile ? 'pb-24 pt-4' : 'pb-8'}`}>
            {/* Header Banner */}
            <div className={`bg-gradient-brand text-white ${isMobile ? 'p-6 pb-12 rounded-b-[2rem]' : 'p-10 rounded-b-[3rem]'} relative overflow-hidden shadow-xl`}>
                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                    <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-[-20%] right-[-10%] w-64 h-64 bg-white rounded-full blur-3xl"></div>
                </div>

                <div className={`relative z-10 flex ${isMobile ? 'flex-col items-center text-center' : 'items-end gap-6'} max-w-5xl mx-auto`}>
                    <div className="relative group">
                        <div className={`rounded-3xl border-4 border-white/30 p-1 shadow-2xl bg-white/20 backdrop-blur-md overflow-hidden ${isMobile ? 'w-32 h-32' : 'w-40 h-40'}`}>
                            {user.profilePhoto ? (
                                <img
                                    src={getProfilePhotoUrl(user.profilePhoto)}
                                    alt={user.name}
                                    className="w-full h-full object-cover rounded-2xl"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-white/10">
                                    <User size={64} className="text-white/40" />
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => setShowPhotoModal(true)}
                            className="absolute bottom-2 right-2 p-3 bg-primary text-white rounded-2xl shadow-lg hover:scale-110 active:scale-95 transition-all border-2 border-white"
                        >
                            <Camera size={20} />
                        </button>
                    </div>

                    <div className={isMobile ? 'mt-4' : 'flex-1 mb-2'}>
                        <div className="flex items-center gap-2 mb-1 justify-center md:justify-start">
                            <h1 className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-bold tracking-tight`}>{user.name}</h1>
                            <div className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm border border-white/20">
                                {user.professionCategory}
                            </div>
                        </div>
                        <p className="text-white/80 flex items-center gap-2 justify-center md:justify-start opacity-90">
                            <MapPin size={16} /> {user.locality}, {user.town}
                        </p>
                    </div>

                    {!isEditing && (
                        <div className={`flex gap-3 ${isMobile ? 'mt-6 w-full flex-col' : 'items-center'}`}>
                            <button
                                onClick={() => setIsEditing(true)}
                                className={`bg-white text-primary px-6 py-2.5 rounded-2xl font-bold hover:bg-white/90 transition shadow-lg flex items-center justify-center gap-2`}
                            >
                                <Edit2 size={18} /> {t('edit_profile')}
                            </button>
                            <button
                                onClick={handleLogout}
                                className={`bg-red-500/20 text-white border border-white/30 px-6 py-2.5 rounded-2xl font-bold hover:bg-red-500/40 transition backdrop-blur-sm flex items-center justify-center gap-2`}
                            >
                                <LogOut size={18} /> {t('logout')}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className={`max-w-5xl mx-auto ${isMobile ? 'px-4 -mt-8' : 'px-10 mt-8'} relative z-20 space-y-6 pb-20`}>
                {/* Stats Cards */}
                <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-4`}>
                    {[
                        { label: 'Impact Score', value: user.impactScore || 0, icon: Shield, col: 'blue' },
                        { label: 'Experiences', value: user.experience || 0, icon: Award, col: 'amber' },
                        { label: 'Network', value: '12+', icon: Users, col: 'emerald' },
                        { label: 'Help Points', value: '540', icon: Heart, col: 'rose' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                            <div className={`p-2 bg-${stat.col}-50 text-${stat.col}-600 rounded-xl mb-2`}>
                                <stat.icon size={20} />
                            </div>
                            <span className="text-xl font-bold text-gray-800">{stat.value}</span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{stat.label}</span>
                        </div>
                    ))}
                </div>

                <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-3'} gap-6`}>
                    <div className="md:col-span-2 space-y-6">
                        {/* Info Section */}
                        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden text-gray-700">
                            <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2 uppercase text-xs tracking-widest">
                                    <User size={16} className="text-primary" /> {t('personal_info')}
                                </h3>
                                {isEditing && (
                                    <div className="flex gap-2">
                                        <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600 p-1"><X size={18} /></button>
                                        <button onClick={handleSave} className="text-primary hover:text-primary/80 p-1"><Save size={18} /></button>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                            <Mail size={18} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t('email_label')}</p>
                                            {isEditing ? (
                                                <input value={editData.email} onChange={e => setEditData({ ...editData, email: e.target.value })} className="w-full bg-gray-50 p-2 rounded-lg text-sm border-none outline-none focus:ring-1 focus:ring-primary" />
                                            ) : (
                                                <p className="text-sm font-semibold">{user.email || 'Not shared'}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                                            <Phone size={18} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t('phone_label')}</p>
                                            <p className="text-sm font-semibold">{user.phone}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                                            <Droplet size={18} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t('blood_group')}</p>
                                            <p className="text-sm font-semibold">{user.bloodGroup}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                            <Calendar size={18} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t('age_label')}</p>
                                            <p className="text-sm font-semibold">{user.age} {t('years_old')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Profession Section */}
                        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden text-gray-700">
                            <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2 uppercase text-xs tracking-widest">
                                    <Briefcase size={16} className="text-primary" /> {t('profession')}
                                </h3>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-gray-700">
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">{t('category')}</p>
                                        <p className="text-sm font-bold text-primary bg-primary/5 px-3 py-1.5 rounded-lg inline-block">
                                            {user.professionCategory}
                                        </p>
                                    </div>
                                    {user.professionDetails?.jobRole && (
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">{t('job_role')}</p>
                                            <p className="text-sm font-semibold text-gray-700">{user.professionDetails.jobRole}</p>
                                        </div>
                                    )}
                                </div>
                                {user.professionDetails?.description && (
                                    <div className="mt-6 pt-6 border-t border-dashed">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">{t('bio')}</p>
                                        <p className="text-sm text-gray-600 leading-relaxed italic">"{user.professionDetails.description}"</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Honor Section */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-primary to-indigo-700 p-6 rounded-[2rem] shadow-xl text-white">
                            <h4 className="font-bold mb-4 uppercase text-[10px] tracking-widest flex items-center gap-2">
                                <Shield size={16} /> Honor Points
                            </h4>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="text-3xl font-bold">{user.impactScore}</div>
                                <div className="h-1.5 flex-1 bg-white/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-white rounded-full" style={{ width: `${Math.min(user.impactScore || 0, 100)}%` }}></div>
                                </div>
                            </div>
                            <p className="text-[10px] text-white/70 italic leading-relaxed">Earn points by helping neighbors and participating in events.</p>
                        </div>

                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 text-center">
                            <Globe size={32} className="mx-auto text-primary mb-3 opacity-20" />
                            <h4 className="font-bold text-gray-800 text-sm mb-1">My Location</h4>
                            <p className="text-xs text-gray-500 mb-4">{user.locality}, {user.town}</p>
                            <button
                                onClick={() => navigate('/explore')}
                                className="w-full py-2.5 bg-gray-50 text-primary rounded-xl text-xs font-bold hover:bg-primary hover:text-white transition"
                            >
                                {t('explore_locality_neighbors')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Photo Modal */}
            {showPhotoModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[6000] flex items-center justify-center p-4">
                    <div className={`bg-white rounded-[2rem] w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${isMobile ? 'fixed bottom-4' : ''}`}>
                        <div className="bg-gradient-brand p-6 text-white flex justify-between items-center">
                            <h3 className="font-bold">Update Photo</h3>
                            <button onClick={() => setShowPhotoModal(false)} className="p-1 hover:bg-white/20 rounded-lg"><X size={20} /></button>
                        </div>
                        <div className="p-8 space-y-4">
                            <div className="border-2 border-dashed border-gray-100 rounded-[2rem] p-10 flex flex-col items-center gap-4">
                                {photoLoading ? (
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                                ) : (
                                    <>
                                        <Upload size={40} className="text-primary/20" />
                                        <p className="text-xs text-center text-gray-400 font-medium">Clear photos build trust in the community</p>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handlePhotoUpload}
                                            className="hidden"
                                            id="photo-up-prof"
                                        />
                                        <label
                                            htmlFor="photo-up-prof"
                                            className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm cursor-pointer shadow-lg active:scale-95 transition"
                                        >
                                            Select Library
                                        </label>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
