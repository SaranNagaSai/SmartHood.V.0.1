const Locality = require('../models/Locality');
const User = require('../models/User');
const axios = require('axios');

// @desc    Get all active localities
// @route   GET /api/localities
// @access  Public

// @desc    Get all active localities with user counts
// @route   GET /api/localities
// @access  Public
const getLocalities = async (req, res) => {
    try {
        const { state, district, town } = req.query;
        let matchStage = {};

        if (state) matchStage.state = { $regex: new RegExp(`^${state}$`, 'i') };
        if (district) matchStage.district = { $regex: new RegExp(`^${district}$`, 'i') };

        if (town) {
            // Match town ignoring whitespace and case
            // e.g. "Gudivada" matches " Gudivada ", "gudivada"
            // Ensure we trim the input first so we don't build a regex like /^\s* Gudivada \s*$/ which requires spaces
            const trimmedTown = town.trim();
            matchStage.town = { $regex: new RegExp(`^\\s*${trimmedTown}\\s*$`, 'i') };
        }
        // 1. Aggregate users to find active localities and counts in this town


        const localityGroups = await User.aggregate([
            { $match: matchStage },
            {
                $group: {
                    // Group by lowercase locality name to merge "Patimeeda" and "patimeeda"
                    _id: { $toLower: "$locality" },
                    // Keep one actual display name (e.g. "Patimeeda") to show on map
                    displayName: { $first: "$locality" },
                    userCount: { $sum: 1 }
                }
            },
            { $sort: { displayName: 1 } }
        ]);


        // 2. Fetch coordinate data for these localities from the Locality collection
        // We need to match case-insensitively here too if possible, but Locality collection usually has standard names or we might miss some.
        // For now, let's try to match exactly what we have, or maybe use regex for names?
        // Since we grouped by lowercase, let's just search by the display names we found.

        const localityNames = localityGroups.map(g => g.displayName);

        // Find DB coords where name matches any of our display names (case-insensitive would be better but slower)
        // Let's rely on standard names first.
        const localityDocs = await Locality.find({
            town: { $regex: new RegExp(`^\\s*${town}\\s*$`, 'i') },
            name: { $in: localityNames.map(n => new RegExp(`^${n}$`, 'i')) }
        });

        // Create a map for quick coordinate lookup (using lowercase key for reliable matching)
        const coordMap = {};
        localityDocs.forEach(loc => {
            if (loc.coordinates) {
                coordMap[loc.name.toLowerCase()] = loc.coordinates;
            }
        });

        // 3. Merge User Counts with Coordinates
        const localitiesWithCounts = localityGroups.map(group => ({
            _id: group.displayName, // Use display name as unique ID
            name: group.displayName.charAt(0).toUpperCase() + group.displayName.slice(1), // Ensure Title Case for display
            town: town, // Use the requested town name
            userCount: group.userCount,
            // Use DB coordinates if available (lookup by lowercase ID)
            coordinates: coordMap[group._id] || null
        }));

        res.json(localitiesWithCounts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get unique states/districts/towns for filters
// @route   GET /api/localities/filters
// @access  Public
const getFilters = async (req, res) => {
    try {
        const states = await Locality.distinct('state', { isActive: true });
        const districts = await Locality.distinct('district', { isActive: true });

        // Fetch towns from both Locality collection (predefined) and Users (registered)
        const [localityTowns, userTowns] = await Promise.all([
            Locality.distinct('town', { isActive: true }),
            User.distinct('town')
        ]);

        // Combine both sources
        const allRawTowns = [...localityTowns, ...userTowns];

        // Normalize: Trim, Capitalize first letter, remove duplicates
        const uniqueTowns = [...new Set(allRawTowns.map(t =>
            t ? t.trim().charAt(0).toUpperCase() + t.trim().slice(1).toLowerCase() : t
        ))].filter(Boolean).sort();

        res.json({ states, districts, towns: uniqueTowns });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Proxy geocoding requests to Nominatim (avoids CORS on frontend)
// @route   GET /api/localities/geocode
// @access  Public
const geocodeLocality = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ message: 'Query parameter "q" is required' });
        }

        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
                q,
                format: 'json',
                limit: 5,
                countrycodes: 'in'
            },
            headers: {
                'User-Agent': 'SmartHood/1.0'
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Geocoding proxy error:', error.message);
        res.status(500).json({ message: 'Geocoding failed', error: error.message });
    }
};

module.exports = {
    getLocalities,
    getFilters,
    geocodeLocality
};
