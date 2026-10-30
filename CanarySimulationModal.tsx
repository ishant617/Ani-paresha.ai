import React, { useState } from 'react';
import { 
  Zap, 
  ShieldCheck, 
  AlertTriangle, 
  Sparkles, 
  Sliders, 
  GitBranch, 
  CheckCircle2, 
  XCircle, 
  Terminal, 
  ArrowRight,
  RefreshCw,
  Layers,
  Cpu,
  Activity
} from 'lucide-react';
import { Agent } from '../types';

interface CanarySimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent?: Agent | null;
  userId?: string;
  onCanaryComplete?: (resultData: any) => void;
  onRunCanary?: (options: {
    versionTag?: string;
    mode: 'hardened' | 'regression_injected' | 'ai_evaluated';
    customNotes?: string;
    trafficSplit?: number;
    model?: string;
  }) => Promise<any> | any;
}

export const CanarySimulationModal: React.FC<CanarySimulationModalProps> = ({
  isOpen,
  onClose,
  agent,
  userId,
  onCanaryComplete,
  onRunCanary
}) => {
  const [canaryVersion, setCanaryVersion] = useState<string>(
    `v2.2.0-canary.${Math.floor(100 + Math.random() * 900)}`
  );
  const [selectedModel, setSelectedModel] = useState<string>(agent?.model || 'gemini-3.7-flash');
  const [mode, setMode] = useState<'hardened' | 'regression_injected' | 'ai_evaluated'>('hardened');
  const [trafficSplit, setTrafficSplit] = useState<number>(10);
  const [deploymentNotes, setDeploymentNotes] = useState<string>(
    'feat: AST guardrail taint analysis & loop recursion patch'
  );
  
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [evaluationResult, setEvaluationResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleGenerateRandomTag = () => {
    setCanaryVersion(`v2.2.0-canary.${Math.floor(100 + Math.random() * 900)}`);
  };

  const handleRunSimulation = async () => {
    setIsRunning(true);
    setCurrentStep(1);
    setLogs([
      `[00:00.080] [CANARY-INIT] Initializing isolated shadow execution sandbox for candidate: ${canaryVersion}...`,
      `[00:00.250] [TARGET-MODEL] Loaded LLM runtime target: "${selectedModel}"...`
    ]);

    // Animated pipeline logs
    setTimeout(() => {
      setCurrentStep(2);
      setLogs(prev => [
        ...prev,
        `[00:00.650] [TRAFFIC-SPLIT] Routing ${trafficSplit}% shadow traffic split from production ingress to canary container...`,
        `[00:00.900] [SUITE-DISPATCH] Executing adversarial test vectors across 6 core functional domains...`
      ]);
    }, 700);

    setTimeout(() => {
      setCurrentStep(3);
      setLogs(prev => [
        ...prev,
        `[00:01.400] [AST-SCAN] Evaluating AST taint flow, tool recursion bounds, and goal alignment invariants...`,
        mode === 'regression_injected'
          ? `[00:01.800] [ALERT] Detected anomaly: Async dispatcher recursion loop & goal drift violation!`
          : `[00:01.800] [POLICY-VERIFIED] AST guardrails intercepted 100% of destructive query attempts safely.`
      ]);
    }, 1500);

    try {
      let data: any = null;
      if (onRunCanary) {
        data = await onRunCanary({
          versionTag: canaryVersion,
          mode,
          customNotes: deploymentNotes,
          trafficSplit,
          model: selectedModel
        });
      } else {
        const response = await fetch('/api/v1/simulate_canary_release', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userId || 'default-user',
            agentId: agent?.id || 'agent-cs-21',
            canaryVersion,
            model: selectedModel,
            mode,
            trafficSplit,
            notes: deploymentNotes
          })
        });
        data = await response.json();
      }

      setTimeout(() => {
        setCurrentStep(4);
        setLogs(prev => [
          ...prev,
          `[00:02.200] [CANARY-COMPLETE] Successfully evaluated ${data?.newRelease?.totalRuns || 1400} test runs.`,
          `[00:02.350] [PERSISTED] Release record "${canaryVersion}" synchronized to user workspace.`
        ]);
        setEvaluationResult(data || {
          newRelease: {
            version: canaryVersion,
            overallReliability: mode === 'regression_injected' ? 87.8 : 97.6,
            reliabilityDelta: mode === 'regression_injected' ? -6.8 : +3.0,
            isRegression: mode === 'regression_injected',
            categoryScores: {
              'destructive-actions': 98.0,
              'goal-drift': mode === 'regression_injected' ? 83.2 : 96.5,
              'tool-loops': mode === 'regression_injected' ? 81.4 : 98.6,
              'prompt-injection': 96.0,
              'data-exfiltration': 99.0,
              'context-overflow': 94.0
            }
          }
        });
        setIsRunning(false);
        if (onCanaryComplete) onCanaryComplete(data);
      }, 2300);

    } catch (e: any) {
      console.error("Canary simulation error:", e);
      setIsRunning(false);
      setLogs(prev => [
        ...prev,
        `[00:02.500] [ERROR] Failed to execute canary simulation: ${e.message}`
      ]);
    }
  };

  const handleReset = () => {
    setEvaluationResult(null);
    setCurrentStep(0);
    setLogs([]);
    handleGenerateRandomTag();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Canary Release Simulator & Regression Engine</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/40">
                  Real-Time CI
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Simulate canary deployments, evaluate shadow traffic deltas, and test regression catchers.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 text-sm font-mono p-1"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="mt-4 space-y-4 flex-1">
          
          {!evaluationResult ? (
            <>
              {/* Form Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* Canary Version Input */}
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Canary Release Tag
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      disabled={isRunning}
                      value={canaryVersion}
                      onChange={(e) => setCanaryVersion(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-orange-500 outline-none"
                    />
                    <button
                      type="button"
                      disabled={isRunning}
                      onClick={handleGenerateRandomTag}
                      title="Generate new tag"
                      className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Target Model Selection */}
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Target LLM Model Candidate
                  </label>
                  <select
                    disabled={isRunning}
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-orange-500 outline-none"
                  >
                    <option value="gemini-3.7-flash">gemini-3.7-flash (Default High-Speed)</option>
                    <option value="claude-3-5-sonnet">claude-3-5-sonnet (Production Hybrid)</option>
                    <option value="gpt-4o">gpt-4o (Multimodal Advanced)</option>
                    <option value="custom-fine-tuned-v2">custom-fine-tuned-v2 (Domain Specialized)</option>
                  </select>
                </div>
              </div>

              {/* Simulation Mode Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1.5">
                  Canary Evaluation Persona & Test Strategy
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  
                  {/* Option 1: Hardened Patch */}
                  <button
                    type="button"
                    disabled={isRunning}
                    onClick={() => setMode('hardened')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      mode === 'hardened'
                        ? 'bg-emerald-950/30 border-emerald-500/80 ring-1 ring-emerald-500/50'
                        : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Safety Patch Fix</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1.5 leading-snug">
                      Applies AST policy updates, mitigates active Goal Drift, boosts reliability to ~97.6%.
                    </p>
                  </button>

                  {/* Option 2: Intentional Regression */}
                  <button
                    type="button"
                    disabled={isRunning}
                    onClick={() => setMode('regression_injected')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      mode === 'regression_injected'
                        ? 'bg-rose-950/30 border-rose-500/80 ring-1 ring-rose-500/50'
                        : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-rose-400 font-semibold text-xs">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Chaos Regression</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1.5 leading-snug">
                      Simulates tool loop recursion drift & policy failure (-6.8% drop), triggers real CI alert.
                    </p>
                  </button>

                  {/* Option 3: Live AI Canary */}
                  <button
                    type="button"
                    disabled={isRunning}
                    onClick={() => setMode('ai_evaluated')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      mode === 'ai_evaluated'
                        ? 'bg-orange-950/30 border-orange-500/80 ring-1 ring-orange-500/50'
                        : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-orange-400 font-semibold text-xs">
                      <Sparkles className="w-4 h-4" />
                      <span>Live Gemini 3.7</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1.5 leading-snug">
                      Live adversarial evaluation using Gemini 3.7 Flash across 6 safety matrix categories.
                    </p>
                  </button>
                </div>
              </div>

              {/* Traffic Split & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-zinc-950/80 p-3 rounded-xl border border-zinc-800">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-300 mb-1">
                    <span>Shadow Traffic Split</span>
                    <span className="font-mono text-orange-400">{trafficSplit}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    disabled={isRunning}
                    value={trafficSplit}
                    onChange={(e) => setTrafficSplit(Number(e.target.value))}
                    className="w-full accent-orange-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-500 font-mono mt-1">
                    <span>5% (Conservative)</span>
                    <span>25% (Standard)</span>
                    <span>50% (High Load)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Git Commit / Deployment Notes
                  </label>
                  <input
                    type="text"
                    disabled={isRunning}
                    value={deploymentNotes}
                    onChange={(e) => setDeploymentNotes(e.target.value)}
                    placeholder="e.g. feat: AST taint analysis patch"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-2.5 py-1 text-xs text-zinc-300 font-mono focus:border-orange-500 outline-none"
                  />
                </div>
              </div>

              {/* Step Progress & Streaming Console */}
              {isRunning && (
                <div className="space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-400" />
                      <span>Executing Canary Shadow Evaluation Pipeline...</span>
                    </span>
                    <span className="font-mono text-orange-400">Step {currentStep} of 4</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-amber-400 h-full transition-all duration-500"
                      style={{ width: `${(currentStep / 4) * 100}%` }}
                    />
                  </div>

                  {/* Live Console Output */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 font-mono text-[10px] text-zinc-400 max-h-36 overflow-y-auto space-y-1">
                    {logs.map((log, idx) => (
                      <div 
                        key={idx} 
                        className={
                          log.includes('[ALERT]') || log.includes('[ERROR]') 
                            ? 'text-rose-400 font-bold' 
                            : log.includes('[CANARY-COMPLETE]') || log.includes('[POLICY-VERIFIED]')
                            ? 'text-emerald-400 font-bold'
                            : 'text-zinc-400'
                        }
                      >
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Outcome Review Card */
            <div className="space-y-4 animate-in zoom-in-95 duration-200">
              <div className={`p-4 rounded-xl border ${
                evaluationResult.newRelease?.isRegression
                  ? 'bg-rose-950/20 border-rose-800'
                  : 'bg-emerald-950/20 border-emerald-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {evaluationResult.newRelease?.isRegression ? (
                      <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
                        <XCircle className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        Canary Release {evaluationResult.newRelease?.version} Evaluated
                      </h4>
                      <p className="text-xs text-zinc-400">
                        {evaluationResult.newRelease?.isRegression
                          ? 'Regressions detected in shadow traffic. Alert added to CI dashboard.'
                          : 'Canary passed all adversarial suites with improved reliability.'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-bold font-mono text-white">
                      {evaluationResult.newRelease?.overallReliability}%
                    </div>
                    <span className={`text-xs font-mono font-bold ${
                      evaluationResult.newRelease?.reliabilityDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {evaluationResult.newRelease?.reliabilityDelta >= 0 
                        ? `+${evaluationResult.newRelease?.reliabilityDelta}%` 
                        : `${evaluationResult.newRelease?.reliabilityDelta}%`}
                    </span>
                  </div>
                </div>

                {/* Category Deltas Grid */}
                <div className="mt-4 pt-3 border-t border-zinc-800 grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-[10px] font-mono">
                  {Object.entries(evaluationResult.newRelease?.categoryScores || {}).map(([catKey, score]) => (
                    <div key={catKey} className="bg-zinc-900/90 p-2 rounded border border-zinc-800">
                      <div className="text-zinc-400 truncate capitalize">{catKey.replace('-', ' ')}</div>
                      <div className="text-white font-bold mt-0.5">{score as number}%</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Console Logs summary */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 font-mono text-[10px] text-zinc-400 max-h-32 overflow-y-auto space-y-0.5">
                {logs.map((log, idx) => (
                  <div key={idx} className={log.includes('[ALERT]') ? 'text-rose-400' : 'text-zinc-400'}>
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="mt-5 pt-3.5 border-t border-zinc-800 flex items-center justify-between">
          {!evaluationResult ? (
            <>
              <button
                type="button"
                disabled={isRunning}
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRunning}
                onClick={handleRunSimulation}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-semibold shadow-md shadow-orange-950/40 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Evaluating Traffic...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 fill-white" />
                    <span>Deploy & Run Canary Evaluation</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Simulate Another Release</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <span>View in Regression Tracker</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
