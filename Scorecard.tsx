import React from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  Activity, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Repeat, 
  ShieldCheck,
  AlertOctagon,
  Sparkles
} from 'lucide-react';
import { MetricScorecard, Agent } from '../types';

interface ScorecardProps {
  scorecard: MetricScorecard;
  agent: Agent;
}

export const Scorecard: React.FC<ScorecardProps> = ({ scorecard, agent }) => {
  const isPositiveDelta = scorecard.reliabilityDelta >= 0;

  return (
    <section className="space-y-3" aria-label="Reliability Metrics Scorecard">
      {/* Quick context subheader */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Reliability Scorecard
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Continuous adversarial verification against destructive tools, goal drift, and cyclic recursion.
          </p>
        </div>
      </div>

      {/* 4 Primary Scorecard Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Card 1: Overall Reliability Score */}
        <div 
          id="scorecard-reliability"
          className="relative overflow-hidden rounded-xl bg-zinc-900/90 border border-zinc-800 p-4 transition-all hover:border-zinc-700 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono">
              Overall Reliability
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
              {scorecard.overallReliabilityScore}%
            </span>
            <span className={`text-xs font-mono font-semibold flex items-center gap-0.5 ${
              isPositiveDelta ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {isPositiveDelta ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isPositiveDelta ? `+${scorecard.reliabilityDelta}%` : `${scorecard.reliabilityDelta}%`}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-3 w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${scorecard.overallReliabilityScore}%` }}
            />
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Pass Grade: <strong className="text-emerald-400 font-semibold">{scorecard.overallReliabilityScore >= 90 ? 'Grade A' : scorecard.overallReliabilityScore >= 80 ? 'Grade B' : 'Grade C'}</strong></span>
            <span>Target: &gt; 92.0%</span>
          </div>
        </div>

        {/* Card 2: Total Scenarios Executed */}
        <div 
          id="scorecard-total-scenarios"
          className="relative overflow-hidden rounded-xl bg-zinc-900/90 border border-zinc-800 p-4 transition-all hover:border-zinc-700 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono">
              Total Scenarios Executed
            </span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Activity className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
              {scorecard.totalScenariosExecuted.toLocaleString()}
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              across 4 suites
            </span>
          </div>

          {/* Mini breakdown bar */}
          <div className="mt-3 w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden flex">
            <div 
              className="bg-emerald-500 h-full"
              style={{ width: `${(scorecard.passCount / scorecard.totalScenariosExecuted) * 100}%` }}
              title="Passed"
            />
            <div 
              className="bg-rose-500 h-full"
              style={{ width: `${(scorecard.failCount / scorecard.totalScenariosExecuted) * 100}%` }}
              title="Failed"
            />
            <div 
              className="bg-amber-500 h-full"
              style={{ width: `${(scorecard.blockedActions / scorecard.totalScenariosExecuted) * 100}%` }}
              title="Blocked"
            />
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-zinc-400">
            <span className="text-emerald-400 font-medium">{scorecard.passCount} passed</span>
            <span className="text-rose-400 font-medium">{scorecard.failCount} failed</span>
          </div>
        </div>

        {/* Card 3: Unsafe Actions Blocked (Highlighted in high-contrast red/rose badge) */}
        <div 
          id="scorecard-unsafe-blocked"
          className="relative overflow-hidden rounded-xl bg-gradient-to-b from-rose-950/40 via-zinc-900 to-zinc-900 border-2 border-rose-600/70 p-4 transition-all hover:border-rose-500 shadow-lg shadow-rose-950/40"
        >
          <div className="absolute top-0 right-0 px-2 py-0.5 bg-rose-600 text-white text-[9px] font-mono font-bold uppercase tracking-wider rounded-bl-lg">
            High Severity Intercepts
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
              Unsafe Actions Blocked
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-400 font-mono tracking-tight">
              {scorecard.blockedActions}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono font-semibold">
              0 Escapes
            </span>
          </div>

          {/* Guardrail alert badge */}
          <div className="mt-3 p-1.5 rounded-lg bg-rose-950/60 border border-rose-800/60 text-[11px] text-rose-200 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="truncate font-mono text-[10px]">
              Guardrail Intercept: <strong>{scorecard.guardrailEfficiency}% eff.</strong>
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
            <span>Critical DDL / Escalations</span>
            <span className="text-rose-400 font-bold">{scorecard.totalScenariosExecuted > 0 ? '100% Intercepted' : '0 Intercepted'}</span>
          </div>
        </div>

        {/* Card 4: Average Tool Latency / Loop Rate */}
        <div 
          id="scorecard-latency-loops"
          className="relative overflow-hidden rounded-xl bg-zinc-900/90 border border-zinc-800 p-4 transition-all hover:border-zinc-700 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono">
              Latency & Tool Loops
            </span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
                {scorecard.avgToolLatencyMs}
                <span className="text-sm font-normal text-zinc-400">ms</span>
              </span>
              <span className="block text-[10px] text-zinc-400 font-mono">Avg tool call latency</span>
            </div>

            <div className="text-right">
              <div className="flex items-center justify-end gap-1 text-amber-400 font-mono font-bold text-sm">
                <Repeat className="w-3.5 h-3.5" />
                <span>{scorecard.toolLoopRate}%</span>
              </div>
              <span className="block text-[10px] text-zinc-400 font-mono">Loop anomaly rate</span>
            </div>
          </div>

          {/* Quick status pill */}
          <div className="mt-3 p-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-between text-[11px]">
            <span className="text-zinc-300">Tool Cycle Breaker:</span>
            <span className="text-emerald-400 font-mono font-semibold">Active (limit=10)</span>
          </div>

          <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-400">
            <span>P99 Timeout: 1200ms</span>
            <span className="text-zinc-300 font-mono">OK</span>
          </div>
        </div>

      </div>
    </section>
  );
};
