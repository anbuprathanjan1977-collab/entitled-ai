import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, UserPlus, Trash2, Sparkles, IndianRupee, 
  ArrowRight, CheckCircle2, AlertCircle, ChevronDown, ChevronUp 
} from 'lucide-react';
import { matchFamily } from '../api/match';
import SchemeCard from '../components/SchemeCard';
import { LoadingSkeleton, ErrorAlert } from '../components/LoadingSkeleton';

export default function FamilyModePage() {
  const { t, i18n } = useTranslation();

  const [familyIncome, setFamilyIncome] = useState(200000);
  const [members, setMembers] = useState([
    {
      id: 'm1',
      name: 'Priya',
      relationship: 'Daughter',
      age: 19,
      gender: 'female',
      education: 'Under Graduate',
      community: 'MBC',
      first_graduate: true
    },
    {
      id: 'm2',
      name: 'Lakshmi',
      relationship: 'Mother',
      age: 44,
      gender: 'female',
      education: '10th pass',
      community: 'MBC',
      first_graduate: false
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [familyResults, setFamilyResults] = useState(null);

  const addMember = () => {
    const newId = 'm_' + Date.now();
    setMembers([
      ...members,
      {
        id: newId,
        name: `Member ${members.length + 1}`,
        relationship: 'Child',
        age: 16,
        gender: 'male',
        education: '12th pass',
        community: 'MBC',
        first_graduate: false
      }
    ]);
  };

  const removeMember = (id) => {
    setMembers(members.filter(m => m.id !== id));
  };

  const updateMember = (id, field, value) => {
    setMembers(members.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleCalculateFamily = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        family_income: Number(familyIncome),
        state: 'Tamil Nadu',
        members: members.map(m => ({
          name: m.name,
          relationship: m.relationship,
          age: Number(m.age),
          gender: m.gender,
          community: m.community,
          education: m.education,
          first_graduate: m.first_graduate
        }))
      };

      const res = await matchFamily(payload);
      setFamilyResults(res);
    } catch (err) {
      setError(err.message || 'Failed to match family schemes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Users className="w-8 h-8 text-teal-700" />
          <span>{t('family.title')}</span>
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          {t('family.subtitle')}
        </p>
      </div>

      {/* Shared Household Income Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm mb-8">
        <label className="block text-sm font-bold text-slate-800 mb-2">
          {t('family.incomeLabel')}
        </label>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="range"
              min="30000"
              max="800000"
              step="10000"
              value={familyIncome}
              onChange={(e) => setFamilyIncome(Number(e.target.value))}
              className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
            />
          </div>
          <span className="text-xl sm:text-2xl font-black text-teal-900 font-mono shrink-0">
            ₹{Number(familyIncome).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Family Members Builder */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            Family Members ({members.length})
          </h2>
          <button
            type="button"
            onClick={addMember}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs border border-teal-200 transition-colors touch-target"
          >
            <UserPlus className="w-4 h-4 text-teal-700" />
            <span>{t('family.addMember')}</span>
          </button>
        </div>

        <div className="space-y-4">
          {members.map((m, idx) => (
            <div 
              key={m.id} 
              className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-black uppercase text-teal-700">
                  Member #{idx + 1}
                </span>
                {members.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMember(m.id)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                    title="Remove member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">
                    {t('family.name')}
                  </label>
                  <input
                    type="text"
                    value={m.name}
                    onChange={(e) => updateMember(m.id, 'name', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-teal-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">
                    {t('family.relationship')}
                  </label>
                  <input
                    type="text"
                    value={m.relationship}
                    onChange={(e) => updateMember(m.id, 'relationship', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-teal-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">
                    {t('family.age')}
                  </label>
                  <input
                    type="number"
                    value={m.age}
                    onChange={(e) => updateMember(m.id, 'age', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-teal-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">
                    {t('family.gender')}
                  </label>
                  <select
                    value={m.gender}
                    onChange={(e) => updateMember(m.id, 'gender', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-teal-600"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="transgender">Transgender</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">
                    {t('family.education')}
                  </label>
                  <select
                    value={m.education}
                    onChange={(e) => updateMember(m.id, 'education', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-teal-600"
                  >
                    <option value="School">School</option>
                    <option value="10th pass">10th Pass</option>
                    <option value="12th pass">12th Pass</option>
                    <option value="Diploma">Diploma</option>
                    <option value="ITI">ITI</option>
                    <option value="Under Graduate">Under Graduate</option>
                    <option value="Post Graduate">Post Graduate</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={m.first_graduate}
                      onChange={(e) => updateMember(m.id, 'first_graduate', e.target.checked)}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>{t('family.firstGrad')}</span>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Calculate Button */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handleCalculateFamily}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-base shadow-lg shadow-teal-700/25 transition-all touch-target"
          >
            <span>{t('family.calculateBtn')}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading && <LoadingSkeleton count={2} />}

      {error && <ErrorAlert message={error} onRetry={handleCalculateFamily} />}

      {/* Family Results Display */}
      {familyResults && (
        <div className="space-y-8 animate-in fade-in">
          
          {/* Summary Box */}
          <div className="bg-gradient-to-r from-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1">
                {t('family.summaryTitle')}
              </span>
              <h3 className="text-base sm:text-lg font-semibold text-teal-100">
                {t('family.totalBenefit')}
              </h3>
              <div className="text-3xl sm:text-5xl font-black text-amber-400 font-mono mt-2">
                ₹{familyResults.family_summary.total_estimated_annual_benefit.toLocaleString('en-IN')}
                <span className="text-sm text-teal-200 ml-2">/ year</span>
              </div>
            </div>

            <div className="bg-teal-950/80 p-4 rounded-2xl border border-teal-800 text-center w-full sm:w-auto">
              <span className="text-3xl font-extrabold text-white">
                {familyResults.family_summary.total_schemes}
              </span>
              <span className="text-xs text-teal-300 block font-medium">
                Unique Eligible Schemes
              </span>
            </div>
          </div>

          {/* Per-Member Results Breakdown */}
          <div className="space-y-6">
            <h3 className="text-xl font-black text-slate-900">
              {t('family.perMemberResults')}
            </h3>

            {familyResults.members.map((mr, idx) => (
              <div 
                key={idx} 
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-lg font-black text-slate-900">
                      {mr.member.name} ({mr.member.relationship}, {mr.member.age} yrs)
                    </h4>
                    <span className="text-xs text-slate-500 font-medium">
                      {mr.member.education} • {mr.member.gender}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Member Benefit</span>
                    <span className="text-base sm:text-lg font-black text-teal-800 font-mono">
                      ₹{mr.total_benefit.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {mr.eligible.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">
                    No individual schemes matched for this member's demographic.
                  </p>
                ) : (
                  <div className="space-y-3 pt-2">
                    {mr.eligible.map(item => (
                      <SchemeCard key={item.scheme.id} item={item} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
}
