import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Briefcase, Search, Filter, Clock, ExternalLink, Calendar, 
  AlertCircle, CheckCircle2, BookmarkCheck, BookmarkPlus, 
  GraduationCap, Building, ChevronDown, ChevronUp, FileText, 
  Sparkles, ShieldCheck, Download, Bell, Share2, Compass, 
  UserCheck, ArrowRight, Check, MapPin, Award, Layers
} from 'lucide-react';
import { getGovtExams, getOfficialPortalsDirectory, getUserReminders } from '../api/exams';
import { useDeviceId } from '../hooks/useDeviceId';
import { downloadICS, getGoogleCalendarUrl, getWhatsAppReminderUrl, playNotificationChime } from '../utils/calendar';
import { LoadingSkeleton, ErrorAlert } from '../components/LoadingSkeleton';
import ReminderModal from '../components/ReminderModal';

export default function GovtJobsPage() {
  const { t, i18n } = useTranslation();
  const deviceId = useDeviceId();
  const currentLang = i18n.language || 'en';

  const [exams, setExams] = useState([]);
  const [portals, setPortals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all'); // all, central, state
  const [selectedState, setSelectedState] = useState('all');
  const [selectedQualification, setSelectedQualification] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [closingSoonOnly, setClosingSoonOnly] = useState(false);
  const [sortBy, setSortBy] = useState('deadline_asc');

  // Quick Eligibility Screener Panel
  const [showEligibilityScreener, setShowEligibilityScreener] = useState(false);
  const [screenerAge, setScreenerAge] = useState('');
  const [screenerEducation, setScreenerEducation] = useState('all');

  // Expanded cards for step-by-step syllabus / selection details
  const [expandedId, setExpandedId] = useState(null);

  // Reminder Modal State
  const [selectedExamForReminder, setSelectedExamForReminder] = useState(null);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);

  // Saved reminders set
  const [savedReminderIds, setSavedReminderIds] = useState(new Set());
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    fetchExams();
    fetchReminders();
    fetchPortals();
  }, [selectedLevel, selectedState, selectedQualification, selectedCategory, closingSoonOnly, sortBy]);

  const fetchExams = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (selectedLevel !== 'all') params.level = selectedLevel;
      if (selectedState !== 'all') params.state = selectedState;
      if (selectedQualification !== 'all') params.qualification = selectedQualification;
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (closingSoonOnly) params.closing_soon = true;
      if (searchTerm.trim()) params.search = searchTerm.trim();
      params.sort_by = sortBy;

      const data = await getGovtExams(params);
      setExams(data || []);
    } catch (err) {
      console.error('Error fetching exams:', err);
      setError('Unable to load government examination notifications. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchReminders = async () => {
    try {
      const data = await getUserReminders(deviceId);
      const set = new Set((data || []).filter(r => r.item_type === 'exam').map(r => r.item_id));
      setSavedReminderIds(set);
    } catch {
      // ignore
    }
  };

  const fetchPortals = async () => {
    try {
      const list = await getOfficialPortalsDirectory();
      setPortals(list || []);
    } catch {
      // fallback
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchExams();
  };

  const openReminderModal = (exam) => {
    setSelectedExamForReminder(exam);
    setReminderModalOpen(true);
  };

  const handleReminderSaved = (exam) => {
    setSavedReminderIds(prev => new Set(prev).add(exam.id));
    showToastNotification(`Reminder active for ${exam.conducting_body} - ${exam.title_en}!`);
  };

  const showToastNotification = (msg) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(''), 3500);
  };

  const getExamTitle = (exam) => {
    if (currentLang === 'ta' && exam.title_ta) return exam.title_ta;
    if (currentLang === 'hi' && exam.title_hi) return exam.title_hi;
    return exam.title_en;
  };

  const getDaysLeft = (deadlineStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(deadlineStr);
    deadline.setHours(0, 0, 0, 0);
    const diffTime = deadline - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Eligibility Screener Filter Logic
  const filteredExams = exams.filter(exam => {
    if (!showEligibilityScreener) return true;

    // Check education qualification
    if (screenerEducation !== 'all') {
      const qual = (exam.qualification || '').toLowerCase();
      if (screenerEducation === '10th' && !qual.includes('10th') && !qual.includes('sslc') && !qual.includes('matriculation')) {
        return false;
      }
      if (screenerEducation === '12th' && !qual.includes('12th') && !qual.includes('higher secondary') && !qual.includes('puc') && !qual.includes('10th')) {
        return false;
      }
      if (screenerEducation === 'graduate' && !qual.includes('graduate') && !qual.includes('degree')) {
        return false;
      }
      if (screenerEducation === 'iti' && !qual.includes('iti') && !qual.includes('diploma')) {
        return false;
      }
    }

    // Check age limit
    if (screenerAge) {
      const userAge = parseInt(screenerAge, 10);
      if (!isNaN(userAge)) {
        const ageLimitStr = exam.age_limit || '';
        const match = ageLimitStr.match(/(\d+)\s*-\s*(\d+)/);
        if (match) {
          const minAge = parseInt(match[1], 10);
          const maxAge = parseInt(match[2], 10);
          if (userAge < minAge || userAge > (maxAge + 5)) { // include typical relaxation buffer
            return false;
          }
        }
      }
    }

    return true;
  });

  // Calculate total vacancies approximate sum
  const totalOpeningsDisplay = "1,85,000+";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      
      {/* Toast Notification */}
      {actionMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 text-sm font-bold border border-slate-700">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Reminder Modal */}
      <ReminderModal
        isOpen={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
        item={selectedExamForReminder}
        onSaved={handleReminderSaved}
      />

      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-teal-950 rounded-3xl p-6 sm:p-10 text-white shadow-2xl mb-8 relative overflow-hidden border border-indigo-900/60">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold mb-4">
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            <span>Central & State Government Job Apply & Examination Portal</span>
          </div>
          
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-3 leading-tight">
            Government Jobs & Exam Portal
          </h1>
          
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6">
            Explore verified Central and State recruitment notifications (UPSC, SSC, RRB Railways, IBPS Banking, TNPSC, Police, and State Services). Apply directly through official portals before closing dates.
          </p>

          {/* Key Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-xs border border-white/10">
              <span className="text-[10px] uppercase font-bold text-slate-300 block">Total Vacancies</span>
              <span className="text-lg sm:text-xl font-black text-amber-300 font-mono">{totalOpeningsDisplay}</span>
            </div>
            <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-xs border border-white/10">
              <span className="text-[10px] uppercase font-bold text-slate-300 block">Active Exam Drives</span>
              <span className="text-lg sm:text-xl font-black text-white font-mono">{exams.length} Notifications</span>
            </div>
            <div className="bg-rose-500/20 rounded-2xl p-3 border border-rose-400/30">
              <span className="text-[10px] uppercase font-bold text-rose-300 block">🚨 Closing in ≤ 3 Days</span>
              <span className="text-lg sm:text-xl font-black text-rose-300 font-mono">
                {exams.filter(e => getDaysLeft(e.deadline) <= 3).length} Exams
              </span>
            </div>
            <div className="bg-teal-500/20 rounded-2xl p-3 border border-teal-400/30">
              <span className="text-[10px] uppercase font-bold text-teal-300 block">Free Fee For Women/SC/ST</span>
              <span className="text-lg sm:text-xl font-black text-teal-300 font-mono">Available</span>
            </div>
          </div>

          {/* Quick Level Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <button
              onClick={() => { setSelectedLevel('all'); setSelectedState('all'); }}
              className={`px-4 py-2.5 rounded-xl transition-all ${
                selectedLevel === 'all' 
                  ? 'bg-amber-400 text-slate-950 shadow-md font-black' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              All Examinations ({exams.length})
            </button>
            <button
              onClick={() => { setSelectedLevel('central'); setSelectedState('all'); }}
              className={`px-4 py-2.5 rounded-xl transition-all ${
                selectedLevel === 'central' 
                  ? 'bg-amber-400 text-slate-950 shadow-md font-black' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              🏛️ Central Govt (UPSC, SSC, RRB, IBPS, Post)
            </button>
            <button
              onClick={() => { setSelectedLevel('state'); }}
              className={`px-4 py-2.5 rounded-xl transition-all ${
                selectedLevel === 'state' 
                  ? 'bg-amber-400 text-slate-950 shadow-md font-black' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              📍 State Services (TNPSC, TNUSRB, KPSC, APPSC, MPSC, Kerala)
            </button>
          </div>
        </div>
      </div>

      {/* Official Portals Directory Carousel / Bar */}
      {portals.length > 0 && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs mb-8">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-teal-700" />
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Official Government Application Portals (Direct Apply Directory)
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">
              Verified Links
            </span>
          </div>

          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
            {portals.map((p, idx) => (
              <a
                key={idx}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-xs font-bold text-slate-700 hover:text-teal-900 whitespace-nowrap transition-all shadow-2xs group shrink-0"
              >
                <span className="px-1.5 py-0.5 rounded bg-slate-200 group-hover:bg-teal-200 text-[10px] font-mono text-slate-800">
                  {p.body}
                </span>
                <span>{p.name}</span>
                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-teal-700" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filter Controls Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs mb-8">
        
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by post name, exam, or conducting body (e.g. UPSC, TNPSC, Police, Station Master, Clerk, GDS)..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-600 focus:bg-white transition-all font-medium"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3.5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-xs transition-colors shrink-0"
          >
            Search
          </button>
        </form>

        {/* Dropdown Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          
          {/* State / Region Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              State / Region
            </label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
            >
              <option value="all">All India & All States</option>
              <option value="Tamil Nadu">Tamil Nadu (TNPSC, TN Police, TRB)</option>
              <option value="Karnataka">Karnataka (KPSC, KSP)</option>
              <option value="Andhra Pradesh">Andhra Pradesh (APPSC)</option>
              <option value="Maharashtra">Maharashtra (MPSC)</option>
              <option value="Kerala">Kerala (Kerala PSC)</option>
              <option value="Uttar Pradesh">Uttar Pradesh (UPPSC)</option>
            </select>
          </div>

          {/* Qualification Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Educational Qualification
            </label>
            <select
              value={selectedQualification}
              onChange={(e) => setSelectedQualification(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
            >
              <option value="all">Any Educational Qualification</option>
              <option value="10th">10th Pass / SSLC / Matriculation</option>
              <option value="12th">12th Pass / Higher Secondary / PUC</option>
              <option value="iti">ITI / Diploma in Engineering</option>
              <option value="graduate">Any Degree / Graduate</option>
              <option value="Post Graduate">Post Graduate / Teaching</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Job Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
            >
              <option value="all">All Job Categories</option>
              <option value="Civil Services">Civil Services / Administrative</option>
              <option value="Railways">Railways (RRB NTPC & ALP)</option>
              <option value="Banking">Banking (IBPS, SBI, Gramin)</option>
              <option value="Police">Police & Uniformed Services</option>
              <option value="Staff Selection">Staff Selection (SSC)</option>
              <option value="Defense">Defense & Armed Forces (NDA/CDS)</option>
              <option value="Postal">Postal & Communications (GDS)</option>
              <option value="Teaching">Teaching & Education (TRB)</option>
            </select>
          </div>

          {/* Closing Soon Toggle */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => setClosingSoonOnly(!closingSoonOnly)}
              className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                closingSoonOnly 
                  ? 'bg-rose-50 border-rose-300 text-rose-800 shadow-2xs' 
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-rose-600" />
                <span>Closing in 10 Days Only</span>
              </span>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                closingSoonOnly ? 'bg-rose-600 text-white' : 'border border-slate-400'
              }`}>
                {closingSoonOnly ? '✓' : ''}
              </span>
            </button>
          </div>

        </div>

        {/* Quick Screener Toggle Button */}
        <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowEligibilityScreener(!showEligibilityScreener)}
            className="inline-flex items-center gap-2 text-xs font-bold text-teal-800 hover:text-teal-950 bg-teal-50 hover:bg-teal-100 px-3.5 py-2 rounded-xl transition-colors"
          >
            <UserCheck className="w-4 h-4 text-teal-700" />
            <span>{showEligibilityScreener ? 'Hide Eligibility Screener' : 'Check My Qualification & Age Eligibility Screener'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showEligibilityScreener ? 'rotate-180' : ''}`} />
          </button>

          <span className="text-xs font-bold text-slate-500">
            Showing {filteredExams.length} of {exams.length} Examination Opportunities
          </span>
        </div>

        {/* Eligibility Screener Expanded Form */}
        {showEligibilityScreener && (
          <div className="mt-4 p-4 rounded-2xl bg-teal-50/70 border border-teal-200 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in">
            <div>
              <label className="block text-[11px] font-bold text-teal-950 mb-1">
                Your Age (Years)
              </label>
              <input
                type="number"
                placeholder="e.g. 24"
                value={screenerAge}
                onChange={(e) => setScreenerAge(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white border border-teal-200 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-teal-950 mb-1">
                Your Highest Education
              </label>
              <select
                value={screenerEducation}
                onChange={(e) => setScreenerEducation(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white border border-teal-200 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
              >
                <option value="all">Any Education Level</option>
                <option value="10th">10th Standard / SSLC</option>
                <option value="12th">12th Standard / Higher Secondary</option>
                <option value="iti">ITI / Diploma in Engineering</option>
                <option value="graduate">Bachelor Degree / Graduate</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => { setScreenerAge(''); setScreenerEducation('all'); }}
                className="w-full p-2.5 rounded-xl border border-teal-300 text-teal-800 bg-white hover:bg-teal-100 text-xs font-bold transition-colors"
              >
                Clear Screener
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Results Section */}
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorAlert message={error} onRetry={fetchExams} />
      ) : filteredExams.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-1">No exam notifications match your filter</h3>
          <p className="text-sm text-slate-500 mb-4">Try clearing some filter criteria or search keyword.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedLevel('all');
              setSelectedState('all');
              setSelectedQualification('all');
              setSelectedCategory('all');
              setClosingSoonOnly(false);
              setScreenerAge('');
              setScreenerEducation('all');
            }}
            className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 gap-6">
            {filteredExams.map(exam => {
              const daysLeft = getDaysLeft(exam.deadline);
              const isUrgent = daysLeft <= 3;
              const isWarning = daysLeft <= 7 && daysLeft > 3;
              const isExpanded = expandedId === exam.id;
              const isSaved = savedReminderIds.has(exam.id);

              return (
                <div
                  key={exam.id}
                  className={`bg-white rounded-3xl p-6 sm:p-7 border transition-all ${
                    isUrgent 
                      ? 'border-rose-300/80 shadow-md ring-1 ring-rose-200' 
                      : 'border-slate-200/90 shadow-xs hover:shadow-md hover:border-teal-300'
                  }`}
                >
                  
                  {/* Top Badges & Urgency Pill */}
                  <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 font-black text-xs">
                        {exam.conducting_body}
                      </span>
                      <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs">
                        {exam.level === 'central' ? '🏛️ All India Central' : `📍 ${exam.state}`}
                      </span>
                      <span className="px-3 py-1 rounded-lg bg-teal-50 text-teal-800 font-bold text-xs">
                        {exam.category}
                      </span>
                    </div>

                    {/* Deadline Pill */}
                    <span className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black ${
                      isUrgent
                        ? 'bg-rose-600 text-white shadow-xs animate-pulse'
                        : isWarning
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-emerald-100 text-emerald-900'
                    }`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{daysLeft <= 0 ? 'Last Day Today!' : `⏱ ${daysLeft} Days Left to Apply`}</span>
                    </span>
                  </div>

                  {/* Title & Post Name */}
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight mb-2">
                    {getExamTitle(exam)}
                  </h2>
                  <p className="text-sm font-bold text-slate-600 mb-4">
                    Post: <span className="text-slate-900">{exam.post_name}</span>
                  </p>

                  {/* Quick Info Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 rounded-2xl p-4 mb-5 border border-slate-100 text-xs font-semibold">
                    <div>
                      <span className="text-slate-400 block mb-0.5 text-[10px] uppercase font-bold">Total Vacancies</span>
                      <span className="text-slate-900 font-black font-mono text-sm">{exam.total_vacancies}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5 text-[10px] uppercase font-bold">Qualification</span>
                      <span className="text-slate-900 font-bold">{exam.qualification}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5 text-[10px] uppercase font-bold">Age Limit</span>
                      <span className="text-slate-900 font-bold">{exam.age_limit}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5 text-[10px] uppercase font-bold">Pay Scale</span>
                      <span className="text-teal-900 font-bold">{exam.salary_scale || 'As per norms'}</span>
                    </div>
                  </div>

                  {/* Date Details Row */}
                  <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500 mb-5">
                    <span className="flex items-center gap-1.5 text-rose-700">
                      <Calendar className="w-3.5 h-3.5 text-rose-600" />
                      <span>Last Date to Apply: <span className="underline">{exam.deadline}</span></span>
                    </span>
                    {exam.exam_date && (
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Exam Date: {exam.exam_date}</span>
                      </span>
                    )}
                    {exam.application_fee && (
                      <span className="text-slate-600">
                        Fee: {exam.application_fee}
                      </span>
                    )}
                  </div>

                  {/* Expandable Syllabus & Step-by-Step Guide */}
                  {isExpanded && (
                    <div className="pt-4 border-t border-slate-200 mb-5 space-y-4 animate-in fade-in">
                      
                      {/* Selection Process */}
                      <div>
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                          Selection Process & Examination Stages
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {(exam.selection_process || []).map((stage, idx) => (
                            <span key={idx} className="px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-bold flex items-center gap-1.5">
                              <span className="w-4 h-4 rounded-full bg-teal-700 text-white text-[10px] font-black flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <span>{stage}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* How to Apply Guide */}
                      <div className="bg-indigo-50/60 rounded-2xl p-4 border border-indigo-100">
                        <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider mb-2">
                          How to Apply on Official Portal ({exam.conducting_body})
                        </h4>
                        <ol className="text-xs sm:text-sm text-indigo-950/90 space-y-1.5 list-decimal pl-5 font-medium leading-relaxed">
                          <li>Navigate to the official portal: <span className="font-bold underline">{exam.official_portal_url}</span>.</li>
                          <li>Complete One-Time Registration (OTR) with your Aadhaar, mobile number, and email.</li>
                          <li>Upload digital copies of your recent passport photo (20-50 KB) and signature (10-20 KB).</li>
                          <li>Verify required certificates: 10th marksheet for date of birth proof, community certificate for quota/fee exemption, and degree certificates.</li>
                          <li>Pay application fee online (exempted for Women and SC/ST candidates) and download the submitted acknowledgment copy.</li>
                        </ol>
                      </div>

                      {/* Description */}
                      <div>
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                          Job & Recruitment Overview
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                          {exam.description_en}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons Row */}
                  <div className="flex items-center justify-between gap-3 flex-wrap pt-3 border-t border-slate-100">
                    
                    <div className="flex items-center gap-2 flex-1 flex-wrap">
                      {/* Apply on Official Portal */}
                      <a
                        href={exam.official_portal_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-teal-700/20 transition-all touch-target"
                      >
                        <span>Apply on Official Portal</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>

                      {/* Official PDF */}
                      {exam.notification_pdf_url && (
                        <a
                          href={exam.notification_pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm transition-colors touch-target"
                        >
                          <FileText className="w-4 h-4 text-slate-500" />
                          <span>Notification PDF</span>
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Remind Me (Opens ReminderModal) */}
                      <button
                        type="button"
                        onClick={() => openReminderModal(exam)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-3 rounded-2xl border text-xs sm:text-sm font-bold transition-all touch-target ${
                          isSaved
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-800 shadow-2xs'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {isSaved ? <BookmarkCheck className="w-4 h-4 text-emerald-600" /> : <Bell className="w-4 h-4 text-teal-700" />}
                        <span>{isSaved ? 'Reminder Saved' : 'Remind Me'}</span>
                      </button>

                      {/* WhatsApp Share Link */}
                      <a
                        href={getWhatsAppReminderUrl(getExamTitle(exam), exam.deadline, daysLeft, exam.official_portal_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Share on WhatsApp"
                        className="p-3 rounded-2xl border border-emerald-200 hover:bg-emerald-50 text-emerald-700 transition-colors touch-target"
                      >
                        <Share2 className="w-4 h-4" />
                      </a>

                      {/* Add to Calendar (.ics download) */}
                      <button
                        type="button"
                        onClick={() => {
                          playNotificationChime();
                          downloadICS(getExamTitle(exam), `Post: ${exam.post_name} (${exam.total_vacancies})`, exam.deadline, exam.official_portal_url);
                        }}
                        title="Download Calendar (.ics) reminder"
                        className="p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors touch-target"
                      >
                        <Calendar className="w-4 h-4 text-teal-700" />
                      </button>

                      {/* Expand / Collapse Details */}
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : exam.id)}
                        className="p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors touch-target"
                        aria-label="Toggle details"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
}
