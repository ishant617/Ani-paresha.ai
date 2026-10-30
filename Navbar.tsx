import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ChevronDown, 
  Play, 
  Server, 
  Activity, 
  Layers, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle,
  Cpu,
  RefreshCw,
  GitBranch,
  Wand2,
  Box,
  User,
  Webhook,
  Scale
} from 'lucide-react';
import { Agent } from '../types';

interface UserData {
  id: string;
  name: string;
}

interface NavbarProps {
  agents: Agent[];
  selectedAgent: Agent;
  onSelectAgent: (agent: Agent) => void;
  activeView: 'overview' | 'regression' | 'debugger' | 'scenarios' | 'generator' | 'sandbox' | 'webhook' | 'classifier';
  onSelectView: (view: 'overview' | 'regression' | 'debugger' | 'scenarios' | 'generator' | 'sandbox' | 'webhook' | 'classifier') => void;
  onOpenRunModal: () => void;
  isEvaluating?: boolean;
  currentUser: UserData;
  allUsers: UserData[];
  onSelectUser: (user: UserData) => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  agents,
  selectedAgent,
  onSelectAgent,
  activeView,
  onSelectView,
  onOpenRunModal,
  isEvaluating = false,
  currentUser,
  allUsers,
  onSelectUser,
  onLogout
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Platform Branding */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectView('overview')}>
              <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-amber-600 via-orange-500 to-rose-500 p-[1px] flex items-center justify-center shadow-lg shadow-orange-950/50">
                <div className="h-full w-full bg-zinc-950 rounded-[7px] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-orange-400" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-white text-base tracking-tight font-mono">
                  AGNIPARIKSHA<span className="text-orange-400">.AI</span>
                </span>
              </div>
            </div>

            {/* View Switcher Tabs */}
            <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-zinc-800">
              <button
                id="nav-tab-overview"
                onClick={() => onSelectView('overview')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  activeView === 'overview'
                    ? 'bg-zinc-800 text-emerald-400 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                Overview & Metrics
              </button>

              <button
                id="nav-tab-regression"
                onClick={() => onSelectView('regression')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  activeView === 'regression'
                    ? 'bg-zinc-800 text-orange-400 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5 text-orange-400" />
                <span>Regression Tracker</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                  2 Regressions
                </span>
              </button>

              <button
                id="nav-tab-debugger"
                onClick={() => onSelectView('debugger')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  activeView === 'debugger'
                    ? 'bg-zinc-800 text-emerald-400 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                Visual Trace Debugger
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
              </button>

              <button
                id="nav-tab-scenarios"
                onClick={() => onSelectView('scenarios')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  activeView === 'scenarios'
                    ? 'bg-zinc-800 text-emerald-400 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Test Scenarios Matrix
              </button>

              <button
                id="nav-tab-generator"
                onClick={() => onSelectView('generator')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  activeView === 'generator'
                    ? 'bg-zinc-800 text-orange-400 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <Wand2 className="w-3.5 h-3.5" />
                Scenario Generator
              </button>
              <button
                id="nav-tab-sandbox"
                onClick={() => onSelectView('sandbox')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  activeView === 'sandbox'
                    ? 'bg-zinc-800 text-sky-400 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                Sandbox Replay
              </button>

              <button
                id="nav-tab-webhook"
                onClick={() => onSelectView('webhook')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  activeView === 'webhook'
                    ? 'bg-zinc-800 text-purple-400 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <Webhook className="w-3.5 h-3.5" />
                BYO-Agent Webhook
              </button>

              <button
                onClick={() => onSelectView('classifier')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  activeView === 'classifier'
                    ? 'bg-zinc-800 text-purple-400 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                LLM Classifier
              </button>
            </nav>
          </div>

          {/* Right Section: User Selector, Active Agent Selector, Action CTA */}
          <div className="flex items-center gap-3">
            
            {/* User Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-700/80 text-left transition-all hover:border-zinc-600 text-xs"
              >
                <div className="p-1 rounded bg-zinc-800 text-sky-400">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className="font-semibold text-zinc-100 font-mono max-w-[120px] truncate">
                  {currentUser.name}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl z-50 p-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-zinc-800 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Switch Active User
                  </div>
                  <div className="py-1 space-y-1">
                    {allUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          onSelectUser(u);
                          setUserDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-lg transition-colors flex items-center gap-2.5 ${
                          currentUser.id === u.id 
                            ? 'bg-zinc-800/90 border border-sky-500/30 text-sky-400' 
                            : 'hover:bg-zinc-800/50 text-zinc-300'
                        }`}
                      >
                        <User className="w-4 h-4" />
                        <span className="text-xs font-medium truncate font-mono">
                          {u.name}
                        </span>
                      </button>
                    ))}
                    {onLogout && (
                      <>
                        <div className="border-t border-zinc-800 my-1"></div>
                        <button
                          onClick={() => {
                            onLogout();
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left p-2.5 rounded-lg transition-colors flex items-center gap-2.5 hover:bg-zinc-800/50 text-rose-400"
                        >
                          <span className="text-xs font-medium truncate font-mono">
                            Sign Out
                          </span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Active Agent Selector Dropdown */}
            <div className="relative">
              <button
                id="agent-selector-dropdown-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-700/80 text-left transition-all hover:border-zinc-600 text-xs"
              >
                <div className="p-1 rounded bg-zinc-800 text-emerald-400">
                  <Cpu className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-zinc-100 font-mono tracking-tight max-w-[140px] sm:max-w-[190px] truncate">
                      {selectedAgent?.name || 'No Agent'}
                    </span>
                    {selectedAgent && (
                      <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                        {selectedAgent.version}
                      </span>
                    )}
                  </div>
                  {selectedAgent && (
                    <span className="text-[10px] text-zinc-400 truncate max-w-[160px]">
                      Reliability: <strong className="text-emerald-400">{selectedAgent.reliabilityScore}%</strong>
                    </span>
                  )}
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl z-50 p-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-zinc-800 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Select Target Agent Pipeline
                  </div>
                  <div className="py-1 space-y-1">
                    {agents.map((agent) => (
                      <button
                        key={agent.id}
                        id={`agent-option-${agent.id}`}
                        onClick={() => {
                          onSelectAgent(agent);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-lg transition-colors flex items-start gap-2.5 ${
                          selectedAgent?.id === agent.id 
                            ? 'bg-zinc-800/90 border border-emerald-500/30' 
                            : 'hover:bg-zinc-800/50'
                        }`}
                      >
                        <div className={`mt-0.5 p-1 rounded ${
                          agent.status === 'Healthy' ? 'bg-emerald-500/10 text-emerald-400' :
                          agent.status === 'Degraded' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-rose-500/10 text-rose-400'
                        }`}>
                          <Cpu className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-zinc-100 truncate font-mono">
                              {agent.name}
                            </span>
                            <span className={`text-[10px] font-mono font-bold ${
                              agent.reliabilityScore >= 90 ? 'text-emerald-400' :
                              agent.reliabilityScore >= 75 ? 'text-amber-400' : 'text-rose-400'
                            }`}>
                              {agent.reliabilityScore}%
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                            {agent.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-500">
                            <span>{agent.model}</span>
                            <span>•</span>
                            <span>{agent.totalRuns} test runs</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* "Run New Evaluation" Primary Action Button */}
            <button
              id="run-new-evaluation-btn"
              onClick={onOpenRunModal}
              disabled={isEvaluating}
              className="relative group overflow-hidden px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold text-xs transition-all shadow-md shadow-emerald-950/60 flex items-center gap-2 active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              {isEvaluating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-950" />
                  <span className="font-bold">Evaluating...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-zinc-950 text-zinc-950" />
                  <span className="font-bold">Run New Evaluation</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
