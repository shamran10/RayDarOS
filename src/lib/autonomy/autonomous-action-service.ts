import { createDefaultAutonomyPolicy, findPolicyForCandidate } from "@/lib/autonomy/autonomy-policy-service";
import type {
  AutonomousActionLog,
  AutonomousActionType,
  AutonomyPolicy,
  CommunityRule,
  ConversationCandidate,
  DeliberationRun,
  FinalDecision,
  Project
} from "@/lib/types";

const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

function actionForDecision(run: DeliberationRun, decision: FinalDecision): AutonomousActionType {
  if (run.autonomyStatus === "blocked" || decision.selectedAction === "do_not_engage") return "block";
  if (run.autonomyStatus === "monitor_only") return "monitor";
  if (run.autonomyStatus === "save_as_insight_only" || decision.selectedAction === "save_as_market_insight") {
    return "save_as_insight";
  }
  if (run.autonomyStatus === "safe_to_auto_engage" && decision.autoEngageAllowed) return "auto_reply";
  return "queue_for_approval";
}

export function createAutonomousActionLog({
  project,
  candidate,
  run,
  finalDecision,
  policies,
  communityRules,
  reason
}: {
  project: Project;
  candidate: ConversationCandidate;
  run: DeliberationRun;
  finalDecision: FinalDecision;
  policies: AutonomyPolicy[];
  communityRules: CommunityRule[];
  reason?: string;
}): AutonomousActionLog {
  const now = new Date().toISOString();
  const matchingRule = communityRules.find((rule) => rule.communityName.toLowerCase() === candidate.community.toLowerCase());
  const policy = findPolicyForCandidate({ policies, project, communityRuleId: matchingRule?.id }) ?? createDefaultAutonomyPolicy(project);
  const actionType = actionForDecision(run, finalDecision);

  return {
    id: makeId("action"),
    projectId: project.id,
    candidateId: candidate.id,
    deliberationRunId: run.id,
    finalDecisionId: finalDecision.id,
    actionType,
    actionStatus: actionType === "auto_reply" ? "simulated" : actionType === "block" ? "blocked" : "pending",
    platform: candidate.platform,
    community: candidate.community,
    responseText: finalDecision.approvedDraft,
    policySnapshot: policy,
    reason:
      reason ??
      (actionType === "auto_reply"
        ? "Posting integration is not enabled, so ReydarOS logged a simulated autonomous reply instead of posting."
        : finalDecision.policyResult),
    createdAt: now,
    updatedAt: now
  };
}
