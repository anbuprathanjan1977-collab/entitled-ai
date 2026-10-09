import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, IndianRupee, AlertCircle, Building2, Landmark, Clock, Bell } from 'lucide-react';
import MatchRing from './MatchRing';
import VerifiedBadge from './VerifiedBadge';
import ReminderModal from './ReminderModal';

export default function SchemeCard({ 
  item, 
  isAlmostEligible = false, 
  isNewlyEligible = false 
}) {
  const { t, i18n } = useTranslation();
  const scheme = item.scheme || item;
  const matchPercent = item.match_percent ?? 100;
  const verifiedStatus = item.verified_status || 'verified';
  const failedReasons = item.failed_reasons || [];
  const [reminderOpen, setReminderOpen] = useState(false);

  // Determine localized scheme title
  const getSchemeName = () => {
    if (i18n.language === 'ta' && scheme.name_ta) return scheme.name_ta;
    if (i18n.language === 'hi' && scheme.name_hi) return scheme.name_hi;
    return scheme.name_en || scheme.name_ta;
  };

  const isCentral = (scheme.level || '').toLowerCase() === 'central';

  const daysLeft = (() => {
    if (!scheme.deadline) return null;
    const now = new Date();
    now.setHours(0,0,0,0);
    const target = new Date(scheme.deadline);
    target.setHours(0,0,0,0);
    return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  })();

  return (
    <div className={`relative bg-white rounded-2xl p-5 sm:p-6 border transition-all duration-200 hover:shadow-lg ${
      isNewlyEligible 
        ? 'border-amber-400 ring-2 ring-amber-300/50 shadow-md bg-amber-50/20' 
        : 'border-slate-200/90 hover:border-teal-300'
    }`}>
      
      {/* Reminder Modal */}
      <ReminderModal
        isOpen={reminderOpen}
        onClose={() => setReminderOpen(false)}
        item={{
          ...scheme,
          type: 'scheme',
          title_en: scheme.name_en,
          title_ta: scheme.name_ta,
          title_hi: scheme.name_hi,
          days_left: daysLeft,
          highlight_badge: scheme.benefit_text
        }}
      />
      
      {/* Newly eligible badge if triggered from what-if */}
      {isNewlyEligible && (
        <div className="absolute -top-3 right-6 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-xs px-3 py-1 rounded-full shadow-sm animate-bounce">
          ✨ {t('results.newlyEligibleBadge')}
        </div>
      )}

      {/* Top Header: Level tag + Verified Badge + Match Ring */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Level Tag */}
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold tracking-wide uppercase ${
            isCentral 
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
              : 'bg-teal-50 text-teal-800 border border-teal-200'
          }`}>
            {isCentral ? <Landmark className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
            <span>{isCentral ? t('common.central') : t('common.state')}</span>
          </span>

          {/* Verified Badge */}
          <VerifiedBadge 
            status={verifiedStatus} 
            date={scheme.last_verified} 
          />
        </div>

        {/* Circular Match Percentage Ring */}
        <MatchRing percent={matchPercent} />
      </div>

      {/* Scheme Title */}
      <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug mb-2 group-hover:text-teal-700">
        {getSchemeName()}
      </h3>

      {/* Benefit Highlight Box */}
      <div className="bg-teal-50/60 rounded-xl p-3 mb-4 border border-teal-100/80 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-teal-600/10 text-teal-700 flex items-center justify-center shrink-0">
          <IndianRupee className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xs text-teal-800/80 font-medium block">
            {t('schemeDetail.benefitAmount')}
          </span>
          <span className="text-sm sm:text-base font-extrabold text-teal-950">
            {scheme.benefit_text || `₹${scheme.benefit_amount.toLocaleString('en-IN')}`}
          </span>
        </div>
      </div>

      {/* Almost Eligible Failure Reason Card */}
      {isAlmostEligible && failedReasons.length > 0 && (
        <div className="bg-amber-50 rounded-xl p-3.5 mb-4 border border-amber-200 text-xs sm:text-sm text-amber-950">
          <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{t('results.reasonTitle')}</span>
          </div>
          {failedReasons.map((r, idx) => (
            <p key={idx} className="text-amber-900/90 leading-relaxed pl-5 font-medium">
              • {i18n.language === 'ta' && r.label_ta ? r.label_ta : r.label_en || r.gap}: <span className="font-bold underline">{r.gap}</span>
            </p>
          ))}
        </div>
      )}

      {/* Bottom Row: Deadline & Action Button */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium flex-wrap">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>
            {scheme.deadline ? `${scheme.deadline}` : t('schemeDetail.noDeadline')}
          </span>
          {daysLeft !== null && daysLeft <= 14 && daysLeft >= 0 && (
            <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
              daysLeft <= 3 ? 'bg-rose-600 text-white animate-pulse' : 'bg-amber-100 text-amber-900'
            }`}>
              {daysLeft <= 0 ? 'Today!' : `${daysLeft}d left`}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {scheme.deadline && (
            <button
              type="button"
              onClick={() => setReminderOpen(true)}
              title="Set Deadline Reminder"
              className="p-2 rounded-xl border border-slate-200 hover:bg-teal-50 text-slate-600 hover:text-teal-800 transition-colors"
            >
              <Bell className="w-4 h-4" />
            </button>
          )}

          <Link
            to={`/scheme/${scheme.id}`}
            state={{ matchItem: item }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-teal-700 hover:bg-teal-800 text-white transition-all shadow-xs touch-target focus-visible:ring-2 focus-visible:ring-teal-600"
          >
            <span>{t('results.viewDetails')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

    </div>
  );
}

