import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Send, Building2, Calendar, CheckCircle2, Clock, Briefcase, ArrowRight, Sparkles } from 'lucide-react';

export default function StudentApplicationsPage() {
  const [apps, setApps] = useState([]);
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyingDriveId, setApplyingDriveId] = useState(null);
  const [applyMessage, setApplyMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appsRes, drivesRes] = await Promise.all([
        api.get('/students/me/applications'),
        api.get('/placement/drives'),
      ]);
      setApps(appsRes.data);
      setDrives(drivesRes.data);
    } catch (e) {
      console.error('Failed to load application data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (driveId) => {
    setApplyingDriveId(driveId);
    setApplyMessage('');
    try {
      await api.post(`/students/me/apply?drive_id=${driveId}`);
      setApplyMessage('Application submitted successfully!');
      fetchData();
    } catch (err) {
      setApplyMessage(err.response?.data?.detail || 'Failed to apply.');
    } finally {
      setApplyingDriveId(null);
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
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <Send className="w-6 h-6 text-sky-400" /> Placement Drives & Applications
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Explore institutional recruitment drives, apply directly, and track interview selection stages
        </p>
      </div>

      {applyMessage && (
        <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/30 text-xs text-sky-300 font-bold">
          {applyMessage}
        </div>
      )}

      {/* Available Drives Section */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-sky-400" /> Active Campus Recruitment Drives
        </h2>

        {drives.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {drives.map((d) => {
              const hasApplied = apps.some((a) => a.company_name === d.company_name);

              return (
                <div key={d.id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-base text-white">{d.company_name}</h3>
                        <div className="text-xs text-sky-400 font-semibold">{d.role_title}</div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                        {d.package_lpa} LPA
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800/80">
                      <div className="flex justify-between">
                        <span>Drive Date:</span>
                        <strong className="text-slate-200">{new Date(d.drive_date).toLocaleDateString()}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Registration Deadline:</span>
                        <strong className="text-amber-400">{new Date(d.deadline).toLocaleDateString()}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    {hasApplied ? (
                      <div className="w-full py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold text-center flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Application Submitted
                      </div>
                    ) : (
                      <button
                        onClick={() => handleApply(d.id)}
                        disabled={applyingDriveId === d.id}
                        className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-1.5"
                      >
                        {applyingDriveId === d.id ? 'Submitting...' : 'Apply for Campus Drive'}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel p-6 text-center text-slate-400 text-xs rounded-2xl border border-slate-800">
            No active placement drives scheduled at this moment.
          </div>
        )}
      </div>

      {/* Submitted Applications Stage Tracker */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-400" /> Submitted Applications & Stage Status
        </h2>

        {apps.length > 0 ? (
          <div className="space-y-3">
            {apps.map((app) => (
              <div key={app.id} className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-base text-white">{app.company_name}</div>
                    <div className="text-xs text-sky-400 font-semibold">{app.role_title} • {app.package_lpa} LPA</div>
                    <div className="text-[11px] text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" /> Stage: <strong className="text-slate-200">{app.current_stage}</strong>
                      </span>
                      <span>Applied: {new Date(app.applied_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    app.status === 'Selected' || app.status === 'Shortlisted'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : app.status === 'Rejected'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                  }`}>
                    Status: {app.status}
                  </span>
                  {app.interview_feedback && (
                    <div className="text-[10px] text-slate-400 mt-1">{app.interview_feedback}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel p-6 text-center text-slate-400 text-xs rounded-2xl border border-slate-800">
            You have not submitted applications to any placement drives yet.
          </div>
        )}
      </div>
    </div>
  );
}

