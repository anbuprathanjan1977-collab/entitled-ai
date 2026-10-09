"""
Central and State Government Examination and Job Notifications Seed Data
Covers UPSC, SSC, RRB Railways, Banking (IBPS, SBI), Uniformed Services (TNUSRB, KSP),
and State Public Service Commissions (TNPSC, KPSC, APPSC, MPSC, Kerala PSC, UPPSC).
"""

from datetime import date, timedelta
from typing import List
from sqlalchemy.orm import Session
from app.models import GovtExam, Scheme

def refresh_scheme_deadlines(db: Session):
    today = date.today()
    schemes = db.query(Scheme).all()
    for s in schemes:
        name_lower = s.name_en.lower()
        if "pudhumai" in name_lower or "moovalur" in name_lower:
            s.deadline = today + timedelta(days=2)  # Critical: 2 days left!
        elif "pm-usp" in name_lower or "central sector" in name_lower:
            s.deadline = today + timedelta(days=3)  # Critical: 3 days left!
        elif "post-matric" in name_lower or "sc/st" in name_lower:
            s.deadline = today + timedelta(days=5)  # Warning: 5 days left!
        elif "kisan" in name_lower:
            s.deadline = today + timedelta(days=7)  # Warning: 7 days left!
        elif "yuva nidhi" in name_lower:
            s.deadline = today + timedelta(days=12)
        elif "jagananna" in name_lower:
            s.deadline = today + timedelta(days=18)
        elif "first graduate" in name_lower:
            s.deadline = today + timedelta(days=25)
        elif "ladki bahin" in name_lower:
            s.deadline = today + timedelta(days=29)
    db.commit()

def refresh_exam_deadlines(db: Session):
    today = date.today()
    exams = db.query(GovtExam).all()
    for e in exams:
        body = (e.conducting_body or "").upper()
        title = (e.title_en or "").lower()
        if "ntpc" in title or ("railway" in title and "alp" not in title):
            e.deadline = today + timedelta(days=2)
        elif "civil services" in title and "upsc" in body:
            e.deadline = today + timedelta(days=3)
        elif "group 4" in title or "vao" in title:
            e.deadline = today + timedelta(days=2)
        elif "tnusrb" in body or ("constable" in title and "tamil" in (e.state or "").lower()):
            e.deadline = today + timedelta(days=3)
        elif "gd constable" in title or "ssc gd" in title:
            e.deadline = today + timedelta(days=4)
        elif "kerala" in body or "kerala" in (e.state or "").lower():
            e.deadline = today + timedelta(days=4)
        elif "ibps" in body and "po" in title:
            e.deadline = today + timedelta(days=5)
        elif "kpsc" in body or "kas" in title:
            e.deadline = today + timedelta(days=5)
        elif "cgl" in title:
            e.deadline = today + timedelta(days=6)
        elif "ksp" in body or "karnataka state police" in title:
            e.deadline = today + timedelta(days=6)
        elif "sbi" in body or "sbi" in title:
            e.deadline = today + timedelta(days=7)
        elif "dak sevak" in title or "gds" in title:
            e.deadline = today + timedelta(days=8)
        elif "trb" in body or "teachers" in title:
            e.deadline = today + timedelta(days=9)
        elif "group 2" in title:
            e.deadline = today + timedelta(days=10)
        elif "appsc" in body or "andhra" in (e.state or "").lower():
            e.deadline = today + timedelta(days=11)
        elif "alp" in title or "loco pilot" in title:
            e.deadline = today + timedelta(days=12)
        elif "uppsc" in body or "uttar" in (e.state or "").lower():
            e.deadline = today + timedelta(days=13)
        elif "gramin" in title or "rrb crp" in title:
            e.deadline = today + timedelta(days=14)
        elif "nda" in title:
            e.deadline = today + timedelta(days=15)
        elif "forest" in title:
            e.deadline = today + timedelta(days=16)
        elif "mpsc" in body or "maharashtra" in (e.state or "").lower():
            e.deadline = today + timedelta(days=17)
        elif "chsl" in title:
            e.deadline = today + timedelta(days=18)
        elif "cds" in title or "defence services" in title:
            e.deadline = today + timedelta(days=20)
    db.commit()

def get_seed_govt_exams(today: date) -> List[GovtExam]:
    return [
        # --- Central Government Exams ---
        GovtExam(
            title_en="Railway Recruitment Board NTPC (Graduate & Undergraduate Posts)",
            title_ta="ரயில்வே ஆட்சேர்ப்பு வாரியம் NTPC தேர்வுகள்",
            title_hi="रेलवे भर्ती बोर्ड एनटीपीसी परीक्षा (स्नातक और इंटरमीडिएट)",
            conducting_body="RRB",
            post_name="Station Master, Goods Train Manager, Senior Commercial cum Ticket Clerk, Junior Clerk",
            level="central",
            state="All India",
            category="Railways",
            qualification="12th Pass / Graduate (Any Degree)",
            age_limit="18 - 36 years (COVID 3-year relaxation included)",
            total_vacancies="11,558 Posts",
            salary_scale="Level 2 to Level 6 (₹19,900 - ₹63,200)",
            application_fee="₹500 (₹400 refundable on CBT 1), SC/ST/Women: ₹250 (Full refund)",
            start_date=today - timedelta(days=25),
            deadline=today + timedelta(days=2),
            exam_date="July - August 2026",
            official_portal_url="https://rrbapply.gov.in",
            notification_pdf_url="https://indianrailways.gov.in",
            selection_process=["1st Stage CBT Exam (100 Marks)", "2nd Stage CBT Exam (120 Marks)", "Computer Based Aptitude / Typing Skill Test", "Document Verification & Medical Exam"],
            description_en="Mega recruitment across all 21 Railway Recruitment Boards for operational, ticketing, station management, and ministerial posts.",
            description_ta="இந்திய ரயில்வேயில் நிலைய தலைவர் மற்றும் பயணச்சீட்டு எழுத்தர் உள்ளிட்ட 11,000+ பணிகளுக்கான தேர்வு.",
            description_hi="भारतीय रेलवे में स्टेशन मास्टर, क्लर्क और गुड्स गार्ड के 11,000+ पदों के लिए मेगा भर्ती।",
            active=True
        ),
        GovtExam(
            title_en="UPSC Civil Services Examination 2026 (IAS/IPS/IFS)",
            title_ta="மத்திய குடிமைப் பணிகள் தேர்வு 2026 (IAS / IPS / IFS)",
            title_hi="यूपीएससी सिविल सेवा परीक्षा 2026 (आईएएस/आईपीएस/आईएफएस)",
            conducting_body="UPSC",
            post_name="Civil Services (IAS, IPS, IFS, IRS & Central Group A Services)",
            level="central",
            state="All India",
            category="Civil Services",
            qualification="Graduate / Any Degree",
            age_limit="21 - 32 years (OBC: 35, SC/ST: 37)",
            total_vacancies="1,056 Posts",
            salary_scale="Level 10 (₹56,100 - ₹1,77,500)",
            application_fee="₹100 (SC/ST/PwD/Female: Free)",
            start_date=today - timedelta(days=20),
            deadline=today + timedelta(days=3),
            exam_date="24 May 2026 (Preliminary)",
            official_portal_url="https://upsconline.nic.in",
            notification_pdf_url="https://upsc.gov.in/examinations/active-exams",
            selection_process=["Preliminary Exam (GS Paper 1 + CSAT)", "Main Written Exam (9 Papers)", "Personality Test / Interview in New Delhi"],
            description_en="India's premier competitive exam for direct recruitment to the Indian Administrative Service, Police Service, Foreign Service, and 24 allied services.",
            description_ta="மத்திய அரசு மற்றும் அனைத்து இந்தியப் பணிகளுக்கான (IAS, IPS, IFS) முதன்மை தேர்வு.",
            description_hi="भारत की सबसे प्रतिष्ठित प्रशासनिक और पुलिस सेवाओं के लिए अखिल भारतीय भर्ती परीक्षा।",
            active=True
        ),
        GovtExam(
            title_en="SSC GD Constable (Central Armed Police Forces & Assam Rifles) 2026",
            title_ta="எஸ்.எஸ்.சி மத்திய ஆயுதப்படை காவலர் தேர்வு (GD Constable)",
            title_hi="एसएससी जीडी कांस्टेबल (केंद्रीय सशस्त्र पुलिस बल) परीक्षा 2026",
            conducting_body="SSC",
            post_name="Constable (GD) in BSF, CISF, CRPF, SSB, ITBP, SSF and Rifleman (GD) in Assam Rifles",
            level="central",
            state="All India",
            category="Police & Paramilitary",
            qualification="10th Pass / Matriculation",
            age_limit="18 - 23 years (OBC: 26, SC/ST: 28)",
            total_vacancies="39,481 Posts",
            salary_scale="Pay Level 3 (₹21,700 - ₹69,100)",
            application_fee="₹100 (Women, SC, ST, ESM: Exempted)",
            start_date=today - timedelta(days=18),
            deadline=today + timedelta(days=4),
            exam_date="November - December 2026",
            official_portal_url="https://ssc.gov.in",
            notification_pdf_url="https://ssc.gov.in",
            selection_process=["Computer Based Examination (80 Questions / 160 Marks)", "Physical Standard Test (PST) & Physical Efficiency Test (PET - 5km run)", "Detailed Medical Examination (DME) & Document Verification"],
            description_en="Nationwide mega recruitment drive for induction of young jawans and constables into India's border and paramilitary security forces.",
            description_ta="BSF, CISF, CRPF உள்ளிட்ட மத்திய துணை ராணுவப் படைகளில் 39,000+ காவலர் பணிகளுக்கான மாபெரும் தேர்வு.",
            description_hi="सीमा सुरक्षा बल (बीएसएफ), सीआईएसएफ, सीआरपीएफ और असम राइफल्स में 39,000+ जवानों की भर्ती।",
            active=True
        ),
        GovtExam(
            title_en="IBPS Probationary Officers (PO / MT-XIV) 2026",
            title_ta="ஐ.பி.பி.எஸ் வங்கி நன்னடத்தை அதிகாரிகள் (PO) தேர்வு",
            title_hi="आईबीपीएस प्रोबेशनरी ऑफिसर (पीओ) भर्ती 2026",
            conducting_body="IBPS",
            post_name="Probationary Officer / Management Trainee in 11 Participating Public Sector Banks",
            level="central",
            state="All India",
            category="Banking",
            qualification="Graduate / Any Degree",
            age_limit="20 - 30 years (OBC: 33, SC/ST: 35)",
            total_vacancies="4,455 Posts",
            salary_scale="Basic Pay ₹36,000 + DA + HRA (Gross ~₹54,000/month)",
            application_fee="₹850 (SC/ST/PwD: ₹175)",
            start_date=today - timedelta(days=12),
            deadline=today + timedelta(days=5),
            exam_date="October 2026 (Prelims) / November 2026 (Mains)",
            official_portal_url="https://www.ibps.in",
            notification_pdf_url="https://www.ibps.in",
            selection_process=["Online Preliminary Exam (English, Quantitative Aptitude, Reasoning)", "Online Mains Examination + Descriptive English Writing", "Common Bank Interview by Nodal Banks"],
            description_en="National competitive entrance exam for induction of Assistant Managers in Punjab National Bank, Canara Bank, Bank of Baroda, and 8 other PSBs.",
            description_ta="11 தேசியமயமாக்கப்பட்ட வங்கிகளில் உதவி மேலாளர் பணிகளுக்கான தேர்வு.",
            description_hi="11 सार्वजनिक क्षेत्र के बैंकों में सहायक प्रबंधकों की भर्ती हेतु राष्ट्रीय परीक्षा।",
            active=True
        ),
        GovtExam(
            title_en="SSC Combined Graduate Level Examination (CGL) 2026",
            title_ta="எஸ்.எஸ்.சி ஒருங்கிணைந்த பட்டதாரி நிலைத் தேர்வு (CGL)",
            title_hi="एसएससी संयुक्त स्नातक स्तरीय परीक्षा (सीजीएल) 2026",
            conducting_body="SSC",
            post_name="Assistant Section Officer, Income Tax Inspector, Central Excise Inspector, Sub-Inspector CBI",
            level="central",
            state="All India",
            category="Staff Selection",
            qualification="Graduate / Any Degree",
            age_limit="18 - 30 years (Relaxations applicable)",
            total_vacancies="17,727 Posts",
            salary_scale="Pay Level 4 to Level 8 (₹25,500 - ₹1,51,100)",
            application_fee="₹100 (Women & SC/ST: Exempted)",
            start_date=today - timedelta(days=15),
            deadline=today + timedelta(days=6),
            exam_date="September - October 2026",
            official_portal_url="https://ssc.gov.in",
            notification_pdf_url="https://ssc.gov.in/notices",
            selection_process=["Tier-1 CBT (Reasoning, English, Math, General Awareness)", "Tier-2 CBT (Advanced Quantitative, Reasoning, English Comprehension)", "Data Entry Speed Skill Test (DEST)"],
            description_en="Staff Selection Commission flagship recruitment for Group B and C gazetted and non-gazetted officers across ministries and central departments.",
            description_ta="மத்திய அரசுத் துறைகளில் குரூப் பி மற்றும் சி அதிகாரிகளுக்கான ஒருங்கிணைந்த பட்டதாரி தேர்வு.",
            description_hi="केंद्रीय मंत्रालयों और विभागों में ग्रुप बी और सी पदों के लिए राष्ट्रीय भर्ती परीक्षा।",
            active=True
        ),
        GovtExam(
            title_en="SBI Junior Associates (Customer Support & Sales) - Clerk 2026",
            title_ta="பாரத ஸ்டேட் வங்கி கிளார்க் (ஜூனியர் அசோசியேட்ஸ்) தேர்வு 2026",
            title_hi="एसबीआई जूनियर एसोसिएट्स (क्लर्क) भर्ती 2026",
            conducting_body="SBI",
            post_name="Junior Associate (Customer Support & Sales) in State Bank of India",
            level="central",
            state="All India",
            category="Banking",
            qualification="Graduate / Any Degree",
            age_limit="20 - 28 years (OBC: 31, SC/ST: 33)",
            total_vacancies="8,283 Posts",
            salary_scale="Basic Pay ₹19,900 + Allowances (Gross ~₹37,000/month)",
            application_fee="₹750 (SC/ST/PwD/ExS: Nil)",
            start_date=today - timedelta(days=10),
            deadline=today + timedelta(days=7),
            exam_date="November 2026",
            official_portal_url="https://sbi.co.in/careers",
            notification_pdf_url="https://bank.sbi/careers",
            selection_process=["Phase-I Preliminary Examination (100 Marks)", "Phase-II Main Examination (200 Marks)", "Test of Specified Opted Local Language"],
            description_en="Premier clerical recruitment by India's largest commercial bank offering exceptional job security and rapid promotional tracks.",
            description_ta="பாரத ஸ்டேட் வங்கியில் நாடு முழுவதும் 8,000+ எழுத்தர் பணிகளுக்கான நேரடி ஆட்சேர்ப்பு தேர்வு.",
            description_hi="भारतीय स्टेट बैंक में 8,000 से अधिक लिपिक पदों के लिए राष्ट्रव्यापी भर्ती।",
            active=True
        ),
        GovtExam(
            title_en="India Post Gramin Dak Sevak (GDS Recruitment) 2026",
            title_ta="இந்திய அஞ்சல் துறை கிராம அஞ்சல் ஊழியர் (GDS) ஆட்சேர்ப்பு",
            title_hi="इंडिया पोस्ट ग्रामीण डाक सेवक (जीडीएस) भर्ती 2026",
            conducting_body="India Post",
            post_name="Branch Postmaster (BPM), Assistant Branch Postmaster (ABPM), Dak Sevak",
            level="central",
            state="All India",
            category="Postal Services",
            qualification="10th Pass / Matriculation with passing marks in Mathematics & English",
            age_limit="18 - 40 years (OBC: 43, SC/ST: 45)",
            total_vacancies="44,228 Posts",
            salary_scale="TRCA Slab: ₹10,000 - ₹29,380/month",
            application_fee="₹100 (Female, SC/ST, PwD, Transgender: Free)",
            start_date=today - timedelta(days=12),
            deadline=today + timedelta(days=8),
            exam_date="No Written Exam (Merit List Based)",
            official_portal_url="https://indiapostgdsonline.gov.in",
            notification_pdf_url="https://indiapostgdsonline.gov.in",
            selection_process=["Direct Merit List calculated strictly on 10th standard aggregate percentage (No Written Test)", "Document Verification at Head Post Office", "Biometric Authentication and Joining"],
            description_en="India's largest non-exam government appointment for branch postmasters and dak sevaks in rural and semi-urban postal networks.",
            description_ta="10-ஆம் வகுப்பு மதிப்பெண் அடிப்படையில் தேர்வு எழுதாமல் 44,000+ அஞ்சல் பணிகளில் நேரடியாக நியமனம் பெறும் வாய்ப்பு.",
            description_hi="10वीं कक्षा के अंकों की मेरिट पर आधारित बिना परीक्षा देश भर में 44,000 से अधिक डाक सेवक पदों पर भर्ती।",
            active=True
        ),
        GovtExam(
            title_en="RRB Assistant Loco Pilot (ALP) & Technicians 2026",
            title_ta="ரயில்வே உதவி லோகோ பைலட் (ALP) & தொழில்நுட்ப பணியாளர்கள் தேர்வு",
            title_hi="आरआरबी सहायक लोको पायलट (एएलपी) एवं तकनीशियन भर्ती 2026",
            conducting_body="RRB",
            post_name="Assistant Loco Pilot (ALP) & Technician Grade III",
            level="central",
            state="All India",
            category="Railways",
            qualification="10th Pass + ITI / Diploma in Mechanical, Electrical, Electronics or Automobile",
            age_limit="18 - 33 years (Relaxations applicable)",
            total_vacancies="18,799 Posts",
            salary_scale="Pay Level 2 (₹19,900 - ₹63,200 + Running Allowance)",
            application_fee="₹500 (Refundable ₹400 on CBT 1), SC/ST/Female: ₹250",
            start_date=today - timedelta(days=14),
            deadline=today + timedelta(days=12),
            exam_date="August - September 2026",
            official_portal_url="https://rrbapply.gov.in",
            notification_pdf_url="https://indianrailways.gov.in",
            selection_process=["CBT 1 (Screening Test)", "CBT 2 (Part A Non-Tech + Part B Trade Qualification)", "Computer Based Aptitude Test (CBAT for ALP)", "Document Verification & Medical Fitness Test (A-1 Standard)"],
            description_en="Specialized railway technical recruitment for operating locomotive trains across Indian Railways zones.",
            description_ta="ரயில் என்ஜின் ஓட்டுநர் மற்றும் தொழில்நுட்பப் பணிகளுக்கான அகில இந்திய தேர்வு.",
            description_hi="भारतीय रेलवे में ट्रेनों के संचालन हेतु सहायक लोको पायलट और तकनीशियनों की 18,000+ पदों पर भर्ती।",
            active=True
        ),
        GovtExam(
            title_en="IBPS Regional Rural Banks (RRB CRP XIII - Office Assistant & Officers)",
            title_ta="ஐ.பி.பி.எஸ் கிராமிய வங்கி அலுவலக உதவியாளர் மற்றும் அதிகாரிகள் தேர்வு",
            title_hi="आईबीपीएस ग्रामीण बैंक कार्यालय सहायक एवं अधिकारी भर्ती 2026",
            conducting_body="IBPS",
            post_name="Office Assistant (Multipurpose) & Officer Scale-I (Assistant Manager) in 43 Regional Rural Banks",
            level="central",
            state="All India",
            category="Banking",
            qualification="Graduate / Any Degree with State Local Language Proficiency",
            age_limit="18 - 30 years (Clerk: 18-28)",
            total_vacancies="10,313 Posts",
            salary_scale="Scale I Officer: ₹42,000+ / Office Assistant: ₹30,000+ gross",
            application_fee="₹850 (SC/ST/PwD: ₹175)",
            start_date=today - timedelta(days=11),
            deadline=today + timedelta(days=14),
            exam_date="August 2026 (Prelims) / September 2026 (Mains)",
            official_portal_url="https://www.ibps.in",
            notification_pdf_url="https://www.ibps.in",
            selection_process=["Online Preliminary Exam (Reasoning + Quantitative Aptitude)", "Online Mains Exam", "Language Proficiency Test (LPT) in local state tongue"],
            description_en="Recruitment across 43 regional rural banks (such as Tamil Nadu Grama Bank, Karnataka Gramin Bank) with exam in regional languages.",
            description_ta="தமிழ்நாடு கிராம வங்கி உள்ளிட்ட 43 ஊரக வங்கிகளில் 10,000+ பணிகள் (தமிழ் மொழியிலும் தேர்வு எழுதலாம்).",
            description_hi="43 क्षेत्रीय ग्रामीण बैंकों में स्थानीय भाषा माध्यम से 10,000+ पदों पर भर्ती परीक्षा।",
            active=True
        ),
        GovtExam(
            title_en="UPSC National Defence Academy & Naval Academy (NDA & NA I) 2026",
            title_ta="யு.பி.எஸ்.சி தேசிய பாதுகாப்பு அகாடமி (NDA) தேர்வு",
            title_hi="यूपीएससी राष्ट्रीय रक्षा अकादमी (एनडीए) परीक्षा 2026",
            conducting_body="UPSC",
            post_name="Officer Cadet - Indian Army, Navy, and Air Force Wings",
            level="central",
            state="All India",
            category="Defense",
            qualification="12th Pass (Physics & Maths for Air Force/Navy)",
            age_limit="16.5 - 19.5 years (Unmarried Male & Female)",
            total_vacancies="400 Posts",
            salary_scale="Stipend ₹56,100/month during cadet training",
            application_fee="₹100 (SC/ST/Female: Free)",
            start_date=today - timedelta(days=10),
            deadline=today + timedelta(days=15),
            exam_date="April 2026",
            official_portal_url="https://upsconline.nic.in",
            notification_pdf_url="https://upsc.gov.in",
            selection_process=["Written Exam (Mathematics 300 marks + General Ability Test 600 marks)", "5-Day Services Selection Board (SSB) Interview & Psychological Testing", "Medical Board Examination"],
            description_en="Join Indian Armed Forces as a commissioned officer right after class 12 through National Defence Academy Khadakwasla.",
            description_ta="12-ஆம் வகுப்பு முடித்த இளைஞர்கள் முப்படைகளில் அதிகாரியாக இணைவதற்கான நுழைவுத் தேர்வு.",
            description_hi="12वीं कक्षा के बाद भारतीय थलसेना, नौसेना और वायुसेना में अधिकारी बनने की प्रतिष्ठित परीक्षा।",
            active=True
        ),
        GovtExam(
            title_en="SSC Combined Higher Secondary Level (CHSL) 2026",
            title_ta="எஸ்.எஸ்.சி 12-ஆம் வகுப்பு தகுதித் தேர்வு (CHSL)",
            title_hi="एसएससी संयुक्त उच्चतर माध्यमिक स्तर परीक्षा (सीएचएसएल) 2026",
            conducting_body="SSC",
            post_name="Lower Division Clerk (LDC), Junior Secretariat Assistant (JSA), Data Entry Operator (DEO)",
            level="central",
            state="All India",
            category="Staff Selection",
            qualification="12th Pass (Higher Secondary)",
            age_limit="18 - 27 years (OBC: 30, SC/ST: 32)",
            total_vacancies="3,712 Posts",
            salary_scale="Pay Level 2 & Level 4 (₹19,900 - ₹81,100)",
            application_fee="₹100 (Women & SC/ST: Free)",
            start_date=today - timedelta(days=5),
            deadline=today + timedelta(days=18),
            exam_date="June - July 2026",
            official_portal_url="https://ssc.gov.in",
            notification_pdf_url="https://ssc.gov.in",
            selection_process=["Tier-1 Computer Based Examination", "Tier-2 Examination (Mathematical Abilities & Reasoning)", "Skill Test / Typing Test"],
            description_en="Staff Selection Commission recruitment for ministerial clerk, data entry, and secretarial positions across central government offices.",
            description_ta="மத்திய அரசு அலுவலகங்களில் இளநிலை எழுத்தர் மற்றும் தகவல் பதிவு பணிகளுக்கான தேர்வு.",
            description_hi="केंद्रीय मंत्रालयों में क्लर्क और डेटा एंट्री ऑपरेटर के पदों के लिए भर्ती।",
            active=True
        ),
        GovtExam(
            title_en="UPSC Combined Defence Services (CDS I & II) 2026",
            title_ta="யு.பி.எஸ்.சி ஒருங்கிணைந்த பாதுகாப்புப் பணிகள் தேர்வு (CDS)",
            title_hi="यूपीएससी संयुक्त रक्षा सेवा परीक्षा (सीडीएस) 2026",
            conducting_body="UPSC",
            post_name="Officer Cadet - IMA Dehradun, INA Ezhimala, AFA Hyderabad, OTA Chennai",
            level="central",
            state="All India",
            category="Defense",
            qualification="Graduate / Any Degree (B.Tech for Navy/Air Force)",
            age_limit="19 - 25 years",
            total_vacancies="459 Posts",
            salary_scale="Level 10 (₹56,100 - ₹1,77,500) + Military Service Pay ₹15,500/m",
            application_fee="₹200 (Female/SC/ST: Exempted)",
            start_date=today - timedelta(days=8),
            deadline=today + timedelta(days=20),
            exam_date="September 2026",
            official_portal_url="https://upsconline.nic.in",
            notification_pdf_url="https://upsc.gov.in",
            selection_process=["Written Exam (English, General Knowledge, Elementary Mathematics)", "SSB Intelligence & Personality Test (5 Days)", "Thorough Medical Examination at Military Hospital"],
            description_en="Direct entry for degree holders to become commissioned officers in the Indian Army, Indian Navy, and Indian Air Force.",
            description_ta="பட்டதாரிகள் ராணுவத்தில் லெப்டினன்ட் உள்ளிட்ட அதிகாரியாக இணைவதற்கான முதன்மை தேர்வு.",
            description_hi="स्नातकों के लिए थल सेना, नौसेना और वायु सेना में कमीशन प्राप्त अधिकारी बनने का सुनहरा अवसर।",
            active=True
        ),

        # --- State Government Exams (Tamil Nadu & Other States) ---
        GovtExam(
            title_en="TNPSC Combined Civil Services Examination - Group 4 & VAO",
            title_ta="டி.என்.பி.எஸ்.சி ஒருங்கிணைந்த குடிமைப் பணிகள் தேர்வு - குரூப் 4 & VAO",
            title_hi="टीएनपीएससी संयुक्त सिविल सेवा परीक्षा - ग्रुप 4 और वीएओ",
            conducting_body="TNPSC",
            post_name="Village Administrative Officer (VAO), Junior Assistant, Typist, Steno-Typist, Bill Collector",
            level="state",
            state="Tamil Nadu",
            category="State Services",
            qualification="10th Pass / SSLC with Tamil as a subject",
            age_limit="18 - 32 years (BC/MBC/BCM: 34, SC/ST: 37, Destitute Widows: 37)",
            total_vacancies="6,244 Posts",
            salary_scale="Level 8 (₹19,500 - ₹62,000 + Allowances)",
            application_fee="₹100 (One-Time Registration ₹150; SC/ST/PwD: Free)",
            start_date=today - timedelta(days=22),
            deadline=today + timedelta(days=2),
            exam_date="June 2026 (Single Paper)",
            official_portal_url="https://apply.tnpscexams.in",
            notification_pdf_url="https://www.tnpsc.gov.in/notifications",
            selection_process=["Single Paper Written Exam (General Tamil/English 100 marks + GS & Mental Ability 100 marks)", "Document Verification & Direct Counselling Allotment"],
            description_en="Tamil Nadu's largest administrative recruitment examination offering direct appointment as Village Administrative Officer and Junior Assistant in revenue and government departments.",
            description_ta="தமிழ்நாடு வருவாய்த்துறை கிராம நிர்வாக அலுவலர் (VAO) மற்றும் அரசுத் துறை உதவியாளர் பணிகளுக்கான மாபெரும் தேர்வு.",
            description_hi="तमिलनाडु राजस्व और सरकारी विभागों में ग्राम प्रशासनिक अधिकारी और कनिष्ठ सहायक पदों के लिए भर्ती।",
            active=True
        ),
        GovtExam(
            title_en="TNUSRB Police Constable, Jail Warder & Fireman Recruitment 2026",
            title_ta="தமிழ்நாடு சீருடைப் பணியாளர் தேர்வு - காவலர், சிறைக்காவலர், தீயணைப்பாளர் (TNUSRB)",
            title_hi="टीएनयूएसआरबी पुलिस कांस्टेबल, जेल वार्डर और फायरमैन भर्ती 2026",
            conducting_body="TNUSRB",
            post_name="Grade II Police Constable (Armed Reserve & Tamil Nadu Special Police), Jail Warder, Fireman",
            level="state",
            state="Tamil Nadu",
            category="Police & Uniformed Services",
            qualification="10th Pass / SSLC with Tamil language as one of the subjects",
            age_limit="18 - 26 years (BC/MBC: 28, SC/ST: 31, Destitute Widows: 37)",
            total_vacancies="3,359 Posts",
            salary_scale="Pay Level 6 (₹18,200 - ₹57,900)",
            application_fee="₹250 (All Categories via online payment)",
            start_date=today - timedelta(days=19),
            deadline=today + timedelta(days=3),
            exam_date="July 2026",
            official_portal_url="https://www.tnusrb.tn.gov.in",
            notification_pdf_url="https://www.tnusrb.tn.gov.in",
            selection_process=["Part I Tamil Language Eligibility Test (80 Marks)", "Part II Main Written Examination (70 Marks)", "Physical Measurement Test (PMT), Endurance Test (ET) & Physical Efficiency Test (PET - 24 Marks)", "Original Certificate Verification & Medical Examination"],
            description_en="Tamil Nadu Uniformed Services Recruitment Board (TNUSRB) state-level selection for direct recruitment to law enforcement and fire rescue teams.",
            description_ta="தமிழக காவல் துறை, சிறைத் துறை மற்றும் தீயணைப்புத் துறையில் 3,300+ இரண்டாம் நிலை காவலர் பணிகளுக்கான தேர்வு.",
            description_hi="तमिलनाडु पुलिस, जेल और अग्निशमन सेवाओं में 3,300 से अधिक कांस्टेबलों की सीधी भर्ती।",
            active=True
        ),
        GovtExam(
            title_en="Kerala PSC Secretariat Assistant & Sub-Inspector of Police 2026",
            title_ta="கேரளா அரசுப் பணியாளர் தேர்வு - தலைமைச் செயலக உதவியாளர் & காவல் உதவி ஆய்வாளர்",
            title_hi="केरल पीएससी सचिवालय सहायक एवं पुलिस सब-इंस्पेक्टर भर्ती 2026",
            conducting_body="Kerala PSC",
            post_name="Secretariat Assistant & Sub-Inspector of Police (Trainee) in Kerala Civil Police",
            level="state",
            state="Kerala",
            category="State Services",
            qualification="Graduate / Any Degree with Malayalam proficiency",
            age_limit="18 - 36 years (OBC: 39, SC/ST: 41)",
            total_vacancies="640 Posts",
            salary_scale="Pay Scale ₹39,300 - ₹83,000",
            application_fee="Nil (Zero Fee - Kerala PSC One Time Registration)",
            start_date=today - timedelta(days=16),
            deadline=today + timedelta(days=4),
            exam_date="August 2026",
            official_portal_url="https://thulasi.psc.kerala.gov.in",
            notification_pdf_url="https://www.keralapsc.gov.in",
            selection_process=["Preliminary OMR / Online Examination (100 Marks)", "Mains Written Examination (100 Marks)", "Physical Efficiency Test (for Police SI)", "Document Verification"],
            description_en="Premier executive recruitment for administrative positions in Kerala Government Secretariat and state police department.",
            description_ta="கேரள தலைமைச் செயலக உதவியாளர் மற்றும் காவல் உதவி ஆய்வாளர் பணிகளுக்கான தேர்வு.",
            description_hi="केरल सचिवालय में सहायक और राज्य पुलिस में सब-इंस्पेक्टर पदों हेतु भर्ती।",
            active=True
        ),
        GovtExam(
            title_en="KPSC Gazetted Probationers Examination (KAS) 2026",
            title_ta="கர்நாடகா அரசுப் பணியாளர் தேர்வாணையம் கெஜட்டட் புரொபேஷனர்ஸ் தேர்வு (KAS)",
            title_hi="कर्नाटक पीएससी राजपत्रित परिवीक्षाधीन परीक्षा (केएएस) 2026",
            conducting_body="KPSC",
            post_name="Assistant Commissioner (KAS Group A), Tahsildar (Group B), Commercial Tax Officer",
            level="state",
            state="Karnataka",
            category="Civil Services",
            qualification="Graduate / Any Degree with Kannada language proficiency",
            age_limit="21 - 38 years (Category 2A/2B/3A/3B: 41, SC/ST: 43)",
            total_vacancies="384 Posts",
            salary_scale="Group A: ₹52,650 - ₹97,100, Group B: ₹43,100 - ₹83,900",
            application_fee="₹600 (SC/ST/Cat-1: ₹300)",
            start_date=today - timedelta(days=18),
            deadline=today + timedelta(days=5),
            exam_date="July 2026",
            official_portal_url="https://kpsc.kar.nic.in",
            notification_pdf_url="https://kpsc.kar.nic.in",
            selection_process=["Preliminary Examination (Paper 1 & 2)", "Main Written Examination (Qualifying Kannada/English + 4 GS Papers)", "Personality Interview"],
            description_en="Top administrative civil services exam in Karnataka for recruitment to Group A and Group B administrative positions.",
            description_ta="கர்நாடகாவில் உதவி ஆணையர் மற்றும் வட்டாட்சியர் உள்ளிட்ட முதன்மை அதிகாரிகளுக்கான போட்டித் தேர்வு.",
            description_hi="कर्नाटक प्रशासनिक सेवा (केएएस) में ग्रुप ए और ग्रुप बी अधिकारियों के लिए प्रतियोगी परीक्षा।",
            active=True
        ),
        GovtExam(
            title_en="Karnataka State Police (KSP) Civil Police Constable (CPC)",
            title_ta="கர்நாடகா மாநில காவல் துறை சிவில் காவலர் தேர்வு (CPC)",
            title_hi="कर्नाटक राज्य पुलिस (केएसपी) सिविल पुलिस कांस्टेबल भर्ती 2026",
            conducting_body="KSP",
            post_name="Civil Police Constable (Men, Women & Transgender)",
            level="state",
            state="Karnataka",
            category="Police & Uniformed Services",
            qualification="12th Pass / PUC / Higher Secondary",
            age_limit="19 - 27 years (SC/ST/Cat-1/OBC: 30 years)",
            total_vacancies="3,454 Posts",
            salary_scale="Pay Scale ₹23,500 - ₹47,650",
            application_fee="₹400 (SC/ST/Cat-1: ₹200)",
            start_date=today - timedelta(days=15),
            deadline=today + timedelta(days=6),
            exam_date="September 2026",
            official_portal_url="https://ksp-recruitment.in",
            notification_pdf_url="https://ksp.karnataka.gov.in",
            selection_process=["Written Examination (100 Marks)", "Endurance Test & Physical Standard Test (ET & PST)", "Document Verification & Medical Examination"],
            description_en="Direct recruitment of Civil Police Constables for maintaining law and order across Karnataka police divisions.",
            description_ta="கர்நாடக காவல் துறையில் 3,400+ காவலர் பணிகளுக்கான நேரடி ஆட்சேர்ப்பு தேர்வு.",
            description_hi="कर्नाटक पुलिस में 3,400 से अधिक सिविल पुलिस कांस्टेबलों की भर्ती परीक्षा।",
            active=True
        ),
        GovtExam(
            title_en="TN TRB Graduate Teachers & Block Resource Teacher Educators (BRTE) 2026",
            title_ta="தமிழ்நாடு ஆசிரியர் தேர்வு வாரியம் பட்டதாரி ஆசிரியர் & BRTE தேர்வு",
            title_hi="तमिलनाडु शिक्षक भर्ती बोर्ड स्नातक शिक्षक एवं बीआरटीई भर्ती 2026",
            conducting_body="TN TRB",
            post_name="Graduate Assistant / BT Teacher in Tamil Nadu School Education Subordinate Service",
            level="state",
            state="Tamil Nadu",
            category="Teaching & Education",
            qualification="Bachelor Degree in relevant subject with B.Ed + TNTET Paper-II Pass",
            age_limit="18 - 53 years (Reserved categories: 58 years)",
            total_vacancies="3,192 Posts",
            salary_scale="Pay Level 16 (₹36,400 - ₹1,15,700)",
            application_fee="₹600 (SC/ST/PwD: ₹300)",
            start_date=today - timedelta(days=12),
            deadline=today + timedelta(days=9),
            exam_date="August 2026",
            official_portal_url="https://trb.tn.gov.in",
            notification_pdf_url="https://trb.tn.gov.in",
            selection_process=["Part A Compulsory Tamil Language Eligibility Test (50 Marks)", "Part B Main Subject Written Examination (150 Marks)", "Certificate Verification and Single Window Direct Counselling"],
            description_en="Tamil Nadu Teachers Recruitment Board (TRB) appointment of government high school teachers across Mathematics, Science, Tamil, English, and Social Science.",
            description_ta="தமிழ்நாடு அரசு உயர்நிலைப் பள்ளிகளில் 3,100+ பட்டதாரி ஆசிரியர் பணிகளுக்கான நேரடித் தேர்வு.",
            description_hi="तमिलनाडु सरकारी माध्यमिक विद्यालयों में 3,100 से अधिक स्नातक शिक्षकों की सीधी भर्ती।",
            active=True
        ),
        GovtExam(
            title_en="TNPSC Combined Civil Services Examination - Group 2 & 2A",
            title_ta="டி.என்.பி.எஸ்.சி ஒருங்கிணைந்த குடிமைப் பணிகள் தேர்வு - குரூப் 2 & 2A",
            title_hi="टीएनपीएससी ग्रुप 2 और 2ए परीक्षा 2026",
            conducting_body="TNPSC",
            post_name="Sub-Registrar Grade II, Municipal Commissioner, Revenue Inspector, Assistant Section Officer (Secretariat)",
            level="state",
            state="Tamil Nadu",
            category="Civil Services",
            qualification="Graduate / Any Degree",
            age_limit="18 - 32 years (SC/ST/MBC/BC: No upper age limit for degree holders)",
            total_vacancies="2,327 Posts",
            salary_scale="Level 9 to Level 18 (₹20,600 - ₹1,19,500)",
            application_fee="Prelims ₹100, Mains ₹150 (SC/ST: Free)",
            start_date=today - timedelta(days=14),
            deadline=today + timedelta(days=10),
            exam_date="September 2026",
            official_portal_url="https://apply.tnpscexams.in",
            notification_pdf_url="https://www.tnpsc.gov.in",
            selection_process=["Preliminary Examination (Objective Type - 200 Questions)", "Main Written Examination (Descriptive Pattern)", "Oral Test / Interview (for Group 2 Interview posts)"],
            description_en="Recruitment for executive and non-executive officers in Tamil Nadu Secretariat, Commercial Taxes, and Municipal Administration.",
            description_ta="தமிழக தலைமைச் செயலக உதவி பிரிவு அலுவலர், சார்பதிவாளர் மற்றும் நகராட்சி ஆணையர் பணிகளுக்கான தேர்வு.",
            description_hi="तमिलनाडु सचिवालय और नगरपालिका प्रशासन में कार्यकारी अधिकारियों की भर्ती।",
            active=True
        ),
        GovtExam(
            title_en="APPSC Group 1 & Group 2 Services Examination 2026",
            title_ta="ஆந்திரப் பிரதேசம் அரசுப் பணியாளர் தேர்வு - குரூப் 1 & குரூப் 2 பணிகள்",
            title_hi="एपीपीएससी ग्रुप 1 और ग्रुप 2 सेवा परीक्षा 2026",
            conducting_body="APPSC",
            post_name="Deputy Collector, DSP, Commercial Tax Officer, Deputy Tahsildar, Sub-Registrar",
            level="state",
            state="Andhra Pradesh",
            category="Civil Services",
            qualification="Graduate / Any Degree",
            age_limit="18 - 42 years (SC/ST/BC: 47)",
            total_vacancies="897 Posts",
            salary_scale="Scale of Pay ₹25,220 - ₹1,51,370",
            application_fee="₹250 Processing Fee + ₹120 Exam Fee (SC/ST: Fee exempt)",
            start_date=today - timedelta(days=12),
            deadline=today + timedelta(days=11),
            exam_date="August 2026",
            official_portal_url="https://psc.ap.gov.in",
            notification_pdf_url="https://psc.ap.gov.in",
            selection_process=["Screening Test (Prelims Objective)", "Mains Written Examination (Conventional Papers)", "Oral Test / Personality Interview"],
            description_en="Premier civil services recruitment in Andhra Pradesh state administration and executive revenue departments.",
            description_ta="ஆந்திரப் பிரதேசத்தில் துணை ஆட்சியர் மற்றும் வட்டாட்சியர் உள்ளிட்ட முதன்மை பணிகளுக்கான தேர்வு.",
            description_hi="आंध्र प्रदेश राज्य में प्रशासनिक, राजस्व और पुलिस सेवा पदों के लिए भर्ती परीक्षा।",
            active=True
        ),
        GovtExam(
            title_en="UPPSC Combined State / Upper Subordinate Services (PCS) 2026",
            title_ta="உத்தரப் பிரதேசம் ஒருங்கிணைந்த மாநிலப் பணிகள் தேர்வு (UP PCS)",
            title_hi="यूपीपीएससी सम्मिलित राज्य/प्रवर अधीनस्थ सेवा (पीसीएस) परीक्षा 2026",
            conducting_body="UPPSC",
            post_name="Sub-Divisional Magistrate (SDM), Deputy SP, Block Development Officer, ARTO",
            level="state",
            state="Uttar Pradesh",
            category="Civil Services",
            qualification="Graduate / Any Degree",
            age_limit="21 - 40 years (OBC/SC/ST: 45)",
            total_vacancies="820 Posts",
            salary_scale="Pay Matrix Level 10 (₹56,100 - ₹1,77,500)",
            application_fee="₹125 (SC/ST: ₹65, PwD: ₹25)",
            start_date=today - timedelta(days=9),
            deadline=today + timedelta(days=13),
            exam_date="October 2026",
            official_portal_url="https://uppsc.up.nic.in",
            notification_pdf_url="https://uppsc.up.nic.in",
            selection_process=["Preliminary Examination (Paper 1 GS + Paper 2 CSAT)", "Mains Written Examination (8 Descriptive Papers)", "Personality Test (Interview)"],
            description_en="Uttar Pradesh Public Service Commission premier recruitment for provincial administrative and executive civil officers.",
            description_ta="உத்தரப் பிரதேசத்தில் துணை ஆட்சியர் மற்றும் காவல்துறை கண்காணிப்பாளர் பணிகளுக்கான போட்டித் தேர்வு.",
            description_hi="उत्तर प्रदेश में एसडीएम, डीएसपी और प्रशासनिक अधिकारियों के चयन हेतु प्रतिष्ठित पीसीएस परीक्षा।",
            active=True
        ),
        GovtExam(
            title_en="TNFUSRC Tamil Nadu Forest Guard & Forester Recruitment 2026",
            title_ta="தமிழ்நாடு வனத்துறை சீருடைப் பணியாளர் தேர்வு - வனக் காப்பாளர் & வனவர்",
            title_hi="तमिलनाडु वन रक्षक एवं वनपाल भर्ती परीक्षा 2026",
            conducting_body="TNFUSRC",
            post_name="Forest Guard with Driving License & Forester in Tamil Nadu Forest Department",
            level="state",
            state="Tamil Nadu",
            category="Forest & Environment",
            qualification="10th / 12th Pass with Science / Forestry Degree",
            age_limit="21 - 32 years (SC/ST/MBC/BC: 37 years)",
            total_vacancies="1,118 Posts",
            salary_scale="Level 8 (₹19,500 - ₹62,000)",
            application_fee="₹300 (SC/ST: ₹150)",
            start_date=today - timedelta(days=8),
            deadline=today + timedelta(days=16),
            exam_date="October 2026",
            official_portal_url="https://www.forests.tn.gov.in",
            notification_pdf_url="https://www.forests.tn.gov.in",
            selection_process=["Online Computer Based Examination (General Knowledge + Science 150 Questions)", "Physical Standards Verification & Walking Endurance Test (25 km in 4 hours for Men / 16 km for Women)", "Original Certificate Verification"],
            description_en="Uniformed recruitment for wildlife and reserve forest conservation across Tamil Nadu forest divisions.",
            description_ta="தமிழ்நாடு வனத்துறையில் வனக் காப்பாளர் மற்றும் வனவர் பணிகளுக்கான நேரடி தேர்வு.",
            description_hi="तमिलनाडु वन विभाग में वन रक्षकों और वनपालों के पदों पर सीधी भर्ती।",
            active=True
        ),
        GovtExam(
            title_en="MPSC State Services Examination (Rajyaseva) 2026",
            title_ta="மகாராஷ்டிரா மாநிலப் பணிகள் தேர்வு (ராஜ்யசேவா)",
            title_hi="एमपीएससी राज्य सेवा परीक्षा (राज्यसेवा) 2026",
            conducting_body="MPSC",
            post_name="Deputy Collector, Deputy SP, Tehsildar, Block Development Officer (BDO)",
            level="state",
            state="Maharashtra",
            category="Civil Services",
            qualification="Graduate / Any Degree (Marathi knowledge required)",
            age_limit="19 - 38 years (Backward Classes: 43)",
            total_vacancies="524 Posts",
            salary_scale="Pay Level S-15 to S-20 (₹41,800 - ₹1,77,500)",
            application_fee="₹394 (Reserved Categories: ₹294)",
            start_date=today - timedelta(days=10),
            deadline=today + timedelta(days=17),
            exam_date="August 2026",
            official_portal_url="https://mpsc.gov.in",
            notification_pdf_url="https://mpsc.gov.in",
            selection_process=["Preliminary Examination (GS & CSAT)", "Main Examination (Descriptive Pattern)", "Interview / Viva-Voce"],
            description_en="Maharashtra Public Service Commission recruitment for top administrative and police leadership across Maharashtra.",
            description_ta="மகாராஷ்டிராவில் துணை ஆட்சியர் மற்றும் வட்டாட்சியர் பணிகளுக்கான மாநிலப் பணிகள் தேர்வு.",
            description_hi="महाराष्ट्र लोक सेवा आयोग द्वारा राज्य के शीर्ष प्रशासनिक अधिकारियों की भर्ती हेतु परीक्षा।",
            active=True
        )
    ]
