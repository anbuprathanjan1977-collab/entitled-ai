import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from './components/Header';
import Footer from './components/Footer';

// Pages
import LandingPage from './pages/LandingPage';
import QuestionnairePage from './pages/QuestionnairePage';
import ResultsPage from './pages/ResultsPage';
import SchemeDetailPage from './pages/SchemeDetailPage';
import MyApplicationsPage from './pages/MyApplicationsPage';
import FamilyModePage from './pages/FamilyModePage';
import SearchSchemesPage from './pages/SearchSchemesPage';
import ESevaiGuidePage from './pages/ESevaiGuidePage';
import AIAssistantPage from './pages/AIAssistantPage';
import GovtJobsPage from './pages/GovtJobsPage';
import DeadlinesPage from './pages/DeadlinesPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminPolicyChangesPage from './pages/AdminPolicyChangesPage';
import AIAssistantWidget from './components/AIAssistantWidget';
import UrgentDeadlineBanner from './components/UrgentDeadlineBanner';

export default function App() {
  const { t, i18n } = useTranslation();

  // Dynamically update document title based on the active language and localized brand name
  useEffect(() => {
    const brandName = t('brand.name') || 'Entitle AI';
    const tagline = t('brand.tagline') || 'Smart Government Schemes & Career Portal';
    document.title = `${brandName} - ${tagline}`;
  }, [i18n.language, t]);

  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
        <Header />
        <UrgentDeadlineBanner />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/questionnaire" element={<QuestionnairePage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/schemes" element={<SearchSchemesPage />} />
            <Route path="/jobs" element={<GovtJobsPage />} />
            <Route path="/deadlines" element={<DeadlinesPage />} />
            <Route path="/esevai" element={<ESevaiGuidePage />} />
            <Route path="/assistant" element={<AIAssistantPage />} />
            <Route path="/scheme/:id" element={<SchemeDetailPage />} />
            <Route path="/family" element={<FamilyModePage />} />
            <Route path="/applications" element={<MyApplicationsPage />} />
            <Route path="/admin" element={<AdminLoginPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/changes" element={<AdminPolicyChangesPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
        <AIAssistantWidget />
      </div>
    </BrowserRouter>
  );
}
