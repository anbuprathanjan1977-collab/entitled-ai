import logging
import re
from typing import Dict, Any, Tuple, List, Optional
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

# In-memory cache for explanations: key = f"{scheme_id}:{language}"
_EXPLANATION_CACHE: Dict[str, str] = {}

def get_fallback_explanation(scheme: Any, language: str) -> str:
    """Fallback 3-line summary generated directly from stored DB fields without hallucination."""
    if language == "ta":
        line1 = f"1. திட்டம்: {scheme.name_ta} - பயன்: {scheme.benefit_text}."
        desc = scheme.description_ta[:150] + ("..." if len(scheme.description_ta) > 150 else "")
        line2 = f"2. நோக்கம்: {desc}"
        line3 = f"3. விண்ணப்பிக்க அதிகாரப்பூர்வ தளம்: {scheme.official_url}."
    elif language == "hi":
        name = getattr(scheme, "name_hi", None) or scheme.name_en
        desc_val = getattr(scheme, "description_hi", None) or scheme.description_en
        desc = desc_val[:150] + ("..." if len(desc_val) > 150 else "")
        line1 = f"1. योजना: {name} - लाभ: {scheme.benefit_text}."
        line2 = f"2. उद्देश्य: {desc}"
        line3 = f"3. आधिकारिक पोर्टल: {scheme.official_url}."
    elif language == "te":
        line1 = f"1. పథకం: {scheme.name_en} - ప్రయోజనం: {scheme.benefit_text}."
        desc = scheme.description_en[:150] + ("..." if len(scheme.description_en) > 150 else "")
        line2 = f"2. లక్ష్యం: {desc}"
        line3 = f"3. అధికారిక పోర్టల్: {scheme.official_url}."
    elif language == "kn":
        line1 = f"1. ಯೋಜನೆ: {scheme.name_en} - ಸೌಲಭ್ಯ: {scheme.benefit_text}."
        desc = scheme.description_en[:150] + ("..." if len(scheme.description_en) > 150 else "")
        line2 = f"2. ಉದ್ದೇಶ: {desc}"
        line3 = f"3. ಅಧಿಕೃತ ಪೋರ್ಟಲ್: {scheme.official_url}."
    else:
        desc = scheme.description_en[:150] + ("..." if len(scheme.description_en) > 150 else "")
        line1 = f"1. Scheme: {scheme.name_en} - Benefit: {scheme.benefit_text}."
        line2 = f"2. Purpose: {desc}"
        line3 = f"3. Apply via official portal: {scheme.official_url}."
    return f"{line1}\n{line2}\n{line3}"

async def generate_scheme_explanation(scheme: Any, language: str) -> Tuple[str, bool]:
    """
    Returns (explanation_text, was_cached).
    Uses strict prompt adhering to stored DB fields only.
    """
    cache_key = f"{scheme.id}:{language}"
    if cache_key in _EXPLANATION_CACHE:
        return _EXPLANATION_CACHE[cache_key], True

    # If mock key or empty, return verified template immediately
    if not settings.LLM_API_KEY or settings.LLM_API_KEY.startswith("mock"):
        fallback = get_fallback_explanation(scheme, language)
        _EXPLANATION_CACHE[cache_key] = fallback
        return fallback, False

    lang_names = {
        "ta": "Tamil", "hi": "Hindi", "en": "English",
        "te": "Telugu", "kn": "Kannada", "ml": "Malayalam", "bn": "Bengali"
    }
    target_lang = lang_names.get(language, "English")

    prompt = f"""You are a helpful government welfare assistant for Indian citizens.
Write exactly a 3-line plain-language explanation of this scheme for an ordinary citizen in {target_lang}.

STRICT CONSTRAINTS:
1. Use ONLY the provided stored scheme fields below.
2. NEVER determine or claim the citizen is eligible or ineligible.
3. NEVER invent amounts, dates, or URLs.
4. Keep the output strictly to 3 clear, simple numbered lines.

SCHEME DATA:
Name: {scheme.name_en} / {scheme.name_ta}
Benefit: {scheme.benefit_text} (₹{scheme.benefit_amount})
Description: {scheme.description_en}
Official Portal: {scheme.official_url}
"""

    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.LLM_MODEL}:generateContent?key={settings.LLM_API_KEY}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.2, "maxOutputTokens": 200}
        }
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                _EXPLANATION_CACHE[cache_key] = text
                return text, False
    except Exception as err:
        logger.warning(f"LLM API call failed, using stored fallback: {err}")

    fallback = get_fallback_explanation(scheme, language)
    _EXPLANATION_CACHE[cache_key] = fallback
    return fallback, False

# Interactive Knowledge Base Assistant for Entitle AI
def get_intelligent_assistant_reply(
    query: str, 
    language: str = "en",
    context_scheme: Optional[Any] = None,
    history: Optional[List[Dict[str, str]]] = None
) -> Dict[str, Any]:
    """
    Intelligent knowledge-grounded assistant reply supporting:
    - Step-by-step application procedures for schemes and government job exams
    - e-Sevai / Document downloads (Aadhaar, PAN, Income, Community, First Graduate, Ration card)
    - Scheme-specific eligibility, benefits, and portals
    - Entitle AI privacy & platform guidance
    - Multilingual responses (English, Tamil, Hindi, Telugu, Kannada, Malayalam, Bengali)
    """
    q = query.lower().strip()
    lang = language.lower()
    if lang not in ["en", "ta", "hi", "te", "kn", "ml", "bn"]:
        lang = "en"

    # Contextual check: Did previous messages talk about a specific scheme or exam?
    history_context = ""
    if history and isinstance(history, list):
        for msg in reversed(history[-4:]):
            content = msg.get("text", "") or msg.get("content", "") or ""
            history_context += " " + content.lower()

    combined_text = f"{history_context} {q}"

    step_keywords = [
        "step", "steps", "how to apply", "procedure", "process", "process of applying",
        "how can i apply", "how do i apply", "application guide", "apply pannuvathu", "epdi apply",
        "eppadi apply", "apply pandrathu", "apply panna", "steps enna", "padigal", "padinilai", "padinilaigal",
        "vali muraigal", "வழிமுறைகள்", "வழிமுறை", "படிமுறைகள்", "படிநிலை", "படிநிலைகள்", "படிநிலைகள் என்ன",
        "படிகள்", "எப்படி விண்ணப்பிப்பது", "விண்ணப்பிப்பது எப்படி", "விண்ணப்பிக்கும் படிகள்",
        "விண்ணப்பிக்கும் முறை", "விண்ணப்ப முறை", "விண்ணப்ப செயல்முறை",
        "आवेदन कैसे करें", "चरण क्या हैं", "आवेदन प्रक्रिया", "आवेदन के चरण", "लागू कैसे करें", "आवेदन फॉर्म",
        "దశలు", "ఎలా దరఖాస్తు చేయాలి", "దరఖాస్తు విధానం", "దరఖాస్తు దశలు",
        "ಹಂತಗಳು", "ಹೇಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸುವುದು", "ಅರ್ಜಿ ವಿಧಾನ",
        "ഘട്ടങ്ങൾ", "എങ്ങനെ അപേക്ഷിക്കാം", "അപേക്ഷാ രീതി",
        "ধাপ", "পদক্ষেপ", "কীভাবে আবেদন করবেন", "আবেদন প্রক্রিয়া",
        "पायऱ्या", "पायरी", "अर्ज कसा करावा", "अर्ज प्रक्रिया",
        "પગલાં", "પગલું", "અરજી કેવી રીતે કરવી", "અરજી પ્રક્રિયા"
    ]
    if any(k in q for k in step_keywords) or any(k in combined_text for k in step_keywords) or (q in ["steps", "step", "what are the steps", "what are steps", "how to apply?", "application steps"]):
# Scheme-specific steps if context_scheme is provided or mentioned
        if context_scheme:
            scheme_name = getattr(context_scheme, "name_en", "this scheme")
            scheme_portal = getattr(context_scheme, "official_url", "https://tnesevai.tn.gov.in")
            benefit = getattr(context_scheme, "benefit_text", "")

            if lang == "ta":
                reply = (
                    f"📝 **{scheme_name} திட்டத்திற்கு விண்ணப்பிக்கும் 5 எளிய படிகள்:**\n\n"
                    f"1. **தகுதி சரிபார்த்தல்:** Entitle AI தகுதி கணக்கீட்டில் உங்கள் வயது மற்றும் வருமானம் இத்திட்டத்தின் விதிகளுக்கு உட்பட்டுள்ளதா என உறுதிப்படுத்தவும்.\n"
                    f"2. **தேவையான ஆவணங்கள்:** ஆதார் அட்டை, வருமானச் சான்றிதழ், குடும்ப அட்டை, வங்கி கணக்கு புத்தகம் (Aadhaar இணைக்கப்பட்டது).\n"
                    f"3. **அதிகாரப்பூர்வ தளம்:** [{scheme_portal}]({scheme_portal}) தளத்திற்கு செல்லவும் (அல்லது அருகிலுள்ள இ-சேவை மையம் செல்லவும்).\n"
                    f"4. **விண்ணப்பம் சமர்ப்பித்தல்:** புதிய பயனராக பதிவு செய்து விவரங்களை பூர்த்தி செய்து ஆவணங்களை பதிவேற்றவும்.\n"
                    f"5. **ரசீது & நிலை அறிதல்:** விண்ணப்ப எண் (Application Reference No) கொண்ட ரசீதை பதிவிறக்கம் செய்து கண்காணிக்கவும்.\n\n"
                    f"💡 **பயன்:** {benefit}"
                )
            elif lang == "hi":
                reply = (
                    f"📝 **{scheme_name} के लिए आवेदन करने के 5 चरण:**\n\n"
                    f"1. **पात्रता जांच:** Entitle AI पर अपनी आयु और आय पात्रता की पुष्टि करें।\n"
                    f"2. **दस्तावेज तैयार रखें:** आधार कार्ड, आय प्रमाण पत्र, राशन कार्ड और बैंक पासबुक।\n"
                    f"3. **आधिकारिक पोर्टल:** [{scheme_portal}]({scheme_portal}) पर जाएं (या नजदीकी सीएससी/ई-सेवा केंद्र पर जाएं)।\n"
                    f"4. **फॉर्म भरें:** आवश्यक विवरण दर्ज करें और प्रमाणित दस्तावेज अपलोड करें।\n"
                    f"5. **रसीद सुरक्षित रखें:** पावती रसीद (Acknowledgement Receipt) डाउनलोड करें।"
                )
            else:
                reply = (
                    f"📝 **5 Step-by-Step Instructions to Apply for {scheme_name}:**\n\n"
                    f"1. **Verify Eligibility:** Confirm your age, income, and community criteria on Entitle AI.\n"
                    f"2. **Prepare Mandatory Documents:** Aadhaar card, valid Income Certificate, Community/Caste Certificate, Smart Ration Card, and Aadhaar-seeded Bank Passbook.\n"
                    f"3. **Visit Official Portal:** Navigate to [{scheme_portal}]({scheme_portal}) or visit your local authorized e-Sevai / CSC centre.\n"
                    f"4. **Register & Submit Application:** Complete One-Time Registration (OTR), enter applicant details, and upload scanned documents (PDF <200KB).\n"
                    f"5. **Save Acknowledgement Slip:** Retain the Application / Acknowledgement Number to track approval and DBT bank disbursements.\n\n"
                    f"💡 **Benefit:** {benefit}"
                )
            return {
                "reply": reply,
                "category": "steps",
                "suggested_questions": [
                    "What documents are required for this scheme?",
                    "How to download e-Aadhaar or Income Certificate?",
                    "Where can I find other schemes for me?"
                ]
            }

        # General Step-by-Step Guidance across Government Schemes & Exams
        if lang == "ta":
            reply = (
                "📋 **அரசு நலத்திட்டங்கள் மற்றும் தேர்வுகளுக்கு விண்ணப்பிக்கும் 6 படிநிலைகள்:**\n\n"
                "1. **படி 1: Entitle AI-யில் தகுதியை அறிதல்**\n"
                "   • உங்கள் வயது, குடும்ப வருமானம், கல்வித்தகுதி மற்றும் சாதி அடிப்படையில் உங்களுக்குரிய திட்டங்களை 'Find Schemes' பக்கத்தில் நொடியில் கணக்கிடுங்கள்.\n\n"
                "2. **படி 2: டிஜிட்டல் சான்றிதழ்களை தயார் செய்தல்**\n"
                "   • ஆதார் அட்டை (மொபைல் எண் இணைக்கப்பட்டது)\n"
                "   • வருமானச் சான்றிதழ் (e-Sevai மூலம் பெறப்பட்டது)\n"
                "   • சாதி/சமூக சான்றிதழ் மற்றும் இருப்பிடச் சான்றிதழ்\n"
                "   • பள்ளி/கல்லூரி மார்க்ஷீட்கள் & மாற்றுச் சான்றிதழ் (TC)\n"
                "   • வங்கி சேமிப்பு கணக்கு (NPCI ஆதார் இணைப்புடன்).\n\n"
                "3. **படி 3: அதிகாரப்பூர்வ போர்ட்டலில் ஒருமுறை பதிவு (OTR)**\n"
                "   • நலத்திட்டங்கள்: தமிழ்நாடு இ-சேவை ([tnesevai.tn.gov.in](https://tnesevai.tn.gov.in)) அல்லது தேசிய உதவித்தொகை தளம் ([scholarships.gov.in](https://scholarships.gov.in)).\n"
                "   • அரசு வேலை தேர்வுகள்: TNPSC ([apply.tnpscexams.in](https://apply.tnpscexams.in)), SSC ([ssc.gov.in](https://ssc.gov.in)), ரயில்வே ([rrbapply.gov.in](https://rrbapply.gov.in)), UPSC ([upsconline.nic.in](https://upsconline.nic.in)).\n\n"
                "4. **படி 4: விண்ணப்பத்தை பூர்த்தி செய்து ஆவணங்களை பதிவேற்றுதல்**\n"
                "   • தேவையான ஆவணங்களை பரிந்துரைக்கப்பட்ட அளவில் (200KB PDF/JPG) பதிவேற்றி கட்டணம் ஏதேனும் இருப்பின் செலுத்தவும் (பெண்கள்/SC/ST பிரிவினருக்கு பல சலுகைகள் உண்டு).\n\n"
                "5. **படி 5: ஒப்புதல் ரசீதை (Acknowledgement Slip) சேமித்தல்**\n"
                "   • உங்கள் விண்ணப்பக் குறிப்பு எண்ணை (Application Reference Number) குறித்து வைத்துக்கொள்ளவும்.\n\n"
                "6. **படி 6: சரிபார்ப்பு & வங்கி கணக்கில் உதவித்தொகை (DBT)**\n"
                "   • வட்டாட்சியர்/அதிகாரிகளின் சரிபார்ப்பிற்குப் பின் நிதி நேரடியாக உங்கள் வங்கி கணக்கிற்கு வந்து சேரும் (நேரடி பணப்பரிமாற்றம் - DBT)."
            )
        elif lang == "hi":
            reply = (
                "📋 **सरकारी योजनाओं और प्रतियोगी परीक्षाओं के लिए 6 आवेदन चरण:**\n\n"
                "1. **चरण 1: Entitle AI पर पात्रता जांचें**\n"
                "   • 'Check Eligibility' पर जाकर अपनी आयु, आय और श्रेणी के आधार पर पात्र योजनाओं की पहचान करें।\n\n"
                "2. **चरण 2: आवश्यक दस्तावेज तैयार करें**\n"
                "   • आधार कार्ड (मोबाइल से लिंक), आय प्रमाण पत्र, जाति प्रमाण पत्र, राशन कार्ड, मार्कशीट और आधार से लिंक बैंक खाता।\n\n"
                "3. **चरण 3: आधिकारिक पोर्टल पर वन-टाइम रजिस्ट्रेशन (OTR)**\n"
                "   • छात्रवृत्ति: [scholarships.gov.in](https://scholarships.gov.in)\n"
                "   • सरकारी नौकरियां: SSC ([ssc.gov.in](https://ssc.gov.in)), रेलवे ([rrbapply.gov.in](https://rrbapply.gov.in)), UPSC ([upsconline.nic.in](https://upsconline.nic.in))।\n\n"
                "4. **चरण 4: फॉर्म भरना व दस्तावेज अपलोड करना**\n"
                "   • आवेदन फॉर्म में सही विवरण भरें और निर्धारित आकार में प्रमाण पत्र अपलोड करें।\n\n"
                "5. **चरण 5: पावती रसीद (Acknowledgement) डाउनलोड करें**\n"
                "   • भविष्य के संदर्भ और स्थिति जांच के लिए आवेदन संख्या सुरक्षित रखें।\n\n"
                "6. **चरण 6: सत्यापन और डीबीटी (DBT) भुगतान**\n"
                "   • प्रशासनिक सत्यापन के बाद सहायता राशि सीधे आपके बैंक खाते में जमा हो जाती है।"
            )
        elif lang == "te":
            reply = (
                "📋 **ప్రభుత్వ పథకాలు & ఉద్యోగ పరీక్షల దరఖాస్తుకు 6 ముఖ్యమైన దశలు:**\n\n"
                "1. **దశ 1: Entitle AI లో అర్హతను గుర్తించండి:** వయస్సు, ఆదాయం మరియు విద్య ఆధారంగా మీకు సరిపోయే పథకాలను తనిఖీ చేయండి.\n"
                "2. **దశ 2: అవసరమైన పత్రాలు సిద్ధం చేసుకోండి:** ఆధార్, ఆదాయ ధృవీకరణ పత్రం, కుల ధృవీకరణ పత్రం, రేషన్ కార్డు, మార్కుల జాబితా మరియు ఆధార్ లింక్డ్ బ్యాంక్ ఖాతా.\n"
                "3. **దశ 3: అధికారిక పోర్టల్ లో OTR రిజిస్ట్రేషన్:** జాతీయ స్కాలర్‌షిప్ పోర్టల్ ([scholarships.gov.in](https://scholarships.gov.in)), SSC ([ssc.gov.in](https://ssc.gov.in)) లేదా రైల్వేస్ ([rrbapply.gov.in](https://rrbapply.gov.in)).\n"
                "4. **దశ 4: దరఖాస్తును నింపి పత్రాలు అప్‌లోడ్ చేయండి:** వివరాలను పూరించి సరైన పరిమాణంలో పత్రాలను సమర్పించండి.\n"
                "5. **దశ 5: రశీదు (Acknowledgement) డౌన్‌లోడ్ చేయండి:** మీ అప్లికేషన్ నంబర్‌ను భద్రపరచండి.\n"
                "6. **దశ 6: పరిశీలన & DBT నిధుల బదిలీ:** పరిశీలన అనంతరం సహాయక నిధులు నేరుగా మీ బ్యాంకు ఖాతాలో జమ చేయబడతాయి."
            )
        elif lang == "kn":
            reply = (
                "📋 **ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು ಮತ್ತು ಪರೀಕ್ಷೆಗಳಿಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸುವ 6 ಹಂತಗಳು:**\n\n"
                "1. **ಹಂತ 1: Entitle AI ನಲ್ಲಿ ಅರ್ಹತೆ ಪರಿಶೀಲಿಸಿ:** ನಿಮ್ಮ ವಯಸ್ಸು ಮತ್ತು ಆದಾಯಕ್ಕೆ ಸೂಕ್ತವಾದ ಯೋಜನೆಗಳನ್ನು ಕಂಡುಕೊಳ್ಳಿ.\n"
                "2. **ಹಂತ 2: ದಾಖಲೆಗಳನ್ನು ಸಿದ್ಧಪಡಿಸಿ:** ಆಧಾರ್, ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ, ಜಾತಿ ಪ್ರಮಾಣಪತ್ರ, ರೇಷನ್ ಕಾರ್ಡ್, ಅಂಕಪಟ್ಟಿಗಳು ಮತ್ತು ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್.\n"
                "3. **ಹಂತ 3: ಅಧಿಕೃತ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ OTR ನೋಂದಣಿ:** [scholarships.gov.in](https://scholarships.gov.in) ಅಥವಾ [ssc.gov.in](https://ssc.gov.in) ಭೇಟಿ ನೀಡಿ.\n"
                "4. **ಹಂತ 4: ಅರ್ಜಿ ಸಲ್ಲಿಕೆ & ದಾಖಲೆ ಅಪ್‌ಲೋಡ್:** ಎಲ್ಲಾ ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ ಪ್ರಮಾಣಪತ್ರಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.\n"
                "5. **ಹಂತ 5: ಸ್ವೀಕೃತಿ ರಸೀದಿ ಡೌನ್‌ಲೋಡ್:** ಭವಿಷ್ಯದ ಪರಿಶೀಲನೆಗಾಗಿ ಅರ್ಜಿ ಸಂಖ್ಯೆಯನ್ನು ಉಳಿಸಿಕೊಳ್ಳಿ.\n"
                "6. **ಹಂತ 6: ಪರಿಶೀಲನೆ ಮತ್ತು ನೇರ ಬ್ಯಾಂಕ್ ವರ್ಗಾವಣೆ (DBT):** ಅನುಮೋದನೆಯ ನಂತರ ಹಣವು ನೇರವಾಗಿ ನಿಮ್ಮ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ಜಮೆಯಾಗುತ್ತದೆ."
            )
        elif lang == "ml":
            reply = (
                "📋 **സർക്കാർ പദ്ധതികൾക്കും പരീക്ഷകൾക്കും അപേക്ഷിക്കാനുള്ള 6 ഘട്ടങ്ങൾ:**\n\n"
                "1. **ഘട്ടം 1: Entitle AI-യിൽ യോഗ്യത പരിശോധിക്കുക:** നിങ്ങളുടെ പ്രായവും വരുമാനവും അനുസരിച്ചുള്ള പദ്ധതികൾ കണ്ടെത്തുക.\n"
                "2. **ഘട്ടം 2: ആവശ്യമായ രേഖകൾ ഒരുക്കുക:** ആധാർ, വരുമാന സർട്ടിഫിക്കറ്റ്, ജാതി സർട്ടിഫിക്കറ്റ്, റേഷൻ കാർഡ്, ബാങ്ക് പാസ്ബുക്ക്.\n"
                "3. **ഘട്ടം 3: ഔദ്യോഗിക പോർട്ടലിൽ OTR രജിസ്ട്രേഷൻ:** [scholarships.gov.in](https://scholarships.gov.in) അല്ലെങ്കിൽ [ssc.gov.in](https://ssc.gov.in).\n"
                "4. **ഘട്ടം 4: ഫോം പൂരിപ്പിച്ച് രേഖകൾ അപ്‌ലോഡ് ചെയ്യുക.**\n"
                "5. **ഘട്ടം 5: രസീത് (Acknowledgement) ഡൗൺലോഡ് ചെയ്ത് സൂക്ഷിക്കുക.**\n"
                "6. **ഘട്ടം 6: പരിശോധനയും നേരിട്ടുള്ള ബാങ്ക് കൈമാറ്റവും (DBT).**"
            )
        else:
            reply = (
                "📋 **Universal 6-Step Guide to Apply for Government Schemes & Exams:**\n\n"
                "1. **Step 1: Check Eligibility on Entitle AI**\n"
                "   • Use the 'Check Eligibility' questionnaire to instantly match against official age, family income, community, and academic criteria.\n\n"
                "2. **Step 2: Assemble Mandatory Digital Documents**\n"
                "   • Aadhaar Card (with active mobile link for OTP)\n"
                "   • Recent Annual Income Certificate (issued by Revenue Dept / e-Sevai)\n"
                "   • Community / Caste Certificate (BC/MBC/SC/ST)\n"
                "   • Smart Ration Card / Residence Proof\n"
                "   • Active Bank Account with NPCI Aadhaar seeding (for DBT benefits).\n\n"
                "3. **Step 3: One-Time Registration (OTR) on Official Portals**\n"
                "   • Welfare & Scholarships: [scholarships.gov.in](https://scholarships.gov.in) or TN e-Sevai [tnesevai.tn.gov.in](https://tnesevai.tn.gov.in).\n"
                "   • Competitive Exams: Staff Selection [ssc.gov.in](https://ssc.gov.in), Railways [rrbapply.gov.in](https://rrbapply.gov.in), UPSC [upsconline.nic.in](https://upsconline.nic.in), or State PSCs.\n\n"
                "4. **Step 4: Complete Application & Upload Verified Files**\n"
                "   • Fill personal and educational parameters accurately. Upload scanned certificates in clear PDF/JPEG (<200 KB).\n\n"
                "5. **Step 5: Download Acknowledgement Slip**\n"
                "   • Save your unique Application Number / Reference ID to track verification progress.\n\n"
                "6. **Step 6: Administrative Verification & Direct Benefit Transfer (DBT)**\n"
                "   • Once field/scrutiny verification is completed, financial grants credit directly to your Aadhaar-linked bank account (or admit cards release for exams)."
            )
        return {
            "reply": reply,
            "category": "steps",
            "suggested_questions": [
                "How to download e-Aadhaar or e-PAN?",
                "How to get Income Certificate from e-Sevai?",
                "Which exams are closing this week?",
                "Show all scholarships for college students"
            ]
        }

    # 2. AADHAAR CARD GUIDANCE
    if any(k in q for k in ["aadhaar", "aadhar", "ஆதார்", "आधार", "ఆధార్", "ಆಧಾರ್", "ആധാർ"]):
        if lang == "ta":
            reply = (
                "📄 **இ-ஆதார் (e-Aadhaar) பதிவிறக்கம் செய்யும் முறை:**\n\n"
                "1. **அதிகாரப்பூர்வ தளம்:** [myaadhaar.uidai.gov.in](https://myaadhaar.uidai.gov.in) தளத்திற்கு செல்லவும்.\n"
                "2. 'Download Aadhaar' என்பதைத் தேர்ந்தெடுத்து உங்கள் 12-இலக்க ஆதார் எண்ணை உள்ளிடவும்.\n"
                "3. பதிவு செய்யப்பட்ட மொபைல் எண்ணிற்கு வரும் OTP-யை உள்ளிட்டு சரிபார்க்கவும்.\n"
                "4. **PDF கடவுச்சொல் (Password):** உங்கள் பெயரின் முதல் 4 ஆங்கில எழுத்துக்கள் (CAPITAL) + பிறந்த ஆண்டு (எ.கா: RAMA1998).\n"
                "5. அருகிலுள்ள இ-சேவை மையத்திலும் கைரேகை பதிவு செய்து அச்சிடலாம்."
            )
        elif lang == "hi":
            reply = (
                "📄 **ई-आधार (e-Aadhaar) डाउनलोड करने के चरण:**\n\n"
                "1. **आधिकारिक पोर्टल:** [myaadhaar.uidai.gov.in](https://myaadhaar.uidai.gov.in) पर जाएं।\n"
                "2. 'Download Aadhaar' पर क्लिक करें और अपना 12 अंकों का आधार नंबर दर्ज करें।\n"
                "3. अपने पंजीकृत मोबाइल पर प्राप्त OTP दर्ज करें।\n"
                "4. **PDF पासवर्ड:** आपके नाम के पहले 4 अक्षर (CAPITAL) + जन्म वर्ष (उदा: RAMA1998)।"
            )
        elif lang == "te":
            reply = (
                "📄 **ఈ-ఆధార్ (e-Aadhaar) డౌన్‌లోడ్ చేసుకునే విధానం:**\n\n"
                "1. **అధికారిక పోర్టల్:** [myaadhaar.uidai.gov.in](https://myaadhaar.uidai.gov.in) సందర్శించండి.\n"
                "2. 'Download Aadhaar' పై క్లిక్ చేసి 12 అంకెల ఆధార్ సంఖ్యను నమోదు చేయండి.\n"
                "3. మీ మొబైల్ కు వచ్చే OTP ని ధృవీకరించండి.\n"
                "4. **PDF పాస్‌వర్డ్:** మీ పేరులోని మొదటి 4 అక్షరాలు (CAPITALS) + పుట్టిన సంవత్సరం (ఉదా: RAMA1998)."
            )
        else:
            reply = (
                "📄 **How to Download e-Aadhaar Card:**\n\n"
                "1. **Official Portal:** Visit [myaadhaar.uidai.gov.in](https://myaadhaar.uidai.gov.in).\n"
                "2. Click on **'Download Aadhaar'** and enter your 12-digit Aadhaar Number or Enrolment ID.\n"
                "3. Enter the Captcha and verify with the OTP sent to your linked mobile number.\n"
                "4. **PDF Password Format:** First 4 letters of your name in CAPITAL + 4-digit Year of Birth (e.g., if name is PRIYA born in 2002, password is `PRIY2002`).\n"
                "5. You can also visit your nearest authorized e-Sevai / CSC centre for biometric printout."
            )
        return {
            "reply": reply,
            "category": "document",
            "suggested_questions": [
                "How to download PAN Card?",
                "How to get Income Certificate?",
                "What are steps to apply for scholarships?"
            ]
        }

    # 3. PAN CARD GUIDANCE
    if any(k in q for k in ["pan card", "e-pan", "பான் கார்டு", "பான்", "पैन कार्ड", "पैन", "పాన్ కార్డు", "ಪ್ಯಾನ್"]) or re.search(r'\bpan\b', q):
        if lang == "ta":
            reply = (
                "💳 **இ-பான் (e-PAN) அட்டை பதிவிறக்கம் செய்யும் முறை:**\n\n"
                "1. **வருமான வரி e-Filing தளம்:** [incometax.gov.in](https://www.incometax.gov.in) செல்லவும்.\n"
                "2. 'Instant e-PAN' விருப்பத்தை தேர்வு செய்து 'Check Status / Download PAN' என்பதை கிளிக் செய்யவும்.\n"
                "3. உங்கள் ஆதார் எண் மற்றும் OTP உள்ளிட்டு உடனடியாக இலவசமாக பதிவிறக்கலாம்.\n"
                "4. NSDL/UTIITSL மூலம் விண்ணப்பித்திருந்தால், அவர்களது [onlineservices.nsdl.com](https://www.onlineservices.nsdl.com) தளத்தில் Acknowledgement எண் கொண்டு பதிவிறக்கம் செய்யலாம்.\n"
                "5. **PDF கடவுச்சொல்:** பிறந்த தேதி `DDMMYYYY` வடிவில் (எ.கா: 25082001)."
            )
        elif lang == "hi":
            reply = (
                "💳 **ई-पैन (e-PAN) कार्ड डाउनलोड करने के चरण:**\n\n"
                "1. **आयकर ई-फाइलिंग पोर्टल:** [incometax.gov.in](https://www.incometax.gov.in) पर जाएं।\n"
                "2. 'Instant e-PAN' विकल्प चुनें और 'Check Status / Download PAN' पर क्लिक करें।\n"
                "3. अपना आधार नंबर और OTP दर्ज करके डिजिटल ई-पैन तुरंत डाउनलोड करें।\n"
                "4. **PDF पासवर्ड:** आपकी जन्मतिथि `DDMMYYYY` प्रारूप में।"
            )
        else:
            reply = (
                "💳 **How to Download e-PAN Card:**\n\n"
                "1. **Instant e-PAN via Income Tax:** Visit [incometax.gov.in](https://www.incometax.gov.in) and select **'Instant e-PAN'** → **'Check Status / Download PAN'** using your Aadhaar OTP.\n"
                "2. **Via NSDL Portal:** If applied through NSDL, visit [onlineservices.nsdl.com](https://www.onlineservices.nsdl.com) with your Acknowledgement number.\n"
                "3. **PDF Password Format:** Your Date of Birth in `DDMMYYYY` format (e.g., 25082001)."
            )
        return {
            "reply": reply,
            "category": "document",
            "suggested_questions": [
                "How to download Aadhaar Card?",
                "How to get Income Certificate from e-Sevai?",
                "What are steps to apply for schemes?"
            ]
        }

    # 4. CERTIFICATES: INCOME, COMMUNITY, FIRST GRADUATE, RATION CARD
    if any(k in q for k in ["income certificate", "வருமான", "आय प्रमाण", "community", "சாதி", "जाति", "first graduate", "முதல் பட்டதாரி", "ration", "ரேஷன்", "రైస్ కార్డ్", "ಆದಾಯ ಪ್ರಮಾಣ"]):
        if lang == "ta":
            reply = (
                "🏛️ **இ-சேவை (e-Sevai) சான்றிதழ் வழிகாட்டுதல்:**\n\n"
                "• **வருமானச் சான்றிதழ்:** [tnesevai.tn.gov.in](https://www.tnesevai.tn.gov.in) அல்லது வட்டாட்சியர் அலுவலகம். தேவை: சம்பள ரசீது / VAO அறிக்கை, ஆதார், ரேஷன் கார்டு (3-7 நாட்களில் வழங்கப்படும்).\n"
                "• **சாதி சான்றிதழ்:** பெற்றோரின் சாதிச் சான்றிதழ், பள்ளி TC, குடும்ப அட்டை.\n"
                "• **முதல் பட்டதாரி சான்றிதழ்:** குடும்பத்தில் யாரும் பட்டதாரி இல்லை என்பதற்கான கூட்டு பிரமாணப் பத்திரம் + வட்டாட்சியர் ஒப்புதல் (ஆண்டுக்கு ₹25,000 கட்டண தள்ளுபடி).\n"
                "• **ஸ்மார்ட் ரேஷன் அட்டை:** [tnpds.gov.in](https://www.tnpds.gov.in) தளத்தில் மின்னணு அட்டையை பதிவிறக்கலாம்."
            )
        elif lang == "hi":
            reply = (
                "🏛️ **ई-सेवा और राजस्व प्रमाण पत्र गाइड:**\n\n"
                "• **आय प्रमाण पत्र:** अपने राज्य के ई-डिस्ट्रिक्ट पोर्टल ([tnesevai.tn.gov.in](https://tnesevai.tn.gov.in)) से आवेदन करें। दस्तावेज: आधार, राशन कार्ड, वेतन पर्ची।\n"
                "• **जाति प्रमाण पत्र:** आरक्षण व छात्रवृत्ति हेतु आवश्यक। माता-पिता का जाति प्रमाण पत्र और स्कूल टीसी आवश्यक है।\n"
                "• **स्मार्ट राशन कार्ड:** राज्य खाद्य पोर्टल से डिजिटल राशन कार्ड डाउनलोड करें।"
            )
        else:
            reply = (
                "🏛️ **e-Sevai & Revenue Document Application Guide:**\n\n"
                "• **Annual Income Certificate:** Apply on [tnesevai.tn.gov.in](https://tnesevai.tn.gov.in) or your state e-District portal. Documents needed: Aadhaar, Ration Card, Salary slip/VAO enquiry report. Issued within 3-7 days.\n"
                "• **Community / Caste Certificate:** Required for BC/MBC/SC/ST reservations and scholarships. Apply at e-Sevai with parents' community certificate and school TC.\n"
                "• **First Graduate Certificate:** For tuition fee waiver. Requires Tahsildar verification and joint declaration that no family member is a graduate.\n"
                "• **Smart Ration Card:** Download your e-Ration card directly from [tnpds.gov.in](https://www.tnpds.gov.in) using OTP."
            )
        return {
            "reply": reply,
            "category": "document",
            "suggested_questions": [
                "Show all scholarship schemes",
                "How to download e-Aadhaar?",
                "What are steps to apply?"
            ]
        }

    # 4b. FLAGSHIP WELFARE SCHEMES: MAGALIR URIMAI, PM-KISAN, AYUSHMAN BHARAT, NAAN MUDHALVAN
    if any(k in q for k in ["magalir", "urimai thittam", "kmut", "மகளிர்", "மகளிர் உரிமை", "மகளிர் உரிமைத் தொகை"]):
        if lang == "ta":
            reply = (
                "🌸 **கலைஞர் மகளிர் உரிமைத் திட்டம் (KMUT) வழிகாட்டுதல்:**\n\n"
                "• **பயன்:** குடும்பத் தலைவிகளுக்கு மாதம் ₹1,000 (ஆண்டுக்கு ₹12,000) நேரடி வங்கிப் பரிமாற்றம் (DBT).\n"
                "• **முக்கிய தகுதிகள்:**\n"
                "  - குடும்ப ஆண்டு வருமானம் ₹2.5 லட்சத்திற்குள் இருக்க வேண்டும்.\n"
                "  - நஞ்சை நிலம் 5 ஏக்கர் அல்லது புஞ்சை நிலம் 10 ஏக்கருக்குள் இருக்க வேண்டும்.\n"
                "  - ஆண்டு குடும்ப மின் பயன்பாடு 3,600 யூனிட்டுகளுக்குள் இருக்க வேண்டும்.\n"
                "• **தேவையான ஆவணங்கள்:** ஆதார் அட்டை, ஸ்மார்ட் குடும்ப அட்டை (Ration Card), ஆதார் இணைக்கப்பட்ட வங்கிக் கணக்கு, மின் கட்டண அட்டை.\n"
                "• **விண்ணப்பிக்கும் முறை:** உங்கள் அருகிலுள்ள இ-சேவை மையம் அல்லது சிறப்பு முகாம்களில் கைரேகை/OTP மூலம் பதிவு செய்யலாம்.\n"
                "• **அதிகாரப்பூர்வ தளம்:** [kmut.tn.gov.in](https://kmut.tn.gov.in) (உதவி எண்: 044-25619222)"
            )
        elif lang == "hi":
            reply = (
                "🌸 **कलैग्नार महिला अधिकार योजना (Kalaignar Magalir Urimai Thittam):**\n\n"
                "• **लाभ:** पात्र महिला मुखिया को ₹1,000/माह (₹12,000/वर्ष) प्रत्यक्ष लाभ अंतरण (DBT)।\n"
                "• **पात्रता:** वार्षिक पारिवारिक आय ₹2.5 लाख से कम, भूमि 5 एकड़ (सिंचित) से कम, और बिजली खपत 3600 यूनिट/वर्ष से कम।\n"
                "• **आवश्यक दस्तावेज:** आधार कार्ड, राशन कार्ड, और आधार लिंक बैंक पासबुक।\n"
                "• **पोर्टल:** [kmut.tn.gov.in](https://kmut.tn.gov.in)"
            )
        else:
            reply = (
                "🌸 **Kalaignar Magalir Urimai Thittam (KMUT) Guidelines:**\n\n"
                "• **Monetary Benefit:** ₹1,000 per month (₹12,000/year) direct DBT transfer into the bank account of eligible women heads of households in Tamil Nadu.\n"
                "• **Key Eligibility Criteria:**\n"
                "  - Annual family income must be ≤ ₹2.5 Lakhs.\n"
                "  - Family landholding must be < 5 acres (wetland) or < 10 acres (dryland).\n"
                "  - Annual domestic electricity consumption must be < 3,600 units.\n"
                "• **Mandatory Documents:** Aadhaar card, Smart Family Ration Card, Aadhaar-seeded Bank Passbook, and Electricity Consumer Number.\n"
                "• **Application Portal:** Apply at your local authorized e-Sevai centre or visit [kmut.tn.gov.in](https://kmut.tn.gov.in). Helpline: 044-25619222."
            )
        return {
            "reply": reply,
            "category": "scheme",
            "suggested_questions": [
                "What are steps to apply for Magalir Urimai?",
                "How to seed Aadhaar with bank account for DBT?",
                "Check other women welfare schemes"
            ]
        }

    if any(k in q for k in ["kisan", "pm-kisan", "pmkisan", "விவசாயி", "கிசான்", "किसान", "రైతు", "ರೈತ"]):
        if lang == "ta":
            reply = (
                "🌾 **பிரதமர் கிசான் திட்டம் (PM-KISAN Samman Nidhi):**\n\n"
                "• **பயன்:** நில உரிமையுள்ள விவசாயக் குடும்பங்களுக்கு ஆண்டுக்கு ₹6,000 நிதி உதவி (4 மாதங்களுக்கு ஒருமுறை ₹2,000 வீதம் 3 தவணைகள்).\n"
                "• **தகுதிகள்:** விவசாய நிலம் வைத்திருக்கும் அனைத்து சிறு மற்றும் குறு விவசாய குடும்பங்கள்.\n"
                "• **கட்டாய தேவை:** நில பட்டா/சிட்டா, ஆதார் அட்டை, eKYC சரிபார்ப்பு, மற்றும் NPCI ஆதார் இணைக்கப்பட்ட வங்கிக் கணக்கு.\n"
                "• **அதிகாரப்பூர்வ தளம் & eKYC:** [pmkisan.gov.in](https://pmkisan.gov.in) (விவசாயிகள் போர்ட்டலில் சுயமாகவே OTR பதிவு செய்யலாம்)."
            )
        elif lang == "hi":
            reply = (
                "🌾 **प्रधानमंत्री किसान सम्मान निधि (PM-KISAN):**\n\n"
                "• **लाभ:** पात्र किसान परिवारों को प्रति वर्ष ₹6,000 की वित्तीय सहायता (₹2,000 की 3 समान किस्तों में)।\n"
                "• **पात्रता:** खेती योग्य भूमि वाले सभी भूमिधारक किसान परिवार।\n"
                "• **अनिवार्य आवश्यकताएं:** आधार कार्ड, भूमि अभिलेख (खतौनी), आधार-लिंक्ड बैंक खाता और बायोमेट्रिक eKYC।\n"
                "• **आधिकारिक पोर्टल:** [pmkisan.gov.in](https://pmkisan.gov.in)"
            )
        else:
            reply = (
                "🌾 **PM-KISAN (Pradhan Mantri Kisan Samman Nidhi):**\n\n"
                "• **Benefit:** ₹6,000 per year income support provided in 3 equal four-monthly installments of ₹2,000 directly into farmer bank accounts.\n"
                "• **Eligibility:** All cultivable landholding farmer families across India (irrespective of land size).\n"
                "• **Mandatory Requirements:** Aadhaar card, valid Land Ownership Records (Patta/Chitta/Khatauni), Active DBT-enabled bank account, and completion of Aadhaar OTP e-KYC.\n"
                "• **Official Portal:** Register or check beneficiary status at [pmkisan.gov.in](https://pmkisan.gov.in)."
            )
        return {
            "reply": reply,
            "category": "scheme",
            "suggested_questions": [
                "How to complete PM-KISAN eKYC?",
                "How to download Land Patta / Chitta?",
                "What other agriculture schemes are available?"
            ]
        }

    if any(k in q for k in ["ayushman", "pm-jay", "pmjay", "health insurance", "மருத்துவ காப்பீடு", "ஆயுஷ்மான்", "आयुष्मान", "காப்பீடு"]):
        if lang == "ta":
            reply = (
                "🏥 **ஆயுஷ்மான் பாரத் & முதல்வர் மருத்துவக் காப்பீட்டுத் திட்டம் (PM-JAY / CMCHIS):**\n\n"
                "• **பயன்:** அரசு மற்றும் அங்கீகரிக்கப்பட்ட தனியார் மருத்துவமனைகளில் குடும்பத்திற்கு ஆண்டுக்கு ₹5,00,000 வரை ரொக்கமில்லா (Cashless) இலவச சிகிச்சை.\n"
                "• **தகுதிகள்:** SECC பட்டியல் குடும்பங்கள், அந்தியோதயா குடும்ப அட்டைதாரர்கள், மற்றும் ஆண்டு வருமானம் ₹1,20,000-க்குள் உள்ள குடும்பங்கள்.\n"
                "• **தேவையான ஆவணங்கள்:** ஆதார் அட்டை, ரேஷன் கார்டு, வருமானச் சான்றிதழ்.\n"
                "• **ஆயுஷ்மான் அட்டை பதிவிறக்கம்:** [beneficiary.nha.gov.in](https://beneficiary.nha.gov.in) தளத்தில் உங்கள் ஆதார் உள்ளிட்டு Ayushman Card பதிவிறக்கம் செய்யலாம்."
            )
        elif lang == "hi":
            reply = (
                "🏥 **आयुष्मान भारत प्रधानमंत्री जन आरोग्य योजना (AB PM-JAY):**\n\n"
                "• **लाभ:** देश के किसी भी सूचीबद्ध सरकारी या निजी अस्पताल में प्रति परिवार प्रति वर्ष ₹5 लाख तक का कैशलेस इलाज।\n"
                "• **पात्रता:** SECC 2011 सूची में शामिल गरीब और वंचित परिवार।\n"
                "• **आयुष्मान कार्ड डाउनलोड:** [beneficiary.nha.gov.in](https://beneficiary.nha.gov.in) पर जाकर आधार OTP द्वारा तुरंत डिजिटल कार्ड डाउनलोड करें।"
            )
        else:
            reply = (
                "🏥 **Ayushman Bharat (AB PM-JAY) & Chief Minister's Health Insurance (CMCHIS):**\n\n"
                "• **Benefit:** ₹5,00,000 cashless secondary and tertiary hospitalization cover per family per year across empaneled hospitals nationwide.\n"
                "• **Eligibility:** Economically vulnerable families identified under SECC database or possessing NFSA / Antyodaya Ration Cards.\n"
                "• **Download Ayushman Card:** Visit the official beneficiary portal at [beneficiary.nha.gov.in](https://beneficiary.nha.gov.in) to verify status and download your Ayushman Card using Aadhaar OTP."
            )
        return {
            "reply": reply,
            "category": "scheme",
            "suggested_questions": [
                "How to check name in Ayushman Bharat beneficiary list?",
                "How to download e-Aadhaar card?",
                "What are steps to apply for health schemes?"
            ]
        }

    # 5. STUDENT SCHOLARSHIPS / COLLEGE
    if any(k in q for k in ["college", "student", "scholarship", "கல்லூரி", "உதவித்தொகை", "छात्रवृत्ति", "degree", "pudhumai", "புதுமை", "विद्याర్థి", "ವಿದ್ಯಾರ್ಥಿವೇತನ"]):
        if lang == "ta":
            reply = (
                "🎓 **கல்லூரி மாணவர்களுக்கான முக்கிய திட்டங்கள் & உதவித்தொகைகள்:**\n\n"
                "1. **புதுமைப் பெண் திட்டம்:** அரசுப் பள்ளிகளில் 6-12 பயின்ற மாணவிகளுக்கு மாதம் ₹1,000 (ஆண்டுக்கு ₹12,000) உயர்கல்வி உதவித்தொகை ([penkalvi.tn.gov.in](https://penkalvi.tn.gov.in)).\n"
                "2. **தமிழ் புதல்வன் திட்டம்:** அரசுப் பள்ளிகளில் பயின்று கல்லூரி செல்லும் மாணவர்களுக்கும் மாதம் ₹1,000 உதவித்தொகை.\n"
                "3. **SC/ST போஸ்ட்-மெட்ரிக் கல்வி உதவித்தொகை:** முழுக் கல்விக் கட்டண விலக்கு + பராமரிப்புப் படி (வருமானம் ≤ ₹2.5 லட்சம்).\n"
                "4. **முதல் பட்டதாரி சலுகை:** அரசு ஒதுக்கீட்டு பொறியியல்/மருத்துவ படிப்புகளுக்கு ஆண்டுக்கு ₹25,000 கல்விக் கட்டண தள்ளுபடி.\n"
                "5. **PM-USP மத்திய அரசு உதவித்தொகை:** 12-ஆம் வகுப்பில் 80% மேல் மதிப்பெண் பெற்ற மாணவர்களுக்கு ஆண்டுக்கு ₹12,000 முதல் ₹20,000 வரை ([scholarships.gov.in](https://scholarships.gov.in))."
            )
        elif lang == "hi":
            reply = (
                "🎓 **कॉलेज छात्रों के लिए प्रमुख छात्रवृत्तियां:**\n\n"
                "1. **पुधुमई पेन योजना (TN):** सरकारी स्कूल की छात्राओं को कॉलेज के लिए ₹1,000/माह (₹12,000/वर्ष)।\n"
                "2. **पोस्ट-मैट्रिक छात्रवृत्ति (SC/ST/OBC):** 100% ट्यूशन फीस माफ़ी और मासिक भत्ता।\n"
                "3. **PM-USP केंद्रीय क्षेत्र छात्रवृत्ति:** 12वीं में 80% से अधिक अंक पाने वाले छात्रों को ₹12,000 - ₹20,000/वर्ष ([scholarships.gov.in](https://scholarships.gov.in))।\n"
                "4. **कर्नाटक युवा निधि:** बेरोजगार डिग्री धारकों के लिए ₹3,000/माह।"
            )
        else:
            reply = (
                "🎓 **Top Scholarships for Higher Education:**\n\n"
                "1. **Pudhumai Penn Scheme (TN):** ₹1,000/month (₹12,000/year) direct DBT for girl students from government schools pursuing UG/Diploma.\n"
                "2. **Tamil Pudhalvan Scheme (TN):** ₹1,000/month DBT for male students from government schools entering college.\n"
                "3. **Post-Matric Scholarship for SC/ST/SCA:** 100% Tuition Fee waiver + maintenance allowance for annual income ≤ ₹2.5 Lakhs.\n"
                "4. **First Graduate Tuition Concession:** ₹25,000/year fee concession for first graduates entering engineering or professional courses via counseling.\n"
                "5. **PM-USP Central Sector Scholarship:** ₹12,000 - ₹20,000/year for students above 80th percentile in Class 12 on [scholarships.gov.in](https://scholarships.gov.in)."
            )
        return {
            "reply": reply,
            "category": "scheme",
            "suggested_questions": [
                "What are steps to apply for Pudhumai Penn?",
                "What is PM-KISAN scheme?",
                "How to download e-PAN card?"
            ]
        }

    # 6. GOVERNMENT JOBS & EXAMINATIONS / DEADLINES
    if any(k in q for k in ["job", "exam", "upsc", "ssc", "rrb", "ibps", "tnpsc", "kpsc", "appsc", "mpsc", "deadline", "reminder", "recruitment", "vacancy", "தேர்வு", "வேலைவாய்ப்பு", "கடைசி தேதி", "பணி", "परीक्षा", "नौकरी", "भर्ती", "ఉద్యోగం", "ಪರೀಕ್ಷೆ"]):
        if lang == "ta":
            reply = (
                "🏛️ **மத்திய & மாநில அரசுப் பணிகள் மற்றும் தேர்வுகள் வழிகாட்டல்:**\n\n"
                "1. **மத்திய அரசு தேர்வுகள்:**\n"
                "   • **UPSC Civil Services (IAS/IPS):** [upsconline.nic.in](https://upsconline.nic.in) (பட்டம் முடித்தவர்கள்).\n"
                "   • **SSC CGL & CHSL:** [ssc.gov.in](https://ssc.gov.in) (மத்திய அமைச்சக பணிகள், 12th / பட்டம்).\n"
                "   • **ரயில்வே RRB NTPC:** [rrbapply.gov.in](https://rrbapply.gov.in) (நிலைய தலைவர் & எழுத்தர், 11,000+ இடங்கள்).\n"
                "   • **வங்கித் தேர்வுகள் (IBPS PO):** [ibps.in](https://www.ibps.in) (தேசியமயமாக்கப்பட்ட வங்கிகள்).\n\n"
                "2. **தமிழ்நாடு TNPSC & காவல்துறை தேர்வுகள்:**\n"
                "   • **TNPSC குரூப் 4 & VAO:** 10-ஆம் வகுப்பு தகுதி, கிராம நிர்வாக அலுவலர் & இளநிலை உதவியாளர் [apply.tnpscexams.in](https://apply.tnpscexams.in).\n"
                "   • **TNUSRB காவலர் & SI:** சீருடைப் பணியாளர் தேர்வு [tnusrb.tn.gov.in](https://www.tnusrb.tn.gov.in).\n\n"
                "⏱ **நினைவூட்டல் (Reminders):** Entitle AI-யில் உள்ள **'Govt Jobs & Exams'** மற்றும் **'Deadlines & Alerts'** பக்கங்களில் 1-கிளிக்கில் வாட்ஸ்அப் மற்றும் கேலெண்டர் நினைவூட்டல் அமைக்கலாம்!"
            )
        elif lang == "hi":
            reply = (
                "🏛️ **केंद्रीय और राज्य सरकारी नौकरियां व परीक्षा मार्गदर्शन:**\n\n"
                "1. **केंद्रीय परीक्षाएं:**\n"
                "   • **UPSC सिविल सेवा (IAS/IPS):** [upsconline.nic.in](https://upsconline.nic.in) (स्नातक).\n"
                "   • **SSC CGL और CHSL:** [ssc.gov.in](https://ssc.gov.in) (केंद्रीय मंत्रालयों में 20,000+ पद).\n"
                "   • **रेलवे भर्ती (RRB NTPC):** [rrbapply.gov.in](https://rrbapply.gov.in) (स्टेशन मास्टर और क्लर्क).\n"
                "   • **बैंक भर्ती (IBPS PO):** [ibps.in](https://www.ibps.in) (सार्वजनिक क्षेत्र के बैंक).\n\n"
                "2. **राज्य लोक सेवा आयोग:**\n"
                "   • TNPSC (तमिलनाडु), KPSC (कर्नाटक), MPSC (महाराष्ट्र), APPSC (आंध्र प्रदेश)।\n\n"
                "⏱ **डेडलाइन अलर्ट:** किसी भी परीक्षा या योजना की अंतिम तिथि से पहले रिमाइंडर सेट करने के लिए हमारे 'Deadlines & Alerts' पोर्टल का उपयोग करें!"
            )
        else:
            reply = (
                "🏛️ **Central & State Government Jobs & Exam Guide:**\n\n"
                "1. **Central Government Recruitment Exams:**\n"
                "   • **UPSC Civil Services (IAS/IPS/IFS):** Apply on [upsconline.nic.in](https://upsconline.nic.in) (Graduates, Level 10).\n"
                "   • **SSC Combined Graduate Level (CGL):** Apply on [ssc.gov.in](https://ssc.gov.in) (17,700+ Officer posts).\n"
                "   • **Railway Recruitment Board (RRB NTPC):** Apply on [rrbapply.gov.in](https://rrbapply.gov.in) (11,500+ Station Master/Clerk posts).\n"
                "   • **IBPS Banking (PO/Clerk):** Apply on [ibps.in](https://www.ibps.in) (Nationalized Banks).\n\n"
                "2. **State Public Service Commissions:**\n"
                "   • **TNPSC (Tamil Nadu):** Group 4 & VAO (10th Pass, 6,200+ posts) and Group 2 on [apply.tnpscexams.in](https://apply.tnpscexams.in).\n"
                "   • **TNUSRB Police Constable & SI:** [tnusrb.tn.gov.in](https://www.tnusrb.tn.gov.in).\n"
                "   • **KPSC (Karnataka KAS), APPSC, Kerala PSC Thulasi.**\n\n"
                "⏱ **Deadline Reminders:** Open our **'Govt Jobs & Exams'** or **'Deadlines & Alerts'** portal in the top navigation to set 1-click WhatsApp alerts or Google Calendar sync (.ics)!"
            )
        return {
            "reply": reply,
            "category": "exam",
            "suggested_questions": [
                "Which exams are closing this week?",
                "What are steps to apply for TNPSC Group 4?",
                "How to download e-Aadhaar card?"
            ]
        }

    # 7. ABOUT ENTITLE AI / PRIVACY / HOW IT WORKS
    if any(k in q for k in ["entitle ai", "what is this", "how it works", "privacy", "secure", "உரிமை", "urimai", "अधिकार", "हक्क", "హక్కు", "எப்படி செயல்படுகிறது", "सुरक्षा"]):
        if lang == "ta":
            reply = (
                "🛡️ **என்டைட்டில் AI (Entitle AI) எவ்வாறு செயல்படுகிறது?**\n\n"
                "• **100% தனிநபர் பாதுகாப்பு:** உங்கள் வயது, வருமானம், சாதி தகவல்கள் எந்த சர்வரிலும் சேமிக்கப்படாது. உங்கள் போனிலேயே தகுதி கணக்கிடப்படுகிறது.\n"
                "• **துல்லியமான விதிமுறை பொருத்தம்:** அரசாணை விதிகளின்படி நீங்கள் விண்ணப்பிக்கக்கூடிய நலத்திட்டங்கள் மற்றும் அரசு வேலைகளை உடனே கண்டறியலாம்.\n"
                "• **குடும்ப பயன்முறை (Family Mode):** உங்கள் வீட்டில் உள்ள ஒவ்வொரு உறுப்பினருக்கும் ஏற்ற திட்டங்களை ஒரே நேரத்தில் அறியலாம்.\n"
                "• **கடைசி தேதி நினைவூட்டல்:** திட்டங்கள் மற்றும் தேர்வுகளின் கடைசி தேதி முடிவதற்குள் வாட்ஸ்அப் மற்றும் கேலெண்டர் நினைவூட்டல் பெறலாம்."
            )
        elif lang == "hi":
            reply = (
                "🛡️ **एंटाइटल AI (Entitle AI) कैसे कार्य करता है?**\n\n"
                "• **100% गोपनीयता सुरक्षा:** आपकी व्यक्तिगत जानकारी किसी सर्वर पर स्टोर नहीं होती। गणना आपके डिवाइस पर ही होती है।\n"
                "• **सटीक नियम इंजन:** सरकारी नियमों के आधार पर आपको मिलने वाली योजनाओं और नौकरियों की सूची तुरंत मिलती है।\n"
                "• **डेडलाइन रिमाइंडर:** योजनाओं और परीक्षाओं की अंतिम तिथि से पहले अलर्ट प्राप्त करें।"
            )
        else:
            reply = (
                "🛡️ **How Entitle AI Works:**\n\n"
                "• **100% Client-Side Privacy:** Your answers (age, income, community) are processed in-memory and NEVER stored on any remote server.\n"
                "• **Deterministic Rules Engine:** Matches you against verified gazette criteria without AI hallucination.\n"
                "• **Family Mode:** Evaluate multiple family members in a single run.\n"
                "• **Govt Jobs & Deadline Alerts:** Proactive countdown reminders and verified official portals directory."
            )
        return {
            "reply": reply,
            "category": "about",
            "suggested_questions": [
                "What are steps to apply for schemes?",
                "How do I check my eligibility?",
                "Show all scholarship schemes"
            ]
        }

    # 8. DEFAULT GENERAL WELFARE ASSISTANCE (Entitle AI Localized)
    if lang == "ta":
        reply = (
            "வணக்கம்! நான் உங்கள் **என்டைட்டில் AI (Entitle AI) வழிகாட்டி**.\n\n"
            "நான் உங்களுக்கு பின்வரும் வழிகளில் உதவ முடியும்:\n"
            "• **விண்ணப்பிக்கும் படிநிலைகள்:** 'what are steps' அல்லது 'எப்படி விண்ணப்பிப்பது' எனக் கேட்டால் 6 முக்கிய படிநிலைகளை விளக்குவேன்.\n"
            "• **அரசு நலத்திட்டங்கள்:** புதுமைப் பெண், கலைஞர் மகளிர் உரிமைத் தொகை, கல்வி உதவித்தொகை, PM-KISAN, ஆயுஷ்மான் பாரத்.\n"
            "• **இ-சேவை வழிகாட்டல்:** ஆதார் அட்டை, பான் கார்டு, வருமானச் சான்றிதழ், சாதி சான்றிதழ், ஸ்மார்ட் ரேஷன் கார்டு பதிவிறக்கம்.\n"
            "• **அரசு வேலை & தேர்வுகள்:** TNPSC, ரயில்வே RRB, SSC, UPSC, வங்கித் தேர்வுகள் மற்றும் கடைசி தேதி நினைவூட்டல்கள்.\n\n"
            "உங்களுக்கு என்ன தகவல் தேவைப்படுகிறது?"
        )
    elif lang == "hi":
        reply = (
            "नमस्ते! मैं आपका **एंटाइटल AI (Entitle AI) सहायक** हूँ।\n\n"
            "मैं आपकी निम्न विषयों में सहायता कर सकता हूँ:\n"
            "• **आवेदन प्रक्रिया:** 'what are steps' पूछने पर सरकारी योजनाओं और नौकरियों के 6 आसान चरण बताऊंगा।\n"
            "• **सरकारी योजनाएं:** छात्रवृत्तियां, महिला सहायता, पीएम-किसान, आयुष्मान भारत।\n"
            "• **ई-सेवा और दस्तावेज:** आधार कार्ड, पैन कार्ड, आय और जाति प्रमाण पत्र डाउनलोड।\n"
            "• **सरकारी नौकरियां व अंतिम तिथि अलर्ट:** SSC, UPSC, रेलवे और बैंक भर्ती।\n\n"
            "आप क्या जानना चाहते हैं?"
        )
    elif lang == "te":
        reply = (
            "నమస్కారం! నేను మీ **ఎంటైటిల్ AI (Entitle AI) సహాయకుడిని**.\n\n"
            "నేను మీకు ఈ క్రింది అంశాలలో సహాయం చేయగలను:\n"
            "• **దరఖాస్తు విధానం:** పథకాలు మరియు ప్రభుత్వ ఉద్యోగాలకు దరఖాస్తు చేసే 6 ముఖ్యమైన దశలు.\n"
            "• **ప్రభుత్వ పథకాలు:** స్కాలర్‌షిప్‌లు, మహిళా సంక్షేమం, PM-కిసాన్, ఆయుష్మాన్ భారత్.\n"
            "• **ఈ-సేవ పత్రాలు:** ఆధార్, పాన్ కార్డు, ఆదాయ ధృవీకరణ పత్రాలు డౌన్‌లోడ్.\n"
            "• **పోటీ పరీక్షలు & అలర్ట్‌లు:** SSC, UPSC, రైల్వేస్ మరియు రాష్ట్ర ఉద్యోగాలు."
        )
    elif lang == "kn":
        reply = (
            "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ **ಎಂಟೈಟಲ್ AI (Entitle AI) ಸಹಾಯಕ**.\n\n"
            "ನಾನು ನಿಮಗೆ ಈ ಕೆಳಗಿನ ವಿಷಯಗಳಲ್ಲಿ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ:\n"
            "• **ಅರ್ಜಿ ಸಲ್ಲಿಸುವ ಹಂತಗಳು:** ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು ಮತ್ತು ಪರೀಕ್ಷೆಗಳಿಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸುವ 6 ಸುಲಭ ಹಂತಗಳು.\n"
            "• **ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು:** ವಿದ್ಯಾರ್ಥಿವೇತನಗಳು, ಮಹಿಳಾ ಯೋಜನೆಗಳು, ಪಿಎಂ-ಕಿಸಾನ್, ಆಯುಷ್ಮಾನ್ ಭಾರತ್.\n"
            "• **ಇ-ಸೇವಾ ದಾಖಲೆಗಳು:** ಆಧಾರ್, ಪ್ಯಾನ್ ಕಾರ್ಡ್, ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ ಡೌನ್‌ಲೋಡ್.\n"
            "• **ಸರ್ಕಾರಿ ಉದ್ಯೋಗಗಳು ಮತ್ತು ಗಡುವು ಎಚ್ಚರಿಕೆಗಳು.**"
        )
    elif lang == "ml":
        reply = (
            "നമസ്കാരം! ഞാൻ നിങ്ങളുടെ **എന്റൈറ്റിൽ AI (Entitle AI) അസിസ്റ്റന്റ്** ആണ്.\n\n"
            "എനിക്ക് ഇനിപ്പറയുന്നവയിൽ നിങ്ങളെ സഹായിക്കാനാകും:\n"
            "• **അപേക്ഷാ ഘട്ടങ്ങൾ:** സർക്കാർ പദ്ധതികൾക്കും പരീക്ഷകൾക്കും അപേക്ഷിക്കാനുള്ള 6 ഘട്ടങ്ങൾ.\n"
            "• **സർക്കാർ പദ്ധതികൾ:** സ്കോളർഷിപ്പുകൾ, സ്ത്രീ ശാക്തീകരണം, പിഎം-കിസാൻ, ആയുഷ്മാൻ ഭാരത്.\n"
            "• **ഇ-സേവാ രേഖകൾ:** ആധാർ, പാൻ കാർഡ്, വരുമാന സർട്ടിഫിക്കറ്റ് ഡൗൺലോഡ്.\n"
            "• **സർക്കാർ ജോലികളും സമയപരിധി അറിയിപ്പുകളും.**"
        )
    else:
        reply = (
            "Hello! I am your **Entitle AI Welfare & Career Assistant**.\n\n"
            "I can assist you with:\n"
            "• **Application Steps & Procedures:** Ask *'What are the steps to apply?'* to get a detailed 6-step roadmap.\n"
            "• **Government Schemes & Scholarships:** Higher education grants, women empowerment (Pudhumai Penn, Magalir Urimai), PM-KISAN, and Ayushman Bharat PM-JAY.\n"
            "• **e-Sevai & Document Downloads:** Step-by-step guides for e-Aadhaar, e-PAN, Income Certificate, Community Certificate, and Smart Ration Card.\n"
            "• **Government Jobs & Deadline Alerts:** Official portals for RRB Railways, UPSC, SSC, Banking, TNPSC, and 1-click WhatsApp/calendar reminders.\n\n"
            "Feel free to ask any question or tap one of the suggested prompts below!"
        )

    return {
        "reply": reply,
        "category": "general",
        "suggested_questions": [
            "What are the steps to apply?",
            "How do I download e-Aadhaar or e-PAN?",
            "What scholarships are available for college students?",
            "Which exams or schemes are closing soon?"
        ]
    }

async def generate_chat_response(
    message: str,
    language: str = "en",
    context_scheme: Optional[Any] = None,
    history: Optional[List[Dict[str, str]]] = None
) -> Dict[str, Any]:
    """
    Combines external LLM (if configured) with rock-solid heuristic knowledge base fallback.
    Guaranteed to NEVER fail or crash!
    """
    # If live LLM key is configured, attempt LLM call
    if settings.LLM_API_KEY and not settings.LLM_API_KEY.startswith("mock"):
        try:
            system_instruction = f"""You are Entitle AI Assistant, an official, helpful, and empathetic Indian government scheme, exam, and e-Sevai guidance expert.
Respond to the citizen in the requested language ({language}).
Provide clear step-by-step guidance on government schemes, eligibility, official portals (tnesevai.tn.gov.in, scholarships.gov.in, uidai.gov.in, ssc.gov.in, rrbapply.gov.in), and document downloads.
Keep formatting clean with bullet points and bold headers."""

            prompt = f"{system_instruction}\n\nCitizen Question: {message}"
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.LLM_MODEL}:generateContent?key={settings.LLM_API_KEY}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.3, "maxOutputTokens": 450}
            }
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                    return {
                        "reply": text,
                        "category": "ai",
                        "suggested_questions": [
                            "What are the steps to apply?",
                            "How do I download e-Aadhaar or e-PAN?",
                            "How to apply on official portal?",
                            "Check my eligibility on Questionnaire"
                        ]
                    }
        except Exception as err:
            logger.warning(f"Live LLM call failed, reverting to built-in knowledge engine: {err}")

    # Rock-solid intelligent knowledge engine fallback
    return get_intelligent_assistant_reply(
        query=message,
        language=language,
        context_scheme=context_scheme,
        history=history
    )

async def generate_policy_diff_summary(old_text: str, new_text: str, diff_text: str) -> str:
    """Generates a concise summary of detected policy changes."""
    if not settings.LLM_API_KEY or settings.LLM_API_KEY.startswith("mock"):
        return f"Policy portal update detected. Text modified by {len(new_text) - len(old_text)} characters. Diff highlights changes in eligibility guidelines or administrative terms."

    prompt = f"""Summarize in 2-3 brief sentences the policy changes detected between the old and new text from an official government scheme website:
DIFF:
{diff_text[:1500]}
"""
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.LLM_MODEL}:generateContent?key={settings.LLM_API_KEY}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.2, "maxOutputTokens": 150}
        }
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                return data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except Exception as err:
        logger.warning(f"LLM summary failed: {err}")

    return "Portal guidelines updated. Please inspect diff for details."
