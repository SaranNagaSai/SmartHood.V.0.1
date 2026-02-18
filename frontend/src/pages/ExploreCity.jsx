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
        html: `<div style="background-color: #ef4444; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; border: 2px solid white; box-shadow: 0 2px 4px rgba[0,0,0,0.2);">${count}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15] // Center it
    });
};

// Component to handle map centering and bounds
const MapUpdater = ({ centers }) => {
    const map = useMap();
    React.useEffect(() => {
        if (centers && centers.length > 0) {
            // Create bounds from all points
            const bounds = L.latLngBounds(centers);
            map.flyToBounds(bounds, {
                padding: [50, 50],
                maxZoom: 14,
                duration: 1.5
            });
        }
    }, [centers, map]);
    return null;
};

const ExploreCity = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();

    const [localities, setLocalities] = React.useState([]);
    const [userTown, setUserTown] = React.useState('');
    // We'll derive positions instead of just a single center
    // const [mapCenter, setMapCenter] = React.useState([20.5937, 78.9629]); 

    // Sidebar State
    const [selectedLocality, setSelectedLocality] = React.useState(null);
    const [localityUsers, setLocalityUsers] = React.useState([]);
    const [loadingUsers, setLoadingUsers] = React.useState(false);

    // Town Selection State
    const [availableTowns, setAvailableTowns] = React.useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
    const [searchTown, setSearchTown] = React.useState('');
    const [isListening, setIsListening] = React.useState(false);

    React.useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const token = localStorage.getItem('token');
                const userData = JSON.parse(localStorage.getItem('user'));

                // Fetch Available Towns
                const filterRes = await fetch(`${API_URL}/localities/filters`);
                const filterData = await filterRes.json();

                if (filterData.towns) {
                    // Sort towns alphabetically
                    const sortedTowns = filterData.towns.sort((a, b) => a.localeCompare(b));
                    setAvailableTowns(sortedTowns);
                } else {
                }

                // Initial User Town selection is now manual, unless we want to pre-fill but not activate
                // For now, we want the user to explicitly select to see the flow.
                // We can optionally set it if we want to skip the selection step for returning users, 
                // but the requirement says "initially keep the whole map... then user selects".
                // So we will NOT auto-select from localStorage here, or we can just set it but keeping a flag for "view mode".
                // Let's stick to the requirement: "initially keep the whole map".
                // So we won't set userTown automatically.

            } catch (err) {
                console.error("[ExploreCity] Failed to fetch initial data", err);
            }
        };
        fetchInitialData();
    }, []);

    // Dynamic Geocoding State
    const [dynamicCoords, setDynamicCoords] = React.useState({});
    const requestedLocs = React.useRef(new Set());

    // AP & Telangana Geographic Bounds for validation
    const AP_TELANGANA_BOUNDS = React.useMemo(() => ({
        minLat: 12.6, maxLat: 19.9,
        minLng: 76.8, maxLng: 84.8
    }), []);

    // Comprehensive Town Centers for Andhra Pradesh & Telangana
    const townCenters = React.useMemo(() => ({
        'Hyderabad': [17.3850, 78.4867],
        'Warangal': [17.9689, 79.5941],
        'Nizamabad': [18.6725, 78.0941],
        'Karimnagar': [18.4386, 79.1288],
        'Khammam': [17.2473, 80.1514],
        'Mahbubnagar': [16.7488, 77.9882],
        'Nalgonda': [17.0577, 79.2678],
        'Adilabad': [19.6640, 78.5310],
        'Suryapet': [17.1417, 79.6186],
        'Siddipet': [18.1018, 78.8529],
        'Medak': [18.0500, 78.2667],
        'Sangareddy': [17.6147, 78.0833],
        'Ramagundam': [18.7550, 79.4740],
        'Miryalaguda': [16.8770, 79.5663],
        'Vijayawada': [16.5062, 80.6480],
        'Visakhapatnam': [17.6868, 83.2185],
        'Guntur': [16.3067, 80.4365],
        'Nellore': [14.4426, 79.9865],
        'Kurnool': [15.8281, 78.0373],
        'Rajahmundry': [17.0005, 81.8040],
        'Tirupati': [13.6288, 79.4192],
        'Kakinada': [16.9891, 82.2475],
        'Kadapa': [14.4673, 78.8242],
        'Anantapur': [14.6819, 77.6006],
        'Eluru': [16.7107, 81.0952],
        'Ongole': [15.5057, 80.0499],
        'Machilipatnam': [16.1808, 81.1176],
        'Tenali': [16.2378, 80.6517],
        'Srikakulam': [18.3005, 83.8967],
        'Vizianagaram': [18.1067, 83.3956],
        'Chittoor': [13.2172, 79.1003],
        'Anakapalle': [17.6896, 83.0024],
        'Bhimavaram': [16.5449, 81.5212],
        'Madanapalle': [13.5500, 78.5000],
        'Nandyal': [15.4800, 78.4800],
        'Adoni': [15.6300, 77.2800],
        'Gudivada': [16.4410, 80.9926],
        'Tadepalligudem': [16.8261, 81.5266],
        'Tanuku': [16.7566, 81.6817],
        'Palakollu': [16.5333, 81.7333],
        'Narsapuram': [16.4333, 81.7000],
        'Amalapuram': [16.5787, 82.0061],
        'Kavali': [14.9142, 79.9944],
        'Chirala': [15.8239, 80.3522],
        'Hindupur': [13.8281, 77.4911],
        'Proddatur': [14.7502, 78.5482],
        'Narasaraopet': [16.2346, 80.0490],
        'Dharmavaram': [14.4144, 77.7211],
        'Gudur': [14.1500, 79.8500],
        'Tadipatri': [14.9078, 78.0100],
        'Guntakal': [15.1667, 77.3667]
    }), []);

    const preciseSpots = React.useMemo(() => ({
        // Hyderabad Localities
        'Kukatpally': [17.4875, 78.4010],
        'Madhapur': [17.4483, 78.3915],
        'Gachibowli': [17.4401, 78.3489],
        'Uppal': [17.3984, 78.5583],
        'Banjara Hills': [17.4123, 78.4087],

        // Vijayawada Localities
        'Benz Circle': [16.5002, 80.6535],
        'Patamata': [16.4950, 80.6700],
        'Moghalrajpuram': [16.5100, 80.6500],
        'Governorpet': [16.5070, 80.6200],
        'Labbipet': [16.5150, 80.6250],
        'Bhavanipuram': [16.5200, 80.6400],
        'Autonagar': [16.5300, 80.6100],
        'Gunadala': [16.4900, 80.6300],
        'Kankipadu': [16.4350, 80.7100],
        'Nunna': [16.5600, 80.7200],
        'Gannavaram': [16.5400, 80.8000],

        // Gudivada and Nearby Localities (Krishna District)
        'Ventrapragada': [16.4300, 80.9800],
        'Mudinepalli': [16.4500, 80.9700],
        'Pedapalem': [16.4200, 81.0100],
        'Kaikaluru': [16.5500, 81.2100],
        'Mandavalli': [16.4600, 80.9500],
        'Gudlavalleru': [16.3500, 81.0500],
        'Bantumilli': [16.4100, 81.0300],
        'Pamarru': [16.3100, 80.9600],
        'Pedana': [16.2600, 81.1400],
        'Avanigadda': [16.0200, 80.9200],
        'Patimeeda': [16.4361, 80.9867],

        // Eluru and Nearby Localities (West Godavari)
        'Denduluru': [16.7800, 81.1200],
        'Dwaraka Tirumala': [16.8100, 81.0800],
        'Jangareddygudem': [17.1200, 81.7400],
        'Kovvur': [17.0200, 81.7300],
        'Nidadavole': [16.9100, 81.6700],
        'Akividu': [16.5800, 81.3800],
        'Undi': [16.5200, 81.4300],
        'Attili': [16.7000, 81.6000],
        'Ganapavaram': [16.6200, 81.3500],

        // Guntur and Nearby Localities
        'Mangalagiri': [16.4300, 80.5700],
        'Ponnuru': [16.0700, 80.5500],
        'Bapatla': [15.9050, 80.4670],
        'Sattenapalle': [16.3950, 80.1500],
        'Vinukonda': [16.0530, 79.7400],
        'Gurazala': [16.5700, 79.5900],
        'Macherla': [16.4800, 79.4300],
        'Piduguralla': [16.4700, 79.8900],
        'Repalle': [16.0200, 80.8300],

        // Rajahmundry and East Godavari
        'Rajahmundry': [17.0005, 81.8040],
        'Kakinada': [16.9891, 82.2475],
        'Tuni': [17.3500, 82.5500],
        'Peddapuram': [17.0800, 82.1400],
        'Samalkot': [17.0500, 82.1700],
        'Mandapeta': [16.8600, 81.9300],
        'Ramachandrapuram': [16.8400, 82.0300],

        // Visakhapatnam Localities
        'MVP Colony': [17.7300, 83.3300],
        'Gajuwaka': [17.6900, 83.2100],
        'Siripuram': [17.7200, 83.3100],
        'Madhurawada': [17.7800, 83.3900],
        'Rushikonda': [17.7900, 83.3800],
        'Dwaraka Nagar': [17.7200, 83.3200]
    }), []);

    // Effect to identify missing coords and fetch them
    React.useEffect(() => {
        if (!userTown || localities.length === 0) return;

        const missingLocs = localities.filter(loc => {
            // Check if we already have it in DB, Hardcoded, or Dynamic
            if (loc.coordinates && loc.coordinates.lat) return false;
            if (preciseSpots[loc.name]) return false;
            if (dynamicCoords[loc.name]) return false;
            if (requestedLocs.current.has(loc.name)) return false; // Already requested
            return true;
        });

        const fetchNext = async (index) => {
            if (index >= missingLocs.length) return;
            const loc = missingLocs[index];
            requestedLocs.current.add(loc.name);

            try {
                const telanganaDistricts = ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam',
                    'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Suryapet', 'Siddipet', 'Medak', 'Sangareddy', 'Ramagundam', 'Miryalaguda'];
                const state = telanganaDistricts.includes(userTown) ? 'Telangana' : 'Andhra Pradesh';

                const query = `${loc.name}, ${userTown}, ${state}, India`;
                const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=3&countrycodes=in`);
                const data = await res.json();

                if (data && data.length > 0) {
                    for (const result of data) {
                        const lat = parseFloat(result.lat);
                        const lon = parseFloat(result.lon);

                        if (lat >= AP_TELANGANA_BOUNDS.minLat && lat <= AP_TELANGANA_BOUNDS.maxLat &&
                            lon >= AP_TELANGANA_BOUNDS.minLng && lon <= AP_TELANGANA_BOUNDS.maxLng) {
                            setDynamicCoords(prev => ({ ...prev, [loc.name]: [lat, lon] }));

                            break;
                        }
                    }
                }
            } catch (err) {
                console.error("Geocoding failed for", loc.name, err);
            }

            // Delay next request to be nice to API (1.2s delay)
            setTimeout(() => fetchNext(index + 1), 1200);
        };

        if (missingLocs.length > 0) {
            fetchNext(0);
        }
    }, [localities, userTown, preciseSpots, dynamicCoords]);


    const handleTownChange = async (townName) => {
        setUserTown(townName);
        setIsDropdownOpen(false);
        setSearchTown('');
        // Clear previous town's dynamic requests to avoid mixup
        // requestedLocs.current.clear(); // Optional: keep cache if they switch back

        try {
            const token = localStorage.getItem('token');
            // Fetch localities for the selected town
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


            // Simple fuzzy match
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

    // Debug log


    const fetchLocalityUsers = async (localityName) => {
        setLoadingUsers(true);
        setSelectedLocality(localityName);
        try {
            const token = localStorage.getItem('token');
            // Pass the currently selected town (userTown) to the API
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

    // Helper to get coordinates (Seeded Data + Dynamic + Fallback)
    const getCoordinates = React.useCallback((town, localityName) => {
        // Case-insensitive lookup for Town Center
        const townKey = Object.keys(townCenters).find(key => key.toLowerCase() === town?.toLowerCase());
        const center = townKey ? townCenters[townKey] : [20.5937, 78.9629];

        // 1. Precise Hardcoded Spot
        if (localityName && preciseSpots[localityName]) return preciseSpots[localityName];

        // 2. Dynamic Geocoded Spot (with bounds validation)
        if (localityName && dynamicCoords[localityName]) {
            const [dLat, dLng] = dynamicCoords[localityName];
            const withinBounds = dLat >= AP_TELANGANA_BOUNDS.minLat && dLat <= AP_TELANGANA_BOUNDS.maxLat &&
                dLng >= AP_TELANGANA_BOUNDS.minLng && dLng <= AP_TELANGANA_BOUNDS.maxLng;
            const nearTown = Math.abs(dLat - center[0]) < 0.15 && Math.abs(dLng - center[1]) < 0.15;

            if (withinBounds && nearTown) {
                return dynamicCoords[localityName];
            }
        }

        // 3. Fallback Scatter
        if (localityName) {
            // Deterministic random scatter around the town center
            const hash = localityName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const latOffset = (hash % 100 - 50) / 1000;
            const lngOffset = (hash % 100 - 50) / 1000;
            return [center[0] + latOffset, center[1] + lngOffset];
        }

        return center;
    }, [townCenters, preciseSpots, dynamicCoords]);

    // Memoize locality positions for map
    const localityPositions = React.useMemo(() => {
        if (!userTown) return [];
        // If no localities, show town center
        if (localities.length === 0) {
            const center = getCoordinates(userTown);
            return [center];
        }
        return localities.map(loc => {
            if (loc.coordinates && loc.coordinates.lat && loc.coordinates.lng) {
                return [loc.coordinates.lat, loc.coordinates.lng];
            }
            return getCoordinates(userTown, loc.name);
        });
    }, [localities, userTown, getCoordinates]);

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
                            <span className="font-bold text-gray-800">{userTown || 'Select Town'}</span>
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
                                    {/* Optional: Search inside dropdown if list is long */}
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
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-500 opacity-50 border border-blue-500"></span>
                        <span className="text-xs text-gray-600">No Users Yet</span>
                    </div>
                </div>
            )}

            {/* Main Map */}
            <div className="flex-1 w-full h-full z-0">
                {/* Map centered on AP & Telangana region initially */}
                <MapContainer center={[16.5, 79.5]} zoom={7} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Only update map center/bounds if a town is selected */}
                    {userTown && <MapUpdater centers={localityPositions} />}

                    {/* Only show markers if a town is selected */}
                    {userTown && localities.map((loc, idx) => {
                        // Prioritize API coordinates if available
                        let position;
                        if (loc.coordinates && loc.coordinates.lat && loc.coordinates.lng) {
                            position = [loc.coordinates.lat, loc.coordinates.lng];
                        } else {
                            position = getCoordinates(userTown, loc.name);
                        }

                        const hasUsers = loc.userCount > 0;

                        return (
                            <React.Fragment key={idx}>
                                {/* Area Highlight Circle */}
                                <Circle
                                    center={position}
                                    radius={800} // 800 meters radius
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
                                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 flex items-center justify-center font-bold text-xl overflow-hidden border border-blue-100 flex-shrink-0">
                                                {user.profilePhoto ? (
                                                    <img
                                                        src={getProfilePhotoUrl(user.profilePhoto)}
                                                        alt="User"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    user.name.charAt(0)
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-gray-800 text-sm">{user.name}</h4>
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

