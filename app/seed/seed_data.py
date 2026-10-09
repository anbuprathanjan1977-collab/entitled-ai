"""
========================================================================================
URIMAI-AI SEED DATA
IMPORTANT NOTICE FOR DEMO / HACKATHON EVALUATION:
The schemes below are CLEARLY MARKED PLACEHOLDERS for demonstration and testing purposes.
Real scheme rules, income ceilings, guidelines, and official deadlines must be independently 
verified from authorized official government gazettes (tnega.tn.gov.in, scholarships.gov.in, pmkisan.gov.in)
before any production or live citizen deployment.
========================================================================================
"""

from datetime import date, timedelta
from sqlalchemy.orm import Session
from app.models import Scheme, Document, SchemeSource, Admin, GovtExam, ChangeEvent
from app.services.auth_service import get_password_hash
from app.config import settings

def seed_database(db: Session):
    # 1. Seed Admin
    existing_admin = db.query(Admin).filter(Admin.email == settings.ADMIN_EMAIL).first()
    if not existing_admin:
        admin_user = Admin(
            email=settings.ADMIN_EMAIL,
            password_hash=get_password_hash(settings.ADMIN_PASSWORD)
        )
        db.add(admin_user)
        db.commit()

    # 2. Check if already seeded with new schemes count
    if db.query(Scheme).count() >= 10:
        refresh_scheme_deadlines(db)
        seed_govt_exams(db)
        return

    # Clear old schemes if needed for refresh
    if db.query(Scheme).count() > 0 and db.query(Scheme).count() < 10:
        db.query(ChangeEvent).delete()
        db.query(SchemeSource).delete()
        db.query(Scheme).delete()
        db.query(Document).delete()
        db.commit()

    # 3. Seed Standard Documents
    doc_aadhaar = Document(
        name_en="Aadhaar Card",
        name_ta="ஆதார் அட்டை",
        name_hi="आधार कार्ड",
        how_to_get_en="Download e-Aadhaar from uidai.gov.in or visit any authorized e-Sevai / Aadhaar enrollment centre.",
        how_to_get_ta="uidai.gov.in இணையதளத்திலிருந்து பதிவிறக்கவும் அல்லது இ-சேவை மையத்திற்குச் செல்லவும்.",
        how_to_get_hi="uidai.gov.in से ई-आधार डाउनलोड करें या निकटतम आधार केंद्र पर जाएं।"
    )
    doc_pan = Document(
        name_en="PAN Card",
        name_ta="பான் அட்டை",
        name_hi="पैन कार्ड",
        how_to_get_en="Download instant e-PAN via Income Tax e-filing portal (incometax.gov.in) or apply via NSDL/UTIITSL.",
        how_to_get_ta="வருமான வரி இணையதளத்தில் (incometax.gov.in) உடனடியாக e-PAN பதிவிறக்கம் செய்யலாம்.",
        how_to_get_hi="आयकर ई-फाइलिंग पोर्टल (incometax.gov.in) से तुरंत ई-पैन डाउनलोड करें।"
    )
    doc_income = Document(
        name_en="Annual Income Certificate",
        name_ta="வருமானச் சான்றிதழ்",
        name_hi="वार्षिक आय प्रमाण पत्र",
        how_to_get_en="Apply online via TN e-Sevai portal (tnesevai.tn.gov.in) or state e-District portal with salary slip / VAO verification report.",
        how_to_get_ta="tnesevai.tn.gov.in மூலமாக அல்லது கிராம நிர்வாக அலுவலர் (VAO) பரிந்துரையுடன் வட்டாட்சியர் அலுவலகத்தில் பெறலாம்.",
        how_to_get_hi="ई-सेवा पोर्टल या ई-डिस्ट्रिक्ट पोर्टल के माध्यम से ऑनलाइन आवेदन करें।"
    )
    doc_community = Document(
        name_en="Community / Caste Certificate",
        name_ta="சாதி சான்றிதழ்",
        name_hi="जाति प्रमाण पत्र",
        how_to_get_en="Apply at nearest e-Sevai Centre with parents' community certificate and school TC.",
        how_to_get_ta="பெற்றோரின் சாதிச் சான்றிதழ் மற்றும் பள்ளி மாற்றுச் சான்றிதழுடன் இ-சேவை மையத்தில் விண்ணப்பிக்கவும்.",
        how_to_get_hi="माता-पिता के जाति प्रमाण पत्र के साथ ई-सेवा केंद्र पर आवेदन करें।"
    )
    doc_first_grad = Document(
        name_en="First Graduate Certificate",
        name_ta="முதல் பட்டதாரி சான்றிதழ்",
        name_hi="प्रथम स्नातक प्रमाण पत्र",
        how_to_get_en="Obtain from Tahsildar through TN e-Sevai portal certifying that no one in the family has a degree.",
        how_to_get_ta="குடும்பத்தில் எவரும் பட்டதாரி இல்லை என்பதை உறுதிப்படுத்தும் வட்டாட்சியர் சான்றிதழை இ-சேவை வழியே பெறலாம்.",
        how_to_get_hi="टीएन ई-सेवा पोर्टल के माध्यम से तहसीलदार से प्राप्त करें।"
    )
    doc_bank = Document(
        name_en="Student / Beneficiary Bank Passbook (Aadhaar Seeded)",
        name_ta="வங்கி சேமிப்பு கணக்கு புத்தகம் (ஆதார் இணைக்கப்பட்டது)",
        name_hi="बैंक पासबुक (आधार से जुड़ा हुआ)",
        how_to_get_en="Open a savings account in any nationalized bank and ensure NPCI/Aadhaar DBT seeding is active.",
        how_to_get_ta="தேசியமயமாக்கப்பட்ட வங்கியில் சேமிப்புக் கணக்கு தொடங்கி ஆதார் DBT இணைப்பை உறுதி செய்யவும்.",
        how_to_get_hi="किसी भी राष्ट्रीयकृत बैंक में बचत खाता खोलें और आधार डीबीटी सक्षम कराएं।"
    )
    doc_marksheet = Document(
        name_en="10th & 12th Standard Marksheet",
        name_ta="10 & 12-ஆம் வகுப்பு மதிப்பெண் சான்றிதழ்",
        name_hi="10वीं और 12वीं की मार्कशीट",
        how_to_get_en="Original certificate issued by Board of Examinations or downloaded digitally via DigiLocker.",
        how_to_get_ta="தேர்வுகள் இயக்ககம் வழங்கிய அசல் சான்றிதழ் அல்லது DigiLocker நகல்.",
        how_to_get_hi="डिजीडॉकर या बोर्ड द्वारा जारी मूल अंकतालिका।"
    )
    doc_bonafide = Document(
        name_en="College Bonafide Certificate",
        name_ta="கல்லூரி போனாஃபைட் சான்றிதழ்",
        name_hi="कॉलेज बोनाफाइड सर्टिफिकेट",
        how_to_get_en="Request study certificate signed by the College Principal or Dean stating current course year.",
        how_to_get_ta="நீங்கள் பயிலும் கல்லூரி முதல்வர் அல்லது துறைத் தலைவரிடம் இருந்து பெறலாம்.",
        how_to_get_hi="वर्तमान पाठ्यक्रम वर्ष को प्रमाणित करने वाला कॉलेज प्राचार्य द्वारा हस्ताक्षरित प्रमाणपत्र।"
    )
    doc_ration = Document(
        name_en="Smart Family Ration Card",
        name_ta="ஸ்மார்ட் குடும்ப அட்டை (மின்னணு ரேஷன் கார்டு)",
        name_hi="स्मार्ट राशन कार्ड",
        how_to_get_en="Download digital smart card from tnpds.gov.in / state NFSA portal or provide physical PVC card.",
        how_to_get_ta="tnpds.gov.in தளத்திலிருந்து மின்னணு குடும்ப அட்டையைப் பதிவிறக்கம் செய்யலாம்.",
        how_to_get_hi="राज्य पीडीएस पोर्टल से डिजिटल स्मार्ट कार्ड डाउनलोड करें।"
    )
    doc_land = Document(
        name_en="Agricultural Land Record (Patta / Chitta)",
        name_ta="நில உரிமை ஆவணம் (பட்டா / சிட்டா)",
        name_hi="भूमि स्वामित्व रिकॉर्ड (खतौनी / पट्टा)",
        how_to_get_en="Download computerized Patta/Chitta from anytamilnadu eservices / state revenue portal.",
        how_to_get_ta="eservices.tn.gov.in இணையதளத்தில் பட்டா/சிட்டா கணினி நகல் பதிவிறக்கம் செய்யலாம்.",
        how_to_get_hi="राज्य भूलेख पोर्टल से भू-अभिलेख की डिजिटल प्रति डाउनलोड करें।"
    )

    db.add_all([
        doc_aadhaar, doc_pan, doc_income, doc_community, doc_first_grad, 
        doc_bank, doc_marksheet, doc_bonafide, doc_ration, doc_land
    ])
    db.commit()

    today = date.today()

    # --- 1. Tamil Nadu Schemes ---
    s1 = Scheme(
        name_en="[PLACEHOLDER] Moovalur Ramamirtham Ammaiyar Higher Education Assurance (Pudhumai Penn)",
        name_ta="[PLACEHOLDER] மூவலூர் ராமாமிர்தம் அம்மையார் உயர்கல்வி உறுதி திட்டம் (புதுமைப் பெண்)",
        name_hi="[PLACEHOLDER] मुवालूर रामामिरथम अम्मैयार उच्च शिक्षा आश्वासन (पुधुमई पेन)",
        level="state",
        state="Tamil Nadu",
        category="Women / Higher Education",
        benefit_amount=12000.0,
        benefit_text="₹1,000 / month direct bank assistance (₹12,000 / year)",
        description_en="Financial assistance of ₹1,000/month provided to girl students who studied classes 6 to 12 in Tamil Nadu Government schools, pursuing higher education (UG, Diploma, ITI) until graduation.",
        description_ta="தமிழ்நாடு அரசுப் பள்ளிகளில் 6 முதல் 12 ஆம் வகுப்பு வரை பயின்று உயர்கல்வி பயிலும் மாணவிகளுக்கு மாதம் ₹1,000 நேரடி வங்கி வரவு.",
        description_hi="तमिलनाडु के सरकारी स्कूलों में कक्षा 6 से 12 तक पढ़ने वाली छात्राओं को उच्च शिक्षा के लिए ₹1,000 प्रति माह।",
        deadline=today + timedelta(days=28),
        official_url="https://penkalvi.tn.gov.in",
        apply_steps=[
            "Visit the official Pen Kalvi portal or contact your college nodal officer.",
            "Verify registration using EMIS number from school records and Aadhaar.",
            "Ensure student bank account is NPCI Aadhaar-seeded for DBT.",
            "Submit bonafide college admission confirmation."
        ],
        rules=[
            {"field": "gender", "op": "==", "value": "female", "label_en": "Gender must be Female", "label_ta": "பெண் பாலினமாக இருத்தல் வேண்டும்"},
            {"field": "education", "op": "in", "value": ["Under Graduate", "Diploma", "ITI"], "label_en": "Enrolled in UG Degree, Diploma, or ITI", "label_ta": "இளங்கலை பட்டம், டிப்ளமோ அல்லது ஐடிஐ பயிலுதல் வேண்டும்"},
            {"field": "state", "op": "==", "value": "Tamil Nadu", "label_en": "Resident/Studying in Tamil Nadu", "label_ta": "தமிழ்நாட்டில் வசிப்பவராக இருத்தல் வேண்டும்"}
        ],
        last_verified=today - timedelta(days=12),
        active=True
    )
    s1.documents.extend([doc_aadhaar, doc_bank, doc_bonafide, doc_marksheet])

    s2 = Scheme(
        name_en="[PLACEHOLDER] Tamil Nadu Post-Matric Scholarship Scheme for SC/ST/SCA",
        name_ta="[PLACEHOLDER] தமிழ்நாடு ஆதிதிராவிடர் மற்றும் பழங்குடியினர் போஸ்ட் மெட்ரிக் உதவித்தொகை",
        name_hi="[PLACEHOLDER] तमिलनाडु अनुसूचित जाति/जनजाति पोस्ट-मैट्रिक छात्रवृत्ति",
        level="state",
        state="Tamil Nadu",
        category="Scholarship",
        benefit_amount=45000.0,
        benefit_text="100% Tuition Fee Waiver + ₹6,500 maintenance allowance",
        description_en="Comprehensive scholarship covering full non-refundable tuition fees for SC/ST/SCA students in recognized colleges.",
        description_ta="அங்கீகரிக்கப்பட்ட கல்லூரிகளில் பயிலும் ஆதிதிராவிடர், பழங்குடியின மாணவர்களுக்கு முழுக் கல்விக் கட்டண விலக்கு மற்றும் பராமரிப்புப் படி.",
        description_hi="मान्यता प्राप्त कॉलेजों में पढ़ने वाले अनुसूचित जाति/जनजाति के छात्रों के लिए पूर्ण शुल्क छूट।",
        deadline=today + timedelta(days=10),
        official_url="https://adwscholarship.tn.gov.in",
        apply_steps=[
            "Register on the ADW Scholarship portal with Community and Income certificate numbers.",
            "Upload college bonafide certificate and bank account details.",
            "Submit application through college scholarship cell for electronic forwarding."
        ],
        rules=[
            {"field": "community", "op": "in", "value": ["SC", "ST", "SCA"], "label_en": "Community must be SC, ST, or SCA", "label_ta": "சாதிப் பிரிவு SC / ST / SCA ஆக இருக்க வேண்டும்"},
            {"field": "family_income", "op": "<=", "value": 250000, "label_en": "Annual family income must be ≤ ₹2,50,000", "label_ta": "ஆண்டு குடும்ப வருமானம் ₹2,50,000-க்குள் இருக்க வேண்டும்"},
            {"field": "education", "op": "in", "value": ["Under Graduate", "Post Graduate", "Diploma", "ITI"], "label_en": "Pursuing Post-Matric Education", "label_ta": "10-ஆம் வகுப்பிற்குப் பிந்தைய கல்வி பயிலுபவராக இருத்தல் வேண்டும்"}
        ],
        last_verified=today - timedelta(days=20),
        active=True
    )
    s2.documents.extend([doc_community, doc_income, doc_bonafide, doc_bank, doc_aadhaar])

    s3 = Scheme(
        name_en="[PLACEHOLDER] Chief Minister's First Graduate Tuition Fee Concession Scheme",
        name_ta="[PLACEHOLDER] தமிழ்நாடு முதல் பட்டதாரி கல்விக் கட்டண சலுகை திட்டம்",
        name_hi="[PLACEHOLDER] मुख्यमंत्री प्रथम स्नातक शिक्षण शुल्क रियायत योजना",
        level="state",
        state="Tamil Nadu",
        category="Higher Education",
        benefit_amount=25000.0,
        benefit_text="₹25,000 / year tuition fee waiver for professional degree courses",
        description_en="Special tuition fee waiver for students who are the first in their immediate family to pursue an undergraduate professional degree.",
        description_ta="குடும்பத்தில் முதன்முறையாக ஒற்றைச் சாளர கலந்தாய்வு மூலம் பட்டப்படிப்பில் சேரும் மாணவர்களுக்கு கல்விக் கட்டணச் சலுகை.",
        description_hi="काउंसलिंग के माध्यम से स्नातक व्यावसायिक पाठ्यक्रमों में प्रवेश लेने वाले परिवार के पहले स्नातक छात्र के लिए शुल्क में छूट।",
        deadline=today + timedelta(days=45),
        official_url="https://tndce.tn.gov.in",
        apply_steps=[
            "Apply for First Graduate Certificate at local e-Sevai or Tahsildar office.",
            "Obtain joint declaration certificate signed by parents and siblings.",
            "Produce First Graduate certificate during TNEA / single-window allotment."
        ],
        rules=[
            {"field": "first_graduate", "op": "==", "value": True, "label_en": "Must be First Graduate in family", "label_ta": "குடும்பத்தின் முதல் பட்டதாரியாக இருத்தல் வேண்டும்"},
            {"field": "education", "op": "in", "value": ["Under Graduate"], "label_en": "Pursuing Undergraduate degree", "label_ta": "இளங்கலை பட்டப்படிப்பு பயிலுபவராக இருத்தல் வேண்டும்"},
            {"field": "state", "op": "==", "value": "Tamil Nadu", "label_en": "Tamil Nadu resident", "label_ta": "தமிழ்நாட்டில் வசிப்பவராக இருத்தல் வேண்டும்"}
        ],
        last_verified=today - timedelta(days=105),
        active=True
    )
    s3.documents.extend([doc_first_grad, doc_ration, doc_aadhaar, doc_bonafide])

    s4 = Scheme(
        name_en="[PLACEHOLDER] Kalaignar Magalir Urimai Thogai Scheme",
        name_ta="[PLACEHOLDER] கலைஞர் மகளிர் உரிமைத் திட்டம்",
        name_hi="[PLACEHOLDER] कलैग्नार महिला अधिकार योजना",
        level="state",
        state="Tamil Nadu",
        category="Social Welfare",
        benefit_amount=12000.0,
        benefit_text="₹1,000 / month direct cash support (₹12,000 / year)",
        description_en="Direct basic income recognition scheme for women heads of eligible households to acknowledge household contributions.",
        description_ta="குடும்பத் தலைவிகளின் உழைப்பை அங்கீகரித்து சமூகப் பாதுகாப்பை மேம்படுத்த மாதம் ₹1,000 உரிமைத் தொகை வழங்கும் திட்டம்.",
        description_hi="पात्र परिवारों की महिला मुखियाओं के लिए ₹1,000 प्रति माह प्रत्यक्ष वित्तीय सहायता।",
        deadline=None,
        official_url="https://kmut.tn.gov.in",
        apply_steps=[
            "Submit special camp registration form at your ration shop location.",
            "Provide biometric Aadhaar authentication and Smart Ration Card details.",
            "SMS notification is sent upon bank account verification."
        ],
        rules=[
            {"field": "gender", "op": "==", "value": "female", "label_en": "Applicant must be Female", "label_ta": "விண்ணப்பதாரர் பெண் பாலினமாக இருத்தல் வேண்டும்"},
            {"field": "age", "op": ">=", "value": 21, "label_en": "Age must be at least 21 years", "label_ta": "குறைந்தது 21 வயது பூர்த்தியடைந்திருக்க வேண்டும்"},
            {"field": "family_income", "op": "<=", "value": 250000, "label_en": "Annual family income ≤ ₹2,50,000", "label_ta": "ஆண்டு குடும்ப வருமானம் ₹2,50,000-க்குள் இருத்தல் வேண்டும்"},
            {"field": "state", "op": "==", "value": "Tamil Nadu", "label_en": "Resident of Tamil Nadu", "label_ta": "தமிழ்நாட்டில் வசிப்பவராக இருத்தல் வேண்டும்"}
        ],
        last_verified=today - timedelta(days=5),
        active=True
    )
    s4.documents.extend([doc_ration, doc_aadhaar, doc_bank])

    # --- 2. Central / All-India Schemes ---
    s5 = Scheme(
        name_en="[PLACEHOLDER] Central Sector Scheme of Scholarship for College and University Students (PM-USP)",
        name_ta="[PLACEHOLDER] மத்திய பிரிவு கல்லூரி மற்றும் பல்கலைக்கழக மாணவர்களுக்கான உதவித்தொகை (PM-USP)",
        name_hi="[PLACEHOLDER] कॉलेज और विश्वविद्यालय के छात्रों के लिए केंद्रीय क्षेत्र छात्रवृत्ति (PM-USP)",
        level="central",
        state="All India",
        category="Scholarship",
        benefit_amount=20000.0,
        benefit_text="₹12,000 / year for UG (₹20,000 / year for PG)",
        description_en="Department of Higher Education (MoE) scholarship to support meritorious students from low-income families having scored above the 80th percentile in Class 12 board examinations.",
        description_ta="12-ஆம் வகுப்பு பொதுத்தேர்வில் 80 சதவீதத்திற்கும் அதிகமான மதிப்பெண் பெற்ற குறைந்த வருமானம் கொண்ட குடும்ப மாணவர்களுக்கான மத்திய அரசு உதவித்தொகை.",
        description_hi="12वीं बोर्ड में 80% से अधिक अंक प्राप्त करने वाले छात्रों के लिए उच्च शिक्षा मंत्रालय की केंद्रीय छात्रवृत्ति।",
        deadline=today + timedelta(days=9),
        official_url="https://scholarships.gov.in",
        apply_steps=[
            "Register on National Scholarship Portal (NSP) scholarships.gov.in.",
            "Verify Aadhaar with One Time Registration (OTR).",
            "Fill academic details and enter Class 12 board roll number.",
            "Submit for Institute Verification followed by State Nodal Officer approval."
        ],
        rules=[
            {"field": "family_income", "op": "<=", "value": 450000, "label_en": "Annual family income ≤ ₹4,50,000", "label_ta": "ஆண்டு குடும்ப வருமானம் ₹4,50,000-க்குள் இருக்க வேண்டும்"},
            {"field": "education", "op": "in", "value": ["Under Graduate", "Post Graduate"], "label_en": "Pursuing regular UG or PG course", "label_ta": "முழுநேர இளங்கலை அல்லது முதுகலை பயிலுபவராக இருத்தல் வேண்டும்"},
            {"field": "age", "op": "<=", "value": 25, "label_en": "Age must be 25 years or below", "label_ta": "வயது 25 அல்லது அதற்கும் குறைவாக இருத்தல் வேண்டும்"}
        ],
        last_verified=today - timedelta(days=15),
        active=True
    )
    s5.documents.extend([doc_marksheet, doc_income, doc_bonafide, doc_bank, doc_aadhaar])

    s6 = Scheme(
        name_en="[PLACEHOLDER] PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
        name_ta="[PLACEHOLDER] பிரதமர் கிசான் சம்மான் நிதி (PM-KISAN)",
        name_hi="[PLACEHOLDER] प्रधानमंत्री किसान सम्मान निधि (पीएम-किसान)",
        level="central",
        state="All India",
        category="Agriculture",
        benefit_amount=6000.0,
        benefit_text="₹6,000 / year (₹2,000 every 4 months via DBT)",
        description_en="Direct income support of ₹6,000 per annum to all landholding farmer families across India in three equal 4-monthly installments.",
        description_ta="நாடு முழுவதும் உள்ள விவசாய குடும்பங்களுக்கு ஆண்டுக்கு ₹6,000 நேரடி வங்கி உதவி (4 மாதங்களுக்கு ஒருமுறை ₹2,000).",
        description_hi="देश भर के सभी भूमिधारक किसान परिवारों को प्रति वर्ष ₹6,000 की प्रत्यक्ष आय सहायता।",
        deadline=None,
        official_url="https://pmkisan.gov.in",
        apply_steps=[
            "Register on pmkisan.gov.in portal or visit Common Service Centre (CSC).",
            "Provide Aadhaar number and mobile number linked with Aadhaar.",
            "Upload land record (Patta/Chitta/ROR) and bank account details.",
            "Complete mandatory e-KYC via OTP or face-authentication."
        ],
        rules=[
            {"field": "age", "op": ">=", "value": 18, "label_en": "Age must be 18 or above", "label_ta": "குறைந்தது 18 வயது இருத்தல் வேண்டும்"},
            {"field": "family_income", "op": "<=", "value": 400000, "label_en": "Family income ceiling", "label_ta": "குடும்ப வருமான வரம்பு"}
        ],
        last_verified=today - timedelta(days=18),
        active=True
    )
    s6.documents.extend([doc_aadhaar, doc_land, doc_bank])

    s7 = Scheme(
        name_en="[PLACEHOLDER] Ayushman Bharat PM-JAY (National Health Protection Scheme)",
        name_ta="[PLACEHOLDER] ஆயுஷ்மான் பாரத் பிரதம மந்திரி ஜன் ஆரோக்கிய திட்டம் (PM-JAY)",
        name_hi="[PLACEHOLDER] आयुष्मान भारत प्रधानमंत्री जन आरोग्य योजना (पीएम-जय)",
        level="central",
        state="All India",
        category="Healthcare",
        benefit_amount=500000.0,
        benefit_text="₹5,00,000 / year cashless hospitalisation per family",
        description_en="World's largest government-funded healthcare assurance scheme providing cashless coverage of up to ₹5 lakh per family per year for secondary and tertiary care hospitalization.",
        description_ta="ஏழை மற்றும் எளிய குடும்பங்களுக்கு ஆண்டுக்கு ₹5 லட்சம் வரை இலவச மருத்துவ சிகிச்சைக்கான மருத்துவக் காப்பீடு.",
        description_hi="प्रति वर्ष प्रति परिवार ₹5 लाख तक का कैशलेस स्वास्थ्य बीमा माध्यमिक और तृतीयक देखभाल अस्पताल में भर्ती के लिए।",
        deadline=None,
        official_url="https://beneficiary.nha.gov.in",
        apply_steps=[
            "Check eligibility on beneficiary.nha.gov.in using Aadhaar or Ration card.",
            "Complete Aadhaar e-KYC online or at nearest empanelled hospital / CSC.",
            "Download instant Ayushman Golden Card with unique PM-JAY ID."
        ],
        rules=[
            {"field": "family_income", "op": "<=", "value": 300000, "label_en": "Family annual income ≤ ₹3,00,000", "label_ta": "ஆண்டு குடும்ப வருமானம் ₹3,00,000-க்குள் இருத்தல் வேண்டும்"}
        ],
        last_verified=today - timedelta(days=8),
        active=True
    )
    s7.documents.extend([doc_aadhaar, doc_ration, doc_income])

    # --- 3. Other State Schemes (Karnataka, Andhra Pradesh, Maharashtra) ---
    s8 = Scheme(
        name_en="[PLACEHOLDER] Karnataka Yuva Nidhi Scheme",
        name_ta="[PLACEHOLDER] கர்நாடகா யுவ நிதி திட்டம்",
        name_hi="[PLACEHOLDER] कर्नाटक युवा निधि योजना",
        level="state",
        state="Karnataka",
        category="Skill / Youth Welfare",
        benefit_amount=36000.0,
        benefit_text="₹3,000 / month for graduates (₹1,500 / month for diploma holders)",
        description_en="Unemployment allowance provided by Karnataka Government to educated youth who passed degree/diploma courses, for up to 2 years while seeking employment.",
        description_ta="கர்நாடகாவில் பட்டம் அல்லது டிப்ளமோ முடித்து வேலை தேடும் இளைஞர்களுக்கு மாதம் ₹3,000 வரை உதவித்தொகை.",
        description_hi="कर्नाटक सरकार द्वारा डिग्री/डिप्लोमा धारक बेरोजगार युवाओं को प्रति माह ₹3,000 की वित्तीय सहायता।",
        deadline=today + timedelta(days=60),
        official_url="https://sevasindhugs.karnataka.gov.in",
        apply_steps=[
            "Visit Karnataka Seva Sindhu portal (sevasindhugs.karnataka.gov.in).",
            "Login with Aadhaar authentication and enter university registration number.",
            "Submit declaration of unemployment and Aadhaar seeded bank account."
        ],
        rules=[
            {"field": "education", "op": "in", "value": ["Under Graduate", "Post Graduate", "Diploma"], "label_en": "Degree or Diploma Graduate", "label_ta": "பட்டதாரி அல்லது டிப்ளமோ முடித்தவர்"},
            {"field": "state", "op": "==", "value": "Karnataka", "label_en": "Resident of Karnataka", "label_ta": "கர்நாடகாவில் வசிப்பவராக இருத்தல் வேண்டும்"}
        ],
        last_verified=today - timedelta(days=14),
        active=True
    )
    s8.documents.extend([doc_marksheet, doc_aadhaar, doc_bank])

    s9 = Scheme(
        name_en="[PLACEHOLDER] Andhra Pradesh Jagananna Vidya Deevena",
        name_ta="[PLACEHOLDER] ஆந்திரப் பிரதேசம் ஜெகனன்னா வித்யா தீவென",
        name_hi="[PLACEHOLDER] आंध्र प्रदेश जगनन्ना विद्या दीवेना",
        level="state",
        state="Andhra Pradesh",
        category="Higher Education",
        benefit_amount=50000.0,
        benefit_text="100% Full Tuition Fee Reimbursement direct to mother's account",
        description_en="Complete college fee reimbursement scheme in Andhra Pradesh for students pursuing ITI, Polytechnic, Degree, Engineering, and PG courses.",
        description_ta="ஆந்திராவில் பயிலும் கல்லூரி மாணவர்களுக்கான முழு கல்விக் கட்டண திருப்பிச் செலுத்தும் திட்டம்.",
        description_hi="आईटीआई, पॉलिटेक्निक और डिग्री छात्रों के लिए आंध्र प्रदेश में पूर्ण शिक्षण शुल्क प्रतिपूर्ति योजना।",
        deadline=today + timedelta(days=35),
        official_url="https://jnanabhumi.ap.gov.in",
        apply_steps=[
            "Register via Jnanabhumi portal (jnanabhumi.ap.gov.in).",
            "Verify college admission and student biometric attendance (>75%).",
            "Fee reimbursement credited directly to student mother's bank account."
        ],
        rules=[
            {"field": "family_income", "op": "<=", "value": 250000, "label_en": "Annual family income ≤ ₹2,50,000", "label_ta": "ஆண்டு குடும்ப வருமானம் ₹2,50,000-க்குள் இருத்தல் வேண்டும்"},
            {"field": "education", "op": "in", "value": ["Under Graduate", "Post Graduate", "Diploma", "ITI"], "label_en": "Higher education enrollment", "label_ta": "கல்லூரி கல்வி சேர்க்கை"},
            {"field": "state", "op": "==", "value": "Andhra Pradesh", "label_en": "Resident of Andhra Pradesh", "label_ta": "ஆந்திராவில் வசிப்பவராக இருத்தல் வேண்டும்"}
        ],
        last_verified=today - timedelta(days=22),
        active=True
    )
    s9.documents.extend([doc_income, doc_bonafide, doc_aadhaar, doc_bank])

    s10 = Scheme(
        name_en="[PLACEHOLDER] Maharashtra Mukhyamantri Majhi Ladki Bahin Yojana",
        name_ta="[PLACEHOLDER] மகாராஷ்டிரா முதல்வர் மாஜி லட்கி பகின் திட்டம்",
        name_hi="[PLACEHOLDER] महाराष्ट्र मुख्यमंत्री माझी लाड़की बहिन योजना",
        level="state",
        state="Maharashtra",
        category="Women / Social Welfare",
        benefit_amount=18000.0,
        benefit_text="₹1,500 / month direct assistance (₹18,000 / year)",
        description_en="Financial support of ₹1,500 per month provided to women aged 21 to 65 years in Maharashtra to promote self-reliance and empowerment.",
        description_ta="மகாராஷ்டிராவில் உள்ள 21 முதல் 65 வயதுடைய பெண்களுக்கு மாதம் ₹1,500 நிதியுதவி வழங்கும் திட்டம்.",
        description_hi="महाराष्ट्र में 21 से 65 वर्ष की महिलाओं को प्रति माह ₹1,500 की वित्तीय सहायता।",
        deadline=None,
        official_url="https://ladkibahin.maharashtra.gov.in",
        apply_steps=[
            "Apply via Nari Shakti Doot App or official portal ladkibahin.maharashtra.gov.in.",
            "Submit Aadhaar, domicile certificate or ration card, and bank details.",
            "Approval verified by Anganwadi / Ward representative."
        ],
        rules=[
            {"field": "gender", "op": "==", "value": "female", "label_en": "Female applicant", "label_ta": "பெண் விண்ணப்பதாரர்"},
            {"field": "age", "op": ">=", "value": 21, "label_en": "Age must be at least 21 years", "label_ta": "குறைந்தது 21 வயது"},
            {"field": "age", "op": "<=", "value": 65, "label_en": "Age must be 65 or below", "label_ta": "அதிகபட்சம் 65 வயது"},
            {"field": "family_income", "op": "<=", "value": 250000, "label_en": "Family income ≤ ₹2,50,000", "label_ta": "வருமானம் ₹2,50,000-க்குள்"},
            {"field": "state", "op": "==", "value": "Maharashtra", "label_en": "Resident of Maharashtra", "label_ta": "மகாராஷ்டிராவில் வசிப்பவராக இருத்தல் வேண்டும்"}
        ],
        last_verified=today - timedelta(days=6),
        active=True
    )
    s10.documents.extend([doc_aadhaar, doc_income, doc_ration, doc_bank])

    db.add_all([s1, s2, s3, s4, s5, s6, s7, s8, s9, s10])
    db.commit()

    # Seed Sources for Policy Monitoring
    if not db.query(SchemeSource).filter(SchemeSource.scheme_id == s1.id).first():
        src1 = SchemeSource(
            scheme_id=s1.id,
            url="https://penkalvi.tn.gov.in/guidelines",
            last_hash="abc123initialpudhumaihash",
            last_text="Moovalur Ramamirtham Ammaiyar Higher Education Assurance Scheme provides ₹1,000 per month for girls studying in government schools from standard 6 to 12."
        )
        db.add(src1)

    if not db.query(SchemeSource).filter(SchemeSource.scheme_id == s2.id).first():
        src2 = SchemeSource(
            scheme_id=s2.id,
            url="https://adwscholarship.tn.gov.in/rules",
            last_hash="def456initialpostmatrichash",
            last_text="Tamil Nadu Post-Matric Scholarship Scheme for SC/ST students. Family income limit: ₹2,50,000 per annum. Full tuition fee waiver."
        )
        db.add(src2)

    db.commit()
    seed_govt_exams(db)

from app.seed.exam_data import (
    refresh_scheme_deadlines,
    refresh_exam_deadlines,
    get_seed_govt_exams
)

def seed_govt_exams(db: Session):
    # Ensure all 23 Central & State government exams are seeded
    if db.query(GovtExam).count() < 20:
        db.query(GovtExam).delete()
        db.commit()
        exams = get_seed_govt_exams(date.today())
        db.add_all(exams)
        db.commit()
    else:
        refresh_exam_deadlines(db)
