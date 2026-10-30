import React, { useState } from 'react';
import { 
  GitBranch, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  RefreshCw, 
  Layers, 
  ShieldCheck, 
  Eye, 
  FileSpreadsheet, 
  Zap, 
  History, 
  Sparkles, 
  Filter, 
  ChevronRight 
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  Agent, 
  TaskCategoryReliability, 
  VersionRelease, 
  RegressionAlert,
  TestScenario 
} from '../types';

interface RegressionTrackerProps {
  agent: Agent;
  taskCategories: TaskCategoryReliability[];
  versionReleases: VersionRelease[];
  regressionAlerts: RegressionAlert[];
  onInvestigateTrace: (traceId: string) => void;
  onFilterCategory?: (category: string) => void;
  onSimulateNewRelease?: () => void;
  onResolveAlert?: (alertId: string) => void;
  onPromoteCanary?: (version: string) => void;
  onRollbackRelease?: (targetVersion: string) => void;
}

export const RegressionTracker: React.FC<RegressionTrackerProps> = ({
  agent,
  taskCategories,
  versionReleases,
  regressionAlerts,
  onInvestigateTrace,
  onFilterCategory,
  onSimulateNewRelease,
  onResolveAlert,
  onPromoteCanary,
  onRollbackRelease
}) => {
  // State
  const [selectedBaseVersion, setSelectedBaseVersion] = useState<string>(versionReleases[0]?.version || 'v2.1.4-prod');
  const [selectedCompareVersion, setSelectedCompareVersion] = useState<string>(versionReleases[1]?.version || 'v2.1.0-rc3');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [chartMetricView, setChartMetricView] = useState<'category_trends' | 'reliability_area'>('category_trends');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Active version objects
  const baseRelease = versionReleases.find(v => v.version === selectedBaseVersion) || versionReleases[0];
  const compareRelease = versionReleases.find(v => v.version === selectedCompareVersion) || versionReleases[1] || versionReleases[0];

  if (!baseRelease || !compareRelease) {
    return (
      <div className="p-8 text-center text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-xl">
        No version history available for regression tracking yet. Run an evaluation to populate this view.
      </div>
    );
  }

  // Overall comparison metrics
  const scoreDelta = Number((baseRelease.overallReliability - compareRelease.overallReliability).toFixed(1));
  const latencyDelta = baseRelease.avgLatencyMs - compareRelease.avgLatencyMs;
  const passDelta = baseRelease.passCount - compareRelease.passCount;

  // Filtered categories
  const filteredCategories = taskCategories.filter(cat => {
    const matchesRisk = filterRisk === 'all' || cat.riskLevel.toLowerCase() === filterRisk.toLowerCase();
    const matchesStatus = filterStatus === 'all' || cat.status === filterStatus;
    return matchesRisk && matchesStatus;
  });

  // Calculate summary stats
  const activeAlerts = regressionAlerts.filter(a => a.status === 'active' || a.status === 'investigating');
  const regressedCount = taskCategories.filter(c => c.status === 'regressed').length;
  const improvedCount = taskCategories.filter(c => c.status === 'improved').length;
  const stableCount = taskCategories.filter(c => c.status === 'stable').length;

  // Is base release a canary candidate?
  const isCanaryRelease = baseRelease.version.includes('-canary') || baseRelease.version.includes('-rc');

  // Trend chart data transformation
  const trendData = [...versionReleases].reverse().map(rel => ({
    version: rel.version.replace('-prod', '').replace('-stable', ''),
    overall: rel.overallReliability,
    'Destructive Prevention': rel.categoryScores?.['destructive-actions'] || 90,
    'Goal Drift': rel.categoryScores?.['goal-drift'] || 85,
    'Tool Loops': rel.categoryScores?.['tool-loops'] || 90,
    'Prompt Injection': rel.categoryScores?.['prompt-injection'] || 88,
    'Data Exfiltration': rel.categoryScores?.['data-exfiltration'] || 92,
    'Context Overflow': rel.categoryScores?.['context-overflow'] || 80
  }));

  // Generate markdown report
  const generateMarkdownReport = () => {
    return `# Agnipariksha.AI - Agent Reliability & Regression Report
**Target Agent:** ${agent?.name || 'Autonomous Agent'} (${agent?.model || 'LLM Model'})
**Evaluation Version:** ${baseRelease.version} (${baseRelease.commitSha})
**Comparison Base:** ${compareRelease.version} (${compareRelease.commitSha})
**Overall Reliability Score:** ${baseRelease.overallReliability}% (${scoreDelta >= 0 ? `+${scoreDelta}%` : `${scoreDelta}%`})

## 📊 Category Reliability Breakdown
${taskCategories.map(cat => `- **${cat.categoryName}**: ${cat.currentScore}% (${cat.scoreDelta >= 0 ? `+${cat.scoreDelta}%` : `${cat.scoreDelta}%`}) - Status: ${cat.status.toUpperCase()}`).join('\n')}

## ⚠️ Detected Regressions (${regressionAlerts.length})
${regressionAlerts.map(reg => `### [${reg.severity}] ${reg.title}
- **Category:** ${reg.category}
- **Status:** ${reg.status.toUpperCase()}
- **Impact:** ${reg.scoreDrop}% drop vs ${reg.previousVersion}
- **Root Cause Hypothesis:** ${reg.rootCauseHypothesis}
- **Trace Reference:** \`${reg.traceId}\``).join('\n\n')}
`;
  };

  return (
    <section className="space-y-6 relative" aria-label="Reliability Scorecard and Regression Tracker">
      
      {/* Live Toast Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-zinc-900 border border-orange-500/80 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-3 text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-orange-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header & Version Comparison Bar */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Header Title */}
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400">
                <GitBranch className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Reliability Scorecard & Regression Tracker</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-semibold">
                    CI Release Comparator
                  </span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Continuous tracking of agent safety, tool compliance, and performance drifts across releases and task domains.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-800 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-400" />
              <span>Export CI Report</span>
            </button>

            {onSimulateNewRelease && (
              <button
                onClick={onSimulateNewRelease}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-semibold shadow-md shadow-orange-950/40 transition-all active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 fill-white" />
                <span>Simulate Canary Release</span>
              </button>
            )}
          </div>
        </div>

        {/* Version Comparator Selectors & Delta Highlights */}
        <div className="mt-5 pt-4 border-t border-zinc-800/80 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          
          {/* Base Version Selector */}
          <div className="md:col-span-4 bg-zinc-950/70 p-3 rounded-lg border border-zinc-800">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-medium text-zinc-400">
                Active Evaluated Version
              </label>
              {isCanaryRelease && onPromoteCanary && (
                <button
                  onClick={() => {
                    onPromoteCanary(baseRelease.version);
                    showToast(`Canary ${baseRelease.version} promoted to Production!`);
                  }}
                  className="text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Promote to Prod</span>
                </button>
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
              <select
                value={selectedBaseVersion}
                onChange={(e) => setSelectedBaseVersion(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded-md px-2.5 py-1.5 text-xs text-white font-mono focus:border-orange-500 outline-none w-full"
              >
                {versionReleases.map(v => (
                  <option key={v.version} value={v.version}>
                    {v.version} ({v.commitSha}) - {v.overallReliability}% {v.isRegression ? '⚠️' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
              <span>Model: {baseRelease.modelUsed}</span>
              <span>Runs: {baseRelease.totalRuns}</span>
            </div>
          </div>

          {/* VS Divider Icon */}
          <div className="hidden md:flex md:col-span-1 justify-center">
            <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-400 font-mono">
              VS
            </div>
          </div>

          {/* Compare Version Selector */}
          <div className="md:col-span-4 bg-zinc-950/70 p-3 rounded-lg border border-zinc-800">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-medium text-zinc-400">
                Baseline / Comparison Version
              </label>
              {baseRelease.isRegression && onRollbackRelease && (
                <button
                  onClick={() => {
                    onRollbackRelease(compareRelease.version);
                    showToast(`Rolled back active agent to ${compareRelease.version}!`);
                  }}
                  className="text-[10px] font-semibold text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1"
                >
                  <History className="w-3 h-3" />
                  <span>Rollback to this</span>
                </button>
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
              <select
                value={selectedCompareVersion}
                onChange={(e) => setSelectedCompareVersion(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded-md px-2.5 py-1.5 text-xs text-white font-mono focus:border-orange-500 outline-none w-full"
              >
                {versionReleases.map(v => (
                  <option key={v.version} value={v.version}>
                    {v.version} ({v.commitSha}) - {v.overallReliability}%
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
              <span>Model: {compareRelease.modelUsed}</span>
              <span>Runs: {compareRelease.totalRuns}</span>
            </div>
          </div>

          {/* Quick Comparative Delta Summary */}
          <div className="md:col-span-3 bg-zinc-950/90 p-3 rounded-lg border border-zinc-800 flex flex-col justify-between">
            <div className="text-[11px] font-medium text-zinc-400">Release Delta Diff</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className={`text-xl font-bold font-mono ${scoreDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {scoreDelta >= 0 ? `+${scoreDelta}%` : `${scoreDelta}%`}
              </span>
              <span className="text-[11px] text-zinc-500 font-mono">
                reliability shift
              </span>
            </div>
            <div className="mt-1 text-[10px] text-zinc-400 flex items-center justify-between font-mono">
              <span>Latency: <strong className={latencyDelta <= 0 ? 'text-emerald-400' : 'text-amber-400'}>{latencyDelta > 0 ? `+${latencyDelta}ms` : `${latencyDelta}ms`}</strong></span>
              <span>Passes: <strong className="text-zinc-200">{passDelta > 0 ? `+${passDelta}` : passDelta}</strong></span>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Active Regression Alerts Feed */}
      {regressionAlerts.length > 0 && (
        <div className="bg-rose-950/30 border border-rose-800/80 rounded-xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Active Category Regressions Detected ({activeAlerts.length} Active, {regressionAlerts.filter(a => a.status === 'mitigated').length} Mitigated)
              </h3>
            </div>
            <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-rose-900/60 text-rose-300 border border-rose-700">
              CI Action Required
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {regressionAlerts.map(alert => {
              const isMitigated = alert.status === 'mitigated';
              return (
                <div 
                  key={alert.id}
                  className={`rounded-lg p-3.5 flex flex-col justify-between transition-colors shadow-sm border ${
                    isMitigated 
                      ? 'bg-zinc-900/60 border-zinc-800 opacity-75' 
                      : 'bg-zinc-900/90 border-rose-800/60 hover:border-rose-600'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                          isMitigated
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : alert.severity === 'Critical' 
                            ? 'bg-rose-950 text-rose-300 border border-rose-700' 
                            : 'bg-amber-950 text-amber-300 border border-amber-700'
                        }`}>
                          {isMitigated ? 'MITIGATED' : alert.severity}
                        </span>
                        <span className="text-xs font-semibold text-white">{alert.category}</span>
                      </div>
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                        isMitigated 
                          ? 'text-emerald-400 bg-emerald-950/80 border-emerald-800' 
                          : 'text-rose-400 bg-rose-950/80 border-rose-800'
                      }`}>
                        {isMitigated ? 'Patch Verified' : `-${alert.scoreDrop}% Drop`}
                      </span>
                    </div>

                    <h4 className="text-xs font-medium text-zinc-200 mt-2">
                      {alert.title}
                    </h4>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                      {alert.description}
                    </p>

                    <div className="mt-2.5 p-2 rounded bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-zinc-400">
                      <span className="text-orange-400 font-semibold">Root Cause Hypothesis: </span>
                      {alert.rootCauseHypothesis}
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-zinc-800 flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500 font-mono text-[10px]">
                      Detected in {alert.version} vs {alert.previousVersion}
                    </span>
                    <div className="flex items-center gap-2">
                      {!isMitigated && onResolveAlert && (
                        <button
                          onClick={() => {
                            onResolveAlert(alert.id);
                            showToast(`Applied AST guardrail patch for ${alert.category}!`);
                          }}
                          className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold px-2 py-1 rounded bg-emerald-950/60 border border-emerald-800/80 transition-colors"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>Apply Patch</span>
                        </button>
                      )}
                      <button
                        onClick={() => onInvestigateTrace(alert.traceId)}
                        className="flex items-center gap-1 text-orange-400 hover:text-orange-300 font-medium transition-colors text-[11px]"
                      >
                        <span>Inspect Trace</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Task Category Reliability Matrix */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
        
        {/* Category Matrix Header & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Task Category Reliability Matrix</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Score breakdowns across core agent functional domains and adversarial threat surfaces.
            </p>
          </div>

          {/* Quick status counters and filter controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs">
              <span className="px-2 py-0.5 text-[11px] font-mono text-emerald-400">
                {improvedCount} Improved
              </span>
              <span className="text-zinc-700">|</span>
              <span className="px-2 py-0.5 text-[11px] font-mono text-zinc-400">
                {stableCount} Stable
              </span>
              <span className="text-zinc-700">|</span>
              <span className="px-2 py-0.5 text-[11px] font-mono text-rose-400 font-semibold">
                {regressedCount} Regressed
              </span>
            </div>

            {/* Filter by Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-300 font-mono focus:border-orange-500 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="regressed">Regressed Only</option>
              <option value="improved">Improved Only</option>
              <option value="stable">Stable Only</option>
            </select>

            {/* Filter by Risk Level */}
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-300 font-mono focus:border-orange-500 outline-none"
            >
              <option value="all">All Risk Levels</option>
              <option value="critical">Critical Risk</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option>
            </select>
          </div>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredCategories.map(cat => {
            const isRegressed = cat.status === 'regressed';
            const isImproved = cat.status === 'improved';
            const isExpanded = expandedCategoryId === cat.categoryId;

            return (
              <div
                key={cat.categoryId}
                className={`rounded-xl border p-4 transition-all cursor-pointer ${
                  isRegressed
                    ? 'bg-rose-950/20 border-rose-800/80 hover:border-rose-600'
                    : isImproved
                    ? 'bg-zinc-950/70 border-zinc-800 hover:border-emerald-700/80'
                    : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700'
                }`}
                onClick={() => setExpandedCategoryId(isExpanded ? null : cat.categoryId)}
              >
                {/* Card Top */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      cat.riskLevel === 'Critical'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : cat.riskLevel === 'High'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-blue-950 text-blue-300 border border-blue-800'
                    }`}>
                      {cat.riskLevel} Risk
                    </span>
                    <h4 className="text-sm font-bold text-white mt-1.5">
                      {cat.categoryName}
                    </h4>
                  </div>

                  {/* Score & Delta */}
                  <div className="text-right">
                    <div className="text-xl font-bold font-mono text-white">
                      {cat.currentScore}%
                    </div>
                    <span className={`text-[11px] font-mono font-semibold flex items-center justify-end gap-0.5 ${
                      cat.scoreDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {cat.scoreDelta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {cat.scoreDelta >= 0 ? `+${cat.scoreDelta}%` : `${cat.scoreDelta}%`}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      cat.currentScore >= 95 
                        ? 'bg-emerald-400' 
                        : cat.currentScore >= 90 
                        ? 'bg-teal-400' 
                        : cat.currentScore >= 80 
                        ? 'bg-amber-400' 
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${cat.currentScore}%` }}
                  />
                </div>

                {/* Description */}
                <p className="text-[11px] text-zinc-400 mt-2.5 leading-relaxed line-clamp-2">
                  {cat.description}
                </p>

                {/* Stats row */}
                <div className="mt-3 pt-2.5 border-t border-zinc-800/80 grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                  <div className="bg-zinc-900/90 p-1.5 rounded border border-zinc-800">
                    <div className="text-zinc-500">Passed</div>
                    <div className="text-emerald-400 font-bold">{cat.passCount}</div>
                  </div>
                  <div className="bg-zinc-900/90 p-1.5 rounded border border-zinc-800">
                    <div className="text-zinc-500">Failed</div>
                    <div className="text-rose-400 font-bold">{cat.failCount}</div>
                  </div>
                  <div className="bg-zinc-900/90 p-1.5 rounded border border-zinc-800">
                    <div className="text-zinc-500">Latency</div>
                    <div className="text-zinc-300 font-bold">{cat.avgLatencyMs}ms</div>
                  </div>
                </div>

                {/* Regression footnote if regressed */}
                {cat.recentRegressionIssue && (
                  <div className="mt-2.5 p-2 rounded bg-rose-950/40 border border-rose-800/60 text-[10px] text-rose-300 leading-snug">
                    ⚠️ {cat.recentRegressionIssue}
                  </div>
                )}

                {/* Expanded Details */}
                {isExpanded && cat.brokenScenarioIds && cat.brokenScenarioIds.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-zinc-800 text-[10px] font-mono text-zinc-400 space-y-1 animate-in fade-in">
                    <div className="text-zinc-300 font-semibold">Associated Test Vectors:</div>
                    <div className="flex flex-wrap gap-1">
                      {cat.brokenScenarioIds.map(id => (
                        <span key={id} className="px-1.5 py-0.5 rounded bg-zinc-800 text-orange-400">
                          {id}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Multi-Release Reliability Trajectory Chart */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <History className="w-4 h-4 text-orange-400" />
              <span>Multi-Version Category Trajectory (Release History)</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Historical reliability score trajectory across release tags and model checkpoints.
            </p>
          </div>

          <div className="flex items-center bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 text-xs">
            <button
              onClick={() => setChartMetricView('category_trends')}
              className={`px-2.5 py-1 rounded text-xs font-medium ${
                chartMetricView === 'category_trends' 
                  ? 'bg-zinc-800 text-orange-400 font-semibold' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Category Overlay
            </button>
            <button
              onClick={() => setChartMetricView('reliability_area')}
              className={`px-2.5 py-1 rounded text-xs font-medium ${
                chartMetricView === 'reliability_area' 
                  ? 'bg-zinc-800 text-orange-400 font-semibold' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Aggregate Pass Rate
            </button>
          </div>
        </div>

        {/* Recharts Container */}
        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {chartMetricView === 'category_trends' ? (
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="version" stroke="#71717a" fontSize={11} />
                <YAxis domain={[70, 100]} stroke="#71717a" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', fontSize: '11px' }} 
                  labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="overall" name="Overall Reliability" stroke="#f97316" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Destructive Prevention" stroke="#10b981" strokeWidth={1.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Goal Drift" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 4" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Tool Loops" stroke="#38bdf8" strokeWidth={1.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Prompt Injection" stroke="#a855f7" strokeWidth={1.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Data Exfiltration" stroke="#eab308" strokeWidth={1.5} dot={{ r: 3 }} />
              </LineChart>
            ) : (
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="version" stroke="#71717a" fontSize={11} />
                <YAxis domain={[70, 100]} stroke="#71717a" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', fontSize: '11px' }} 
                  labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="overall" name="Reliability Score (%)" stroke="#f97316" fillOpacity={1} fill="url(#colorOverall)" strokeWidth={2} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Export CI Report Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-2xl w-full p-5 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-orange-400" />
                <h3 className="text-sm font-bold text-white">Export CI Reliability & Regression Summary</h3>
              </div>
              <button 
                onClick={() => setShowExportModal(false)}
                className="text-zinc-500 hover:text-zinc-300 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 flex-1 overflow-y-auto">
              <p className="text-xs text-zinc-400 mb-2">
                Copy this Markdown report for GitHub PR comments, GitLab CI summaries, or compliance reviews:
              </p>
              <textarea
                readOnly
                value={generateMarkdownReport()}
                rows={14}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs font-mono text-zinc-300 outline-none select-all"
              />
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-800 flex justify-end gap-2">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-semibold transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateMarkdownReport());
                  showToast('CI Report copied to clipboard!');
                  setShowExportModal(false);
                }}
                className="px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition-colors"
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
};
