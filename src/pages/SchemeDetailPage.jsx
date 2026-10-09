import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, ExternalLink, Share2, CheckSquare, Square, 
  Sparkles, FileText, CheckCircle2, Clock, ShieldAlert, 
  HelpCircle, Landmark, Building2, Send, Calendar, Bell 
} from 'lucide-react';
import { getSchemeById, explainScheme } from '../api/schemes';
import { trackApplication } from '../api/applications';
import { useDeviceId } from '../hooks/useDeviceId';
import { downloadICS } from '../utils/calendar';
import VerifiedBadge from '../components/VerifiedBadge';
import { LoadingSkeleton, ErrorAlert } from '../components/LoadingSkeleton';
import ReminderModal from '../components/ReminderModal';

export default function SchemeDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const deviceId = useDeviceId();

  const [scheme, setScheme] = useState(location.state?.matchItem?.scheme || null);
  const [loading, setLoading] = useState(!scheme);
  const [error, setError] = useState(null);

  // 3-Line AI Explanation
  const [explanation, setExplanation] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);


  // Document checklist state (checked document IDs)
  const [checkedDocs, setCheckedDocs] = useState(new Set());

  // Application tracker status (applied, pending, received)
  const [appStatus, setAppStatus] = useState('pending');
  const [statusSaving, setStatusSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!scheme) {
      setLoading(true);
      getSchemeById(id)
        .then((data) => {
          if (mounted) setScheme(data);
        })
        .catch((err) => {
          if (mounted) setError(err.message || 'Scheme details not found');
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    }
    return () => { mounted = false; };
  }, [id, scheme]);

  // Fetch AI 3-line explanation
  useEffect(() => {
    let mounted = true;
    if (scheme?.id) {
      setAiLoading(true);
      explainScheme(scheme.id, i18n.language)
        .then((res) => {
          if (mounted) setExplanation(res.explanation);
        })
        .catch((err) => {
          console.warn('Explain failed:', err);
          if (mounted) {
            // Stored description fallback
            const fallback = i18n.language === 'ta' ? scheme.description_ta : scheme.description_en;
            setExplanation(fallback);
          }
        })
        .finally(() => {
          if (mounted) setAiLoading(false);
        });
    }
    return () => { mounted = false; };
  }, [scheme?.id, i18n.language]);

  const toggleDoc = (docId) => {
    setCheckedDocs((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) {
        next.delete(docId);
      } else {
        next.add(docId);
      }
      return next;
    });
  };

  const handleStatusChange = async (status) => {
    if (!deviceId || !scheme?.id) return;
    setAppStatus(status);
    setStatusSaving(true);
    try {
      await trackApplication(deviceId, scheme.id, status);
    } catch (e) {
      console.warn('Application status sync failed:', e);
    } finally {
      setStatusSaving(false);
    }
  };

  const getSchemeName = () => {
    if (!scheme) return '';
    if (i18n.language === 'ta' && scheme.name_ta) return scheme.name_ta;
    if (i18n.language === 'hi' && scheme.name_hi) return scheme.name_hi;
    return scheme.name_en || scheme.name_ta;
  };

  const getDocName = (doc) => {
    if (i18n.language === 'ta' && doc.name_ta) return doc.name_ta;
    if (i18n.language === 'hi' && doc.name_hi) return doc.name_hi;
    return doc.name_en;
  };

  const getDocHowTo = (doc) => {
    if (i18n.language === 'ta' && doc.how_to_get_ta) return doc.how_to_get_ta;
    if (i18n.language === 'hi' && doc.how_to_get_hi) return doc.how_to_get_hi;
    return doc.how_to_get_en;
  };

  const totalDocs = scheme?.documents?.length || 0;
  const readyDocs = checkedDocs.size;
  const docProgress = totalDocs > 0 ? Math.round((readyDocs / totalDocs) * 100) : 100;

  // Missing documents (un-checked)
  const missingDocs = (scheme?.documents || []).filter(d => !checkedDocs.has(d.id));

  // WhatsApp share link
  const shareText = encodeURIComponent(
    `Check out this government scheme on Entitle AI:\n*${getSchemeName()}*\nBenefit: ${scheme?.benefit_text}\nOfficial portal: ${scheme?.official_url}`
  );
  const waShareUrl = `https://wa.me/?text=${shareText}`;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <LoadingSkeleton count={2} />
      </div>
    );
  }

  if (error || !scheme) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ErrorAlert message={error} onRetry={() => navigate(-1)} />
      </div>
    );
  }

  const isCentral = (scheme.level || '').toLowerCase() === 'central';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-teal-800 transition-colors touch-target"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('schemeDetail.back')}</span>
        </button>

        {/* WhatsApp Share Button */}
        <a
          href={waShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors touch-target"
        >
          <Share2 className="w-4 h-4" />
          <span>{t('schemeDetail.shareWhatsapp')}</span>
        </a>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-lg mb-8">
        
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2.5 mb-4">
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-bold tracking-wide uppercase ${
            isCentral 
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
              : 'bg-teal-50 text-teal-800 border border-teal-200'
          }`}>
            {isCentral ? <Landmark className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
            <span>{isCentral ? t('common.central') : t('common.state')}</span>
          </span>

          <VerifiedBadge status="verified" date={scheme.last_verified} />

          {scheme.deadline && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 border border-rose-200 text-rose-800">
                <Clock className="w-3.5 h-3.5 text-rose-600" />
                <span>{t('schemeDetail.deadline')}: {scheme.deadline}</span>
              </span>
              <button
                type="button"
                onClick={() => downloadICS(getSchemeName(), scheme.benefit_text, scheme.deadline, scheme.official_url)}
                title="Add deadline to your calendar"
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 transition-colors"
              >
                <Calendar className="w-3 h-3 text-teal-700" />
                <span>Add to Calendar</span>
              </button>
            </div>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mb-4">
          {getSchemeName()}
        </h1>

        {/* Monetary Benefit Card */}
        <div className="bg-gradient-to-r from-teal-50 to-amber-50/50 rounded-2xl p-4 sm:p-5 border border-teal-200/80 mb-6 flex items-center justify-between gap-4">
          <div>
            <span className="text-xs text-teal-800 font-bold uppercase tracking-wider block mb-1">
              {t('schemeDetail.benefitAmount')}
            </span>
            <span className="text-xl sm:text-2xl font-black text-teal-950 font-sans">
              {scheme.benefit_text}
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 font-mono">
            ₹{scheme.benefit_amount.toLocaleString('en-IN')}
          </div>
        </div>

        {/* 3-Line AI Plain Explanation Box */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 mb-6 shadow-md border border-slate-800">
          <div className="flex items-center gap-2 mb-3 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4 fill-amber-400" />
            <span>{t('schemeDetail.aiExplainTitle')}</span>
          </div>
          {aiLoading ? (
            <div className="text-sm text-teal-200 animate-pulse">
              {t('schemeDetail.aiLoading')}
            </div>
          ) : (
            <div className="text-sm sm:text-base leading-relaxed text-slate-200 whitespace-pre-line font-medium">
              {explanation}
            </div>
          )}
        </div>

        {/* Reminder Modal */}
        <ReminderModal
          isOpen={reminderModalOpen}
          onClose={() => setReminderModalOpen(false)}
          item={{
            ...scheme,
            type: 'scheme',
            title_en: scheme.name_en,
            title_ta: scheme.name_ta,
            title_hi: scheme.name_hi,
            highlight_badge: scheme.benefit_text
          }}
        />

        {/* Official Portal Link & Verification Disclaimer */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <a
              href={scheme.official_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-base shadow-md shadow-teal-700/20 transition-all touch-target"
            >
              <span>{t('schemeDetail.officialBtn')}</span>
              <ExternalLink className="w-5 h-5" />
            </a>

            {scheme.deadline && (
              <button
                type="button"
                onClick={() => setReminderModalOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 py-4 px-5 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 font-bold text-sm transition-all"
              >
                <Bell className="w-4 h-4 text-amber-600" />
                <span>Remind Me</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200/70">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{t('schemeDetail.officialDisclaimer')}</span>
          </div>
        </div>


      </div>

      {/* Application Status Tracker Buttons */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-md mb-8">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">
          {t('schemeDetail.trackStatusTitle')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'pending', label: t('schemeDetail.status.pending'), color: 'amber' },
            { id: 'applied', label: t('schemeDetail.status.applied'), color: 'teal' },
            { id: 'received', label: t('schemeDetail.status.received'), color: 'emerald' },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => handleStatusChange(st.id)}
              className={`p-3.5 rounded-2xl font-bold text-xs sm:text-sm transition-all border-2 touch-target ${
                appStatus === st.id
                  ? 'border-teal-700 bg-teal-50 text-teal-950 shadow-xs'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <span>{st.label}</span>
              {appStatus === st.id && <span className="ml-2 font-black">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Document Checklist with Interactive Progress Bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-md mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
              {t('schemeDetail.docsRequired')}
            </h3>
            <span className="text-xs text-slate-500">
              {readyDocs} / {totalDocs} {t('schemeDetail.docsProgress')}
            </span>
          </div>
          <span className="text-lg font-black text-teal-700 font-mono">
            {docProgress}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-6">
          <div 
            className="h-full bg-teal-600 rounded-full transition-all duration-300"
            style={{ width: `${docProgress}%` }}
          ></div>
        </div>

        {/* Checklist */}
        <div className="space-y-3">
          {(scheme.documents || []).map((doc) => {
            const isChecked = checkedDocs.has(doc.id);
            return (
              <button
                key={doc.id}
                type="button"
                onClick={() => toggleDoc(doc.id)}
                className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3 transition-colors touch-target ${
                  isChecked 
                    ? 'border-emerald-300 bg-emerald-50/40 text-emerald-950' 
                    : 'border-slate-200 hover:bg-slate-50 text-slate-800'
                }`}
              >
                {isChecked ? (
                  <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <span className={`font-bold text-sm block ${isChecked ? 'line-through text-slate-500' : ''}`}>
                    {getDocName(doc)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Missing Documents Guidance Card */}
      {missingDocs.length > 0 && (
        <div className="bg-amber-50/70 rounded-3xl p-6 sm:p-7 border border-amber-200/90 shadow-sm mb-8">
          <h3 className="text-base sm:text-lg font-black text-amber-950 mb-3 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-600" />
            <span>{t('schemeDetail.missingDocsTitle')}</span>
          </h3>

          <div className="space-y-3">
            {missingDocs.map((doc) => (
              <div key={doc.id} className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs">
                <span className="font-bold text-slate-900 text-sm block mb-1">
                  {getDocName(doc)}:
                </span>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {getDocHowTo(doc)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-amber-200/80 flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs text-amber-900 font-semibold">
              Need Aadhaar, PAN or Certificate download steps?
            </span>
            <Link
              to="/esevai"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-teal-800 hover:text-teal-950 bg-teal-100 hover:bg-teal-200 px-3.5 py-1.5 rounded-xl transition-colors"
            >
              <span>e-Sevai & Document Portal Guide →</span>
            </Link>
          </div>
        </div>
      )}

      {/* Step-by-Step Application Guide */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-md">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-5">
          {t('schemeDetail.applyStepsTitle')}
        </h3>

        <div className="space-y-4">
          {(scheme.apply_steps || []).map((step, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-black text-sm flex items-center justify-center shrink-0">
                {idx + 1}
              </div>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed pt-1 font-medium">
                {step}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
