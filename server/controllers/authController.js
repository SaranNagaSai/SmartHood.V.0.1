const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendWelcomeEmail } = require('../services/emailService');
const twilioService = require('../utils/twilioService');

const isTelugu = (text) => {
    if (!text) return true;
    const teluguRegex = /^[\u0C00-\u0C7F0-9\s.,!?-]+$/;
    return teluguRegex.test(text);
};

// Generate Unique ID (e.g., random chars + random numbers)
const generateUniqueId = async () => {
    let uniqueId;
    let isUnique = false;
    while (!isUnique) {
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const prefix = letters.charAt(Math.floor(Math.random() * letters.length)) +
            letters.charAt(Math.floor(Math.random() * letters.length)) +
            letters.charAt(Math.floor(Math.random() * letters.length));
        const suffix = Math.floor(10 + Math.random() * 90); // 2 digit number
        uniqueId = `${prefix}${suffix}`;

        const existingUser = await User.findOne({ uniqueId });
        if (!existingUser) isUnique = true;
    }
    return uniqueId;
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const categoryMap = {
        'employed': 'Employed',
        'business': 'Business',
        'student': 'Student',
        'homemaker': 'Homemaker',
        'others_cat': 'Others'
    };

    const genderMap = {
        'male': 'Male',
        'female': 'Female',
        'other_gender': 'Other'
    };

    try {
        const {
            name, phone, age, gender, email, bloodGroup,
            address, locality, town, district, state,
            professionCategory, experience
        } = req.body;

        const { language } = req.headers; // Expect language preference in headers

        // Server-side Telugu validation
        if (language === 'Telugu') {
            const fieldsToValidate = { name, locality, town, district };
            for (const [field, value] of Object.entries(fieldsToValidate)) {
                if (value && !isTelugu(value)) {
                    return res.status(400).json({ message: `దయచేసి ${field} లో తెలుగు అక్షరాలను మాత్రమే ఉపయోగించండి. (Please use Telugu script for ${field})` });
                }
            }
        }

        // Robust parsing for professionDetails (handles flattened bracketed keys from FormData)
        let professionDetails = req.body.professionDetails || {};
        if (typeof professionDetails === 'string') {
            try { professionDetails = JSON.parse(professionDetails); } catch (e) { professionDetails = {}; }
        }

        // Check for bracketed keys like "professionDetails[jobRole]"
        Object.keys(req.body).forEach(key => {
            if (key.startsWith('professionDetails[')) {
                const subKey = key.match(/\[(.*?)\]/)[1];
                professionDetails[subKey] = req.body[key];
            }
        });

        // Check if user exists
        const userExists = await User.findOne({ phone });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with this phone number' });
        }

        // Generate Unique ID
        const uniqueId = await generateUniqueId();

        // Handle Profile Photo
        let profilePhotoPath = '';
        if (req.file) {
            // Store full Cloudinary URL
            profilePhotoPath = req.file.path;
        }

        // Normalize geographic data for cross-language matching
        const { normalizeToEnglish } = require('../utils/locationMap');
        const normLocality = normalizeToEnglish(locality);
        const normTown = normalizeToEnglish(town);
        const normDistrict = normalizeToEnglish(district);

        // Create user with normalized geographic data
        const user = await User.create({
            uniqueId,
            name: (name || '').trim(),
            profilePhoto: profilePhotoPath,
            phone: (phone || '').trim(),
            age: parseInt(age) || 0,
            gender,
            email: (email || '').trim().toLowerCase(),
            bloodGroup,
            address: (address || '').trim(),
            locality: (locality || '').trim(),
            normalizedLocality: normLocality,
            town: (town || '').trim().charAt(0).toUpperCase() + (town || '').trim().slice(1).toLowerCase(), // Normalize "Eluru"
            normalizedTown: normTown,
            district: (district || '').trim(),
            normalizedDistrict: normDistrict,
            state: (state || '').trim(),
            professionCategory: categoryMap[professionCategory] || professionCategory,
            professionDetails,
            experience: parseInt(experience) || 0,
            gender: genderMap[gender] || gender,
            language: language || req.body.language || 'English'
        });

        if (user) {
            // Send Welcome Email if user provided email (Non-blocking)
            if (user.email) {
                console.log(`[Auth] Triggering Welcome Email for: ${user.email}`);
                sendWelcomeEmail(user)
                    .then(result => {
                        if (result.success) {
                            console.log(`[Auth] Welcome Email SENT successfully to: ${user.email}`);
                        } else {
                            console.error(`[Auth] Welcome Email DELIVERY FAILED: ${result.error || 'Unknown error'}`);
                        }
                    })
                    .catch(err => {
                        console.error('--- Welcome Email CRASHED ---');
                        console.error('Target Email:', user.email);
                        console.error('Error Trace:', err);
                        console.error('----------------------------');
                    });
            }

            // Also add an IN-APP welcome notification
            const { createNotification } = require('./notificationController');
            await createNotification(
                user._id,
                {
                    title: 'Welcome to SmartHood!',
                    titleTe: 'స్మార్ట్ హుడ్ కు స్వాగతం!',
                    body: `Hi ${user.name}, welcome to the ${user.locality} community. We are glad to have you here!`,
                    bodyTe: `${user.name} గారు, ${user.locality} కమ్యూనిటీలోకి మీకు స్వాగతం! మన కమ్యూనిటీలో చేరినందుకు సంతోషం.`
                },
                'system',
                '/home',
                null,
                true // skipEmail - welcome email already sent
            );

            res.status(201).json({
                _id: user._id,
                uniqueId: user.uniqueId,
                name: user.name,
                phone: user.phone,
                locality: user.locality,
                town: user.town,
                district: user.district,
                state: user.state,
                profilePhoto: user.profilePhoto,
                token: generateToken(user._id)
            });
        }
    } catch (error) {
        console.error('Registration Error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
};

// @desc    Send OTP for Registration
// @route   POST /api/auth/send-registration-otp
// @access  Public
const sendRegistrationOTP = async (req, res) => {
    const { phone, checkOnly } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'Phone number is required' });

    // Check if user exists
    const userExists = await User.findOne({ phone });
    if (userExists) {
        return res.status(400).json({ success: false, message: 'User already exists with this phone number' });
    }

    // New: If the frontend just wants to check for existence (e.g., when using Firebase for OTP)
    if (checkOnly) {
        return res.json({ success: true, message: 'User does not exist, proceed with OTP' });
    }

    const result = await twilioService.sendOTP(phone);
    if (result.success) {
        res.json({ 
            success: true, 
            message: result.message || 'OTP sent successfully',
            isSandbox: result.isSandbox || false
        });
    } else {
        res.status(500).json({ success: false, message: 'Failed to send OTP: ' + result.error });
    }
};

// @desc    Verify OTP for Registration
// @route   POST /api/auth/verify-registration-otp
// @access  Public
const verifyRegistrationOTP = async (req, res) => {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ success: false, message: 'Phone and OTP are required' });

    const result = await twilioService.verifyOTP(phone, otp);
    if (result.success) {
        res.json({ success: true, message: 'Phone verified successfully' });
    } else {
        res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }
};


// @desc    Login user (Name + Phone)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { name, phone } = req.body;

    // Use console.log for production-safe debugging
    console.log(`[Login Attempt] Name: "${name}", Phone: "${phone}"`);

    try {
        if (!name || !phone) {
            console.warn('[Login Error] Missing Credentials');
            return res.status(400).json({ message: 'Name/ID and Phone Number are required' });
        }

        // Find user by phone
        const user = await User.findOne({ phone });

        if (!user) {
            console.warn(`[Login Error] Phone Mismatch - Input Phone: "${phone}" not found in DB`);
            return res.status(401).json({ message: 'Invalid phone number' });
        }

        // Check if uniqueId or name matches
        const inputName = name.toLowerCase().trim();
        const userName = (user.name || "").toLowerCase().trim();
        const userUniqueId = (user.uniqueId || "").toLowerCase().trim();

        const nameMatch = userName === inputName;
        const idMatch = userUniqueId === inputName;

        if (!nameMatch && !idMatch) {
            console.warn(`[Login Error] Name/ID Mismatch for phone ${phone}`);
            return res.status(401).json({ message: 'Invalid name or unique ID' });
        }

        // If credentials match, check if OTP is provided
        const { otp } = req.body;

        if (!otp) {
            // STEP 1: Credentials valid, trigger OTP
            const twilioResult = await twilioService.sendOTP(phone);
            if (twilioResult.success) {
                return res.json({
                    success: true,
                    requireOTP: true,
                    message: twilioResult.message || 'Verification code sent to your mobile.',
                    isSandbox: twilioResult.isSandbox || false
                });
            } else {
                return res.status(500).json({ message: 'Failed to send OTP: ' + twilioResult.error });
            }
        } else {
            // STEP 2: Verify OTP
            const verifyResult = await twilioService.verifyOTP(phone, otp);
            if (verifyResult.success) {
                console.log(`[SUCCESS] Login Successful for ${user.name}`);
                return res.json({
                    _id: user._id,
                    uniqueId: user.uniqueId,
                    name: user.name,
                    phone: user.phone,
                    locality: user.locality,
                    town: user.town,
                    district: user.district,
                    state: user.state,
                    profilePhoto: user.profilePhoto,
                    token: generateToken(user._id)
                });
            } else {
                return res.status(401).json({ message: 'Invalid or expired OTP' });
            }
        }
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
};

// Generate JWT
const generateToken = (id) => {
    if (!process.env.SMARTHOOD_JWT_SECRET) {
        console.error('CRITICAL: SMARTHOOD_JWT_SECRET is not defined in .env');
        return 'temp_token_fix_env'; // Fallback to avoid crash, but warning logged
    }
    return jwt.sign({ id }, process.env.SMARTHOOD_JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Magic Login (Token-based auto-login)
// @route   GET /api/auth/magic-login/:token
// @access  Public
const magicLogin = async (req, res) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({ message: 'Invalid magic token' });
        }

        // Verify the token
        const decoded = jwt.verify(token, process.env.SMARTHOOD_JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Return user data same as login
        res.json({
            _id: user._id,
            uniqueId: user.uniqueId,
            name: user.name,
            phone: user.phone,
            locality: user.locality,
            town: user.town,
            district: user.district,
            state: user.state,
            profilePhoto: user.profilePhoto,
            token: generateToken(user._id) // Issue a fresh long-lived token
        });

    } catch (error) {
        console.error('Magic Login Error:', error);
        res.status(401).json({ message: 'Session expired or invalid token' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    magicLogin,
    sendRegistrationOTP,
    verifyRegistrationOTP
};

