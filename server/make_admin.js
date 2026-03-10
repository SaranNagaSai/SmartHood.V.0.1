const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function makeAdmin() {
    await mongoose.connect(process.env.MONGODB_URI);
    const result = await User.updateOne(
        { phone: '9398176717' },
        { isAdmin: true }
    );
    console.log('Update result:', result);
    await mongoose.disconnect();
}

makeAdmin();
