import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Sparkles, ArrowRight, ShieldCheck, Cpu, 
  Mic, Users, ClipboardCheck, CheckCircle2, ChevronRight,
  Bell, Briefcase, Clock 
} from 'lucide-react';

export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24">
        {/* Soft decorative background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-200/40 rounded-full blur-3xl pointer-events-none -z-10"></div>
        <div className="absolute top-1/3 right-10 w-72 h-72 bg-amber-200/30 rounded-full blur-3xl pointer-events-none -z-10"></div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          
          {/* Urgent Deadline Notification Ribbon */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            <Link
              to="/deadlines"
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-bold shadow-xs hover:bg-rose-100 transition-colors group animate-pulse"
            >
              <Bell className="w-3.5 h-3.5 text-rose-600 animate-bounce" />
              <span>🔔 Finishing Soon: Several schemes & Govt exams closing this week! Check Deadlines</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Privacy Trust Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-100/80 border border-teal-200 text-teal-900 text-xs sm:text-sm font-semibold mb-6 shadow-xs animate-in fade-in">
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            <span>{t('brand.secureBadge')}</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15] mb-6">
            {t('landing.headline')}
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-10">
            {t('landing.subheadline')}
          </p>

          {/* Primary Action Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-10">
            <Link
              to="/questionnaire"
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-700 to-teal-600 hover:from-teal-800 hover:to-teal-700 text-white font-extrabold text-base sm:text-lg shadow-lg shadow-teal-700/25 hover:shadow-teal-700/40 transition-all transform hover:-translate-y-0.5 touch-target focus-visible:ring-4 focus-visible:ring-teal-600/30"
            >
              <span>{t('landing.startBtn')}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Quick Action Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-bold">
            <Link
              to="/schemes"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-teal-200 text-teal-800 hover:border-teal-400 hover:bg-teal-50/50 shadow-xs transition-colors touch-target"
            >
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>Explore All Schemes</span>
            </Link>

            <Link
              to="/esevai"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-amber-200 text-amber-900 hover:border-amber-400 hover:bg-amber-50/50 shadow-xs transition-colors touch-target"
            >
              <ClipboardCheck className="w-4 h-4 text-amber-600" />
              <span>e-Sevai & Documents</span>
            </Link>

            <Link
              to="/assistant"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-indigo-200 text-indigo-900 hover:border-indigo-400 hover:bg-indigo-50/50 shadow-xs transition-colors touch-target"
            >
              <Mic className="w-4 h-4 text-indigo-600" />
              <span>AI Assistant</span>
            </Link>

            <Link
              to="/jobs"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-indigo-200 text-indigo-900 hover:border-indigo-400 hover:bg-indigo-50/50 shadow-xs transition-colors touch-target"
            >
              <Briefcase className="w-4 h-4 text-indigo-600" />
              <span>Govt Jobs & Exams</span>
            </Link>

            <Link
              to="/deadlines"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-rose-200 text-rose-900 hover:border-rose-400 hover:bg-rose-50/50 shadow-xs transition-colors touch-target"
            >
              <Clock className="w-4 h-4 text-rose-600" />
              <span>Finishing Soon Deadlines</span>
            </Link>

            <Link
              to="/family"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-teal-300 hover:bg-teal-50/50 shadow-xs transition-colors touch-target"
            >
              <Users className="w-4 h-4 text-teal-600" />
              <span>{t('landing.familyModeBtn')}</span>
            </Link>
          </div>

        </div>
      </section>

      {/* Trust & Feature Pillars */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Pillar 1 */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs hover:border-teal-300 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center mb-5 font-black">
              <ShieldCheck className="w-6 h-6 text-teal-700" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {t('landing.feature1Title')}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t('landing.feature1Desc')}
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs hover:border-teal-300 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-5 font-black">
              <Cpu className="w-6 h-6 text-amber-700" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {t('landing.feature2Title')}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t('landing.feature2Desc')}
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs hover:border-teal-300 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center mb-5 font-black">
              <Mic className="w-6 h-6 text-indigo-700" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {t('landing.feature3Title')}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t('landing.feature3Desc')}
            </p>
          </div>

        </div>
      </section>

      {/* Central & State Exam Portal + Deadline Alert Center Spotlight Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Govt Jobs & Exam Portal */}
          <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-800/60 flex flex-col justify-between">
            <div className="relative">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-300 text-xs font-bold mb-4">
                <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                <span>Central & State Recruitment</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black mb-3 leading-snug">
                Government Jobs & Exam Portal
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                Direct application links, age limits, syllabus, and vacancies for <b>UPSC, SSC, RRB Railways, IBPS Banks, TNPSC, Police, and KPSC</b>. Check your eligibility in seconds.
              </p>
            </div>
            <div>
              <Link
                to="/jobs"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-md transition-colors"
              >
                <span>Open Jobs & Exam Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 2: Deadline & Remainder Notification Alert Center */}
          <div className="bg-gradient-to-br from-rose-950 via-slate-900 to-rose-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-rose-800/60 flex flex-col justify-between">
            <div className="relative">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/30 text-rose-300 text-xs font-bold mb-4">
                <Bell className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
                <span>Expiring Soon Alerts</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black mb-3 leading-snug">
                Finishing Soon & Deadline Reminders
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                Never miss closing dates. Set <b>browser push alerts, WhatsApp reminders, and Google/Apple calendar notifications</b> for schemes and competitive exams closing this month.
              </p>
            </div>
            <div>
              <Link
                to="/deadlines"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs sm:text-sm shadow-md transition-colors"
              >
                <span>Track Expiring Deadlines</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* Example Highlight Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12">

        <div className="bg-gradient-to-br from-teal-900 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="max-w-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-2">
              Tamil Nadu Citizen Spotlight
            </span>
            <h2 className="text-2xl sm:text-3xl font-black mb-4">
              Covering Higher Education, Scholarships & Direct Benefit Transfers
            </h2>
            <p className="text-sm text-teal-100/90 leading-relaxed mb-6">
              From the Pudhumai Penn monthly ₹1,000 allowance to the 100% Tuition Fee Concessions for First Graduates and SC/ST Post-Matric aid, discover every scheme applicable to your household in one tap.
            </p>
            <Link
              to="/questionnaire"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-teal-950 font-black text-sm shadow-md transition-colors touch-target"
            >
              <span>{t('landing.startBtn')}</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
