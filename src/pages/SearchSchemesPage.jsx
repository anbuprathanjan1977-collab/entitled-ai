import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Search, Filter, Landmark, Building2, IndianRupee, 
  Clock, ArrowRight, Sparkles, RefreshCw, Layers, CheckCircle2 
} from 'lucide-react';
import { getSchemes, getStates } from '../api/schemes';
import VerifiedBadge from '../components/VerifiedBadge';
import { LoadingSkeleton, ErrorAlert } from '../components/LoadingSkeleton';

export default function SearchSchemesPage() {
  const { t, i18n } = useTranslation();

  const [schemes, setSchemes] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');

  const categories = [
    'All',
    'Scholarship',
    'Higher Education',
    'Women',
    'Agriculture',
    'Healthcare',
    'Social Welfare',
    'Skill / Youth Welfare'
  ];

  // Fetch states
  useEffect(() => {
    getStates()
      .then(data => setStates(data))
      .catch(err => console.warn('States fetch error:', err));
  }, []);

  const fetchSchemes = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (selectedState !== 'All') params.state = selectedState;
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (selectedLevel !== 'All') params.level = selectedLevel.toLowerCase();

      const data = await getSchemes(params);
      setSchemes(data);
    } catch (err) {
      setError(err.message || 'Failed to search schemes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSchemes();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedState, selectedCategory, selectedLevel]);

  const getSchemeName = (s) => {
    if (i18n.language === 'ta' && s.name_ta) return s.name_ta;
    if (i18n.language === 'hi' && s.name_hi) return s.name_hi;
    return s.name_en || s.name_ta;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-100 text-teal-800 text-xs font-bold mb-4 shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>All-India & State Scheme Explorer</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-4">
          Discover & Search Government Schemes
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Explore scholarships, health grants, farmer support, and financial aids across Central Government and Indian States.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-md mb-8 space-y-4">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by scheme name, keyword, or benefit (e.g. scholarship, PM-KISAN, fee waiver, women)..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-slate-200 text-sm sm:text-base font-semibold focus:border-teal-600 focus:outline-none transition-colors"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          
          {/* State Filter */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
              Region / State
            </label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold bg-slate-50 focus:outline-teal-600 touch-target"
            >
              <option value="All">All India & All States</option>
              <option value="All India">Central Govt (All India)</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Andhra Pradesh">Andhra Pradesh</option>
              <option value="Maharashtra">Maharashtra</option>
              {states
                .filter(s => !['Tamil Nadu', 'Karnataka', 'Andhra Pradesh', 'Maharashtra'].includes(s.name_en))
                .map(s => (
                  <option key={s.code} value={s.name_en}>{s.name_en}</option>
                ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
              Scheme Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold bg-slate-50 focus:outline-teal-600 touch-target"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Level Filter */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
              Govt Level
            </label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold bg-slate-50 focus:outline-teal-600 touch-target"
            >
              <option value="All">All Levels</option>
              <option value="central">Central Government</option>
              <option value="state">State Government</option>
            </select>
          </div>

        </div>

      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
          <span>Found {schemes.length} Available Schemes</span>
        </h2>
        <button
          type="button"
          onClick={fetchSchemes}
          className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Loading Skeleton */}
      {loading && <LoadingSkeleton count={3} />}

      {/* Error Alert */}
      {error && <ErrorAlert message={error} onRetry={fetchSchemes} />}

      {/* Schemes Grid */}
      {!loading && !error && (
        <>
          {schemes.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/90 shadow-sm max-w-md mx-auto">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 mb-1">No Matching Schemes</h3>
              <p className="text-xs sm:text-sm text-slate-500 mb-4">
                Try adjusting your search keywords or resetting filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedState('All');
                  setSelectedCategory('All');
                  setSelectedLevel('All');
                }}
                className="px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {schemes.map((s) => {
                const isCentral = (s.level || '').toLowerCase() === 'central';
                return (
                  <div
                    key={s.id}
                    className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs hover:border-teal-300 hover:shadow-lg transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Tags row */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase ${
                          isCentral ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-teal-50 text-teal-800 border border-teal-200'
                        }`}>
                          {isCentral ? <Landmark className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                          <span>{s.level}</span>
                        </span>

                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                          {s.state}
                        </span>
                      </div>

                      {/* Scheme Name */}
                      <h3 className="text-base sm:text-lg font-black text-slate-900 mb-2 leading-snug">
                        {getSchemeName(s)}
                      </h3>

                      {/* Benefit Badge */}
                      <div className="bg-teal-50/70 p-3 rounded-2xl border border-teal-100/90 mb-4 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-teal-600/10 text-teal-700 flex items-center justify-center shrink-0">
                          <IndianRupee className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[11px] text-teal-800 font-medium block">Benefit:</span>
                          <span className="text-xs sm:text-sm font-extrabold text-teal-950">
                            {s.benefit_text}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                        {i18n.language === 'ta' && s.description_ta ? s.description_ta : s.description_en}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <VerifiedBadge status="verified" date={s.last_verified} />
                      <Link
                        to={`/scheme/${s.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900 group"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
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
