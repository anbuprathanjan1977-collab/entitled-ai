import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LockKeyhole, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { adminLogin } from '../api/admin';

export default function AdminLoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@urimai.ai');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await adminLogin(email, password);
      localStorage.setItem('urimai_admin_token', res.access_token);
      localStorage.setItem('urimai_admin_email', res.email);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/90 shadow-xl">
        
        <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center mx-auto mb-4 font-black">
          <LockKeyhole className="w-6 h-6 text-teal-700" />
        </div>

        <h1 className="text-2xl font-black text-center text-slate-900 mb-1">
          {t('admin.loginTitle')}
        </h1>
        <p className="text-xs text-center text-slate-500 mb-6">
          Authorized Welfare Administration Portal
        </p>

        {error && (
          <div className="bg-rose-50 text-rose-800 p-3.5 rounded-xl text-xs font-semibold mb-5 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
              {t('admin.email')}
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-medium focus:border-teal-600 focus:outline-none"
                placeholder="admin@urimai.ai"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
              {t('admin.password')}
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-medium focus:border-teal-600 focus:outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-sm shadow-md transition-all touch-target disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : t('admin.loginBtn')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-400">
          Default seed credentials: <span className="font-mono text-teal-800 font-bold">admin@urimai.ai / admin123</span>
        </div>
      </div>
    </div>
  );
}
