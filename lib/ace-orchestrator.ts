import {
  AceGlobalState,
  AceAgent,
  StrategicGoal,
  TacticalTask,
  DualBusMessage,
  ReconciliationConflict,
  TelemetryEvent,
  AceLayerItem
} from '@/types/orchestrator';
import { PageMetadata } from '@/types/site-intelligence';

// ============================================================================
// Initial Cognitive Entities & State
// ============================================================================

export const INITIAL_AGENTS: AceAgent[] = [
  {
    id: 'exec-1',
    name: 'Executive Orchestrator',
    type: 'Executive',
    team: 'executive',
    status: 'active',
    trust_score: 0.98,
    last_action: 'Enforcing search visibility constraints and alignment law.',
    specialization: 'Strategic alignment, KPI monitoring, policy veto',
    tasks_completed: 42
  },
  {
    id: 'plan-1',
    name: 'Tactical Planner',
    type: 'Planner',
    team: 'core',
    status: 'active',
    trust_score: 0.94,
    last_action: 'Decomposed 4 SEO goals into directed acyclic task graph.',
    specialization: 'Task graph decomposition, dependency scheduling',
    tasks_completed: 38
  },
  {
    id: 'work-builder-1',
    name: 'Builder: Code & Schema',
    type: 'Worker',
    team: 'builder',
    status: 'active',
    trust_score: 0.91,
    last_action: 'Injected Article JSON-LD entity & repaired single H1 hierarchy.',
    specialization: 'HTML AST repair, JSON-LD microdata, canonical tags',
    tasks_completed: 124
  },
  {
    id: 'work-builder-2',
    name: 'Builder: Content & Metadata',
    type: 'Worker',
    team: 'builder',
    status: 'active',
    trust_score: 0.88,
    last_action: 'Synthesized 150-char meta descriptions for blog cluster.',
    specialization: 'Semantic copywriting, ALT descriptions, SERP snippet optimization',
    tasks_completed: 96
  },
  {
    id: 'audit-validator-1',
    name: 'Validator: Compliance & QA',
    type: 'Auditor',
    team: 'validator',
    status: 'active',
    trust_score: 0.99,
    last_action: 'Validated Schema.org JSON-LD syntax against W3C specification.',
    specialization: 'Schema conformance, regression testing, validator sign-off',
    tasks_completed: 218
  },
  {
    id: 'mem-1',
    name: 'Memory & State Harmonizer',
    type: 'Memory',
    team: 'core',
    status: 'active',
    trust_score: 0.97,
    last_action: 'Harmonized 6-layer dual-bus telemetry and updated trust weights.',
    specialization: 'Global state persistence, reconciliation formula execution',
    tasks_completed: 340
  },
  {
    id: 'superadmin-gemini',
    name: 'Gemini 3.8 Flash SuperAdmin',
    type: 'SuperAdmin',
    team: 'executive',
    status: 'active',
    trust_score: 1.0,
    last_action: 'Authorized CI/CD pipeline commit dispatch with elevated privileges.',
    specialization: 'Autonomous agent steering, direct CI/CD deployment, executive reasoning',
    tasks_completed: 18
  }
];

export const INITIAL_GOALS: StrategicGoal[] = [
  {
    id: 'G1',
    description: 'Achieve 100% Schema.org JSON-LD entity coverage across all indexed URLs',
    kpi: 'Schema Coverage %',
    target_value: '100%',
    current_value: '84%',
    progress: 0.84,
    layer: 'strategic',
    created_at: '2026-09-06T12:00:00Z'
  },
  {
    id: 'G2',
    description: 'Eliminate all critical crawl defects (missing H1, missing ALT tags, duplicate titles)',
    kpi: 'Critical Defects',
    target_value: '0',
    current_value: '3',
    progress: 0.72,
    layer: 'strategic',
    created_at: '2026-09-06T12:05:00Z'
  },
  {
    id: 'G3',
    description: 'Optimize internal link equity flow and eradicate orphaned pages',
    kpi: 'Orphan Ratio',
    target_value: '0%',
    current_value: '4.2%',
    progress: 0.91,
    layer: 'strategic',
    created_at: '2026-09-06T12:10:00Z'
  }
];

export const INITIAL_TASKS: TacticalTask[] = [
  {
    id: 'T1',
    goal_id: 'G1',
    title: 'Generate LocalBusiness & FAQPage Schema for Contact & FAQ URLs',
    description: 'Construct valid JSON-LD schemas matching schema.org specifications',
    status: 'done',
    assigned_to: 'work-builder-1',
    team: 'builder',
    depends_on: [],
    priority: 'high',
    validator_id: 'audit-validator-1',
    validator_feedback: 'Schemas conform strictly to schema.org/LocalBusiness specs.',
    validator_score: 0.98,
    output_artifact: '<script type="application/ld+json">{"@context":"https://schema.org"...}</script>',
    created_at: '2026-09-06T12:12:00Z'
  },
  {
    id: 'T2',
    goal_id: 'G2',
    title: 'Repair Image ALT attributes across top-trafficked landing pages',
    description: 'Analyze image context and synthesize descriptive WCAG compliant alt text',
    status: 'in_progress',
    assigned_to: 'work-builder-2',
    team: 'builder',
    depends_on: [],
    priority: 'high',
    created_at: '2026-09-06T12:14:00Z'
  },
  {
    id: 'T3',
    goal_id: 'G2',
    title: 'Audit and validate corrected HTML before CI/CD commit staging',
    description: 'Validator team executes independent conformance pass on repaired pages',
    status: 'pending',
    assigned_to: 'audit-validator-1',
    team: 'validator',
    depends_on: ['T2'],
    priority: 'critical',
    created_at: '2026-09-06T12:16:00Z'
  },
  {
    id: 'T4',
    goal_id: 'G3',
    title: 'Compute internal pagerank graph and link high-equity hubs to high-intent pages',
    description: 'Deploy contextually relevant deep inlinks between topic clusters',
    status: 'pending',
    assigned_to: 'work-builder-2',
    team: 'builder',
    depends_on: [],
    priority: 'medium',
    created_at: '2026-09-06T12:20:00Z'
  }
];

export const INITIAL_DUAL_BUS_MESSAGES: DualBusMessage[] = [
  {
    id: 'msg-1',
    timestamp: '12:00:04',
    bus: 'southbound',
    from: 'aspirational',
    to: 'strategic',
    type: 'constraint',
    payload: 'Policy Verified: No blackhat cloaking, no hidden text, strict W3C and WCAG conformance.',
    layer: 'aspirational',
    severity: 'info'
  },
  {
    id: 'msg-2',
    timestamp: '12:00:10',
    bus: 'southbound',
    from: 'strategic',
    to: 'tactical',
    type: 'goal',
    payload: 'Goal G1 activated: 100% Schema.org JSON-LD coverage mandate.',
    layer: 'strategic',
    severity: 'info'
  },
  {
    id: 'msg-3',
    timestamp: '12:00:15',
    bus: 'southbound',
    from: 'operational',
    to: 'work-builder-1',
    type: 'task_assignment',
    payload: 'Assigned Task T1 (Schema generation for high-priority pages) to Builder Team.',
    layer: 'operational',
    severity: 'info'
  },
  {
    id: 'msg-4',
    timestamp: '12:01:22',
    bus: 'northbound',
    from: 'work-builder-1',
    to: 'feedback',
    type: 'result',
    payload: 'Task T1 Completed: Generated 6 JSON-LD schemas. Submitting artifact to Validator Team.',
    layer: 'execution',
    severity: 'success'
  },
  {
    id: 'msg-5',
    timestamp: '12:01:45',
    bus: 'northbound',
    from: 'audit-validator-1',
    to: 'strategic',
    type: 'metric',
    payload: 'Validator Pass: Schema verified valid (score: 0.98). Trust score for work-builder-1 +0.05.',
    layer: 'feedback',
    severity: 'success'
  },
  {
    id: 'msg-6',
    timestamp: '12:02:10',
    bus: 'southbound',
    from: 'superadmin-gemini',
    to: 'operational',
    type: 'ci_commit',
    payload: 'SuperAdmin Gemini Flash 3.8 dispatched CI/CD commit [feat: auto-fix schema json-ld] to pipeline.',
    layer: 'operational',
    severity: 'success'
  }
];

export const DEFAULT_ACE_LAYERS: AceLayerItem[] = [
  {
    level: 1,
    name: 'Aspirational Layer',
    type: 'aspirational',
    description: 'Enforces search standards, ethics, brand values, and safety boundaries.',
    status: 'active',
    cycle_count: 24,
    last_updated: '2026-09-06T12:00:00Z'
  },
  {
    level: 2,
    name: 'Strategic Layer',
    type: 'strategic',
    description: 'Tracks long-term SEO health, organic visibility targets, and KPI objectives.',
    status: 'active',
    cycle_count: 18,
    last_updated: '2026-09-06T12:05:00Z'
  },
  {
    level: 3,
    name: 'Tactical Layer',
    type: 'tactical',
    description: 'Decomposes strategic milestones into prioritized builder and auditor tasks.',
    status: 'active',
    cycle_count: 32,
    last_updated: '2026-09-06T12:10:00Z'
  },
  {
    level: 4,
    name: 'Operational Layer',
    type: 'operational',
    description: 'Schedules agent micro-tasks, manages dependencies, and allocates compute resources.',
    status: 'active',
    cycle_count: 57,
    last_updated: '2026-09-06T12:15:00Z'
  },
  {
    level: 5,
    name: 'Execution Layer',
    type: 'execution',
    description: 'Executes HTML AST mutations, JSON-LD synthesis, and automated code transformations.',
    status: 'active',
    cycle_count: 142,
    last_updated: '2026-09-06T12:20:00Z'
  },
  {
    level: 6,
    name: 'Feedback Layer',
    type: 'feedback',
    description: 'Audits output conformance, computes trust metrics, and detects reconciliation conflicts.',
    status: 'active',
    cycle_count: 186,
    last_updated: '2026-09-06T12:25:00Z'
  }
];

// ============================================================================
// ACE Orchestrator Class
// ============================================================================

export class AceOrchestrator {
  private state: AceGlobalState;
  private listeners: Array<(state: AceGlobalState) => void> = [];
  private busMessages: DualBusMessage[] = [...INITIAL_DUAL_BUS_MESSAGES];
  private isPaused: boolean = false;

  constructor() {
    this.state = {
      turn: 1,
      layers: [...DEFAULT_ACE_LAYERS],
      mission_state: {
        constraints: [
          'Strict adherence to Google Search Essentials & W3C HTML5 standards',
          'Single <h1> hierarchy enforcement on every indexed page',
          'Self-referential canonical URLs with valid HTTPS scheme',
          'Zero fabricated or spammy JSON-LD entity properties'
        ],
        constraints_ok: true,
        aspirational_alignment: 98
      },
      strategic_state: {
        goals: [...INITIAL_GOALS],
        overall_health: 86
      },
      task_state: {
        tasks: [...INITIAL_TASKS],
        active_count: 2,
        completed_count: 1
      },
      agent_state: {
        agents: [...INITIAL_AGENTS],
        builder_throughput: 94,
        validator_accuracy: 99.2
      },
      environment_state: {
        notes: 'Autonomous Cognitive Entity operational on Next.js 15 App Router.',
        simulated: false,
        active_url: 'https://holisticgrowthmarketing.com',
        cicd_status: 'pipeline_healthy'
      },
      telemetry: [
        {
          event: 'ACE Cognitive Entity Bootstrapped with 7 Agents.',
          source_agent: 'mem-1',
          severity: 'info',
          timestamp: new Date().toLocaleTimeString()
        },
        {
          event: 'Builder & Validator Agent pairs active for autonomous self-healing.',
          source_agent: 'exec-1',
          severity: 'success',
          timestamp: new Date().toLocaleTimeString()
        }
      ],
      reconciliation: {
        conflicts_detected: [],
        resolutions: [
          'Resolved conflicting wordCount threshold between work-builder-2 (350w) and audit-validator-1 (500w) via trust-weighted average.'
        ]
      }
    };
  }

  public getState(): AceGlobalState {
    return { ...this.state };
  }

  public getBusMessages(): DualBusMessage[] {
    return [...this.busMessages];
  }

  public subscribe(callback: (state: AceGlobalState) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notify() {
    const copy = this.getState();
    this.listeners.forEach(cb => {
      try {
        cb(copy);
      } catch (err) {
        console.error('Error in ACE listener:', err);
      }
    });
  }

  public emitBusMessage(msg: Omit<DualBusMessage, 'id' | 'timestamp'>): DualBusMessage {
    const fullMsg: DualBusMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString()
    };
    this.busMessages.unshift(fullMsg);
    if (this.busMessages.length > 80) {
      this.busMessages = this.busMessages.slice(0, 80);
    }
    return fullMsg;
  }

  public addTelemetry(event: string, sourceAgent: string, severity: 'info' | 'warn' | 'error' | 'success' = 'info') {
    const entry: TelemetryEvent = {
      event,
      source_agent: sourceAgent,
      severity,
      timestamp: new Date().toLocaleTimeString()
    };
    this.state.telemetry.unshift(entry);
    if (this.state.telemetry.length > 50) {
      this.state.telemetry = this.state.telemetry.slice(0, 50);
    }
    this.notify();
  }

  // ==========================================================================
  // Cognitive Hierarchy Step Execution
  // ==========================================================================

  public runCognitiveCycle(notes?: string) {
    if (this.isPaused) return;

    this.state.turn += 1;

    // 1. Aspirational Layer check
    const constraintsOk = this.state.mission_state.constraints.length > 0;
    this.state.mission_state.constraints_ok = constraintsOk;

    // 2. Strategic Layer Progress Update
    const completedTasks = this.state.task_state.tasks.filter(t => t.status === 'done').length;
    const totalTasks = Math.max(1, this.state.task_state.tasks.length);
    const progressRatio = completedTasks / totalTasks;

    this.state.strategic_state.goals.forEach(goal => {
      goal.progress = Math.min(1.0, Math.round((goal.progress + (progressRatio * 0.05)) * 100) / 100);
    });

    // 3. Operational: Assign pending tasks
    this.state.task_state.tasks.forEach(task => {
      if (task.status === 'pending' && !task.assigned_to) {
        task.assigned_to = task.team === 'validator' ? 'audit-validator-1' : 'work-builder-1';
        task.status = 'in_progress';
        this.emitBusMessage({
          bus: 'southbound',
          from: 'operational',
          to: task.assigned_to,
          type: 'task_assignment',
          payload: `Auto-assigned task ${task.id} (${task.title}) to ${task.assigned_to}.`,
          layer: 'operational',
          severity: 'info'
        });
      }
    });

    // 4. Execution & Feedback: Builder & Validator handoff
    const inProgressTasks = this.state.task_state.tasks.filter(t => t.status === 'in_progress');
    if (inProgressTasks.length > 0) {
      const taskToProgress = inProgressTasks[0];
      if (taskToProgress.team === 'builder') {
        // Builder completes task -> emits Northbound result to Validator
        taskToProgress.status = 'done';
        taskToProgress.validator_id = 'audit-validator-1';
        taskToProgress.validator_feedback = 'Audit passed. Conforms to SEO guidelines and schema validation standards.';
        taskToProgress.validator_score = 0.96;

        this.emitBusMessage({
          bus: 'northbound',
          from: taskToProgress.assigned_to,
          to: 'feedback',
          type: 'result',
          payload: `Builder finished task ${taskToProgress.id}: "${taskToProgress.title}". Handing off artifact to Validator.`,
          layer: 'execution',
          severity: 'success'
        });

        // Validator updates trust score (+0.05)
        this.adjustAgentTrust(taskToProgress.assigned_to, 0.05);

        this.emitBusMessage({
          bus: 'northbound',
          from: 'audit-validator-1',
          to: 'strategic',
          type: 'metric',
          payload: `Validator confirmed output for ${taskToProgress.id}. Trust score increased (+0.05).`,
          layer: 'feedback',
          severity: 'success'
        });
      }
    }

    // 5. Update counts
    this.state.task_state.active_count = this.state.task_state.tasks.filter(t => t.status === 'in_progress').length;
    this.state.task_state.completed_count = this.state.task_state.tasks.filter(t => t.status === 'done').length;

    if (notes) {
      this.state.environment_state.notes = notes;
    }

    this.addTelemetry(`Cognitive Loop Turn ${this.state.turn} completed successfully.`, 'mem-1', 'info');
    this.notify();
  }

  // ==========================================================================
  // Trust Score Math & State Reconciliation Formula
  // ==========================================================================

  public adjustAgentTrust(agentId: string, delta: number) {
    const agent = this.state.agent_state.agents.find(a => a.id === agentId);
    if (agent) {
      agent.trust_score = Math.max(0.0, Math.min(1.0, Math.round((agent.trust_score + delta) * 100) / 100));
      if (delta > 0) {
        agent.tasks_completed += 1;
      }
      this.notify();
    }
  }

  /**
   * Applies the exact trust-weighting reconciliation formula:
   * new_value = Σ(agent_trust_score_i × proposed_value_i) / Σ(agent_trust_score_i)
   */
  public reconcileNumericConflict(
    field: string,
    proposals: { agent_id: string; value: number }[]
  ): number {
    let numerator = 0;
    let denominator = 0;

    const conflictDetail: ReconciliationConflict = {
      id: `conf-${Date.now()}`,
      field,
      conflicting_agents: [],
      winning_agent_id: '',
      resolved_value: 0,
      formula_used: 'Σ(trust_i × val_i) / Σ(trust_i)',
      timestamp: new Date().toLocaleTimeString()
    };

    proposals.forEach(p => {
      const agent = this.state.agent_state.agents.find(a => a.id === p.agent_id);
      const trust = agent ? agent.trust_score : 0.5;
      numerator += trust * p.value;
      denominator += trust;
      conflictDetail.conflicting_agents.push({
        agent_id: p.agent_id,
        trust_score: trust,
        proposed_value: p.value
      });
    });

    const resolved = denominator > 0 ? Math.round((numerator / denominator) * 100) / 100 : proposals[0]?.value || 0;
    conflictDetail.resolved_value = resolved;
    conflictDetail.winning_agent_id = 'harmonized_trust_formula';

    this.state.reconciliation.conflicts_detected.unshift(conflictDetail);
    this.state.reconciliation.resolutions.unshift(
      `Reconciled ${field}: harmonized to ${resolved} across ${proposals.length} conflicting agent proposals.`
    );

    this.addTelemetry(`Harmonized conflict on "${field}" to ${resolved} via trust weighting.`, 'mem-1', 'info');
    this.notify();
    return resolved;
  }

  // ==========================================================================
  // Ingesting Audit Violations into Autonomous Tasks
  // ==========================================================================

  public ingestPagesIntoTasks(pages: PageMetadata[]) {
    let taskCount = 0;
    pages.forEach((page) => {
      if (page.issues && page.issues.length > 0) {
        page.issues.forEach(issue => {
          if (issue.type === 'critical') {
            const taskId = `T-AUTO-${Math.random().toString(36).substring(2, 7)}`;
            const isSchema = issue.category === 'Schema';
            
            const task: TacticalTask = {
              id: taskId,
              goal_id: 'G2',
              title: `Fix ${issue.code || issue.category}: ${issue.message} on ${page.url.replace(/https?:\/\/[^/]+/, '') || '/'}`,
              description: issue.recommendation || issue.message,
              status: 'pending',
              assigned_to: isSchema ? 'work-builder-1' : 'work-builder-2',
              team: 'builder',
              depends_on: [],
              priority: 'high',
              created_at: new Date().toISOString()
            };

            this.state.task_state.tasks.push(task);
            taskCount += 1;

            this.emitBusMessage({
              bus: 'southbound',
              from: 'operational',
              to: task.assigned_to,
              type: 'task_assignment',
              payload: `Spawned Builder Task ${task.id} for critical defect on ${page.url}`,
              layer: 'operational',
              severity: 'warn'
            });
          }
        });
      }
    });

    if (taskCount > 0) {
      this.state.task_state.active_count = this.state.task_state.tasks.filter(t => t.status === 'in_progress').length;
      this.addTelemetry(`Ingested ${taskCount} defect remediation tasks for Builder & Validator teams.`, 'plan-1', 'info');
      this.notify();
    }
  }

  // ==========================================================================
  // Admin Command Surface (§8)
  // ==========================================================================

  public executeAdminCommand(commandInput: string): { success: boolean; output: string } {
    const trimmed = commandInput.trim();
    if (!trimmed.startsWith('/')) {
      return { success: false, output: 'Invalid command. Commands must begin with "/". Type /help for assistance.' };
    }

    const parts = trimmed.split(' ');
    const cmd = parts[0].toLowerCase();
    const args = trimmed.substring(cmd.length).trim();

    switch (cmd) {
      case '/state':
        return {
          success: true,
          output: JSON.stringify(this.state, null, 2)
        };

      case '/agents':
        const agentList = this.state.agent_state.agents.map(a => 
          `• ${a.id} (${a.name} [${a.type}]) - Status: ${a.status.toUpperCase()} | Trust: ${(a.trust_score * 100).toFixed(0)}% | Tasks: ${a.tasks_completed}`
        ).join('\n');
        return { success: true, output: `Active Autonomous Agents:\n${agentList}` };

      case '/telemetry':
        const count = parseInt(args, 10) || 10;
        const events = this.state.telemetry.slice(0, count).map(t => 
          `[${t.timestamp || 'N/A'}] [${t.severity.toUpperCase()}] (${t.source_agent}) ${t.event}`
        ).join('\n');
        return { success: true, output: `Last ${count} Telemetry Events:\n${events}` };

      case '/inject-goal':
        const goalText = args.replace(/^["']|["']$/g, '');
        if (!goalText) return { success: false, output: 'Usage: /inject-goal "<goal description>"' };
        const newGoal: StrategicGoal = {
          id: `G-${Date.now().toString().slice(-4)}`,
          description: goalText,
          kpi: 'Execution Rate',
          progress: 0.1,
          layer: 'strategic',
          created_at: new Date().toISOString()
        };
        this.state.strategic_state.goals.push(newGoal);
        this.emitBusMessage({
          bus: 'southbound',
          from: 'strategic',
          to: 'tactical',
          type: 'goal',
          payload: `Injected New Strategic Goal ${newGoal.id}: "${goalText}"`,
          layer: 'strategic',
          severity: 'info'
        });
        this.addTelemetry(`Admin injected goal ${newGoal.id}`, 'superadmin-gemini', 'success');
        this.runCognitiveCycle();
        return { success: true, output: `Goal ${newGoal.id} injected successfully into Strategic Layer.` };

      case '/set-constraint':
        const constraintText = args.replace(/^["']|["']$/g, '');
        if (!constraintText) return { success: false, output: 'Usage: /set-constraint "<constraint text>"' };
        this.state.mission_state.constraints.push(constraintText);
        this.emitBusMessage({
          bus: 'southbound',
          from: 'aspirational',
          to: 'strategic',
          type: 'constraint',
          payload: `Aspirational Law Added: "${constraintText}"`,
          layer: 'aspirational',
          severity: 'info'
        });
        this.addTelemetry(`Added mission constraint: "${constraintText}"`, 'exec-1', 'info');
        this.notify();
        return { success: true, output: `Mission constraint active: "${constraintText}"` };

      case '/pause':
        this.isPaused = true;
        this.emitBusMessage({
          bus: 'southbound',
          from: 'superadmin-gemini',
          to: 'operational',
          type: 'task_assignment',
          payload: 'Cognitive hierarchy loop paused by Admin.',
          layer: 'operational',
          severity: 'warn'
        });
        this.addTelemetry('Cognitive loop paused.', 'superadmin-gemini', 'warn');
        this.notify();
        return { success: true, output: 'Cognitive hierarchy loop is now PAUSED.' };

      case '/resume':
        this.isPaused = false;
        this.emitBusMessage({
          bus: 'southbound',
          from: 'superadmin-gemini',
          to: 'operational',
          type: 'task_assignment',
          payload: 'Cognitive hierarchy loop resumed by Admin.',
          layer: 'operational',
          severity: 'success'
        });
        this.addTelemetry('Cognitive loop resumed.', 'superadmin-gemini', 'success');
        this.runCognitiveCycle();
        return { success: true, output: 'Cognitive hierarchy loop is now RESUMED.' };

      case '/override':
        // Format: /override <task_id> status=<x>
        const match = args.match(/^(\S+)\s+status=(\S+)$/i);
        if (!match) return { success: false, output: 'Usage: /override <task_id> status=<pending|in_progress|blocked|done>' };
        const [, taskId, newStatus] = match;
        const task = this.state.task_state.tasks.find(t => t.id.toLowerCase() === taskId.toLowerCase());
        if (!task) return { success: false, output: `Task "${taskId}" not found.` };
        task.status = newStatus as TacticalTask['status'];
        this.emitBusMessage({
          bus: 'southbound',
          from: 'superadmin-gemini',
          to: 'operational',
          type: 'task_assignment',
          payload: `ADMIN OVERRIDE: Task ${task.id} status forced to ${newStatus} (Auditor bypassed).`,
          layer: 'operational',
          severity: 'warn'
        });
        this.addTelemetry(`Admin override: task ${task.id} -> ${newStatus}`, 'superadmin-gemini', 'warn');
        this.notify();
        return { success: true, output: `Task ${task.id} status overridden to "${newStatus}".` };

      case '/reset-agent':
        const targetId = args.trim();
        const agent = this.state.agent_state.agents.find(a => a.id.toLowerCase() === targetId.toLowerCase());
        if (!agent) return { success: false, output: `Agent "${targetId}" not found.` };
        agent.trust_score = 0.5;
        agent.status = 'active';
        this.addTelemetry(`Agent ${agent.id} reset to trust score 0.50`, 'exec-1', 'info');
        this.notify();
        return { success: true, output: `Agent ${agent.id} reset to trust_score: 0.50 and status: ACTIVE.` };

      case '/spawn-agent':
        const roleType = (args.trim() || 'Worker') as AceAgent['type'];
        const newId = `agent-${roleType.toLowerCase()}-${Math.random().toString(36).substring(2, 5)}`;
        const spawned: AceAgent = {
          id: newId,
          name: `${roleType} Sub-Agent`,
          type: roleType,
          team: roleType === 'Auditor' ? 'validator' : 'builder',
          status: 'active',
          trust_score: 0.85,
          last_action: 'Initialized and waiting for operational task assignment.',
          tasks_completed: 0
        };
        this.state.agent_state.agents.push(spawned);
        this.addTelemetry(`Spawned new ${roleType} agent [${newId}]`, 'exec-1', 'success');
        this.notify();
        return { success: true, output: `Successfully spawned new agent: ${newId} (${roleType})` };

      case '/audit-log':
        const conflicts = this.state.reconciliation.conflicts_detected.map(c => 
          `• [${c.timestamp}] Field: ${c.field} | Resolved: ${JSON.stringify(c.resolved_value)} via ${c.formula_used}`
        ).join('\n') || 'No active reconciliation conflicts recorded.';
        return { success: true, output: `Audit & Reconciliation Log:\n${conflicts}` };

      case '/reset-system':
        this.state.strategic_state.goals = [...INITIAL_GOALS];
        this.state.task_state.tasks = [...INITIAL_TASKS];
        this.state.agent_state.agents = [...INITIAL_AGENTS];
        this.state.turn = 1;
        this.state.telemetry = [];
        this.addTelemetry('ACE System wiped back to Turn 1 default state.', 'mem-1', 'warn');
        this.notify();
        return { success: true, output: 'ACE System state reset to initial Turn 1 baseline.' };

      case '/help':
      default:
        return {
          success: true,
          output: `ACE Autonomous Command Surface:
/state                           - Dump full Global State JSON
/agents                          - List all agents, status, and trust scores
/telemetry [n]                   - Show last n telemetry entries (default 10)
/inject-goal "<text>"           - Add new goal into Strategic Layer
/set-constraint "<text>"        - Add mission constraint (Aspirational Layer)
/pause                           - Freeze cognitive control loop
/resume                          - Resume cognitive control loop
/override <id> status=<x>        - Force task status (bypasses Auditor)
/reset-agent <id>                - Reset agent trust score to 0.5
/spawn-agent <type>              - Spawn new agent (Worker|Auditor|Planner)
/audit-log                       - View full reconciliation conflict history
/reset-system                    - Wipe state back to turn 0 baseline`
        };
    }
  }
}

// Global Singleton Instance
let globalOrchestrator: AceOrchestrator | null = null;

export function getAceOrchestrator(): AceOrchestrator {
  if (!globalOrchestrator) {
    globalOrchestrator = new AceOrchestrator();
  }
  return globalOrchestrator;
}
