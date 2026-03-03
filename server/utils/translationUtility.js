/**
 * Bilingual Contextual Translation for SmartHood Notifications & UI
 */
const { locationMap } = require('./locationMap');

const dictionary = {
    // Service Types
    "plumber": "ప్లంబర్",
    "electrician": "ఎలక్ట్రీషియన్",
    "carpenter": "వడ్రంగి",
    "mechanic": "మెకానిక్",
    "doctor": "వైద్యుడు",
    "teacher": "ఉపాధ్యాయుడు",
    "software engineer": "సాఫ్ట్‌వేర్ ఇంజనీర్",
    "merchant": "వ్యాపారి",
    "student": "విద్యార్థి",
    "homemaker": "గృహిణి",
    "laborer": "కార్మికుడు",
    "technician": "టెక్నీషియన్",

    // Alert Categories & Subtypes
    "emergency": "అత్యవసరం",
    "official": "అధికారిక",
    "welfare": "సంక్షేమం",
    "entertainment": "వినోదం",
    "blood donation": "రక్తదానం",
    "accident": "ప్రమాదం",
    "cash donation": "నగదు విరాళం",
    "weather alert": "వాతావరణ హెచ్చరిక",
    "climate alert": "వాతావరణ హెచ్చరిక",
    "theft": "దొంగతనం",
    "general alert": "సాధారణ హెచ్చరిక",

    // Action verbs & common phrases
    "need help": "సహాయం కావాలి",
    "help request": "సహాయం అభ్యర్థన",
    "service offer": "సర్వీస్ ఆఫర్",
    "urgent": "అత్యవసరం",
    "available": "అందుబాటులో ఉంది",
    "looking for": "కోసం వెతుకుతున్నాను",
    "interested": "ఆసక్తి ఉంది",
    "posted": "పోస్ట్ చేశారు",

    // Location components (merging from locationMap)
    ...locationMap
};

// Create the inverse dictionary (Telugu -> English)
const inverseDictionary = Object.entries(dictionary).reduce((acc, [en, te]) => {
    acc[te] = en;
    return acc;
}, {});

/**
 * Intelligent word-by-word or phrase translation (best effort)
 * @param {string} text - The source text
 * @param {string} targetLang - 'English' or 'Telugu'
 */
const translateText = (text, targetLang) => {
    if (!text) return "";
    const lang = targetLang || 'English';
    const dict = lang === 'Telugu' ? dictionary : inverseDictionary;

    // 1. Check for exact phrase match
    const exactMatch = Object.keys(dict).find(k => k.toLowerCase() === text.trim().toLowerCase());
    if (exactMatch) return dict[exactMatch];

    // 2. Fragment-based translation (split into words/segments)
    // This is simple but better than nothing for "Plumber Patimeeda"
    const segments = text.split(/(\s+|,|\.|;|:|!|\?)/);
    const translatedSegments = segments.map(seg => {
        const trimmed = seg.trim();
        if (!trimmed) return seg; // Whitespace/Punctuation

        // Match word
        const wordMatch = Object.keys(dict).find(k => k.toLowerCase() === trimmed.toLowerCase());
        return wordMatch ? dict[wordMatch] : seg;
    });

    return translatedSegments.join('');
};

module.exports = { translateText };
