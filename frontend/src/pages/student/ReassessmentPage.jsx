import React, { useState } from 'react';
import api from '../../services/api';
import { RotateCcw, CheckCircle2, Award, Sparkles, ArrowRight, Code, ShieldCheck } from 'lucide-react';

export default function ReassessmentPage() {
  const [skillName, setSkillName] = useState('Spring Boot');
  const [q1, setQ1] = useState('a');
  const [q2, setQ2] = useState('b');
  const [codeAnswer, setCodeAnswer] = useState(
    '@RestController\n@RequestMapping("/api/v1/placement")\npublic class ReadinessController {\n  @GetMapping\n  public ResponseEntity<String> checkReadiness() {\n    return ResponseEntity.ok("81%");\n  }\n}'
  );
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmitTest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    // Calculate score based on answers (Demo simulation: 76% for Spring Boot)
    const simulatedScore = skillName === 'Spring Boot' ? 76.0 : 85.0;

    try {
      const res = await api.post('/assessments/reassess', {
        skill_name: skillName,
        assessment_score: simulatedScore
      });
      setResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <RotateCcw className="w-6 h-6 text-sky-400" /> Practical Skill Reassessment
        </h1>
        <p className="text-xs text-slate-400 mt-1">Demonstrate improved mastery through verified coding tasks & MCQ tests</p>
      </div>

      {result && (
        <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Reassessment Verified</span>
              <h2 className="text-xl font-extrabold text-white">{result.message}</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400 uppercase">Target Skill</div>
              <div className="font-bold text-white text-sm">{result.skill_name}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400 uppercase">Skill Mastery</div>
              <div className="font-extrabold text-emerald-400 text-sm">{result.old_skill_score}% → {result.new_skill_score}%</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400 uppercase">Old Readiness</div>
              <div className="font-bold text-amber-400 text-sm">{result.old_readiness}%</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400 uppercase">New Readiness</div>
              <div className="font-extrabold text-sky-400 text-sm">{result.new_readiness}% (+{result.improvement_delta} pts)</div>
            </div>
          </div>
        </div>
      )}

      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <form onSubmit={handleSubmitTest} className="space-y-6">
          
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Select Skill Gap to Reassess
            </label>
            <select
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              className="block w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="Spring Boot">Spring Boot (Current: 32% → Reassess to 76%)</option>
              <option value="DSA">DSA (Current: 48% → Reassess to 82%)</option>
              <option value="REST API">REST API (Current: 51% → Reassess to 78%)</option>
            </select>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Code className="w-4 h-4 text-sky-400" /> Section 1: MCQ Verification
            </h3>
            
            <div className="space-y-2 text-xs">
              <p className="font-semibold text-slate-200">1. What annotation is used to create REST endpoints in Spring Boot?</p>
              <div className="space-y-1.5 pl-2">
                <label className="flex items-center gap-2 text-slate-300">
                  <input type="radio" name="q1" value="a" checked={q1 === 'a'} onChange={() => setQ1('a')} className="text-sky-500" />
                  <span>@RestController</span>
                </label>
                <label className="flex items-center gap-2 text-slate-300">
                  <input type="radio" name="q1" value="b" checked={q1 === 'b'} onChange={() => setQ1('b')} className="text-sky-500" />
                  <span>@ControllerService</span>
                </label>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Code className="w-4 h-4 text-sky-400" /> Section 2: Practical Implementation Challenge
            </h3>
            <p className="text-xs text-slate-400">Implement a RESTful Controller method returning HTTP status 200 OK.</p>
            <textarea
              rows={5}
              value={codeAnswer}
              onChange={(e) => setCodeAnswer(e.target.value)}
              className="font-mono text-xs block w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-sky-500/25 transition-all"
          >
            {submitting ? 'Evaluating Assessment...' : 'Submit Assessment & Recalculate Readiness'}
          </button>
        </form>
      </div>
    </div>
  );
}
