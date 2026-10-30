import React, { useState, useEffect } from 'react';
import { 
  X, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  Terminal, 
  ShieldAlert, 
  Layers, 
  Cpu, 
  RefreshCw, 
  Sparkles, 
  ShieldCheck,
  Check,
  Server
} from 'lucide-react';
import { Agent, EvaluationSuiteConfig } from '../types';
import { MOCK_EVALUATION_SUITES } from '../data/mockData';

interface RunEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAgent: Agent;
  onEvaluationComplete: (agentId: string) => void;
  currentUser: any;
}

export const RunEvaluationModal: React.FC<RunEvaluationModalProps> = ({
  isOpen,
  onClose,
  selectedAgent,
  onEvaluationComplete,
  currentUser
}) => {
  const [suites, setSuites] = useState<EvaluationSuiteConfig[]>(MOCK_EVALUATION_SUITES);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [currentStepText, setCurrentStepText] = useState<string>('Ready to start evaluation pipeline');
  const [logs, setLogs] = useState<string[]>([]);
  const [completed, setCompleted] = useState<boolean>(false);

  // Cleanup WebSockets on unmount
  useEffect(() => {
    return () => {
      // ws cleanup handled in the run
    };
  }, []);

  if (!isOpen) return null;

  const toggleSuite = (id: string) => {
    if (isRunning) return;
    setSuites((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handleStartRun = async () => {
    const totalSelectedCases = suites
      .filter((s) => s.enabled)
      .reduce((acc, s) => acc + s.scenarioCount, 0);

    if (totalSelectedCases === 0) return;

    setIsRunning(true);
    setProgress(5);
    setCompleted(false);
    setLogs([]);
    setCurrentStepText('Requesting pipeline execution environment...');

    try {
      const response = await fetch('/api/v1/run_pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: currentUser.id, 
          agentId: selectedAgent.id,
          testCount: totalSelectedCases
        })
      });

      const data = await response.json();
      const runId = data.run_id;

      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${wsProtocol}//${window.location.host}/ws/pipeline/${runId}`;
      const ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        
        if (message.type === 'init') {
          setLogs(message.logs);
        } else if (message.type === 'progress') {
          setProgress(message.p);
          setCurrentStepText(message.msg);
          setLogs(prev => [...prev, message.log]);
        } else if (message.type === 'complete') {
          ws.close();
          setIsRunning(false);
          setCompleted(true);
          onEvaluationComplete(selectedAgent.id);
        }
      };

      ws.onerror = () => {
        setLogs(prev => [...prev, '[ERROR] Connection to pipeline execution server failed.']);
        setIsRunning(false);
      };

    } catch (e) {
      console.error(e);
      setLogs(prev => [...prev, '[ERROR] Failed to start pipeline.']);
      setIsRunning(false);
    }
  };

  const totalSelectedCases = suites
    .filter((s) => s.enabled)
    .reduce((acc, s) => acc + s.scenarioCount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="run-evaluation-modal-card"
        className="w-full max-w-2xl rounded-2xl bg-zinc-900 border border-zinc-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Play className="w-4 h-4 fill-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono tracking-tight">
                Trigger CI Evaluation Run
              </h3>
              <p className="text-xs text-zinc-400">
                Adversarial sandbox evaluation for <strong className="text-emerald-400 font-mono">{selectedAgent.name}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isRunning}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          
          {/* Suite Selection Section */}
          {!isRunning && !completed && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-zinc-300 uppercase tracking-wider">
                  Select Benchmark Suites to Execute
                </span>
                <span className="text-xs font-mono text-emerald-400">
                  {totalSelectedCases} Test Scenarios Selected
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {suites.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => toggleSuite(s.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      s.enabled
                        ? 'bg-zinc-800/80 border-emerald-500/50 shadow-sm'
                        : 'bg-zinc-950/60 border-zinc-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-100 font-mono">
                        {s.name}
                      </span>
                      <div className={`h-4 w-4 rounded flex items-center justify-center ${
                        s.enabled ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-800 text-zinc-600'
                      }`}>
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      {s.description}
                    </p>
                    <div className="mt-2 text-[10px] text-zinc-500 font-mono">
                      {s.scenarioCount} scenarios • {s.category}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-400 space-y-1">
                <div className="text-zinc-300 font-semibold">Sandbox Runtime Config:</div>
                <div className="flex items-center justify-between text-[11px]">
                  <span>AST Taint Analysis: <strong className="text-emerald-400">ENABLED</strong></span>
                  <span>Loop Breaker Threshold: <strong className="text-emerald-400">10 calls</strong></span>
                  <span>Concurrency: <strong className="text-emerald-400">16 threads</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* Running State or Completed State with Live Progress & Terminal Logs */}
          {(isRunning || completed) && (
            <div className="space-y-4">
              
              {/* Progress Bar & Status Text */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-200 font-semibold flex items-center gap-2">
                    {isRunning ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    {currentStepText}
                  </span>
                  <span className="text-emerald-400 font-bold">{progress}%</span>
                </div>

                <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Streaming Terminal Console */}
              <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3 font-mono text-xs text-zinc-300 space-y-1.5 max-h-52 overflow-y-auto">
                <div className="flex items-center justify-between text-[10px] text-zinc-500 border-b border-zinc-800 pb-1.5 mb-1.5">
                  <span className="flex items-center gap-1">
                    <Terminal className="w-3 h-3 text-emerald-400" />
                    CI Pipeline Live Stream
                  </span>
                  <span>sandbox://isolated-container-8</span>
                </div>
                {logs.map((log, i) => (
                  <div key={i} className="leading-relaxed">
                    {log.includes('GUARDRAIL') ? (
                      <span className="text-rose-400 font-semibold">{log}</span>
                    ) : log.includes('LOOP-BREAKER') ? (
                      <span className="text-amber-400 font-semibold">{log}</span>
                    ) : log.includes('SCORE') ? (
                      <span className="text-emerald-400 font-bold">{log}</span>
                    ) : (
                      <span className="text-zinc-400">{log}</span>
                    )}
                  </div>
                ))}
              </div>

              {completed && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between font-mono">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span>Evaluation pipeline passed all guardrail thresholds!</span>
                  </div>
                  <span className="font-bold text-white bg-emerald-600 px-2 py-0.5 rounded text-[11px]">
                    Reliability +1.2%
                  </span>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={isRunning}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs disabled:opacity-40"
          >
            {completed ? 'Close' : 'Cancel'}
          </button>

          {!completed ? (
            <button
              id="start-evaluation-pipeline-btn"
              onClick={handleStartRun}
              disabled={isRunning || totalSelectedCases === 0}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold font-mono text-xs flex items-center gap-2 shadow-md shadow-emerald-950/60 disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Evaluating ({progress}%)...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-zinc-950" />
                  <span>Start Evaluation Pipeline ({totalSelectedCases} Tests)</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold font-mono text-xs"
            >
              View Updated Dashboard
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
