import { PageMetadata } from './site-intelligence';

// ==========================================
// ACE 6-Layer Cognitive Hierarchy Types
// ==========================================

export type CognitiveLayer = 
  | 'aspirational' 
  | 'strategic' 
  | 'tactical' 
  | 'operational' 
  | 'execution' 
  | 'feedback';

export type AgentRoleType = 
  | 'Executive' 
  | 'Planner' 
  | 'Worker' 
  | 'Auditor' 
  | 'Memory'
  | 'SuperAdmin';

export interface AceAgent {
  id: string;
  name: string;
  type: AgentRoleType;
  team?: 'builder' | 'validator' | 'executive' | 'core';
  status: 'idle' | 'active' | 'error' | 'paused';
  trust_score: number; // 0.0 to 1.0
  last_action: string;
  specialization?: string;
  tasks_completed: number;
}

export interface StrategicGoal {
  id: string;
  description: string;
  kpi: string;
  target_value?: string;
  current_value?: string;
  progress: number; // 0.0 to 1.0
  layer: 'strategic';
  created_at: string;
}

export interface TacticalTask {
  id: string;
  goal_id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'blocked' | 'done';
  assigned_to: string; // agent_id
  team: 'builder' | 'validator' | 'executive';
  depends_on: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  validator_id?: string;
  validator_feedback?: string;
  validator_score?: number;
  output_artifact?: string;
  created_at: string;
}

export interface DualBusMessage {
  id: string;
  timestamp: string;
  turn?: number;
  bus: 'southbound' | 'northbound';
  from: string;
  to: string;
  type: 'goal' | 'constraint' | 'task_assignment' | 'result' | 'error' | 'metric' | 'ci_commit';
  payload: string;
  layer?: CognitiveLayer;
  severity?: 'info' | 'warn' | 'error' | 'success';
}

export interface ReconciliationConflict {
  id: string;
  field: string;
  conflicting_agents: { agent_id: string; trust_score: number; proposed_value: unknown }[];
  winning_agent_id: string;
  resolved_value: unknown;
  formula_used: string;
  timestamp: string;
}

export interface TelemetryEvent {
  event: string;
  source_agent: string;
  severity: 'info' | 'warn' | 'error' | 'success';
  timestamp?: string;
}

export interface AceLayerItem {
  level: number;
  name: string;
  type: CognitiveLayer;
  description: string;
  status: 'active' | 'idle' | 'standby';
  cycle_count: number;
  last_updated: string;
  active_task?: string;
}

export interface AceGlobalState {
  turn: number;
  layers: AceLayerItem[];
  mission_state: {
    constraints: string[];
    constraints_ok: boolean;
    aspirational_alignment: number; // 0-100%
  };
  strategic_state: {
    goals: StrategicGoal[];
    overall_health: number;
  };
  task_state: {
    tasks: TacticalTask[];
    active_count: number;
    completed_count: number;
  };
  agent_state: {
    agents: AceAgent[];
    builder_throughput: number;
    validator_accuracy: number;
  };
  environment_state: {
    notes: string;
    simulated: boolean;
    active_url: string;
    cicd_status: string;
  };
  telemetry: TelemetryEvent[];
  reconciliation: {
    conflicts_detected: ReconciliationConflict[];
    resolutions: string[];
  };
}

// ==========================================
// CI/CD Pipeline Types
// ==========================================

export type PipelineStageStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';

export interface PipelineStage {
  id: string;
  name: string;
  description: string;
  status: PipelineStageStatus;
  durationMs: number;
  logs: string[];
}

export interface CiCdCommit {
  id: string;
  hash: string;
  author: string;
  authorRole: 'SuperAdmin' | 'Builder Agent' | 'Validator Agent' | 'Operator';
  branch: string;
  message: string;
  timestamp: string;
  status: 'passed' | 'running' | 'failed';
  stages: PipelineStage[];
  filesChanged: string[];
  autoRemediated: boolean;
}

// ==========================================
// Search Intelligence JSON Ingest & Payload Schemas
// ==========================================

export type IngestPayloadType = 
  | 'search_intelligence_audit'
  | 'serp_rankings'
  | 'schema_graph'
  | 'marketing_campaign'
  | 'agent_task_batch';

export interface SerpRankingItem {
  keyword: string;
  position: number;
  url: string;
  search_volume: number;
  competition: number;
  intent: 'informational' | 'commercial' | 'transactional' | 'navigational';
  ctr_percent: number;
}

export interface SearchIntelligencePayload {
  version: string;
  site_url: string;
  generated_at: string;
  audit_summary: {
    health_score: number;
    total_urls: number;
    critical_errors: number;
    schema_coverage_percent: number;
  };
  rankings?: SerpRankingItem[];
  pages?: Partial<PageMetadata>[];
  target_personas?: string[];
  keywords?: string[];
}

export interface MarketingCampaignPayload {
  campaign_name: string;
  target_niche: string;
  base_url: string;
  primary_goals: string[];
  target_keywords: { keyword: string; difficulty: number; target_landing_url: string }[];
  schema_entities_to_deploy: string[];
  content_briefs: {
    slug: string;
    suggested_title: string;
    target_intent: string;
    h2_outline: string[];
    schema_type: string;
  }[];
}

export interface SchemaGraphPayload {
  context: 'https://schema.org';
  graph: Record<string, unknown>[];
}
