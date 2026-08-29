import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { RotateCcw, CheckCircle2, Award, Sparkles, ArrowRight, Code, ShieldCheck, HelpCircle } from 'lucide-react';

export default function ReassessmentPage() {
  const [availableSkills, setAvailableSkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [codeAnswer, setCodeAnswer] = useState(
    '// Practical Implementation Code\npublic class Solution {\n  public static void main(String[] args) {\n    System.out.println("Verified Solution");\n  }\n}'
  );
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchStudentSkills();
  }, []);

  const fetchStudentSkills = async () => {
    try {
      const res = await api.get('/students/me/skills');
      setAvailableSkills(res.data);
      if (res.data.length > 0) {
        const initialSkill = res.data[0].skill_name;
        setSelectedSkill(initialSkill);
        fetchQuestions(initialSkill);
      }
    } catch (e) {
      console.error('Failed to load skills:', e);
    }
  };

  const fetchQuestions = async (skillName) => {
    try {
      setLoadingQuestions(true);
      const res = await api.get(`/assessments/questions?skill_name=${encodeURIComponent(skillName)}`);
      setQuestions(res.data);
      // Initialize empty answers map
      const initialMap = {};
      res.data.forEach((q) => {
        initialMap[q.id] = 'a';
      });
      setAnswers(initialMap);

      // Default code boilerplate per skill
      if (skillName.includes('Spring')) {
        setCodeAnswer(
          '@RestController\n@RequestMapping("/api/v1/resource")\npublic class ResourceController {\n  @GetMapping("/{id}")\n  public ResponseEntity<String> getResource(@PathVariable String id) {\n    return ResponseEntity.ok("Resource Data for ID: " + id);\n  }\n}'
        );
      } else if (skillName.includes('SQL')) {
        setCodeAnswer(
          'SELECT s.name, s.branch, AVG(ss.mastery_score) AS avg_score\nFROM students s\nJOIN student_skills ss ON s.id = ss.student_id\nGROUP BY s.id, s.name, s.branch\nHAVING AVG(ss.mastery_score) >= 75.0\nORDER BY avg_score DESC;'
        );
      } else if (skillName.includes('DSA')) {
        setCodeAnswer(
          'public class TreeNode {\n  int val;\n  TreeNode left, right;\n  TreeNode(int x) { val = x; }\n}\npublic int maxDepth(TreeNode root) {\n  if (root == null) return 0;\n  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));\n}'
        );
      } else {
        setCodeAnswer(
          '// Complete your solution below\npublic class Solution {\n  public void execute() {\n    // Implementation\n  }\n}'
        );
      }
    } catch (e) {
      console.error('Failed to fetch assessment questions:', e);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleSkillChange = (e) => {
    const newSkill = e.target.value;
    setSelectedSkill(newSkill);
    setResult(null);
    fetchQuestions(newSkill);
  };

  const handleOptionSelect = (questionId, optionKey) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionKey
    }));
  };

  const handleSubmitTest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    const formattedAnswers = Object.entries(answers).map(([qId, opt]) => ({
      question_id: qId,
      selected_option: opt
    }));

    try {
      const res = await api.post('/assessments/reassess', {
        skill_name: selectedSkill,
        answers: formattedAnswers,
        practical_code: codeAnswer
      });
      setResult(res.data);
    } catch (err) {
      console.error('Reassessment failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <RotateCcw className="w-6 h-6 text-sky-400" /> Objective Practical Skill Reassessment
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Demonstrate competency mastery through verified objective assessments & code evaluation
        </p>
      </div>

      {result && (
        <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Objective Evaluation Completed • {result.correct_mcqs}/{result.evaluated_mcqs} Questions Correct
              </span>
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
              <div className="font-extrabold text-emerald-400 text-sm">
                {result.old_skill_score}% → {result.new_skill_score}%
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400 uppercase">Mastery State</div>
              <div className="font-bold text-sky-400 text-sm">{result.mastery_state}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400 uppercase">New Readiness</div>
              <div className="font-extrabold text-sky-400 text-sm">
                {result.new_readiness}% ({result.improvement_delta >= 0 ? '+' : ''}{result.improvement_delta} pts)
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <form onSubmit={handleSubmitTest} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Select Competency to Reassess
            </label>
            <select
              value={selectedSkill}
              onChange={handleSkillChange}
              className="block w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {availableSkills.map((sk) => (
                <option key={sk.id} value={sk.skill_name}>
                  {sk.skill_name} (Current Mastery: {sk.mastery_score}% • Status: {sk.status})
                </option>
              ))}
            </select>
          </div>

          {loadingQuestions ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-400 mx-auto mb-2"></div>
              Loading verified question bank for {selectedSkill}...
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-400" /> Section 1: Objective Assessment Questions ({questions.length} Questions)
                </h3>

                {questions.map((q, qIndex) => (
                  <div key={q.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-xs text-slate-200">
                        {qIndex + 1}. {q.question_text}
                      </p>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700 shrink-0">
                        {q.difficulty}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {[
                        { key: 'a', text: q.option_a },
                        { key: 'b', text: q.option_b },
                        { key: 'c', text: q.option_c },
                        { key: 'd', text: q.option_d },
                      ].map((opt) => (
                        <label
                          key={opt.key}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                            answers[q.id] === opt.key
                              ? 'bg-sky-500/10 border-sky-500 text-sky-300'
                              : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q_${q.id}`}
                            value={opt.key}
                            checked={answers[q.id] === opt.key}
                            onChange={() => handleOptionSelect(q.id, opt.key)}
                            className="text-sky-500"
                          />
                          <span className="font-mono text-[11px] font-bold text-slate-400">
                            {opt.key.toUpperCase()})
                          </span>
                          <span className="text-[11px]">{opt.text}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Code className="w-4 h-4 text-sky-400" /> Section 2: Practical Coding & Architecture Challenge
                </h3>
                <p className="text-xs text-slate-400">
                  Provide verified code implementation solving core {selectedSkill} requirements.
                </p>
                <textarea
                  rows={6}
                  value={codeAnswer}
                  onChange={(e) => setCodeAnswer(e.target.value)}
                  className="font-mono text-xs block w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={submitting || loadingQuestions}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-sky-500/25 transition-all"
          >
            {submitting ? 'Evaluating Objective Answers...' : 'Submit Assessment & Recalculate Verified Readiness'}
          </button>
        </form>
      </div>
    </div>
  );
}

