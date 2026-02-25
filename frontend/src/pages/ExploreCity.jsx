import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { ArrowLeft, Users, X, MapPin, Search, ChevronDown, Mic } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { API_URL, SERVER_URL, getProfilePhotoUrl } from '../utils/apiConfig';

// Fix for default marker icon in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom DivIcon for User Counts
const createCountIcon = (count) => {
    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #ef4444; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">${count}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });
};

// Custom DivIcon for Town Name Labels
const createTownLabelIcon = (townName) => {
    return L.divIcon({
        className: 'town-label-icon',
        html: `<div style="
            background: linear-gradient(135deg, #1e40af, #3b82f6);
            color: white;
            padding: 4px 10px;
            border-radius: 8px;
            font-weight: 700;
            font-size: 11px;
            white-space: nowrap;
            box-shadow: 0 2px 8px rgba(30,64,175,0.35);
            border: 1.5px solid rgba(255,255,255,0.5);
            letter-spacing: 0.5px;
            text-transform: uppercase;
        ">${townName}</div>`,
        iconSize: [100, 24],
        iconAnchor: [50, 12]
    });
};

// Component to handle map centering, bounds restriction, and district labels
const MapController = ({ localityPositions, townCenter, districtBounds, hasLocalities }) => {
    const map = useMap();
    const hasFlownToTown = React.useRef('');

    // Set max bounds to restrict panning to the district
    React.useEffect(() => {
        if (districtBounds) {
            const bounds = L.latLngBounds(
                [districtBounds.minLat, districtBounds.minLng],
                [districtBounds.maxLat, districtBounds.maxLng]
            );
            map.setMaxBounds(bounds.pad(0.1)); // 10% padding for smooth edge navigation
            map.options.maxBoundsViscosity = 1.0;
            map.setMinZoom(8);
        }
    }, [districtBounds, map]);

    // Step 1: When a town is first selected, fly to the town center
    React.useEffect(() => {
        if (townCenter && hasFlownToTown.current !== JSON.stringify(townCenter)) {
            hasFlownToTown.current = JSON.stringify(townCenter);
            map.flyTo(townCenter, 13, {
                duration: 1.2,
                easeLinearity: 0.25
            });
        } else if (!townCenter && districtBounds) {
            // No town selected — show the whole district
            hasFlownToTown.current = '';
            const bounds = L.latLngBounds(
                [districtBounds.minLat, districtBounds.minLng],
                [districtBounds.maxLat, districtBounds.maxLng]
            );
            map.flyToBounds(bounds, {
                padding: [30, 30],
                maxZoom: 11,
                duration: 1.5
            });
        }
    }, [townCenter, districtBounds, map]);

    // Step 2: After localities are loaded, fit the map to show ALL locality markers
    React.useEffect(() => {
        if (!hasLocalities || !localityPositions || localityPositions.length === 0) return;

        // Small delay to let the initial town fly complete
        const timer = setTimeout(() => {
            if (localityPositions.length === 1) {
                map.flyTo(localityPositions[0], 14, { duration: 1 });
            } else {
                const bounds = L.latLngBounds(localityPositions);
                map.flyToBounds(bounds, {
                    padding: [60, 60],
                    maxZoom: 15,
                    duration: 1.2
                });
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, [localityPositions, hasLocalities, map]);

    return null;
};

// ============================
// DISTRICT DATA: Bounds + Towns + Centers
// ============================
const DISTRICT_DATA = {
    // === ANDHRA PRADESH DISTRICTS ===
    'anantapur': {
        center: [14.6819, 77.6006],
        bounds: { minLat: 14.0, maxLat: 15.5, minLng: 76.8, maxLng: 78.3 },
        towns: {
            'Anantapur': [14.6819, 77.6006], 'Hindupur': [13.8281, 77.4911], 'Dharmavaram': [14.4144, 77.7211],
            'Guntakal': [15.1667, 77.3667], 'Tadipatri': [14.9078, 78.0100], 'Kadiri': [14.1200, 78.1600],
            'Penukonda': [14.0816, 77.5943], 'Rayadurg': [15.6914, 76.8511], 'Kalyanadurgam': [15.1784, 77.1087],
        }
    },
    'chittoor': {
        center: [13.2172, 79.1003],
        bounds: { minLat: 12.6, maxLat: 14.1, minLng: 78.3, maxLng: 79.9 },
        towns: {
            'Chittoor': [13.2172, 79.1003], 'Tirupati': [13.6288, 79.4192], 'Madanapalle': [13.5500, 78.5000],
            'Kuppam': [12.7490, 78.3399], 'Punganur': [13.3700, 78.5800], 'Srikalahasti': [13.7500, 79.7000],
            'Pileru': [13.6555, 78.9473], 'Nagari': [13.3300, 79.5800], 'Puttur': [13.4400, 79.5500],
            'Palamaner': [13.2000, 78.7500],
        }
    },
    'east godavari': {
        center: [17.0005, 81.8040],
        bounds: { minLat: 16.4, maxLat: 17.7, minLng: 81.2, maxLng: 82.6 },
        towns: {
            'Rajahmundry': [17.0005, 81.8040], 'Kakinada': [16.9891, 82.2475], 'Amalapuram': [16.5787, 82.0061],
            'Samalkot': [17.0553, 82.1763], 'Peddapuram': [17.0781, 82.1362], 'Tuni': [17.1570, 82.5470],
            'Mandapeta': [16.8603, 81.9262], 'Ramachandrapuram': [16.8367, 81.8392],
            'Pithapuram': [17.1167, 82.2500], 'Prattipadu': [16.8600, 81.8400],
        }
    },
    'west godavari': {
        center: [16.7107, 81.0952],
        bounds: { minLat: 16.1, maxLat: 17.2, minLng: 80.7, maxLng: 81.9 },
        towns: {
            'Eluru': [16.7107, 81.0952], 'Bhimavaram': [16.5449, 81.5212], 'Tadepalligudem': [16.8261, 81.5266],
            'Tanuku': [16.7566, 81.6817], 'Narsapuram': [16.4333, 81.7000], 'Palakollu': [16.5333, 81.7333],
            'Narasapuram': [16.4333, 81.7000], 'Kovvur': [17.0167, 81.7167], 'Jangareddygudem': [17.1167, 81.2833],
            'Chintalapudi': [17.0500, 80.9833],
        }
    },
    'guntur': {
        center: [16.3067, 80.4365],
        bounds: { minLat: 15.5, maxLat: 16.8, minLng: 79.5, maxLng: 80.9 },
        towns: {
            'Guntur': [16.3067, 80.4365], 'Tenali': [16.2378, 80.6517], 'Narasaraopet': [16.2346, 80.0490],
            'Mangalagiri': [16.4304, 80.5682], 'Sattenapalle': [16.3927, 79.9410], 'Bapatla': [15.9040, 80.4673],
            'Repalle': [15.9931, 80.8284], 'Macherla': [16.4764, 79.4361], 'Vinukonda': [16.0600, 79.7400],
            'Piduguralla': [16.4750, 79.8876], 'Chilakaluripet': [16.0893, 80.1665],
        }
    },
    'krishna': {
        center: [16.5062, 80.6480],
        bounds: { minLat: 15.8, maxLat: 17.0, minLng: 80.2, maxLng: 81.3 },
        towns: {
            'Vijayawada': [16.5062, 80.6480], 'Machilipatnam': [16.1808, 81.1176], 'Gudivada': [16.4410, 80.9926],
            'Nuzvid': [16.7893, 80.8548], 'Jaggayyapeta': [16.8943, 80.0990], 'Gannavaram': [16.5400, 80.8000],
            'Nandigama': [16.7725, 80.2863], 'Tiruvuru': [16.9023, 80.6086], 'Avanigadda': [16.0210, 80.9186],
            'Pedana': [16.2600, 81.1400],
        }
    },
    'kurnool': {
        center: [15.8281, 78.0373],
        bounds: { minLat: 15.0, maxLat: 16.3, minLng: 77.1, maxLng: 78.8 },
        towns: {
            'Kurnool': [15.8281, 78.0373], 'Nandyal': [15.4800, 78.4800], 'Adoni': [15.6300, 77.2800],
            'Yemmiganur': [15.7700, 77.4700], 'Dhone': [15.3930, 77.8710], 'Atmakur': [15.8800, 78.5800],
            'Nandikotkur': [15.8600, 78.2700], 'Gudur': [16.0000, 77.6500], 'Allagadda': [15.1300, 78.4900],
        }
    },
    'nellore': {
        center: [14.4426, 79.9865],
        bounds: { minLat: 13.8, maxLat: 15.1, minLng: 79.3, maxLng: 80.5 },
        towns: {
            'Nellore': [14.4426, 79.9865], 'Kavali': [14.9142, 79.9944], 'Gudur': [14.1500, 79.8500],
            'Atmakur': [14.6100, 79.6200], 'Kandukur': [15.2100, 79.9000], 'Sullurpeta': [13.7800, 80.0200],
            'Venkatagiri': [13.9664, 79.5828], 'Udayagiri': [14.9200, 79.3300],
        }
    },
    'ongole': {
        center: [15.5057, 80.0499],
        bounds: { minLat: 15.0, maxLat: 16.0, minLng: 79.3, maxLng: 80.5 },
        towns: {
            'Ongole': [15.5057, 80.0499], 'Chirala': [15.8239, 80.3522], 'Markapur': [15.7400, 79.2700],
            'Kandukur': [15.2100, 79.9000], 'Darsi': [15.7700, 79.6800], 'Addanki': [15.8100, 79.9700],
        }
    },
    'kadapa': {
        center: [14.4673, 78.8242],
        bounds: { minLat: 13.8, maxLat: 15.2, minLng: 78.0, maxLng: 79.5 },
        towns: {
            'Kadapa': [14.4673, 78.8242], 'Proddatur': [14.7502, 78.5482], 'Rajampet': [14.1891, 79.1612],
            'Jammalamadugu': [14.8500, 78.3800], 'Mydukur': [14.7300, 78.7300], 'Badvel': [14.7400, 79.0600],
            'Pulivendla': [15.1730, 78.2267], 'Yerraguntla': [14.6336, 78.5391],
        }
    },
    'srikakulam': {
        center: [18.3005, 83.8967],
        bounds: { minLat: 17.9, maxLat: 19.0, minLng: 83.3, maxLng: 84.6 },
        towns: {
            'Srikakulam': [18.3005, 83.8967], 'Palasa': [18.7700, 84.4100], 'Tekkali': [18.6000, 84.2300],
            'Narasannapeta': [18.4136, 84.0445], 'Amadalavalasa': [18.4100, 83.9000],
            'Rajam': [18.4500, 83.6500], 'Ichapuram': [19.1167, 84.6833],
        }
    },
    'visakhapatnam': {
        center: [17.6868, 83.2185],
        bounds: { minLat: 17.2, maxLat: 18.3, minLng: 82.5, maxLng: 83.8 },
        towns: {
            'Visakhapatnam': [17.6868, 83.2185], 'Anakapalle': [17.6896, 83.0024], 'Narsipatnam': [17.6678, 82.6114],
            'Yelamanchili': [17.5500, 82.8600], 'Bheemunipatnam': [17.8900, 83.4500],
            'Paderu': [18.0700, 82.6700], 'Araku Valley': [18.3300, 82.8800],
        }
    },
    'vizianagaram': {
        center: [18.1067, 83.3956],
        bounds: { minLat: 17.7, maxLat: 18.7, minLng: 82.8, maxLng: 84.0 },
        towns: {
            'Vizianagaram': [18.1067, 83.3956], 'Bobbili': [18.5700, 83.3600], 'Parvathipuram': [18.7800, 83.4200],
            'Rajam': [18.4500, 83.6500], 'Salur': [18.5186, 83.2078], 'Nellimarla': [18.1600, 83.4400],
        }
    },

    // === TELANGANA DISTRICTS ===
    'hyderabad': {
        center: [17.3850, 78.4867],
        bounds: { minLat: 17.2, maxLat: 17.6, minLng: 78.2, maxLng: 78.7 },
        towns: {
            'Hyderabad': [17.3850, 78.4867], 'Secunderabad': [17.4399, 78.4983],
            'LB Nagar': [17.3460, 78.5575], 'Kukatpally': [17.4947, 78.3996],
            'Miyapur': [17.4969, 78.3549], 'Uppal': [17.4017, 78.5594],
            'Begumpet': [17.4448, 78.4713], 'Madhapur': [17.4485, 78.3908],
        }
    },
    'rangareddy': {
        center: [17.2543, 78.3870],
        bounds: { minLat: 16.8, maxLat: 17.5, minLng: 77.8, maxLng: 78.8 },
        towns: {
            'Shamshabad': [17.2483, 78.4300], 'Chevella': [17.3200, 78.1400],
            'Ibrahimpatnam': [17.1433, 78.6094], 'Shadnagar': [17.0700, 78.1700],
            'Maheshwaram': [17.1200, 78.4400], 'Moinabad': [17.3200, 78.2800],
        }
    },
    'medchal-malkajgiri': {
        center: [17.5400, 78.4800],
        bounds: { minLat: 17.3, maxLat: 17.8, minLng: 78.3, maxLng: 78.7 },
        towns: {
            'Medchal': [17.6300, 78.4800], 'Kompally': [17.5400, 78.4800],
            'Alwal': [17.5000, 78.5100], 'Boduppal': [17.4200, 78.5900],
        }
    },
    'warangal': {
        center: [17.9716, 79.5946],
        bounds: { minLat: 17.5, maxLat: 18.5, minLng: 79.0, maxLng: 80.1 },
        towns: {
            'Warangal': [17.9716, 79.5946], 'Hanamkonda': [17.9850, 79.5650],
            'Kazipet': [17.9722, 79.5333], 'Jangaon': [17.7275, 79.1527],
            'Mahabubabad': [17.5964, 80.0014], 'Narsampet': [17.9284, 79.8894],
        }
    },
    'karimnagar': {
        center: [18.4386, 79.1288],
        bounds: { minLat: 17.9, maxLat: 19.0, minLng: 78.5, maxLng: 79.7 },
        towns: {
            'Karimnagar': [18.4386, 79.1288], 'Jagtial': [18.7900, 78.9100], 'Huzurabad': [18.4000, 79.3900],
            'Peddapalli': [18.6175, 79.3834], 'Manthani': [18.6481, 79.6595],
            'Ramagundam': [18.7584, 79.4794], 'Godavarikhani': [18.7528, 79.5013],
        }
    },
    'nizamabad': {
        center: [18.6725, 78.0941],
        bounds: { minLat: 18.1, maxLat: 19.2, minLng: 77.4, maxLng: 78.6 },
        towns: {
            'Nizamabad': [18.6725, 78.0941], 'Bodhan': [18.6600, 77.8900], 'KamaReddy': [18.3100, 78.3400],
            'Armoor': [18.7900, 78.2800], 'Banswada': [18.3856, 77.8746],
        }
    },
    'khammam': {
        center: [17.2473, 80.1514],
        bounds: { minLat: 16.6, maxLat: 17.9, minLng: 79.5, maxLng: 80.9 },
        towns: {
            'Khammam': [17.2473, 80.1514], 'Kothagudem': [17.5500, 80.6200], 'Sathupalli': [17.2500, 80.8600],
            'Madhira': [16.9230, 80.3700], 'Wyra': [17.1900, 80.3400], 'Bhadrachalam': [17.6688, 80.8889],
        }
    },
    'nalgonda': {
        center: [17.0577, 79.2684],
        bounds: { minLat: 16.5, maxLat: 17.5, minLng: 78.7, maxLng: 79.8 },
        towns: {
            'Nalgonda': [17.0577, 79.2684], 'Miryalaguda': [16.8741, 79.5663], 'Suryapet': [17.1436, 79.6238],
            'Devarakonda': [16.6890, 79.0016], 'Bhongir': [17.5180, 78.8850],
        }
    },
    'mahbubnagar': {
        center: [16.7428, 77.9892],
        bounds: { minLat: 15.9, maxLat: 17.2, minLng: 77.2, maxLng: 78.6 },
        towns: {
            'Mahbubnagar': [16.7428, 77.9892], 'Wanaparthy': [16.3600, 78.0600], 'Gadwal': [16.2300, 77.5900],
            'Nagarkurnool': [16.4911, 78.3095], 'Kollapur': [16.1100, 78.3200],
            'Achampet': [16.3917, 78.5500],
        }
    },
    'adilabad': {
        center: [19.6641, 78.5320],
        bounds: { minLat: 18.8, maxLat: 19.9, minLng: 77.7, maxLng: 79.5 },
        towns: {
            'Adilabad': [19.6641, 78.5320], 'Nirmal': [19.1000, 78.3400], 'Mancherial': [18.8754, 79.4444],
            'Luxettipet': [18.8600, 79.2700], 'Bellampalli': [19.0600, 79.4900],
            'Utnoor': [19.3600, 78.8100],
        }
    },
    'medak': {
        center: [18.0469, 78.2618],
        bounds: { minLat: 17.5, maxLat: 18.5, minLng: 77.5, maxLng: 78.8 },
        towns: {
            'Medak': [18.0469, 78.2618], 'Sangareddy': [17.6133, 78.0833], 'Siddipet': [18.1018, 78.8520],
            'Zaheerabad': [17.6800, 77.6100], 'Narayankhed': [17.8800, 77.8200],
            'Toguta': [18.1200, 78.5000],
        }
    },
};

// Helper: find a town's coordinates + district info from ALL districts
const findTownInAllDistricts = (townName) => {
    if (!townName) return null;
    const lower = townName.trim().toLowerCase();
    for (const [districtKey, districtData] of Object.entries(DISTRICT_DATA)) {
        if (districtData.towns) {
            const townKey = Object.keys(districtData.towns).find(k => k.toLowerCase() === lower);
            if (townKey) {
                return {
                    coords: districtData.towns[townKey],
                    districtKey,
                    districtData,
                    townDisplayName: townKey
                };
            }
        }
    }
    return null;
};

const ExploreCity = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();

    const [localities, setLocalities] = React.useState([]);
    const [userTown, setUserTown] = React.useState('');
    const [userDistrict, setUserDistrict] = React.useState('');

    // Sidebar State
    const [selectedLocality, setSelectedLocality] = React.useState(null);
    const [localityUsers, setLocalityUsers] = React.useState([]);
    const [loadingUsers, setLoadingUsers] = React.useState(false);

    // Town Selection State
    const [availableTowns, setAvailableTowns] = React.useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
    const [searchTown, setSearchTown] = React.useState('');
    const [isListening, setIsListening] = React.useState(false);

    // District data derived from user's registered info (for map bounds restriction ONLY)
    const districtInfo = React.useMemo(() => {
        if (!userDistrict) return null;
        const key = userDistrict.trim().toLowerCase();
        if (DISTRICT_DATA[key]) return DISTRICT_DATA[key];
        const foundKey = Object.keys(DISTRICT_DATA).find(k =>
            k.includes(key) || key.includes(k)
        );
        return foundKey ? DISTRICT_DATA[foundKey] : null;
    }, [userDistrict]);

    // District data for the CURRENTLY SELECTED town (for coordinate resolution)
    const selectedTownInfo = React.useMemo(() => {
        if (!userTown) return null;
        return findTownInAllDistricts(userTown);
    }, [userTown]);

    // Get town markers for the current district (for showing town names on map)
    const districtTownMarkers = React.useMemo(() => {
        if (!districtInfo || !districtInfo.towns) return [];
        return Object.entries(districtInfo.towns).map(([name, coords]) => ({
            name,
            position: coords
        }));
    }, [districtInfo]);

    React.useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const token = localStorage.getItem('token');
                const userData = JSON.parse(localStorage.getItem('user'));

                // Read user's district (used ONLY for map bounds restriction)
                const registeredDistrict = userData?.district || '';
                setUserDistrict(registeredDistrict);

                // Fetch ALL Available Towns from server (no district filtering)
                const filterRes = await fetch(`${API_URL}/localities/filters`);
                const filterData = await filterRes.json();

                if (filterData.towns) {
                    const sortedTowns = filterData.towns.sort((a, b) => a.localeCompare(b));
                    setAvailableTowns(sortedTowns);
                }
            } catch (err) {
                console.error("[ExploreCity] Failed to fetch initial data", err);
            }
        };
        fetchInitialData();
    }, []);

    // Dynamic Geocoding State
    const [dynamicCoords, setDynamicCoords] = React.useState({});
    const requestedLocs = React.useRef(new Set());
    const geocodeAbortRef = React.useRef(null);

    // Effect to geocode missing localities within district constraints
    // NOTE: dynamicCoords is NOT in the dependency array to avoid infinite loops.
    // We use requestedLocs ref to track what's already been requested.
    React.useEffect(() => {
        if (!userTown || localities.length === 0) return;

        // Cancel any previous geocode chain when town changes
        if (geocodeAbortRef.current) geocodeAbortRef.current.cancelled = true;
        const abortToken = { cancelled: false };
        geocodeAbortRef.current = abortToken;

        const missingLocs = localities.filter(loc => {
            if (loc.coordinates && loc.coordinates.lat) return false;
            if (requestedLocs.current.has(loc.name)) return false;
            return true;
        });

        const fetchNext = async (index) => {
            if (index >= missingLocs.length || abortToken.cancelled) return;
            const loc = missingLocs[index];
            requestedLocs.current.add(loc.name);

            try {
                // Use the SELECTED town's district for geocoding, not the user's registered district
                const townInfo = findTownInAllDistricts(userTown);
                const townDistrictName = townInfo ? townInfo.districtKey : '';
                const townBounds = townInfo ? townInfo.districtData.bounds : null;

                // Determine state from the town's district bounds
                let state = 'Andhra Pradesh';
                if (townBounds && (townBounds.maxLat > 18.5 || townBounds.minLng < 79)) {
                    state = 'Telangana';
                }

                const query = `${loc.name}, ${userTown}, ${townDistrictName} district, ${state}, India`;
                const res = await fetch(`${API_URL}/localities/geocode?q=${encodeURIComponent(query)}`);
                const data = await res.json();

                if (data && data.length > 0 && !abortToken.cancelled) {
                    // Validate against the TOWN's district bounds (or accept any Indian result if no bounds)
                    for (const result of data) {
                        const lat = parseFloat(result.lat);
                        const lon = parseFloat(result.lon);

                        if (townBounds) {
                            // Check if within the town's district bounds (with some padding)
                            if (lat >= townBounds.minLat - 0.2 && lat <= townBounds.maxLat + 0.2 &&
                                lon >= townBounds.minLng - 0.2 && lon <= townBounds.maxLng + 0.2) {
                                setDynamicCoords(prev => ({ ...prev, [loc.name]: [lat, lon] }));
                                break;
                            }
                        } else {
                            // No bounds info — accept if it's in India (rough check)
                            if (lat > 8 && lat < 35 && lon > 68 && lon < 98) {
                                setDynamicCoords(prev => ({ ...prev, [loc.name]: [lat, lon] }));
                                break;
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Geocoding failed for", loc.name, err);
            }

            if (!abortToken.cancelled) {
                setTimeout(() => fetchNext(index + 1), 1000);
            }
        };

        if (missingLocs.length > 0) {
            fetchNext(0);
        }

        return () => { abortToken.cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [localities, userTown, districtInfo, userDistrict]);


    const handleTownChange = async (townName) => {
        setUserTown(townName);
        setIsDropdownOpen(false);
        setSearchTown('');

        try {
            const token = localStorage.getItem('token');
            const locRes = await fetch(`${API_URL}/localities?town=${encodeURIComponent(townName)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const locData = await locRes.json();
            setLocalities(locData || []);
        } catch (err) {
            console.error("Failed to fetch localities for town", err);
        }
    };

    const startListening = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert("Speech recognition is not supported in this browser.");
            return;
        }

        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-IN';
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase();

            const matchedTown = availableTowns.find(town =>
                town.toLowerCase() === transcript ||
                town.toLowerCase().includes(transcript) ||
                transcript.includes(town.toLowerCase())
            );

            if (matchedTown) {
                handleTownChange(matchedTown);
            } else {
                alert(`Town "${transcript}" not found. Please try again.`);
            }
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
        };

        recognition.start();
    };

    // Filter towns based on search
    const filteredTowns = availableTowns.filter(town =>
        town.toLowerCase().includes(searchTown.toLowerCase())
    );

    const fetchLocalityUsers = async (localityName) => {
        setLoadingUsers(true);
        setSelectedLocality(localityName);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/users/locality/${encodeURIComponent(localityName)}?town=${encodeURIComponent(userTown)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setLocalityUsers(data || []);
        } catch (err) {
            console.error("Failed to fetch users", err);
        }
        setLoadingUsers(false);
    };

    // Helper to get coordinates - searches ALL districts for town center, not just user's
    const getCoordinates = React.useCallback((town, localityName) => {
        // Find town center from ALL district data
        let center = [16.5, 79.5]; // Default fallback
        const townInfo = findTownInAllDistricts(town);
        if (townInfo) {
            center = townInfo.coords;
        }

        // 1. Dynamic Geocoded Spot (always accept — already validated during geocoding)
        if (localityName && dynamicCoords[localityName]) {
            return dynamicCoords[localityName];
        }

        // 2. Fallback Scatter around town center — spread them out more clearly
        if (localityName) {
            let hash = 0;
            for (let i = 0; i < localityName.length; i++) {
                hash = ((hash << 5) - hash + localityName.charCodeAt(i)) | 0;
            }
            const angle = (Math.abs(hash) % 360) * (Math.PI / 180);
            const radius = 0.008 + (Math.abs(hash) % 50) / 5000;
            const latOffset = Math.cos(angle) * radius;
            const lngOffset = Math.sin(angle) * radius;
            return [center[0] + latOffset, center[1] + lngOffset];
        }

        return center;
    }, [dynamicCoords]);

    // Memoize locality positions for map — each locality gets a resolved coordinate
    const localityPositions = React.useMemo(() => {
        if (!userTown) return [];
        if (localities.length === 0) return [];
        return localities.map(loc => {
            if (loc.coordinates && loc.coordinates.lat && loc.coordinates.lng) {
                return [loc.coordinates.lat, loc.coordinates.lng];
            }
            return getCoordinates(userTown, loc.name);
        });
    }, [localities, userTown, getCoordinates]);

    // Get town center for flying to — searches ALL districts
    const currentTownCenter = React.useMemo(() => {
        if (!userTown) return null;
        const townInfo = findTownInAllDistricts(userTown);
        return townInfo ? townInfo.coords : null;
    }, [userTown]);

    return (
        <div className="h-screen w-full flex flex-col relative overflow-hidden bg-gray-50">
            {/* Navbar Overlay */}
            <div className="absolute top-4 left-4 z-[1000] flex gap-3 items-start">
                <button onClick={() => navigate('/home')} className="p-3 bg-white text-gray-700 rounded-full shadow-lg hover:bg-gray-50 transition">
                    <ArrowLeft size={20} />
                </button>

                <div className="relative">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 hover:bg-gray-50 transition min-w-[200px] justify-between"
                    >
                        <div className="flex items-center gap-2">
                            <MapPin size={18} className="text-primary" />
                            <span className="font-bold text-gray-800 text-sm">{userTown || 'Select Town'}</span>
                        </div>
                        <ChevronDown size={16} className={`text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-60 overflow-y-auto">
                            <div className="p-2 border-b">
                                <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                                    <Search size={14} className="text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search town..."
                                        className="bg-transparent border-none outline-none text-sm w-full text-gray-700 placeholder:text-gray-400"
                                        value={searchTown}
                                        onChange={(e) => {
                                            setSearchTown(e.target.value);
                                            if (!isDropdownOpen) setIsDropdownOpen(true);
                                        }}
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="max-h-60 overflow-y-auto">
                                {filteredTowns.length > 0 ? (
                                    filteredTowns.map((town, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleTownChange(town)}
                                            className={`w-full text-left px-4 py-3 text-sm hover:bg-blue-50 transition flex items-center justify-between ${userTown === town ? 'bg-blue-50 text-primary font-medium' : 'text-gray-600'}`}
                                        >
                                            {town}
                                            {userTown === town && <div className="w-2 h-2 rounded-full bg-primary"></div>}
                                        </button>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-xs text-gray-400">
                                        No towns found
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Town Selection Overlay (visible when no town selected) */}
            {!userTown && (
                <div className="absolute inset-0 z-[900] bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center animate-in fade-in zoom-in-95 duration-300">
                        <MapPin size={48} className="mx-auto text-primary mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Explore Your City</h2>
                        <p className="text-gray-500 mb-6">Select your town to discover local communities and resources.</p>

                        <div className="relative text-left max-w-sm mx-auto">
                            <div className="flex gap-2">
                                {/* Dropdown Trigger */}
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex-1 flex items-center justify-between gap-2 bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 hover:border-primary/50 hover:bg-white transition-all text-gray-700"
                                >
                                    <span className={searchTown ? "text-gray-800" : "text-gray-400"}>
                                        {searchTown || "Select your town..."}
                                    </span>
                                    <ChevronDown size={20} className={`text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Mic Button */}
                                <button
                                    onClick={startListening}
                                    className={`p-3 rounded-xl border transition-all ${isListening
                                        ? 'bg-red-50 border-red-200 text-red-500 animate-pulse ring-2 ring-red-100'
                                        : 'bg-gray-50 border-gray-200 text-gray-500 hover:text-primary hover:border-primary/50 hover:bg-white'
                                        }`}
                                    title="Speak to search"
                                >
                                    <Mic size={20} />
                                </button>
                            </div>

                            {/* Dropdown Content */}
                            {isDropdownOpen && (
                                <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden max-h-60 overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="p-2 sticky top-0 bg-white border-b z-10">
                                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                                            <Search size={14} className="text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Filter towns..."
                                                className="bg-transparent border-none outline-none text-sm w-full text-gray-700 placeholder:text-gray-400"
                                                value={searchTown}
                                                onChange={(e) => setSearchTown(e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    <div className="py-1">
                                        {filteredTowns.length > 0 ? (
                                            filteredTowns.map((town, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleTownChange(town)}
                                                    className="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 text-gray-600 hover:text-primary transition flex items-center justify-between group"
                                                >
                                                    {town}
                                                    {userTown === town && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-xs text-gray-400">No towns found</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex flex-wrap justify-center gap-2">
                            {availableTowns.slice(0, 4).map((town) => (
                                <button
                                    key={town}
                                    onClick={() => handleTownChange(town)}
                                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-600 transition"
                                >
                                    {town}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Legend */}
            {userTown && (
                <div className="absolute bottom-4 right-4 z-[1000] bg-white p-3 rounded-xl shadow-lg border border-gray-100 animate-in slide-in-from-bottom duration-500">
                    <h4 className="text-xs font-bold text-gray-700 mb-2">Map Legend</h4>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-3 h-3 rounded-full bg-red-500 opacity-50 border border-red-500"></span>
                        <span className="text-xs text-gray-600">Active Users</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-3 h-3 rounded-full bg-blue-500 opacity-50 border border-blue-500"></span>
                        <span className="text-xs text-gray-600">No Users Yet</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded bg-gradient-to-r from-blue-800 to-blue-500 border border-white shadow-sm"></span>
                        <span className="text-xs text-gray-600">Town Labels</span>
                    </div>

                </div>
            )}

            {/* Main Map */}
            <div className="flex-1 w-full h-full z-0">
                <MapContainer
                    center={districtInfo ? districtInfo.center : [16.5, 79.5]}
                    zoom={districtInfo ? 10 : 7}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Map Controller - handles bounds restriction, flying to town, etc. */}
                    <MapController
                        localityPositions={localityPositions}
                        townCenter={currentTownCenter}
                        districtBounds={districtInfo?.bounds || null}
                        hasLocalities={localities.length > 0}
                    />

                    {/* Town Name Labels on Map */}
                    {districtTownMarkers.map((marker, idx) => (
                        <Marker
                            key={`town-label-${idx}`}
                            position={marker.position}
                            icon={createTownLabelIcon(marker.name)}
                            eventHandlers={{
                                click: () => handleTownChange(marker.name),
                            }}
                        >
                            <Popup>
                                <div className="text-center cursor-pointer" onClick={() => handleTownChange(marker.name)}>
                                    <strong className="block text-primary text-sm">{marker.name}</strong>
                                    <div className="text-xs text-blue-500 mt-1">Click to explore</div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}

                    {/* Locality markers - only shown when a town is selected */}
                    {userTown && localities.map((loc, idx) => {
                        let position;
                        if (loc.coordinates && loc.coordinates.lat && loc.coordinates.lng) {
                            position = [loc.coordinates.lat, loc.coordinates.lng];
                        } else {
                            position = getCoordinates(userTown, loc.name);
                        }

                        const hasUsers = loc.userCount > 0;

                        return (
                            <React.Fragment key={idx}>
                                <Circle
                                    center={position}
                                    radius={800}
                                    pathOptions={{
                                        color: hasUsers ? '#ef4444' : '#3b82f6',
                                        fillColor: hasUsers ? '#ef4444' : '#3b82f6',
                                        fillOpacity: 0.1,
                                        weight: 1
                                    }}
                                />

                                <Marker
                                    position={position}
                                    icon={createCountIcon(loc.userCount)}
                                    eventHandlers={{
                                        click: () => fetchLocalityUsers(loc.name),
                                    }}
                                >
                                    <Popup>
                                        <div className="text-center cursor-pointer" onClick={() => fetchLocalityUsers(loc.name)}>
                                            <strong className="block text-primary">{loc.name}</strong>
                                            <div className="text-sm text-gray-600 font-medium">{loc.userCount} Users</div>
                                            <div className="text-xs text-blue-500 mt-1">Click to view</div>
                                        </div>
                                    </Popup>
                                </Marker>
                            </React.Fragment>
                        );
                    })}
                </MapContainer>
            </div>

            {/* Sidebar / Drawer for Users */}
            {selectedLocality && (
                <div className={`absolute top-0 right-0 h-full w-full md:w-96 bg-white shadow-2xl z-[1001] transition-transform duration-300 transform ${selectedLocality ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="p-4 h-full flex flex-col">
                        {/* Sidebar Header */}
                        <div className="flex items-center justify-between mb-6 pb-4 border-b">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">{selectedLocality}</h2>
                                <p className="text-sm text-gray-500">{localityUsers.length} Neighbors Found</p>
                            </div>
                            <button onClick={() => setSelectedLocality(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                                <X size={24} />
                            </button>
                        </div>

                        {/* User List */}
                        <div className="flex-1 overflow-y-auto pr-2">
                            {loadingUsers ? (
                                <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-400">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    <p>Loading neighbors...</p>
                                </div>
                            ) : localityUsers.length > 0 ? (
                                <div className="space-y-3">
                                    {localityUsers.map((user) => (
                                        <div key={user.uniqueId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-blue-50/50 transition border border-gray-100">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {user.profilePhoto ? (
                                                        <img
                                                            src={getProfilePhotoUrl(user.profilePhoto)}
                                                            alt=""
                                                            className="w-6 h-6 rounded-full object-cover border border-blue-100 shadow-sm"
                                                        />
                                                    ) : (
                                                        <div className="w-6 h-6 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center text-[10px] font-bold">
                                                            {user.name.charAt(0)}
                                                        </div>
                                                    )}
                                                    <h4 className="font-bold text-gray-800 text-sm">{user.name}</h4>
                                                </div>
                                                <p className="text-xs text-gray-500">{user.professionCategory}</p>
                                                {user.professionDetails?.jobRole && (
                                                    <p className="text-[10px] text-gray-400">{user.professionDetails.jobRole}</p>
                                                )}
                                                {user.phone && (
                                                    <p className="text-[10px] font-bold text-blue-500 mt-1">{user.phone}</p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                                    {user.impactScore} IS
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                    <Users size={32} className="mx-auto mb-2 opacity-50" />
                                    <p>No active users in this area yet.</p>
                                    <p className="text-xs mt-1">Be the first!</p>
                                </div>
                            )}
                        </div>

                        {/* Footer Action */}
                        <div className="mt-4 pt-4 border-t">
                            <button className="w-full py-3 bg-primary text-white rounded-xl font-bold shadow-md hover:shadow-lg transition">
                                Connect with Neighbors
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExploreCity;
