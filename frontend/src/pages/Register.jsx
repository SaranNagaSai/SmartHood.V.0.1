import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import VoiceInput from '../components/common/VoiceInput';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import Webcam from 'react-webcam';
import { API_URL } from '../utils/apiConfig';
import { User, MapPin, Briefcase, Check, Camera, Upload, X } from 'lucide-react';

const Register = () => {
    const { t, language } = useLanguage();
    const { login } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
    const [cameraMode, setCameraMode] = useState(false);
    const webcamRef = React.useRef(null);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        age: '',
        gender: 'Male',
        email: '',
        bloodGroup: 'A+',
        address: '',
        locality: '',
        town: '',
        district: '',
        state: '',
        professionCategory: 'Employed',
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
    const genders = ['Male', 'Female', 'Other'];
    const professionCategories = ['Employed', 'Business', 'Student', 'Homemaker', 'Others'];
    const educationLevels = ['High School', 'Intermediate', 'Undergraduate', 'Postgraduate', 'PhD', 'Other'];

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
                alert('Please fill all required fields');
                return;
            }
        }
        if (step === 2) {
            if (!formData.locality || !formData.town || !formData.district || !formData.state) {
                alert('Please fill all location fields');
                return;
            }
        }
        if (step === 3) {
            // Basic validation for profession (can be stricter)
            if (!formData.professionCategory) {
                alert('Please select a profession category');
                return;
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

            alert(`Registration Successful! Your Unique ID: ${res.data.uniqueId}`);
            login(res.data, res.data.token);
            navigate('/home');
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Registration Failed');
        }
        setLoading(false);
    };

    // Stepper Component
    const Stepper = ({ current }) => (
        <div className="flex items-center justify-center mb-8">
            {[1, 2, 3, 4].map((s, idx) => (
                <React.Fragment key={s}>
                    <div className="relative flex flex-col items-center z-10">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-500 ${s < current ? 'bg-success text-white shadow-xl shadow-success/30' :
                            s === current ? 'bg-primary text-white shadow-xl shadow-primary/30 scale-110' :
                                'bg-gray-100 text-gray-400 border border-gray-200'
                            }`}>
                            {s < current ? <Check size={20} strokeWidth={3} /> : (
                                <>
                                    {s === 1 && <User size={18} />}
                                    {s === 2 && <MapPin size={18} />}
                                    {s === 3 && <Briefcase size={18} />}
                                    {s === 4 && <Camera size={18} />}
                                </>
                            )}
                        </div>
                        <span className={`text-[10px] uppercase tracking-wider mt-3 font-bold transition-colors ${s === current ? 'text-primary' : 'text-gray-400'
                            }`}>
                            {s === 1 ? t('personal') : s === 2 ? t('location') : s === 3 ? t('work') : t('photo') || 'PHOTO'}
                        </span>
                    </div>
                    {idx < 3 && (
                        <div className="flex-1 w-16 h-0.5 mx-2 bg-gray-200 relative overflow-hidden rounded-full">
                            <div className={`absolute top-0 left-0 h-full bg-success transition-all duration-500 ease-out ${s < current ? 'w-full' : 'w-0'}`}></div>
                        </div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen w-full bg-gradient-brand flex flex-col items-center justify-center p-4 relative">
            <div className="w-full max-w-[600px] bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl overflow-hidden border border-white/50 animate-slide-up relative z-10">
                <div className="bg-primary/5 p-8 text-center border-b border-primary/10">
                    <h1 className="text-3xl font-bold text-primary tracking-tight">{t('join_smarthood')}</h1>
                    <p className="text-gray-500 text-sm mt-2">{t('community_connect')}</p>
                </div>

                <div className="p-8">
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

                                    <VoiceInput
                                        name="phone"
                                        label={t('phone_label') + " *"}
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        type="tel"
                                        placeholder={t('phone_placeholder')}
                                        className="bg-gray-50 border-gray-200 focus:border-primary rounded-xl py-3"
                                        required
                                    />

                                    <div className="grid grid-cols-2 gap-4">
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
                                                {genders.map(g => <option key={g} value={g}>{g}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">{t('blood_group')} *</label>
                                            <select
                                                name="bloodGroup"
                                                value={formData.bloodGroup}
                                                onChange={handleChange}
                                                className="w-full p-3 border border-red-100 rounded-xl bg-red-50 focus:ring-2 focus:ring-red-500 outline-none text-red-700 font-bold"
                                            >
                                                {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                            </select>
                                        </div>
                                        <VoiceInput
                                            name="email"
                                            label={t('email') + " (Optional)"}
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            type="email"
                                            placeholder="your@email.com"
                                            className="bg-gray-50 border-gray-200 focus:border-primary rounded-xl py-3"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={nextStep}
                                    className="w-full bg-primary text-white p-4 rounded-xl font-bold shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all mt-4"
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
                                        placeholder="House No, Street Name..."
                                        type="textarea"
                                        className="bg-gray-50 border-gray-200 focus:border-primary rounded-xl"
                                    />

                                    <VoiceInput
                                        name="locality"
                                        label={t('locality_label') + " *"}
                                        value={formData.locality}
                                        onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                                        placeholder="Your neighborhood name"
                                        className="bg-gray-50 border-gray-200 focus:border-primary rounded-xl py-3"
                                        required
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <VoiceInput
                                            name="town"
                                            label={t('town_label') + " *"}
                                            value={formData.town}
                                            onChange={(e) => setFormData({ ...formData, town: e.target.value })}
                                            placeholder="Town name"
                                            className="bg-gray-50 border-gray-200 focus:border-primary rounded-xl py-3"
                                            required
                                        />
                                        <VoiceInput
                                            name="district"
                                            label={t('district_label') + " *"}
                                            value={formData.district}
                                            onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                                            placeholder="District"
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
                                            <option value="">-- {t('select_state') || "Select State"} --</option>
                                            {indianStates.map(state => (
                                                <option key={state} value={state}>{state}</option>
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
                                    {formData.professionCategory === 'Employed' && (
                                        <>
                                            <VoiceInput
                                                label={t('job_role_label') + " *"}
                                                value={formData.professionDetails.jobRole}
                                                onChange={(e) => handleProfessionDetailChange('jobRole', e.target.value)}
                                                placeholder="e.g., Software Engineer"
                                                className="bg-white border-gray-200 rounded-xl py-3"
                                                required
                                            />
                                            <VoiceInput
                                                label={t('sector_label')}
                                                value={formData.professionDetails.sector}
                                                onChange={(e) => handleProfessionDetailChange('sector', e.target.value)}
                                                placeholder="e.g., IT, Healthcare"
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

                                    {formData.professionCategory === 'Business' && (
                                        <>
                                            <VoiceInput
                                                label={t('business_type_label') + " *"}
                                                value={formData.professionDetails.businessType}
                                                onChange={(e) => handleProfessionDetailChange('businessType', e.target.value)}
                                                placeholder="e.g., Retail, Restaurant"
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

                                    {formData.professionCategory === 'Student' && (
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
                                                        <option key={level} value={level}>{t(level.toLowerCase().replace(' ', '_')) || level}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <VoiceInput
                                                label={t('course_label') + " *"}
                                                value={formData.professionDetails.course}
                                                onChange={(e) => handleProfessionDetailChange('course', e.target.value)}
                                                placeholder="e.g., Computer Science, B.Com"
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

                                    {(['Homemaker', 'Others'].includes(formData.professionCategory)) && (
                                        <>
                                            <VoiceInput
                                                label={t('description_label')}
                                                value={formData.professionDetails.description}
                                                onChange={(e) => handleProfessionDetailChange('description', e.target.value)}
                                                placeholder="Provide more details..."
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
                                    <div className="flex gap-4 w-full">
                                        <button
                                            onClick={() => setCameraMode(true)}
                                            className="flex-1 flex flex-col items-center gap-2 p-4 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 hover:bg-blue-100 transition"
                                        >
                                            <Camera size={24} />
                                            <span className="font-bold text-sm">{t('take_photo') || 'Take Photo'}</span>
                                        </button>
                                        <label className="flex-1 flex flex-col items-center gap-2 p-4 bg-green-50 text-green-600 rounded-xl border border-green-100 hover:bg-green-100 transition cursor-pointer">
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
            </div >
        </div >
    );
};

export default Register;
