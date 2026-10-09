import json

titles = {
    'en': {
        'name': 'Entitle AI',
        'tagline': 'Discover government schemes, jobs & scholarships you are entitled to'
    },
    'ta': {
        'name': 'உரிமை AI',
        'tagline': 'நீங்கள் பெறத் தகுதியான அரசு நலத்திட்டங்கள், தேர்வுகள் & உதவித்தொகைகள்'
    },
    'hi': {
        'name': 'अधिकार AI',
        'tagline': 'सरकारी योजनाएं, परीक्षाएं और छात्रवृत्तियां जिन्हें पाने के आप हकदार हैं'
    },
    'te': {
        'name': 'హక్కు AI',
        'tagline': 'మీకు అర్హత ఉన్న ప్రభుత్వ సంక్షేమ పథకాలు, ఉద్యోగాలు & ఉపకార వేతనాలు'
    },
    'kn': {
        'name': 'ಹಕ್ಕು AI',
        'tagline': 'ನೀವು ಅರ್ಹತೆ ಹೊಂದಿರುವ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು, ಉದ್ಯೋಗಗಳು ಮತ್ತು ವಿದ್ಯಾರ್ಥಿವೇತನಗಳು'
    },
    'ml': {
        'name': 'അവകാശം AI',
        'tagline': 'നിങ്ങൾക്ക് അർഹമായ സർക്കാർ പദ്ധതികളും, ജോലികളും, സ്കോളർഷിപ്പുകളും'
    },
    'bn': {
        'name': 'অধিকার AI',
        'tagline': 'সরকারি প্রকল্প, চাকরি ও বৃত্তিসমূহ যা আপনার প্রাপ্য'
    },
    'mr': {
        'name': 'हक्क AI',
        'tagline': 'शासकीय योजना, नोकऱ्या आणि शिष्यवृत्ती ज्यांचे तुम्ही पात्र आहात'
    },
    'gu': {
        'name': 'અધિકાર AI',
        'tagline': 'સરકારી યોજનાઓ, નોકરીઓ અને શિષ્યવૃત્તિ જેના માટે તમે હકદાર છો'
    }
}

for lang, data in titles.items():
    path = f'frontend/src/i18n/locales/{lang}.json'
    with open(path, 'r', encoding='utf-8') as f:
        content = json.load(f)
    if 'brand' not in content:
        content['brand'] = {}
    content['brand']['name'] = data['name']
    content['brand']['tagline'] = data['tagline']
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(content, f, ensure_ascii=False, indent=2)
    print(f"Updated {lang}.json with name: {data['name'].encode('ascii', 'backslashreplace').decode('ascii')}")

print("All locale files successfully updated!")
