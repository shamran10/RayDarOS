import type {
  CommunityRule,
  ConversationCandidate,
  DiscoveredItem,
  KnowledgeItem,
  Opportunity,
  Project
} from "@/lib/types";

const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
const lower = (value: string) => value.toLowerCase();
const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const toolSignals = ["tool", "software", "platform", "recommend", "what do you use", "looking for"];
const implementationSignals = ["how", "setup", "rollout", "assign", "track", "workflow", "owner", "handoff"];
const buyingSignals = ["replace", "buy", "evaluate", "vendor", "pricing", "demo", "shortlist"];
const negativeSignals = ["hate", "broken", "stuck", "mess", "chaos", "frustrating", "nobody"];

function hits(text: string, terms: string[]) {
  return terms.filter((term) => lower(text).includes(term)).length;
}

function findTerm(text: string, terms: string[]) {
  return terms.find((term) => lower(text).includes(lower(term)));
}

function inferCandidateType(text: string, item: DiscoveredItem): ConversationCandidate["candidateType"] {
  const normalized = lower(text);
  if (item.replyCount === 0 || normalized.includes("?")) return "unanswered_question";
  if (hits(normalized, buyingSignals) >= 1) return "buying_intent";
  if (hits(normalized, toolSignals) >= 1) return "tool_request";
  if (hits(normalized, implementationSignals) >= 2) return "implementation_question";
  if (hits(normalized, negativeSignals) >= 2) return "negative_sentiment";
  if (item.parentExternalId) return item.score && item.score > 70 ? "top_comment" : "nested_reply";
  return "original_post";
}

function inferPainPoint(text: string, marketKnowledge: KnowledgeItem[]) {
  const normalized = lower(text);
  const marketMatch = marketKnowledge.find((item) =>
    `${item.title} ${item.content}`
      .split(/\W+/)
      .filter((word) => word.length > 6)
      .some((word) => normalized.includes(lower(word)))
  );

  if (marketMatch) return marketMatch.title;
  if (normalized.includes("approval")) return "Approval bottlenecks";
  if (normalized.includes("onboarding")) return "Onboarding workflow gaps";
  if (normalized.includes("spreadsheet") || normalized.includes("sheets")) return "Spreadsheet workflow sprawl";
  if (normalized.includes("owner") || normalized.includes("handoff")) return "Unclear ownership and handoffs";
  if (normalized.includes("ai")) return "AI adoption readiness";
  return "Operational workflow friction";
}

function inferIntent(text: string) {
  if (hits(text, buyingSignals) >= 1) return "Buying or switching intent";
  if (hits(text, toolSignals) >= 1) return "Tool evaluation";
  if (hits(text, implementationSignals) >= 2) return "Implementation help";
  if (text.includes("?")) return "Question seeking practical advice";
  return "Market signal";
}

function ruleRisk(rule?: CommunityRule) {
  if (!rule) return 38;
  if (rule.riskLevel === "blocked") return 100;
  if (rule.riskLevel === "high") return 74;
  if (rule.riskLevel === "medium") return 48;
  return 24;
}

export function mapDiscoveredItemToCandidates({
  item,
  project,
  productKnowledge,
  marketKnowledge,
  communityRules
}: {
  item: DiscoveredItem;
  project: Project;
  productKnowledge: KnowledgeItem[];
  marketKnowledge: KnowledgeItem[];
  communityRules: CommunityRule[];
}): ConversationCandidate[] {
  const text = `${item.title} ${item.body}`;
  const normalized = lower(text);
  const matchingRule = communityRules.find((rule) => lower(rule.communityName) === lower(item.community));
  const productCategoryMentioned = findTerm(normalized, [project.productType, project.name, ...productKnowledge.map((item) => item.title)]);
  const competitorMentioned = findTerm(normalized, ["spreadsheet", "google sheets", "notion", "airtable", "jira", "asana", "monday"]);
  const candidateType = competitorMentioned && !productCategoryMentioned ? "competitor_mention" : inferCandidateType(text, item);
  const detectedPainPoint = inferPainPoint(text, marketKnowledge);
  const intent = inferIntent(normalized);
  const relevance = clampScore(45 + hits(normalized, [...toolSignals, ...implementationSignals]) * 8 + (productCategoryMentioned ? 12 : 0));
  const intentScore = clampScore(35 + hits(normalized, [...buyingSignals, ...toolSignals]) * 12 + (normalized.includes("?") ? 9 : 0));
  const initialRisk = clampScore(ruleRisk(matchingRule) + hits(normalized, ["link", "dm me", "promo", "vendor"]) * 9);

  const candidate: ConversationCandidate = {
    id: makeId("candidate"),
    projectId: project.id,
    discoveredItemId: item.id,
    platform: item.platform,
    community: item.community,
    sourceType: item.sourceType,
    externalId: item.externalId,
    parentExternalId: item.parentExternalId,
    authorHandle: item.authorHandle,
    title: item.title,
    body: item.body,
    url: item.url,
    candidateType,
    detectedIntent: intent,
    detectedPainPoint,
    competitorMentioned,
    productCategoryMentioned,
    candidateSummary: `${item.authorHandle} is discussing ${detectedPainPoint.toLowerCase()} with ${intent.toLowerCase()}.`,
    initialRelevanceScore: relevance,
    initialIntentScore: intentScore,
    initialRiskScore: initialRisk,
    status: "mapped",
    whyWorthAnalyzing:
      relevance >= 70 || intentScore >= 70
        ? "The signal has enough relevance or intent to justify internal deliberation before any response is drafted."
        : "The signal may be more useful as market intelligence than as an engagement target.",
    recommendedNextStep: initialRisk >= 75 ? "Expect the policy stage to monitor or block." : "Review the generated decision trail before approving.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return [candidate];
}

export function mapOpportunityToCandidate(opportunity: Opportunity): ConversationCandidate {
  return {
    id: makeId("candidate-manual"),
    projectId: opportunity.projectId,
    opportunityId: opportunity.id,
    platform: opportunity.platform,
    community: opportunity.community,
    sourceType: "manual",
    externalId: `manual-${opportunity.id}`,
    authorHandle: "manual-submitter",
    title: opportunity.threadTitle,
    body: opportunity.sourceText,
    url: opportunity.threadUrl,
    candidateType:
      opportunity.recommendedAction === "save_as_market_insight"
        ? "market_insight_only"
        : opportunity.intentLevel === "high"
          ? "buying_intent"
          : "pain_point",
    detectedIntent: opportunity.intentLevel === "high" ? "High-intent fallback signal" : "Fallback analysis signal",
    detectedPainPoint: opportunity.painPoint,
    productCategoryMentioned: opportunity.productMentionLevel > 0 ? "Product/category fit detected" : undefined,
    candidateSummary: opportunity.conversationSummary,
    initialRelevanceScore: opportunity.scores.relevanceScore,
    initialIntentScore: opportunity.scores.intentScore,
    initialRiskScore: Math.max(opportunity.scores.promotionRiskScore, opportunity.scores.communityRiskScore),
    status: "mapped",
    whyWorthAnalyzing: "Fallback intake is routed into candidate mapping so the autonomous pipeline can decide what happens next.",
    recommendedNextStep: "Review deliberation and final decision.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
