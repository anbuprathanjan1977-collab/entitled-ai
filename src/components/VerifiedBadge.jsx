import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

export default function VerifiedBadge({ status = 'verified', date = '' }) {
  const { t } = useTranslation();
  const isVerified = status === 'verified';

  if (isVerified) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>
          {t('schemeDetail.verifiedOn')} {date || '2026-10-01'}
        </span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
      <span>{t('schemeDetail.needsRecheck')}</span>
    </span>
  );
}
