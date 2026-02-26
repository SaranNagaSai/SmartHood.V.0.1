import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import {
    User, MapPin, Briefcase, Phone, Mail, Droplet,
    Edit3, Save, X, Award, TrendingUp, DollarSign, Camera, Upload
} from 'lucide-react';
import Webcam from 'react-webcam';
import VoiceInput from '../components/common/VoiceInput';
import { API_URL, SERVER_URL, getProfilePhotoUrl } from '../utils/apiConfig';

const Profile = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editData, setEditData] = useState({});
    const [saving, setSaving] = useState(false);

    // Photo Upload State
    const [photoModalOpen, setPhotoModalOpen] = useState(false);
    const [cameraMode, setCameraMode] = useState(false);
    const [tempPhoto, setTempPhoto] = useState(null);
    const [tempPhotoPreview, setTempPhotoPreview] = useState(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const webcamRef = React.useRef(null);

    // Locality Users State
    const [localityUsers, setLocalityUsers] = useState([]);
    const [loadingLocalityUsers, setLoadingLocalityUsers] = useState(false);

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user'));
        const token = localStorage.getItem('token');

        if (!userData || !token) {
            navigate('/login');
            return;
        }

        // Fetch full profile from API
        const fetchProfile = async () => {
            try {
                const res = await fetch(`${API_URL}/users/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                setUser(data);
                setEditData(data);
                // Also update localStorage to keep it in sync
                localStorage.setItem('user', JSON.stringify({ ...data, token }));
            } catch (err) {
                console.error('Failed to fetch profile', err);
                setUser(userData);
                setEditData(userData);
            }
            setLoading(false);
        };

        fetchProfile();
    }, [navigate]);

    const fetchLocalityUsers = async (locality, town) => {
        try {
            setLoadingLocalityUsers(true);
            const token = localStorage.getItem('token');
            // Fetch users from the same locality and town
            const res = await fetch(`${API_URL}/users/locality/${encodeURIComponent(locality)}?town=${encodeURIComponent(town)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();

            // Filter out current user based on uniqueId if available, or just skip if it's the same person
            const currentUser = JSON.parse(localStorage.getItem('user'));
            const filteredUsers = Array.isArray(data) ? data.filter(u => u.uniqueId !== currentUser.uniqueId) : [];
            setLocalityUsers(filteredUsers);
        } catch (err) {
            console.error("Failed to fetch locality users", err);
        } finally {
            setLoadingLocalityUsers(false);
        }
    };

    // Effect to fetch locality users once user data is loaded
    useEffect(() => {
        if (user && user.locality && user.town) {
            fetchLocalityUsers(user.locality, user.town);
        }
    }, [user]);

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setTempPhoto(file);
            setTempPhotoPreview(URL.createObjectURL(file));
        }
    };

    const capture = React.useCallback(() => {
        const imageSrc = webcamRef.current.getScreenshot();
        setTempPhotoPreview(imageSrc);
        fetch(imageSrc).then(res => res.blob()).then(blob => {
            const file = new File([blob], "profile-cam.jpg", { type: "image/jpeg" });
            setTempPhoto(file);
        });
        setCameraMode(false);
    }, [webcamRef]);

    const savePhoto = async () => {
        if (!tempPhoto) return;
        setUploadingPhoto(true);
        try {
            const formData = new FormData();
            formData.append('profilePhoto', tempPhoto);

            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/users/photo`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });

            if (!res.ok) throw new Error('Photo upload failed');

            const data = await res.json();

            // Update user state
            const updatedUser = { ...user, profilePhoto: data.profilePhoto };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));

            setPhotoModalOpen(false);
            setTempPhoto(null);
            setTempPhotoPreview(null);
            alert('Profile photo updated!');
        } catch (err) {
            console.error(err);
            alert('Failed to update photo');
        }
        setUploadingPhoto(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/users/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(editData)
            });

            if (!res.ok) {
                throw new Error('Failed to update profile');
            }

            const data = await res.json();

            // Update both state and localStorage immediately
            setUser(data);
            setEditData(data);
            localStorage.setItem('user', JSON.stringify(data));

            setEditing(false);
            alert('Profile updated successfully!');
        } catch (err) {
            console.error('Profile update error:', err);
            alert('Failed to update profile: ' + err.message);
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="p-8 text-center text-gray-500">
                Loading profile...
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 pb-8">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-[var(--col-primary)] to-[var(--col-secondary)] text-white p-6 sm:p-8 rounded-b-[1.5rem] sm:rounded-b-[2rem] relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-6">
                        <div className="relative group">
                            <div className="w-28 h-28 sm:w-40 h-40 bg-white/20 rounded-full flex items-center justify-center text-4xl sm:text-6xl font-bold backdrop-blur overflow-hidden border-4 border-white/30 shadow-2xl">
                                {user.profilePhoto ? (
                                    <img
                                        src={getProfilePhotoUrl(user.profilePhoto)}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    user.name?.charAt(0) || 'U'
                                )}
                            </div>
                            <button
                                onClick={() => setPhotoModalOpen(true)}
                                className="absolute bottom-1 right-1 sm:bottom-0 sm:right-0 bg-white text-[var(--col-primary)] p-2 rounded-full shadow-lg opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                            >
                                <Camera size={14} sm:size={16} />
                            </button>
                        </div>
                        <div className="text-center sm:text-left">
                            <h1 className="text-xl sm:text-2xl font-bold">{user.name}</h1>
                            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 sm:gap-3 mt-2">
                                <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] sm:text-sm font-mono">
                                    {user.uniqueId}
                                </span>
                                <span className="bg-red-500/80 px-3 py-1 rounded-full text-[10px] sm:text-sm flex items-center gap-1">
                                    <Droplet size={10} sm:size={12} /> {user.bloodGroup}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            </div>

            {/* Stats Cards */}
            <div className="px-4 mt-4 sm:mt-6 mb-4 sm:mb-6">
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-lg text-center">
                        <Award className="mx-auto text-amber-500 mb-1" size={20} sm:size={24} />
                        <p className="text-lg sm:text-xl font-bold text-gray-800">{user.impactScore || 0}</p>
                        <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-tight">Impact</p>
                    </div>
                    <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-lg text-center">
                        <TrendingUp className="mx-auto text-green-500 mb-1" size={20} sm:size={24} />
                        <p className="text-lg sm:text-xl font-bold text-gray-800">{user.experience || 0}</p>
                        <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-tight">Exp</p>
                    </div>
                    <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-lg text-center">
                        <DollarSign className="mx-auto text-blue-500 mb-1" size={20} sm:size={24} />
                        <p className="text-lg sm:text-xl font-bold text-gray-800">₹{user.revenue || 0}</p>
                        <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-tight">Rev</p>
                    </div>
                </div>
            </div>

            {/* Edit Toggle */}
            <div className="px-4 mt-6 flex justify-end">
                {editing ? (
                    <div className="flex gap-2">
                        <button
                            onClick={() => { setEditing(false); setEditData(user); }}
                            className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50"
                        >
                            <X size={16} /> Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-1 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600"
                        >
                            <Save size={16} /> {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setEditing(true)}
                        className="flex items-center gap-1 px-4 py-2 bg-[var(--col-primary)] text-white rounded-xl hover:opacity-90"
                    >
                        <Edit3 size={16} /> Edit Profile
                    </button>
                )}
            </div>

            {/* Profile Sections */}
            <div className="px-4 mt-6 space-y-6 pb-8">
                {/* Personal Info */}
                <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 transition-all duration-300">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                            <User size={18} className="text-white" />
                        </div>
                        Personal Information
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-xs text-gray-400 mb-1">Age</p>
                            {editing ? (
                                <VoiceInput
                                    value={editData.age || ''}
                                    onChange={(e) => setEditData({ ...editData, age: e.target.value })}
                                    type="number"
                                    className="bg-gray-50 border-gray-200 rounded-lg py-1 px-2 text-sm"
                                />
                            ) : (
                                <p className="font-medium text-gray-700">{user.age} years</p>
                            )}
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 mb-1">Gender</p>
                            {editing ? (
                                <select
                                    value={editData.gender || 'Male'}
                                    onChange={(e) => setEditData({ ...editData, gender: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-1 px-2 text-sm outline-none"
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            ) : (
                                <p className="font-medium text-gray-700">{user.gender}</p>
                            )}
                        </div>
                        <div className="col-span-2">
                            <p className="text-xs text-gray-400 mb-1">Email</p>
                            {editing ? (
                                <VoiceInput
                                    value={editData.email || ''}
                                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                    type="email"
                                    className="bg-gray-50 border-gray-200 rounded-lg py-1 px-2 text-sm"
                                />
                            ) : (
                                <p className="font-medium text-gray-700 flex items-center gap-1">
                                    <Mail size={12} /> {user.email || 'Not provided'}
                                </p>
                            )}
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 mb-1">Phone (Locked)</p>
                            <p className="font-medium text-gray-400 flex items-center gap-1">
                                <Phone size={12} /> {user.phone}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 mb-1">Blood Group</p>
                            {editing ? (
                                <select
                                    value={editData.bloodGroup || 'A+'}
                                    onChange={(e) => setEditData({ ...editData, bloodGroup: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-1 px-2 text-sm outline-none"
                                >
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                </select>
                            ) : (
                                <p className="font-medium text-gray-700 flex items-center gap-1">
                                    <Droplet size={12} className="text-red-500" /> {user.bloodGroup}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Location Info */}
                <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 transition-all duration-300">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                            <MapPin size={18} className="text-white" />
                        </div>
                        Location Details
                    </h3>
                    {editing ? (
                        <div className="space-y-3">
                            <VoiceInput
                                label="Address"
                                value={editData.address || ''}
                                onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                                className="bg-gray-50 border-gray-200 rounded-lg"
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <VoiceInput
                                    label="Locality"
                                    value={editData.locality || ''}
                                    onChange={(e) => setEditData({ ...editData, locality: e.target.value })}
                                    className="bg-gray-50 border-gray-200 rounded-lg"
                                />
                                <VoiceInput
                                    label="Town"
                                    value={editData.town || ''}
                                    onChange={(e) => setEditData({ ...editData, town: e.target.value })}
                                    className="bg-gray-50 border-gray-200 rounded-lg"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <VoiceInput
                                    label="District"
                                    value={editData.district || ''}
                                    onChange={(e) => setEditData({ ...editData, district: e.target.value })}
                                    className="bg-gray-50 border-gray-200 rounded-lg"
                                />
                                <VoiceInput
                                    label="State"
                                    value={editData.state || ''}
                                    onChange={(e) => setEditData({ ...editData, state: e.target.value })}
                                    className="bg-gray-50 border-gray-200 rounded-lg"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-gray-700">{user.address || 'No address'}</p>
                            <p className="text-sm text-gray-500">
                                {user.locality}, {user.town}
                            </p>
                            <p className="text-sm text-gray-500">
                                {user.district}, {user.state}
                            </p>
                        </div>
                    )}
                </div>

                {/* Professional Info */}
                <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 transition-all duration-300">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                            <Briefcase size={18} className="text-white" />
                        </div>
                        Professional Details
                    </h3>
                    <div className="space-y-3">
                        {editing ? (
                            <>
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">Category</label>
                                    <select
                                        value={editData.professionCategory || 'Employed'}
                                        onChange={(e) => setEditData({ ...editData, professionCategory: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-2 text-sm outline-none"
                                    >
                                        {['Employed', 'Business', 'Student', 'Homemaker', 'Others'].map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>

                                {editData.professionCategory === 'Employed' && (
                                    <>
                                        <VoiceInput
                                            label="Job Role"
                                            value={editData.professionDetails?.jobRole || ''}
                                            onChange={(e) => setEditData({ ...editData, professionDetails: { ...editData.professionDetails, jobRole: e.target.value } })}
                                            className="bg-gray-50 border-gray-200 rounded-lg"
                                        />
                                        <VoiceInput
                                            label="Sector"
                                            value={editData.professionDetails?.sector || ''}
                                            onChange={(e) => setEditData({ ...editData, professionDetails: { ...editData.professionDetails, sector: e.target.value } })}
                                            className="bg-gray-50 border-gray-200 rounded-lg"
                                        />
                                    </>
                                )}

                                {editData.professionCategory === 'Business' && (
                                    <VoiceInput
                                        label="Business Type"
                                        value={editData.professionDetails?.businessType || ''}
                                        onChange={(e) => setEditData({ ...editData, professionDetails: { ...editData.professionDetails, businessType: e.target.value } })}
                                        className="bg-gray-50 border-gray-200 rounded-lg"
                                    />
                                )}

                                {editData.professionCategory === 'Student' && (
                                    <>
                                        <VoiceInput
                                            label="Course"
                                            value={editData.professionDetails?.course || ''}
                                            onChange={(e) => setEditData({ ...editData, professionDetails: { ...editData.professionDetails, course: e.target.value } })}
                                            className="bg-gray-50 border-gray-200 rounded-lg"
                                        />
                                        <div>
                                            <label className="text-xs text-gray-400 block mb-1">Education Level</label>
                                            <select
                                                value={editData.professionDetails?.educationLevel || ''}
                                                onChange={(e) => setEditData({ ...editData, professionDetails: { ...editData.professionDetails, educationLevel: e.target.value } })}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-2 text-sm outline-none"
                                            >
                                                <option value="">Select Level</option>
                                                {['High School', 'Intermediate', 'Undergraduate', 'Postgraduate', 'PhD', 'Other'].map(l => (
                                                    <option key={l} value={l}>{l}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}

                                <VoiceInput
                                    label="Years of Experience"
                                    value={editData.experience || 0}
                                    type="number"
                                    onChange={(e) => setEditData({ ...editData, experience: parseInt(e.target.value) || 0 })}
                                    className="bg-gray-50 border-gray-200 rounded-lg"
                                />
                            </>
                        ) : (
                            <>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">Category</span>
                                    <span className="font-medium text-[var(--col-secondary)]">
                                        {user.professionCategory}
                                    </span>
                                </div>
                                {user.professionDetails?.jobRole && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Role</span>
                                        <span className="font-medium">{user.professionDetails.jobRole}</span>
                                    </div>
                                )}
                                {user.professionDetails?.sector && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Sector</span>
                                        <span className="font-medium">{user.professionDetails.sector}</span>
                                    </div>
                                )}
                                {user.professionDetails?.businessType && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Business</span>
                                        <span className="font-medium">{user.professionDetails.businessType}</span>
                                    </div>
                                )}
                                {user.professionDetails?.educationLevel && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Education</span>
                                        <span className="font-medium">{user.professionDetails.educationLevel}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                    <span className="text-gray-500">Experience</span>
                                    <span className="font-medium">{user.experience} Years</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* People in My Locality Section */}
                <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 transition-all duration-300">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                            <User size={18} className="text-white" />
                        </div>
                        People in My Locality <span className="text-sm font-normal text-gray-500 ml-2">({localityUsers.length})</span>
                    </h3>

                    {loadingLocalityUsers ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--col-primary)]"></div>
                        </div>
                    ) : localityUsers.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 italic bg-gray-50 rounded-xl">
                            No other registered users in {user?.locality} yet.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {localityUsers.map(u => (
                                <div key={u.uniqueId} className="p-4 rounded-xl border border-gray-100 hover:border-green-200 hover:shadow-md transition-all bg-white group">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center text-[var(--col-primary)] font-bold text-lg group-hover:scale-110 transition-transform overflow-hidden">
                                            {u.profilePhoto ? (
                                                <img
                                                    src={getProfilePhotoUrl(u.profilePhoto)}
                                                    alt={u.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                u.name?.charAt(0).toUpperCase() || 'U'
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-gray-800 truncate">{u.name}</h4>
                                            <p className="text-xs text-gray-500 mb-1">ID: {u.uniqueId}</p>
                                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full uppercase tracking-wide">
                                                    {u.professionCategory}
                                                </span>
                                                {u.impactScore > 0 && (
                                                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                                        <span>★</span> {u.impactScore}
                                                    </span>
                                                )}
                                            </div>
                                            {u.professionDetails?.jobRole && (
                                                <p className="text-xs text-gray-500 mt-2 truncate">
                                                    {u.professionDetails.jobRole}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {/* Photo Upload Modal */}
            {photoModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800">Update Profile Photo</h3>
                            <button onClick={() => setPhotoModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 flex flex-col items-center gap-6">
                            {/* Preview */}
                            <div className="w-48 h-48 bg-gray-100 rounded-full overflow-hidden border-4 border-gray-200 shadow-inner relative group">
                                {tempPhotoPreview ? (
                                    <img src={tempPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <User size={64} />
                                    </div>
                                )}
                                {cameraMode && (
                                    <div className="absolute inset-0 bg-black z-10">
                                        <Webcam
                                            audio={false}
                                            ref={webcamRef}
                                            screenshotFormat="image/jpeg"
                                            className="w-full h-full object-cover"
                                            videoConstraints={{ facingMode: "user" }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Controls */}
                            <div className="flex gap-3 w-full">
                                {cameraMode ? (
                                    <button
                                        onClick={capture}
                                        className="w-full bg-red-500 text-white p-3 rounded-xl font-bold hover:bg-red-600 transition flex items-center justify-center gap-2"
                                    >
                                        <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                                        Capture
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setCameraMode(true)}
                                            className="flex-1 bg-blue-50 text-blue-600 p-3 rounded-xl font-bold border border-blue-100 hover:bg-blue-100 transition flex items-center justify-center gap-2"
                                        >
                                            <Camera size={18} />
                                            Camera
                                        </button>
                                        <label className="flex-1 bg-green-50 text-green-600 p-3 rounded-xl font-bold border border-green-100 hover:bg-green-100 transition cursor-pointer flex items-center justify-center gap-2">
                                            <Upload size={18} />
                                            Upload
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handlePhotoChange}
                                            />
                                        </label>
                                    </>
                                )}
                            </div>

                            <button
                                onClick={savePhoto}
                                disabled={!tempPhoto || uploadingPhoto}
                                className="w-full bg-[var(--col-primary)] text-white py-4 rounded-xl font-bold hover:brightness-110 transition shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {uploadingPhoto ? 'Uploading...' : 'Save New Photo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
