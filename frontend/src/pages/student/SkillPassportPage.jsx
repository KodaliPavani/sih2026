import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  Layers,
  Upload,
  Plus,
  X,
  RotateCcw,
  Sparkles
} from 'lucide-react';

export default function SkillPassportPage() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadSkill, setUploadSkill] = useState('');
  const [evidenceType, setEvidenceType] = useState('Self-reported Project');
  const [scoreClaim, setScoreClaim] = useState(75);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const res = await api.get('/students/me/skills');
      setSkills(res.data);
      if (res.data.length > 0 && !uploadSkill) {
        setUploadSkill(res.data[0].skill_name);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      await api.post('/students/me/evidence', {
        skill_name: uploadSkill,
        evidence_type: evidenceType,
        score: parseFloat(scoreClaim),
        description: description
      });
      setShowUploadModal(false);
      setDescription('');
      fetchSkills();
    } catch (err) {
      console.error('Failed to submit evidence:', err);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-400"></div>
      </div>
    );
  }

  const getMasteryStateBadge = (state) => {
    switch (state) {
      case 'MASTERED':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'VERIFIED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'SUPPORTED':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-sky-400" /> Evidence-Based Skill Passport
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic mastery scores computed across verified coding assessments, projects, and practical evidence
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 transition-all"
          >
            <Upload className="w-4 h-4" /> Upload Evidence
          </button>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-sky-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> {skills.length} Tracked Skills
          </div>
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
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-base text-white">{skill.skill_name}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {skill.category}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getMasteryStateBadge(skill.mastery_state)}`}>
                      {skill.mastery_state}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-sky-400" /> {skill.evidence_count} Evidence Items
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" /> {skill.recency_text || 'Recent'}
                    </span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColor} shrink-0`}>
                  {skill.status}
                </span>
              </div>

              {skill.consistency_warning && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{skill.consistency_warning}</span>
                </div>
              )}

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

              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 gap-2">
                <span>Confidence: <strong className="text-slate-200">{skill.confidence}</strong></span>
                <button
                  onClick={() => navigate('/student/reassessment')}
                  className="text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Reassess Skill
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upload Evidence Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-sky-400" /> Upload Skill Evidence
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Skill</label>
                <select
                  value={uploadSkill}
                  onChange={(e) => setUploadSkill(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-semibold"
                >
                  {skills.map((s) => (
                    <option key={s.id} value={s.skill_name}>{s.skill_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Evidence Type</label>
                <select
                  value={evidenceType}
                  onChange={(e) => setEvidenceType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-semibold"
                >
                  <option value="Self-reported Project">Self-reported Project</option>
                  <option value="Verified GitHub Project">Verified GitHub Project / Repository</option>
                  <option value="Certificate">Technical Certification</option>
                  <option value="Resume Claim">Resume Claim</option>
                  <option value="Practical Task">Practical Assignment</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Self-Reported Score / Proficiency (0 - 100%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={scoreClaim}
                  onChange={(e) => setScoreClaim(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Evidence Description / Repository URL</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide project summary, repository link, or certificate details..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/30"
                >
                  {uploading ? 'Recording Evidence...' : 'Submit Evidence'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

