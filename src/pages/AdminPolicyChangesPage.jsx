import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, CheckCircle2, XCircle, Sparkles, RefreshCw, 
  AlertTriangle, ShieldCheck, FileDiff, Eye 
} from 'lucide-react';
import { 
  getPolicyChanges, approvePolicyChange, rejectPolicyChange, 
  triggerCheckNow, triggerSimulateChange 
} from '../api/admin';
import { LoadingSkeleton, ErrorAlert } from '../components/LoadingSkeleton';

export default function AdminPolicyChangesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMsg, setActionMsg] = useState('');

  const loadChanges = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPolicyChanges();
      setChanges(data);
    } catch (err) {
      if (err.status === 401) {
        navigate('/admin');
      } else {
        setError(err.message || 'Failed to load policy change events');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChanges();
  }, []);

  const handleApprove = async (id) => {
    try {
      const res = await approvePolicyChange(id);
      setActionMsg(res.message);
      setChanges(changes.map(c => c.id === id ? { ...c, status: 'approved' } : c));
      setTimeout(() => setActionMsg(''), 4000);
    } catch (err) {
      alert(`Approval failed: ${err.message}`);
    }
  };

  const handleReject = async (id) => {
    try {
      const res = await rejectPolicyChange(id);
      setActionMsg(res.message);
      setChanges(changes.map(c => c.id === id ? { ...c, status: 'rejected' } : c));
      setTimeout(() => setActionMsg(''), 4000);
    } catch (err) {
      alert(`Rejection failed: ${err.message}`);
    }
  };

  const handleSimulateDemo = async () => {
    try {
      await triggerSimulateChange();
      await loadChanges();
      setActionMsg('New simulated live change event generated for demonstration!');
      setTimeout(() => setActionMsg(''), 4000);
    } catch (err) {
      alert(`Simulation failed: ${err.message}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Top Navbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/dashboard"
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-teal-700 hover:bg-slate-50 transition-colors"
            title="Back to Catalog"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2">
              <FileDiff className="w-7 h-7 text-amber-600" />
              <span>Policy Change Events & Diff Inspector</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Automated crawler detections from official portals
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSimulateDemo}
            className="px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-xs transition-colors"
          >
            + Simulate Change (Demo)
          </button>
          <button
            type="button"
            onClick={loadChanges}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs sm:text-sm font-bold mb-6 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {loading && <LoadingSkeleton count={2} />}
      {error && <ErrorAlert message={error} onRetry={loadChanges} />}

      {/* Events List */}
      {!loading && !error && (
        <div className="space-y-8">
          {changes.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 text-slate-500">
              <p>No policy change events detected yet. Click "Simulate Change" above to test the verification pipeline.</p>
            </div>
          ) : (
            changes.map((ev) => (
              <div 
                key={ev.id} 
                className={`bg-white rounded-3xl p-6 sm:p-8 border shadow-md space-y-6 ${
                  ev.status === 'pending' 
                    ? 'border-amber-300 ring-2 ring-amber-100' 
                    : 'border-slate-200'
                }`}
              >
                {/* Event Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                        Event #{ev.id}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase ${
                        ev.status === 'pending'
                          ? 'bg-amber-100 text-amber-900'
                          : ev.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                      }`}>
                        {ev.status}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900">
                      {ev.scheme_name_en}
                    </h3>
                    <span className="text-xs text-slate-400 font-tamil">
                      {ev.scheme_name_ta}
                    </span>
                  </div>

                  {/* Actions if Pending */}
                  {ev.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleApprove(ev.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors touch-target"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{t('admin.approve')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleReject(ev.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors touch-target"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>{t('admin.reject')}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* AI Summary Card */}
                <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-2">
                    <Sparkles className="w-4 h-4 fill-amber-400" />
                    <span>AI Detection Summary:</span>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-200 font-medium">
                    {ev.ai_summary}
                  </p>
                </div>

                {/* Side-by-Side Old vs New Text Diff */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Side-by-Side Policy Text Comparison
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Old Text */}
                    <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-200">
                      <span className="text-xs font-bold text-rose-800 uppercase block mb-2">
                        Stored Policy Text (Before)
                      </span>
                      <pre className="text-xs text-rose-950 font-mono whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                        {ev.old_text || 'None stored'}
                      </pre>
                    </div>

                    {/* New Text */}
                    <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200">
                      <span className="text-xs font-bold text-emerald-800 uppercase block mb-2">
                        Official Portal Update (Detected)
                      </span>
                      <pre className="text-xs text-emerald-950 font-mono whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                        {ev.new_text}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Unified Diff Output Box */}
                {ev.diff && (
                  <div className="bg-slate-950 text-slate-200 p-4 rounded-2xl border border-slate-800">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Unified Diff Patch:
                    </span>
                    <pre className="text-xs font-mono whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                      {ev.diff}
                    </pre>
                  </div>
                )}

                <div className="text-[11px] text-slate-400 text-right">
                  Detected at: {new Date(ev.detected_at).toLocaleString()}
                </div>

              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}
