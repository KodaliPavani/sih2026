import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Briefcase,
  Users,
  Calendar,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  X,
  Edit,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function DriveManagementPage() {
  const [drives, setDrives] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingApps, setLoadingApps] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newJobId, setNewJobId] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDriveDate, setNewDriveDate] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchInitial();
  }, []);

  const fetchInitial = async () => {
    try {
      setLoading(true);
      const [drivesRes, jobsRes] = await Promise.all([
        api.get('/placement/drives'),
        api.get('/jobs')
      ]);
      setDrives(drivesRes.data);
      setJobs(jobsRes.data);
      if (jobsRes.data.length > 0 && !newJobId) {
        setNewJobId(jobsRes.data[0].id);
      }
      if (drivesRes.data.length > 0) {
        handleSelectDrive(drivesRes.data[0]);
      }
    } catch (e) {
      console.error('Failed to load drives:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDrive = async (drive) => {
    setSelectedDrive(drive);
    try {
      setLoadingApps(true);
      const res = await api.get(`/placement/drives/${drive.id}/applications`);
      setApplications(res.data);
    } catch (e) {
      console.error('Failed to load applications:', e);
    } finally {
      setLoadingApps(false);
    }
  };

  const handleUpdateStatus = async (appId, newStatus, currentStage) => {
    try {
      await api.put(`/placement/applications/${appId}/status`, {
        status: newStatus,
        current_stage: currentStage
      });
      // Refresh applications
      if (selectedDrive) {
        handleSelectDrive(selectedDrive);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleCreateDrive = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/placement/drives', {
        job_id: newJobId,
        title: newTitle,
        drive_date: newDriveDate || new Date().toISOString().split('T')[0],
        deadline: newDeadline || new Date().toISOString().split('T')[0]
      });
      setShowCreateModal(false);
      setNewTitle('');
      fetchInitial();
    } catch (err) {
      console.error('Failed to create drive:', err);
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

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-indigo-400" /> Placement Drive Management & Candidate Shortlisting
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure campus recruitment drives, review student applications, and advance candidate stages
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Schedule New Drive
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Drives List */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            Active Placement Drives ({drives.length})
          </h2>

          <div className="space-y-2.5">
            {drives.map((d) => (
              <div
                key={d.id}
                onClick={() => handleSelectDrive(d)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedDrive?.id === d.id
                    ? 'glass-panel bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-500/10'
                    : 'glass-card border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-white">{d.company_name}</h3>
                    <div className="text-xs text-indigo-400 font-semibold">{d.role_title}</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {d.package_lpa} LPA
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
                  <span>Drive Date: {new Date(d.drive_date).toLocaleDateString()}</span>
                  <span className="text-sky-400 font-bold">{d.applications_count} Applicants</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 2 Cols: Applicants & Stage Shortlist Table */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 lg:col-span-2 space-y-4">
          {selectedDrive ? (
            <>
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    {selectedDrive.company_name} • {selectedDrive.role_title}
                  </span>
                  <h2 className="text-lg font-black text-white mt-0.5">
                    Candidate Applicants & Stage Progression
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Drive Date: {new Date(selectedDrive.drive_date).toLocaleDateString()} • Package: {selectedDrive.package_lpa} LPA
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                  {applications.length} Registered
                </span>
              </div>

              {loadingApps ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400 mx-auto mb-2"></div>
                  Loading candidate applications...
                </div>
              ) : applications.length > 0 ? (
                <div className="space-y-3">
                  {applications.map((app) => (
                    <div key={app.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sky-400 text-xs">{app.student_id}</span>
                          <span className="font-bold text-sm text-white">{app.name}</span>
                          <span className="text-xs text-slate-400">({app.branch} • CGPA: {app.cgpa})</span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-3">
                          <span>Readiness: <strong className="text-emerald-400">{app.readiness}%</strong></span>
                          <span>Stage: <strong className="text-indigo-300">{app.current_stage}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={app.status}
                          onChange={(e) => handleUpdateStatus(app.id, e.target.value, app.current_stage)}
                          className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 font-semibold"
                        >
                          <option value="Applied">Applied</option>
                          <option value="Shortlisted">Shortlisted</option>
                          <option value="Technical Assessment">Technical Assessment</option>
                          <option value="Interview">Interview</option>
                          <option value="Selected">Selected</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No students have applied to this placement drive yet.
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              Select a placement drive from the left to view applicants.
            </div>
          )}
        </div>
      </div>

      {/* Schedule Drive Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-400" /> Schedule Campus Placement Drive
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDrive} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Associated Job Description</label>
                <select
                  value={newJobId}
                  onChange={(e) => setNewJobId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-semibold"
                >
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.company_name} - {j.role_title} ({j.package_lpa} LPA)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Drive Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. ABC Technologies 2026 Campus Drive"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Drive Date</label>
                  <input
                    type="date"
                    value={newDriveDate}
                    onChange={(e) => setNewDriveDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Registration Deadline</label>
                  <input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100"
                    required
                  />
                </div>
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
                  {creating ? 'Scheduling Drive...' : 'Schedule Drive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
