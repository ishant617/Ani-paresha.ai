import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  PieChart, 
  Pie, 
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { 
  BarChart3, 
  PieChart as PieIcon, 
  TrendingUp, 
  ShieldAlert, 
  Cpu, 
  Layers, 
  Info,
  Bug,
  Compass
} from 'lucide-react';
import { FailureModeItem, VersionHistoryPoint } from '../types';

interface VisualAnalyticsProps {
  failureModes: FailureModeItem[];
  versionHistory: VersionHistoryPoint[];
  onSelectFailureMode?: (category: string) => void;
}

export const VisualAnalytics: React.FC<VisualAnalyticsProps> = ({
  failureModes,
  versionHistory,
  onSelectFailureMode
}) => {
  const [chartMode, setChartMode] = useState<'bar' | 'donut'>('bar');
  const [historyMetric, setHistoryMetric] = useState<'rates' | 'latency'>('rates');

  const totalFailures = failureModes.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <section className="space-y-4" aria-label="Visual Analytics">
      
      {/* Grid Container for the 2 Primary Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Chart 1: Failure Mode Taxonomy Chart (5 or 6 cols on lg) */}
        <div 
          id="chart-failure-taxonomy"
          className="lg:col-span-6 xl:col-span-6 rounded-xl bg-zinc-900/90 border border-zinc-800 p-4 shadow-sm flex flex-col justify-between"
        >
          {/* Header & Controls */}
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <Bug className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight font-mono">
                    Failure Mode Taxonomy
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Distribution across {totalFailures} detected edge-case failure events
                  </p>
                </div>
              </div>

              {/* Bar vs Donut Toggle */}
              <div className="flex items-center bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 text-xs">
                <button
                  onClick={() => setChartMode('bar')}
                  className={`p-1 rounded flex items-center gap-1 ${
                    chartMode === 'bar' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                  title="Horizontal Bar Chart"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setChartMode('donut')}
                  className={`p-1 rounded flex items-center gap-1 ${
                    chartMode === 'donut' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                  title="Donut Chart"
                >
                  <PieIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Sub-label */}
            <div className="mt-2 text-[10px] text-zinc-500 font-mono">
              // Categories: Silent Goal Drift • Tool-Call Loop • Hallucinated Confidence • Destructive Action • Context Overflow
            </div>
          </div>

          {/* Chart Rendering Area */}
          <div className="mt-4 h-64 w-full">
            {chartMode === 'bar' ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={failureModes}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                  <XAxis 
                    type="number" 
                    stroke="#71717a" 
                    fontSize={11}
                    tickFormatter={(val) => `${val}`}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="category" 
                    stroke="#a1a1aa" 
                    fontSize={10} 
                    width={130}
                    tickFormatter={(val) => val.length > 18 ? `${val.substring(0, 16)}...` : val}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: '#3f3f46',
                      borderRadius: '0.5rem',
                      fontSize: '12px',
                      color: '#f4f4f5'
                    }}
                    formatter={(value: any, name: any, item: any) => [
                      `${value} incidents (${item.payload.percentage}%)`,
                      'Count'
                    ]}
                  />
                  <Bar 
                    dataKey="count" 
                    radius={[0, 4, 4, 0]}
                    cursor="pointer"
                    onClick={(entry) => onSelectFailureMode && onSelectFailureMode(entry.category)}
                  >
                    {failureModes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={failureModes}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="count"
                    nameKey="category"
                  >
                    {failureModes.map((entry, index) => (
                      <Cell key={`cell-pie-${index}`} fill={entry.color} stroke="#18181b" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: '#3f3f46',
                      borderRadius: '0.5rem',
                      fontSize: '12px',
                      color: '#f4f4f5'
                    }}
                    formatter={(value: any, name: any, item: any) => [
                      `${value} cases (${item.payload.percentage}%)`,
                      name
                    ]}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '10px', color: '#a1a1aa', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Quick Category Summary Footer */}
          <div className="mt-3 pt-3 border-t border-zinc-800/80 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500"></span>
              <span className="text-zinc-300">Destructive Actions:</span>
              <strong className="text-rose-400 font-mono">
                {failureModes.find(m => m.category.includes('Destructive'))?.percentage || 0}%
              </strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
              <span className="text-zinc-300">Tool-Call Loops:</span>
              <strong className="text-amber-400 font-mono">
                {failureModes.find(m => m.category.includes('Loop'))?.percentage || 0}%
              </strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-purple-500"></span>
              <span className="text-zinc-300">Goal Drift:</span>
              <strong className="text-purple-400 font-mono">
                {failureModes.find(m => m.category.includes('Drift'))?.percentage || 0}%
              </strong>
            </div>
          </div>
        </div>

        {/* Chart 2: Test Run History & Regression Trend (6 cols on lg) */}
        <div 
          id="chart-test-history"
          className="lg:col-span-6 xl:col-span-6 rounded-xl bg-zinc-900/90 border border-zinc-800 p-4 shadow-sm flex flex-col justify-between"
        >
          {/* Header & Controls */}
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight font-mono">
                    Test Run History & Regressions
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Pass vs Fail vs Guardrail Intercept rate over agent releases
                  </p>
                </div>
              </div>

              {/* Metric Toggle */}
              <div className="flex items-center bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 text-xs font-mono">
                <button
                  onClick={() => setHistoryMetric('rates')}
                  className={`px-2 py-0.5 rounded text-[11px] ${
                    historyMetric === 'rates' ? 'bg-zinc-800 text-emerald-400 font-semibold' : 'text-zinc-500'
                  }`}
                >
                  Rates (%)
                </button>
                <button
                  onClick={() => setHistoryMetric('latency')}
                  className={`px-2 py-0.5 rounded text-[11px] ${
                    historyMetric === 'latency' ? 'bg-zinc-800 text-amber-400 font-semibold' : 'text-zinc-500'
                  }`}
                >
                  Latency (ms)
                </button>
              </div>
            </div>

            <div className="mt-2 text-[10px] text-zinc-500 font-mono">
              // Tracking reliability trajectory from v1.8.0 to v2.1.4 release
            </div>
          </div>

          {/* Chart Rendering Area */}
          <div className="mt-4 h-64 w-full">
            {historyMetric === 'rates' ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={versionHistory}
                  margin={{ top: 10, right: 15, left: -15, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="passGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="failGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="version" stroke="#71717a" fontSize={10} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={10} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: '#3f3f46',
                      borderRadius: '0.5rem',
                      fontSize: '12px',
                      color: '#f4f4f5'
                    }}
                    formatter={(value: any, name: any) => [`${value}%`, name]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="passRate" 
                    name="Pass Rate" 
                    stroke="#10b981" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#passGradient)" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="failRate" 
                    name="Fail Rate" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#ef4444' }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="blockedRate" 
                    name="Guardrail Intercepted" 
                    stroke="#f59e0b" 
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={{ r: 2, fill: '#f59e0b' }} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={versionHistory}
                  margin={{ top: 10, right: 15, left: -15, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="version" stroke="#71717a" fontSize={10} />
                  <YAxis stroke="#71717a" fontSize={10} domain={[200, 600]} tickFormatter={(val) => `${val}ms`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: '#3f3f46',
                      borderRadius: '0.5rem',
                      fontSize: '12px',
                      color: '#f4f4f5'
                    }}
                    formatter={(value: any) => [`${value} ms`, 'Avg Tool Latency']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="avgLatency" 
                    name="Avg Tool Latency" 
                    stroke="#f59e0b" 
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#f59e0b' }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Version delta summary */}
          <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
            <div className="text-zinc-400">
              Pass Rate Trend: <strong className="text-emerald-400 font-mono">+13.4%</strong> since v1.8
            </div>
            <div className="text-zinc-400">
              Latency Reduction: <strong className="text-amber-400 font-mono">-178ms (34.2%)</strong>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
