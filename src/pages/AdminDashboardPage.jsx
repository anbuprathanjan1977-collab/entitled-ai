import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Plus, Edit2, Trash2, Globe, Sparkles, RefreshCw, 
  ExternalLink, LogOut, CheckCircle2, AlertTriangle, Layers, X 
} from 'lucide-react';
import { 
  getAdminSchemes, createAdminScheme, updateAdminScheme, 
  deleteAdminScheme, triggerCheckNow, triggerSimulateChange 
} from '../api/admin';
import { LoadingSkeleton, ErrorAlert } from '../components/LoadingSkeleton';

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State for Scheme Add/Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState(null);
  const [modalForm, setModalForm] = useState({
    name_en: '',
    name_ta: '',
    level: 'state',
    state: 'Tamil Nadu',
    category: 'Education',
    benefit_amount: 15000,
    benefit_text: '₹15,000 / year',
    description_en: '',
    description_ta: '',
    deadline: '',
    official_url: 'https://tnega.tn.gov.in',
    apply_steps: ['Register online', 'Submit verification documents'],
    rules: [
      { field: 'family_income', op: '<=', value: 250000, label_en: 'Income <= 2.5L', label_ta: 'வருமானம் <= 2.5L' }
    ],
    active: true
  });

  const [crawlerStatus, setCrawlerStatus] = useState('');
  const [simulateStatus, setSimulateStatus] = useState('');

  const loadSchemes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminSchemes();
      setSchemes(data);
    } catch (err) {
      if (err.status === 401) {
        navigate('/admin');
      } else {
        setError(err.message || 'Failed to load schemes');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchemes();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('urimai_admin_token');
    localStorage.removeItem('urimai_admin_email');
    navigate('/admin');
  };

  const openAddModal = () => {
    setEditingScheme(null);
    setModalForm({
      name_en: '',
      name_ta: '',
      level: 'state',
      state: 'Tamil Nadu',
      category: 'Education',
      benefit_amount: 20000,
      benefit_text: '₹20,000 / year',
      description_en: '',
      description_ta: '',
      deadline: '',
      official_url: 'https://tnega.tn.gov.in',
      apply_steps: ['Submit online application', 'Forward to department officer'],
      rules: [
        { field: 'family_income', op: '<=', value: 250000, label_en: 'Income <= 2.5L', label_ta: 'வருமானம் <= 2.5L' }
      ],
      active: true
    });
    setModalOpen(true);
  };

  const openEditModal = (s) => {
    setEditingScheme(s);
    setModalForm({
      name_en: s.name_en,
      name_ta: s.name_ta,
      level: s.level,
      state: s.state,
      category: s.category,
      benefit_amount: s.benefit_amount,
      benefit_text: s.benefit_text,
      description_en: s.description_en,
      description_ta: s.description_ta,
      deadline: s.deadline || '',
      official_url: s.official_url,
      apply_steps: s.apply_steps || [],
      rules: s.rules || [],
      active: s.active
    });
    setModalOpen(true);
  };

  const handleDeleteScheme = async (id) => {
    if (!window.confirm(`Are you sure you want to delete scheme #${id}?`)) return;
    try {
      await deleteAdminScheme(id);
      setSchemes(schemes.filter(s => s.id !== id));
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleSaveScheme = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...modalForm,
        deadline: modalForm.deadline ? modalForm.deadline : null,
        benefit_amount: Number(modalForm.benefit_amount)
      };

      if (editingScheme) {
        const updated = await updateAdminScheme(editingScheme.id, payload);
        setSchemes(schemes.map(s => s.id === editingScheme.id ? updated : s));
      } else {
        const created = await createAdminScheme(payload);
        setSchemes([created, ...schemes]);
      }
      setModalOpen(false);
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    }
  };

  // Rule Builder Helpers
  const addRuleRow = () => {
    setModalForm({
      ...modalForm,
      rules: [
        ...modalForm.rules,
        { field: 'age', op: '<=', value: 25, label_en: 'Age <= 25', label_ta: 'வயது <= 25' }
      ]
    });
  };

  const removeRuleRow = (index) => {
    const updated = modalForm.rules.filter((_, i) => i !== index);
    setModalForm({ ...modalForm, rules: updated });
  };

  const updateRuleRow = (index, field, value) => {
    const updated = [...modalForm.rules];
    updated[index] = { ...updated[index], [field]: value };
    setModalForm({ ...modalForm, rules: updated });
  };

  // Check Now Crawler trigger
  const handleCheckNow = async () => {
    setCrawlerStatus('Running portal checks...');
    try {
      const res = await triggerCheckNow();
      setCrawlerStatus(`Done! ${res.changes_detected_count} new changes detected.`);
      setTimeout(() => setCrawlerStatus(''), 4000);
    } catch (err) {
      setCrawlerStatus(`Error: ${err.message}`);
    }
  };

  // Simulate Demo Change
  const handleSimulateChange = async () => {
    setSimulateStatus('Creating simulated policy change event...');
    try {
      const res = await triggerSimulateChange();
      setSimulateStatus(`Simulated change #${res.change_id} created! View in Policy Changes tab.`);
      setTimeout(() => setSimulateStatus(''), 5000);
    } catch (err) {
      setSimulateStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Top Navbar Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Admin Welfare Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Logged in as <span className="font-mono text-teal-800 font-bold">{localStorage.getItem('urimai_admin_email')}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/admin/changes"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-teal-950 font-extrabold text-xs sm:text-sm shadow-xs transition-colors touch-target"
          >
            <Sparkles className="w-4 h-4" />
            <span>Policy Changes & Diff Review</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors touch-target"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Action Bar (Check Now, Simulate Demo, Add Scheme) */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Check Now Button */}
          <button
            type="button"
            onClick={handleCheckNow}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors touch-target"
          >
            <Globe className="w-4 h-4 text-teal-300" />
            <span>{t('admin.checkNow')}</span>
          </button>

          {/* Simulate Live Change Button */}
          <button
            type="button"
            onClick={handleSimulateChange}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors touch-target"
            title="Demonstrate policy change detection live to Hackathon judges"
          >
            <Sparkles className="w-4 h-4 text-purple-300" />
            <span>{t('admin.simulateDemo')}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition-colors touch-target ml-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t('admin.addScheme')}</span>
        </button>
      </div>

      {/* Status Notifications */}
      {crawlerStatus && (
        <div className="p-3 bg-teal-50 border border-teal-200 text-teal-900 rounded-xl text-xs font-bold mb-4 animate-in fade-in">
          {crawlerStatus}
        </div>
      )}
      {simulateStatus && (
        <div className="p-3 bg-purple-50 border border-purple-200 text-purple-900 rounded-xl text-xs font-bold mb-4 animate-in fade-in flex items-center justify-between">
          <span>{simulateStatus}</span>
          <Link to="/admin/changes" className="underline font-black ml-2">View Now →</Link>
        </div>
      )}

      {loading && <LoadingSkeleton count={3} />}
      {error && <ErrorAlert message={error} onRetry={loadSchemes} />}

      {/* Schemes Catalog Table */}
      {!loading && !error && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-4 px-6">ID & Scheme Name</th>
                  <th className="py-4 px-4">Level</th>
                  <th className="py-4 px-4">Benefit</th>
                  <th className="py-4 px-4">Rules</th>
                  <th className="py-4 px-4">Verified</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schemes.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{s.name_en}</div>
                      <div className="text-xs text-slate-500 font-tamil">{s.name_ta}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase ${
                        s.level === 'central' 
                          ? 'bg-indigo-50 text-indigo-700' 
                          : 'bg-teal-50 text-teal-800'
                      }`}>
                        {s.level}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-teal-900">
                      ₹{s.benefit_amount?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full text-xs">
                        {s.rules?.length || 0} criteria
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-500">
                      {s.last_verified}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(s)}
                          className="p-2 rounded-lg text-slate-600 hover:text-teal-700 hover:bg-slate-100"
                          title="Edit Scheme"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteScheme(s.id)}
                          className="p-2 rounded-lg text-rose-500 hover:bg-rose-50"
                          title="Delete Scheme"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Scheme Modal with Rule Builder */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto my-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <h3 className="text-xl font-black text-slate-900">
                {editingScheme ? 'Edit Welfare Scheme' : 'Add New Welfare Scheme'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveScheme} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Scheme Name (English)
                </label>
                <input
                  type="text"
                  required
                  value={modalForm.name_en}
                  onChange={(e) => setModalForm({ ...modalForm, name_en: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Scheme Name (Tamil)
                </label>
                <input
                  type="text"
                  required
                  value={modalForm.name_ta}
                  onChange={(e) => setModalForm({ ...modalForm, name_ta: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-teal-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Level</label>
                  <select
                    value={modalForm.level}
                    onChange={(e) => setModalForm({ ...modalForm, level: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold"
                  >
                    <option value="state">State (Tamil Nadu)</option>
                    <option value="central">Central Govt</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={modalForm.category}
                    onChange={(e) => setModalForm({ ...modalForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Benefit Amount (₹)</label>
                  <input
                    type="number"
                    value={modalForm.benefit_amount}
                    onChange={(e) => setModalForm({ ...modalForm, benefit_amount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Benefit Display Text</label>
                  <input
                    type="text"
                    value={modalForm.benefit_text}
                    onChange={(e) => setModalForm({ ...modalForm, benefit_text: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Official Portal URL</label>
                <input
                  type="url"
                  required
                  value={modalForm.official_url}
                  onChange={(e) => setModalForm({ ...modalForm, official_url: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description (English)</label>
                <textarea
                  rows={2}
                  value={modalForm.description_en}
                  onChange={(e) => setModalForm({ ...modalForm, description_en: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description (Tamil)</label>
                <textarea
                  rows={2}
                  value={modalForm.description_ta}
                  onChange={(e) => setModalForm({ ...modalForm, description_ta: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-tamil"
                />
              </div>

              {/* Rule Builder Section */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Eligibility Rule Builder ({modalForm.rules.length})
                  </span>
                  <button
                    type="button"
                    onClick={addRuleRow}
                    className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Rule</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {modalForm.rules.map((rule, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                      {/* Field */}
                      <select
                        value={rule.field}
                        onChange={(e) => updateRuleRow(idx, 'field', e.target.value)}
                        className="p-1.5 rounded-lg border border-slate-300 bg-white font-bold"
                      >
                        <option value="age">Age</option>
                        <option value="gender">Gender</option>
                        <option value="family_income">Family Income</option>
                        <option value="community">Community</option>
                        <option value="education">Education</option>
                        <option value="first_graduate">First Graduate</option>
                        <option value="state">State</option>
                        <option value="district">District</option>
                      </select>

                      {/* Operator */}
                      <select
                        value={rule.op}
                        onChange={(e) => updateRuleRow(idx, 'op', e.target.value)}
                        className="p-1.5 rounded-lg border border-slate-300 bg-white font-mono font-bold"
                      >
                        <option value="==">==</option>
                        <option value="!=">!=</option>
                        <option value="<=">&lt;=</option>
                        <option value=">=">&gt;=</option>
                        <option value="in">in</option>
                        <option value="not_in">not_in</option>
                      </select>

                      {/* Value */}
                      <input
                        type="text"
                        value={rule.value}
                        onChange={(e) => updateRuleRow(idx, 'value', e.target.value)}
                        className="flex-1 p-1.5 rounded-lg border border-slate-300 bg-white font-semibold"
                        placeholder="Value"
                      />

                      <button
                        type="button"
                        onClick={() => removeRuleRow(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-md"
                >
                  Save Scheme
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
