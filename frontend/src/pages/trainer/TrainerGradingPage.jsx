import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Award,
  BookOpen,
  Users,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Search,
  Filter
} from 'lucide-react';

export default function TrainerGradingPage() {
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCohorts();
  }, []);

  const fetchCohorts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/trainer/dashboard');
      setCohorts(res.data.cohorts || []);
    } catch (e) {
      console.error('Failed to load cohorts for grading:', e);
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

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-indigo-400" /> Evaluation & Faculty Endorsements
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Grade post-training lab milestones, endorse completed modules, and issue verified skill evidence records (1.8x Weight)
          </p>
        </div>
      </div>

      {/* Cohorts Grading Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {cohorts.map((cohort) => (
          <div
            key={cohort.id}
            className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 hover:border-indigo-500/50 transition-all group"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider">
                  {cohort.skill_name}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {cohort.status}
                </span>
              </div>
              <h3 className="font-bold text-base text-white mt-1 group-hover:text-indigo-300 transition-colors">
                {cohort.title}
              </h3>

              <div className="mt-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Enrolled:</span>
                  <strong className="text-indigo-300">{cohort.student_count} Candidates</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Evaluations Completed:</span>
                  <strong className="text-emerald-400">{cohort.evaluated_count} Students</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pending Endorsements:</span>
                  <strong className="text-amber-400">{cohort.pending_count} Students</strong>
                </div>
              </div>
            </div>

            <Link
              to={`/trainer/cohorts/${cohort.id}`}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5"
            >
              <Award className="w-3.5 h-3.5" /> Grade & Issue Endorsements <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ))}
      </div>

      {/* Methodology Callout */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/40 flex items-start gap-4">
        <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-slate-300">
          <h4 className="font-bold text-white text-sm">Faculty Verification Authority</h4>
          <p>
            In TalentProof's evidence engine, faculty training sign-offs carry the highest intrinsic credibility weight (1.8x). When you mark a student as completed or submit their post-training score, their skill mastery is mathematically updated using multi-source weighted averaging and recency decay.
          </p>
        </div>
      </div>
    </div>
  );
}
