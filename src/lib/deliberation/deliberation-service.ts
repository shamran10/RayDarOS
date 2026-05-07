import { evaluateAutonomyPolicy, findPolicyForCandidate } from "@/lib/autonomy/autonomy-policy-service";
import { deliberationAgentPrompts } from "@/lib/ai/agents/prompts";
import type {
  AutonomyPolicy,
  CandidateScore,
  CommunityRule,
  ConversationCandidate,
  DeliberationAgentResult,
  DeliberationRun,
  FinalDecision,
  FinalDecisionAction,
  KnowledgeItem,
  Project,
  ResponseType
} from "@/lib/types";

const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
const lower = (value: string) => value.toLowerCase();
const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

function countHits(text: string, terms: string[]) {
  return terms.filter((term) => lower(text).includes(lower(term))).length;
}

function communityRiskScore(rule?: CommunityRule) {
  if (!rule) return 42;
  if (rule.riskLevel === "blocked") return 100;
  if (rule.riskLevel === "high") return 78;
  if (rule.riskLevel === "medium") return 46;
  return 24;
}

function buildApprovedDraft({
  candidate,
  project,
  selectedAction,
  responseType,
  productMentionLevel
}: {
  candidate: ConversationCandidate;
  project: Project;
  selectedAction: FinalDecisionAction;
  responseType: ResponseType;
  productMentionLevel: number;
}) {
  if (selectedAction === "clarifying_question") {
    return "Before picking a tool, I would isolate where the work actually stalls: ownership, approval timing, visibility, or repeated questions. Which of those is the biggest pain right now?";
  }

  if (selectedAction === "monitor_only" || selectedAction === "save_as_market_insight" || selectedAction === "do_not_engage") {
    return "";
  }

  const base =
    "I would start by separating the problem into ownership, state visibility, and exception handling. If each step has one owner, a visible blocked state, and a simple escalation path, the team can usually see whether the process is broken before choosing more tooling.";
  const practical =
    "A useful test is to take the next five requests, write down who owns each handoff, and mark where the request becomes invisible. That usually shows whether you need a process change, a lightweight tracker, or a deeper workflow system.";
  const disclosure =
    productMentionLevel >= 2
      ? `\n\nDisclosure: I work on ${project.name}, which is in this space, so I would still treat the process diagnosis as the first step and avoid buying software until the workflow is clear.`
      : "";

  if (responseType === "short_casual") return `${base}${disclosure}`;
  return `${base}\n\n${practical}${disclosure}`;
}

function inferScores({
  candidate,
  project,
  productKnowledge,
  marketKnowledge,
  communityRule
}: {
  candidate: ConversationCandidate;
  project: Project;
  productKnowledge: KnowledgeItem[];
  marketKnowledge: KnowledgeItem[];
  communityRule?: CommunityRule;
}): Omit<CandidateScore, "id" | "candidateId" | "deliberationRunId" | "createdAt"> {
  const text = `${candidate.title} ${candidate.body}`;
  const productTerms = [
    project.name,
    project.productType,
    ...productKnowledge.flatMap((item) => `${item.title} ${item.content}`.split(/\W+/).filter((word) => word.length > 6)).slice(0, 90)
  ];
  const marketTerms = marketKnowledge
    .flatMap((item) => `${item.title} ${item.content}`.split(/\W+/).filter((word) => word.length > 6))
    .slice(0, 90);
  const productHits = countHits(text, productTerms);
  const marketHits = countHits(text, marketTerms);
  const toolHits = countHits(text, ["tool", "software", "platform", "recommend", "workflow", "approval", "owner", "handoff"]);
  const linkOrPromoHits = countHits(text, ["link", "promo", "affiliate", "discount", "dm me", "vendor"]);
  const baseCommunityRisk = communityRiskScore(communityRule);
  const relevanceScore = clampScore(candidate.initialRelevanceScore + productHits * 4 + marketHits * 3);
  const intentScore = clampScore(candidate.initialIntentScore + (candidate.candidateType === "buying_intent" ? 12 : 0));
  const productFitScore = clampScore(45 + productHits * 8 + toolHits * 4 + (candidate.productCategoryMentioned ? 10 : 0));
  const promotionRiskScore = clampScore(candidate.initialRiskScore * 0.4 + baseCommunityRisk * 0.35 + linkOrPromoHits * 12);
  const communityRiskScoreValue = clampScore(baseCommunityRisk);
  const engagementValueScore = clampScore((relevanceScore + intentScore + productFitScore) / 3 - promotionRiskScore * 0.14);
  const accountSafetyScore = clampScore(100 - communityRiskScoreValue * 0.42 - promotionRiskScore * 0.25);
  const skepticObjectionStrength = clampScore(
    promotionRiskScore * 0.45 + communityRiskScoreValue * 0.35 + (productFitScore < 68 ? 18 : 0)
  );
  const responseConfidenceScore = clampScore((relevanceScore + productFitScore + accountSafetyScore) / 3);
  const marketInsightValueScore = clampScore(50 + marketHits * 8 + (candidate.candidateType === "market_insight_only" ? 22 : 0));

  return {
    projectId: project.id,
    relevanceScore,
    intentScore,
    productFitScore,
    engagementValueScore,
    promotionRiskScore,
    communityRiskScore: communityRiskScoreValue,
    accountSafetyScore,
    responseConfidenceScore,
    skepticObjectionStrength,
    marketInsightValueScore
  };
}

function agentResult(
  deliberationRunId: string,
  agentName: keyof typeof deliberationAgentPrompts,
  score: number,
  recommendation: string,
  argumentFor: string,
  argumentAgainst: string,
  riskFlags: string[],
  reasoning: string
): DeliberationAgentResult {
  return {
    id: makeId("agent"),
    deliberationRunId,
    agentName,
    recommendation,
    score: clampScore(score),
    argumentFor,
    argumentAgainst,
    riskFlags,
    reasoning,
    createdAt: new Date().toISOString()
  };
}

export function runCandidateDeliberation({
  candidate,
  project,
  productKnowledge,
  marketKnowledge,
  communityRules,
  autonomyPolicies
}: {
  candidate: ConversationCandidate;
  project: Project;
  productKnowledge: KnowledgeItem[];
  marketKnowledge: KnowledgeItem[];
  communityRules: CommunityRule[];
  autonomyPolicies: AutonomyPolicy[];
}): {
  run: DeliberationRun;
  agentResults: DeliberationAgentResult[];
  score: CandidateScore;
  finalDecision: FinalDecision;
  blockingReasons: string[];
} {
  const now = new Date().toISOString();
  const deliberationRunId = makeId("deliberation");
  const matchingRule = communityRules.find((rule) => lower(rule.communityName) === lower(candidate.community));
  const policy = findPolicyForCandidate({ policies: autonomyPolicies, project, communityRuleId: matchingRule?.id });
  const scoreValues = inferScores({ candidate, project, productKnowledge, marketKnowledge, communityRule: matchingRule });
  const score: CandidateScore = {
    id: makeId("candidate-score"),
    candidateId: candidate.id,
    deliberationRunId,
    createdAt: now,
    ...scoreValues
  };

  const shouldBlock = matchingRule?.riskLevel === "blocked" || score.communityRiskScore >= 90;
  const saveAsInsight = !shouldBlock && score.marketInsightValueScore >= 74 && score.engagementValueScore < 65;
  const monitorOnly = !shouldBlock && score.skepticObjectionStrength >= 72;
  const productMentionLevel = score.productFitScore >= 82 && score.intentScore >= 76 && score.promotionRiskScore <= 44 ? 2 : score.productFitScore >= 70 ? 1 : 0;
  const selectedAction: FinalDecisionAction = shouldBlock
    ? "do_not_engage"
    : saveAsInsight
      ? "save_as_market_insight"
      : monitorOnly
        ? "monitor_only"
        : score.intentScore < 58
          ? "clarifying_question"
          : productMentionLevel >= 2
            ? "soft_product_mention"
            : "helpful_only_reply";
  const selectedResponseType: ResponseType =
    selectedAction === "clarifying_question"
      ? "clarifying_question"
      : productMentionLevel >= 2
        ? "soft_product_mention"
        : "detailed_practical";
  const approvedDraft = buildApprovedDraft({ candidate, project, selectedAction, responseType: selectedResponseType, productMentionLevel });
  const blockedReason = shouldBlock ? "Community risk or explicit block prevents engagement." : undefined;

  const agentResults = [
    agentResult(
      deliberationRunId,
      "Opportunity Scout",
      score.relevanceScore,
      score.relevanceScore >= 70 ? "Analyze for engagement" : "Low priority",
      `The candidate matches ${candidate.detectedPainPoint.toLowerCase()} and could be useful if handled as advice first.`,
      "The entry point may still be too broad if the author did not ask for a tool.",
      score.relevanceScore < 70 ? ["Weak relevance"] : [],
      "Opportunity Scout weighs urgency, pain, and fit before any draft exists."
    ),
    agentResult(
      deliberationRunId,
      "Market Analyst",
      score.marketInsightValueScore,
      score.marketInsightValueScore >= 70 ? "Capture market learning" : "Limited learning value",
      "The language reveals how the audience describes ownership, tooling, and process failure.",
      "The thread may repeat known pain rather than add a new objection.",
      [],
      "Market Analyst separates engagement value from insight value."
    ),
    agentResult(
      deliberationRunId,
      "Product Fit Analyst",
      score.productFitScore,
      score.productFitScore >= 75 ? "Product fit is plausible" : "Keep product out",
      `${project.name} overlaps with the operational problem when ownership and workflow visibility are central.`,
      "A direct product recommendation would be forced unless the author explicitly asks for tools.",
      score.productFitScore < 75 ? ["Weak product fit"] : [],
      "Product Fit Analyst checks approved product knowledge and avoids unsupported claims."
    ),
    agentResult(
      deliberationRunId,
      "Community Risk Officer",
      100 - score.communityRiskScore,
      score.communityRiskScore <= 35 ? "Low community risk" : "Approval gate required",
      "A helpful-only or category-level reply can respect the community norms.",
      matchingRule
        ? `${matchingRule.communityName} has ${matchingRule.riskLevel} risk and ${matchingRule.productMentionTolerance} product mention tolerance.`
        : "No community rule exists, so uncertainty should increase caution.",
      score.communityRiskScore > 35 ? ["Community risk threshold exceeded"] : [],
      "Community Risk Officer checks rules, links, disclosure, tone, and account safety."
    ),
    agentResult(
      deliberationRunId,
      "Skeptic",
      score.skepticObjectionStrength,
      "Do not assume engagement is deserved",
      "Silence may be better if the reply would feel like vendor insertion or if the author only needs peer advice.",
      "If the reply is helpful-only and specific, it can still be net useful.",
      score.skepticObjectionStrength > 40 ? ["Strong objection", "Promotion or context risk"] : [],
      "Skeptic always constructs the strongest case against posting."
    ),
    agentResult(
      deliberationRunId,
      "Engagement Strategist",
      score.engagementValueScore,
      selectedAction,
      "The safest engagement route is to answer the operational problem first and keep product language limited.",
      "The strategy should become monitor-only if risk rises or the community reacts negatively.",
      selectedAction === "soft_product_mention" ? ["Disclosure required"] : [],
      "Engagement Strategist chooses the response posture after seeing fit and risk."
    ),
    agentResult(
      deliberationRunId,
      "Brand Guardian",
      productMentionLevel >= 3 ? 30 : 84 - productMentionLevel * 4,
      productMentionLevel >= 3 ? "Reject draft" : "Draft tone approved",
      "The draft avoids fake personal experience, unsupported claims, and links.",
      productMentionLevel >= 2 ? "Affiliation must be disclosed and product language must remain secondary." : "No major brand concern.",
      productMentionLevel >= 3 ? ["Product mention too strong"] : [],
      "Brand Guardian approves only restrained, transparent language."
    ),
    agentResult(
      deliberationRunId,
      "Final Judge",
      score.responseConfidenceScore,
      selectedAction,
      "The decision accounts for relevance, fit, community safety, Skeptic objections, and policy thresholds.",
      blockedReason ?? "Auto-engagement still depends on policy; human approval remains the default.",
      blockedReason ? ["Blocked"] : [],
      "Final Judge resolves the internal debate into one auditable decision."
    )
  ];

  const brandGuardianApproved = (agentResults.find((agent) => agent.agentName === "Brand Guardian")?.score ?? 0) >= 70;
  const finalJudgeApproved = selectedAction !== "do_not_engage";
  const preliminaryDecision: FinalDecision = {
    id: makeId("decision"),
    deliberationRunId,
    candidateId: candidate.id,
    selectedAction,
    selectedResponseType,
    productMentionLevel,
    requiresDisclosure: productMentionLevel >= 2,
    autoEngageAllowed: false,
    humanApprovalRequired: true,
    finalReasoning:
      "Final Judge compared the supporting arguments with the Skeptic objection, then applied policy thresholds before allowing any action.",
    approvedDraft,
    blockedReason,
    policyResult: "Policy evaluation pending.",
    createdAt: now
  };
  const policyResult = evaluateAutonomyPolicy({
    policy,
    score,
    finalDecision: preliminaryDecision,
    candidateType: candidate.candidateType,
    communityRule: matchingRule,
    brandGuardianApproved,
    finalJudgeApproved,
    guardrailBlocked: shouldBlock
  });
  const finalDecision: FinalDecision = {
    ...preliminaryDecision,
    autoEngageAllowed: policyResult.autoEngageAllowed,
    humanApprovalRequired: policyResult.humanApprovalRequired,
    policyResult: policyResult.policyResult
  };
  const run: DeliberationRun = {
    id: deliberationRunId,
    projectId: project.id,
    candidateId: candidate.id,
    status: "completed",
    finalDecision: selectedAction,
    finalConfidence: score.responseConfidenceScore,
    autonomyStatus: policyResult.autonomyStatus,
    createdAt: now,
    updatedAt: now
  };

  return { run, agentResults, score, finalDecision, blockingReasons: policyResult.blockingReasons };
}
