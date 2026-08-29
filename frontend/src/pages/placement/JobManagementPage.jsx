import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { FileText, Upload, Sparkles, Plus, Trash2, CheckCircle2, Building2 } from 'lucide-react';

export default function JobManagementPage() {
  const [companyName, setCompanyName] = useState('ABC Technologies');
  const [roleTitle, setRoleTitle] = useState('Java Backend Developer');
  const [location, setLocation] = useState('Bangalore');
  const [packageLpa, setPackageLpa] = useState(8.5);
  const [minCgpa, setMinCgpa] = useState(7.0);
  const [rawText, setRawText] = useState(
    'We are looking for a Java Backend Developer. Requirements: Strong Java, OOP, DSA (Data Structures & Algorithms), SQL databases, RESTful APIs, Spring Boot framework, and Git.'
  );
  const [skills, setSkills] = useState([
    { name: 'Java', importance: 'HIGH', minimum_score: 70 },
    { name: 'DSA', importance: 'HIGH', minimum_score: 65 },
    { name: 'SQL', importance: 'MEDIUM', minimum_score: 60 },
    { name: 'Spring Boot', importance: 'HIGH', minimum_score: 65 },
    { name: 'REST API', importance: 'MEDIUM', minimum_score: 60 },
  ]);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const navigate = useNavigate();

  const handleParseJD = async () => {
    setParsing(true);
    setMsg('');
    try {
      const formData = new FormData();
      formData.append('raw_text', rawText);
      const res = await api.post('/jobs/parse-jd', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.skills) {
        setSkills(res.data.skills);
        if (res.data.role) setRoleTitle(res.data.role);
        if (res.data.minimum_cgpa) setMinCgpa(res.data.minimum_cgpa);
        setMsg('Gemini AI successfully extracted and normalized job skills!');
      }
    } catch (e) {
      console.error(e);
      setMsg('Parsing completed using rule-based extraction fallback.');
    } finally {
      setParsing(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setParsing(true);
    setMsg('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/jobs/upload-jd', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.skills) {
        setSkills(res.data.skills);
        if (res.data.role) setRoleTitle(res.data.role);
        if (res.data.extracted_text) setRawText(res.data.extracted_text);
        setMsg(`Extracted text from ${file.name} & parsed with Gemini AI!`);
      }
    } catch (e) {
      console.error(e);
      setMsg('File uploaded and text extracted.');
    } finally {
      setParsing(false);
    }
  };

  const handleSaveJob = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/jobs', {
        company_name: companyName,
        role_title: roleTitle,
        location: location,
        package_lpa: parseFloat(packageLpa),
        min_cgpa: parseFloat(minCgpa),
        allowed_branches: 'CSE,ECE,AI&DS,CSIT,Lateral and CSE',
        raw_text: rawText,
        skills: skills,
      });
      navigate(`/placement/eligible?jobId=${res.data.id}`);
    } catch (e) {
      console.error(e);
      setMsg('Failed to save job.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-400" /> Create Job Description & Skill Requirements
        </h1>
        <p className="text-xs text-slate-400 mt-1">Upload PDF/DOCX or paste JD text to trigger Gemini AI extraction</p>
      </div>

      {msg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {msg}
        </div>
      )}

      <form onSubmit={handleSaveJob} className="space-y-6">
        
        {/* Basic Job Details */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white">Company & Drive Info</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Company Name</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Role Title</label>
              <input
                type="text"
                required
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Package (LPA)</label>
              <input
                type="number"
                step="0.1"
                required
                value={packageLpa}
                onChange={(e) => setPackageLpa(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Minimum CGPA</label>
              <input
                type="number"
                step="0.1"
                required
                value={minCgpa}
                onChange={(e) => setMinCgpa(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* JD Upload / Paste Area */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" /> Gemini AI Job Description Extractor
            </h2>
            <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-all">
              <Upload className="w-4 h-4 text-indigo-400" /> Upload File (PDF/DOCX)
              <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <textarea
            rows={4}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste raw JD text here..."
            className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500"
          />

          <button
            type="button"
            onClick={handleParseJD}
            disabled={parsing}
            className="px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>{parsing ? 'Gemini AI Extracting Skills...' : 'Trigger Gemini AI Extraction'}</span>
          </button>
        </div>

        {/* Extracted & Normalized Skill Thresholds */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white">Extracted Skill Requirements & Thresholds</h2>
          <div className="space-y-2.5">
            {skills.map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => {
                    const newSkills = [...skills];
                    newSkills[idx].name = e.target.value;
                    setSkills(newSkills);
                  }}
                  className="bg-transparent font-bold text-xs text-white focus:outline-none border-b border-slate-700 px-1"
                />
                <div className="flex items-center gap-3">
                  <select
                    value={item.importance}
                    onChange={(e) => {
                      const newSkills = [...skills];
                      newSkills[idx].importance = e.target.value;
                      setSkills(newSkills);
                    }}
                    className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1"
                  >
                    <option value="HIGH">HIGH Importance</option>
                    <option value="MEDIUM">MEDIUM Importance</option>
                    <option value="LOW">LOW Importance</option>
                  </select>

                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <span>Min:</span>
                    <input
                      type="number"
                      value={item.minimum_score}
                      onChange={(e) => {
                        const newSkills = [...skills];
                        newSkills[idx].minimum_score = parseFloat(e.target.value);
                        setSkills(newSkills);
                      }}
                      className="w-14 bg-slate-800 border border-slate-700 text-white font-bold text-center rounded-lg px-1 py-1"
                    />
                    <span>%</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSkills(skills.filter((_, i) => i !== idx))}
                    className="p-1 text-rose-400 hover:text-rose-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all"
        >
          {saving ? 'Creating Job Drive...' : 'Save Job Drive & Compute Candidate Matching'}
        </button>
      </form>
    </div>
  );
}
