import type {
  AutonomyPolicy,
  AutonomyStatus,
  CandidateScore,
  CandidateType,
  CommunityRule,
  FinalDecision,
  ProductMentionLevel,
  Project
} from "@/lib/types";

export const defaultAllowedCandidateTypes: CandidateType[] = [
  "original_post",
  "top_comment",
  "recent_comment",
  "nested_reply",
  "unanswered_question",
  "tool_request",
  "pain_point",
  "implementation_question",
  "buying_intent",
  "market_insight_only"
];

export function createDefaultAutonomyPolicy(project: Project, communityRule?: CommunityRule): AutonomyPolicy {
  const now = new Date().toISOString();

  return {
    id: `policy-${communityRule?.id ?? project.id}`,
    projectId: project.id,
    communityRuleId: communityRule?.id,
    name: communityRule ? `${communityRule.communityName} autonomy policy` : `${project.name} default autonomy policy`,
    allowAutoEngage: false,
    maxCommentsPerDay: 3,
    maxCommentsPerCommunityPerDay: 1,
    maxProductMentionsPerWeek: 1,
    allowedProductMentionLevels: [0, 1],
    allowLinks: false,
    requireDisclosure: true,
    minRelevanceScore: 85,
    minIntentScore: 75,
    minProductFitScore: 75,
    minEngagementValueScore: 70,
    maxPromotionRiskScore: 30,
    maxCommunityRiskScore: 35,
    minAccountSafetyScore: 80,
    maxSkepticObjectionStrength: 40,
    allowedCandidateTypes: defaultAllowedCandidateTypes,
    blockedCandidateTypes: ["negative_sentiment"],
    isActive: true,
    createdAt: now,
    updatedAt: now
  };
}

export function findPolicyForCandidate({
  policies,
  project,
  communityRuleId
}: {
  policies: AutonomyPolicy[];
  project: Project;
  communityRuleId?: string;
}) {
  return (
    policies.find((policy) => policy.projectId === project.id && policy.communityRuleId === communityRuleId && policy.isActive) ??
    policies.find((policy) => policy.projectId === project.id && !policy.communityRuleId && policy.isActive) ??
    createDefaultAutonomyPolicy(project)
  );
}

export function evaluateAutonomyPolicy({
  policy,
  score,
  finalDecision,
  candidateType,
  communityRule,
  brandGuardianApproved,
  finalJudgeApproved,
  guardrailBlocked
}: {
  policy: AutonomyPolicy;
  score: CandidateScore;
  finalDecision: Pick<
    FinalDecision,
    "productMentionLevel" | "requiresDisclosure" | "approvedDraft" | "selectedAction" | "blockedReason"
  >;
  candidateType: CandidateType;
  communityRule?: CommunityRule;
  brandGuardianApproved: boolean;
  finalJudgeApproved: boolean;
  guardrailBlocked: boolean;
}): {
  autoEngageAllowed: boolean;
  humanApprovalRequired: boolean;
  autonomyStatus: AutonomyStatus;
  policyResult: string;
  blockingReasons: string[];
} {
  const blockingReasons: string[] = [];
  const draftHasLink = /https?:\/\//i.test(finalDecision.approvedDraft);
  const highRiskCommunity = communityRule?.riskLevel === "high" || communityRule?.riskLevel === "blocked";
  const mentionLevelAllowed = policy.allowedProductMentionLevels.includes(finalDecision.productMentionLevel as ProductMentionLevel);

  if (!policy.allowAutoEngage) blockingReasons.push("Autonomy policy disables auto-engagement by default.");
  if (score.relevanceScore < policy.minRelevanceScore) blockingReasons.push("Relevance score is below policy threshold.");
  if (score.intentScore < policy.minIntentScore) blockingReasons.push("Intent score is below policy threshold.");
  if (score.productFitScore < policy.minProductFitScore) blockingReasons.push("Product fit score is below policy threshold.");
  if (score.engagementValueScore < policy.minEngagementValueScore) blockingReasons.push("Engagement value score is below policy threshold.");
  if (score.promotionRiskScore > policy.maxPromotionRiskScore) blockingReasons.push("Promotion risk exceeds policy threshold.");
  if (score.communityRiskScore > policy.maxCommunityRiskScore) blockingReasons.push("Community risk exceeds policy threshold.");
  if (score.accountSafetyScore < policy.minAccountSafetyScore) blockingReasons.push("Account safety score is below policy threshold.");
  if (score.skepticObjectionStrength > policy.maxSkepticObjectionStrength) {
    blockingReasons.push("Skeptic objection strength exceeds policy threshold.");
  }
  if (!mentionLevelAllowed) blockingReasons.push("Product mention level is not allowed by policy.");
  if (draftHasLink && !policy.allowLinks) blockingReasons.push("Draft includes a link but policy does not allow links.");
  if (finalDecision.productMentionLevel >= 2 && policy.requireDisclosure && !finalDecision.requiresDisclosure) {
    blockingReasons.push("Disclosure is required for affiliation or product mention.");
  }
  if (finalDecision.productMentionLevel >= 3) blockingReasons.push("Level 3 and Level 4 product mentions are never auto-engaged.");
  if (!policy.allowedCandidateTypes.includes(candidateType)) blockingReasons.push("Candidate type is not allowed by policy.");
  if (policy.blockedCandidateTypes.includes(candidateType)) blockingReasons.push("Candidate type is blocked by policy.");
  if (highRiskCommunity) blockingReasons.push("Community is high risk or blocked.");
  if (!brandGuardianApproved) blockingReasons.push("Brand Guardian did not approve the draft.");
  if (!finalJudgeApproved) blockingReasons.push("Final Judge did not approve engagement.");
  if (guardrailBlocked) blockingReasons.push("A blocking guardrail is active.");
  if (finalDecision.blockedReason) blockingReasons.push(finalDecision.blockedReason);

  const autoEngageAllowed = blockingReasons.length === 0;
  const insightOnly = finalDecision.selectedAction === "save_as_market_insight";
  const monitorOnly = finalDecision.selectedAction === "monitor_only";
  const blocked = finalDecision.selectedAction === "do_not_engage" || Boolean(finalDecision.blockedReason);
  const autonomyStatus: AutonomyStatus = autoEngageAllowed
    ? "safe_to_auto_engage"
    : blocked
      ? "blocked"
      : insightOnly
        ? "save_as_insight_only"
        : monitorOnly
          ? "monitor_only"
          : "needs_human_approval";

  return {
    autoEngageAllowed,
    humanApprovalRequired: !autoEngageAllowed && !blocked && !insightOnly && !monitorOnly,
    autonomyStatus,
    policyResult: autoEngageAllowed
      ? `${policy.name} allows simulated auto-engagement.`
      : `${policy.name} requires restraint: ${blockingReasons.join(" ")}`,
    blockingReasons
  };
}
