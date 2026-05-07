import type { EngagementOutcome, MarketInsight, Project } from "@/lib/types";

export function createMemoryInsightFromOutcome({
  project,
  outcome,
  source,
  candidateId,
  deliberationRunId
}: {
  project: Project;
  outcome: EngagementOutcome;
  source: string;
  candidateId?: string;
  deliberationRunId?: string;
}): MarketInsight | undefined {
  const categoryByOutcome: Partial<Record<EngagementOutcome["outcomeType"], string>> = {
    positive_reply: "Response style memory",
    negative_reply: "Risk patterns",
    removed: "Community behavior patterns",
    removed_comment: "Community behavior patterns",
    moderator_warning: "Community behavior patterns",
    manual_rejection: "Risk patterns",
    user_approved_edit: "Response style memory",
    saved_as_insight: "Recurring pain points",
    auto_engagement_success: "Response style memory",
    auto_engagement_blocked: "Risk patterns",
    auto_engagement_failure: "Risk patterns"
  };
  const category = categoryByOutcome[outcome.outcomeType];

  if (!category) return undefined;

  return {
    id: `insight-memory-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    projectId: project.id,
    opportunityId: outcome.opportunityId,
    candidateId,
    deliberationRunId,
    category,
    title: `Memory update from ${outcome.outcomeType.replaceAll("_", " ")}`,
    insight: outcome.notes || `Outcome logged for ${project.name}; use it to calibrate future engagement risk and response style.`,
    source,
    confidence: outcome.outcomeType.includes("negative") || outcome.outcomeType.includes("warning") ? 0.86 : 0.74,
    approved: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
