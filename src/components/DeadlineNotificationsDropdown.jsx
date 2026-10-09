import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Bell, Clock, AlertTriangle, ExternalLink, Calendar, 
  CheckCircle2, X, Sparkles, ChevronRight, BookmarkCheck, 
  BookmarkPlus, ShieldAlert, Share2 
} from 'lucide-react';
import { getUpcomingDeadlines, saveUserReminder, getUserReminders, deleteUserReminder } from '../api/exams';
import { useDeviceId } from '../hooks/useDeviceId';
import { downloadICS, getGoogleCalendarUrl, getWhatsAppReminderUrl, playNotificationChime } from '../utils/calendar';

export default function DeadlineNotificationsDropdown({ isOpen, onClose }) {
  const { i18n } = useTranslation();
  const deviceId = useDeviceId();
  const currentLang = i18n.language || 'en';

  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'critical', 'exams', 'schemes'
  const [savedReminderIds, setSavedReminderIds] = useState(new Set());
  const [notificationPermission, setNotificationPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, deviceId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [items, userReminders] = await Promise.all([
        getUpcomingDeadlines(30),
        getUserReminders(deviceId).catch(() => [])
      ]);
      setDeadlines(items || []);
      const savedSet = new Set((userReminders || []).map(r => `${r.item_type}_${r.item_id}`));
      setSavedReminderIds(savedSet);
    } catch (err) {
      console.error('Failed to load upcoming deadlines:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleReminder = async (item) => {
    const key = `${item.type}_${item.id}`;
    const isSaved = savedReminderIds.has(key);

    try {
      playNotificationChime();
      if (isSaved) {
        // remove
        const userReminders = await getUserReminders(deviceId);
        const match = userReminders.find(r => r.item_type === item.type && r.item_id === item.id);
        if (match) {
          await deleteUserReminder(match.id, deviceId);
        }
        setSavedReminderIds(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      } else {
        // add
        await saveUserReminder({
          device_id: deviceId,
          item_type: item.type,
          item_id: item.id,
          title: item.title_en,
          deadline: item.deadline
        });
        setSavedReminderIds(prev => new Set(prev).add(key));

        // Trigger browser notification if permitted
        if (notificationPermission === 'granted') {
          new Notification(`Reminder Set: ${item.title_en}`, {
            body: `Deadline: ${item.deadline} (${item.days_left} days left). Don't forget to submit!`,
            icon: '/favicon.ico'
          });
        }
      }
    } catch (err) {
      console.error('Failed to toggle reminder:', err);
    }
  };

  const requestNotificationAccess = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        playNotificationChime();
        new Notification('Entitle AI Deadlines Alert Active', {
          body: "You will receive timely alerts for schemes and government exams before they expire!",
          icon: '/favicon.ico'
        });
      }
    }
  };

  const getItemTitle = (item) => {
    if (currentLang === 'ta' && item.title_ta) return item.title_ta;
    if (currentLang === 'hi' && item.title_hi) return item.title_hi;
    return item.title_en;
  };

  const filteredItems = deadlines.filter(item => {
    if (activeTab === 'critical') return item.urgency === 'critical';
    if (activeTab === 'exams') return item.type === 'exam';
    if (activeTab === 'schemes') return item.type === 'scheme';
    return true;
  });

  const criticalCount = deadlines.filter(d => d.urgency === 'critical').length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Side drawer panel */}
      <div className="relative w-full max-w-md sm:max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative p-2.5 bg-white/10 rounded-xl backdrop-blur-xs">
              <Bell className="w-5 h-5 text-amber-300 animate-bounce" />
              {criticalCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-black text-white flex items-center justify-center">
                  {criticalCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Deadline Alerts & Reminders</h2>
              <p className="text-xs text-teal-200">Schemes and exams ending soon</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Browser Push Permission Banner */}
        {notificationPermission !== 'granted' && (
          <div className="px-5 py-3 bg-amber-50 border-b border-amber-200/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-amber-900 font-medium">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Get notified on your device before deadlines close?</span>
            </div>
            <button
              onClick={requestNotificationAccess}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs whitespace-nowrap shadow-2xs transition-colors"
            >
              Enable Alerts
            </button>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'all' ? 'bg-teal-700 text-white shadow-2xs' : 'bg-white text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Ending Soon ({deadlines.length})
          </button>
          <button
            onClick={() => setActiveTab('critical')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'critical' ? 'bg-rose-600 text-white shadow-2xs' : 'bg-white text-rose-700 hover:bg-rose-50'
            }`}
          >
            🚨 Urgent (≤ 3 Days) ({criticalCount})
          </button>
          <button
            onClick={() => setActiveTab('exams')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'exams' ? 'bg-indigo-700 text-white shadow-2xs' : 'bg-white text-indigo-700 hover:bg-indigo-50'
            }`}
          >
            Govt Exams
          </button>
          <button
            onClick={() => setActiveTab('schemes')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'schemes' ? 'bg-amber-600 text-white shadow-2xs' : 'bg-white text-amber-800 hover:bg-amber-50'
            }`}
          >
            Welfare Schemes
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <Clock className="w-8 h-8 mx-auto mb-2 animate-spin text-teal-600" />
              <p className="text-sm font-semibold">Scanning upcoming deadlines...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
              <p className="text-sm font-bold text-slate-700">No deadlines closing in this category!</p>
              <p className="text-xs text-slate-400 mt-1">Check back regularly or set customized reminders.</p>
            </div>
          ) : (
            filteredItems.map(item => {
              const isSaved = savedReminderIds.has(`${item.type}_${item.id}`);
              const isCritical = item.urgency === 'critical';
              const isWarning = item.urgency === 'warning';

              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className={`p-4 rounded-2xl border transition-all ${
                    isCritical
                      ? 'border-rose-300 bg-rose-50/40 hover:bg-rose-50/70 shadow-xs'
                      : isWarning
                      ? 'border-amber-300 bg-amber-50/40 hover:bg-amber-50/70'
                      : 'border-slate-200 bg-white hover:border-teal-300'
                  }`}
                >
                  {/* Top tags row */}
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        item.type === 'exam' ? 'bg-indigo-100 text-indigo-800' : 'bg-teal-100 text-teal-800'
                      }`}>
                        {item.type === 'exam' ? 'Govt Exam' : 'Scheme'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 px-2 py-0.5 rounded-md bg-slate-100">
                        {item.state}
                      </span>
                    </div>

                    {/* Countdown Pill */}
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black ${
                      isCritical
                        ? 'bg-rose-600 text-white animate-pulse'
                        : isWarning
                        ? 'bg-amber-500 text-white'
                        : 'bg-teal-100 text-teal-900'
                    }`}>
                      <Clock className="w-3 h-3" />
                      <span>{item.days_left === 0 ? 'Closes Today!' : `${item.days_left} Days Left`}</span>
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug mb-1">
                    {getItemTitle(item)}
                  </h3>

                  {/* Highlight text / Vacancies / Benefits */}
                  <div className="text-xs font-semibold text-slate-600 mb-3 flex items-center gap-2">
                    <span className="text-teal-700 font-bold">{item.highlight_badge}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500">Deadline: {item.deadline}</span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80">
                    <a
                      href={item.official_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs transition-colors"
                    >
                      <span>Apply Online</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    {/* WhatsApp share */}
                    <a
                      href={getWhatsAppReminderUrl(getItemTitle(item), item.deadline, item.days_left, item.official_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Share WhatsApp Reminder"
                      className="p-2 rounded-xl border border-emerald-200 hover:bg-emerald-50 text-emerald-700 transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                    </a>

                    {/* Calendar export (.ics) */}
                    <button
                      type="button"
                      onClick={() => {
                        playNotificationChime();
                        downloadICS(getItemTitle(item), item.highlight_badge, item.deadline, item.official_url);
                      }}
                      title="Add to Google / Apple / Outlook Calendar"
                      className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
                    >
                      <Calendar className="w-4 h-4 text-teal-700" />
                    </button>

                    {/* Toggle Reminder Bookmark */}
                    <button
                      type="button"
                      onClick={() => handleToggleReminder(item)}
                      title={isSaved ? "Reminder Set (Click to remove)" : "Remind Me"}
                      className={`p-2 rounded-xl border transition-colors ${
                        isSaved
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 hover:bg-slate-100 text-slate-500'
                      }`}
                    >
                      {isSaved ? <BookmarkCheck className="w-4 h-4 text-emerald-600" /> : <BookmarkPlus className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <Link
            to="/deadlines"
            onClick={onClose}
            className="text-xs font-bold text-teal-800 hover:text-teal-950 flex items-center gap-1"
          >
            <span>View Full Deadlines Dashboard</span>
            <ChevronRight className="w-4 h-4" />
          </Link>

          <Link
            to="/jobs"
            onClick={onClose}
            className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1"
          >
            <span>Govt Jobs Portal</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </div>
  );
}
