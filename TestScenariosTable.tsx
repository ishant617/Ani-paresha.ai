import React, { useState, useEffect, useRef } from 'react';
import { 
  Layers, 
  Search, 
  Filter, 
  Play, 
  RotateCcw, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Repeat, 
  Flame, 
  ShieldCheck, 
  ChevronRight, 
  Wrench,
  Clock,
  Zap,
  Tag,
  Plus,
  Radio,
  Sliders,
  Check,
  Download,
  Terminal,
  Activity,
  X,
  AlertTriangle,
  FileCode,
  Gauge,
  Sparkles,
  Pause,
  RefreshCw
} from 'lucide-react';
import { TestScenario, SeverityLevel, ScenarioStatus } from '../types';

interface TestScenariosTableProps {
  scenarios: TestScenario[];
  onReplayTrace: (traceId: string) => void;
  onRunSingleScenario?: (scenarioId: string) => Promise<any> | void;
  onRunAllScenarios?: (scenarioIds?: string[]) => Promise<any> | void;
  onCreateCustomScenario?: (scenario: any) => Promise<any> | void;
}

export const TestScenariosTable: React.FC<TestScenariosTableProps> = ({
  scenarios,
  onReplayTrace,
  onRunSingleScenario,
  onRunAllScenarios,
  onCreateCustomScenario
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  
  // Running state for single scenario
  const [runningScenarioId, setRunningScenarioId] = useState<string | null>(null);
  const [activeStepMessage, setActiveStepMessage] = useState<string>('');

  // Batch Matrix Execution state
  const [isBatchRunning, setIsBatchRunning] = useState<boolean>(false);
  const [batchProgressIndex, setBatchProgressIndex] = useState<number>(0);
  const [batchTotalCount, setBatchTotalCount] = useState<number>(0);
  const [batchResults, setBatchResults] = useState<{ passed: number; blocked: number; failed: number }>({ passed: 0, blocked: 0, failed: 0 });
  const [isLiveStreamOpen, setIsLiveStreamOpen] = useState<boolean>(false);
  const [liveStreamLogs, setLiveStreamLogs] = useState<Array<{ timestamp: string; text: string; type: 'info' | 'warn' | 'success' | 'crit' }>>([]);
  const abortBatchRef = useRef<boolean>(false);

  // Custom scenario modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [customName, setCustomName] = useState('');
  const [customTool, setCustomTool] = useState('exec_database_query');
  const [customSeverity, setCustomSeverity] = useState<SeverityLevel>('Security');
  const [customPayload, setCustomPayload] = useState('');
  const [customRule, setCustomRule] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [isSavingScenario, setIsSavingScenario] = useState(false);

  // Filter calculations
  const filteredScenarios = scenarios.filter((sc) => {
    const matchesSearch = 
      sc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sc.targetTool.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sc.promptPayload && sc.promptPayload.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSeverity = selectedSeverity === 'ALL' || sc.severity === selectedSeverity;
    const matchesStatus = selectedStatus === 'ALL' || sc.status === selectedStatus;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  // Summary counts
  const totalCount = scenarios.length;
  const passedCount = scenarios.filter(s => s.status === 'Passed').length;
  const blockedCount = scenarios.filter(s => s.status === 'Guardrail Triggered').length;
  const loopCount = scenarios.filter(s => s.status === 'Loop Detected').length;
  const failedCount = scenarios.filter(s => s.status === 'Failed').length;

  const logToStream = (text: string, type: 'info' | 'warn' | 'success' | 'crit' = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLiveStreamLogs(prev => [...prev.slice(-35), { timestamp: time, text, type }]);
  };

  // Run a single scenario with progressive real-time telemetry steps
  const handleExecuteSingle = async (scenario: TestScenario, e: React.MouseEvent) => {
    e.stopPropagation();
    if (runningScenarioId || isBatchRunning) return;

    setRunningScenarioId(scenario.id);
    setActiveStepMessage('Ingesting payload...');
    logToStream(`[START] Ingesting test vector: "${scenario.name}" (Target: ${scenario.targetTool})`, 'info');

    // Step 1: Pre-scan
    await new Promise(r => setTimeout(r, 600));
    setActiveStepMessage('Agent CoT Reasoning...');
    logToStream(`[REASONING] Model analyzing prompt context and tool parameters...`, 'info');

    // Step 2: Tool call
    await new Promise(r => setTimeout(r, 700));
    setActiveStepMessage(`Dispatching ${scenario.targetTool}...`);
    logToStream(`[INVOCATION] Dispatching tool call '${scenario.targetTool}' to sandbox container...`, 'warn');

    // Step 3: Guardrail
    await new Promise(r => setTimeout(r, 700));
    setActiveStepMessage('Sentinel AST Verification...');

    if (onRunSingleScenario) {
      try {
        const result = await onRunSingleScenario(scenario.id);
        const status = result?.updatedScenario?.status || scenario.status;
        logToStream(`[RESULT] Scenario evaluated: Status [${status}] (${result?.updatedScenario?.durationMs || 1800}ms)`, status === 'Passed' ? 'success' : 'crit');
      } catch (err: any) {
        logToStream(`[ERROR] Evaluation interrupted: ${err.message}`, 'crit');
      }
    }

    await new Promise(r => setTimeout(r, 400));
    setRunningScenarioId(null);
    setActiveStepMessage('');
  };

  // Run Full Matrix Suite or filtered items in sequence with realistic pacing
  const handleExecuteBatchSuite = async () => {
    if (isBatchRunning) return;

    const listToRun = filteredScenarios.length > 0 ? filteredScenarios : scenarios;
    if (listToRun.length === 0) return;

    setIsBatchRunning(true);
    abortBatchRef.current = false;
    setBatchTotalCount(listToRun.length);
    setBatchProgressIndex(0);
    setBatchResults({ passed: 0, blocked: 0, failed: 0 });
    setIsLiveStreamOpen(true);
    setLiveStreamLogs([]);

    logToStream(`🚀 Initiating Adversarial Matrix Suite (${listToRun.length} scenarios)...`, 'info');

    let passedAcc = 0;
    let blockedAcc = 0;
    let failedAcc = 0;

    for (let i = 0; i < listToRun.length; i++) {
      if (abortBatchRef.current) {
        logToStream(`🛑 Batch suite execution aborted by user.`, 'warn');
        break;
      }

      const sc = listToRun[i];
      setBatchProgressIndex(i + 1);
      setRunningScenarioId(sc.id);
      setActiveStepMessage(`Test ${i + 1}/${listToRun.length}: ${sc.targetTool}`);

      logToStream(`[${i + 1}/${listToRun.length}] Testing: "${sc.name}"`, 'info');

      // Realistic step-by-step progress simulation
      await new Promise(r => setTimeout(r, 450));
      logToStream(`  ↳ AST Guardrail check on rule: ${sc.guardrailRule}`, 'warn');
      await new Promise(r => setTimeout(r, 450));

      if (onRunSingleScenario) {
        try {
          const res = await onRunSingleScenario(sc.id);
          const st = res?.updatedScenario?.status || sc.status;
          if (st === 'Passed') passedAcc++;
          else if (st === 'Guardrail Triggered') blockedAcc++;
          else failedAcc++;

          setBatchResults({ passed: passedAcc, blocked: blockedAcc, failed: failedAcc });
          logToStream(`  ↳ Verdict: ${st} (${res?.updatedScenario?.durationMs || 1500}ms)`, st === 'Passed' ? 'success' : 'crit');
        } catch (err: any) {
          failedAcc++;
          setBatchResults({ passed: passedAcc, blocked: blockedAcc, failed: failedAcc });
          logToStream(`  ↳ Error: ${err.message}`, 'crit');
        }
      }
    }

    setRunningScenarioId(null);
    setActiveStepMessage('');
    setIsBatchRunning(false);
    logToStream(`🏁 Suite Execution Complete: ${passedAcc} Passed, ${blockedAcc} Guardrail Intercepts, ${failedAcc} Failures.`, 'success');
  };

  const handleAbortBatch = () => {
    abortBatchRef.current = true;
    setIsBatchRunning(false);
    setRunningScenarioId(null);
    setActiveStepMessage('');
  };

  // Submit custom test scenario
  const handleSaveCustomScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customPayload) return;

    setIsSavingScenario(true);
    if (onCreateCustomScenario) {
      await onCreateCustomScenario({
        name: customName,
        suite: 'Custom Security & Red-Team Suite',
        targetTool: customTool,
        severity: customSeverity,
        description: customDescription || `Custom test vector targeting ${customTool}`,
        promptPayload: customPayload,
        guardrailRule: customRule || 'CUSTOM_INTEGRITY_CHECK'
      });
    }

    setIsSavingScenario(false);
    setIsAddModalOpen(false);
    setCustomName('');
    setCustomPayload('');
    setCustomRule('');
    setCustomDescription('');
  };

  const exportMatrixJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(scenarios, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `test_scenarios_matrix_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getStatusBadge = (status: ScenarioStatus) => {
    switch (status) {
      case 'Guardrail Triggered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-xs">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>Guardrail Intercept</span>
          </span>
        );
      case 'Passed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Passed</span>
          </span>
        );
      case 'Failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-red-500/15 text-red-300 border border-red-500/30 shadow-xs">
            <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span>Failed</span>
          </span>
        );
      case 'Loop Detected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-xs">
            <Repeat className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Loop Detected</span>
          </span>
        );
    }
  };

  const getSeverityBadge = (severity: SeverityLevel) => {
    switch (severity) {
      case 'Security':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950/80 text-red-300 border border-red-800 tracking-wide">SECURITY</span>;
      case 'Adversarial':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950/80 text-purple-300 border border-purple-800 tracking-wide">ADVERSARIAL</span>;
      case 'Chaos':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-800 tracking-wide">CHAOS</span>;
      case 'Edge-Case':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800 tracking-wide">EDGE-CASE</span>;
    }
  };

  return (
    <section className="space-y-4" aria-label="Test Scenarios Matrix">
      
      {/* Top Banner with Real-Time Matrix Metrics & Action Bar */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5 shadow-sm space-y-4">
        
        {/* Main Title & Action Buttons */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-white font-mono tracking-tight flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                <span>Adversarial Test Scenarios Matrix</span>
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono font-bold flex items-center gap-1">
                <Activity className="w-3 h-3 animate-pulse" />
                Real-Time Sandbox Sync
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
              Synthetic jailbreaks, AST guardrail stress tests, recursive tool loop traps, and authorization boundary evaluations.
            </p>
          </div>

          {/* Quick Actions: Run Full Suite, Add Scenario, Export */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {isBatchRunning ? (
              <button
                id="btn-abort-matrix-suite"
                onClick={handleAbortBatch}
                className="px-3.5 py-2 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Abort Run</span>
              </button>
            ) : (
              <button
                id="btn-run-all-matrix-suite"
                onClick={handleExecuteBatchSuite}
                disabled={runningScenarioId !== null}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Execute Matrix Suite ({filteredScenarios.length})</span>
              </button>
            )}

            <button
              id="btn-add-custom-scenario"
              onClick={() => setIsAddModalOpen(true)}
              className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 border border-zinc-700 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Add Custom Vector</span>
            </button>

            <button
              id="btn-toggle-live-terminal"
              onClick={() => setIsLiveStreamOpen(!isLiveStreamOpen)}
              className={`px-3 py-2 rounded-lg text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 border ${
                isLiveStreamOpen 
                  ? 'bg-zinc-800 text-emerald-400 border-emerald-500/40' 
                  : 'bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-700'
              }`}
              title="Toggle Live Sandbox Telemetry Console"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Telemetry</span>
            </button>

            <button
              id="btn-export-matrix-json"
              onClick={exportMatrixJSON}
              className="p-2 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs transition-colors border border-zinc-700"
              title="Export Scenarios Matrix as JSON"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

          </div>
        </div>

        {/* Live Matrix Summary Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-3 border-t border-zinc-800 text-xs">
          
          <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Total Suite</span>
            <span className="text-base font-bold font-mono text-zinc-100">{totalCount} Vectors</span>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-900/40">
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">Passed</span>
            <span className="text-base font-bold font-mono text-emerald-300">{passedCount}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/40">
            <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider block">Guardrail Intercepts</span>
            <span className="text-base font-bold font-mono text-rose-300">{blockedCount}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-900/40">
            <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">Loop Breakers</span>
            <span className="text-base font-bold font-mono text-amber-300">{loopCount}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-red-950/20 border border-red-900/40 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider block">Failed / Vulnerable</span>
            <span className="text-base font-bold font-mono text-red-300">{failedCount}</span>
          </div>

        </div>

        {/* Real-time Batch Suite Execution Progress Bar (when running) */}
        {isBatchRunning && (
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-emerald-500/40 shadow-inner space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Evaluating Vector {batchProgressIndex} of {batchTotalCount}</span>
                <span className="text-zinc-400 font-normal hidden sm:inline">({activeStepMessage})</span>
              </div>
              <div className="text-zinc-400">
                {Math.round((batchProgressIndex / (batchTotalCount || 1)) * 100)}% Complete
              </div>
            </div>

            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${(batchProgressIndex / (batchTotalCount || 1)) * 100}%` }}
              />
            </div>

            <div className="flex items-center gap-4 text-[11px] font-mono text-zinc-400 pt-1">
              <span className="text-emerald-400">✓ Passed: {batchResults.passed}</span>
              <span className="text-rose-400">🛡️ Guardrail Blocked: {batchResults.blocked}</span>
              <span className="text-red-400">✗ Failed: {batchResults.failed}</span>
            </div>
          </div>
        )}

        {/* Live Stream Telemetry Drawer (collapsible) */}
        {isLiveStreamOpen && (
          <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] font-mono space-y-1.5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 text-zinc-400">
              <span className="flex items-center gap-1.5 text-zinc-300 font-bold">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Live Sandbox Execution Logs</span>
              </span>
              <button 
                onClick={() => setLiveStreamLogs([])}
                className="text-zinc-500 hover:text-zinc-300 text-[10px]"
              >
                Clear Log
              </button>
            </div>

            <div className="max-h-36 overflow-y-auto space-y-1 pr-1 font-mono text-[10px]">
              {liveStreamLogs.length === 0 ? (
                <div className="text-zinc-600 py-2 text-center">Ready. Execute a scenario or suite to observe live AST logs.</div>
              ) : (
                liveStreamLogs.map((log, idx) => {
                  let color = 'text-zinc-400';
                  if (log.type === 'success') color = 'text-emerald-300';
                  if (log.type === 'warn') color = 'text-amber-300';
                  if (log.type === 'crit') color = 'text-rose-300 font-bold';
                  return (
                    <div key={idx} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-zinc-600 shrink-0">{log.timestamp}</span>
                      <span className={color}>{log.text}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Search & Filters Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="scenarios-search-input"
              type="text"
              placeholder="Search by scenario name, target tool, or payload..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono transition-colors"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
              >
                ×
              </button>
            )}
          </div>

          {/* Severity & Status Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            
            {/* Severity Pill Selector */}
            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
              <span className="text-zinc-500 font-mono text-[10px] px-1.5">Sev:</span>
              {['ALL', 'Security', 'Adversarial', 'Chaos', 'Edge-Case'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSelectedSeverity(sev)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                    selectedSeverity === sev 
                      ? 'bg-zinc-800 text-emerald-400 font-bold border border-zinc-700' 
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>

            {/* Status Pill Selector */}
            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
              <span className="text-zinc-500 font-mono text-[10px] px-1.5">Status:</span>
              {['ALL', 'Passed', 'Guardrail Triggered', 'Loop Detected', 'Failed'].map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                    selectedStatus === st 
                      ? 'bg-zinc-800 text-emerald-400 font-bold border border-zinc-700' 
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {st === 'Guardrail Triggered' ? 'Guardrail' : st}
                </button>
              ))}
            </div>

          </div>

        </div>

      </div>

      {/* Scenarios Table Container */}
      <div className="overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="test-scenarios-table">
            
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/80 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                <th className="py-3 px-4">Scenario Specification</th>
                <th className="py-3 px-3">Target Tool</th>
                <th className="py-3 px-3">Severity</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 hidden md:table-cell">Duration</th>
                <th className="py-3 px-3 hidden lg:table-cell">Tokens</th>
                <th className="py-3 px-3 hidden sm:table-cell">Last Run</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-800/60 text-xs">
              {filteredScenarios.map((sc) => {
                const isRunningThis = runningScenarioId === sc.id;

                return (
                  <tr 
                    key={sc.id} 
                    id={`scenario-row-${sc.id}`}
                    className={`transition-colors group ${
                      isRunningThis 
                        ? 'bg-emerald-950/20 border-l-2 border-l-emerald-500' 
                        : 'hover:bg-zinc-800/40'
                    }`}
                  >
                    
                    {/* Scenario Name, Prompt & Description */}
                    <td className="py-3.5 px-4 max-w-md">
                      <div className="font-semibold text-zinc-100 font-sans group-hover:text-emerald-300 transition-colors flex items-center gap-2">
                        <span>{sc.name}</span>
                        {isRunningThis && (
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 animate-pulse">
                            {activeStepMessage || 'Running...'}
                          </span>
                        )}
                      </div>
                      
                      <div className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5 font-sans">
                        {sc.description}
                      </div>

                      {sc.promptPayload && (
                        <div className="mt-1 p-1.5 rounded bg-zinc-950/80 border border-zinc-800 text-[10px] font-mono text-zinc-400 truncate max-w-sm">
                          <span className="text-zinc-500 mr-1">Payload:</span>
                          <span className="text-zinc-300">{sc.promptPayload}</span>
                        </div>
                      )}

                      <div className="text-[10px] text-zinc-500 font-mono mt-1">
                        Rule: <span className="text-zinc-400">{sc.guardrailRule}</span>
                      </div>
                    </td>

                    {/* Target Tool */}
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-amber-300 font-mono text-[11px]">
                        <Wrench className="w-3 h-3 text-amber-400 shrink-0" />
                        {sc.targetTool}
                      </span>
                    </td>

                    {/* Severity */}
                    <td className="py-3.5 px-3">
                      {getSeverityBadge(sc.severity)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3">
                      {getStatusBadge(sc.status)}
                    </td>

                    {/* Duration */}
                    <td className="py-3.5 px-3 hidden md:table-cell font-mono text-zinc-300 text-[11px]">
                      {sc.durationMs > 0 ? `${sc.durationMs.toLocaleString()}ms` : '—'}
                    </td>

                    {/* Tokens Used */}
                    <td className="py-3.5 px-3 hidden lg:table-cell font-mono text-zinc-400 text-[11px]">
                      {sc.tokensUsed > 0 ? `${sc.tokensUsed.toLocaleString()} tok` : '—'}
                    </td>

                    {/* Last Run */}
                    <td className="py-3.5 px-3 hidden sm:table-cell font-mono text-zinc-500 text-[11px]">
                      {sc.lastRun}
                    </td>

                    {/* Action Buttons: Run & Replay Trace */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        
                        {/* Quick Run in Sandbox Button */}
                        <button
                          id={`btn-run-scenario-${sc.id}`}
                          onClick={(e) => handleExecuteSingle(sc, e)}
                          disabled={isRunningThis || isBatchRunning}
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-[11px] font-mono font-semibold transition-all disabled:opacity-50 flex items-center gap-1.5 border border-zinc-700 active:scale-95 shadow-xs"
                          title="Execute single test case in sandbox with real-time telemetry"
                        >
                          {isRunningThis ? (
                            <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
                          ) : (
                            <Play className="w-3 h-3 text-emerald-400 fill-current" />
                          )}
                          <span>{isRunningThis ? 'Testing...' : 'Run'}</span>
                        </button>

                        {/* Replay Trace Action Button */}
                        <button
                          id={`btn-replay-trace-${sc.id}`}
                          onClick={() => onReplayTrace(sc.traceId)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-zinc-950 font-bold font-mono text-[11px] transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
                          title="Open step-by-step execution timeline & guardrail debugger"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span className="hidden sm:inline">Trace</span>
                        </button>

                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>

          </table>
        </div>

        {/* Empty state */}
        {filteredScenarios.length === 0 && (
          <div className="p-12 text-center text-zinc-400">
            <Layers className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-zinc-300">No test scenarios match current filters</p>
            <p className="text-xs text-zinc-500 mt-1">Try resetting your search query or severity filters.</p>
            <button 
              onClick={() => { setSearchTerm(''); setSelectedSeverity('ALL'); setSelectedStatus('ALL'); }}
              className="mt-3 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono rounded-lg transition-colors inline-flex items-center gap-1"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Modal: Add Custom Adversarial Test Vector */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl p-6 space-y-4">
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">Add Custom Test Vector</h3>
                  <p className="text-xs text-zinc-400">Author custom red-teaming vectors and sandbox guardrail rules.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomScenario} className="space-y-4 text-xs font-mono">
              
              <div>
                <label className="block text-zinc-400 mb-1">Scenario Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prompt Injection: Privilege Escalation via System Override"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Target Tool *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. exec_database_query, bash_exec"
                    value={customTool}
                    onChange={(e) => setCustomTool(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Severity Category</label>
                  <select
                    value={customSeverity}
                    onChange={(e) => setCustomSeverity(e.target.value as SeverityLevel)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono"
                  >
                    <option value="Security">Security (Destructive/DDL)</option>
                    <option value="Adversarial">Adversarial (Jailbreaks/Drift)</option>
                    <option value="Chaos">Chaos (Tool Loops/DoS)</option>
                    <option value="Edge-Case">Edge-Case (Malformed Data)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Adversarial Prompt Payload *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Enter simulated attacker prompt or malicious payload..."
                  value={customPayload}
                  onChange={(e) => setCustomPayload(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Guardrail Rule / Expected Verification</label>
                <input
                  type="text"
                  placeholder="e.g. POLICY_PREVENT_UNAUTHORIZED_DDL"
                  value={customRule}
                  onChange={(e) => setCustomRule(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingScenario}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold font-mono text-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSavingScenario ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Save Test Vector</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </section>
  );
};

