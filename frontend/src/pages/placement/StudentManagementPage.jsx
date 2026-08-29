import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Users,
  Search,
  Filter,
  Eye,
  Award,
  CheckCircle2,
  X,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Briefcase,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export default function StudentManagementPage() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState('');

  useEffect(() => {
    fetchStudents();
  }, [search, branch, statusFilter]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (branch !== 'ALL') params.branch = branch;
      if (statusFilter !== 'ALL' && statusFilter !== 'FACULTY_VERIFIED') {
        params.readiness_status = statusFilter;
      }

      const res = await api.get('/placement/students', { params });
      let data = res.data || [];
      if (statusFilter === 'FACULTY_VERIFIED') {
        data = data.filter((s) => s.has_faculty_verification);
      }
      setStudents(data);
    } catch (e) {
      console.error('Failed to load students:', e);
    } finally {
      setLoading(false);
    }
  };

  const openStudentModal = async (studentId) => {
    try {
      setModalLoading(true);
      setSelectedStudent(null);
      setSyncSuccessMsg('');
      const res = await api.get(`/placement/students/${studentId}`);
      setSelectedStudent(res.data);
    } catch (e) {
      console.error('Failed to load student details:', e);
    } finally {
      setModalLoading(false);
    }
  };

  const handleManualSync = async (studentId) => {
    try {
      setSyncing(true);
      setSyncSuccessMsg('');
      const res = await api.post(`/placement/students/${studentId}/sync`);
      setSyncSuccessMsg(
        `State synchronized! New Readiness: ${res.data.sync_details.new_readiness}% (${res.data.sync_details.readiness_status})`
      );
      // Re-fetch details and student list
      const detailsRes = await api.get(`/placement/students/${studentId}`);
      setSelectedStudent(detailsRes.data);
      fetchStudents();
    } catch (e) {
      console.error('Failed to sync student:', e);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400" /> Student Directory & Intelligence
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time candidate competency registry, faculty verification tracking, and job eligibility across 500 students
          </p>
        </div>
        <button
          onClick={fetchStudents}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-bold text-slate-200 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Directory
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by Student ID (e.g. 2300030042), Name, or Target Role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="px-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
          >
            <option value="ALL">All Branches (500 Students)</option>
            <option value="CSE">CSE (120 Students)</option>
            <option value="Lateral and CSE">Lateral & CSE (80 Students)</option>
            <option value="ECE">ECE (100 Students)</option>
            <option value="AI&DS">AI&DS (100 Students)</option>
            <option value="CSIT">CSIT (100 Students)</option>
          </select>
        </div>

        {/* Quick Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 border-t border-slate-800/80">
          <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter Status:
          </span>
          {[
            { id: 'ALL', label: 'All Candidates' },
            { id: 'Ready', label: 'Ready (>= 75%)', color: 'emerald' },
            { id: 'Near Ready', label: 'Near Ready (60-74%)', color: 'amber' },
            { id: 'Needs Improvement', label: 'Needs Improvement (< 60%)', color: 'rose' },
            { id: 'FACULTY_VERIFIED', label: '🎓 Faculty Endorsed', color: 'purple' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Student List Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Branch</th>
                <th className="py-3 px-4">CGPA</th>
                <th className="py-3 px-4">Target Role</th>
                <th className="py-3 px-4">Readiness</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Verification</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-400"></div>
                      <span>Loading candidate registry...</span>
                    </div>
                  </td>
                </tr>
              ) : students.length > 0 ? (
                students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-sky-400">{s.student_id}</td>
                    <td className="py-3 px-4 font-bold text-white">{s.name}</td>
                    <td className="py-3 px-4">{s.branch}</td>
                    <td className="py-3 px-4 font-bold text-emerald-400">{s.cgpa?.toFixed(2)}</td>
                    <td className="py-3 px-4 text-slate-300">{s.target_role}</td>
                    <td className="py-3 px-4 font-bold text-sky-400">{s.overall_readiness}%</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          s.readiness_status === 'Ready'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : s.readiness_status === 'Near Ready'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {s.readiness_status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {s.has_faculty_verification ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          <Award className="w-3 h-3 text-purple-400" /> Faculty Verified
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">Standard</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openStudentModal(s.student_id)}
                        className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 transition-all inline-flex items-center gap-1 text-[11px] font-bold"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Profile
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400 text-xs">
                    No candidates found matching the active filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Details Inspection Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-4xl rounded-2xl border border-slate-700 p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-sky-400 font-mono font-bold uppercase">
                    {selectedStudent.profile.student_id}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      selectedStudent.profile.readiness_status === 'Ready'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : selectedStudent.profile.readiness_status === 'Near Ready'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}
                  >
                    {selectedStudent.profile.readiness_status} ({selectedStudent.profile.overall_readiness}%)
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-white mt-1">
                  {selectedStudent.profile.name}
                </h2>
                <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                  <span>{selectedStudent.profile.branch}</span>
                  <span>•</span>
                  <span>CGPA: <strong className="text-emerald-400">{selectedStudent.profile.cgpa}</strong></span>
                  <span>•</span>
                  <span>Target Role: <strong className="text-indigo-300">{selectedStudent.profile.target_role}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleManualSync(selectedStudent.profile.student_id)}
                  disabled={syncing}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Syncing...' : 'Sync Intelligence'}
                </button>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {syncSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {syncSuccessMsg}
              </div>
            )}

            {/* Skills Competency Breakdown */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" /> Evidence-Backed Skill Passport
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {selectedStudent.skills.map((sk, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-white text-xs">{sk.skill_name}</span>
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${
                          sk.mastery_state === 'MASTERED' || sk.mastery_state === 'VERIFIED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {sk.mastery_state}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-extrabold text-sky-400">{sk.mastery_score}%</span>
                      <span className="text-[10px] text-slate-500">{sk.confidence} Conf.</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Company / Drive Eligibility */}
            {selectedStudent.job_eligibility && selectedStudent.job_eligibility.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-emerald-400" /> Campus Drive Eligibility Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedStudent.job_eligibility.map((job, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-white">{job.company_name}</div>
                        <div className="text-[11px] text-slate-400">{job.role_title}</div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            job.status === 'ELIGIBLE'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : job.status === 'NEAR_READY'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {job.status}
                        </span>
                        <div className="text-[10px] text-sky-400 font-bold mt-0.5">
                          {job.readiness_score}% Match
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Verified Evidence Records */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" /> Verified Evidence Records
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedStudent.evidence && selectedStudent.evidence.length > 0 ? (
                  selectedStudent.evidence.map((ev, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{ev.skill_name}</span>
                          <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                            {ev.type}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {ev.source} {ev.description ? `• ${ev.description}` : ''}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-extrabold text-emerald-400 text-sm">{ev.score}%</span>
                        <div className="text-[10px] text-slate-500">Verified</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500 p-3 rounded-xl bg-slate-900 border border-slate-800">
                    No verified evidence records on file.
                  </div>
                )}
              </div>
            </div>

            {/* Progression History */}
            {selectedStudent.mastery_history && selectedStudent.mastery_history.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-sky-400" /> Competency Progression History
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedStudent.mastery_history.map((h, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-white">{h.skill_name}</span>
                        <span className="text-slate-400 text-[11px] ml-2">via {h.evidence_source}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">{h.old_score}%</span>
                        <span className="text-slate-500">➔</span>
                        <span className="text-emerald-400 font-bold">{h.new_score}%</span>
                        <span className="text-emerald-400 font-extrabold text-[10px]">
                          (+{h.change_delta})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
