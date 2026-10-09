import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Bell, Calendar, Clock, ExternalLink, X, CheckCircle2, 
  Share2, Smartphone, Mail, AlertTriangle, ShieldCheck, 
  Download, Sparkles, BookmarkCheck
} from 'lucide-react';
import { useDeviceId } from '../hooks/useDeviceId';
import { saveUserReminder } from '../api/exams';
import { 
  downloadICS, getGoogleCalendarUrl, getWhatsAppReminderUrl, playNotificationChime 
} from '../utils/calendar';

export default function ReminderModal({ isOpen, onClose, item, onSaved }) {
  const { t, i18n } = useTranslation();
  const deviceId = useDeviceId();
  const currentLang = i18n.language || 'en';

  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [remindDaysBefore, setRemindDaysBefore] = useState('3');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen || !item) return null;

  const itemTitle = currentLang === 'ta' && item.title_ta 
    ? item.title_ta 
    : (currentLang === 'hi' && item.title_hi ? item.title_hi : item.title_en || item.name_en || item.title);

  const deadline = item.deadline || '';
  const daysLeft = item.days_left !== undefined 
    ? item.days_left 
    : (() => {
        if (!deadline) return 0;
        const now = new Date();
        now.setHours(0,0,0,0);
        const target = new Date(deadline);
        target.setHours(0,0,0,0);
        return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
      })();

  const officialUrl = item.official_portal_url || item.official_url || '';
  const itemType = item.type || (item.conducting_body ? 'exam' : 'scheme');
  const isUrgent = daysLeft <= 3;

  const handleBrowserPush = async () => {
    if ('Notification' in window) {
      if (Notification.permission !== 'granted') {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') {
          alert('Please allow browser notifications in your browser settings to receive deadline alerts.');
          return;
        }
      }
      playNotificationChime();
      new Notification(`🔔 Reminder Set: ${itemTitle}`, {
        body: `Application closes on ${deadline} (${daysLeft} days left). Don't forget to submit!`,
        icon: '/favicon.ico'
      });
    }
    await handleSaveReminder('browser');
  };

  const handleSaveReminder = async (channel = 'browser') => {
    setIsSaving(true);
    try {
      playNotificationChime();
      const payload = {
        device_id: deviceId,
        item_type: itemType,
        item_id: item.id,
        title: item.title_en || item.name_en || itemTitle,
        deadline: deadline,
        contact_email: contactEmail.trim() || null,
        contact_phone: contactPhone.trim() || null,
        notes: customNote.trim() ? `[${remindDaysBefore}d before] ${customNote.trim()}` : `Remind ${remindDaysBefore} days before deadline`
      };

      await saveUserReminder(payload);
      setSuccessMsg('Reminder saved to your device & alert schedule!');
      if (onSaved) onSaved(item);

      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to save reminder:', err);
      alert('Unable to save reminder. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const googleCalUrl = getGoogleCalendarUrl(
    itemTitle, 
    `Government ${itemType === 'exam' ? 'Examination' : 'Scheme'} Application Deadline.\nPortal: ${officialUrl}`, 
    deadline, 
    officialUrl
  );

  const whatsAppUrl = getWhatsAppReminderUrl(itemTitle, deadline, daysLeft, officialUrl);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      
      {/* Click outside to close */}
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 z-10 animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex items-start gap-3.5 mb-5">
          <div className={`p-3 rounded-2xl ${isUrgent ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-teal-100 text-teal-800'}`}>
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                itemType === 'exam' ? 'bg-indigo-100 text-indigo-900' : 'bg-teal-100 text-teal-900'
              }`}>
                {itemType === 'exam' ? 'Govt Job Exam' : 'Welfare Scheme'}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                isUrgent ? 'bg-rose-600 text-white' : 'bg-amber-100 text-amber-900'
              }`}>
                {daysLeft <= 0 ? 'Closes Today!' : `⏱ ${daysLeft} Days Left`}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
              Set Deadline Reminder
            </h2>
          </div>
        </div>

        {/* Item Details Card */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 mb-5">
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 mb-1.5">
            {itemTitle}
          </h3>
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-600">
            <span className="flex items-center gap-1 text-rose-700">
              <Clock className="w-3.5 h-3.5" />
              <span>Last Date: <span className="underline">{deadline}</span></span>
            </span>
            {item.highlight_badge && (
              <span className="text-teal-700">
                {item.highlight_badge}
              </span>
            )}
          </div>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-2xl mb-4 flex items-center gap-2 text-xs sm:text-sm font-bold animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Instant Multi-Channel Actions */}
        <div className="mb-5">
          <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-2">
            Instant Reminder Options
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            
            {/* 1. On-Device Push */}
            <button
              type="button"
              onClick={handleBrowserPush}
              disabled={isSaving}
              className="p-3 rounded-2xl border border-teal-200 bg-teal-50/70 hover:bg-teal-100/80 text-teal-900 flex flex-col items-center justify-center text-center gap-1 transition-all group"
            >
              <Bell className="w-5 h-5 text-teal-700 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">On-Device Alert</span>
              <span className="text-[10px] text-teal-700/80">Browser Push</span>
            </button>

            {/* 2. WhatsApp Share */}
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleSaveReminder('whatsapp')}
              className="p-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/80 text-emerald-950 flex flex-col items-center justify-center text-center gap-1 transition-all group"
            >
              <Share2 className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">WhatsApp Alert</span>
              <span className="text-[10px] text-emerald-700/80">Send to self / chat</span>
            </a>

            {/* 3. Google Calendar */}
            <a
              href={googleCalUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleSaveReminder('google_cal')}
              className="p-3 rounded-2xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/80 text-indigo-950 flex flex-col items-center justify-center text-center gap-1 transition-all group"
            >
              <Calendar className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">Google Calendar</span>
              <span className="text-[10px] text-indigo-700/80">1-Click sync</span>
            </a>

            {/* 4. Download .ics */}
            <button
              type="button"
              onClick={() => {
                downloadICS(itemTitle, `Application Deadline.\nPortal: ${officialUrl}`, deadline, officialUrl);
                handleSaveReminder('ics');
              }}
              className="p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 flex flex-col items-center justify-center text-center gap-1 transition-all group"
            >
              <Download className="w-5 h-5 text-slate-600 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">Download (.ics)</span>
              <span className="text-[10px] text-slate-500">Apple / Outlook</span>
            </button>

          </div>
        </div>

        {/* Custom Reminder Form */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                When to alert me?
              </label>
              <select
                value={remindDaysBefore}
                onChange={(e) => setRemindDaysBefore(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
              >
                <option value="1">1 Day before deadline</option>
                <option value="3">3 Days before deadline</option>
                <option value="7">7 Days before deadline</option>
                <option value="0">On the closing day</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Mobile / WhatsApp (Optional)
              </label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Personal note / checklist (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Need to scan income certificate and degree marksheets first"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            {officialUrl && (
              <a
                href={officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900"
              >
                <span>Visit Official Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <button
              type="button"
              onClick={() => handleSaveReminder('manual')}
              disabled={isSaving}
              className="ml-auto px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-1.5"
            >
              <BookmarkCheck className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save to My Reminders'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
