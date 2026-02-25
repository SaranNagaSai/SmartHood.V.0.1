import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User, Mail, Phone, MapPin, Briefcase,
    Calendar, Droplet, Camera, Edit2, Save,
    X, LogOut, Shield, Award, Users, Heart,
    Upload, Globe, RefreshCw, ChevronRight, Settings
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
        const fetchProfile = async () => {
            const token = localStorage.getItem('token');
            if (!token) return navigate('/login');
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
                const local = JSON.parse(localStorage.getItem('user'));
                if (local) { setUser(local); setEditData(local); }
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [navigate]);

    const handleLogout = () => { logout(); navigate('/login'); };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/users/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(editData)
            });
            if (res.ok) {
                const updatedUser = await res.json();
                setUser(updatedUser);
                setIsEditing(false);
                localStorage.setItem('user', JSON.stringify({ ...updatedUser, token }));
            }
        } catch (err) { console.error(err); }
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
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            if (res.ok) {
                const data = await res.json();
                setUser(prev => ({ ...prev, profilePhoto: data.profilePhoto }));
                setShowPhotoModal(false);
                const currentLocal = JSON.parse(localStorage.getItem('user'));
                localStorage.setItem('user', JSON.stringify({ ...currentLocal, profilePhoto: data.profilePhoto, token }));
            }
        } catch (err) { console.error(err); } finally { setPhotoLoading(false); }
    };

    if (loading) return (
        <div className="flex h-screen flex-col items-center justify-center bg-slate-50 gap-4">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Decrypting Identity...</p>
        </div>
    );

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-24 md:pb-8">
            {/* Ultra-Premium Profile Header */}
            <div className="bg-gradient-brand text-white p-8 md:p-14 rounded-b-[4rem] relative overflow-hidden shadow-2xl transition-all duration-700">
                <div className="absolute top-0 left-0 w-full h-full bg-white/[0.03] skew-x-[15deg] transform origin-right pointer-events-none"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>

                <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row items-center md:items-end gap-10">
                    <div className="relative group">
                        <div className="w-32 h-32 md:w-48 md:h-48 rounded-[3rem] border-8 border-white/20 p-2 shadow-2xl bg-white/10 backdrop-blur-3xl overflow-hidden transform transition-all group-hover:scale-105 duration-500">
                            {user.profilePhoto ? (
                                <img src={getProfilePhotoUrl(user.profilePhoto)} alt={user.name} className="w-full h-full object-cover rounded-[2rem]" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-white/10 text-6xl font-black">{user.name?.charAt(0)}</div>
                            )}
                        </div>
                        <button
                            onClick={() => setShowPhotoModal(true)}
                            className="absolute -bottom-2 -right-2 p-4 bg-white text-primary rounded-[1.5rem] shadow-2xl hover:scale-110 active:scale-95 transition-all border-4 border-slate-50 z-20 group-hover:rotate-12"
                        >
                            <Camera size={20} />
                        </button>
                    </div>

                    <div className="flex-1 text-center md:text-left min-w-0">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4">
                            <h1 className="text-4xl md:text-6xl font-black tracking-tighter drop-shadow-xl uppercase">{user.name}</h1>
                            <div className="hidden md:flex px-4 py-1.5 bg-black/20 backdrop-blur-md rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 shadow-inner">
                                {user.professionCategory}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-8 gap-y-3 mt-4 text-white/80 text-sm font-black tracking-wider">
                            <span className="flex items-center gap-2.5 bg-white/10 px-4 py-2 rounded-2xl border border-white/5 shadow-sm"><MapPin size={16} className="text-blue-200" /> {user.locality}, {user.town}</span>
                            <span className="flex items-center gap-2.5 bg-white/10 px-4 py-2 rounded-2xl border border-white/5 shadow-sm"><Phone size={16} className="text-orange-200" /> {user.phone}</span>
                            <span className="flex md:hidden px-4 py-2 bg-white/20 backdrop-blur-md rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10">{user.professionCategory}</span>
                        </div>
                    </div>

                    {!isEditing && (
                        <div className="flex gap-4 w-full md:w-auto mt-6 md:mt-0 md:mb-4">
                            <button onClick={() => setIsEditing(true)} className="flex-1 md:flex-none px-8 py-5 bg-white text-primary rounded-3xl font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-3">
                                <Edit2 size={18} /> Edit Core
                            </button>
                            <button onClick={handleLogout} className="md:px-5 px-8 py-5 bg-rose-500/20 text-rose-100 rounded-3xl font-black text-[11px] uppercase tracking-widest border border-rose-500/30 hover:bg-rose-500 transition-all active:scale-95 flex items-center justify-center gap-3">
                                <LogOut size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 mt-10 md:mt-12 space-y-10 relative z-20">
                {/* Identity Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {[
                        { label: 'Network Honor', value: user.impactScore || 0, icon: Shield, color: 'indigo' },
                        { label: 'Time On-Grid', value: `${user.experience || 0}y`, icon: Award, color: 'amber' },
                        { label: 'Active Links', value: '28+', icon: Users, color: 'emerald' },
                        { label: 'Help Credits', value: '1.2k', icon: Heart, color: 'rose' }
                    ].map((s, i) => (
                        <div key={i} className="bg-white p-6 md:p-8 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col items-center text-center group hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 active:scale-95 cursor-default">
                            <div className={`p-4 bg-${s.color}-50 text-${s.color}-600 rounded-[1.5rem] mb-5 group-hover:rotate-12 transition-transform shadow-inner border border-${s.color}-100/50`}>
                                <s.icon size={28} />
                            </div>
                            <p className="text-3xl font-black text-slate-800 leading-none tracking-tighter">{s.value}</p>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-3">{s.label}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-10">
                        {/* Biometric Registry */}
                        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden group">
                            <div className="bg-slate-50/50 px-10 py-6 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="font-black text-slate-400 uppercase text-[10px] tracking-[0.4em] flex items-center gap-4">
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-lg shadow-indigo-500/50"></div>
                                    Personnel Registry
                                </h3>
                                {isEditing && (
                                    <div className="flex gap-4">
                                        <button onClick={() => setIsEditing(false)} className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition"><X size={18} /></button>
                                        <button onClick={handleSave} className="p-2 bg-emerald-50 text-emerald-500 rounded-xl hover:bg-emerald-100 transition"><Save size={18} /></button>
                                    </div>
                                )}
                            </div>

                            <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-8">
                                    <ProfileVal label="Comm Interface" icon={Mail} val={user.email} col="blue" isEditing={isEditing} field="email" data={editData} setData={setEditData} />
                                    <ProfileVal label="Verified Frequency" icon={Phone} val={user.phone} col="orange" />
                                </div>
                                <div className="space-y-8">
                                    <ProfileVal label="Biological Matrix" icon={Droplet} val={`${user.bloodGroup} Group`} col="rose" />
                                    <ProfileVal label="Life Cycle" icon={Calendar} val={`${user.age} Years`} col="indigo" />
                                </div>
                            </div>
                        </div>

                        {/* Capability Specification */}
                        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden relative">
                            <div className="bg-slate-50/50 px-10 py-6 border-b border-slate-100">
                                <h3 className="font-black text-slate-400 uppercase text-[10px] tracking-[0.4em] flex items-center gap-4">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-lg shadow-blue-500/50"></div>
                                    Capability Specs
                                </h3>
                            </div>
                            <div className="p-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3">Primary Domain</p>
                                        <div className="px-5 py-3 bg-blue-50/50 border border-blue-100 text-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest inline-flex items-center gap-3">
                                            <Shield size={16} /> {user.professionCategory}
                                        </div>
                                    </div>
                                    {user.professionDetails?.jobRole && (
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3">Allocated Role</p>
                                            <p className="text-lg font-black text-slate-800 uppercase tracking-tight">{user.professionDetails.jobRole}</p>
                                        </div>
                                    )}
                                </div>
                                {user.professionDetails?.description && (
                                    <div className="pt-10 border-t border-slate-50">
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-4">Personnel Log / Bio</p>
                                        <div className="bg-slate-50/50 p-6 rounded-3xl border-l-4 border-indigo-400 italic text-slate-600 leading-relaxed text-sm">
                                            "{user.professionDetails.description}"
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-10">
                        {/* Terminal Config Hub */}
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
                            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] mb-10 flex items-center gap-4 opacity-70">
                                <Settings size={18} /> Terminal Hub
                            </h4>
                            <div className="space-y-4">
                                <button onClick={() => navigate('/activity')} className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-between px-6 group/item">
                                    Mission Logs <ChevronRight size={16} className="opacity-30 group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all" />
                                </button>
                                <button className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-between px-6 group/item">
                                    Privacy Shield <ChevronRight size={16} className="opacity-30 group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all" />
                                </button>
                                <button className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-between px-6 group/item">
                                    Network Auth <ChevronRight size={16} className="opacity-30 group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all" />
                                </button>
                            </div>
                            <div className="mt-12 p-6 bg-white/5 rounded-3xl border border-white/10">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[9px] font-black uppercase tracking-widest opacity-50 text-indigo-300">Sync Status</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 animate-pulse">Online</span>
                                </div>
                                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 w-[92%] rounded-full shadow-lg shadow-indigo-500/50"></div>
                                </div>
                            </div>
                        </div>

                        {/* Location Probe */}
                        <div className="bg-white p-10 rounded-[4rem] shadow-sm border border-slate-100 text-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                            <div className="relative z-10 font-black">
                                <Globe size={48} className="mx-auto text-primary mb-6 animate-pulse opacity-20" />
                                <h4 className="text-[10px] uppercase tracking-[0.4em] text-slate-400 mb-2">Registered Sector</h4>
                                <p className="text-xl tracking-tighter uppercase text-slate-800 mb-8">{user.locality}</p>
                                <button onClick={() => navigate('/explore')} className="w-full py-4 bg-slate-50 group-hover:bg-white hover:shadow-xl rounded-2xl text-[10px] uppercase tracking-widest border border-slate-100 transition-all active:scale-95 font-black text-primary">Probe Topology</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Photo Modal - Bottom Sheet Style on Mobile */}
            {showPhotoModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[6000] flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-300" onClick={() => setShowPhotoModal(false)}>
                    <div
                        className="bg-white rounded-t-[4rem] md:rounded-[4rem] w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom duration-500"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-2 flex justify-center pt-4 md:hidden"><div className="w-12 h-1.5 bg-slate-100 rounded-full"></div></div>
                        <div className="bg-white px-10 pt-10 pb-6 text-slate-900 flex justify-between items-center">
                            <h3 className="font-black uppercase tracking-[0.3em] text-[11px] text-slate-400">Identity Update</h3>
                            <button onClick={() => setShowPhotoModal(false)} className="p-3 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 transition"><X size={20} /></button>
                        </div>
                        <div className="px-10 pb-10 pt-4 text-center">
                            <div className="w-32 h-32 bg-indigo-50 rounded-[2.5rem] mx-auto mb-8 flex items-center justify-center border-4 border-dashed border-indigo-200">
                                {photoLoading ? <RefreshCw className="animate-spin text-indigo-400" size={32} /> : <Camera size={40} className="text-indigo-200" />}
                            </div>
                            <h4 className="text-2xl font-black text-slate-800 tracking-tighter uppercase mb-2">Update Visual Token</h4>
                            <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-10 opacity-60">High-fidelity profile images increase trust</p>

                            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" id="photo-up-prof-final" />
                            <label htmlFor="photo-up-prof-final" className="w-full py-5 bg-gradient-brand text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl block cursor-pointer active:scale-95 transition-transform text-center mb-4">Access Neutral Database</label>
                            <button onClick={() => setShowPhotoModal(false)} className="w-full py-5 bg-slate-50 text-slate-400 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all">Cancel Synchronization</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ProfileVal = ({ label, icon: Icon, val, col, isEditing, field, data, setData }) => (
    <div className="flex flex-col text-left group">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 group-hover:text-primary transition-colors">{label}</span>
        <div className="flex items-center gap-4">
            <div className={`p-2.5 bg-${col}-50 text-${col}-600 rounded-xl group-hover:scale-110 transition-transform`}>
                <Icon size={18} />
            </div>
            {isEditing && field ? (
                <input
                    value={data[field] || ''}
                    onChange={e => setData({ ...data, [field]: e.target.value })}
                    className="flex-1 bg-slate-50 p-2 rounded-xl text-sm font-bold border-none outline-none focus:ring-2 focus:ring-primary/20"
                />
            ) : (
                <span className="text-lg font-black text-slate-900 tracking-tight uppercase">{val || 'Not Recorded'}</span>
            )}
        </div>
    </div>
);

export default Profile;
