const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function checkUser() {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({
        $or: [
            { email: 'smarthoodc03@gmail.com' },
            { phone: '9398176717' },
            { phone: '+19398176717' },
            { phone: '+919398176717' }
        ]
    });
    console.log('User found:', user ? {
        name: user.name,
        phone: user.phone,
        town: user.town,
        locality: user.locality,
        isAdmin: user.isAdmin
    } : 'Not found');
    await mongoose.disconnect();
}

checkUser();
