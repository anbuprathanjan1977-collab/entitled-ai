import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowRight, ArrowLeft, Mic, MicOff, ShieldCheck, 
  FileUp, Sparkles, Check, CheckCircle2, AlertCircle, X, HelpCircle 
} from 'lucide-react';
import { getDistricts, getStates } from '../api/schemes';
import { uploadCertificateOCR } from '../api/match';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

export default function QuestionnairePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // 8 progressive questions
  const [currentStep, setCurrentStep] = useState(0);

  // Form State (stored in memory, never on server!)
  const [formData, setFormData] = useState({
    age: 20,
    gender: 'female',
    family_income: 180000,
    community: 'MBC',
    education: 'Under Graduate',
    first_graduate: false,
    state: 'Tamil Nadu',
    district: 'Chennai'
  });

  const [statesList, setStatesList] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [districtFilter, setDistrictFilter] = useState('');
  const [districtsLoading, setDistrictsLoading] = useState(false);

  // Speech Recognition hook
  const { isSupported: micSupported, isListening, startListening, stopListening } = useSpeechRecognition();

  // OCR Feature Flag & Modal State
  const [ocrModalOpen, setOcrModalOpen] = useState(false);
  const [ocrFile, setOcrFile] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrExtractedData, setOcrExtractedData] = useState(null);
  const [ocrError, setOcrError] = useState('');

  // Load states on mount
  useEffect(() => {
    getStates()
      .then((data) => setStatesList(data))
      .catch((err) => console.warn('Could not load states:', err));
  }, []);

  // Load districts whenever state changes
  useEffect(() => {
    let mounted = true;
    setDistrictsLoading(true);
    getDistricts(formData.state)
      .then((data) => {
        if (mounted) {
          setDistricts(data);
          if (data.length > 0) {
            setFormData(prev => ({ ...prev, district: data[0].en }));
          }
        }
      })
      .catch((err) => console.warn('Could not load districts:', err))
      .finally(() => {
        if (mounted) setDistrictsLoading(false);
      });

    return () => { mounted = false; };
  }, [formData.state]);

  const totalSteps = 8;
  const progressPercent = Math.round(((currentStep + 1) / totalSteps) * 100);

  // Voice command handler
  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening((text) => {
        const clean = text.toLowerCase().trim();
        // Step specific heuristics
        if (currentStep === 0) {
          // Age: extract numbers
          const num = parseInt(clean.replace(/\D/g, ''), 10);
          if (!isNaN(num) && num > 5 && num < 100) {
            setFormData(prev => ({ ...prev, age: num }));
          }
        } else if (currentStep === 1) {
          // Gender
          if (clean.includes('female') || clean.includes('பெண்') || clean.includes('महिला')) {
            setFormData(prev => ({ ...prev, gender: 'female' }));
          } else if (clean.includes('male') || clean.includes('ஆண்') || clean.includes('पुरुष')) {
            setFormData(prev => ({ ...prev, gender: 'male' }));
          } else if (clean.includes('trans') || clean.includes('திருநங்கை')) {
            setFormData(prev => ({ ...prev, gender: 'transgender' }));
          }
        } else if (currentStep === 2) {
          // Income
          const num = parseInt(clean.replace(/\D/g, ''), 10);
          if (!isNaN(num) && num > 1000) {
            setFormData(prev => ({ ...prev, family_income: num }));
          }
        } else if (currentStep === 5) {
          // First graduate
          if (clean.includes('yes') || clean.includes('ஆம்') || clean.includes('हाँ')) {
            setFormData(prev => ({ ...prev, first_graduate: true }));
          } else if (clean.includes('no') || clean.includes('இல்லை') || clean.includes('नहीं')) {
            setFormData(prev => ({ ...prev, first_graduate: false }));
          }
        }
      });
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Done - navigate to Results
      navigate('/results', { state: { profile: formData } });
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // OCR file upload handler
  const handleOcrUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrFile(file);
    setOcrLoading(true);
    setOcrError('');
    try {
      const res = await uploadCertificateOCR(file);
      setOcrExtractedData(res);
    } catch (err) {
      setOcrError(err.message || 'OCR parsing failed.');
    } finally {
      setOcrLoading(false);
    }
  };

  const confirmOcrData = () => {
    if (ocrExtractedData) {
      setFormData(prev => ({
        ...prev,
        family_income: ocrExtractedData.family_income || prev.family_income,
        community: ocrExtractedData.community || prev.community
      }));
    }
    setOcrModalOpen(false);
  };

  // Helper to render district localized name
  const getDistrictName = (d) => {
    if (i18n.language === 'ta' && d.ta) return d.ta;
    if (i18n.language === 'hi' && d.hi) return d.hi;
    return d.en;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      
      {/* Privacy Guarantee Header */}
      <div className="bg-teal-50 border border-teal-200/90 rounded-2xl p-3.5 mb-6 flex items-center justify-between text-xs sm:text-sm text-teal-900 font-medium shadow-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
          <span>{t('questionnaire.privacyNotice')}</span>
        </div>
        <button
          type="button"
          onClick={() => setOcrModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-teal-300 text-teal-800 hover:bg-teal-100 font-bold text-xs transition-colors shrink-0 touch-target"
        >
          <FileUp className="w-3.5 h-3.5 text-teal-600" />
          <span>{t('questionnaire.ocrUploadBtn')}</span>
        </button>
      </div>

      {/* Progress Bar Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-600 mb-2">
          <span>
            {t('questionnaire.step')} {currentStep + 1} {t('questionnaire.of')} {totalSteps}
          </span>
          <span className="text-teal-700 font-black">{progressPercent}%</span>
        </div>
        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-teal-600 to-amber-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Question Card Box */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-lg mb-8 relative">
        
        {/* Step 1: Age */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              {t('questionnaire.questions.age.title')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              {t('questionnaire.questions.age.hint')}
            </p>
            <div className="pt-2">
              <input
                type="number"
                min="10"
                max="90"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                className="w-full text-2xl sm:text-3xl font-extrabold text-teal-900 p-4 rounded-2xl border-2 border-teal-200 focus:border-teal-600 focus:outline-none bg-teal-50/30"
                placeholder={t('questionnaire.questions.age.placeholder')}
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Step 2: Gender */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              {t('questionnaire.questions.gender.title')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {['female', 'male', 'transgender', 'other'].map((gen) => (
                <button
                  key={gen}
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: gen })}
                  className={`p-4 rounded-2xl border-2 font-bold text-left transition-all flex items-center justify-between touch-target ${
                    formData.gender === gen
                      ? 'border-teal-600 bg-teal-50 text-teal-950 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <span className="text-base sm:text-lg">
                    {t(`questionnaire.questions.gender.options.${gen}`)}
                  </span>
                  {formData.gender === gen && (
                    <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Annual Family Income */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              {t('questionnaire.questions.family_income.title')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              {t('questionnaire.questions.family_income.hint')}
            </p>

            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 font-semibold">Enter or Slide:</span>
                <span className="text-xl sm:text-2xl font-black text-teal-900 font-mono">
                  ₹{Number(formData.family_income).toLocaleString('en-IN')}
                </span>
              </div>
              <input
                type="range"
                min="30000"
                max="800000"
                step="10000"
                value={formData.family_income}
                onChange={(e) => setFormData({ ...formData, family_income: Number(e.target.value) })}
                className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-2 font-mono">
                <span>₹30,000</span>
                <span>₹2.5 Lakhs (Key cutoff)</span>
                <span>₹8 Lakhs</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Community / Category */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              {t('questionnaire.questions.community.title')}
            </h2>
            <div className="grid grid-cols-1 gap-2.5 pt-2 max-h-80 overflow-y-auto pr-1">
              {['General', 'BC', 'MBC', 'DNC', 'SC', 'ST', 'SCA'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFormData({ ...formData, community: cat })}
                  className={`p-3.5 rounded-xl border-2 font-bold text-left transition-all flex items-center justify-between touch-target ${
                    formData.community === cat
                      ? 'border-teal-600 bg-teal-50 text-teal-950 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <span className="text-sm sm:text-base">
                    {t(`questionnaire.questions.community.options.${cat}`)}
                  </span>
                  {formData.community === cat && (
                    <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Education */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              {t('questionnaire.questions.education.title')}
            </h2>
            <div className="grid grid-cols-1 gap-2.5 pt-2 max-h-80 overflow-y-auto pr-1">
              {[
                'School',
                '10th pass',
                '12th pass',
                'Diploma',
                'ITI',
                'Under Graduate',
                'Post Graduate'
              ].map((edu) => (
                <button
                  key={edu}
                  type="button"
                  onClick={() => setFormData({ ...formData, education: edu })}
                  className={`p-3.5 rounded-xl border-2 font-bold text-left transition-all flex items-center justify-between touch-target ${
                    formData.education === edu
                      ? 'border-teal-600 bg-teal-50 text-teal-950 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <span className="text-sm sm:text-base">
                    {t(`questionnaire.questions.education.options.${edu}`)}
                  </span>
                  {formData.education === edu && (
                    <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 6: First Graduate */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              {t('questionnaire.questions.first_graduate.title')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, first_graduate: true })}
                className={`p-5 rounded-2xl border-2 font-bold text-left transition-all flex items-center justify-between touch-target ${
                  formData.first_graduate === true
                    ? 'border-teal-600 bg-teal-50 text-teal-950 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <span className="text-base sm:text-lg">
                  {t('questionnaire.questions.first_graduate.options.yes')}
                </span>
                {formData.first_graduate === true && (
                  <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, first_graduate: false })}
                className={`p-5 rounded-2xl border-2 font-bold text-left transition-all flex items-center justify-between touch-target ${
                  formData.first_graduate === false
                    ? 'border-teal-600 bg-teal-50 text-teal-950 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <span className="text-base sm:text-lg">
                  {t('questionnaire.questions.first_graduate.options.no')}
                </span>
                {formData.first_graduate === false && (
                  <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 7: State */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              {t('questionnaire.questions.state.title')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Select your Indian state of residence to discover both central and state-specific welfare grants.
            </p>
            
            <div className="pt-2 space-y-3">
              {/* Popular States Quick Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { name: 'Tamil Nadu', ta: 'தமிழ்நாடு' },
                  { name: 'Karnataka', ta: 'கர்நாடகா' },
                  { name: 'Andhra Pradesh', ta: 'ஆந்திரா' },
                  { name: 'Maharashtra', ta: 'மகாராஷ்டிரா' },
                  { name: 'Kerala', ta: 'கேரளா' },
                  { name: 'Delhi', ta: 'டெல்லி' }
                ].map((st) => (
                  <button
                    key={st.name}
                    type="button"
                    onClick={() => setFormData({ ...formData, state: st.name })}
                    className={`p-3 rounded-xl border-2 font-bold text-xs sm:text-sm text-left transition-all flex items-center justify-between touch-target ${
                      formData.state === st.name
                        ? 'border-teal-600 bg-teal-50 text-teal-950 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <span>{st.name}</span>
                    {formData.state === st.name && (
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              {/* All States Dropdown */}
              <div className="pt-2">
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Or select another State / UT:
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-semibold bg-white focus:outline-teal-600 touch-target"
                >
                  {statesList.map(s => (
                    <option key={s.code} value={s.name_en}>{s.name_en}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 8: District */}
        {currentStep === 7 && (
          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              {t('questionnaire.questions.district.title')}
            </h2>

            <input
              type="text"
              placeholder="Search district / மாவட்டம் தேட..."
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-teal-600 focus:outline-none mb-2"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
              {districts
                .filter(d => 
                  d.en.toLowerCase().includes(districtFilter.toLowerCase()) || 
                  (d.ta && d.ta.includes(districtFilter))
                )
                .map((d) => (
                  <button
                    key={d.en}
                    type="button"
                    onClick={() => setFormData({ ...formData, district: d.en })}
                    className={`p-3 rounded-xl border text-left font-bold text-xs sm:text-sm transition-all flex items-center justify-between touch-target ${
                      formData.district === d.en
                        ? 'border-teal-600 bg-teal-50 text-teal-950'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{getDistrictName(d)}</span>
                    {formData.district === d.en && (
                      <Check className="w-4 h-4 text-teal-600 shrink-0" />
                    )}
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Floating Voice Mic Button (Hidden if Web Speech API unsupported) */}
        {micSupported && (
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold">
                {isListening ? t('questionnaire.listening') : t('questionnaire.speakPrompt')}
              </span>
            </div>
            <button
              type="button"
              onClick={handleMicClick}
              className={`p-3 rounded-full transition-all touch-target shadow-sm flex items-center justify-center ${
                isListening 
                  ? 'bg-rose-500 text-white animate-pulse' 
                  : 'bg-teal-100 text-teal-800 hover:bg-teal-200'
              }`}
              title="Voice Input"
              aria-label="Toggle voice input"
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>
        )}

      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4">
        {currentStep > 0 ? (
          <button
            type="button"
            onClick={handlePrev}
            className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm touch-target transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('questionnaire.prev')}</span>
          </button>
        ) : (
          <div></div>
        )}

        <button
          type="button"
          onClick={handleNext}
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-sm sm:text-base shadow-md shadow-teal-700/20 transition-all touch-target focus-visible:ring-4 focus-visible:ring-teal-600/30 ml-auto"
        >
          <span>{currentStep === totalSteps - 1 ? t('questionnaire.submit') : t('questionnaire.next')}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* OCR Modal Dialog */}
      {ocrModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileUp className="w-5 h-5 text-teal-700" />
                <span>{t('questionnaire.ocrBannerTitle')}</span>
              </h3>
              <button 
                type="button"
                onClick={() => setOcrModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 mb-5 leading-relaxed">
              {t('questionnaire.ocrBannerDesc')}
            </p>

            {/* File Input */}
            <div className="mb-6">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleOcrUpload}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
              />
            </div>

            {ocrLoading && (
              <div className="p-4 bg-teal-50 rounded-xl text-center text-sm font-semibold text-teal-800 animate-pulse mb-4">
                Analyzing certificate text...
              </div>
            )}

            {ocrError && (
              <div className="p-3 bg-rose-50 text-rose-800 rounded-xl text-xs font-semibold mb-4">
                {ocrError}
              </div>
            )}

            {ocrExtractedData && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6 space-y-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  {t('questionnaire.ocrReviewTitle')}
                </span>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-xs text-slate-500 block">Identified Name:</span>
                    <span className="font-bold text-slate-900">{ocrExtractedData.name}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Certificate:</span>
                    <span className="font-bold text-slate-900 truncate block">{ocrExtractedData.certificate_type}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Income Extracted:</span>
                    <span className="font-bold text-teal-800">₹{ocrExtractedData.family_income?.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Community:</span>
                    <span className="font-bold text-teal-800">{ocrExtractedData.community}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200">
                  {ocrExtractedData.raw_extracted_text}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOcrModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold"
              >
                Cancel
              </button>
              {ocrExtractedData && (
                <button
                  type="button"
                  onClick={confirmOcrData}
                  className="px-5 py-2.5 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800"
                >
                  {t('questionnaire.ocrConfirmBtn')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
