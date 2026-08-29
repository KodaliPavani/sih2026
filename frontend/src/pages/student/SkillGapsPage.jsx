import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { TrendingDown, AlertTriangle, ArrowRight, BookOpen, RotateCcw } from 'lucide-react';

export default function SkillGapsPage() {
  const [gaps, setGaps] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    fetchGaps();
  }, []);

  const fetchGaps = async () => {
    try {
      setLoading(true);
      const res = await api.get('/students/me/gaps');
      setGaps(res.data);
    } catch (e) {
      console.error(e);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <TrendingDown className="w-6 h-6 text-amber-400" /> Skill Gap Analysis
        </h1>
        <p className="text-xs text-slate-400 mt-1">Identified deficiencies between current mastery and required role thresholds</p>
      </div>

      <div className="space-y-4">
        {gaps.map((gap, idx) => (
          <div key={idx} className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-base text-white">{gap.skill_name}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  gap.priority === 'HIGH'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  Priority: {gap.priority}
                </span>
              </div>
              <p className="text-xs text-slate-400">{gap.reason}</p>
              <div className="flex items-center gap-4 text-xs pt-1">
                <span>Current Mastery: <strong className="text-rose-400">{gap.current_score}%</strong></span>
                <span>Required Threshold: <strong className="text-emerald-400">{gap.required_score}%</strong></span>
                <span>Deficit: <strong className="text-amber-400">{gap.gap_points} points</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => navigate('/student/learning')}
                className="px-4 py-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <BookOpen className="w-4 h-4" /> View Learning Module
              </button>
              <button
                onClick={() => navigate('/student/reassessment')}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-sky-500/20"
              >
                <RotateCcw className="w-4 h-4" /> Test Mastery
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
