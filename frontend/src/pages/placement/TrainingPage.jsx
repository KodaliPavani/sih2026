import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { GraduationCap, Users, BookOpen, CheckCircle2 } from 'lucide-react';

export default function TrainingPage() {
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTraining();
  }, []);

  const fetchTraining = async () => {
    try {
      setLoading(true);
      const res = await api.get('/placement/training');
      setCohorts(res.data);
    } catch (e) {
      console.error(e);
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-indigo-400" /> Institutional Skill Training Cohorts
        </h1>
        <p className="text-xs text-slate-400 mt-1">Aggregated common skill gaps turned into structured remedial training programs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cohorts.map((cohort, idx) => (
          <div key={idx} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Skill Remediation</span>
                <h3 className="font-bold text-base text-white mt-0.5">{cohort.skill_name} Training Cohort</h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {cohort.status}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
              <span>Avg Institutional Mastery: <strong className="text-amber-400">{cohort.avg_mastery}%</strong></span>
              <span>Enrolled Students: <strong className="text-indigo-400">{cohort.students_needing_training} Students</strong></span>
            </div>

            <button className="w-full py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-bold transition-all">
              Manage Cohort Schedule & Reassessment
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
