import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Sparkles, Volume2, VolumeX, IndianRupee, Layers, 
  Award, HelpCircle, ArrowLeft, RefreshCw 
} from 'lucide-react';
import { matchProfile } from '../api/match';
import SchemeCard from '../components/SchemeCard';
import WhatIfPanel from '../components/WhatIfPanel';
import { LoadingSkeleton, ErrorAlert } from '../components/LoadingSkeleton';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

export default function ResultsPage() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  // Profile passed from Questionnaire via router state
  const profile = location.state?.profile || {
    age: 20,
    gender: 'female',
    family_income: 180000,
    community: 'MBC',
    education: 'Under Graduate',
    first_graduate: true,
    state: 'Tamil Nadu',
    district: 'Chennai'
  };

  const [activeTab, setActiveTab] = useState('eligible'); // 'eligible', 'almost', 'topPicks'
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Newly eligible scheme IDs from What-If simulation
  const [newlyEligibleIds, setNewlyEligibleIds] = useState(new Set());

  // Web Speech Synthesis
  const { isSupported: ttsSupported, isSpeaking, speak, stop } = useSpeechSynthesis();

  const fetchMatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await matchProfile(profile);
      setMatchData(data);
    } catch (err) {
      setError(err.message || 'Failed to calculate scheme eligibility.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  // Read aloud audio summary
  const handleReadAloud = () => {
    if (isSpeaking) {
      stop();
      return;
    }

    if (!matchData) return;

    let textToSpeak = '';
    const totalBenefit = matchData.total_eligible_benefit.toLocaleString('en-IN');
    const eligibleCount = matchData.total_eligible_count;

    if (i18n.language === 'ta') {
      textToSpeak = `உங்களுக்கு ${eligibleCount} அரசு நலத்திட்டங்கள் முழு தகுதி பெற்றுள்ளன. மதிப்பிடப்பட்ட மொத்த ஆண்டு பயன் ரூபாய் ${totalBenefit}. முதல் திட்டங்களை அறிய திரையை பார்க்கவும்.`;
    } else if (i18n.language === 'hi') {
      textToSpeak = `आपके लिए ${eligibleCount} सरकारी योजनाएं पूर्ण रूप से पात्र हैं। अनुमानित कुल वार्षिक लाभ रुपये ${totalBenefit} है।`;
    } else {
      textToSpeak = `You are eligible for ${eligibleCount} government welfare schemes with an estimated total annual benefit of rupees ${totalBenefit}.`;
    }

    speak(textToSpeak);
  };

  const handleWhatIfSimulationChange = (simulationResult) => {
    if (simulationResult && simulationResult.newly_eligible) {
      const newIds = new Set(simulationResult.newly_eligible.map(item => item.scheme.id));
      setNewlyEligibleIds(newIds);
    } else {
      setNewlyEligibleIds(new Set());
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      
      {/* Top Bar with Back Button & Read Aloud */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <button
          type="button"
          onClick={() => navigate('/questionnaire')}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-teal-800 transition-colors touch-target"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('schemeDetail.back')}</span>
        </button>

        {ttsSupported && matchData && (
          <button
            type="button"
            onClick={handleReadAloud}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs touch-target ${
              isSpeaking
                ? 'bg-amber-500 text-teal-950 animate-pulse'
                : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200'
            }`}
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{isSpeaking ? t('results.stopRead') : t('results.readAloud')}</span>
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && <LoadingSkeleton count={3} />}

      {/* Error State */}
      {error && <ErrorAlert message={error} onRetry={fetchMatches} />}

      {/* Main Results Display */}
      {!loading && !error && matchData && (
        <>
          {/* Estimated Total Benefit Banner */}
          <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8 border border-teal-600/50 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-900/80 text-amber-300 text-xs font-bold mb-3 border border-teal-600">
                <Sparkles className="w-3.5 h-3.5 fill-amber-300" />
                <span>{t('results.title')}</span>
              </div>
              <h2 className="text-sm sm:text-base font-semibold text-teal-100 mb-1">
                {t('results.summaryBenefit')}
              </h2>
              <div className="text-3xl sm:text-5xl font-black text-amber-400 font-mono tracking-tight">
                ₹{matchData.total_eligible_benefit.toLocaleString('en-IN')}
                <span className="text-sm sm:text-base font-normal text-teal-200 ml-2">/ year</span>
              </div>
            </div>

            <div className="bg-teal-900/60 p-4 rounded-2xl border border-teal-700 text-center shrink-0 w-full sm:w-auto">
              <span className="text-2xl sm:text-4xl font-extrabold text-white block">
                {matchData.total_eligible_count}
              </span>
              <span className="text-xs text-teal-200 font-medium">
                {t('results.schemesCount')}
              </span>
            </div>
          </div>

          {/* Tab Navigation: Eligible, Almost Eligible, Top Picks */}
          <div className="flex border-b border-slate-200 mb-6 gap-2 sm:gap-4 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setActiveTab('eligible')}
              className={`pb-3 px-3 text-sm sm:text-base font-bold transition-all relative whitespace-nowrap touch-target ${
                activeTab === 'eligible'
                  ? 'text-teal-800 border-b-3 border-teal-700'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>{t('results.tabs.eligible')}</span>
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-teal-100 text-teal-800 font-black">
                {matchData.eligible.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('almost')}
              className={`pb-3 px-3 text-sm sm:text-base font-bold transition-all relative whitespace-nowrap touch-target ${
                activeTab === 'almost'
                  ? 'text-teal-800 border-b-3 border-teal-700'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>{t('results.tabs.almost')}</span>
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 font-black">
                {matchData.almost_eligible.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('topPicks')}
              className={`pb-3 px-3 text-sm sm:text-base font-bold transition-all relative whitespace-nowrap touch-target flex items-center gap-1.5 ${
                activeTab === 'topPicks'
                  ? 'text-teal-800 border-b-3 border-teal-700'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Award className="w-4 h-4 text-amber-500" />
              <span>{t('results.tabs.topPicks')}</span>
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-800 font-black">
                {matchData.top_picks.length}
              </span>
            </button>
          </div>

          {/* Scheme Cards List */}
          <div className="space-y-4 mb-10">
            {activeTab === 'eligible' && (
              <>
                {matchData.eligible.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center text-slate-500 border border-slate-200">
                    <p>{t('results.noEligible')}</p>
                  </div>
                ) : (
                  matchData.eligible.map((item) => (
                    <SchemeCard
                      key={item.scheme.id}
                      item={item}
                      isNewlyEligible={newlyEligibleIds.has(item.scheme.id)}
                    />
                  ))
                )}
              </>
            )}

            {activeTab === 'almost' && (
              <>
                {matchData.almost_eligible.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center text-slate-500 border border-slate-200">
                    <p>{t('results.noAlmost')}</p>
                  </div>
                ) : (
                  matchData.almost_eligible.map((item) => (
                    <SchemeCard
                      key={item.scheme.id}
                      item={item}
                      isAlmostEligible={true}
                    />
                  ))
                )}
              </>
            )}

            {activeTab === 'topPicks' && (
              <>
                {matchData.top_picks.map((item) => (
                  <SchemeCard
                    key={item.scheme.id}
                    item={item}
                    isNewlyEligible={newlyEligibleIds.has(item.scheme.id)}
                  />
                ))}
              </>
            )}
          </div>

          {/* What-If Simulation Panel */}
          <WhatIfPanel
            originalProfile={profile}
            onSimulationChange={handleWhatIfSimulationChange}
          />
        </>
      )}

    </div>
  );
}
