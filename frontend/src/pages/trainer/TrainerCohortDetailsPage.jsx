import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import {
  GraduationCap,
  Users,
  BookOpen,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowLeft,
  Search,
  Filter,
  Download,
  Award,
  CheckCircle,
  Clock,
  TrendingUp,
  X,
  Edit2,
  FileCheck,
  ShieldCheck
} from 'lucide-react';

export default function TrainerCohortDetailsPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('ALL');

  // Evaluation Modal
  const [evaluatingStudent, setEvaluatingStudent] = useState(null);
  const [evalScore, setEvalScore] = useState(85);
  const [evalFeedback, setEvalFeedback] = useState('Satisfactory completion of practical laboratory tasks & project milestone.');
  const [submittingEval, setSubmittingEval] = useState(false);
  const [evalSuccessMsg, setEvalSuccessMsg] = useState('');

  // Bulk Endorsement State
  const [bulkEndorsing, setBulkEndorsing] = useState(false);
  const [bulkMsg, setBulkMsg] = useState('');

  useEffect(() => {
    fetchCohort();
  }, [id]);

  const fetchCohort = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/trainer/cohorts/${id}`);
      setData(res.data);
    } catch (e) {
      console.error('Failed to load cohort details:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluateStudent = async (e) => {
    e.preventDefault();
    if (!evaluatingStudent) return;
    setSubmittingEval(true);
    setEvalSuccessMsg('');
    try {
      const res = await api.post(`/trainer/cohorts/${id}/evaluate-student`, {
        student_id: evaluatingStudent.student_id,
        post_training_score: parseFloat(evalScore),
        feedback: evalFeedback
      });
      setEvalSuccessMsg(`Verified evidence issued! ${res.data.student_name}'s skill mastery boosted to ${res.data.new_mastery}% (Readiness: ${res.data.new_overall_readiness}%).`);
      setTimeout(() => {
        setEvaluatingStudent(null);
        setEvalSuccessMsg('');
        fetchCohort();
      }, 1800);
    } catch (err) {
      console.error('Failed to evaluate student:', err);
    } finally {
      setSubmittingEval(false);
    }
  };

  const handleBulkEndorse = async () => {
    if (!data?.students || data.students.length === 0) return;
    if (!window.confirm(`Batch endorse and issue Faculty Verification evidence for all ${data.students.length} students in this cohort?`)) return;

    setBulkEndorsing(true);
    setBulkMsg('');
    try {
      const evaluations = data.students.map((s) => ({
        student_id: s.student_id,
        post_training_score: Math.max(s.current_mastery_score + 15, 75.0),
        feedback: `Completed ${data.cohort.title} practical curriculum.`
      }));

      const res = await api.post(`/trainer/cohorts/${id}/bulk-endorse`, {
        evaluations
      });
      setBulkMsg(res.data.message);
      fetchCohort();
      setTimeout(() => setBulkMsg(''), 4000);
    } catch (err) {
      console.error('Failed bulk endorsement:', err);
    } finally {
      setBulkEndorsing(false);
    }
  };

  const exportCSV = () => {
    if (!data?.students || data.students.length === 0) return;
    const headers = ['Roll Number', 'Name', 'Branch', 'CGPA', 'Pre-Training Score', 'Current Mastery', 'Post-Training Score', 'Attendance %', 'Completion %', 'Faculty Verified'];
    const rows = data.students.map((s) => [
      `"${s.student_id}"`,
      `"${s.name}"`,
      `"${s.branch}"`,
      s.cgpa,
      s.pre_training_score,
      s.current_mastery_score,
      s.post_training_score || 'N/A',
      `${s.attendance_pct}%`,
      `${s.completion_pct}%`,
      s.faculty_verified ? 'YES' : 'NO'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${data.cohort.title}_Roster.csv`);
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

  const cohort = data?.cohort || {};
  const students = data?.students || [];

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.branch.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBranch = selectedBranch === 'ALL' || s.branch === selectedBranch;
    return matchesSearch && matchesBranch;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Back Button & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/trainer/dashboard"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider">
                {cohort.skill_name} Module
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {cohort.status}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white mt-0.5">{cohort.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold transition-all"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" /> Export CSV
          </button>
          <button
            onClick={handleBulkEndorse}
            disabled={bulkEndorsing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Award className="w-4 h-4" />
            {bulkEndorsing ? 'Endorsing Candidates...' : 'Batch Endorse All (1.8x)'}
          </button>
        </div>
      </div>

      {bulkMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {bulkMsg}
        </div>
      )}

      {/* Cohort Details Banner */}
      <div className="glass-card p-5 rounded-2xl border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-slate-400">Assigned Instructor:</span>
          <div className="font-extrabold text-white mt-0.5">{cohort.instructor}</div>
        </div>
        <div>
          <span className="text-slate-400">Target Recruitment Role:</span>
          <div className="font-extrabold text-indigo-400 mt-0.5">{cohort.target_role || 'Software Engineer'}</div>
        </div>
        <div>
          <span className="text-slate-400">Total Enrolled Candidates:</span>
          <div className="font-extrabold text-sky-400 mt-0.5">{students.length} Students</div>
        </div>
        <div>
          <span className="text-slate-400">Evidence Weight Issued:</span>
          <div className="font-extrabold text-purple-400 mt-0.5">1.8x (Faculty Verification)</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
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

      {/* Enrolled Students Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/60">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-extrabold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Roll Number</th>
                <th className="px-4 py-3.5">Candidate Name</th>
                <th className="px-4 py-3.5">Branch</th>
                <th className="px-4 py-3.5">CGPA</th>
                <th className="px-4 py-3.5">Baseline $\to$ Current Score</th>
                <th className="px-4 py-3.5">Attendance</th>
                <th className="px-4 py-3.5">Completion</th>
                <th className="px-4 py-3.5">Verification</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredStudents.map((st) => (
                <tr key={st.enrollment_id || st.student_id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-sky-400">{st.student_id}</td>
                  <td className="px-4 py-3 font-bold text-white">
                    <div>{st.name}</div>
                    <div className="text-[10px] text-slate-400 font-normal">Readiness: {st.overall_readiness}%</div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{st.branch}</td>
                  <td className="px-4 py-3 font-bold text-slate-200">{st.cgpa?.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="text-slate-400">{st.pre_training_score}%</span>
                      <span className="text-slate-500">$\to$</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          st.current_mastery_score >= 60
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {st.current_mastery_score}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-extrabold text-emerald-400">{st.attendance_pct}%</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-20">
                      <div className="text-[10px] text-slate-400 mb-0.5">{st.completion_pct}%</div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${st.completion_pct}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {st.faculty_verified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        <ShieldCheck className="w-3 h-3 text-purple-400" /> Verified (1.8x)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold text-slate-400 bg-slate-900 border border-slate-800">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        setEvaluatingStudent(st);
                        setEvalScore(st.post_training_score || Math.max(st.current_mastery_score + 20, 80));
                      }}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 text-xs font-bold transition-all inline-flex items-center gap-1"
                    >
                      <Award className="w-3.5 h-3.5" /> Grade & Endorse
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Individual Evaluation Modal */}
      {evaluatingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
          <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border border-slate-700 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider">
                  Faculty Performance Evaluation
                </span>
                <h3 className="font-extrabold text-base text-white mt-0.5">
                  Evaluate {evaluatingStudent.name} ({evaluatingStudent.student_id})
                </h3>
              </div>
              <button
                onClick={() => setEvaluatingStudent(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {evalSuccessMsg ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold text-center space-y-2">
                <CheckCircle className="w-8 h-8 mx-auto text-emerald-400" />
                <div>{evalSuccessMsg}</div>
              </div>
            ) : (
              <form onSubmit={handleEvaluateStudent} className="space-y-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="text-slate-400">Baseline Score:</span>
                    <div className="font-bold text-slate-200 mt-0.5">{evaluatingStudent.pre_training_score}%</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Attendance:</span>
                    <div className="font-bold text-emerald-400 mt-0.5">{evaluatingStudent.attendance_pct}%</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Target Skill:</span>
                    <div className="font-bold text-indigo-300 mt-0.5">{cohort.skill_name}</div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1 flex justify-between">
                    <span>Post-Training Assessment / Lab Score</span>
                    <strong className="text-indigo-400 text-sm font-extrabold">{evalScore}%</strong>
                  </label>
                  <input
                    type="range"
                    min="40"
                    max="100"
                    step="1"
                    value={evalScore}
                    onChange={(e) => setEvalScore(e.target.value)}
                    className="w-full accent-indigo-500 bg-slate-900 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>40% (Basic)</span>
                    <span>70% (Proficient)</span>
                    <span>100% (Mastered)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Faculty Endorsement Feedback</label>
                  <textarea
                    rows={3}
                    value={evalFeedback}
                    onChange={(e) => setEvalFeedback(e.target.value)}
                    placeholder="Enter observation notes on coding labs, assignment completion, or project defense..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px]">
                  <strong>System Impact:</strong> Submitting this evaluation will record a verified <strong>Faculty Verification (1.8x Weight)</strong> evidence item for {cohort.skill_name}, boosting the student's deterministic mastery and placement readiness!
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEvaluatingStudent(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingEval}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
                  >
                    <Award className="w-3.5 h-3.5" />
                    {submittingEval ? 'Issuing Evidence...' : 'Submit Faculty Endorsement'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
