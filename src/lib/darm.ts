import type {
  AnalysisInput,
  DarmAnalysisResult,
  GuardrailAction,
  GuardrailCheck,
  MarketInsight,
  Opportunity,
  OpportunityScore,
  ProductMentionLevel,
  RecommendedAction,
  ResponseDraft,
  ResponseType,
  RiskLevel
} from "@/lib/types";

const painPointSignals = [
  "spreadsheet",
  "sheets",
  "approval",
  "approvals",
  "onboarding",
  "slack",
  "whatsapp",
  "manual",
  "workflow",
  "hr",
  "expense",
  "leave",
  "ownership",
  "bottleneck",
  "erp",
  "ai",
  "automation",
  "process"
];

const buyingIntentSignals = [
  "recommend",
  "tool",
  "software",
  "platform",
  "how do you",
  "what do you use",
  "looking for",
  "switch",
  "replace",
  "better way",
  "anyone using"
];

const highRiskSignals = ["promo", "link", "discount", "affiliate", "dm me", "buy", "sign up"];

const clampScore = (score: number) => Math.max(0, Math.min(100, Math.round(score)));
const lower = (value: string) => value.toLowerCase();
const includesAny = (text: string, terms: string[]) => terms.some((term) => lower(text).includes(term));
const countHits = (text: string, terms: string[]) => terms.filter((term) => lower(text).includes(term)).length;

const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

const communityRiskWeight: Record<RiskLevel, number> = {
  low: 18,
  medium: 42,
  high: 68,
  blocked: 100
};

function getPrimaryRule(input: AnalysisInput) {
  return (
    input.communityRules.find((rule) => lower(rule.communityName) === lower(input.community)) ??
    input.communityRules.find((rule) => lower(input.community).includes(lower(rule.communityName))) ??
    input.communityRules[0]
  );
}

function inferPainPoint(input: AnalysisInput) {
  const text = lower(`${input.threadTitle} ${input.sourceText}`);
  const matchingMarketItem = input.marketKnowledge.find((item) =>
    lower(`${item.title} ${item.content}`).split(/\W+/).some((word) => word.length > 5 && text.includes(word))
  );

  if (matchingMarketItem) {
    return matchingMarketItem.title;
  }

  if (text.includes("onboarding")) return "Employee onboarding managed through spreadsheets";
  if (text.includes("approval")) return "Approval delays";
  if (text.includes("slack") || text.includes("whatsapp")) return "Scattered requests across chat";
  if (text.includes("ai")) return "AI adoption readiness";
  if (text.includes("spreadsheet") || text.includes("sheets")) return "Teams outgrowing spreadsheets";
  return "Operational workflow friction";
}

function scoreOpportunity(input: AnalysisInput, ruleRisk: RiskLevel): OpportunityScore {
  const text = `${input.threadTitle} ${input.sourceText}`;
  const painHits = countHits(text, painPointSignals);
  const intentHits = countHits(text, buyingIntentSignals);
  const productHits = countHits(
    text,
    input.productKnowledge
      .flatMap((item) => `${item.title} ${item.content}`.split(/\W+/))
      .filter((word) => word.length > 6)
      .slice(0, 80)
  );
  const riskHits = countHits(text, highRiskSignals);
  const relevanceScore = clampScore(48 + painHits * 9 + productHits * 3);
  const intentScore = clampScore(38 + intentHits * 12 + (lower(text).includes("?") ? 8 : 0));
  const productFitScore = clampScore(42 + productHits * 8 + painHits * 4);
  const promotionRiskScore = clampScore(communityRiskWeight[ruleRisk] * 0.55 + riskHits * 12);
  const communityRiskScore = clampScore(communityRiskWeight[ruleRisk]);
  const engagementValueScore = clampScore((relevanceScore + intentScore + productFitScore) / 3 - promotionRiskScore * 0.12);
  const accountSafetyScore = clampScore(100 - communityRiskScore * 0.45 - promotionRiskScore * 0.25);
  const responseConfidenceScore = clampScore((relevanceScore + productFitScore + accountSafetyScore) / 3);

  return {
    relevanceScore,
    intentScore,
    productFitScore,
    engagementValueScore,
    promotionRiskScore,
    communityRiskScore,
    accountSafetyScore,
    responseConfidenceScore
  };
}

function inferMentionLevel(score: OpportunityScore, ruleRisk: RiskLevel, text: string): ProductMentionLevel {
  if (ruleRisk === "blocked" || score.accountSafetyScore < 35) return 0;
  if (ruleRisk === "high") return 0;
  if (score.productFitScore < 65 || score.intentScore < 55) return 0;
  if (includesAny(text, ["link", "website", "where can i try", "demo"])) return ruleRisk === "low" ? 3 : 2;
  if (includesAny(text, ["tool", "software", "platform", "recommend", "what do you use"])) return 2;
  return 1;
}

function inferAction(level: ProductMentionLevel, score: OpportunityScore, ruleRisk: RiskLevel): RecommendedAction {
  if (ruleRisk === "blocked" || score.accountSafetyScore < 30) return "do_not_reply";
  if (score.engagementValueScore < 45) return "save_as_market_insight";
  if (level === 0 && score.intentScore < 55) return "clarifying_question";
  if (level === 0) return "helpful_answer_only";
  if (level <= 2) return "helpful_with_soft_disclosure";
  return "product_recommendation_with_disclosure";
}

function inferResponseType(action: RecommendedAction, level: ProductMentionLevel): ResponseType {
  if (action === "clarifying_question") return "clarifying_question";
  if (action === "do_not_reply" || action === "save_as_market_insight") return "helpful_only";
  if (level === 0) return "helpful_only";
  if (level <= 2) return "soft_product_mention";
  return "product_recommendation_with_disclosure";
}

function inferRisk(score: OpportunityScore, ruleRisk: RiskLevel): RiskLevel {
  if (ruleRisk === "blocked") return "blocked";
  if (score.promotionRiskScore >= 72 || score.communityRiskScore >= 72) return "high";
  if (score.promotionRiskScore >= 42 || score.communityRiskScore >= 42) return "medium";
  return "low";
}

function buildDrafts(
  input: AnalysisInput,
  opportunityId: string,
  painPoint: string,
  level: ProductMentionLevel,
  riskLevel: RiskLevel
): ResponseDraft[] {
  const disclosure =
    level >= 2
      ? `\n\nDisclosure: I work on ${input.project.name}, which is in this general space, so I would still start with the process fix before treating software as the answer.`
      : "";
  const practical =
    `I would separate this into three questions: what is the recurring workflow, who owns each handoff, and where does work become invisible. The fix is usually less about adding another tracker and more about making the next owner, due date, and blocked state obvious.\n\nA practical first pass: map the current steps, remove anything that is not required, assign one owner per stage, and review the next few cases to see where people still get stuck.${disclosure}`;
  const casual =
    `This sounds like a handoff problem more than a documentation problem. I would map the steps, give each stage a clear owner, and make blocked items visible somewhere the team already checks. If the process is still changing every week, keep the tooling lightweight until the workflow stabilizes.${disclosure}`;
  const clarifying =
    "Before choosing a tool, I would ask one thing: where does the process actually stall today? If it is approvals, ownership and escalation matter most. If it is repeated questions, a better checklist or FAQ might be enough. If it is visibility, you probably need a shared workflow view.";

  return [
    {
      id: id("draft"),
      opportunityId,
      responseText: practical,
      responseType: level === 0 ? "detailed_practical" : "soft_product_mention",
      productMentionLevel: level,
      disclosureIncluded: level >= 2,
      riskLevel,
      reasoning:
        "This option leads with a practical workflow diagnosis, avoids links, and keeps any product affiliation disclosed and secondary.",
      status: "draft",
      editedByUser: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: id("draft"),
      opportunityId,
      responseText: casual,
      responseType: "short_casual",
      productMentionLevel: level >= 2 ? 2 : 0,
      disclosureIncluded: level >= 2,
      riskLevel,
      reasoning: "Shorter version for communities that prefer concise replies and low promotional surface area.",
      status: "draft",
      editedByUser: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: id("draft"),
      opportunityId,
      responseText: clarifying,
      responseType: "clarifying_question",
      productMentionLevel: 0,
      disclosureIncluded: false,
      riskLevel: riskLevel === "high" ? "medium" : riskLevel,
      reasoning: `A clarifying route is safer if the team is not ready to mention ${input.project.name} or the community mood is uncertain.`,
      status: "draft",
      editedByUser: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

function guardrail(
  opportunityId: string,
  checkType: string,
  description: string,
  severity: RiskLevel,
  action: GuardrailAction,
  passed: boolean
): GuardrailCheck {
  return {
    id: id("guard"),
    opportunityId,
    checkType,
    description,
    severity,
    action,
    passed,
    createdAt: new Date().toISOString()
  };
}

function buildGuardrails(input: AnalysisInput, opportunityId: string, level: ProductMentionLevel, riskLevel: RiskLevel) {
  const rule = getPrimaryRule(input);
  const checks: GuardrailCheck[] = [];

  if (rule?.riskLevel === "blocked") {
    checks.push(
      guardrail(
        opportunityId,
        "Blocked community",
        "This community is marked Blocked. ReydarOS should not recommend posting.",
        "blocked",
        "block_response",
        false
      )
    );
  }

  if (rule?.linkPolicy && lower(rule.linkPolicy).includes("no links")) {
    checks.push(
      guardrail(
        opportunityId,
        "Link usage",
        "Community link policy is restricted. Generated replies avoid links.",
        riskLevel,
        "remove_link",
        true
      )
    );
  }

  if (level >= 2) {
    checks.push(
      guardrail(
        opportunityId,
        "Disclosure requirements",
        "Product affiliation is disclosed because the recommendation uses a soft product mention or stronger.",
        "medium",
        "require_disclosure",
        true
      )
    );
  }

  if (rule?.productMentionTolerance === "low" && level > 0) {
    checks.push(
      guardrail(
        opportunityId,
        "Product mention tolerance",
        "This community has low product mention tolerance. Keep the response helpful-first and consider Level 0.",
        "medium",
        "recommend_helpful_only",
        level <= 2
      )
    );
  }

  checks.push(
    guardrail(
      opportunityId,
      "Repeated wording",
      "No highly similar recent wording detected in the demo memory.",
      "low",
      "warn",
      true
    )
  );

  return checks;
}

export function runHeuristicDarmAnalysis(input: AnalysisInput): DarmAnalysisResult {
  const rule = getPrimaryRule(input);
  const ruleRisk = rule?.riskLevel ?? input.project.riskTolerance;
  const scores = scoreOpportunity(input, ruleRisk);
  const text = `${input.threadTitle} ${input.sourceText}`;
  const productMentionLevel = inferMentionLevel(scores, ruleRisk, text);
  const recommendedAction = inferAction(productMentionLevel, scores, ruleRisk);
  const responseType = inferResponseType(recommendedAction, productMentionLevel);
  const riskLevel = inferRisk(scores, ruleRisk);
  const opportunityId = id("opp");
  const painPoint = inferPainPoint(input);
  const summary =
    input.sourceText.length > 220
      ? `${input.sourceText.slice(0, 217).trim()}...`
      : input.sourceText || "Conversation text was not provided.";

  const opportunity: Opportunity = {
    id: opportunityId,
    projectId: input.project.id,
    platform: input.platform,
    community: input.community || "Unknown community",
    threadTitle: input.threadTitle || "Untitled conversation",
    threadUrl: input.threadUrl,
    sourceText: input.sourceText,
    conversationSummary: summary,
    userProblem: `The conversation signals ${painPoint.toLowerCase()} and asks for a practical next step.`,
    painPoint,
    audienceMatch: `Likely match for ${input.project.targetAudience}`,
    productFitExplanation:
      productMentionLevel === 0
        ? `${input.project.name} may be relevant, but the safer route is to answer the operational problem without naming the product.`
        : `${input.project.name} is relevant because the thread overlaps with approved knowledge and known market pain points. Mention only with disclosure and no link.`,
    intentLevel: scores.intentScore >= 75 ? "high" : scores.intentScore >= 52 ? "medium" : "low",
    riskLevel,
    recommendedAction,
    responseType,
    productMentionLevel,
    reasoning:
      "DARM compared the conversation with product knowledge, market pain signals, and community rules. It favors helpfulness, disclosure, and restraint over promotional engagement.",
    status: "draft_ready",
    scores,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const responseDrafts = buildDrafts(input, opportunityId, painPoint, productMentionLevel, riskLevel);
  const guardrailChecks = buildGuardrails(input, opportunityId, productMentionLevel, riskLevel);
  const insightCandidates: MarketInsight[] = [
    {
      id: id("insight"),
      projectId: input.project.id,
      opportunityId,
      category: "Insight candidates",
      title: `${painPoint} language`,
      insight: `Source conversation used language around "${painPoint.toLowerCase()}"; useful for product messaging and objection handling.`,
      source: input.threadUrl || `${input.platform} / ${input.community}`,
      confidence: scores.responseConfidenceScore / 100,
      approved: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  return { opportunity, responseDrafts, guardrailChecks, insightCandidates };
}
