import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Cpu, 
  Wrench, 
  Database, 
  ShieldCheck, 
  Code, 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  Copy, 
  Check, 
  Zap, 
  Eye, 
  Info,
  Server,
  FileCode,
  Flame,
  ArrowRight
} from 'lucide-react';
import { ExecutionTrace, TraceStep } from '../types';

interface TraceDebuggerProps {
  traces: Record<string, ExecutionTrace>;
  activeTraceId: string;
  onSelectTraceId: (traceId: string) => void;
}

export const TraceDebugger: React.FC<TraceDebuggerProps> = ({
  traces,
  activeTraceId,
  onSelectTraceId
}) => {
  const traceList = Object.values(traces || {}) as ExecutionTrace[];
  const currentTrace = (activeTraceId && traces[activeTraceId]) || traceList[0] || traces['trace-sql-drop'] || null;

  const [selectedStepIndex, setSelectedStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);
  const [inspectorTab, setInspectorTab] = useState<'visual' | 'json' | 'guardrail' | 'coT'>('visual');

  const stepsLength = currentTrace?.steps?.length || 0;

  // Keyboard shortcut navigation for execution timeline (Left/Right arrows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      if (e.key === 'ArrowRight') {
        setSelectedStepIndex(prev => Math.min(stepsLength - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setSelectedStepIndex(prev => Math.max(0, prev - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stepsLength]);

  // Auto-play timeline simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && stepsLength > 1) {
      interval = setInterval(() => {
        setSelectedStepIndex((prev) => {
          if (prev >= stepsLength - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1800);
    } else if (isPlaying && stepsLength <= 1) {
      setIsPlaying(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, stepsLength]);

  // Reset selected step when trace changes
  useEffect(() => {
    setSelectedStepIndex(0);
    setIsPlaying(false);
  }, [activeTraceId]);

  if (!currentTrace || !currentTrace.steps || currentTrace.steps.length === 0) {
    return (
      <div className="p-12 text-center bg-zinc-900 border border-zinc-800 rounded-xl space-y-4">
        <h3 className="text-zinc-300 font-bold text-lg font-mono">No execution traces recorded</h3>
        <p className="text-zinc-400 text-sm max-w-md mx-auto">
          Run a test scenario from the Overview or Scenarios tab to capture real-time execution telemetry and inspect step-by-step agent traces.
        </p>
      </div>
    );
  }

  const activeStep: TraceStep = currentTrace.steps[selectedStepIndex] || currentTrace.steps[0];

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(activeStep.payload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const getStepIcon = (type: TraceStep['type'], status: TraceStep['status']) => {
    switch (type) {
      case 'adversarial_prompt':
        return <Flame className="w-4 h-4 text-rose-400" />;
      case 'thought_trace':
        return <Cpu className="w-4 h-4 text-cyan-400" />;
      case 'tool_call':
        return <Database className="w-4 h-4 text-amber-400" />;
      case 'guardrail_intercept':
        return <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" />;
      case 'recovery_response':
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      default:
        return <Terminal className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <section className="space-y-4" aria-label="Visual Trace Debugger">
      
      {/* Header Banner & Trace Selector */}
      <div className="rounded-xl bg-zinc-900/90 border border-zinc-800 p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white font-mono tracking-tight">
                  Visual Trace Debugger
                </h2>
                <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono border border-zinc-700">
                  Trace ID: {currentTrace.id}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded font-mono font-semibold ${
                  currentTrace.status === 'Guardrail Triggered' 
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                    : currentTrace.status === 'Passed' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {currentTrace.status}
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-1 font-sans">
                {currentTrace.scenarioName}
              </p>
            </div>
          </div>

          {/* Trace Switcher & Simulation Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick switcher between sample traces */}
            <select
              id="trace-selector-dropdown"
              value={activeTraceId || (currentTrace ? currentTrace.id : '')}
              onChange={(e) => onSelectTraceId(e.target.value)}
              aria-label="Select Execution Trace"
              className="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 font-mono focus:outline-none focus:border-emerald-500 max-w-[280px] sm:max-w-md truncate"
            >
              {(Object.values(traces) as ExecutionTrace[]).map((tr) => (
                <option key={tr.id} value={tr.id}>
                  {tr.scenarioName ? `${tr.scenarioName} [${tr.status}]` : `Trace ${tr.id}`}
                </option>
              ))}
              {Object.keys(traces).length === 0 && (
                <option value="trace-sql-drop">Sample 1: SQL Injection (Destructive DROP TABLE Intercepted)</option>
              )}
            </select>

            {/* Playback Simulation Buttons */}
            <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-zinc-800">
              <button
                id="trace-btn-prev"
                onClick={() => setSelectedStepIndex((p) => Math.max(0, p - 1))}
                disabled={selectedStepIndex === 0}
                aria-label="Previous step"
                className="p-1 rounded text-zinc-400 hover:text-white disabled:opacity-30"
                title="Previous step"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                id="trace-btn-play"
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-2 py-1 rounded text-xs font-mono font-semibold flex items-center gap-1 text-emerald-400 hover:bg-zinc-800"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {isPlaying ? 'Pause' : 'Play'}
              </button>

              <button
                id="trace-btn-next"
                onClick={() => setSelectedStepIndex((p) => Math.min(currentTrace.steps.length - 1, p + 1))}
                disabled={selectedStepIndex === currentTrace.steps.length - 1}
                aria-label="Next step"
                className="p-1 rounded text-zinc-400 hover:text-white disabled:opacity-30"
                title="Next step"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                id="trace-btn-reset"
                onClick={() => { setSelectedStepIndex(0); setIsPlaying(false); }}
                aria-label="Reset to Step 1"
                className="p-1 rounded text-zinc-400 hover:text-white ml-1"
                title="Reset to Step 1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* Trace metadata bar */}
        <div className="mt-3 pt-3 border-t border-zinc-800 flex flex-wrap items-center justify-between text-[11px] text-zinc-400 font-mono gap-2">
          <div className="flex items-center gap-4">
            <span>Target Agent: <strong className="text-zinc-200">{currentTrace.agentName}</strong></span>
            <span>Duration: <strong className="text-zinc-200">{currentTrace.durationMs}ms</strong></span>
            <span>Total Tokens: <strong className="text-zinc-200">{currentTrace.totalTokens}</strong></span>
          </div>
          {currentTrace.interceptReason && (
            <div className="text-rose-400 font-semibold flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{currentTrace.interceptReason}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Debugger Workspace: Timeline on Left, Deep Inspector on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: Interactive Step Timeline (5 cols) */}
        <div className="lg:col-span-5 rounded-xl bg-zinc-900/90 border border-zinc-800 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono">
              Execution Timeline ({currentTrace.steps.length} Steps)
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">
              Step {selectedStepIndex + 1} of {currentTrace.steps.length}
            </span>
          </div>

          <div className="relative pl-6 space-y-3">
            {/* Continuous timeline vertical line */}
            <div className="absolute left-[13px] top-3 bottom-3 w-[2px] bg-zinc-800" />

            {currentTrace.steps.map((step, idx) => {
              const isSelected = selectedStepIndex === idx;
              const isIntercept = step.type === 'guardrail_intercept';

              return (
                <div
                  key={step.stepNumber}
                  id={`trace-step-node-${step.stepNumber}`}
                  onClick={() => { setSelectedStepIndex(idx); setIsPlaying(false); }}
                  className={`relative cursor-pointer group rounded-xl p-3 border transition-all text-left ${
                    isSelected
                      ? isIntercept
                        ? 'bg-rose-950/40 border-rose-500 shadow-md shadow-rose-950/50'
                        : 'bg-zinc-800/90 border-emerald-500 shadow-md shadow-emerald-950/30'
                      : isIntercept
                      ? 'bg-rose-950/20 border-rose-900/60 hover:border-rose-700'
                      : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {/* Timeline bullet icon */}
                  <div className={`absolute -left-[30px] top-3.5 h-6 w-6 rounded-full flex items-center justify-center border transition-all ${
                    isSelected
                      ? isIntercept
                        ? 'bg-rose-600 border-white text-white scale-110 ring-2 ring-rose-500/50'
                        : 'bg-emerald-500 border-zinc-900 text-zinc-950 scale-110 ring-2 ring-emerald-500/50'
                      : isIntercept
                      ? 'bg-zinc-900 border-rose-500 text-rose-400'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-400'
                  }`}>
                    {getStepIcon(step.type, step.status)}
                  </div>

                  {/* Step Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        isIntercept 
                          ? 'bg-rose-600 text-white' 
                          : isSelected 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        STEP {step.stepNumber}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        +{step.timestamp} ({step.durationMs}ms)
                      </span>
                    </div>

                    {isIntercept && (
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                        Guardrail Intercept
                      </span>
                    )}
                  </div>

                  {/* Step Title & Summary */}
                  <h4 className={`text-xs font-semibold mt-1.5 font-mono ${
                    isSelected ? 'text-white' : 'text-zinc-300'
                  }`}>
                    {step.title}
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">
                    {step.summary}
                  </p>

                  {/* Highlights / Command Snippet */}
                  {step.metadata.interceptedCommand && (
                    <div className="mt-2 px-2 py-1 rounded bg-rose-950/80 border border-rose-800/80 font-mono text-[10px] text-rose-200 flex items-center gap-1.5">
                      <ShieldAlert className="w-3 h-3 text-rose-400 shrink-0" />
                      <span className="truncate">Blocked: {step.metadata.interceptedCommand}</span>
                    </div>
                  )}

                  {step.metadata.targetTool && !step.metadata.interceptedCommand && (
                    <div className="mt-2 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-mono text-[10px] text-amber-300 inline-flex items-center gap-1">
                      <Database className="w-3 h-3" />
                      <span>tool: {step.metadata.targetTool}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Deep Step Inspector & Guardrail Alert Details (7 cols) */}
        <div className="lg:col-span-7 rounded-xl bg-zinc-900/90 border border-zinc-800 p-4 space-y-4 flex flex-col justify-between">
          
          <div>
            {/* Inspector Navigation Tabs */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  Step Inspector:
                </span>
                <span className="text-xs font-mono text-zinc-300 font-semibold truncate max-w-[200px] sm:max-w-[300px]">
                  Step {activeStep.stepNumber} - {activeStep.title}
                </span>
              </div>

              <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs font-mono">
                <button
                  onClick={() => setInspectorTab('visual')}
                  className={`px-2 py-1 rounded ${
                    inspectorTab === 'visual' ? 'bg-zinc-800 text-emerald-400 font-bold' : 'text-zinc-400'
                  }`}
                >
                  Visual
                </button>
                <button
                  onClick={() => setInspectorTab('coT')}
                  className={`px-2 py-1 rounded ${
                    inspectorTab === 'coT' ? 'bg-zinc-800 text-cyan-400 font-bold' : 'text-zinc-400'
                  }`}
                >
                  CoT Reasoning
                </button>
                <button
                  onClick={() => setInspectorTab('guardrail')}
                  className={`px-2 py-1 rounded ${
                    inspectorTab === 'guardrail' ? 'bg-zinc-800 text-rose-400 font-bold' : 'text-zinc-400'
                  }`}
                >
                  Guardrails
                </button>
                <button
                  onClick={() => setInspectorTab('json')}
                  className={`px-2 py-1 rounded ${
                    inspectorTab === 'json' ? 'bg-zinc-800 text-amber-400 font-bold' : 'text-zinc-400'
                  }`}
                >
                  Raw JSON
                </button>
              </div>
            </div>

            {/* Special Visual Guardrail Alert Banner if Step 4 (Guardrail Intercept) */}
            {activeStep.type === 'guardrail_intercept' && (
              <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-r from-rose-950 via-rose-900/60 to-zinc-900 border-2 border-rose-600 shadow-lg text-rose-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-400 animate-bounce" />
                    <span className="font-bold font-mono text-sm tracking-tight text-white">
                      DESTRUCTIVE ACTION INTERCEPTED
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded bg-rose-600 text-white">
                    Risk Score: {activeStep.metadata.riskScore || '0.994'} (CRITICAL)
                  </span>
                </div>

                <p className="text-xs text-rose-200">
                  The Sentinel Guardrail Proxy intercepted an unauthorized <code className="bg-rose-950 px-1.5 py-0.5 rounded text-white font-mono font-bold">DROP TABLE users;</code> database command. Execution was blocked before touching storage.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                  <div className="p-2 rounded bg-black/40 border border-rose-800/60">
                    <span className="text-zinc-400 block">Policy Violated:</span>
                    <strong className="text-rose-300">{activeStep.metadata.violatedPolicy || 'SQL_DESTRUCTIVE_DDL_PREVENTION'}</strong>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-rose-800/60">
                    <span className="text-zinc-400 block">Action Enforced:</span>
                    <strong className="text-emerald-400">HARD_BLOCK + SAFE_FALLBACK</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Tab View 1: Visual Formatting */}
            {inspectorTab === 'visual' && (
              <div className="mt-3 space-y-3">
                {/* Step Context Details */}
                <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800 text-xs space-y-2">
                  <div className="flex items-center justify-between text-zinc-400 font-mono text-[11px]">
                    <span>Step Type: <strong className="text-zinc-200 capitalize">{activeStep.type.replace('_', ' ')}</strong></span>
                    <span>Duration: <strong className="text-emerald-400">{activeStep.durationMs}ms</strong></span>
                  </div>
                  <p className="text-zinc-300 font-sans text-xs">
                    {activeStep.summary}
                  </p>
                </div>

                {/* Key-Value Payload Inspector */}
                <div className="space-y-2">
                  <div className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">
                    Structured Payload Parameters
                  </div>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                    {Object.entries(activeStep.payload).map(([key, val]) => (
                      <div key={key} className="p-2 rounded-lg bg-zinc-950 border border-zinc-800/80 font-mono text-xs">
                        <span className="text-emerald-400 font-semibold">{key}: </span>
                        {typeof val === 'object' ? (
                          <pre className="text-[11px] text-zinc-300 mt-1 overflow-x-auto bg-zinc-900/80 p-2 rounded border border-zinc-800">
                            {JSON.stringify(val, null, 2)}
                          </pre>
                        ) : (
                          <span className="text-zinc-200">{String(val)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab View 2: CoT Reasoning Chain */}
            {inspectorTab === 'coT' && (
              <div className="mt-3 space-y-3">
                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                  <div className="flex items-center justify-between text-xs font-mono text-cyan-400 mb-2">
                    <span className="flex items-center gap-1.5">
                      <Cpu className="w-4 h-4" />
                      LLM Internal Chain-of-Thought (Hidden Reasoning)
                    </span>
                    <span className="text-zinc-500">{activeStep.metadata.reasoningTokens || 210} tokens</span>
                  </div>
                  <div className="space-y-2 text-xs font-mono text-zinc-300">
                    {activeStep.payload.internal_cot_reasoning ? (
                      (activeStep.payload.internal_cot_reasoning as string[]).map((thought, idx) => (
                        <div key={idx} className="p-2 rounded bg-zinc-900/90 border border-zinc-800/80 flex items-start gap-2">
                          <span className="text-cyan-400 font-bold">{idx + 1}.</span>
                          <span>{thought.replace(/^\d+\.\s*/, '')}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-zinc-400 italic p-3">
                        Thought: {JSON.stringify(activeStep.payload, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab View 3: Guardrail Rules */}
            {inspectorTab === 'guardrail' && (
              <div className="mt-3 space-y-3">
                <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-rose-400 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4" />
                      Active Guardrail Policy Matrix
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                      Rule Engine v2.4
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 text-xs font-mono space-y-1">
                    <div className="text-zinc-400">Target Rule: <strong className="text-zinc-200">RULE_SEC_SQL_094</strong></div>
                    <div className="text-zinc-400">Policy: <strong className="text-rose-400">SQL_DESTRUCTIVE_DDL_PREVENTION</strong></div>
                    <div className="text-zinc-400">Action: <strong className="text-emerald-400">INTERCEPT_AND_SANITIZE</strong></div>
                    <div className="text-zinc-400">Description: Forbids DROP, TRUNCATE, ALTER or batch DELETE operations originating from unvetted agent tools.</div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab View 4: Raw JSON */}
            {inspectorTab === 'json' && (
              <div className="mt-3 relative">
                <div className="absolute right-2 top-2 z-10">
                  <button
                    onClick={handleCopyPayload}
                    className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-mono flex items-center gap-1 border border-zinc-700"
                  >
                    {copiedPayload ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedPayload ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-zinc-300 overflow-x-auto max-h-72">
                  {JSON.stringify(activeStep, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Inspector Footer with Step Action Bar */}
          <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
            <button
              onClick={() => setSelectedStepIndex((p) => Math.max(0, p - 1))}
              disabled={selectedStepIndex === 0}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono disabled:opacity-30 flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous Step
            </button>

            <span className="text-zinc-500 font-mono text-[11px]">
              Step {selectedStepIndex + 1} of {currentTrace.steps.length}
            </span>

            <button
              onClick={() => setSelectedStepIndex((p) => Math.min(currentTrace.steps.length - 1, p + 1))}
              disabled={selectedStepIndex === currentTrace.steps.length - 1}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold font-mono disabled:opacity-30 flex items-center gap-1"
            >
              Next Step <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>
    </section>
  );
};
