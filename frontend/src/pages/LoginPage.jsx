import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Building2, ShieldCheck, Lock, User, Sparkles, ArrowRight, BookOpen } from 'lucide-react';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState('STUDENT'); // 'STUDENT', 'PLACEMENT_CELL', 'TRAINER'
  const [username, setUsername] = useState('2300030042');
  const [password, setPassword] = useState('2300030042');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError('');
    if (tab === 'STUDENT') {
      setUsername('2300030042');
      setPassword('2300030042');
    } else if (tab === 'PLACEMENT_CELL') {
      setUsername('admin');
      setPassword('placement123');
    } else if (tab === 'TRAINER') {
      setUsername('trainer');
      setPassword('trainer123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(username, password);
    setLoading(false);

    if (res.success) {
      if (res.data.firstLogin) {
        navigate('/reset-password');
      } else if (res.data.role === 'STUDENT') {
        navigate('/student/dashboard');
      } else if (res.data.role === 'TRAINER') {
        navigate('/trainer/dashboard');
      } else {
        navigate('/placement/dashboard');
      }
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Dynamic Background Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold tracking-wide uppercase mb-4">
          <Sparkles className="w-3.5 h-3.5" /> SIH 2026 Innovation Platform
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
          Placement Intelligence & Skill Readiness
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Evidence-backed readiness analytics, JD matching & skill gap intelligence
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="glass-panel py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-800">
          
          {/* Triple Portal Role Tabs */}
          <div className="flex p-1 bg-slate-900/80 rounded-xl border border-slate-800 mb-6 gap-1">
            <button
              type="button"
              onClick={() => handleTabChange('STUDENT')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'STUDENT'
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" /> Student
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('PLACEMENT_CELL')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'PLACEMENT_CELL'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" /> Placement
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('TRAINER')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'TRAINER'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Faculty Trainer
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                {activeTab === 'STUDENT' ? 'Student ID (Username)' : activeTab === 'PLACEMENT_CELL' ? 'Admin ID' : 'Trainer Username'}
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={activeTab === 'STUDENT' ? 'e.g. 2300030042' : activeTab === 'PLACEMENT_CELL' ? 'admin' : 'trainer'}
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
              {activeTab === 'STUDENT' && (
                <p className="mt-1 text-xs text-slate-500">
                  First time login default password is your Student ID.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white shadow-lg transition-all ${
                activeTab === 'STUDENT'
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-sky-500/25'
                  : activeTab === 'PLACEMENT_CELL'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 shadow-indigo-500/25'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-purple-500/25'
              }`}
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Selector Box */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> SIH Quick Demo Credentials:
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  handleTabChange('STUDENT');
                  setUsername('2300030042');
                  setPassword('2300030042');
                }}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left text-slate-300 hover:text-white transition-colors"
              >
                <div className="font-bold text-sky-400">Student</div>
                <div className="text-[10px] text-slate-400 truncate">2300030042</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  handleTabChange('PLACEMENT_CELL');
                  setUsername('admin');
                  setPassword('placement123');
                }}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left text-slate-300 hover:text-white transition-colors"
              >
                <div className="font-bold text-indigo-400">Placement</div>
                <div className="text-[10px] text-slate-400 truncate">admin</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  handleTabChange('TRAINER');
                  setUsername('trainer');
                  setPassword('trainer123');
                }}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left text-slate-300 hover:text-white transition-colors"
              >
                <div className="font-bold text-purple-400">Trainer</div>
                <div className="text-[10px] text-slate-400 truncate">trainer</div>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

