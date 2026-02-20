import React, { useState, useEffect } from 'react';
import VoiceInput from '../components/common/VoiceInput';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { AlertTriangle, Speaker, Heart, Film, ArrowLeft, Droplet, Paperclip, X, Zap, Send, Users, CheckSquare, Square, Search } from 'lucide-react';
import { API_URL, getProfilePhotoUrl } from '../utils/apiConfig';

const Alerts = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState('');
    const [subType, setSubType] = useState('');
    const [bloodGroup, setBloodGroup] = useState('A+');
    const [description, setDescription] = useState('');
    const [attachments, setAttachments] = useState([]);
    const fileInputRef = React.useRef(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);

    // Blood Donation Logic
    const [donors, setDonors] = useState([]);
    const [selectedDonorIds, setSelectedDonorIds] = useState(new Set());
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [loadingDonors, setLoadingDonors] = useState(false);

    const categories = [
        {
            name: 'Emergency',
            label: t('emergency'),
            icon: AlertTriangle,
            gradient: 'from-red-500 to-pink-600',
            bg: 'bg-red-50',
            border: 'border-red-200',
            text: 'text-red-600',
            emoji: '🚨'
        },
        {
            name: 'Official',
            label: t('official'),
            icon: Speaker,
            gradient: 'from-blue-500 to-cyan-600',
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            text: 'text-blue-600',
            emoji: '📢'
        },
        {
            name: 'Welfare',
            label: t('welfare'),
            icon: Heart,
            gradient: 'from-green-500 to-emerald-600',
            bg: 'bg-green-50',
            border: 'border-green-200',
            text: 'text-green-600',
            emoji: '💚'
        },
        {
            name: 'Entertainment',
            label: t('entertainment'),
            icon: Film,
            gradient: 'from-purple-500 to-pink-600',
            bg: 'bg-purple-50',
            border: 'border-purple-200',
            text: 'text-purple-600',
            emoji: '🎬'
        }
    ];

    const emergencySubTypes = ['Blood Donation', 'Accident', 'Cash Donation', 'Climate', 'Theft', 'General'];

    // Fetch Donors when Blood Donation is selected
    useEffect(() => {
        if (selectedCategory === 'Emergency' && subType === 'Blood Donation' && bloodGroup) {
            fetchDonors();
        } else {
            setIsPanelOpen(false);
        }
    }, [selectedCategory, subType, bloodGroup]);

    const fetchDonors = async () => {
        setLoadingDonors(true);
        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user'));
            const res = await axios.get(`${API_URL}/users/search`, {
                params: {
                    town: user.town,
                    bloodGroup: bloodGroup
                },
                headers: { Authorization: `Bearer ${token}` }
            });
            setDonors(res.data);
            // Auto Select All by default
            const allIds = new Set(res.data.map(d => d._id));
            setSelectedDonorIds(allIds);
            setIsPanelOpen(true);
        } catch (error) {
            console.error('Error fetching donors:', error);
        } finally {
            setLoadingDonors(false);
        }
    };

    const toggleDonor = (id) => {
        const newSet = new Set(selectedDonorIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedDonorIds(newSet);
    };

    const toggleAllDonors = () => {
        if (selectedDonorIds.size === donors.length) {
            setSelectedDonorIds(new Set());
        } else {
            setSelectedDonorIds(new Set(donors.map(d => d._id)));
        }
    };

    const handleConfirmSubmit = () => {
        if (!description) {
            alert('Please provide a description');
            return;
        }
        if (selectedCategory === 'Emergency' && !subType) {
            alert('Please select an emergency type');
            return;
        }
        setShowConfirm(true);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user'));

            const formData = new FormData();
            formData.append('category', selectedCategory);
            formData.append('subType', selectedCategory === 'Emergency' ? subType : selectedCategory);
            if (subType === 'Blood Donation') {
                formData.append('bloodGroup', bloodGroup);
                if (selectedDonorIds.size > 0) {
                    Array.from(selectedDonorIds).forEach(id => {
                        formData.append('targetUserIds', id);
                    });
                }
            }
            formData.append('description', description);
            formData.append('locality', user.locality);
            formData.append('town', user.town);
            formData.append('district', user.district);
            formData.append('state', user.state);

            attachments.forEach(file => {
                formData.append('attachments', file);
            });

            const response = await axios.post(`${API_URL}/alerts`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            const { recipientCount = 0, emailCount = 0, browserCount = 0 } = response.data;
            alert(`${t('alert_success')}\n\nBroadcast to ${recipientCount} users\n${emailCount} emails sent, ${browserCount} browser notifications`);
            navigate('/home');
        } catch (error) {
            console.error('Alert broadcast error:', error);
            const errorMsg = error.response?.data?.message || error.message || t('alert_failed');
            alert(`${t('alert_failed')}: ${errorMsg}`);
        } finally {
            setLoading(false);
            setShowConfirm(false);
        }
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        setAttachments([...attachments, ...files].slice(0, 5));
    };

    const selectedCat = categories.find(c => c.name === selectedCategory);

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 pb-24">
            {/* Dynamic Header */}
            <div className={`p-6 shadow-lg flex items-center gap-3 sticky top-0 z-10 transition-all duration-500 ${selectedCategory ? `bg-gradient-to-r ${selectedCat?.gradient} text-white` : 'bg-white text-gray-800'}`}>
                <button onClick={() => navigate('/home')} className="p-2 rounded-full hover:bg-white/20 transition-all">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        {selectedCat?.emoji} {t('broadcast_alert')}
                    </h1>
                    {selectedCategory && (
                        <p className="text-xs opacity-90 mt-1">Broadcasting {selectedCategory} Alert</p>
                    )}
                </div>
                {selectedCategory && <Zap size={24} className="animate-pulse" />}
            </div>

            <div className="p-6 max-w-3xl mx-auto space-y-8">
                {/* Hero Section */}
                {!selectedCategory && (
                    <div className="text-center py-8 animate-fade-in">
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl shadow-xl animate-bounce">
                            📣
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Choose Alert Category</h2>
                        <p className="text-gray-600">Select a category to broadcast to your community</p>
                    </div>
                )}

                {/* Category Grid - Enhanced */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 px-2 sm:px-0">
                    {categories.map(cat => (
                        <button
                            key={cat.name}
                            onClick={() => { setSelectedCategory(cat.name); setSubType(''); }}
                            className={`group relative overflow-hidden p-6 sm:p-8 rounded-2xl sm:rounded-3xl flex flex-row sm:flex-col items-center sm:justify-center gap-4 border-2 transition-all duration-500 transform hover:scale-105 active:scale-95 ${selectedCategory === cat.name
                                ? `bg-gradient-to-br ${cat.gradient} text-white shadow-2xl border-transparent`
                                : 'bg-white border-gray-200 text-gray-600 hover:shadow-xl hover:border-gray-300'
                                }`}
                        >
                            {/* Background Glow */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>

                            {/* Icon with Animation */}
                            <div className={`relative z-10 p-3 sm:p-4 rounded-xl sm:rounded-2xl ${selectedCategory === cat.name ? 'bg-white/20' : cat.bg} transition-all duration-300 group-hover:rotate-6`}>
                                <cat.icon size={30} className={selectedCategory === cat.name ? 'text-white' : cat.text} />
                            </div>

                            {/* Emoji Badge - Hidden on small mobile row layout to save space */}
                            <div className="absolute top-3 right-3 text-2xl opacity-50 group-hover:opacity-100 transition-opacity hidden sm:block">
                                {cat.emoji}
                            </div>

                            <span className="relative z-10 font-bold text-base sm:text-lg">{cat.label}</span>
                        </button>
                    ))}
                </div>

                {/* Emergency Sub-Type Selection - Enhanced */}
                {selectedCategory === 'Emergency' && (
                    <div className="animate-fade-in bg-gradient-to-br from-red-50 to-pink-50 p-8 rounded-3xl shadow-xl border-2 border-red-200">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
                                🚨
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-red-600 uppercase tracking-wider">{t('emergency_type')}</label>
                                <p className="text-xs text-red-400">Select the type of emergency</p>
                            </div>
                        </div>
                        <select
                            value={subType}
                            onChange={(e) => setSubType(e.target.value)}
                            className="w-full p-5 border-2 border-red-300 rounded-2xl bg-white text-red-900 font-semibold outline-none focus:ring-4 focus:ring-red-200 transition-all shadow-lg"
                        >
                            <option value="">{t('start_here')}</option>
                            {emergencySubTypes.map(type => (
                                <option key={type} value={type}>🔴 {type}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Blood Donation UI - Enhanced */}
                {subType === 'Blood Donation' && (
                    <div className="animate-fade-in bg-gradient-to-br from-red-50 via-pink-50 to-red-50 p-8 rounded-3xl shadow-2xl border-2 border-red-300">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-pink-600 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl shadow-xl animate-pulse">
                                <Droplet className="text-white" size={32} fill="currentColor" />
                            </div>
                            <label className="block text-lg font-bold text-red-600 uppercase tracking-widest">{t('select_blood_group')}</label>
                            <p className="text-sm text-red-400 mt-1">Choose the required blood type</p>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                                <button
                                    key={bg}
                                    onClick={() => setBloodGroup(bg)}
                                    className={`py-5 rounded-2xl font-bold text-xl transition-all duration-300 transform hover:scale-110 ${bloodGroup === bg
                                        ? 'bg-gradient-to-br from-red-600 to-pink-600 text-white shadow-2xl scale-110'
                                        : 'bg-white text-gray-600 hover:bg-red-50 shadow-lg border-2 border-red-100'
                                        }`}
                                >
                                    <Droplet size={16} className="inline mb-1" />
                                    {bg}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Description - Enhanced */}
                {selectedCategory && (
                    <div className={`bg-gradient-to-br ${selectedCat?.bg} to-white p-8 rounded-3xl shadow-xl border-2 ${selectedCat?.border} animate-fade-in`}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-10 h-10 bg-gradient-to-br ${selectedCat?.gradient} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                                ✍️
                            </div>
                            <label className={`text-sm font-bold ${selectedCat?.text} uppercase tracking-wider`}>
                                {t('alert_description')}
                            </label>
                        </div>
                        <VoiceInput
                            type="textarea"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t('describe_situation')}
                            className="w-full min-h-[150px] p-5 border-2 border-gray-200 rounded-2xl bg-white focus:ring-4 focus:ring-purple-200 outline-none resize-none text-gray-800 shadow-inner"
                        />
                    </div>
                )}

                {/* Attachments - Enhanced */}
                {selectedCategory && (
                    <div className="bg-white p-8 rounded-3xl shadow-xl border-2 border-gray-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                                <Paperclip size={20} />
                            </div>
                            <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                                {t('attachments')} (Optional)
                            </label>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            multiple
                            accept="image/*,video/*"
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full p-6 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 hover:border-purple-400 hover:bg-purple-50 hover:text-purple-600 transition-all flex items-center justify-center gap-3 group"
                        >
                            <Paperclip size={24} className="group-hover:rotate-12 transition-transform" />
                            <span className="font-medium">Click to attach files (max 5)</span>
                        </button>
                        {attachments.length > 0 && (
                            <div className="mt-4 space-y-2">
                                {attachments.map((file, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                                        <span className="text-sm text-gray-700 font-medium truncate flex-1">📎 {file.name}</span>
                                        <button
                                            onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                                            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                        >
                                            <X size={16} className="text-red-500" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Submit Button - Enhanced */}
                {selectedCategory && (
                    <button
                        onClick={handleConfirmSubmit}
                        className={`w-full p-6 rounded-3xl font-bold text-lg text-white shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3 bg-gradient-to-r ${selectedCat?.gradient} hover:shadow-3xl`}
                    >
                        <Send size={24} />
                        {t('broadcast_now')}
                        <Zap size={20} className="animate-pulse" />
                    </button>
                )}
            </div>

            {/* Confirmation Modal - Enhanced */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                        <div className={`bg-gradient-to-r ${selectedCat?.gradient} p-8 text-white`}>
                            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl mx-auto mb-4 flex items-center justify-center text-4xl">
                                {selectedCat?.emoji}
                            </div>
                            <h3 className="text-2xl font-bold text-center">Confirm Broadcast</h3>
                            <p className="text-center text-white/80 text-sm mt-2">Review your alert before sending</p>
                        </div>
                        <div className="p-8 space-y-4">
                            <div className="bg-gray-50 p-4 rounded-2xl">
                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Category</p>
                                <p className="font-bold text-gray-800">{selectedCategory}</p>
                            </div>
                            {selectedCategory === 'Emergency' && (
                                <div className="bg-gray-50 p-4 rounded-2xl">
                                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Type</p>
                                    <p className="font-bold text-gray-800">{subType}</p>
                                </div>
                            )}
                            {subType === 'Blood Donation' && (
                                <div className="bg-red-50 p-4 rounded-2xl border-2 border-red-200">
                                    <p className="text-xs text-red-500 uppercase font-bold mb-1">Blood Group</p>
                                    <p className="font-bold text-red-600 flex items-center gap-2">
                                        <Droplet size={16} fill="currentColor" />
                                        {bloodGroup}
                                    </p>
                                </div>
                            )}
                            <div className="bg-gray-50 p-4 rounded-2xl max-h-32 overflow-y-auto">
                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Description</p>
                                <p className="text-gray-700">{description}</p>
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 flex gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                disabled={loading}
                                className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-2xl text-gray-700 font-bold hover:bg-gray-100 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className={`flex-1 px-6 py-4 bg-gradient-to-r ${selectedCat?.gradient} text-white rounded-2xl font-bold hover:shadow-xl transition-all flex items-center justify-center gap-2`}
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Broadcasting...
                                    </>
                                ) : (
                                    <>
                                        <Send size={20} />
                                        Confirm & Send
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Blood Donor Side Panel (Slide-over) */}
            <div className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-red-600 to-pink-600 p-6 text-white flex items-center justify-between shadow-lg">
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Users size={24} />
                                Donors ({donors.length})
                            </h2>
                            <p className="text-xs text-red-100 opacity-90 mt-1">Select recipients for this alert</p>
                        </div>
                        <button onClick={() => setIsPanelOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Toolbar */}
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                        <button
                            onClick={toggleAllDonors}
                            className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-primary transition"
                        >
                            {selectedDonorIds.size === donors.length ? <CheckSquare className="text-primary" /> : <Square />}
                            {selectedDonorIds.size === donors.length ? 'Deselect All' : 'Select All'}
                        </button>
                        <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">
                            Selected: {selectedDonorIds.size}
                        </span>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {loadingDonors ? (
                            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                                <div className="w-8 h-8 border-4 border-gray-200 border-t-primary rounded-full animate-spin mb-2"></div>
                                <span className="text-sm">Searching Donors...</span>
                            </div>
                        ) : donors.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                <Search size={48} className="mx-auto mb-3 opacity-20" />
                                <p>No {bloodGroup} donors found in your town.</p>
                            </div>
                        ) : (
                            donors.map(donor => (
                                <div
                                    key={donor._id}
                                    onClick={() => toggleDonor(donor._id)}
                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${selectedDonorIds.has(donor._id)
                                        ? 'bg-red-50 border-red-200 shadow-sm'
                                        : 'bg-white border-gray-100 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="relative">
                                        {selectedDonorIds.has(donor._id) ? (
                                            <CheckSquare className="text-red-500" size={20} />
                                        ) : (
                                            <Square className="text-gray-300" size={20} />
                                        )}
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                        {donor.profilePhoto ? (
                                            <img
                                                src={getProfilePhotoUrl(donor.profilePhoto)}
                                                alt={donor.name}
                                                crossOrigin="anonymous"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                                                {donor.name?.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-800 truncate">{donor.name}</p>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <span className="bg-gray-100 px-1.5 py-0.5 rounded">{donor.locality}</span>
                                            {donor.phone && <span>• {donor.phone}</span>}
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-xs shadow-sm">
                                        {donor.bloodGroup || bloodGroup}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer Warning */}
                    <div className="p-4 bg-yellow-50 text-yellow-800 text-xs text-center border-t border-yellow-100">
                        Only selected users will receive this emergency alert.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Alerts;
