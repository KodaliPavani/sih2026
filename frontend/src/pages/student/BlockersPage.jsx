import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Layers,
  Sparkles,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react';

export default function BlockersPage() {
  const [blockersData, setBlockersData] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    fetchBlockers();
  }, []);

  const fetchBlockers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/students/me/blockers');
      setBlockersData(res.data);
    } catch (err) {
      console.error('Failed to load blockers:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-400"></div>
      </div>
    );
  }

  const {
    target_role,
    overall_readiness,
    passing_threshold,
    status,
    hard_eligibility_passed,
    hard_eligibility_reason,
    total_blockers_count,
    blockers,
    hidden_prerequisite_gaps
  } = blockersData || {};

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-amber-950/30 via-slate-900 to-rose-950/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-2">
              <HelpCircle className="w-3.5 h-3.5" /> Deterministic Blocker Diagnostic
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Why Am I Not Ready?
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Target Role: <span className="text-amber-400 font-bold">{target_role}</span> • Passing Threshold: {passing_threshold}% • Current: {overall_readiness}%
            </p>
          </div>
          <button
            onClick={() => navigate('/student/simulation')}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-sky-500/25 transition-all shrink-0"
          >
            <Sparkles className="w-4 h-4" /> Simulate What-If Improvements
          </button>
        </div>
      </div>

      {/* Academic Hard Eligibility & Readiness Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`glass-card p-5 rounded-2xl border ${hard_eligibility_passed ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-rose-500/30 bg-rose-950/10'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${hard_eligibility_passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {hard_eligibility_passed ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hard Academic Eligibility</div>
              <div className={`text-base font-extrabold ${hard_eligibility_passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                {hard_eligibility_passed ? 'Academic Criteria Satisfied' : 'Academic Threshold Failed'}
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-3 pt-3 border-t border-slate-800/80">
            {hard_eligibility_reason}
          </p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Competency Blockers</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              {total_blockers_count} Core Deficits
            </span>
          </div>
          <div className="text-2xl font-black text-white">{overall_readiness}% / 100%</div>
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${overall_readiness >= 70 ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ width: `${overall_readiness}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 pt-1">
            <span>Status: <strong className="text-amber-400">{status}</strong></span>
            <span>Target: <strong className="text-emerald-400">{passing_threshold}% Required</strong></span>
          </div>
        </div>
      </div>

      {/* Hidden Prerequisite Gaps Alert */}
      {hidden_prerequisite_gaps && hidden_prerequisite_gaps.length > 0 && (
        <div className="glass-panel p-5 rounded-2xl border border-rose-500/30 bg-rose-950/20 space-y-3">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
            <AlertTriangle className="w-5 h-5" /> Hidden Prerequisite Deficiencies Detected
          </div>
          <p className="text-xs text-slate-300">
            Our skill dependency graph identified that you have underlying foundational weaknesses that directly block advanced skill mastery:
          </p>
          <div className="space-y-2">
            {hidden_prerequisite_gaps.map((alertMsg, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                <span>{alertMsg}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Concrete Blocker Breakdown Cards */}
      <div className="space-y-4">
        <h2 className="text-base font-extrabold text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" /> Specific Competency Blockers & Actionable Pathways
        </h2>

        {blockers && blockers.length > 0 ? (
          <div className="space-y-3">
            {blockers.map((b, idx) => (
              <div key={idx} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-extrabold text-xs">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-white">{b.skill_name}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                          Importance: {b.importance}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded border border-amber-500/30 text-amber-400 font-semibold">
                          {b.mastery_state}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Current Score: <strong className="text-white">{b.current_score}%</strong> • Required: <strong className="text-emerald-400">{b.required_score}%</strong> • Deficit: <strong className="text-rose-400">-{b.deficit} pts</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate('/student/reassessment')}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 text-xs font-bold transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reassess
                    </button>
                    <button
                      onClick={() => navigate('/student/learning')}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-all"
                    >
                      <BookOpen className="w-3.5 h-3.5" /> Learn Module
                    </button>
                  </div>
                </div>

                {b.prerequisite_blocker && (
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{b.prerequisite_blocker}</span>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-1">
                  <div className="font-bold text-sky-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Recommended Remediation:
                  </div>
                  <div>{b.recommended_action}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel p-8 text-center rounded-2xl border border-emerald-500/30 bg-emerald-950/10">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
            <h3 className="text-lg font-bold text-white">No Critical Blockers Found</h3>
            <p className="text-xs text-slate-400 mt-1">
              You meet all primary skill and academic thresholds for {target_role}!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
