import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useDevice } from '../context/DeviceContext';
import { ArrowLeft, Users, X, MapPin, Search, ChevronDown, Mic, Compass, Navigation2, Globe, RefreshCw } from 'lucide-react';
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
        html: `<div style="background-color: #f43f5e; color: white; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 13px; border: 3px solid white; box-shadow: 0 4px 12px rgba(244,63,94,0.4); transform: scale(${count > 0 ? 1 : 0.8}); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);">${count}</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
    });
};

// Component to handle map centering, bounds restriction, and district labels
const MapController = ({ localityPositions, townCenter, districtBounds, hasLocalities, isMobile }) => {
    const map = useMap();
    const hasFlownToTown = React.useRef('');

    // Set max bounds to restrict panning to the district
    React.useEffect(() => {
        if (districtBounds) {
            const bounds = L.latLngBounds(
                [districtBounds.minLat, districtBounds.minLng],
                [districtBounds.maxLat, districtBounds.maxLng]
            );
            map.setMaxBounds(bounds.pad(0.15)); // 15% padding
            map.options.maxBoundsViscosity = 1.0;
            map.setMinZoom(7);
        }
    }, [districtBounds, map]);

    // Step 1: When a town is first selected, fly to the town center
    React.useEffect(() => {
        if (townCenter && hasFlownToTown.current !== JSON.stringify(townCenter)) {
            hasFlownToTown.current = JSON.stringify(townCenter);
            if (isMobile) {
                map.setView(townCenter, 13);
            } else {
                map.flyTo(townCenter, 13, { duration: 2.0, easeLinearity: 0.2 });
            }
        } else if (!townCenter && districtBounds) {
            hasFlownToTown.current = '';
            const bounds = L.latLngBounds(
                [districtBounds.minLat, districtBounds.minLng],
                [districtBounds.maxLat, districtBounds.maxLng]
            );
            if (isMobile) {
                map.fitBounds(bounds, { padding: [20, 20], maxZoom: 10 });
            } else {
                map.flyToBounds(bounds, { padding: [40, 40], maxZoom: 10, duration: 2.0 });
            }
        }
    }, [townCenter, districtBounds, map, isMobile]);

    // Step 2: After localities are loaded, fit the map to show ALL locality markers
    React.useEffect(() => {
        if (!hasLocalities || !localityPositions || localityPositions.length === 0) return;

        const delay = isMobile ? 300 : 2200;
        const timer = setTimeout(() => {
            if (localityPositions.length === 1) {
                if (isMobile) {
                    map.setView(localityPositions[0], 15);
                } else {
                    map.flyTo(localityPositions[0], 15, { duration: 1.5 });
                }
            } else {
                const bounds = L.latLngBounds(localityPositions);
                if (isMobile) {
                    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
                } else {
                    map.flyToBounds(bounds, { padding: [80, 80], maxZoom: 16, duration: 1.5 });
                }
            }
        }, delay);

        return () => clearTimeout(timer);
    }, [localityPositions, hasLocalities, map, isMobile]);

    return null;
};

// ============================
// DISTRICT DATA
// ============================
const DISTRICT_DATA = {
    'anantapur': { center: [14.6819, 77.6006], bounds: { minLat: 14.0, maxLat: 15.5, minLng: 76.8, maxLng: 78.3 }, towns: { 'Anantapur': [14.6819, 77.6006], 'Hindupur': [13.8281, 77.4911], 'Dharmavaram': [14.4144, 77.7211], 'Guntakal': [15.1667, 77.3667], 'Tadipatri': [14.9078, 78.0100], 'Kadiri': [14.1200, 78.1600], 'Penukonda': [14.0816, 77.5943], 'Rayadurg': [15.6914, 76.8511], 'Kalyanadurgam': [15.1784, 77.1087] } },
    'chittoor': { center: [13.2172, 79.1003], bounds: { minLat: 12.6, maxLat: 14.1, minLng: 78.3, maxLng: 79.9 }, towns: { 'Chittoor': [13.2172, 79.1003], 'Tirupati': [13.6288, 79.4192], 'Madanapalle': [13.5500, 78.5000], 'Kuppam': [12.7490, 78.3399], 'Punganur': [13.3700, 78.5800], 'Srikalahasti': [13.7500, 79.7000], 'Pileru': [13.6555, 78.9473], 'Nagari': [13.3300, 79.5800], 'Puttur': [13.4400, 79.5500], 'Palamaner': [13.2000, 78.7500] } },
    'east godavari': { center: [17.0005, 81.8040], bounds: { minLat: 16.4, maxLat: 17.7, minLng: 81.2, maxLng: 82.6 }, towns: { 'Rajahmundry': [17.0005, 81.8040], 'Kakinada': [16.9891, 82.2475], 'Amalapuram': [16.5787, 82.0061], 'Samalkot': [17.0553, 82.1763], 'Peddapuram': [17.0781, 82.1362], 'Tuni': [17.1570, 82.5470], 'Mandapeta': [16.8603, 81.9262], 'Ramachandrapuram': [16.8367, 81.8392], 'Pithapuram': [17.1167, 82.2500], 'Prattipadu': [16.8600, 81.8400] } },
    'west godavari': { center: [16.7107, 81.0952], bounds: { minLat: 16.1, maxLat: 17.2, minLng: 80.7, maxLng: 81.9 }, towns: { 'Eluru': [16.7107, 81.0952], 'Bhimavaram': [16.5449, 81.5212], 'Tadepalligudem': [16.8261, 81.5266], 'Tanuku': [16.7566, 81.6817], 'Narsapuram': [16.4333, 81.7000], 'Palakollu': [16.5333, 81.7333], 'Kovvur': [17.0167, 81.7167], 'Jangareddygudem': [17.1167, 81.2833], 'Chintalapudi': [17.0500, 80.9833] } },
    'guntur': { center: [16.3067, 80.4365], bounds: { minLat: 15.5, maxLat: 16.8, minLng: 79.5, maxLng: 80.9 }, towns: { 'Guntur': [16.3067, 80.4365], 'Tenali': [16.2378, 80.6517], 'Narasaraopet': [16.2346, 80.0490], 'Mangalagiri': [16.4304, 80.5682], 'Sattenapalle': [16.3927, 79.9410], 'Bapatla': [15.9040, 80.4673], 'Repalle': [15.9931, 80.8284], 'Macherla': [16.4764, 79.4361], 'Vinukonda': [16.0600, 79.7400], 'Piduguralla': [16.4750, 79.8876], 'Chilakaluripet': [16.0893, 80.1665] } },
    'krishna': { center: [16.5062, 80.6480], bounds: { minLat: 15.8, maxLat: 17.0, minLng: 80.2, maxLng: 81.3 }, towns: { 'Vijayawada': [16.5062, 80.6480], 'Machilipatnam': [16.1808, 81.1176], 'Gudivada': [16.4410, 80.9926], 'Nuzvid': [16.7893, 80.8548], 'Jaggayyapeta': [16.8943, 80.0990], 'Gannavaram': [16.5400, 80.8000], 'Nandigama': [16.7725, 80.2863], 'Tiruvuru': [16.9023, 80.6086], 'Avanigadda': [16.0210, 80.9186], 'Pedana': [16.2600, 81.1400] } },
    'kurnool': { center: [15.8281, 78.0373], bounds: { minLat: 15.0, maxLat: 16.3, minLng: 77.1, maxLng: 78.8 }, towns: { 'Kurnool': [15.8281, 78.0373], 'Nandyal': [15.4800, 78.4800], 'Adoni': [15.6300, 77.2800], 'Yemmiganur': [15.7700, 77.4700], 'Dhone': [15.3930, 77.8710], 'Atmakur': [15.8800, 78.5800], 'Nandikotkur': [15.8600, 78.2700], 'Gudur': [16.0000, 77.6500], 'Allagadda': [15.1300, 78.4900] } },
    'nellore': { center: [14.4426, 79.9865], bounds: { minLat: 13.8, maxLat: 15.1, minLng: 79.3, maxLng: 80.5 }, towns: { 'Nellore': [14.4426, 79.9865], 'Kavali': [14.9142, 79.9944], 'Gudur': [14.1500, 79.8500], 'Atmakur': [14.6100, 79.6200], 'Kandukur': [15.2100, 79.9000], 'Sullurpeta': [13.7800, 80.0200], 'Venkatagiri': [13.9664, 79.5828], 'Udayagiri': [14.9200, 79.3300] } },
    'hyderabad': { center: [17.3850, 78.4867], bounds: { minLat: 17.2, maxLat: 17.6, minLng: 78.2, maxLng: 78.7 }, towns: { 'Hyderabad': [17.3850, 78.4867], 'Secunderabad': [17.4399, 78.4983], 'LB Nagar': [17.3460, 78.5575], 'Kukatpally': [17.4947, 78.3996], 'Miyapur': [17.4969, 78.3549], 'Uppal': [17.4017, 78.5594], 'Begumpet': [17.4448, 78.4713], 'Madhapur': [17.4485, 78.3908] } },
};

// Helper: find a town's coordinates + district info
const findTownInAllDistricts = (townName) => {
    if (!townName) return null;
    const lower = townName.trim().toLowerCase();
    for (const [districtKey, districtData] of Object.entries(DISTRICT_DATA)) {
        if (districtData.towns) {
            const townKey = Object.keys(districtData.towns).find(k => k.toLowerCase() === lower);
            if (townKey) {
                return { coords: districtData.towns[townKey], districtKey, districtData, townDisplayName: townKey };
            }
        }
    }
    return null;
};

const ExploreCity = () => {
    const { t } = useLanguage();
    const { isMobile } = useDevice();
    const navigate = useNavigate();

    const [localities, setLocalities] = React.useState([]);
    const [userTown, setUserTown] = React.useState('');
    const [userDistrict, setUserDistrict] = React.useState('');

    // Sidebar/Bottom Sheet State
    const [selectedLocality, setSelectedLocality] = React.useState(null);
    const [localityUsers, setLocalityUsers] = React.useState([]);
    const [loadingUsers, setLoadingUsers] = React.useState(false);

    // Town Selection State
    const [availableTowns, setAvailableTowns] = React.useState([]);
    const [townStateMap, setTownStateMap] = React.useState({});
    const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
    const [searchTown, setSearchTown] = React.useState('');
    const [isListening, setIsListening] = React.useState(false);
    const [isSelectorOpen, setIsSelectorOpen] = React.useState(false);

    const districtInfo = React.useMemo(() => {
        if (!userDistrict) return null;
        const key = userDistrict.trim().toLowerCase();
        if (DISTRICT_DATA[key]) return DISTRICT_DATA[key];
        const foundKey = Object.keys(DISTRICT_DATA).find(k => k.includes(key) || key.includes(k));
        return foundKey ? DISTRICT_DATA[foundKey] : null;
    }, [userDistrict]);

    const [townCenterCache, setTownCenterCache] = React.useState({});

    React.useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const userData = JSON.parse(localStorage.getItem('user'));
                setUserDistrict(userData?.district || '');
                const filterRes = await fetch(`${API_URL}/localities/filters`);
                const filterData = await filterRes.json();
                if (filterData.towns) setAvailableTowns(filterData.towns.sort((a, b) => a.localeCompare(b)));
                if (filterData.townStateMap) setTownStateMap(filterData.townStateMap);
            } catch (err) { console.error(err); }
        };
        fetchInitialData();
    }, []);

    const [dynamicCoords, setDynamicCoords] = React.useState({});
    const requestedLocs = React.useRef(new Set());
    const geocodeAbortRef = React.useRef(null);

    React.useEffect(() => {
        if (!userTown || localities.length === 0) return;
        if (geocodeAbortRef.current) geocodeAbortRef.current.cancelled = true;
        const abortToken = { cancelled: false };
        geocodeAbortRef.current = abortToken;

        const missingLocs = localities.filter(loc => !(loc.coordinates && loc.coordinates.lat) && !requestedLocs.current.has(loc.name));

        const fetchNext = async (index) => {
            if (index >= missingLocs.length || abortToken.cancelled) return;
            const loc = missingLocs[index];
            requestedLocs.current.add(loc.name);
            try {
                const townInfo = townStateMap[userTown] || townStateMap[userTown.charAt(0).toUpperCase() + userTown.slice(1).toLowerCase()] || {};
                const query = `${loc.name}, ${userTown}, ${townInfo.state || 'India'}, India`;
                const res = await fetch(`${API_URL}/localities/geocode?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                if (data && data.length > 0 && !abortToken.cancelled) {
                    const lat = parseFloat(data[0].lat), lon = parseFloat(data[0].lon);
                    if (lat > 6 && lat < 36 && lon > 68 && lon < 98) setDynamicCoords(prev => ({ ...prev, [loc.name]: [lat, lon] }));
                }
            } catch (err) { console.error(err); }
            if (!abortToken.cancelled) setTimeout(() => fetchNext(index + 1), 1000);
        };
        if (missingLocs.length > 0) fetchNext(0);
        return () => { abortToken.cancelled = true; };
    }, [localities, userTown, townStateMap]);

    const handleTownChange = async (townName) => {
        setUserTown(townName);
        setIsDropdownOpen(false);
        setIsSelectorOpen(false);
        setSearchTown('');
        setDynamicCoords({});
        requestedLocs.current = new Set();
        setSelectedLocality(null);
        setLocalityUsers([]);

        try {
            const token = localStorage.getItem('token');
            const locRes = await fetch(`${API_URL}/localities?town=${encodeURIComponent(townName)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const locData = await locRes.json();
            setLocalities(locData || []);
            const key = townName.toLowerCase();
            if (!townCenterCache[key]) {
                const hardcoded = findTownInAllDistricts(townName);
                if (hardcoded) setTownCenterCache(prev => ({ ...prev, [key]: hardcoded.coords }));
                else {
                    const townInfo = townStateMap[townName] || {};
                    const stateStr = townInfo.state ? `${townName}, ${townInfo.state}, India` : `${townName}, India`;
                    const geoRes = await fetch(`${API_URL}/localities/geocode?q=${encodeURIComponent(stateStr)}`);
                    const geoData = await geoRes.json();
                    if (geoData?.[0]) {
                        const lat = parseFloat(geoData[0].lat), lon = parseFloat(geoData[0].lon);
                        setTownCenterCache(prev => ({ ...prev, [key]: [lat, lon] }));
                    }
                }
            }
        } catch (err) { console.error(err); }
    };

    const startListening = () => {
        if (!('webkitSpeechRecognition' in window)) return alert("Speech recognition not supported.");
        const recognition = new window.webkitSpeechRecognition();
        recognition.lang = 'en-IN';
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            const matchedTown = availableTowns.find(town => town.toLowerCase() === transcript || town.toLowerCase().includes(transcript) || transcript.includes(town.toLowerCase()));
            if (matchedTown) handleTownChange(matchedTown);
            else alert(`Town "${transcript}" not found.`);
        };
        recognition.start();
    };

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
        } catch (err) { console.error(err); }
        setLoadingUsers(false);
    };

    const getCoordinates = React.useCallback((town, localityName) => {
        const key = town?.toLowerCase();
        let center = townCenterCache[key] || [16.5, 79.5];
        if (localityName && dynamicCoords[localityName]) return dynamicCoords[localityName];
        if (localityName) {
            let hash = 0;
            for (let i = 0; i < localityName.length; i++) hash = ((hash << 5) - hash + localityName.charCodeAt(i)) | 0;
            const angle = (Math.abs(hash) % 360) * (Math.PI / 180);
            const radius = 0.008 + (Math.abs(hash) % 50) / 5000;
            return [center[0] + Math.cos(angle) * radius, center[1] + Math.sin(angle) * radius];
        }
        return center;
    }, [dynamicCoords, townCenterCache]);

    const localityPositions = React.useMemo(() => {
        if (!userTown || localities.length === 0) return [];
        return localities.map(loc => loc.coordinates?.lat ? [loc.coordinates.lat, loc.coordinates.lng] : getCoordinates(userTown, loc.name));
    }, [localities, userTown, getCoordinates]);

    const currentTownCenter = React.useMemo(() => userTown ? townCenterCache[userTown.toLowerCase()] : null, [userTown, townCenterCache]);

    // Filter towns for search
    const filteredTowns = availableTowns.filter(t => 
        t.toLowerCase().includes(searchTown.toLowerCase())
    );

    return (
        <div className="h-screen w-full flex flex-col relative overflow-hidden bg-slate-50 font-sans">
            {/* Desktop Top Nav Overlay */}
            {!isMobile && (
                <div className={`absolute top-4 left-4 z-[1000] flex gap-3 items-center`}>
                    <button onClick={() => navigate('/home')} className="p-3 bg-white/95 backdrop-blur-md text-slate-700 rounded-2xl shadow-xl hover:bg-white transition-all active:scale-90 border border-slate-100">
                        <ArrowLeft size={18} />
                    </button>

                    <div className="relative flex-grow max-w-sm">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className={`bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 hover:bg-white transition-all border border-slate-100 group min-w-[280px]`}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg group-hover:rotate-12 transition-transform">
                                    <Compass size={18} />
                                </div>
                                <span className="font-black text-slate-800 text-[11px] uppercase tracking-[0.2em] truncate">{userTown || 'Initialize Region'}</span>
                            </div>
                            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-500 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute top-full left-0 mt-3 w-72 bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 z-[2000]">
                                <div className="p-4 border-b border-slate-50">
                                    <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-2xl">
                                        <Search size={16} className="text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="SEARCH TOWNS..."
                                            className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest w-full text-slate-700 placeholder:text-slate-300"
                                            value={searchTown}
                                            onChange={(e) => setSearchTown(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <div className="max-h-64 overflow-y-auto no-scrollbar">
                                    {filteredTowns.map((town, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleTownChange(town)}
                                            className={`w-full text-left px-6 py-4 text-[11px] font-black uppercase tracking-[0.15em] hover:bg-blue-50 transition-all flex items-center justify-between group ${userTown === town ? 'bg-blue-50/50 text-primary' : 'text-slate-500'}`}
                                        >
                                            {town}
                                            {userTown === town && <div className="w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary/30 animate-pulse"></div>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Mobile Town Selected Pill */}
            {isMobile && userTown && !isSelectorOpen && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-[340px]">
                    <div className="flex gap-2 items-center">
                        <button onClick={() => navigate('/home')} className="p-3 bg-white/95 backdrop-blur-md text-slate-700 rounded-2xl shadow-xl border border-slate-100 active:scale-95 transition-all">
                            <ArrowLeft size={18} />
                        </button>
                        <button 
                            onClick={() => setIsSelectorOpen(true)}
                            className="flex-1 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 border border-slate-100 active:scale-95 transition-all"
                        >
                            <div className="flex items-center gap-2 overflow-hidden">
                                <MapPin size={16} className="text-primary flex-shrink-0" />
                                <span className="font-black text-slate-800 text-[10px] uppercase tracking-widest truncate">{userTown}</span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase">{townStateMap[userTown]?.state || ''}</span>
                            </div>
                            <ChevronDown size={14} className="text-slate-300" />
                        </button>
                    </div>
                </div>
            )}

            {/* Mobile Full-Screen Selector */}
            {isMobile && (!userTown || isSelectorOpen) && (
                <div className="absolute inset-0 z-[2000] bg-white flex flex-col animate-in fade-in slide-in-from-bottom duration-500">
                    <div className="p-6 pb-2">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Select Town</h2>
                            {userTown && (
                                <button onClick={() => setIsSelectorOpen(false)} className="p-2 bg-slate-100 text-slate-500 rounded-full">
                                    <X size={20} />
                                </button>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-3xl border border-slate-100 shadow-inner group focus-within:border-primary transition-all">
                            <Search size={20} className="text-slate-400 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="ENTER TOWN NAME..."
                                className="bg-transparent border-none outline-none text-xs font-black uppercase tracking-[0.1em] w-full text-slate-700 placeholder:text-slate-300"
                                value={searchTown}
                                onChange={(e) => setSearchTown(e.target.value)}
                                autoFocus
                            />
                            <button 
                                onClick={startListening}
                                className={`p-2 rounded-xl transition-all ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-primary/10 text-primary'}`}
                            >
                                <Mic size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2 no-scrollbar">
                        {filteredTowns.length > 0 ? (
                            filteredTowns.map((town, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleTownChange(town)}
                                    className={`w-full flex items-center justify-between p-5 rounded-3xl transition-all ${userTown === town ? 'bg-primary/5 border-2 border-primary/20 shadow-lg' : 'bg-slate-50/50 border border-slate-100 active:scale-[0.98]'}`}
                                >
                                    <div className="text-left">
                                        <p className={`font-black uppercase tracking-widest ${userTown === town ? 'text-primary text-sm' : 'text-slate-800 text-xs'}`}>{town}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{townStateMap[town]?.state || 'Registered Node'}</p>
                                    </div>
                                    <div className={`p-2 rounded-xl ${userTown === town ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-slate-100 text-slate-300'}`}>
                                        <Navigation2 size={16} className={userTown === town ? '' : 'rotate-45'} />
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="text-center py-20 flex flex-col items-center">
                                <Search size={48} className="text-slate-200 mb-4" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No towns found matching "{searchTown}"</p>
                            </div>
                        )}
                    </div>
                    
                    {!userTown && (
                        <div className="p-6 border-t border-slate-50">
                            <button onClick={() => navigate('/home')} className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                                <ArrowLeft size={14} /> Back to Dashboard
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Desktop Landing Overlay (No Town Selected) */}
            {!isMobile && !userTown && (
                <div className="absolute inset-0 z-[1100] bg-slate-900/40 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
                    <div className="bg-white p-10 md:p-14 rounded-[3.5rem] shadow-2xl max-w-lg w-full relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl -mr-10 -mt-10"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-50/50 rounded-full blur-2xl -ml-6 -mb-6"></div>

                        <div className="relative z-10">
                            <div className="w-20 h-20 bg-gradient-brand rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-2xl rotate-3 group-hover:rotate-12 transition-transform duration-700">
                                <Globe size={40} className="text-white animate-pulse" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-4 uppercase">Discovery Hub</h2>
                            <p className="text-slate-500 text-xs font-black uppercase tracking-[0.3em] mb-10 opacity-70">Synchronize Regional Capability</p>

                            <div className="flex flex-col gap-4 max-w-sm mx-auto">
                                <button
                                    onClick={() => setIsDropdownOpen(true)}
                                    className="flex items-center justify-between bg-slate-50 px-8 py-5 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-2xl hover:border-blue-200 transition-all duration-500 active:scale-95 group/btn shadow-inner"
                                >
                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest group-hover/btn:text-slate-800 transition-colors">Select Regional Node...</span>
                                    <Navigation2 size={20} className="text-slate-300 group-hover/btn:text-primary transition-colors rotate-45" />
                                </button>

                                <div className="flex items-center gap-3">
                                    <div className="h-px flex-1 bg-slate-100"></div>
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Node Input</span>
                                    <div className="h-px flex-1 bg-slate-100"></div>
                                </div>

                                <button
                                    onClick={startListening}
                                    className={`flex items-center justify-center gap-4 py-5 rounded-3xl font-black text-[11px] uppercase tracking-widest transition-all duration-500 shadow-xl ${isListening ? 'bg-rose-500 text-white animate-pulse scale-105' : 'bg-primary text-white hover:shadow-primary/20 hover:-translate-y-1'}`}
                                >
                                    <Mic size={20} className={isListening ? 'animate-bounce' : ''} />
                                    {isListening ? 'Intercepting Voice...' : 'Voice Command Initiation'}
                                </button>
                            </div>

                            <div className="mt-12 pt-8 border-t border-slate-50">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Trending Locations</p>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {availableTowns.slice(0, 5).map(town => (
                                        <button key={town} onClick={() => handleTownChange(town)} className="px-4 py-2 bg-slate-50 hover:bg-blue-50 hover:text-primary rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-slate-100">
                                            {town}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Map Container */}
            <div className="flex-1 w-full h-full z-0">
                <MapContainer
                    center={userTown ? (currentTownCenter || [16.5, 79.5]) : [20.5937, 78.9629]}
                    zoom={userTown ? 12 : 5}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                    className="leaflet-modern"
                >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OSM' />
                    <MapController
                        localityPositions={localityPositions}
                        townCenter={currentTownCenter}
                        districtBounds={districtInfo?.bounds || null}
                        hasLocalities={localities.length > 0}
                        isMobile={isMobile}
                    />

                    {userTown && localities.map((loc, idx) => {
                        const pos = loc.coordinates?.lat ? [loc.coordinates.lat, loc.coordinates.lng] : getCoordinates(userTown, loc.name);
                        const hasUsers = loc.userCount > 0;
                        return (
                            <React.Fragment key={idx}>
                                <Circle center={pos} radius={800} pathOptions={{ color: hasUsers ? '#f43f5e' : '#3b82f6', fillColor: hasUsers ? '#f43f5e' : '#3b82f6', fillOpacity: 0.1, weight: 1.5, dashArray: '5, 5' }} />
                                <Marker position={pos} icon={createCountIcon(loc.userCount)} eventHandlers={{ click: () => fetchLocalityUsers(loc.name) }}>
                                    <Popup className="premium-popup">
                                        <div className="text-center p-2 min-w-[120px]">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Locality Node</p>
                                            <h4 className="text-sm font-black text-slate-800 uppercase mb-3">{loc.name}</h4>
                                            <div className="bg-slate-50 p-2 rounded-xl mb-3">
                                                <p className="text-2xl font-black text-primary leading-none">{loc.userCount}</p>
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Personnel</p>
                                            </div>
                                            <button onClick={() => fetchLocalityUsers(loc.name)} className="w-full py-2 bg-gradient-brand text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg active:scale-95">Open Terminal</button>
                                        </div>
                                    </Popup>
                                </Marker>
                            </React.Fragment>
                        );
                    })}
                </MapContainer>
            </div>

            {/* Adaptive Sidebar/Bottom-Sheet */}
            {selectedLocality && (
                <div
                    className={`fixed inset-0 z-[1500] bg-slate-900/20 backdrop-blur-sm flex justify-end transition-opacity duration-300 ${isMobile ? 'items-end' : 'items-center'}`}
                    onClick={(e) => e.target === e.currentTarget && setSelectedLocality(null)}
                >
                    <div
                        className={`bg-white shadow-2xl h-full flex flex-col relative animate-in ${isMobile ? 'w-full h-[85vh] rounded-t-[3rem] slide-in-from-bottom duration-500' : 'w-[420px] m-4 rounded-[3rem] slide-in-from-right duration-500'}`}
                        onClick={e => e.stopPropagation()}
                    >
                        {isMobile && <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mt-4 mb-2"></div>}

                        <div className="p-8 pb-4 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">Locality Analysis</p>
                                <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">{selectedLocality}</h2>
                                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">{localityUsers.length} Neighbors Identified</p>
                            </div>
                            <button onClick={() => setSelectedLocality(null)} className="p-4 hover:bg-slate-50 rounded-[1.5rem] text-slate-400 transition-colors border border-transparent hover:border-slate-100">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar pt-4">
                            {loadingUsers ? (
                                <div className="flex flex-col items-center justify-center h-64 text-slate-300">
                                    <RefreshCw size={48} className="animate-spin opacity-20 mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Scanning Network...</p>
                                </div>
                            ) : localityUsers.length > 0 ? (
                                <div className="space-y-4">
                                    {localityUsers.map((user) => (
                                        <div key={user.uniqueId} className="p-5 bg-slate-50/50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-2xl transition-all duration-300 group cursor-pointer relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-2 h-full bg-slate-200 group-hover:bg-primary transition-colors"></div>
                                            <div className="flex items-center gap-5">
                                                <div className="w-16 h-16 bg-white rounded-2xl p-1 shadow-lg group-hover:rotate-6 transition-transform">
                                                    {user.profilePhoto ? (
                                                        <img src={getProfilePhotoUrl(user.profilePhoto)} alt="" className="w-full h-full rounded-xl object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center font-black text-xl">
                                                            {user.name.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-black text-slate-800 uppercase tracking-tight truncate group-hover:text-primary transition-colors">{user.name}</h4>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 mb-2">{user.professionCategory}</p>
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg">
                                                            <MapPin size={10} />
                                                            <span className="text-[9px] font-black tracking-tighter">NODE-{user.uniqueId.slice(-4)}</span>
                                                        </div>
                                                        <span className="text-[10px] font-black text-emerald-500">+{user.impactScore} IMPACT</span>
                                                    </div>
                                                </div>
                                                <ChevronRight className="text-slate-200 group-hover:text-primary transition-colors translate-x-4 group-hover:translate-x-0 opacity-0 group-hover:opacity-100" size={20} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border-4 border-dashed border-slate-100">
                                    <Users size={48} className="mx-auto mb-4 opacity-10 text-slate-400" />
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">No Active Personnel Found</p>
                                </div>
                            )}
                        </div>

                        <div className="p-8 pt-4 border-t border-slate-50 bg-slate-50/20 backdrop-blur-md rounded-b-[3rem] sticky bottom-0">
                            <button className="w-full py-5 bg-gradient-brand text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all active:scale-95 flex items-center justify-center gap-3">
                                <PlusSquare size={18} />
                                Request Interlink
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const PlusSquare = ({ size, className }) => <Users size={size} className={className} />;
const ChevronRight = ({ size, className }) => <Navigation2 size={size} className={`${className} rotate-90`} />;

export default ExploreCity;
