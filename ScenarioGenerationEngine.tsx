import React, { useState } from 'react';
import { 
  Sparkles, 
  Terminal, 
  ShieldAlert, 
  Wand2, 
  Settings2, 
  RefreshCw, 
  Plus,
  PlayCircle,
  Database,
  Cpu,
  CheckCircle2
} from 'lucide-react';
import { Agent, GeneratedScenario, SeverityLevel } from '../types';

interface ScenarioGenerationEngineProps {
  agent: Agent;
  currentUser?: { id: string; name: string };
  onScenariosAdded?: (scenarios: any[]) => void;
}

export const ScenarioGenerationEngine: React.FC<ScenarioGenerationEngineProps> = ({ 
  agent,
  currentUser,
  onScenariosAdded
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [generatedScenarios, setGeneratedScenarios] = useState<GeneratedScenario[]>([]);
  const [selectedScenarios, setSelectedScenarios] = useState<Set<string>>(new Set());

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedScenarios([]);
    setSaveSuccessMessage(null);
    
    try {
      const res = await fetch('/api/v1/generate_scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: agent.name,
          agentModel: agent.model,
          agentDescription: agent.description
        })
      });
      const data = await res.json();
      if (data.scenarios && data.scenarios.length > 0) {
        setGeneratedScenarios(data.scenarios);
        setSelectedScenarios(new Set(data.scenarios.map((s: any) => s.id)));
      }
    } catch (e) {
      console.error("Failed to generate scenarios", e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddToSuite = async () => {
    if (selectedScenarios.size === 0) return;
    setIsSaving(true);
    try {
      const toAdd = generatedScenarios.filter(s => selectedScenarios.has(s.id));
      const res = await fetch('/api/v1/add_scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id || 'user_1',
          scenarios: toAdd
        })
      });
      const data = await res.json();
      if (data.testScenarios) {
        if (onScenariosAdded) {
          onScenariosAdded(data.testScenarios);
        }
        setSaveSuccessMessage(`Successfully added ${data.addedCount || toAdd.length} test scenarios to your evaluation suite!`);
        setTimeout(() => setSaveSuccessMessage(null), 4000);
      }
    } catch (e) {
      console.error("Failed to add scenarios", e);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSelection = (id: string) => {
    const next = new Set(selectedScenarios);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedScenarios(next);
  };

  const severityColors: Record<SeverityLevel, string> = {
    'Security': 'text-rose-400 bg-rose-950 border-rose-800',
    'Adversarial': 'text-purple-400 bg-purple-950 border-purple-800',
    'Chaos': 'text-orange-400 bg-orange-950 border-orange-800',
    'Edge-Case': 'text-amber-400 bg-amber-950 border-amber-800',
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 shadow-sm flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400">
            <Wand2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Scenario Generation Engine
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-semibold uppercase">
                AI-Assisted
              </span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Automatically synthesizes adversarial and edge-case test scenarios by analyzing the target agent's tools, system prompt, and task domain.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Configuration */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Settings2 className="w-4 h-4 text-emerald-400" />
              Generation Parameters
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Target Agent</label>
                <div className="bg-zinc-950 border border-zinc-800 rounded-md p-2 text-xs text-zinc-400 flex items-center gap-2 font-mono">
                  <Cpu className="w-3.5 h-3.5 text-zinc-500" />
                  {agent.name} ({agent.model})
                </div>
              </div>

              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <p className="text-xs text-zinc-400 leading-relaxed">
                  The engine will automatically read the selected agent's <strong>description</strong>, <strong>model capabilities</strong>, and <strong>implicit tools</strong> to synthesize context-aware adversarial scenarios and edge cases at scale.
                </p>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold shadow-md shadow-orange-950/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Synthesizing Scenarios...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-white/20" />
                  Generate Adversarial Scenarios
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Generated Output */}
        <div className="lg:col-span-8">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 shadow-sm min-h-[500px] flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-orange-400" />
                Generated Scenario Pool
              </h3>
              {generatedScenarios.length > 0 && (
                <div className="text-xs text-zinc-400 font-mono">
                  {selectedScenarios.size} of {generatedScenarios.length} selected
                </div>
              )}
            </div>

            {isGenerating ? (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 space-y-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-4 border-zinc-800 border-t-orange-500 animate-spin"></div>
                  <Sparkles className="w-4 h-4 text-orange-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-xs font-mono animate-pulse">
                  Analyzing semantic boundaries & formulating attack vectors...
                </div>
              </div>
            ) : generatedScenarios.length > 0 ? (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {generatedScenarios.map(scenario => (
                  <div 
                    key={scenario.id} 
                    className={`p-4 rounded-lg border transition-all ${
                      selectedScenarios.has(scenario.id) 
                        ? 'bg-zinc-800/80 border-orange-500/50 shadow-sm' 
                        : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button 
                        onClick={() => toggleSelection(scenario.id)}
                        className="mt-0.5 shrink-0"
                      >
                        {selectedScenarios.has(scenario.id) ? (
                          <CheckCircle2 className="w-5 h-5 text-orange-500" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-zinc-600 hover:border-orange-500 transition-colors" />
                        )}
                      </button>
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-sm font-bold text-white">{scenario.name}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-semibold">
                              {scenario.category}
                            </span>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${severityColors[scenario.severity]}`}>
                              {scenario.severity}
                            </span>
                          </div>
                        </div>

                        <div className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-md text-xs font-mono text-zinc-300">
                          <span className="text-zinc-500 select-none mr-2">$</span>
                          {scenario.promptPayload}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                          <div>
                            <div className="text-[10px] uppercase font-bold text-zinc-500 mb-1 flex items-center gap-1">
                              <ShieldAlert className="w-3 h-3 text-rose-400" /> Attack Rationale
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed">{scenario.rationale}</p>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase font-bold text-zinc-500 mb-1 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Expected Guardrail Behavior
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed">{scenario.expectedBehavior}</p>
                          </div>
                        </div>
                        
                        <div className="pt-2 flex justify-end">
                          <span className="text-[10px] font-mono text-zinc-500">
                            Target Tool: <span className="text-emerald-400">{scenario.targetTool}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {saveSuccessMessage && (
                  <div className="p-3 bg-emerald-950/50 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{saveSuccessMessage}</span>
                  </div>
                )}

                <div className="pt-4 flex items-center justify-between sticky bottom-0 bg-gradient-to-t from-zinc-900/90 via-zinc-900/90 to-transparent pb-1">
                  <span className="text-xs text-zinc-400 font-mono">
                    {selectedScenarios.size} scenario{selectedScenarios.size === 1 ? '' : 's'} ready to add
                  </span>
                  <button 
                    onClick={handleAddToSuite}
                    disabled={selectedScenarios.size === 0 || isSaving}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-500 text-zinc-950 hover:bg-emerald-400 text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Saving to Suite...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add {selectedScenarios.size} Scenarios to Test Suite
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 space-y-3">
                <Terminal className="w-10 h-10 text-zinc-700" />
                <p className="text-xs text-zinc-400">Configure parameters and generate scenarios to populate this view.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
