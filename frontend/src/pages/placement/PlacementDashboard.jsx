import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  FileText,
  TrendingUp,
  GraduationCap,
  Building2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function PlacementDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/placement/dashboard');
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-400"></div>
      </div>
    );
  }

  const metrics = data.metrics;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-indigo-900/40 via-slate-900 to-purple-900/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Institutional Placement Intelligence Console
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Placement Cell Intelligence Dashboard
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Evidence-based eligibility matching, skill gap analytics & student readiness intervention
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/placement/jobs')}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" /> Upload New JD
            </button>
            <button
              onClick={() => navigate('/placement/eligible')}
              className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/30 transition-all flex items-center gap-1.5"
            >
              <Users className="w-4 h-4" /> Candidate Matching
            </button>
          </div>
        </div>
      </div>

      {/* Top Counter Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase">Total Registered</div>
          <div className="text-2xl font-extrabold text-white mt-1">{metrics.total_students} Students</div>
          <div className="text-[11px] text-slate-400 mt-1">5 Engineering Branches</div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase">Placement Ready</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{metrics.ready} Students</div>
          <div className="text-[11px] text-emerald-400 mt-1 font-semibold">Mastery ≥ 75%</div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase">Near Ready</div>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">{metrics.near_ready} Students</div>
          <div className="text-[11px] text-amber-400 mt-1 font-semibold">Mastery 60-74%</div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase">Needs Intervention</div>
          <div className="text-2xl font-extrabold text-rose-400 mt-1">{metrics.needs_improvement} Students</div>
          <div className="text-[11px] text-rose-400 mt-1 font-semibold">Mastery &lt; 60%</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Readiness Distribution Pie */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <h2 className="text-base font-bold text-white mb-1">Readiness Distribution</h2>
          <p className="text-xs text-slate-400 mb-4">Overall student skill mastery categorization</p>
          <div className="h-56 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.readiness_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {data.readiness_distribution.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Branch-wise Readiness Bar Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 lg:col-span-2">
          <h2 className="text-base font-bold text-white mb-1">Branch-wise Readiness Analysis</h2>
          <p className="text-xs text-slate-400 mb-4">Average skill readiness score across engineering branches</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.branch_analytics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="branch" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                <Bar dataKey="avg_readiness" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
