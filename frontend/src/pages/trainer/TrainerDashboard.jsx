import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  GraduationCap,
  Users,
  BookOpen,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
  Clock,
  CheckCircle,
  FileCheck
} from 'lucide-react';

export default function TrainerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/trainer/dashboard');
      setData(res.data);
    } catch (e) {
      console.error('Failed to load trainer dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-400"></div>
      </div>
    );
  }

  const metrics = data?.metrics || {
    assigned_cohorts: 0,
    total_students: 0,
    avg_attendance_pct: 90.0,
    avg_completion_pct: 60.0,
    evaluated_count: 0,
    pending_evaluations: 0
  };

  const cohorts = data?.cohorts || [];

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header Banner */}
      <div className="glass-card p-6 md:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
              <GraduationCap className="w-3.5 h-3.5" /> Institutional Faculty Portal
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              Welcome, {data?.trainer?.name || 'Faculty Trainer'}
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl">
              Track assigned student cohorts, record lab attendance, and issue verified faculty skill endorsements to boost candidate placement readiness.
            </p>
          </div>
          <Link
            to="/trainer/grading"
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all shrink-0"
          >
            <Award className="w-4 h-4" /> Grade & Endorse Candidates
          </Link>
        </div>
      </div>

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Assigned Cohorts</span>
            <BookOpen className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{metrics.assigned_cohorts}</div>
          <div className="text-[10px] text-slate-400 font-medium">Active Remedial Modules</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Assigned Students</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{metrics.total_students}</div>
          <div className="text-[10px] text-sky-400 font-medium">Under Active Mentorship</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Avg Attendance</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">{metrics.avg_attendance_pct}%</div>
          <div className="text-[10px] text-slate-400 font-medium">Lab & Lecture Presence</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Evaluated / Sign-offs</span>
            <FileCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-purple-400">
            {metrics.evaluated_count}{' '}
            <span className="text-xs text-slate-400 font-normal">/ {metrics.total_students}</span>
          </div>
          <div className="text-[10px] text-amber-400 font-medium">
            {metrics.pending_evaluations} Pending Assessment
          </div>
        </div>
      </div>

      {/* Assigned Cohorts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" /> Assigned Upskilling Cohort Modules
          </h2>
          <span className="text-xs text-slate-400">Click any cohort to inspect students and record evaluations</span>
        </div>

        {cohorts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {cohorts.map((cohort) => (
              <div
                key={cohort.id}
                className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between hover:border-indigo-500/50 transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider">
                        {cohort.skill_name}
                      </span>
                      <h3 className="font-bold text-base text-white mt-0.5 group-hover:text-indigo-300 transition-colors">
                        {cohort.title}
                      </h3>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                      {cohort.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-300 mt-4 pt-3 border-t border-slate-800/80">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Enrolled Candidates:</span>
                      <strong className="text-indigo-400 font-extrabold">
                        {cohort.student_count} Students
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Avg Attendance:</span>
                      <strong className="text-emerald-400 font-bold">{cohort.avg_attendance}%</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Evaluated / Sign-offs:</span>
                      <strong className="text-purple-300 font-bold">
                        {cohort.evaluated_count} / {cohort.student_count}
                      </strong>
                    </div>

                    {/* Progress Bar */}
                    <div className="pt-1">
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>Module Progress</span>
                        <span>{cohort.avg_completion}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                          style={{ width: `${cohort.avg_completion}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 grid grid-cols-2 gap-2">
                  <Link
                    to={`/trainer/cohorts/${cohort.id}`}
                    className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-center text-xs text-slate-200 font-bold transition-all flex items-center justify-center gap-1"
                  >
                    <Users className="w-3.5 h-3.5 text-sky-400" /> Student Roster
                  </Link>
                  <Link
                    to={`/trainer/cohorts/${cohort.id}?tab=evaluate`}
                    className="py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-center text-xs text-indigo-300 font-bold transition-all flex items-center justify-center gap-1"
                  >
                    <Award className="w-3.5 h-3.5 text-indigo-400" /> Grade Lab
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel p-8 text-center text-slate-400 text-xs rounded-2xl border border-slate-800">
            No training cohorts assigned yet.
          </div>
        )}
      </div>

      {/* Institutional Evidence Notice */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/40 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300">
          <strong className="text-white">Direct Evidence Integration:</strong> When you grade a student’s post-training assessment or submit a faculty endorsement, the platform automatically issues a verified <strong>Faculty Verification (1.8x Weight)</strong> evidence record. This instantly recalculates the student’s deterministic mastery score and overall role readiness across campus drives.
        </div>
      </div>
    </div>
  );
}
