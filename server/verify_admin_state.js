const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function verifyAdmin() {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({ phone: '9398176717' });
    console.log('User Detail:', {
        name: user.name,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin,
        town: user.town,
        locality: user.locality
    });
    await mongoose.disconnect();
}

verifyAdmin();
