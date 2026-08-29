import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Award, CheckCircle2, AlertTriangle, ShieldCheck, Calendar, Layers } from 'lucide-react';

export default function SkillPassportPage() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const res = await api.get('/students/me/skills');
      setSkills(res.data);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-sky-400" /> Skill Passport
          </h1>
          <p className="text-xs text-slate-400 mt-1">Evidence-backed mastery score across all technical skills</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-sky-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> {skills.length} Tracked Competencies
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {skills.map((skill) => {
          const score = skill.mastery_score;
          const statusColor =
            score >= 75
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : score >= 60
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20';

          const barColor =
            score >= 75
              ? 'bg-emerald-500'
              : score >= 60
              ? 'bg-amber-500'
              : 'bg-rose-500';

          return (
            <div key={skill.id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-white">{skill.skill_name}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {skill.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-sky-400" /> {skill.evidence_count} Evidence Items
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" /> Assessed: {skill.last_assessed_at ? new Date(skill.last_assessed_at).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColor}`}>
                  {skill.status}
                </span>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-300">Mastery Level</span>
                  <span className="text-white">{score}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                <span>Confidence Level: <strong className="text-slate-200">{skill.confidence}</strong></span>
                <span>Threshold: <strong className="text-emerald-400">65% Required</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
