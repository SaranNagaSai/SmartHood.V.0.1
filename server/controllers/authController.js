const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendWelcomeEmail } = require('../services/emailService');

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
    try {
        const {
            name, phone, age, gender, email, bloodGroup,
            address, locality, town, district, state,
            professionCategory, experience
        } = req.body;

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

        // Create user
        const user = await User.create({
            uniqueId,
            name,
            profilePhoto: profilePhotoPath,
            phone,
            age: parseInt(age) || 0,
            gender,
            email,
            bloodGroup,
            address,
            locality,
            town,
            district,
            state,
            professionCategory,
            professionDetails,
            experience: parseInt(experience) || 0
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

            // Also add an IN-APP welcome notification (skipEmail=true since welcome email already sent above)
            const { createNotification } = require('./notificationController');
            await createNotification(
                user._id,
                'Welcome to SmartHood!',
                `Hi ${user.name}, we're glad to have you in the ${user.locality} community. Start by exploring services or help your neighbors!`,
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

const fs = require('fs');
const path = require('path');

// @desc    Login user (Name + Phone)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { name, phone } = req.body;

    // PERSISTENT DEBUG LOGGING
    const logEntry = `[${new Date().toISOString()}] Login Attempt - Name: "${name}", Phone: "${phone}"\n`;
    try {
        fs.appendFileSync(path.join(__dirname, '../debug_login.log'), logEntry);
    } catch (e) {
        console.error('Log write failed', e);
    }

    try {
        if (!name || !phone) {
            const errorLog = `[${new Date().toISOString()}] Missing Credentials\n`;
            fs.appendFileSync(path.join(__dirname, '../debug_login.log'), errorLog);
            return res.status(400).json({ message: 'Name/ID and Phone Number are required' });
        }

        // Find user by phone
        const user = await User.findOne({ phone });

        if (!user) {
            const errorLog = `[${new Date().toISOString()}] Phone Mismatch - Input Phone: "${phone}" not found in DB\n`;
            fs.appendFileSync(path.join(__dirname, '../debug_login.log'), errorLog);
            return res.status(401).json({ message: 'Invalid phone number' });
        }

        // Log found user details for comparison
        fs.appendFileSync(path.join(__dirname, '../debug_login.log'), `[MATCH CHECK] User Found: Name="${user.name}", UniqueID="${user.uniqueId}"\n`);

        // Check if uniqueId or name matches (Defensive lowercase checks)
        const inputName = name.toLowerCase().trim(); // Added trim for safety
        const userName = (user.name || "").toLowerCase().trim();
        const userUniqueId = (user.uniqueId || "").toLowerCase().trim();

        const nameMatch = userName === inputName;
        const idMatch = userUniqueId === inputName;

        if (nameMatch || idMatch) {
            fs.appendFileSync(path.join(__dirname, '../debug_login.log'), `[SUCCESS] Login Successful for ${user.name}\n`);
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
                token: generateToken(user._id)
            });
        } else {
            const errorLog = `[${new Date().toISOString()}] Name/ID Mismatch - Input: "${inputName}" vs DB Name: "${userName}" / DB ID: "${userUniqueId}"\n`;
            fs.appendFileSync(path.join(__dirname, '../debug_login.log'), errorLog);
            res.status(401).json({ message: 'Invalid name or unique ID' });
        }
    } catch (error) {
        console.error('Login Error:', error);
        fs.appendFileSync(path.join(__dirname, '../debug_login.log'), `[ERROR] Server Error: ${error.message}\n`);
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
};

// Generate JWT
const generateToken = (id) => {
    if (!process.env.JWT_SECRET) {
        console.error('CRITICAL: JWT_SECRET is not defined in .env');
        return 'temp_token_fix_env'; // Fallback to avoid crash, but warning logged
    }
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

module.exports = { registerUser, loginUser };
