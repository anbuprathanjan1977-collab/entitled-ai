import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ClipboardCheck, AlertTriangle, Clock, ArrowRight, 
  ExternalLink, CheckCircle2, RefreshCw, FolderSearch 
} from 'lucide-react';
import { getApplications, getUpcomingReminders, updateApplicationStatus } from '../api/applications';
import { useDeviceId } from '../hooks/useDeviceId';
import { LoadingSkeleton, ErrorAlert } from '../components/LoadingSkeleton';

export default function MyApplicationsPage() {
  const { t, i18n } = useTranslation();
  const deviceId = useDeviceId();

  const [applications, setApplications] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    if (!deviceId) return;
    setLoading(true);
    setError(null);
    try {
      const [appsData, remData] = await Promise.all([
        getApplications(deviceId),
        getUpcomingReminders(deviceId)
      ]);
      setApplications(appsData);
      setReminders(remData);
    } catch (err) {
      setError(err.message || 'Failed to fetch application history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [deviceId]);

  const handleStatusChange = async (appId, newStatus) => {
    try {
      await updateApplicationStatus(appId, newStatus);
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
    } catch (err) {
      console.warn('Status update error:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      
      {/* Page Title */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t('applications.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-mono mt-1">
            Device ID: {deviceId.substring(0, 18)}... (Stored securely on device)
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-teal-700 hover:bg-slate-50 touch-target"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* 14-Day Upcoming Deadline Alert Banner */}
      {reminders.length > 0 && (
        <div className="bg-amber-500 text-slate-950 rounded-2xl p-5 mb-8 shadow-md border border-amber-600/40 flex items-start gap-4 animate-in fade-in">
          <AlertTriangle className="w-6 h-6 text-slate-950 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-extrabold text-base mb-1">
              {t('applications.urgentBanner')}
            </h3>
            <div className="space-y-1.5 mt-2">
              {reminders.map((r) => (
                <div key={r.application_id} className="text-xs sm:text-sm font-semibold flex items-center justify-between bg-amber-400/60 p-2.5 rounded-xl">
                  <span>
                    {i18n.language === 'ta' ? r.scheme_name_ta : r.scheme_name_en}
                  </span>
                  <span className="font-black bg-slate-950 text-amber-300 px-2.5 py-0.5 rounded-full text-xs">
                    {r.days_left} {t('applications.daysLeft')} ({r.deadline})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading && <LoadingSkeleton count={2} />}

      {error && <ErrorAlert message={error} onRetry={loadData} />}

      {/* Applications List */}
      {!loading && !error && (
        <>
          {applications.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/90 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-4">
                <FolderSearch className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                No Tracked Schemes Yet
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
                {t('applications.empty')}
              </p>
              <Link
                to="/questionnaire"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-teal-700 text-white font-bold text-sm shadow-md hover:bg-teal-800 transition-colors"
              >
                <span>Find Schemes Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => {
                const s = app.scheme;
                return (
                  <div 
                    key={app.id} 
                    className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs hover:border-teal-300 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <div>
                        <span className="text-xs uppercase font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md mb-2 inline-block">
                          {s?.category || 'Welfare'}
                        </span>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900">
                          {i18n.language === 'ta' && s?.name_ta ? s.name_ta : s?.name_en}
                        </h3>
                        <span className="text-xs sm:text-sm text-teal-700 font-extrabold block mt-0.5">
                          {s?.benefit_text}
                        </span>
                      </div>

                      {/* Status Selector Dropdown */}
                      <div className="shrink-0">
                        <select
                          value={app.status}
                          onChange={(e) => handleStatusChange(app.id, e.target.value)}
                          className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border-2 border-slate-200 bg-slate-50 text-slate-800 focus:border-teal-600 focus:outline-none"
                        >
                          <option value="pending">Pending / Preparing</option>
                          <option value="applied">Applied</option>
                          <option value="received">Benefit Received</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Updated: {new Date(app.updated_at).toLocaleDateString()}</span>
                      {s && (
                        <Link 
                          to={`/scheme/${s.id}`} 
                          className="font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
                        >
                          <span>View Details</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

    </div>
  );
}
