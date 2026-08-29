import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { User, Mail, Phone, Briefcase, FileText, CheckCircle2, ShieldAlert, Save } from 'lucide-react';

export default function StudentProfilePage() {
  const [profile, setProfile] = useState(null);
  const [targetRole, setTargetRole] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/students/me/profile');
      setProfile(res.data);
      setTargetRole(res.data.target_role || 'Java Backend Developer');
      setEmail(res.data.email || '');
      setPhone(res.data.phone || '');
      setResumeUrl(res.data.resume_url || '');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      const res = await api.put('/students/me/profile', {
        target_role: targetRole,
        email: email,
        phone: phone,
        resume_url: resumeUrl
      });
      setProfile(res.data);
      setMsg('Profile updated successfully! Readiness recalculated.');
    } catch (e) {
      setMsg('Failed to update profile.');
    } finally {
      setSaving(false);
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
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <User className="w-6 h-6 text-sky-400" /> Student Profile
        </h1>
        <p className="text-xs text-slate-400 mt-1">Manage your target role and contact details</p>
      </div>

      {msg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {msg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Read-Only Academic Passport Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="text-center pb-4 border-b border-slate-800">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-lg shadow-sky-500/20">
              {profile?.name?.[0] || 'S'}
            </div>
            <h2 className="font-bold text-white text-base mt-3">{profile?.name}</h2>
            <span className="text-xs text-sky-400 font-semibold">{profile?.student_id}</span>
          </div>

          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400">Academic Branch:</span>
              <span className="font-bold text-white">{profile?.branch}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400">CGPA:</span>
              <span className="font-bold text-emerald-400">{profile?.cgpa?.toFixed(2)} / 10</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400">Attendance:</span>
              <span className="font-bold text-sky-400">{profile?.attendance_percent}%</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <span>Student ID and Academic Branch are verified university records and cannot be self-edited.</span>
          </div>
        </div>

        {/* Permitted Profile Edit Form */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 md:col-span-2">
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-sky-400" /> Target Job Role
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="block w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="Java Backend Developer">Java Backend Developer</option>
                <option value="Full Stack Developer">Full Stack Developer</option>
                <option value="Data Analyst">Data Analyst</option>
                <option value="Python Developer">Python Developer</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">Changing your target role recalculates your skill gap breakdown.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-sky-400" /> Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@univ.edu"
                className="block w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-sky-400" /> Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="block w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-sky-400" /> Resume Portfolio Link
              </label>
              <input
                type="url"
                value={resumeUrl}
                onChange={(e) => setResumeUrl(e.target.value)}
                placeholder="https://drive.google.com/your-resume.pdf"
                className="block w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-sky-500/25 transition-all mt-4"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Changes...' : 'Save Profile Updates'}</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
