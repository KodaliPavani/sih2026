import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Briefcase, Building2, MapPin, DollarSign, CheckCircle2, XCircle, ArrowRight, Sparkles } from 'lucide-react';

export default function JobOpportunitiesPage() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [matchingResult, setMatchingResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/jobs');
      setJobs(res.data);
      if (res.data.length > 0) {
        selectJob(res.data[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const selectJob = async (jobId) => {
    try {
      const job = jobs.find((j) => j.id === jobId) || jobs[0];
      setSelectedJob(job);
      const res = await api.get(`/jobs/${jobId}/eligible-students`);
      // Extract current student's status if present or calculate locally
      setMatchingResult(res.data);
    } catch (e) {
      console.error(e);
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
          <Briefcase className="w-6 h-6 text-sky-400" /> Placement Job Drives & Role Readiness
        </h1>
        <p className="text-xs text-slate-400 mt-1">Role-specific readiness evaluation against company job descriptions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Job Listings Column */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Active Drives ({jobs.length})</h2>
          {jobs.map((job) => (
            <div
              key={job.id}
              onClick={() => selectJob(job.id)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                selectedJob?.id === job.id
                  ? 'bg-sky-950/40 border-sky-500 shadow-lg shadow-sky-500/10'
                  : 'glass-card border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="font-bold text-sm text-white">{job.company_name}</div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-semibold">
                  {job.package_lpa} LPA
                </span>
              </div>
              <div className="text-xs text-sky-300 font-semibold mt-1">{job.role_title}</div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
                <span>CGPA Min: {job.min_cgpa}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Job Requirements & Match Breakdown */}
        {selectedJob && (
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 lg:col-span-2 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">{selectedJob.company_name}</span>
                <h2 className="text-xl font-extrabold text-white mt-0.5">{selectedJob.role_title}</h2>
                <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                  <span>Package: <strong className="text-emerald-400">{selectedJob.package_lpa} LPA</strong></span>
                  <span>Min CGPA: <strong className="text-white">{selectedJob.min_cgpa}</strong></span>
                  <span>Location: <strong className="text-slate-300">{selectedJob.location}</strong></span>
                </div>
              </div>

              <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-sky-500/25 transition-all">
                Apply for Placement Drive
              </button>
            </div>

            {/* Threshold Breakdown Table */}
            <div>
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400" /> Required Skill Threshold Comparison
              </h3>
              <div className="space-y-2.5">
                {[
                  { skill: 'Java', req: 70, student: 86, pass: true, ev: '4 verified' },
                  { skill: 'DSA', req: 65, student: 48, pass: false, ev: '2 assessments' },
                  { skill: 'SQL', req: 60, student: 82, pass: true, ev: '3 verified' },
                  { skill: 'Spring Boot', req: 65, student: 32, pass: false, ev: '1 project' },
                  { skill: 'REST API', req: 60, student: 51, pass: false, ev: '2 coding tests' },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {item.pass ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                      )}
                      <div>
                        <div className="font-bold text-xs text-white">{item.skill}</div>
                        <div className="text-[11px] text-slate-400">{item.ev}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-xs">
                      <div className="text-center">
                        <div className="text-[10px] text-slate-400 uppercase">Required</div>
                        <div className="font-bold text-slate-300">{item.req}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] text-slate-400 uppercase">Your Mastery</div>
                        <div className={`font-extrabold ${item.pass ? 'text-emerald-400' : 'text-rose-400'}`}>{item.student}%</div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        item.pass ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {item.pass ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
