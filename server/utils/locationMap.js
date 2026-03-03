/**
 * Bilingual Location & Entity Mapping for SmartHood
 * Supports bidirectional translation and normalization for cross-language community matching.
 */

const locationMap = {
    // States
    "Andhra Pradesh": "ఆంధ్రప్రదేశ్",
    "Telangana": "తెలంగాణ",
    "Karnataka": "కర్ణాటక",
    "Tamil Nadu": "తమిళనాడు",
    "Kerala": "కేరళ",
    "Maharashtra": "మహారాష్ట్ర",

    // Districts
    "Krishna": "కృష్ణా",
    "NTR": "ఎన్టీఆర్",
    "Eluru": "ఏలూరు",
    "West Godavari": "పశ్చిమ గోదావరి",
    "East Godavari": "తూర్పు గోదావరి",
    "Guntur": "గుంటూరు",
    "Visakhapatnam": "విశాఖపట్నం",
    "Hyderabad": "హైదరాబాద్",
    "Anantapur": "అనంతపురం",
    "Chittoor": "చిత్తూరు",
    "Kurnool": "కర్నూలు",
    "Nellore": "నెల్లూరు",

    // Towns / Cities
    "Gudivada": "గుడివాడ",
    "Vijayawada": "విజయవాడ",
    "Guntur": "గుంటూరు",
    "Eluru": "ఏలూరు",
    "Bhimavaram": "భీమవరం",
    "Hindupur": "హిందూపురం",
    "Dharmavaram": "ధర్మవరం",
    "Guntakal": "గుంతకల్",
    "Tadipatri": "తాడిపత్రి",
    "Kadiri": "కదిరి",
    "Penukonda": "పెనుకొండ",
    "Rayadurg": "రాయదుర్గం",
    "Kalyanadurgam": "కళ్యాణదుర్గం",
    "Tirupati": "తిరుపతి",
    "Madanapalle": "మదనపల్లె",
    "Kuppam": "కుప్పం",
    "Punganur": "పుంగనూరు",
    "Srikalahasti": "శ్రీకాళహస్తి",
    "Pileru": "పిలేరు",
    "Nagari": "నగరి",
    "Puttur": "పుత్తూరు",
    "Palamaner": "పలమనేరు",
    "Rajahmundry": "రాజమండ్రి",
    "Kakinada": "కాకినాడ",
    "Amalapuram": "అమలాపురం",
    "Samalkot": "సామర్లకోట",
    "Peddapuram": "పెద్దాపురం",
    "Tuni": "తుని",
    "Mandapeta": "మండపేట",
    "Ramachandrapuram": "రామచంద్రాపురం",
    "Pithapuram": "పిఠాపురం",
    "Prattipadu": "ప్రత్తిపాడు",
    "Tadepalligudem": "తాడేపల్లిగూడెం",
    "Tanuku": "తణుకు",
    "Narsapuram": "నరసాపురం",
    "Palakollu": "పాలకొల్లు",
    "Kovvur": "కొవ్వూరు",
    "Jangareddygudem": "జంగారెడ్డిగూడెం",
    "Chintalapudi": "చింతలపూడి",
    "Tenali": "తెనాలి",
    "Narasaraopet": "నరసరావుపేట",
    "Mangalagiri": "మంగళగిరి",
    "Sattenapalle": "సత్తెనపల్లి",
    "Bapatla": "బాపట్ల",
    "Repalle": "రేపల్లె",
    "Macherla": "మాచర్ల",
    "Vinukonda": "వినుకొండ",
    "Piduguralla": "పిడుగురాళ్ల",
    "Chilakaluripet": "చిలకలూరిపేట",
    "Machilipatnam": "మచిలీపట్నం",
    "Nuzvid": "నూజివీడు",
    "Jaggayyapeta": "జగ్గయ్యపేట",
    "Gannavaram": "గన్నవరం",
    "Nandigama": "నందిగామ",
    "Tiruvuru": "తిరువూరు",
    "Avanigadda": "అవనిగడ్డ",
    "Pedana": "పెడన",
    "Nandyal": 'నంద్యాల',
    "Adoni": 'ఆదోని',
    "Yemmiganur": 'ఎమ్మిగనూరు',
    "Dhone": 'డోన్',
    "Atmakur": 'ఆత్మకూరు',
    "Nandikotkur": 'నందికొట్కూరు',
    "Allagadda": 'ఆళ్లగడ్డ',
    "Kavali": 'కావలి',
    "Kandukur": 'కందుకూరు',
    "Sullurpeta": 'సూళ్లూరుపేట',
    "Venkatagiri": 'వెంకటగిరి',
    "Udayagiri": 'ఉదయగిరి',
    "Secunderabad": 'సికింద్రాబాద్',
    "LB Nagar": 'ఎల్బీ నగర్',
    "Kukatpally": 'కూకట్‌పల్లి',
    "Miyapur": 'మియాపూర్',
    "Uppal": 'ఉప్పల్',
    "Begumpet": 'బేగంపేట',
    "Madhapur": 'మాదాపూర్',

    // Localities
    "Patimeeda": "పాటిమీద",
    "Ramalayam Area": "రామాలయం ఏరియా",
    "Railway Station Road": "రైల్వే స్టేషన్ రోడ్డు",
    "Bus Stand Area": "బస్ స్టాండ్ ఏరియా",
    "Market Yard": "మార్కెట్ యార్డ్"
};

// Inverse Map for Telugu -> English lookup
const inverseMap = Object.entries(locationMap).reduce((acc, [en, te]) => {
    acc[te] = en;
    return acc;
}, {});

/**
 * Normalizes a location string to English for database queries.
 * @param {string} text - The location name in English or Telugu.
 */
const normalizeToEnglish = (text) => {
    if (!text) return "";
    const trimmed = text.trim();

    // Check if it's already in the inverse map (Telugu -> English)
    if (inverseMap[trimmed]) return inverseMap[trimmed];

    // Case-insensitive check for English values
    const foundEn = Object.keys(locationMap).find(key => key.toLowerCase() === trimmed.toLowerCase());
    if (foundEn) return foundEn;

    return trimmed; // Fallback to original
};

/**
 * Translates an English location to Telugu.
 */
const translateToTelugu = (text) => {
    if (!text) return "";
    const trimmed = text.trim();
    if (locationMap[trimmed]) return locationMap[trimmed];

    // Case-insensitive check
    const foundEn = Object.keys(locationMap).find(key => key.toLowerCase() === trimmed.toLowerCase());
    if (foundEn) return locationMap[foundEn];

    return trimmed;
};

module.exports = { normalizeToEnglish, translateToTelugu, locationMap };
