import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { BookOpen, Sparkles, Clock, Target, ArrowRight, RotateCcw, CheckCircle2 } from 'lucide-react';

export default function LearningPlanPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/students/me/recommendations');
      setRecommendations(res.data);
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
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Powered by Google Gemini AI
          </div>
          <h1 className="text-2xl font-extrabold text-white">Targeted AI Learning Modules</h1>
          <p className="text-xs text-slate-400 mt-1">Personalized action plans connected directly to your identified skill gaps</p>
        </div>
      </div>

      {recommendations.map((rec, rIdx) => (
        <div key={rIdx} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-xs text-sky-400 font-bold uppercase tracking-wider">Skill Gap Target</span>
              <h2 className="text-lg font-extrabold text-white">{rec.skill_name}</h2>
              <div className="text-xs text-slate-400 mt-0.5">
                Current Mastery: <strong className="text-rose-400">{rec.current_score}%</strong> • Target Threshold: <strong className="text-emerald-400">{rec.target_score}%</strong>
              </div>
            </div>
            <button
              onClick={() => navigate('/student/reassessment')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-sky-500/20"
            >
              <RotateCcw className="w-4 h-4" /> Start Reassessment
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rec.modules.map((mod, mIdx) => (
              <div key={mIdx} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-start justify-between">
                  <span className="text-xs font-bold text-sky-300">Module #{mIdx + 1}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-amber-400 border border-slate-700">
                    {mod.difficulty}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-white">{mod.topic}</h3>

                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-sky-400" /> {mod.estimated_effort}</span>
                  <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5 text-emerald-400" /> {mod.resource_type}</span>
                </div>

                <p className="text-xs text-slate-300 pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400">Outcome: </span>{mod.outcome}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
