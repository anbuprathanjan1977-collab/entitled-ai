# List of all Indian States and Union Territories with districts mapping
ALL_INDIAN_STATES = [
    {"code": "TN", "name_en": "Tamil Nadu", "name_ta": "தமிழ்நாடு", "name_hi": "तमिलनाडु"},
    {"code": "KA", "name_en": "Karnataka", "name_ta": "கர்நாடகா", "name_hi": "कर्नाटक"},
    {"code": "AP", "name_en": "Andhra Pradesh", "name_ta": "ஆந்திரப் பிரதேசம்", "name_hi": "आंध्र प्रदेश"},
    {"code": "TS", "name_en": "Telangana", "name_ta": "தெலுங்கானா", "name_hi": "तेलंगाना"},
    {"code": "KL", "name_en": "Kerala", "name_ta": "கேரளா", "name_hi": "केरल"},
    {"code": "MH", "name_en": "Maharashtra", "name_ta": "மகாராஷ்டிரா", "name_hi": "महाराष्ट्र"},
    {"code": "DL", "name_en": "Delhi", "name_ta": "டெல்லி", "name_hi": "दिल्ली"},
    {"code": "UP", "name_en": "Uttar Pradesh", "name_ta": "உத்தரப் பிரதேசம்", "name_hi": "उत्तर प्रदेश"},
    {"code": "WB", "name_en": "West Bengal", "name_ta": "மேற்கு வங்காளம்", "name_hi": "पश्चिम बंगाल"},
    {"code": "GJ", "name_en": "Gujarat", "name_ta": "குஜராத்", "name_hi": "गुजरात"},
    {"code": "RJ", "name_en": "Rajasthan", "name_ta": "ராஜஸ்தான்", "name_hi": "राजस्थान"},
    {"code": "MP", "name_en": "Madhya Pradesh", "name_ta": "மத்தியப் பிரதேசம்", "name_hi": "मध्य प्रदेश"},
    {"code": "BR", "name_en": "Bihar", "name_ta": "பீகார்", "name_hi": "बिहार"},
    {"code": "OD", "name_en": "Odisha", "name_ta": "ஒடிசா", "name_hi": "ओडिशा"},
    {"code": "PB", "name_en": "Punjab", "name_ta": "பஞ்சாப்", "name_hi": "पंजाब"},
    {"code": "HR", "name_en": "Haryana", "name_ta": "ஹரியானா", "name_hi": "हरियाणा"},
    {"code": "AS", "name_en": "Assam", "name_ta": "அஸ்ஸாம்", "name_hi": "असम"},
    {"code": "JH", "name_en": "Jharkhand", "name_ta": "ஜார்கண்ட்", "name_hi": "झारखंड"},
    {"code": "CT", "name_en": "Chhattisgarh", "name_ta": "சத்தீஸ்கர்", "name_hi": "छत्तीसगढ़"},
    {"code": "UT", "name_en": "Uttarakhand", "name_ta": "உத்தரகண்ட்", "name_hi": "उत्तराखंड"},
    {"code": "HP", "name_en": "Himachal Pradesh", "name_ta": "இமாச்சலப் பிரதேசம்", "name_hi": "हिमाचल प्रदेश"},
    {"code": "TR", "name_en": "Tripura", "name_ta": "திரிபுரா", "name_hi": "त्रिपुरा"},
    {"code": "ML", "name_en": "Meghalaya", "name_ta": "மேகாலயா", "name_hi": "मेघालय"},
    {"code": "MN", "name_en": "Manipur", "name_ta": "மணிப்பூர்", "name_hi": "मणिपुर"},
    {"code": "NL", "name_en": "Nagaland", "name_ta": "நாகாலாந்து", "name_hi": "नागालैंड"},
    {"code": "GA", "name_en": "Goa", "name_ta": "கோவா", "name_hi": "गोवा"},
    {"code": "AR", "name_en": "Arunachal Pradesh", "name_ta": "அருணாச்சலப் பிரதேசம்", "name_hi": "अरुणाचल प्रदेश"},
    {"code": "MZ", "name_en": "Mizoram", "name_ta": "மிசோரம்", "name_hi": "मिजोरम"},
    {"code": "SK", "name_en": "Sikkim", "name_ta": "சிக்கிம்", "name_hi": "सिक्किम"},
    {"code": "JK", "name_en": "Jammu & Kashmir", "name_ta": "ஜம்மு காஷ்மீர்", "name_hi": "जम्मू और कश्मीर"},
    {"code": "LA", "name_en": "Ladakh", "name_ta": "லடாக்", "name_hi": "लद्दाख"},
    {"code": "PY", "name_en": "Puducherry", "name_ta": "புதுச்சேரி", "name_hi": "पुदुचेरी"},
    {"code": "CH", "name_en": "Chandigarh", "name_ta": "சண்டிகர்", "name_hi": "चंडीगढ़"},
    {"code": "AN", "name_en": "Andaman & Nicobar", "name_ta": "அந்தமான் நிக்கோபார்", "name_hi": "अंडमान और निकोबार"}
]

# Major districts for other prominent states
STATE_DISTRICTS = {
    "Karnataka": [
        {"en": "Bengaluru Urban", "ta": "பெங்களூரு நகரம்", "hi": "बेंगलुरु शहरी"},
        {"en": "Bengaluru Rural", "ta": "பெங்களூரு ஊரகம்", "hi": "बेंगलुरु ग्रामीण"},
        {"en": "Mysuru", "ta": "மைசூரு", "hi": "मैसूरु"},
        {"en": "Mangaluru (Dakshina Kannada)", "ta": "மங்களூரு", "hi": "मंगलुरु"},
        {"en": "Hubballi-Dharwad", "ta": "ஹூப்ளி-தார்வாட்", "hi": "हुबली-धारवाड़"},
        {"en": "Belagavi", "ta": "பெலகாவி", "hi": "बेलगावी"}
    ],
    "Andhra Pradesh": [
        {"en": "Visakhapatnam", "ta": "விசாகப்பட்டினம்", "hi": "विशाखापत्तनम"},
        {"en": "Vijayawada (NTR)", "ta": "விஜயவாடா", "hi": "विजयवाड़ा"},
        {"en": "Guntur", "ta": "குண்டூர்", "hi": "गुंटूर"},
        {"en": "Tirupati", "ta": "திருப்பதி", "hi": "तिरुपति"},
        {"en": "Kurnool", "ta": "கர்னூல்", "hi": "कुरनूल"}
    ],
    "Maharashtra": [
        {"en": "Mumbai City", "ta": "மும்பை நகரம்", "hi": "मुंबई शहर"},
        {"en": "Mumbai Suburban", "ta": "மும்பை புறநகர்", "hi": "मुंबई उपनगरीय"},
        {"en": "Pune", "ta": "புனே", "hi": "पुणे"},
        {"en": "Nagpur", "ta": "நாக்பூர்", "hi": "नागपुर"},
        {"en": "Thane", "ta": "தானே", "hi": "ठाणे"},
        {"en": "Nashik", "ta": "நாசிக்", "hi": "नासिक"}
    ],
    "Delhi": [
        {"en": "Central Delhi", "ta": "மத்திய டெல்லி", "hi": "मध्य दिल्ली"},
        {"en": "New Delhi", "ta": "புது தில்லி", "hi": "नई दिल्ली"},
        {"en": "South Delhi", "ta": "தெற்கு டெல்லி", "hi": "दक्षिण दिल्ली"},
        {"en": "North Delhi", "ta": "வடக்கு டெல்லி", "hi": "उत्तर दिल्ली"}
    ],
    "Kerala": [
        {"en": "Thiruvananthapuram", "ta": "திருவனந்தபுரம்", "hi": "तिरुवनंतपुरम"},
        {"en": "Ernakulam (Kochi)", "ta": "எர்ணாகுளம்", "hi": "एर्नाकुलम"},
        {"en": "Kozhikode", "ta": "கோழிக்கோடு", "hi": "कोझिकोड"},
        {"en": "Thrissur", "ta": "திருச்சூர்", "hi": "त्रिशूर"}
    ]
}
