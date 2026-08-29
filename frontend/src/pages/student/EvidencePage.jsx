import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FileCheck2, CheckCircle2, ShieldCheck, Tag, Award, Calendar } from 'lucide-react';

export default function EvidencePage() {
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvidence();
  }, []);

  const fetchEvidence = async () => {
    try {
      setLoading(true);
      const res = await api.get('/students/me/evidence');
      setEvidence(res.data);
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
          <FileCheck2 className="w-6 h-6 text-sky-400" /> My Skill Evidence
        </h1>
        <p className="text-xs text-slate-400 mt-1">Verified assessments, practical coding tasks, certifications, and mock interviews</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {evidence.map((ev) => (
          <div key={ev.id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-sky-400">{ev.skill_name}</span>
                <h3 className="font-bold text-sm text-white mt-0.5">{ev.type}</h3>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                ev.verified || ev.source === 'VERIFIED'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {ev.verified || ev.source === 'VERIFIED' ? (
                  <>
                    <ShieldCheck className="w-3 h-3" /> VERIFIED
                  </>
                ) : (
                  'SELF REPORTED'
                )}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">Score / Weight</span>
              <span className="text-sm font-extrabold text-white">{ev.score}% <span className="text-[11px] text-slate-400 font-normal">({ev.weight}x multiplier)</span></span>
            </div>

            <p className="text-xs text-slate-300 line-clamp-2">{ev.description || 'Verified practical skill demonstration record.'}</p>

            <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(ev.created_at).toLocaleDateString()}</span>
              <span className="text-sky-400 font-semibold">Reliable Evidence</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
