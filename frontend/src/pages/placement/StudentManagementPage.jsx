import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users, Search, Filter, Eye, Award, CheckCircle2, X } from 'lucide-react';

export default function StudentManagementPage() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('ALL');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, [search, branch]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (branch !== 'ALL') params.branch = branch;

      const res = await api.get('/placement/students', { params });
      setStudents(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openStudentModal = async (studentId) => {
    try {
      const res = await api.get(`/placement/students/${studentId}`);
      setSelectedStudent(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400" /> Student Directory & Intelligence
          </h1>
          <p className="text-xs text-slate-400 mt-1">Search, filter, and inspect evidence-backed profiles across 500 students</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-4">
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

      {/* Student List Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
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
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-sky-400">{s.student_id}</td>
                  <td className="py-3 px-4 font-bold text-white">{s.name}</td>
                  <td className="py-3 px-4">{s.branch}</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">{s.cgpa?.toFixed(2)}</td>
                  <td className="py-3 px-4">{s.target_role}</td>
                  <td className="py-3 px-4 font-bold text-sky-400">{s.overall_readiness}%</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      s.readiness_status === 'Ready'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : s.readiness_status === 'Near Ready'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {s.readiness_status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => openStudentModal(s.student_id)}
                      className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 transition-all"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Details Inspection Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-3xl rounded-2xl border border-slate-700 p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs text-sky-400 font-bold uppercase">{selectedStudent.profile.student_id}</span>
                <h2 className="text-xl font-extrabold text-white">{selectedStudent.profile.name}</h2>
                <div className="text-xs text-slate-400 mt-0.5">
                  {selectedStudent.profile.branch} • CGPA: {selectedStudent.profile.cgpa} • Role: {selectedStudent.profile.target_role}
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="p-2 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Skills Breakdown */}
            <div>
              <h3 className="text-sm font-bold text-white mb-2">Tracked Skill Competencies</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {selectedStudent.skills.map((sk, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <div className="font-bold text-white">{sk.skill_name}</div>
                    <div className="text-sky-400 font-extrabold">{sk.mastery_score}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Verified Evidence List */}
            <div>
              <h3 className="text-sm font-bold text-white mb-2">Verified Skill Evidence Records</h3>
              <div className="space-y-2">
                {selectedStudent.evidence.map((ev, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white">{ev.skill_name}</span> - {ev.type}
                      <div className="text-[11px] text-slate-400">{ev.description}</div>
                    </div>
                    <span className="font-extrabold text-emerald-400">{ev.score}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
