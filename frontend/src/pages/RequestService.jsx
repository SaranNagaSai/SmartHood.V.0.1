import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import VoiceInput from '../components/common/VoiceInput';
import axios from 'axios';
import { ArrowLeft, Send, Shield, Users, UserCheck, Paperclip, X, AlertCircle } from 'lucide-react';
import { API_URL } from '../utils/apiConfig';

const RequestService = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({
        title: '', description: '', targetAudience: 'ALL', targetProfessions: [], targetLocality: '',
        targetLocalities: [], // Init as empty array
        selectedCommunities: [] // NEW: For multi-community broadcasting
    });
    const [attachments, setAttachments] = useState([]);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [titleError, setTitleError] = useState('');
    const [localities, setLocalities] = useState([]);
    const [jobTitles, setJobTitles] = useState([]);
    const [communities, setCommunities] = useState([]); // NEW: Available communities in town
    const [professionError, setProfessionError] = useState(''); // NEW: Validation error

    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    // Fetch initial data & handle locality changes
    React.useEffect(() => {
        const fetchInitialData = async () => {
            // User loaded from local storage
            const userTown = user?.town?.trim();

            if (userTown) {
                // 1. Fetch Localities (independent)
                try {
                    const locRes = await axios.get(`${API_URL}/localities?town=${encodeURIComponent(userTown)}`);
                    setLocalities(locRes.data);

                    if (formData.targetLocalities.length === 0) {
                        setFormData(prev => ({ ...prev, targetLocalities: [user.locality] }));
                    }
                } catch (err) {
                    console.error("Failed to fetch localities", err);
                }

                // 2. Fetch communities (independent)
                try {
                    console.log(`Fetching available communities for town: ${userTown}`);
                    const commRes = await axios.get(`${API_URL}/communities/by-town?town=${encodeURIComponent(userTown)}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    console.log("Communities response:", commRes.data);
                    setCommunities(commRes.data);
                } catch (err) {
                    console.error("Failed to fetch communities", err);
                }

                // 3. Fetch professions by locality (shows only professions in user's community)
                try {
                    const userLocality = user?.locality?.trim();
                    console.log(`Fetching professions for locality: ${userLocality}`);
                    const profRes = await axios.get(`${API_URL}/professions/by-community?community=${encodeURIComponent(userLocality)}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    console.log("Professions response:", profRes.data);
                    setJobTitles(profRes.data);
                } catch (err) {
                    console.error("Failed to fetch professions by locality", err);
                }
            } else {
                console.warn("No user town found in localStorage user object");
            }
        };
        fetchInitialData();
    }, []); // Run once on mount

    // REMOVED: Old profession fetching logic based on localities
    // Professions are now fetched only from user's community on mount

    const handleTitleChange = (value) => {
        if (value.length > 100) {
            return;
        }
        setTitleError('');
        setFormData({ ...formData, title: value });
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        const newAttachments = files.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            name: file.name
        }));
        setAttachments([...attachments, ...newAttachments].slice(0, 5));
    };

    const removeAttachment = (index) => {
        const updated = [...attachments];
        URL.revokeObjectURL(updated[index].preview);
        updated.splice(index, 1);
        setAttachments(updated);
    };

    const handleConfirmSubmit = () => {
        if (!formData.title || !formData.description) {
            alert(t('fill_all_fields'));
            return;
        }
        // Validate profession selection when "To Specific" is selected
        if (formData.targetAudience === 'SPECIFIC' && formData.targetProfessions.length === 0) {
            setProfessionError('Please select at least one profession');
            alert('Please select at least one profession when targeting specific professionals');
            return;
        }
        setProfessionError('');
        setShowConfirm(true);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user'));

            const formDataPayload = new FormData();
            formDataPayload.append('type', 'request');
            formDataPayload.append('title', formData.title);
            formDataPayload.append('description', formData.description);
            formDataPayload.append('targetAudience', formData.targetAudience);

            // Append targetProfessions array
            if (formData.targetProfessions && formData.targetProfessions.length > 0) {
                formData.targetProfessions.forEach(prof => {
                    formDataPayload.append('targetProfession', prof);
                });
            }

            // Append targetLocalities array
            if (formData.targetLocalities) {
                formData.targetLocalities.forEach(loc => {
                    formDataPayload.append('targetLocalities', loc);
                });
            }

            // NEW: Append selectedCommunities array
            if (formData.selectedCommunities && formData.selectedCommunities.length > 0) {
                formData.selectedCommunities.forEach(comm => {
                    formDataPayload.append('selectedCommunities', comm);
                });
            }

            formDataPayload.append('locality', user.locality);
            formDataPayload.append('town', user.town);
            formDataPayload.append('district', user.district);
            formDataPayload.append('state', user.state);

            // Append files
            attachments.forEach((att) => {
                formDataPayload.append('attachments', att.file);
            });

            const response = await axios.post(`${API_URL}/services`, formDataPayload, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // NEW: Show recipient count in success message
            const recipientCount = response.data.recipientCount || 0;
            alert(`${t('request_service_success')} - Broadcast to ${recipientCount} users`);
            navigate('/home');
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || t('failed_send_request'));
        }
        setLoading(false);
        setShowConfirm(false);
    };

    // user and token are declared at the top of the component

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-red-50 pb-24">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-4 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition">
                    <ArrowLeft size={20} className="text-gray-700" />
                </button>
                <div>
                    <h1 className="font-bold text-lg text-green-700">{t('request_help')}</h1>
                    <p className="text-xs text-gray-400">{t('community_support')}</p>
                </div>
            </div>

            <div className="p-4 space-y-6 max-w-2xl mx-auto mt-2">
                {/* Privacy Badge */}
                <div className="flex items-start gap-3 bg-green-50 p-4 rounded-xl border border-green-200 shadow-sm">
                    <Shield className="text-green-600 flex-shrink-0" size={20} />
                    <div>
                        <span className="block font-bold text-green-800 text-sm">{t('privacy_protected')}</span>
                        <p className="text-xs text-green-700 mt-1">{t('privacy_msg')}</p>
                    </div>
                </div>

                {/* Title */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <VoiceInput
                        label={`${t('service_title')} * (${formData.title.length}/100)`}
                        value={formData.title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="e.g., Car Jumpstart, Medical Help..."
                        required
                    />
                    {titleError && (
                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <AlertCircle size={12} /> {titleError}
                        </p>
                    )}
                </div>

                {/* Description */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <VoiceInput
                        type="textarea"
                        label={`${t('description_label')} *`}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder={t('describe_service_placeholder')}
                        required
                    />

                    {/* Attachments Preview */}
                    {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-dashed">
                            {attachments.map((att, idx) => (
                                <div key={idx} className="relative group">
                                    <img
                                        src={att.preview}
                                        alt={att.name}
                                        className="w-16 h-16 object-cover rounded-lg border"
                                    />
                                    <button
                                        onClick={() => removeAttachment(idx)}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-end mt-2 pt-2 border-t border-dashed">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-green-600 transition"
                        >
                            <Paperclip size={14} /> {t('attach_media')} ({attachments.length}/5)
                        </button>
                    </div>
                </div>

                {/* Targeting */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-800 mb-4">{t('visibility')}</h3>

                    {/* Locality Target Multi-Select */}
                    {/* 1. My Locality (Always Active) */}
                    <div className="mb-4 animate-fade-in p-4 bg-orange-50 rounded-xl border border-orange-100">
                        <label className="block text-xs font-bold text-orange-700 mb-2 uppercase flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                            {t('my_community_default')}
                        </label>
                        <div className="px-3 py-2 bg-orange-100 border border-orange-300 text-orange-800 rounded-lg text-sm font-bold shadow-sm inline-block">
                            {JSON.parse(localStorage.getItem('user'))?.locality}
                        </div>
                        <p className="text-[10px] text-orange-600 mt-1">
                            {t('broadcast_home_note')}
                        </p>
                    </div>

                    {/* 2. Other Communities (Multi-Select) */}
                    <div className="mb-4 animate-fade-in p-5 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-200">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-xs font-bold text-orange-700 uppercase flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                {t('other_communities_in')} {user?.town || 'Your Town'}
                            </label>
                            <div className="text-xs font-bold text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
                                {formData.targetLocalities?.filter(l => l !== user?.locality).length || 0} of {localities.filter(l => l.name?.toLowerCase() !== user?.locality?.toLowerCase()).length} {t('selected_count')}
                            </div>
                        </div>

                        {localities.length === 0 ? (
                            <div className="text-sm text-gray-400 italic py-4 text-center">
                                🔍 {t('finding_communities')}
                            </div>
                        ) : (
                            <>
                                {/* Select All / Deselect All Buttons */}
                                <div className="flex gap-2 mb-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const allLocalities = localities.map(l => l.name);
                                            setFormData({ ...formData, targetLocalities: allLocalities });
                                        }}
                                        className="flex-1 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-lg hover:shadow-lg transition-all"
                                    >
                                        ✓ {t('select_all')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData({ ...formData, targetLocalities: [user?.locality] });
                                        }}
                                        className="flex-1 px-3 py-2 bg-gradient-to-r from-gray-400 to-gray-500 text-white text-xs font-bold rounded-lg hover:shadow-lg transition-all"
                                    >
                                        ✗ {t('deselect_all')}
                                    </button>
                                </div>

                                {/* Community Cards with Checkboxes */}
                                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                    {localities
                                        .filter(l => l.name?.toLowerCase() !== user?.locality?.toLowerCase())
                                        .map(loc => {
                                            const isSelected = formData.targetLocalities?.includes(loc.name);
                                            return (
                                                <div
                                                    key={loc.name}
                                                    onClick={() => {
                                                        const currentTargets = formData.targetLocalities || [];
                                                        if (currentTargets.includes(loc.name)) {
                                                            setFormData({ ...formData, targetLocalities: currentTargets.filter(l => l !== loc.name) });
                                                        } else {
                                                            setFormData({ ...formData, targetLocalities: [...currentTargets, loc.name] });
                                                        }
                                                    }}
                                                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${isSelected
                                                        ? 'bg-gradient-to-br from-orange-100 to-red-100 border-orange-400 shadow-md'
                                                        : 'bg-white border-gray-200 hover:border-orange-300 hover:shadow-sm'
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-2">
                                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${isSelected ? 'bg-orange-500 border-orange-500' : 'border-gray-300 bg-white'
                                                            }`}>
                                                            {isSelected && (
                                                                <svg className="w-3 h-3 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path d="M5 13l4 4L19 7"></path>
                                                                </svg>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-xs font-bold truncate ${isSelected ? 'text-orange-700' : 'text-gray-700'}`}>
                                                                {loc.name}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </>
                        )}
                        <p className="text-[10px] text-orange-600 mt-3 flex items-center gap-1">
                            <span>💡</span> {t('select_communities_hint')}
                        </p>
                    </div>

                    <div className="flex bg-gray-100 p-1.5 rounded-xl mb-4">
                        <button
                            onClick={() => setFormData({ ...formData, targetAudience: 'ALL' })}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${formData.targetAudience === 'ALL' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}
                        >
                            <Users size={16} /> {t('everyone')}
                        </button>
                        <button
                            onClick={() => setFormData({ ...formData, targetAudience: 'SPECIFIC' })}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${formData.targetAudience === 'SPECIFIC' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}
                        >
                            <UserCheck size={16} /> {t('specific_pro')}
                        </button>
                    </div>

                    {formData.targetAudience === 'SPECIFIC' && (
                        <div className="animate-fade-in p-4 bg-green-50 rounded-xl border border-green-100">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-xs font-bold text-green-700 uppercase">{t('select_professions')}</label>
                                <div className="text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                                    {formData.targetProfessions.length} {t('selected_count')}
                                </div>
                            </div>
                            {jobTitles.length === 0 ? (
                                <div className="text-sm text-gray-400 italic py-4 text-center">
                                    {t('no_professions_locality')}
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                    {jobTitles.map(p => {
                                        const isSelected = formData.targetProfessions.includes(p.profession);
                                        return (
                                            <div
                                                key={p.profession}
                                                onClick={() => {
                                                    const current = formData.targetProfessions || [];
                                                    if (current.includes(p.profession)) {
                                                        setFormData({ ...formData, targetProfessions: current.filter(pr => pr !== p.profession) });
                                                    } else {
                                                        setFormData({ ...formData, targetProfessions: [...current, p.profession] });
                                                    }
                                                    setProfessionError('');
                                                }}
                                                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${isSelected
                                                    ? 'bg-gradient-to-br from-green-100 to-emerald-100 border-green-400 shadow-md'
                                                    : 'bg-white border-gray-200 hover:border-green-300 hover:shadow-sm'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-2">
                                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${isSelected ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'
                                                        }`}>
                                                        {isSelected && (
                                                            <svg className="w-3 h-3 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path d="M5 13l4 4L19 7"></path>
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-xs font-bold truncate ${isSelected ? 'text-green-700' : 'text-gray-700'}`}>
                                                            {p.profession}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400">{p.userCount} {t('users_count_suffix')}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            {professionError && (
                                <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                                    <AlertCircle size={12} /> {professionError}
                                </p>
                            )}
                            <p className="text-[10px] text-green-600 mt-2">
                                {t('professions_hint')}
                            </p>
                        </div>
                    )}
                </div>

                {/* NEW: Send to Communities Section */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-800 mb-2">{t('send_to_other_communities')}</h3>
                    <p className="text-xs text-gray-500 mb-4">{t('broadcast_additional_hint')}</p>

                    {communities.length === 0 ? (
                        <div className="text-sm text-gray-400 italic p-4 bg-gray-50 rounded-xl">
                            {t('no_other_communities')}
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {communities.map(comm => (
                                    <div
                                        key={comm.communityName}
                                        className={`px-3 py-2 rounded-lg text-xs font-bold border cursor-pointer transition-all ${formData.selectedCommunities?.includes(comm.communityName)
                                            ? 'bg-green-100 border-green-300 text-green-700 shadow-sm'
                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                        onClick={() => {
                                            const current = formData.selectedCommunities || [];
                                            if (current.includes(comm.communityName)) {
                                                setFormData({
                                                    ...formData,
                                                    selectedCommunities: current.filter(c => c !== comm.communityName)
                                                });
                                            } else {
                                                setFormData({
                                                    ...formData,
                                                    selectedCommunities: [...current, comm.communityName]
                                                });
                                            }
                                        }}
                                    >
                                        {comm.communityName} ({comm.memberCount} {t('users_count_suffix')})
                                    </div>
                                ))}
                            </div>
                            {formData.selectedCommunities && formData.selectedCommunities.length > 0 && (
                                <p className="text-xs text-green-600 font-semibold">
                                    ✓ {formData.selectedCommunities.length} {t('communities_selected')}
                                </p>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Bottom Action */}
            <div className="fixed bottom-0 md:bottom-auto md:relative left-0 right-0 p-4 bg-white md:bg-transparent border-t md:border-none shadow-lg md:shadow-none z-30 md:max-w-2xl md:mx-auto">
                <button
                    onClick={handleConfirmSubmit}
                    disabled={loading}
                    className="w-full bg-green-600 text-white p-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 hover:bg-green-700 active:scale-95 transition disabled:opacity-50"
                >
                    <Send size={20} /> {t('broadcast_request')}
                </button>
            </div>

            {/* Confirmation Dialog */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4">
                            <h3 className="text-white font-bold text-lg">{t('confirm_request')}</h3>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <h4 className="font-bold text-gray-800">{formData.title}</h4>
                                <p className="text-sm text-gray-500 mt-2 line-clamp-3">{formData.description}</p>
                                <p className="text-xs text-gray-400 mt-2">
                                    {t('who_receive_q')}: {formData.targetAudience === 'ALL' ? t('everyone') : formData.targetProfessions.join(', ')}
                                </p>
                            </div>

                            <div className="flex items-start gap-2 bg-green-50 p-3 rounded-lg">
                                <Shield size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-green-700">
                                    {t('privacy_msg')}
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    className="flex-1 p-3 border border-gray-200 rounded-xl font-semibold text-gray-600"
                                >
                                    {t('back')}
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white p-3 rounded-xl font-bold disabled:opacity-50"
                                >
                                    {loading ? t('posting') : t('confirm_request')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RequestService;
