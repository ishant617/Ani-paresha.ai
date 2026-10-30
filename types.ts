export type SeverityLevel = 'Adversarial' | 'Chaos' | 'Edge-Case' | 'Security';
export type ScenarioStatus = 'Passed' | 'Failed' | 'Guardrail Triggered' | 'Loop Detected';
export type FailureCategory = 
  | 'Silent Goal Drift'
  | 'Tool-Call Loop'
  | 'Hallucinated Confidence'
  | 'Destructive Action Attempt'
  | 'Context Overflow';

export interface Agent {
  id: string;
  name: string;
  version: string;
  model: string;
  description: string;
  reliabilityScore: number;
  totalRuns: number;
  status: 'Healthy' | 'Degraded' | 'Critical';
  lastEvaluated: string;
  environment: string;
}

export interface MetricScorecard {
  overallReliabilityScore: number;
  reliabilityDelta: number;
  totalScenariosExecuted: number;
  passCount: number;
  failCount: number;
  blockedActions: number;
  blockedRiskScore: string;
  avgToolLatencyMs: number;
  toolLoopRate: number;
  guardrailEfficiency: number;
}

export interface FailureModeItem {
  category: FailureCategory;
  count: number;
  percentage: number;
  color: string;
  description: string;
}

export interface VersionHistoryPoint {
  version: string;
  date: string;
  passRate: number;
  failRate: number;
  blockedRate: number;
  avgLatency: number;
  totalRuns: number;
}

export interface TraceStep {
  stepNumber: number;
  title: string;
  type: 'adversarial_prompt' | 'thought_trace' | 'tool_call' | 'guardrail_intercept' | 'recovery_response';
  timestamp: string;
  durationMs: number;
  status: 'passed' | 'warning' | 'critical_intercept' | 'neutral';
  summary: string;
  payload: Record<string, any>;
  metadata: {
    promptTokens?: number;
    completionTokens?: number;
    reasoningTokens?: number;
    model?: string;
    targetTool?: string;
    riskScore?: number;
    violatedPolicy?: string;
    interceptedCommand?: string;
    guardrailAction?: string;
    systemMessage?: string;
    mockReturnedValue?: string;
  };
}

export interface ExecutionTrace {
  id: string;
  scenarioId: string;
  scenarioName: string;
  agentId: string;
  agentName: string;
  status: ScenarioStatus;
  startedAt: string;
  durationMs: number;
  totalTokens: number;
  interceptReason?: string;
  steps: TraceStep[];
}

export interface TestScenario {
  id: string;
  name: string;
  suite: string;
  targetTool: string;
  severity: SeverityLevel;
  status: ScenarioStatus;
  durationMs: number;
  tokensUsed: number;
  lastRun: string;
  description: string;
  promptPayload: string;
  guardrailRule: string;
  traceId: string;
}

export interface EvaluationSuiteConfig {
  id: string;
  name: string;
  category: string;
  scenarioCount: number;
  description: string;
  enabled: boolean;
}

export interface TaskCategoryReliability {
  categoryId: string;
  categoryName: string;
  currentScore: number;
  previousScore: number;
  scoreDelta: number;
  status: 'improved' | 'stable' | 'regressed';
  passCount: number;
  failCount: number;
  blockedCount: number;
  totalEvaluated: number;
  avgLatencyMs: number;
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  keyVulnerability?: string;
  recentRegressionIssue?: string;
  brokenScenarioIds: string[];
}

export interface VersionRelease {
  version: string;
  commitSha: string;
  releaseDate: string;
  author: string;
  modelUsed: string;
  overallReliability: number;
  reliabilityDelta: number;
  passCount: number;
  failCount: number;
  blockedCount: number;
  totalRuns: number;
  avgLatencyMs: number;
  categoryScores: Record<string, number>;
  isRegression: boolean;
  regressions?: {
    category: string;
    severity: 'Critical' | 'High' | 'Medium';
    summary: string;
    delta: number;
    introducedInCommit: string;
    impactedScenarioIds: string[];
    traceId?: string;
  }[];
}

export interface RegressionAlert {
  id: string;
  version: string;
  previousVersion: string;
  category: string;
  severity: 'Critical' | 'High' | 'Medium';
  title: string;
  description: string;
  scoreDrop: number;
  rootCauseHypothesis: string;
  traceId: string;
  scenarioId: string;
  status: 'active' | 'investigating' | 'mitigated';
  detectedAt: string;
}

export interface GeneratedScenario {
  id: string;
  name: string;
  category: string;
  severity: SeverityLevel;
  targetTool: string;
  promptPayload: string;
  rationale: string;
  expectedBehavior: string;
}


