import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Bell, Clock, AlertTriangle, ArrowRight, X, Sparkles, 
  ExternalLink, Briefcase, ChevronRight 
} from 'lucide-react';
import { getDeadlinesSummary } from '../api/exams';

export default function UrgentDeadlineBanner({ onOpenNotifications }) {
  const { i18n } = useTranslation();
  const location = useLocation();
  const currentLang = i18n.language || 'en';

  const [summary, setSummary] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem('urimai_urgent_banner_dismissed') === 'true';
    if (isDismissed) {
      setDismissed(true);
      return;
    }

    let mounted = true;
    getDeadlinesSummary(14)
      .then(data => {
        if (mounted && data && (data.critical_count > 0 || data.warning_count > 0)) {
          setSummary(data);
        }
      })
      .catch(() => {});

    return () => { mounted = false; };
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('urimai_urgent_banner_dismissed', 'true');
  };

  // Don't show on admin or already on deadlines page
  if (dismissed || !summary || location.pathname.startsWith('/admin')) {
    return null;
  }

  const { critical_count, warning_count, schemes_count, exams_count, critical_items } = summary;
  const topCritical = critical_items && critical_items.length > 0 ? critical_items[0] : null;

  const topTitle = topCritical 
    ? (currentLang === 'ta' && topCritical.title_ta ? topCritical.title_ta : (currentLang === 'hi' && topCritical.title_hi ? topCritical.title_hi : topCritical.title_en))
    : '';

  return (
    <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-amber-950 text-white border-b border-rose-800/60 shadow-md relative z-30 animate-in slide-in-from-top-2 duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3 text-xs sm:text-sm">
        
        {/* Left icon & summary ticker */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span className="p-1.5 rounded-lg bg-rose-600 text-white shrink-0 shadow-xs animate-bounce">
            <Bell className="w-4 h-4" />
          </span>

          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="font-black bg-rose-500/40 border border-rose-400/50 px-2.5 py-0.5 rounded-full text-[11px] tracking-wide uppercase shrink-0">
              🚨 Ending Soon Alert
            </span>

            <span className="font-bold text-rose-100 truncate">
              {critical_count > 0 ? (
                <>
                  <span className="text-amber-300 font-extrabold">{critical_count} critical opportunities</span> closing in ≤ 3 days ({schemes_count} schemes, {exams_count} govt exams)!
                </>
              ) : (
                <>
                  <span className="text-amber-300 font-extrabold">{warning_count} opportunities</span> finishing this week!
                </>
              )}
            </span>

            {topCritical && (
              <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-rose-200/90 bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-800">
                <Clock className="w-3 h-3 text-amber-400" />
                <span className="truncate max-w-[220px]">Closing next: <b>{topTitle}</b> ({topCritical.days_left}d left)</span>
              </span>
            )}
          </div>
        </div>

        {/* Right buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/deadlines"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-xs transition-transform active:scale-95"
          >
            <span>View Deadlines</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <Link
            to="/jobs"
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors"
          >
            <Briefcase className="w-3 h-3 text-amber-300" />
            <span>Govt Exams</span>
          </Link>

          {/* Dismiss button */}
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-rose-200 hover:text-white hover:bg-white/10 transition-colors ml-1"
            title="Dismiss notice"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
