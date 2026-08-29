import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { AlertTriangle, ShieldAlert, GraduationCap, ArrowRight, BrainCircuit, Sparkles, CheckCircle2 } from 'lucide-react';

export default function AtRiskPage() {
  const [students, setStudents] = useState([]);
  const [mlMetrics, setMlMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assignedStudent, setAssignedStudent] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [riskRes, mlRes] = await Promise.all([
        api.get('/placement/at-risk'),
        api.get('/placement/ml-model/metrics')
      ]);
      setStudents(riskRes.data);
      setMlMetrics(mlRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCohort = (student) => {
    setAssignedStudent(student.name);
    setTimeout(() => setAssignedStudent(null), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-rose-400" /> At-Risk Student Early Warning & Intervention
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic multi-signal threshold engine paired with auxiliary ML risk classification
          </p>
        </div>
        <button
          onClick={() => navigate('/placement/training')}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all shrink-0"
        >
          <GraduationCap className="w-4 h-4" /> Manage Training Cohorts
        </button>
      </div>

      {assignedStudent && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Successfully assigned {assignedStudent} to Remedial Training Cohort!</span>
        </div>
      )}

      {/* ML Evaluation Metrics Banner */}
      {mlMetrics && mlMetrics.validation_metrics && (
        <div className="glass-panel p-5 rounded-2xl border border-indigo-500/30 bg-indigo-950/20 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
              <BrainCircuit className="w-4 h-4 text-sky-400" />
              <span>Auxiliary ML Classifier Validation: {mlMetrics.model_type}</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
              {mlMetrics.dataset_label}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">Test Accuracy</div>
              <div className="text-sm font-black text-emerald-400 font-mono">
                {(mlMetrics.validation_metrics.accuracy * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">Precision</div>
              <div className="text-sm font-black text-sky-400 font-mono">
                {(mlMetrics.validation_metrics.precision * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">Recall</div>
              <div className="text-sm font-black text-indigo-400 font-mono">
                {(mlMetrics.validation_metrics.recall * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">F1-Score</div>
              <div className="text-sm font-black text-purple-400 font-mono">
                {(mlMetrics.validation_metrics.f1_score * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 pt-1 flex items-center justify-between">
            <span>Top Features: <strong>{mlMetrics.feature_importance_ranking?.slice(0, 3).map(([f]) => f).join(', ')}</strong></span>
            <span className="text-[10px] text-slate-500 italic">{mlMetrics.production_disclaimer}</span>
          </div>
        </div>
      )}

      {/* At-Risk Student Cards */}
      <div className="space-y-3">
        {students.map((st) => (
          <div key={st.id} className="glass-panel p-5 rounded-2xl border border-rose-500/30 bg-rose-950/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono font-bold text-sky-400 text-xs">{st.student_id}</span>
                <h3 className="font-bold text-base text-white">{st.name}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {st.status}
                </span>
              </div>

              <div className="text-xs text-slate-400">
                Branch: {st.branch} • CGPA: {st.cgpa} • Target Role: {st.target_role}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                <span>Overall Readiness: <strong className="text-rose-400">{st.readiness}%</strong></span>
                {st.major_gaps?.length > 0 && (
                  <span>Deficits: <strong className="text-amber-400">{st.major_gaps.join(', ')}</strong></span>
                )}
              </div>

              {st.signals && st.signals.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {st.signals.map((sig, sIdx) => (
                    <span key={sIdx} className="text-[10px] px-2 py-0.5 rounded bg-rose-900/40 text-rose-300 border border-rose-800/60">
                      {sig}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => handleAssignCohort(st)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-600 hover:from-rose-400 hover:to-amber-500 text-white font-bold text-xs shadow-lg shadow-rose-500/20 transition-all shrink-0"
            >
              Assign to Training Cohort
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

