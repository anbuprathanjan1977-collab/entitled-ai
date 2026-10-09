import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Heart, Sparkles, AlertCircle } from 'lucide-react';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-slate-900 text-slate-300 mt-20 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          
          {/* Brand & Mission */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-black text-lg font-sans">
                E
              </div>
              <span className="text-xl font-bold text-white font-sans">
                {t('brand.name') || 'Entitle AI'}
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              A transparent, privacy-first civic tech initiative ensuring every eligible citizen in Tamil Nadu and India receives their rightful government benefits, scholarships, and career opportunities without middleman hurdles.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-950/80 border border-teal-800/80 text-teal-300 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>Zero-server-storage privacy guarantee</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:ml-auto">
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">
              Quick Navigation
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-teal-400 transition-colors">
                  {t('nav.home')}
                </Link>
              </li>
              <li>
                <Link to="/questionnaire" className="hover:text-teal-400 transition-colors">
                  {t('nav.finder')}
                </Link>
              </li>
              <li>
                <Link to="/schemes" className="hover:text-teal-400 transition-colors">
                  {t('nav.search') || 'Browse Schemes'}
                </Link>
              </li>
              <li>
                <Link to="/jobs" className="hover:text-teal-400 transition-colors">
                  {t('nav.jobs') || 'Govt Jobs & Exams'}
                </Link>
              </li>
              <li>
                <Link to="/deadlines" className="hover:text-teal-400 transition-colors">
                  {t('nav.deadlines') || 'Deadlines & Alerts'}
                </Link>
              </li>
              <li>
                <Link to="/assistant" className="hover:text-teal-400 transition-colors">
                  {t('nav.assistant') || 'AI Assistant'}
                </Link>
              </li>
              <li>
                <Link to="/family" className="hover:text-teal-400 transition-colors">
                  {t('nav.family')}
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-teal-400 transition-colors">
                  {t('nav.admin')} Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Official Disclaimer */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Important Notice</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed bg-slate-800/60 p-4 rounded-xl border border-slate-700">
              Entitle AI is an automated eligibility advisor. Seeded scheme details are placeholders for demonstration and development purposes. Citizens must always cross-verify criteria, deadlines, and requirements on official portals (<span className="text-teal-400">tnega.tn.gov.in</span>, <span className="text-teal-400">scholarships.gov.in</span>) before submitting official applications.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 Entitle AI. Built for All Indian Citizens.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for equitable digital public infrastructure.
          </p>
        </div>
      </div>
    </footer>
  );
}
