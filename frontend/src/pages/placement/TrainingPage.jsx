import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { GraduationCap, Users, BookOpen, CheckCircle2, Plus, X, Calendar, Sparkles } from 'lucide-react';

export default function TrainingPage() {
  const [data, setData] = useState({ active_cohorts: [], recommended_cohorts: [] });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSkill, setNewSkill] = useState('Spring Boot');
  const [newInstructor, setNewInstructor] = useState('Placement Training Faculty');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTraining();
  }, []);

  const fetchTraining = async () => {
    try {
      setLoading(true);
      const res = await api.get('/placement/training');
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCohort = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/placement/training', {
        skill_name: newSkill,
        title: newTitle || `${newSkill} Remedial Accelerator`,
        instructor: newInstructor
      });
      setShowCreateModal(false);
      setNewTitle('');
      fetchTraining();
    } catch (err) {
      console.error('Failed to create cohort:', err);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-400"></div>
      </div>
    );
  }

  const activeCohorts = data.active_cohorts || [];
  const recommendedCohorts = data.recommended_cohorts || [];

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-indigo-400" /> Institutional Skill Training Cohorts
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Aggregated campus skill gaps turned into structured remedial training programs & bootcamps
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Create New Cohort
        </button>
      </div>

      {/* Active Cohorts Section */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" /> Active Campus Upskilling Cohorts
        </h2>

        {activeCohorts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeCohorts.map((cohort) => (
              <div key={cohort.id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                        {cohort.skill_name}
                      </span>
                      <h3 className="font-bold text-base text-white mt-0.5">{cohort.title}</h3>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                      {cohort.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800/80">
                    <div className="flex justify-between">
                      <span>Instructor:</span>
                      <strong className="text-slate-200">{cohort.instructor}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Enrolled Students:</span>
                      <strong className="text-indigo-400">{cohort.student_count} Candidates</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="w-full py-2 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-300 font-semibold">
                    Cohort Active
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel p-6 text-center text-slate-400 text-xs rounded-2xl border border-slate-800">
            No active training cohorts configured. Create one below!
          </div>
        )}
      </div>

      {/* Recommended Cohorts from Gaps */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" /> AI-Recommended Deficit Programs
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendedCohorts.map((cohort, idx) => (
            <div key={idx} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Gap Intervention</span>
                  <h3 className="font-bold text-base text-white mt-0.5">{cohort.skill_name} Remediation</h3>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {cohort.students_needing_training} Students in Deficit
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                <span>Avg Cohort Mastery: <strong className="text-amber-400">{cohort.avg_mastery}%</strong></span>
                <span>Recommended Action: <strong className="text-emerald-400">Launch 2-Week Bootcamp</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Cohort Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-400" /> Create Remedial Training Cohort
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCohort} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Skill Gap</label>
                <select
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-semibold"
                >
                  {['Spring Boot', 'DSA', 'SQL', 'REST API', 'Java', 'Python', 'React', 'Machine Learning'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Cohort Program Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Spring Boot & Enterprise Microservices Cohort"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Assigned Instructor / Faculty</label>
                <input
                  type="text"
                  value={newInstructor}
                  onChange={(e) => setNewInstructor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30"
                >
                  {creating ? 'Creating Cohort...' : 'Create Cohort'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

