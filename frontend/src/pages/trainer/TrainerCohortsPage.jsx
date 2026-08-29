import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  BookOpen,
  Users,
  Award,
  CheckCircle2,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  Calendar
} from 'lucide-react';

export default function TrainerCohortsPage() {
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('ALL');

  useEffect(() => {
    fetchCohorts();
  }, []);

  const fetchCohorts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/trainer/dashboard');
      setCohorts(res.data.cohorts || []);
    } catch (e) {
      console.error('Failed to load assigned cohorts:', e);
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

  const skillsList = ['ALL', ...Array.from(new Set(cohorts.map((c) => c.skill_name)))];

  const filteredCohorts = cohorts.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.skill_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSkill = selectedSkill === 'ALL' || c.skill_name === selectedSkill;
    return matchesSearch && matchesSkill;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-400" /> Assigned Cohorts & Modules
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your assigned upskilling cohorts, view student rosters, track syllabus milestones, and monitor cohort progression.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search cohort by title, skill, faculty..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Skill:
          </span>
          {skillsList.map((skill) => (
            <button
              key={skill}
              onClick={() => setSelectedSkill(skill)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 ${
                selectedSkill === skill
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {skill}
            </button>
          ))}
        </div>
      </div>

      {/* Cohorts Grid */}
      {filteredCohorts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCohorts.map((cohort) => (
            <div
              key={cohort.id}
              className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between hover:border-indigo-500/50 transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider">
                      {cohort.skill_name}
                    </span>
                    <h3 className="font-bold text-base text-white mt-0.5 group-hover:text-indigo-300 transition-colors">
                      {cohort.title}
                    </h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                    {cohort.status}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-300 mt-4 pt-3 border-t border-slate-800/80">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Assigned Faculty:</span>
                    <strong className="text-slate-200">{cohort.instructor}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Enrolled Candidates:</span>
                    <strong className="text-indigo-400 font-extrabold">
                      {cohort.student_count} Students
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Avg Attendance:</span>
                    <strong className="text-emerald-400 font-bold">{cohort.avg_attendance}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Evaluations Completed:</span>
                    <strong className="text-purple-300 font-bold">
                      {cohort.evaluated_count} / {cohort.student_count}
                    </strong>
                  </div>

                  {/* Progress Bar */}
                  <div className="pt-1">
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Module Progress</span>
                      <span>{cohort.avg_completion}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${cohort.avg_completion}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 grid grid-cols-2 gap-2">
                <Link
                  to={`/trainer/cohorts/${cohort.id}`}
                  className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-center text-xs text-slate-200 font-bold transition-all flex items-center justify-center gap-1"
                >
                  <Users className="w-3.5 h-3.5 text-sky-400" /> View Roster
                </Link>
                <Link
                  to={`/trainer/cohorts/${cohort.id}?tab=evaluate`}
                  className="py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-center text-xs text-indigo-300 font-bold transition-all flex items-center justify-center gap-1"
                >
                  <Award className="w-3.5 h-3.5 text-indigo-400" /> Grade Lab
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel p-8 text-center text-slate-400 text-xs rounded-2xl border border-slate-800">
          No cohorts found matching the current search or skill filter.
        </div>
      )}
    </div>
  );
}
