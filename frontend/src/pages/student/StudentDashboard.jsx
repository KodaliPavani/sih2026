import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  Award,
  BookOpen,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Target,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function StudentDashboard() {
  const [profile, setProfile] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [gaps, setGaps] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [profRes, readRes, gapRes] = await Promise.all([
        api.get('/students/me/profile'),
        api.get('/students/me/readiness'),
        api.get('/students/me/gaps'),
      ]);
      setProfile(profRes.data);
      setReadiness(readRes.data);
      setGaps(gapRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-400"></div>
      </div>
    );
  }

  const score = readiness?.overall_readiness || profile?.overall_readiness || 52;
  const status = readiness?.status || profile?.readiness_status || 'Needs Improvement';

  const chartData = [
    { name: 'Readiness Score', value: score },
    { name: 'Remaining Gap', value: Math.max(0, 100 - score) },
  ];

  const COLORS = [score >= 75 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444', '#1E293B'];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-sky-900/30 via-slate-900 to-indigo-900/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" /> AI Readiness Engine Active
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Welcome back, {profile?.name || 'Student'}!
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Target Role: <span className="text-sky-400 font-semibold">{profile?.target_role}</span> • Student ID: {profile?.student_id} • Branch: {profile?.branch}
            </p>
          </div>
          <button
            onClick={() => navigate('/student/reassessment')}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-sky-500/25 transition-all shrink-0"
          >
            <RotateCcw className="w-4 h-4" /> Start Skill Reassessment
          </button>
        </div>
      </div>

      {/* Top Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Academic CGPA</div>
          <div className="text-2xl font-extrabold text-white mt-1">{profile?.cgpa?.toFixed(2)} / 10</div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Academic Eligible
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Role Readiness</div>
          <div className="text-2xl font-extrabold text-sky-400 mt-1">{score}%</div>
          <div className={`text-[11px] font-bold mt-1 ${score >= 75 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
            Status: {status}
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Identified Gaps</div>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">{gaps.length} Skills</div>
          <div className="text-[11px] text-slate-400 mt-1">Requires improvement</div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Verified Evidence</div>
          <div className="text-2xl font-extrabold text-indigo-400 mt-1">6 Records</div>
          <div className="text-[11px] text-indigo-300 mt-1">Coding & Practical</div>
        </div>
      </div>

      {/* Readiness Chart & Skill Gap Highlights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Overall Readiness Gauge & Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-sky-400" /> Target Role Readiness
            </h2>
            <p className="text-xs text-slate-400 mt-1">Weighted analysis against target role requirements</p>
          </div>

          <div className="h-48 relative my-2 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  startAngle={180}
                  endAngle={0}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-1 text-center">
              <span className="text-3xl font-black text-white">{score}%</span>
              <div className="text-[10px] font-bold text-slate-400 uppercase">{status}</div>
            </div>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
            <div className="flex justify-between">
              <span>Target Role:</span>
              <span className="font-bold text-white">{profile?.target_role}</span>
            </div>
            <div className="flex justify-between">
              <span>Passing Threshold:</span>
              <span className="font-bold text-emerald-400">70.0%</span>
            </div>
          </div>
        </div>

        {/* Top Skill Gaps List */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-400" /> Top Priority Skill Gaps
              </h2>
              <button
                onClick={() => navigate('/student/gaps')}
                className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
              >
                View All Gaps <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {gaps.slice(0, 4).map((gap, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white">{gap.skill_name}</div>
                      <div className="text-[11px] text-slate-400">Current: {gap.current_score}% • Threshold: {gap.required_score}%</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      gap.priority === 'HIGH' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {gap.gap_points} Pts Gap ({gap.priority})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Complete AI recommended learning to bridge skill gaps.</span>
            <button
              onClick={() => navigate('/student/learning')}
              className="px-4 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-400 text-xs font-bold transition-all"
            >
              Open Learning Plan
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
