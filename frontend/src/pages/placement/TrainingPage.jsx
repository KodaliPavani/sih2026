import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  GraduationCap,
  Users,
  BookOpen,
  CheckCircle2,
  Plus,
  X,
  Calendar,
  Sparkles,
  Search,
  Download,
  Filter,
  Eye,
  ArrowRight,
  TrendingDown,
  Award
} from 'lucide-react';

export default function TrainingPage() {
  const [data, setData] = useState({ active_cohorts: [], recommended_cohorts: [] });
  const [loading, setLoading] = useState(true);
  
  // Create Cohort Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSkill, setNewSkill] = useState('Spring Boot');
  const [newInstructor, setNewInstructor] = useState('Placement Training Faculty');
  const [creating, setCreating] = useState(false);

  // Student Drilldown Modal State
  const [selectedCohort, setSelectedCohort] = useState(null);
  const [cohortStudents, setCohortStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalSubtitle, setModalSubtitle] = useState('');
  
  // Deficit Roster Modal State
  const [deficitSkill, setDeficitSkill] = useState(null);
  const [deficitStudents, setDeficitStudents] = useState([]);
  const [loadingDeficits, setLoadingDeficits] = useState(false);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('ALL');

  useEffect(() => {
    fetchTraining();
  }, []);

  const fetchTraining = async () => {
    try {
      setLoading(true);
      const res = await api.get('/placement/training');
      setData(res.data);
    } catch (e) {
      console.error('Failed to load training cohorts:', e);
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

  // Open Enrolled Students for Active Cohort
  const handleOpenCohortStudents = async (cohort) => {
    setSelectedCohort(cohort);
    setDeficitSkill(null);
    setSearchTerm('');
    setSelectedBranch('ALL');
    setModalTitle(cohort.title);
    setModalSubtitle(`Instructor: ${cohort.instructor} • Target Skill: ${cohort.skill_name}`);
    try {
      setLoadingStudents(true);
      const res = await api.get(`/placement/training/cohorts/${cohort.id}/students`);
      setCohortStudents(res.data.students || []);
    } catch (err) {
      console.error('Failed to load cohort students:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Open Deficit Students for Recommended Skill Program
  const handleOpenDeficitStudents = async (item) => {
    setDeficitSkill(item);
    setSelectedCohort(null);
    setSearchTerm('');
    setSelectedBranch('ALL');
    setModalTitle(`${item.skill_name} Deficit Students Roster`);
    setModalSubtitle(`Identified ${item.students_needing_training} students with proficiency < 60% (Avg Mastery: ${item.avg_mastery}%)`);
    try {
      setLoadingDeficits(true);
      const res = await api.get(`/placement/training/deficits/${encodeURIComponent(item.skill_name)}/students`);
      setDeficitStudents(res.data.students || []);
    } catch (err) {
      console.error('Failed to load deficit students:', err);
    } finally {
      setLoadingDeficits(false);
    }
  };

  const exportStudentsToCSV = (studentsList, filename) => {
    if (!studentsList || studentsList.length === 0) return;
    const headers = ['Student ID', 'Name', 'Branch', 'CGPA', 'Target Role', 'Skill Score', 'Overall Readiness', 'Status'];
    const rows = studentsList.map((s) => [
      `"${s.student_id}"`,
      `"${s.name}"`,
      `"${s.branch}"`,
      s.cgpa,
      `"${s.target_role || ''}"`,
      s.mastery_score,
      s.overall_readiness,
      `"${s.status || s.priority || 'Enrolled'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  // Filter current displayed student list
  const currentRawList = selectedCohort ? cohortStudents : deficitStudents;
  const filteredStudents = currentRawList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.branch.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBranch = selectedBranch === 'ALL' || s.branch === selectedBranch;
    return matchesSearch && matchesBranch;
  });

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
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" /> Active Campus Upskilling Cohorts
          </h2>
          <span className="text-xs text-slate-400">Click any cohort card to view enrolled candidates</span>
        </div>

        {activeCohorts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeCohorts.map((cohort) => (
              <div
                key={cohort.id}
                className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between hover:border-indigo-500/50 transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
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

                  <div className="space-y-1.5 text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800/80">
                    <div className="flex justify-between">
                      <span>Instructor:</span>
                      <strong className="text-slate-200">{cohort.instructor}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Enrolled Students:</span>
                      <button
                        onClick={() => handleOpenCohortStudents(cohort)}
                        className="px-2.5 py-0.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer shadow-sm hover:scale-105"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>{cohort.student_count} Candidates</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleOpenCohortStudents(cohort)}
                    className="w-full py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Enrolled Candidates List
                  </button>
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
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" /> AI-Recommended Deficit Programs
          </h2>
          <span className="text-xs text-slate-400">Click to inspect students in deficit</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendedCohorts.map((cohort, idx) => (
            <div
              key={idx}
              className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3 hover:border-amber-500/40 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Gap Intervention</span>
                  <h3 className="font-bold text-base text-white mt-0.5 group-hover:text-amber-300 transition-colors">
                    {cohort.skill_name} Remediation
                  </h3>
                </div>
                <button
                  onClick={() => handleOpenDeficitStudents(cohort)}
                  className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all flex items-center gap-1"
                >
                  <Users className="w-3.5 h-3.5" /> {cohort.students_needing_training} Students in Deficit
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                <span>Avg Cohort Mastery: <strong className="text-amber-400">{cohort.avg_mastery}%</strong></span>
                <button
                  onClick={() => handleOpenDeficitStudents(cohort)}
                  className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1"
                >
                  Inspect Candidates Roster <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enrolled Students & Deficit Roster Modal */}
      {(selectedCohort || deficitSkill) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
          <div className="glass-panel w-full max-w-4xl max-h-[90vh] p-6 rounded-2xl border border-slate-700 flex flex-col justify-between shadow-2xl space-y-4">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                    {selectedCohort ? 'Enrolled Candidate Roster' : 'Identified Skill Deficits'}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {filteredStudents.length} Students Shown
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-white mt-1">{modalTitle}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{modalSubtitle}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    exportStudentsToCSV(
                      filteredStudents,
                      selectedCohort ? `${selectedCohort.title}_Students` : `${deficitSkill?.skill_name}_Deficits`
                    )
                  }
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700"
                >
                  <Download className="w-3.5 h-3.5 text-sky-400" /> Export CSV
                </button>
                <button
                  onClick={() => {
                    setSelectedCohort(null);
                    setDeficitSkill(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by student name, roll ID..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Branch:
                </span>
                {['ALL', 'CSE', 'Lateral and CSE', 'ECE', 'AI&DS', 'CSIT'].map((br) => (
                  <button
                    key={br}
                    onClick={() => setSelectedBranch(br)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 ${
                      selectedBranch === br
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {br}
                  </button>
                ))}
              </div>
            </div>

            {/* Students Table */}
            <div className="flex-1 overflow-y-auto max-h-96 rounded-xl border border-slate-800 bg-slate-950/60">
              {loadingStudents || loadingDeficits ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400 mx-auto mb-2"></div>
                  Loading student roster...
                </div>
              ) : filteredStudents.length > 0 ? (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-extrabold sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Roll Number</th>
                      <th className="px-4 py-3">Student Name</th>
                      <th className="px-4 py-3">Branch</th>
                      <th className="px-4 py-3">CGPA</th>
                      <th className="px-4 py-3">Target Skill Score</th>
                      <th className="px-4 py-3">Overall Readiness</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredStudents.map((st) => (
                      <tr key={st.id || st.student_id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-sky-400">{st.student_id}</td>
                        <td className="px-4 py-3 font-bold text-white">{st.name}</td>
                        <td className="px-4 py-3 text-slate-400">{st.branch}</td>
                        <td className="px-4 py-3 font-bold text-slate-200">{st.cgpa?.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              st.mastery_score >= 60
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : st.mastery_score >= 45
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {st.mastery_score}% ({st.mastery_state || 'CLAIMED'})
                          </span>
                        </td>
                        <td className="px-4 py-3 font-extrabold text-sky-300">{st.overall_readiness}%</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold border border-slate-700">
                            {st.status || st.priority || 'Enrolled'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No matching students found for the current search/filter criteria.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <span className="text-slate-400">
                Institutional cohort intelligence synced with real student records.
              </span>
              <button
                onClick={() => {
                  setSelectedCohort(null);
                  setDeficitSkill(null);
                }}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all"
              >
                Close Roster
              </button>
            </div>

          </div>
        </div>
      )}

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


