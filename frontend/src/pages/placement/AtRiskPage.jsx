import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { AlertTriangle, ShieldAlert, GraduationCap, ArrowRight } from 'lucide-react';

export default function AtRiskPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAtRisk();
  }, []);

  const fetchAtRisk = async () => {
    try {
      setLoading(true);
      const res = await api.get('/placement/at-risk');
      setStudents(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-rose-400" /> At-Risk Student Intervention Console
        </h1>
        <p className="text-xs text-slate-400 mt-1">Early warning system identifying students with low readiness approaching placement season</p>
      </div>

      <div className="space-y-3">
        {students.map((st) => (
          <div key={st.id} className="glass-panel p-5 rounded-2xl border border-rose-500/30 bg-rose-950/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-sky-400 text-xs">{st.student_id}</span>
                <h3 className="font-bold text-base text-white">{st.name}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {st.status}
                </span>
              </div>

              <div className="text-xs text-slate-400">
                Branch: {st.branch} • CGPA: {st.cgpa} • Target Role: {st.target_role}
              </div>

              <div className="flex items-center gap-4 text-xs pt-1">
                <span>Overall Readiness: <strong className="text-rose-400">{st.readiness}%</strong></span>
                <span>Major Deficits: <strong className="text-amber-400">{st.major_gaps.join(', ')}</strong></span>
              </div>
            </div>

            <button className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-600 hover:from-rose-400 hover:to-amber-500 text-white font-bold text-xs shadow-lg shadow-rose-500/20 transition-all shrink-0">
              Assign to Training Cohort
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
