import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Bell, Clock, AlertTriangle, ExternalLink, Calendar, 
  CheckCircle2, BookmarkCheck, BookmarkPlus, Sparkles, 
  ChevronRight, ArrowLeft, Filter, Download, Trash2, ShieldAlert,
  Share2, Briefcase, Landmark, Check
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { getUpcomingDeadlines, getUserReminders, deleteUserReminder } from '../api/exams';
import { useDeviceId } from '../hooks/useDeviceId';
import { downloadICS, getGoogleCalendarUrl, getWhatsAppReminderUrl, playNotificationChime } from '../utils/calendar';
import { LoadingSkeleton, ErrorAlert } from '../components/LoadingSkeleton';
import ReminderModal from '../components/ReminderModal';

export default function DeadlinesPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const deviceId = useDeviceId();
  const currentLang = i18n.language || 'en';

  const [deadlines, setDeadlines] = useState([]);
  const [userReminders, setUserReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all, urgent, exams, schemes, saved
  const [selectedStateFilter, setSelectedStateFilter] = useState('all');
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  // Reminder Modal
  const [selectedItemForModal, setSelectedItemForModal] = useState(null);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [deviceId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [items, reminders] = await Promise.all([
        getUpcomingDeadlines(30),
        getUserReminders(deviceId).catch(() => [])
      ]);
      setDeadlines(items || []);
      setUserReminders(reminders || []);
    } catch (err) {
      console.error('Failed to load deadlines:', err);
      setError('Unable to load deadline notifications. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleOpenReminderModal = (item) => {
    setSelectedItemForModal(item);
    setReminderModalOpen(true);
  };

  const handleReminderSaved = (item) => {
    loadData();
    showToast(`Reminder set for ${item.title_en}!`);
  };

  const handleDeleteSaved = async (reminderId) => {
    try {
      await deleteUserReminder(reminderId, deviceId);
      setUserReminders(prev => prev.filter(r => r.id !== reminderId));
      showToast('Saved reminder deleted');
    } catch (err) {
      console.error('Error deleting reminder:', err);
    }
  };

  const getItemTitle = (item) => {
    if (currentLang === 'ta' && item.title_ta) return item.title_ta;
    if (currentLang === 'hi' && item.title_hi) return item.title_hi;
    return item.title_en;
  };

  const savedKeys = new Set(userReminders.map(r => `${r.item_type}_${r.item_id}`));
  const criticalCount = deadlines.filter(d => d.urgency === 'critical').length;
  const examCount = deadlines.filter(d => d.type === 'exam').length;
  const schemeCount = deadlines.filter(d => d.type === 'scheme').length;

  const filteredItems = deadlines.filter(item => {
    if (activeTab === 'urgent' && item.urgency !== 'critical') return false;
    if (activeTab === 'exams' && item.type !== 'exam') return false;
    if (activeTab === 'schemes' && item.type !== 'scheme') return false;
    if (selectedStateFilter !== 'all' && item.state !== selectedStateFilter && item.state !== 'All India') {
      return false;
    }
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 text-sm font-bold border border-slate-700">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Reminder Modal */}
      <ReminderModal
        isOpen={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
        item={selectedItemForModal}
        onSaved={handleReminderSaved}
      />

      {/* Navigation Row */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-teal-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <Link
          to="/jobs"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-xl transition-colors"
        >
          <span>View All Govt Exams →</span>
        </Link>
      </div>

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8 border border-teal-800/50">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-bold mb-3">
            <Clock className="w-3.5 h-3.5 text-rose-400" />
            <span>Finishing Soon & Deadline Alert Center</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black mb-2">
            Expiring Schemes & Exam Deadlines
          </h1>
          <p className="text-sm text-teal-100/90 leading-relaxed mb-6">
            Never miss an application deadline. Track scholarships, direct benefit welfare schemes, and competitive examinations closing within the next 30 days. Set instant on-device and WhatsApp alerts.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10">
          <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-xs">
            <span className="text-[10px] uppercase font-bold text-slate-300 block">Total Finishing Soon</span>
            <span className="text-xl font-black text-white font-mono">{deadlines.length}</span>
          </div>
          <div className="bg-rose-500/20 rounded-2xl p-3 border border-rose-500/30">
            <span className="text-[10px] uppercase font-bold text-rose-300 block">🚨 Urgent (≤ 3 Days)</span>
            <span className="text-xl font-black text-rose-300 font-mono">{criticalCount}</span>
          </div>
          <div className="bg-indigo-500/20 rounded-2xl p-3 border border-indigo-500/30">
            <span className="text-[10px] uppercase font-bold text-indigo-300 block">Govt Exams Ending</span>
            <span className="text-xl font-black text-indigo-300 font-mono">{examCount}</span>
          </div>
          <div className="bg-amber-500/20 rounded-2xl p-3 border border-amber-500/30">
            <span className="text-[10px] uppercase font-bold text-amber-300 block">Schemes Ending</span>
            <span className="text-xl font-black text-amber-300 font-mono">{schemeCount}</span>
          </div>
        </div>
      </div>

      {/* Tab Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'all' ? 'bg-teal-700 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All Deadlines ({deadlines.length})
          </button>
          <button
            onClick={() => setActiveTab('urgent')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'urgent' ? 'bg-rose-600 text-white shadow-xs' : 'bg-white text-rose-700 hover:bg-rose-50 border border-slate-200'
            }`}
          >
            🚨 Urgent (≤ 3 Days) ({criticalCount})
          </button>
          <button
            onClick={() => setActiveTab('exams')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'exams' ? 'bg-indigo-700 text-white shadow-xs' : 'bg-white text-indigo-700 hover:bg-indigo-50 border border-slate-200'
            }`}
          >
            Govt Exams ({examCount})
          </button>
          <button
            onClick={() => setActiveTab('schemes')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'schemes' ? 'bg-amber-600 text-white shadow-xs' : 'bg-white text-amber-800 hover:bg-amber-50 border border-slate-200'
            }`}
          >
            Welfare Schemes ({schemeCount})
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'saved' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-slate-200'
            }`}
          >
            📌 My Saved Reminders ({userReminders.length})
          </button>
        </div>

        {/* State Filter Dropdown */}
        {activeTab !== 'saved' && (
          <div className="w-full sm:w-auto">
            <select
              value={selectedStateFilter}
              onChange={(e) => setSelectedStateFilter(e.target.value)}
              className="p-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-teal-600"
            >
              <option value="all">Filter: All Regions</option>
              <option value="Tamil Nadu">Tamil Nadu Only</option>
              <option value="Karnataka">Karnataka Only</option>
              <option value="Andhra Pradesh">Andhra Pradesh Only</option>
              <option value="Maharashtra">Maharashtra Only</option>
              <option value="Kerala">Kerala Only</option>
            </select>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorAlert message={error} onRetry={loadData} />
      ) : activeTab === 'saved' ? (
        /* Saved Reminders Tab */
        <div className="space-y-4">
          {userReminders.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200">
              <BookmarkPlus className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700 mb-1">No reminders saved yet</h3>
              <p className="text-xs text-slate-500 mb-4">Click "Remind Me" on any scheme or exam card to save it here.</p>
              <button
                onClick={() => setActiveTab('all')}
                className="px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-bold"
              >
                Browse Upcoming Deadlines
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {userReminders.map(rem => (
                <div
                  key={rem.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 flex items-center justify-between gap-4 shadow-2xs"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 uppercase">
                        {rem.item_type}
                      </span>
                      <span className="text-xs font-semibold text-rose-700">
                        Deadline: {rem.deadline}
                      </span>
                      {rem.notes && (
                        <span className="text-xs text-slate-500 italic">
                          • {rem.notes}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">
                      {rem.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => downloadICS(rem.title, `Reminder for ${rem.item_type}`, rem.deadline)}
                      title="Download .ics Calendar Invite"
                      className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-teal-800 transition-colors"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSaved(rem.id)}
                      title="Remove reminder"
                      className="p-2.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Regular Deadlines List */
        <div className="space-y-4">
          {filteredItems.map(item => {
            const isCritical = item.urgency === 'critical';
            const isWarning = item.urgency === 'warning';
            const isSaved = savedKeys.has(`${item.type}_${item.id}`);

            return (
              <div
                key={`${item.type}-${item.id}`}
                className={`bg-white rounded-3xl p-6 border transition-all ${
                  isCritical 
                    ? 'border-rose-300 bg-rose-50/20 shadow-md ring-1 ring-rose-200' 
                    : isWarning 
                    ? 'border-amber-300 shadow-xs' 
                    : 'border-slate-200 hover:border-teal-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  
                  {/* Left Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-md text-xs font-black uppercase tracking-wider ${
                        item.type === 'exam' ? 'bg-indigo-100 text-indigo-800' : 'bg-teal-100 text-teal-800'
                      }`}>
                        {item.type === 'exam' ? 'Govt Exam' : 'Welfare Scheme'}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700">
                        {item.state}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        Category: {item.category}
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-black text-slate-900 mb-1 leading-snug">
                      {getItemTitle(item)}
                    </h2>

                    <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                      <span className="text-teal-700">{item.highlight_badge}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-rose-700">Last Date: {item.deadline}</span>
                    </div>
                  </div>

                  {/* Right Actions & Countdown */}
                  <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-3 shrink-0">
                    
                    {/* Countdown Pill */}
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${
                      isCritical
                        ? 'bg-rose-600 text-white animate-pulse'
                        : isWarning
                        ? 'bg-amber-500 text-white'
                        : 'bg-teal-100 text-teal-900'
                    }`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{item.days_left === 0 ? 'Last Day Today!' : `⏱ ${item.days_left} Days Left`}</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <a
                        href={item.official_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <span>Apply</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      {/* WhatsApp Share */}
                      <a
                        href={getWhatsAppReminderUrl(getItemTitle(item), item.deadline, item.days_left, item.official_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Share WhatsApp Reminder"
                        className="p-2.5 rounded-xl border border-emerald-200 hover:bg-emerald-50 text-emerald-700 transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                      </a>

                      {/* Calendar Export */}
                      <button
                        onClick={() => {
                          playNotificationChime();
                          downloadICS(getItemTitle(item), item.highlight_badge, item.deadline, item.official_url);
                        }}
                        title="Download Calendar (.ics) invite"
                        className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-teal-800 transition-colors"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>

                      {/* Remind Me / Configure Modal */}
                      <button
                        onClick={() => handleOpenReminderModal(item)}
                        title={isSaved ? "Reminder Set" : "Configure Reminder"}
                        className={`p-2.5 rounded-xl border transition-colors ${
                          isSaved ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        {isSaved ? <BookmarkCheck className="w-4 h-4 text-emerald-600" /> : <Bell className="w-4 h-4 text-teal-700" />}
                      </button>
                    </div>

                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
