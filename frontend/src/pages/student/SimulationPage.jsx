import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  Sliders,
  Sparkles,
  TrendingUp,
  Award,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Unlock,
  AlertCircle
} from 'lucide-react';

export default function SimulationPage() {
  const [skills, setSkills] = useState([]);
  const [sliderValues, setSliderValues] = useState({});
  const [simulationResult, setSimulationResult] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    fetchInitialSkills();
  }, []);

  const fetchInitialSkills = async () => {
    try {
      setLoading(true);
      const res = await api.get('/students/me/skills');
      setSkills(res.data);

      const initialMap = {};
      res.data.forEach((s) => {
        initialMap[s.skill_name] = s.mastery_score;
      });
      setSliderValues(initialMap);

      // Trigger initial baseline simulation
      runSimulation(initialMap);
    } catch (e) {
      console.error('Failed to load initial skills:', e);
    } finally {
      setLoading(false);
    }
  };

  const runSimulation = async (updatedValues) => {
    try {
      setSimulating(true);
      const res = await api.post('/students/me/simulate', {
        skill_improvements: updatedValues
      });
      setSimulationResult(res.data);
    } catch (e) {
      console.error('Simulation failed:', e);
    } finally {
      setSimulating(false);
    }
  };

  const handleSliderChange = (skillName, val) => {
    const nextMap = {
      ...sliderValues,
      [skillName]: parseFloat(val)
    };
    setSliderValues(nextMap);
    runSimulation(nextMap);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-400"></div>
      </div>
    );
  }

  const {
    disclaimer,
    target_role,
    current_overall_readiness,
    projected_overall_readiness,
    overall_delta,
    projected_status,
    role_impacts
  } = simulationResult || {};

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-indigo-950/30 via-slate-900 to-sky-950/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" /> What-If Career Progression Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Career Readiness Simulation
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Simulate the placement impact of mastering specific skills before taking assessments
            </p>
          </div>
          <button
            onClick={() => navigate('/student/reassessment')}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-sky-500/25 transition-all shrink-0"
          >
            Take Verified Reassessment
          </button>
        </div>
      </div>

      {/* Official Projected Disclaimer */}
      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-sky-400 shrink-0" />
        <span>{disclaimer}</span>
      </div>

      {/* Main Simulation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Interactive Competency Boost Sliders */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-400" /> Adjust Competency Mastery
            </h2>
            <span className="text-xs text-slate-400">Drag sliders to test score boost</span>
          </div>

          <div className="space-y-4">
            {skills.map((s) => {
              const currentScore = s.mastery_score;
              const simulatedVal = sliderValues[s.skill_name] ?? currentScore;
              const isBoosted = simulatedVal > currentScore;

              return (
                <div key={s.id} className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">{s.skill_name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                        Base: {currentScore}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isBoosted && (
                        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          +{roundOne(simulatedVal - currentScore)} pts
                        </span>
                      )}
                      <span className="font-mono text-sm font-extrabold text-sky-400">
                        {simulatedVal}%
                      </span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min={currentScore}
                    max="100"
                    step="1"
                    value={simulatedVal}
                    onChange={(e) => handleSliderChange(s.skill_name, e.target.value)}
                    className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>{currentScore}% (Verified Current)</span>
                    <span>100% (Full Mastery)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Projected Outcome Dashboard */}
        <div className="space-y-4">
          <div className="glass-panel p-6 rounded-2xl border border-indigo-500/30 bg-indigo-950/20 space-y-4 text-center">
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
              Projected Readiness for {target_role}
            </span>

            <div className="text-4xl font-black text-white">
              {projected_overall_readiness}%
            </div>

            <div className="flex items-center justify-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                overall_delta > 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-300'
              }`}>
                {overall_delta >= 0 ? '+' : ''}{overall_delta} Points Projected Boost
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex justify-between">
              <span>Projected Status:</span>
              <strong className="text-emerald-400">{projected_status}</strong>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-sky-400" /> Multi-Role Placement Impact
            </h3>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {role_impacts && role_impacts.map((r, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all ${
                    r.unlocked
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-900/70 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="truncate pr-2">{r.role_title}</span>
                    {r.unlocked ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 flex items-center gap-1 shrink-0">
                        <Unlock className="w-3 h-3" /> Unlocked!
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {r.projected_readiness}%
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Current: {r.current_readiness}%</span>
                    <span className="text-emerald-400 font-bold">
                      +{r.improvement_delta} pts ({r.status_after})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function roundOne(val) {
  return Math.round(val * 10) / 10;
}
