const mongoose = require('mongoose');
const User = require('./models/User'); // Adjust path if needed
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const checkProfessions = async () => {
    try {
        // Hardcode for debug
        await mongoose.connect("mongodb+srv://saran:saran123@cluster0.58lq6.mongodb.net/SmartHood?retryWrites=true&w=majority");
        console.log('MongoDB Connected');

        // const user = await User.findOne({ email: 'saran@example.com' }); 
        // Direct query to see what we have
        const users = await User.find({}).limit(5);
        if (users.length > 0) {
            const user = users[0]; // Just take first user to test logic against
            // ... rest of script using 'user' ...
            console.log(`Using user: ${user.name}, Town: ${user.town}, Locality: ${user.locality}`);

            // Check for ANY user in "Patimeeda"
            const pUsers = await User.find({ locality: /Patimeeda/i });
            console.log(`\nUsers in Patimeeda: ${pUsers.length}`);
            pUsers.forEach(u => console.log(` - ${u.name}: ${u.professionCategory} / ${u.professionDetails?.jobRole}`));
        }
        console.log(`User Town: "${user.town}", Locality: "${user.locality}"`);

        // Target localities
        const targets = [user.locality, "pedha veedhi", "Patimeeda"];
        // Regex logic from controller
        const townRegex = new RegExp(`^\\s*${user.town}\\s*$`, 'i');
        const localityRegex = targets.map(loc => new RegExp(`^\\s*${loc}\\s*$`, 'i'));

        console.log(`\nQuerying for town: /${townRegex.source}/`);
        console.log(`Querying for localities:`, localityRegex.map(r => r.source));

        const usersInTarget = await User.find({
            town: townRegex,
            locality: { $in: localityRegex }
        }).select('name locality professionCategory professionDetails');

        console.log(`\nFound ${usersInTarget.length} users in target areas:`);
        usersInTarget.forEach(u => {
            let job = "Unknown";
            if (u.professionCategory === 'Employed') job = u.professionDetails?.jobRole;
            else if (u.professionCategory === 'Business') job = u.professionDetails?.businessType;
            else if (u.professionCategory === 'Student') job = u.professionDetails?.course;
            else if (u.professionCategory === 'Homemaker') job = "Homemaker";
            else job = u.professionDetails?.description || "Other";

            console.log(`- ${u.name} (${u.locality}): ${u.professionCategory} -> ${job}`);
        });

        // Test Aggregation from Controller
        const professionStats = await User.aggregate([
            {
                $match: {
                    town: townRegex,
                    $or: localityRegex.map(locRegex => ({ locality: { $regex: locRegex } }))
                }
            },
            {
                $project: {
                    jobTitle: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$professionCategory", "Employed"] }, then: "$professionDetails.jobRole" },
                                { case: { $eq: ["$professionCategory", "Business"] }, then: "$professionDetails.businessType" },
                                { case: { $eq: ["$professionCategory", "Student"] }, then: "$professionDetails.course" },
                                { case: { $eq: ["$professionCategory", "Homemaker"] }, then: "Homemaker" }
                            ],
                            default: { $ifNull: ["$professionDetails.description", "Other"] }
                        }
                    }
                }
            },
            { $group: { _id: "$jobTitle", count: { $sum: 1 } } },
            { $match: { _id: { $ne: null } } },
            { $sort: { count: -1 } }
        ]);

        console.log('\nAggregation Result:', professionStats);

        mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

checkProfessions();
