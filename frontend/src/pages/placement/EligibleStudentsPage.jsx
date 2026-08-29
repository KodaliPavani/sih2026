import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { UserCheck, Download, Filter, Search, CheckCircle2, AlertTriangle, XCircle, FileSpreadsheet } from 'lucide-react';

export default function EligibleStudentsPage() {
  const [searchParams] = useSearchParams();
  const jobIdParam = searchParams.get('jobId');

  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(jobIdParam || '');
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('ELIGIBLE'); // 'ELIGIBLE', 'NEAR_READY', 'NOT_ELIGIBLE'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await api.get('/jobs');
      setJobs(res.data);
      if (res.data.length > 0) {
        const jId = jobIdParam || res.data[0].id;
        setSelectedJobId(jId);
        fetchEligibleStudents(jId);
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const fetchEligibleStudents = async (jobId) => {
    try {
      setLoading(true);
      const res = await api.get(`/jobs/${jobId}/eligible-students`);
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!data) return;
    const list =
      activeTab === 'ELIGIBLE'
        ? data.eligible
        : activeTab === 'NEAR_READY'
        ? data.near_ready
        : data.not_eligible;

    let csvContent = 'data:text/csv;charset=utf-8,Student ID,Name,Branch,CGPA,Readiness %,Eligibility Status,Failed Skills\n';

    list.forEach((s) => {
      const failed = (s.failed_skills || []).join('; ');
      csvContent += `"${s.student_id}","${s.name}","${s.branch}",${s.cgpa},${s.overall_readiness},"${s.eligibility_status}","${failed}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Candidate_List_${data.company_name}_${activeTab}.csv`);
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

  const currentList = data
    ? activeTab === 'ELIGIBLE'
      ? data.eligible
      : activeTab === 'NEAR_READY'
      ? data.near_ready
      : data.not_eligible
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-indigo-400" /> JD Candidate Eligibility Matching
          </h1>
          <p className="text-xs text-slate-400 mt-1">Deterministic rule-based candidate eligibility matching across 500 students</p>
        </div>

        {data && (
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Candidate List to CSV
          </button>
        )}
      </div>

      {/* Select Job Drive Selector */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
        <label className="text-xs font-bold text-slate-300 uppercase shrink-0">Select Drive:</label>
        <select
          value={selectedJobId}
          onChange={(e) => {
            setSelectedJobId(e.target.value);
            fetchEligibleStudents(e.target.value);
          }}
          className="block w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-bold text-xs focus:ring-2 focus:ring-indigo-500"
        >
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.company_name} - {j.role_title} ({j.package_lpa} LPA)
            </option>
          ))}
        </select>
      </div>

      {data && (
        <div className="space-y-4">
          {/* Summary Tabs */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setActiveTab('ELIGIBLE')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                activeTab === 'ELIGIBLE'
                  ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-500/10'
                  : 'glass-card border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase">ELIGIBLE</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-extrabold text-white mt-1">{data.summary.eligible_count}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Meets all academic & skill thresholds</div>
            </button>

            <button
              onClick={() => setActiveTab('NEAR_READY')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                activeTab === 'NEAR_READY'
                  ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-500/10'
                  : 'glass-card border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase">NEAR READY</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-extrabold text-white mt-1">{data.summary.near_ready_count}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">1-2 minor skill gaps</div>
            </button>

            <button
              onClick={() => setActiveTab('NOT_ELIGIBLE')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                activeTab === 'NOT_ELIGIBLE'
                  ? 'bg-rose-950/40 border-rose-500 shadow-lg shadow-rose-500/10'
                  : 'glass-card border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-400 uppercase">NOT ELIGIBLE</span>
                <XCircle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-extrabold text-white mt-1">{data.summary.not_eligible_count}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Significant gaps or academic fail</div>
            </button>
          </div>

          {/* Table of Candidates */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Student ID</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Branch</th>
                    <th className="py-3 px-4">CGPA</th>
                    <th className="py-3 px-4">Role Readiness</th>
                    <th className="py-3 px-4">Eligibility Reason / Gaps</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {currentList.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-sky-400">{s.student_id}</td>
                      <td className="py-3 px-4 font-bold text-white">{s.name}</td>
                      <td className="py-3 px-4">{s.branch}</td>
                      <td className="py-3 px-4 font-bold text-emerald-400">{s.cgpa?.toFixed(2)}</td>
                      <td className="py-3 px-4 font-bold text-sky-400">{s.overall_readiness}%</td>
                      <td className="py-3 px-4">
                        {s.failed_skills && s.failed_skills.length > 0 ? (
                          <span className="text-rose-400 font-semibold">Gaps: {s.failed_skills.join(', ')}</span>
                        ) : (
                          <span className="text-emerald-400 font-semibold">{s.reason}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
