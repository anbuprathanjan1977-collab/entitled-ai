import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sliders, Sparkles, RefreshCw, ArrowUpRight, TrendingUp } from 'lucide-react';
import { whatIfSimulation } from '../api/match';

export default function WhatIfPanel({ originalProfile, onSimulationChange }) {
  const { t } = useTranslation();
  const [simIncome, setSimIncome] = useState(originalProfile?.family_income || 200000);
  const [simEducation, setSimEducation] = useState(originalProfile?.education || 'Under Graduate');
  const [loading, setLoading] = useState(false);
  const [simSummary, setSimSummary] = useState(null);

  useEffect(() => {
    if (originalProfile) {
      setSimIncome(originalProfile.family_income || 200000);
      setSimEducation(originalProfile.education || 'Under Graduate');
    }
  }, [originalProfile]);

  const runSimulation = async (incomeVal, eduVal) => {
    if (!originalProfile) return;
    setLoading(true);
    try {
      const changes = {
        family_income: Number(incomeVal),
        education: eduVal
      };
      const res = await whatIfSimulation(originalProfile, changes);
      setSimSummary(res);
      if (onSimulationChange) {
        onSimulationChange(res);
      }
    } catch (err) {
      console.warn('What-If simulation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleIncomeChange = (e) => {
    const val = Number(e.target.value);
    setSimIncome(val);
    runSimulation(val, simEducation);
  };

  const handleEducationChange = (e) => {
    const val = e.target.value;
    setSimEducation(val);
    runSimulation(simIncome, val);
  };

  const resetSimulation = () => {
    const baseIncome = originalProfile?.family_income || 200000;
    const baseEdu = originalProfile?.education || 'Under Graduate';
    setSimIncome(baseIncome);
    setSimEducation(baseEdu);
    runSimulation(baseIncome, baseEdu);
  };

  return (
    <div className="bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 rounded-3xl p-5 sm:p-7 text-white shadow-xl border border-teal-700/50 my-8">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-teal-950 flex items-center justify-center font-bold shadow-md">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <span>{t('results.whatifTitle')}</span>
              <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
            </h3>
            <p className="text-xs sm:text-sm text-teal-200/90 font-medium">
              {t('results.whatifDesc')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={resetSimulation}
          className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-800/80 hover:bg-teal-700 text-teal-200 border border-teal-600 transition-colors touch-target font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Original</span>
        </button>
      </div>

      {/* Interactive Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-teal-950/50 p-4 sm:p-5 rounded-2xl border border-teal-800/60 mb-6">
        
        {/* Income Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs sm:text-sm font-bold text-teal-200">
              Simulated Annual Family Income
            </label>
            <span className="text-base sm:text-lg font-black text-amber-300 font-mono">
              ₹{Number(simIncome).toLocaleString('en-IN')}
            </span>
          </div>
          <input
            type="range"
            min="50000"
            max="800000"
            step="25000"
            value={simIncome}
            onChange={handleIncomeChange}
            className="w-full h-2.5 bg-teal-900 rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none"
          />
          <div className="flex justify-between text-[10px] text-teal-400/80 mt-1.5 font-mono">
            <span>₹50,000</span>
            <span>₹2,50,000 (Govt threshold)</span>
            <span>₹8,00,000</span>
          </div>
        </div>

        {/* Education Level Dropdown */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-teal-200 mb-2">
            Simulated Education Level
          </label>
          <select
            value={simEducation}
            onChange={handleEducationChange}
            className="w-full px-4 py-2.5 rounded-xl bg-teal-900 text-white font-semibold text-sm border border-teal-700 focus:ring-2 focus:ring-amber-400 focus:border-transparent touch-target"
          >
            <option value="School">School (Class 1-9)</option>
            <option value="10th pass">10th Standard Pass</option>
            <option value="12th pass">12th Standard Pass</option>
            <option value="Diploma">Diploma / Polytechnic</option>
            <option value="ITI">ITI</option>
            <option value="Under Graduate">Under Graduate (UG)</option>
            <option value="Post Graduate">Post Graduate (PG)</option>
          </select>
        </div>
      </div>

      {/* Live Simulation Outcome Banner */}
      {simSummary && (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-teal-950/70 border border-teal-700/80 text-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-teal-300 font-semibold block">Live Simulation Impact:</span>
              <span className="font-extrabold text-white text-base">
                {simSummary.newly_eligible?.length > 0 
                  ? `+${simSummary.newly_eligible.length} Newly Unlocked Schemes!`
                  : simSummary.newly_lost?.length > 0
                    ? `-${simSummary.newly_lost.length} Schemes No Longer Eligible`
                    : 'No scheme eligibility changes with these parameters'}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-teal-300 block font-medium">New Total Benefit:</span>
            <span className="text-lg font-black text-amber-300 font-mono">
              ₹{Number(simSummary.updated_total_benefit).toLocaleString('en-IN')} / yr
            </span>
          </div>
        </div>
      )}

    </div>
  );
}
