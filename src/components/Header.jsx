import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ShieldCheck, Globe, Menu, X, Users, ClipboardList, 
  Sparkles, LockKeyhole, ArrowRight, Search, BookOpen, Bot,
  Bell, Briefcase, Clock 
} from 'lucide-react';
import { supportedLanguages } from '../i18n';
import DeadlineNotificationsDropdown from './DeadlineNotificationsDropdown';
import { getUpcomingDeadlines } from '../api/exams';

export default function Header() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [deadlinesCount, setDeadlinesCount] = useState(0);

  React.useEffect(() => {
    let mounted = true;
    getUpcomingDeadlines(14)
      .then(items => {
        if (mounted && Array.isArray(items)) {
          setDeadlinesCount(items.length);
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    setLangMenuOpen(false);
  };

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/schemes', label: t('nav.search') || 'Browse Schemes', icon: Search },
    { to: '/jobs', label: t('nav.jobs') || 'Govt Jobs & Exams', icon: Briefcase },
    { to: '/deadlines', label: t('nav.deadlines') || 'Deadlines', icon: Clock },
    { to: '/esevai', label: t('nav.esevai') || 'e-Sevai Guide', icon: BookOpen },
    { to: '/assistant', label: t('nav.assistant') || 'AI Assistant', icon: Bot },
    { to: '/family', label: t('nav.family') },
    { to: '/applications', label: t('nav.myApplications') },
  ];

  const currentLangObj = supportedLanguages.find(l => l.code === i18n.language) || supportedLanguages[0];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-teal-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand with localized brand name */}
          <Link to="/" className="flex items-center gap-3 group focus-visible:ring-2 focus-visible:ring-teal-600 rounded-lg p-1 shrink-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-teal-700 via-teal-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-teal-700/20 group-hover:scale-105 transition-transform font-sans">
              <span className="font-black text-xl tracking-tighter">E</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-lg sm:text-2xl font-black tracking-tight text-teal-950 font-sans">
                  {t('brand.name') || 'Entitle AI'}
                </span>
                {i18n.language !== 'en' && (
                  <span className="hidden md:inline-block text-[10px] text-teal-800 font-bold bg-teal-100/90 px-1.5 py-0.5 rounded border border-teal-200">
                    Entitle AI
                  </span>
                )}
                <span className="hidden sm:inline-block text-[11px] bg-teal-100 text-teal-800 font-semibold px-2 py-0.5 rounded-full">
                  All India
                </span>
              </div>
              <p className="text-[11px] text-teal-700/80 font-medium truncate max-w-[160px] sm:max-w-none">
                {t('brand.tagline')}
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden xl:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = location.pathname === link.to;
              const IconComp = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-2 rounded-lg text-xs lg:text-sm font-semibold transition-colors touch-target flex items-center gap-1.5 ${
                    active 
                      ? 'bg-teal-50 text-teal-800 border border-teal-200' 
                      : 'text-slate-600 hover:text-teal-800 hover:bg-slate-50'
                  }`}
                >
                  {IconComp && <IconComp className="w-3.5 h-3.5" />}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Controls: Language Toggle, Notifications & Admin */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Language Selector Dropdown with localized previews */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold bg-teal-50 border border-teal-200 text-teal-900 hover:bg-teal-100/80 transition-all touch-target focus-visible:ring-2 focus-visible:ring-teal-600"
                aria-label={t('nav.language')}
                aria-expanded={langMenuOpen}
              >
                <Globe className="w-4 h-4 text-teal-700 shrink-0" />
                <span className="truncate max-w-[90px]">
                  {currentLangObj.label}
                </span>
              </button>

              {langMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-80 overflow-y-auto"
                  role="menu"
                >
                  <div className="px-3.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                    Select Language / மொழியைத் தேர்வு செய்க
                  </div>
                  {supportedLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`w-full text-left px-3.5 py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-between hover:bg-teal-50 transition-colors ${
                        i18n.language === lang.code ? 'text-teal-900 bg-teal-50/80 font-bold' : 'text-slate-700'
                      }`}
                      role="menuitem"
                    >
                      <div className="flex flex-col">
                        <span className={`${lang.fontClass} text-sm font-bold`}>{lang.label}</span>
                        <span className="text-[11px] text-teal-700/80 font-medium">{lang.brandName}</span>
                      </div>
                      {i18n.language === lang.code && (
                        <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0"></span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Reminder / Deadlines Notification Bell */}
            <button
              type="button"
              onClick={() => setNotificationsOpen(true)}
              className="relative p-2.5 rounded-xl text-slate-700 hover:text-teal-900 bg-teal-50/70 hover:bg-teal-100/80 border border-teal-200 transition-all touch-target focus-visible:ring-2 focus-visible:ring-teal-600"
              title="Upcoming Deadlines & Finishing Reminders"
              aria-label="Upcoming Deadlines"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-teal-800" />
              {deadlinesCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-[10px] font-black text-white flex items-center justify-center animate-pulse shadow-xs">
                  {deadlinesCount}
                </span>
              )}
            </button>

            {/* Admin shortcut */}
            <Link
              to="/admin"
              className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-teal-800 hover:bg-slate-100 transition-colors touch-target"
              title="Admin Portal"
            >
              <LockKeyhole className="w-3.5 h-3.5" />
              <span>{t('nav.admin')}</span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-lg text-slate-600 hover:text-teal-800 hover:bg-slate-100 touch-target focus-visible:ring-2 focus-visible:ring-teal-600"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-teal-100 bg-white px-4 pt-3 pb-6 space-y-2 shadow-lg max-h-[85vh] overflow-y-auto">
          <div className="bg-teal-50/80 p-3 rounded-xl mb-3 flex items-center gap-2 text-xs text-teal-900 font-medium border border-teal-100">
            <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
            <span>{t('brand.secureBadge')}</span>
          </div>

          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold touch-target ${
                location.pathname === link.to
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{link.label}</span>
              <ArrowRight className="w-4 h-4 opacity-70" />
            </Link>
          ))}

          <div className="pt-2 border-t border-slate-100">
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 touch-target"
            >
              <LockKeyhole className="w-4 h-4 text-slate-500" />
              <span>{t('nav.admin')} Portal</span>
            </Link>
          </div>
        </div>
      )}

      {/* Deadline & Reminder Notifications Drawer */}
      <DeadlineNotificationsDropdown 
        isOpen={notificationsOpen} 
        onClose={() => setNotificationsOpen(false)} 
      />
    </header>
  );
}
