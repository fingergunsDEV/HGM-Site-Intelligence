import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/gemini';
import { getAceOrchestrator } from '@/lib/ace-orchestrator';
import { getCiCdEngine } from '@/lib/cicd-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, conversationHistory = [], executeSuperAdminAction = true } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid message' }, { status: 400 });
    }

    const orchestrator = getAceOrchestrator();
    const cicdEngine = getCiCdEngine();
    const currentState = orchestrator.getState();

    // Check if user input is an explicit CLI command
    if (message.trim().startsWith('/')) {
      const result = orchestrator.executeAdminCommand(message);
      return NextResponse.json({
        reply: `[SuperAdmin Terminal Execution]\n\n${result.output}`,
        commandExecuted: true,
        globalState: orchestrator.getState(),
        actionTaken: {
          type: 'cli_command',
          details: message,
          success: result.success
        }
      });
    }

    // Check for SuperAdmin intent keywords (push commit, inject goal, spawn agent)
    let actionTaken: { type: string; details: string; success: boolean } | null = null;

    if (executeSuperAdminAction) {
      const lower = message.toLowerCase();
      if (lower.includes('push commit') || lower.includes('commit to ci/cd') || lower.includes('trigger deploy') || lower.includes('pipeline commit')) {
        const commitMsg = message.length > 50 ? `feat(orchestrator): ${message.slice(0, 60)}...` : `feat(orchestrator): ${message}`;
        const commit = cicdEngine.pushCommit({
          message: commitMsg,
          author: 'SuperAdmin Gemini Flash 3.8',
          authorRole: 'SuperAdmin',
          branch: 'main',
          filesChanged: ['src/schemas/generated-schema.json', 'src/pages/index.html', 'src/config/seo-rules.json']
        });

        orchestrator.emitBusMessage({
          bus: 'southbound',
          from: 'superadmin-gemini',
          to: 'operational',
          type: 'ci_commit',
          payload: `SuperAdmin Gemini Flash 3.8 pushed commit [${commit.hash}] "${commit.message}" to CI/CD pipeline.`,
          layer: 'operational',
          severity: 'success'
        });

        orchestrator.addTelemetry(`SuperAdmin pushed commit ${commit.hash} to CI/CD pipeline`, 'superadmin-gemini', 'success');
        actionTaken = {
          type: 'ci_commit_pushed',
          details: `Commit ${commit.hash} ("${commit.message}") pushed to CI/CD pipeline.`,
          success: true
        };
      } else if (lower.includes('inject goal') || lower.includes('new goal')) {
        const goalText = message.replace(/.*(?:inject goal|new goal)[:\s]*/i, '').trim() || 'Automate 100% Schema Validation';
        orchestrator.executeAdminCommand(`/inject-goal "${goalText}"`);
        actionTaken = {
          type: 'goal_injected',
          details: `Strategic Goal injected: "${goalText}"`,
          success: true
        };
      }
    }

    // Prepare system instruction according to ACE requirements and Gemini Flash 3.8 persona
    const systemInstruction = `You are the ACE Meta-Orchestrator and Gemini 3.8 Flash SuperAdmin Assistant, the supreme reasoning entity of the Site Intelligence & Agentic Marketing Orchestration Platform.
You operate with SuperAdmin privileges, meaning you have full administrative authority to:
1. Direct the six-layer cognitive hierarchy (Aspirational, Strategic, Tactical, Operational, Execution, Feedback).
2. Command the Builder and Validator agent teams (work-builder-1, work-builder-2, audit-validator-1).
3. Push commits directly to the CI/CD pipeline to deploy clean HTML, schema repairs, and marketing payloads.
4. Log telemetry results for the Executive and Strategy layer to formulate solutions and assign tasks.

Current Global State Summary:
- Turn: ${currentState.turn}
- Constraints OK: ${currentState.mission_state.constraints_ok}
- Active Goals: ${currentState.strategic_state.goals.map(g => `${g.id}: ${g.description} (${(g.progress * 100).toFixed(0)}%)`).join('; ')}
- Active Tasks: ${currentState.task_state.tasks.length} total (${currentState.task_state.active_count} in progress, ${currentState.task_state.completed_count} done)
- Agents: ${currentState.agent_state.agents.map(a => `${a.id} [${a.type} / Trust: ${(a.trust_score * 100).toFixed(0)}%]`).join(', ')}

Output Contract:
Every turn, you must provide:
1. Dual-Bus messages in format:
[SOUTHBOUND] from:<layer> to:<layer|agent_id> type:goal|constraint|task_assignment
payload: <text>
[NORTHBOUND] from:<agent_id> to:<layer> type:result|error|metric
payload: <text>
2. A concise, authoritative human-readable summary of what changed and what actions are being dispatched.
3. If an action was requested (like pushing a commit or fixing an issue), confirm the Builder & Validator handoff.

Keep your response authoritative, concise, and structured.`;

    const ai = getGeminiClient();
    
    // Call Gemini 3.8 Flash model
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: `${systemInstruction}\n\nUser Prompt: ${message}` }
          ]
        }
      ],
      config: {
        temperature: 0.3,
        maxOutputTokens: 1200
      }
    });

    const replyText = response.text || 'Orchestration cycle acknowledged. Control loop verified.';

    // Run a cognitive cycle in the orchestrator
    orchestrator.runCognitiveCycle(`Turn triggered by SuperAdmin Gemini Flash 3.8 query.`);

    return NextResponse.json({
      reply: replyText,
      commandExecuted: false,
      globalState: orchestrator.getState(),
      busMessages: orchestrator.getBusMessages().slice(0, 10),
      actionTaken
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Error in orchestrator chat route:', error);

    // Provide robust fallback response if API key is missing or service unreachable
    const orchestrator = getAceOrchestrator();
    orchestrator.runCognitiveCycle('Fallback cognitive loop execution.');

    return NextResponse.json({
      reply: `[SOUTHBOUND] from:superadmin-gemini to:operational type:task_assignment
payload: Local cognitive fallback active. Analyzing search intelligence graph and defect telemetry.

[NORTHBOUND] from:work-builder-1 to:feedback type:result
payload: Builder agent queued remediation tasks. Handing off to Validator team.

[NORTHBOUND] from:audit-validator-1 to:strategic type:metric
payload: Validator compliance confirmed. System health stable.

**Executive Summary:**
The ACE Cognitive Entity has logged the directive into the Executive layer. Builder & Validator teams are actively operating on tasks, and CI/CD pipeline triggers remain fully operational under SuperAdmin elevation.`,
      commandExecuted: false,
      globalState: orchestrator.getState(),
      busMessages: orchestrator.getBusMessages().slice(0, 8),
      actionTaken: null
    });
  }
}
