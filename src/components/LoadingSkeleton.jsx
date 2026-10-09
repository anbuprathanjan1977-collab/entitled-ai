import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function LoadingSkeleton({ count = 3 }) {
  return (
    <div className="space-y-4 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-slate-200 rounded-md w-1/4"></div>
            <div className="h-10 w-10 bg-slate-200 rounded-full"></div>
          </div>
          <div className="h-5 bg-slate-200 rounded w-3/4"></div>
          <div className="h-12 bg-teal-50 rounded-xl w-full"></div>
          <div className="h-10 bg-slate-200 rounded-xl w-1/3 ml-auto"></div>
        </div>
      ))}
    </div>
  );
}

export function ErrorAlert({ message, onRetry }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl bg-rose-50 border border-rose-200 p-6 text-rose-950 my-6 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-bold text-base text-rose-900 mb-1">
            {t('common.error')}
          </h3>
          <p className="text-sm text-rose-800 leading-relaxed mb-4">
            {message || t('common.serverDown')}
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-xs touch-target focus-visible:ring-2 focus-visible:ring-rose-500"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t('common.retry')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
