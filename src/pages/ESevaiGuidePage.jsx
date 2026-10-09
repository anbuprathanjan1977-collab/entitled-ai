import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FileText, ExternalLink, Download, Search, CheckCircle2, 
  HelpCircle, ShieldCheck, CreditCard, Award, Lock, BookOpen, AlertCircle 
} from 'lucide-react';

export default function ESevaiGuidePage() {
  const { t, i18n } = useTranslation();
  const [filterDoc, setFilterDoc] = useState('');

  const documents = [
    {
      id: 'aadhaar',
      title: 'e-Aadhaar Card Download',
      title_ta: 'இ-ஆதார் அட்டை பதிவிறக்கம்',
      title_hi: 'ई-आधार कार्ड डाउनलोड',
      authority: 'UIDAI (Unique Identification Authority of India)',
      portal_url: 'https://myaadhaar.uidai.gov.in',
      portal_name: 'myAadhaar Portal',
      free: true,
      time: 'Instant (2 Minutes)',
      password_format: 'First 4 letters of Name in CAPITAL + 4-digit Birth Year (e.g. PRIY2001)',
      requirements: ['12-digit Aadhaar Number or 28-digit Enrolment ID (EID)', 'Mobile number linked with Aadhaar to receive OTP'],
      steps: [
        'Visit the official UIDAI myAadhaar portal at myaadhaar.uidai.gov.in.',
        'Click on "Download Aadhaar" from the dashboard.',
        'Enter your 12-digit Aadhaar Number and the security Captcha code.',
        'Click "Send OTP" and enter the 6-digit OTP received on your mobile.',
        'Optional: Check "Do you want a masked Aadhaar?" if you wish to mask the first 8 digits for safety.',
        'Click "Verify & Download". Open the downloaded PDF using your 8-character password.'
      ]
    },
    {
      id: 'pan',
      title: 'Instant e-PAN Card Download',
      title_ta: 'இ-பான் அட்டை பதிவிறக்கம்',
      title_hi: 'ई-पैन कार्ड डाउनलोड',
      authority: 'Income Tax Department (Govt. of India)',
      portal_url: 'https://www.incometax.gov.in/iec/foportal/instant-e-pan',
      portal_name: 'Income Tax e-Filing Portal',
      free: true,
      time: 'Instant (5 Minutes)',
      password_format: 'Date of Birth in DDMMYYYY format (e.g. 25082001)',
      requirements: ['Valid Aadhaar Number with linked mobile number', 'Not an existing duplicate PAN holder'],
      steps: [
        'Visit the Income Tax e-Filing portal at incometax.gov.in.',
        'Under Quick Links, click on "Instant e-PAN".',
        'Choose "Check Status / Download PAN" and click Continue.',
        'Enter your 12-digit Aadhaar Number and submit the OTP received on mobile.',
        'Your digitally signed e-PAN is generated instantly. Click "Download e-PAN" (PDF).',
        'Enter your Date of Birth (DDMMYYYY) as password to open and print.'
      ]
    },
    {
      id: 'income',
      title: 'Annual Income Certificate (வருமானச் சான்றிதழ்)',
      title_ta: 'வருமானச் சான்றிதழ் விண்ணப்பித்தல்',
      title_hi: 'आय प्रमाण पत्र आवेदन',
      authority: 'Revenue Department (Tamil Nadu e-Sevai / State e-District)',
      portal_url: 'https://www.tnesevai.tn.gov.in',
      portal_name: 'TN e-Sevai Portal',
      free: false,
      time: '3 - 7 Working Days',
      password_format: 'Standard PDF (No password required)',
      requirements: ['Aadhaar Card', 'Smart Family Ration Card', 'Salary Slip / VAO (Village Administrative Officer) verification enquiry', 'Bank Passbook'],
      steps: [
        'Visit your nearest authorized e-Sevai Centre or login to tnesevai.tn.gov.in (Citizen portal).',
        'Select Revenue Department → Certificate of Income.',
        'Enter CAN (Citizen Access Number) or register a new CAN with Aadhaar OTP.',
        'Upload applicant photo, salary proof/affidavit, and ration card.',
        'Pay the nominal government service fee of ₹60.',
        'Track status using the Application Number. Once approved by Tahsildar, download the digitally signed certificate with QR code.'
      ]
    },
    {
      id: 'community',
      title: 'Community / Caste Certificate (சாதி சான்றிதழ்)',
      title_ta: 'சாதி சான்றிதழ் விண்ணப்பித்தல்',
      title_hi: 'जाति प्रमाण पत्र आवेदन',
      authority: 'Revenue Administration (Tahsildar Office)',
      portal_url: 'https://www.tnesevai.tn.gov.in',
      portal_name: 'TN e-Sevai Portal',
      free: false,
      time: '5 - 10 Working Days',
      password_format: 'Standard PDF (Permanent Validity)',
      requirements: ['Parents\' Community Certificate', 'School Transfer Certificate (TC) specifying caste', 'Smart Ration Card', 'Aadhaar Card'],
      steps: [
        'Apply online at tnesevai.tn.gov.in or visit the nearest Taluk e-Sevai Centre.',
        'Provide family CAN number and select "Community Certificate".',
        'Upload school TC and parents\' certificate copies.',
        'The application is verified by the VAO and Revenue Inspector before Tahsildar approval.',
        'Download the computerized permanent community certificate anytime using application number.'
      ]
    },
    {
      id: 'ration',
      title: 'Smart Family Ration Card Download (e-PDS)',
      title_ta: 'ஸ்மார்ட் குடும்ப அட்டை பதிவிறக்கம்',
      title_hi: 'स्मार्ट राशन कार्ड डाउनलोड',
      authority: 'Civil Supplies & Consumer Protection Dept',
      portal_url: 'https://www.tnpds.gov.in',
      portal_name: 'TNPDS Portal',
      free: true,
      time: 'Instant (1 Minute)',
      password_format: 'Standard PDF',
      requirements: ['Registered mobile number associated with Smart Ration Card'],
      steps: [
        'Visit tnpds.gov.in and select your language (Tamil/English).',
        'Click on "Citizen Services" → "Smart Card Download".',
        'Enter your registered 10-digit mobile number and Captcha.',
        'Submit the 7-digit OTP received via SMS.',
        'Click "Generate Smart Card PDF" to download the digital Smart Card showing all family member names and UID.'
      ]
    },
    {
      id: 'first_grad',
      title: 'First Graduate Certificate (முதல் பட்டதாரி சான்றிதழ்)',
      title_ta: 'முதல் பட்டதாரி சான்றிதழ் விண்ணப்பித்தல்',
      title_hi: 'प्रथम स्नातक प्रमाण पत्र',
      authority: 'Directorate of Technical Education / Tahsildar',
      portal_url: 'https://www.tnesevai.tn.gov.in',
      portal_name: 'TN e-Sevai Portal',
      free: false,
      time: '7 - 14 Days',
      password_format: 'Standard PDF (Tuition Fee Concession)',
      requirements: ['Joint Declaration of parents & siblings', 'T.C. of applicant and siblings showing non-graduate status', 'Ration Card', 'Aadhaar Card'],
      steps: [
        'Draft a Joint Declaration affirming no parent or sibling has completed a degree.',
        'Apply at e-Sevai Centre with Transfer Certificates of all family members.',
        'Tahsildar conducts family verification and signs the digital certificate.',
        'Present this certificate during single-window counseling (TNEA/Medical) to claim 100% tuition fee concession.'
      ]
    },
    {
      id: 'digilocker',
      title: 'DigiLocker Official Documents Wallet',
      title_ta: 'டிஜிலாக்கர் சான்றிதழ்கள்',
      title_hi: 'ডিজিলকার সরকারি নথি',
      authority: 'Ministry of Electronics & IT (MeitY)',
      portal_url: 'https://www.digilocker.gov.in',
      portal_name: 'DigiLocker Portal & App',
      free: true,
      time: 'Instant',
      password_format: '6-digit Security PIN',
      requirements: ['Aadhaar Number and Mobile OTP'],
      steps: [
        'Download DigiLocker App or visit digilocker.gov.in.',
        'Sign in with your Aadhaar number and 6-digit security PIN.',
        'Search for your State Examination Board (e.g. DGE Tamil Nadu / CBSE) and fetch 10th & 12th digital marksheets.',
        'Documents pulled in DigiLocker are legally equivalent to original physical certificates under Rule 9A of IT Act 2000.'
      ]
    },
    {
      id: 'voter',
      title: 'Digital Voter ID Card (e-EPIC)',
      title_ta: 'வாக்காளர் அடையாள அட்டை (e-EPIC)',
      title_hi: 'ভোটার আইডি কার্ড (e-EPIC)',
      authority: 'Election Commission of India (ECI)',
      portal_url: 'https://voters.eci.gov.in',
      portal_name: 'ECI Voters Portal',
      free: true,
      time: 'Instant',
      password_format: 'Standard PDF',
      requirements: ['10-digit EPIC Number (Voter ID Number) or Form 6 Reference Number', 'Mobile number linked with EPIC'],
      steps: [
        'Visit the ECI Voters Service Portal at voters.eci.gov.in.',
        'Click on "E-EPIC Download".',
        'Enter your EPIC Number and select State.',
        'Verify with the OTP sent to your linked mobile number.',
        'Click "Download e-EPIC" to save the official digital voter card with secure QR code.'
      ]
    }
  ];

  const filteredDocs = documents.filter(d => 
    d.title.toLowerCase().includes(filterDoc.toLowerCase()) ||
    (d.title_ta && d.title_ta.includes(filterDoc)) ||
    d.authority.toLowerCase().includes(filterDoc.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-100 text-teal-800 text-xs font-bold mb-4 shadow-xs">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Official Public Services & Documents Portal</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-4">
          e-Sevai & Government Document Download Guide
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Step-by-step instructions, official portal links, requirements, and PDF password rules to download Aadhaar, PAN card, Income Certificate, and other essential welfare documents.
        </p>
      </div>

      {/* Search Input */}
      <div className="max-w-xl mx-auto mb-10">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filterDoc}
            onChange={(e) => setFilterDoc(e.target.value)}
            placeholder="Search document (Aadhaar, PAN, Income, Community, Ration Card)..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-slate-200 text-sm font-semibold focus:border-teal-600 focus:outline-none bg-white shadow-xs"
          />
        </div>
      </div>

      {/* Document Guidance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredDocs.map((doc) => (
          <div 
            key={doc.id}
            className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-md hover:border-teal-300 transition-all flex flex-col justify-between"
          >
            <div>
              {/* Top Row: Authority & Badges */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
                  {doc.authority}
                </span>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                  doc.free ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  {doc.free ? 'Free Online' : 'Govt Service Fee'} • {doc.time}
                </span>
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1 leading-snug">
                {doc.title}
              </h2>
              {doc.title_ta && (
                <span className="text-xs text-slate-500 font-tamil block mb-4">
                  {doc.title_ta}
                </span>
              )}

              {/* Password Rule Box */}
              {doc.password_format && (
                <div className="bg-amber-50 rounded-2xl p-3.5 border border-amber-200/80 mb-5 flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-amber-900 block">PDF Password Format:</span>
                    <span className="text-xs text-amber-800/90 font-mono font-medium">
                      {doc.password_format}
                    </span>
                  </div>
                </div>
              )}

              {/* Requirements */}
              <div className="mb-5">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Documents & Details Required:
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {doc.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2 font-medium">
                      <span className="text-teal-600 font-bold">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Step by Step Guide */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Step-by-Step Procedure:
                </h3>
                <ol className="space-y-2 text-xs sm:text-sm text-slate-700">
                  {doc.steps.map((st, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed font-medium">{st}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Direct Official Link Button */}
            <div className="pt-4 border-t border-slate-100">
              <a
                href={doc.portal_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-sm shadow-sm transition-colors touch-target"
              >
                <span>Open {doc.portal_name}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
