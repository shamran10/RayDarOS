import type {
  DraftStatus,
  AutonomyStatus,
  AutonomousActionStatus,
  AutonomousActionType,
  CandidateStatus,
  CandidateType,
  FinalDecisionAction,
  GuardrailAction,
  KnowledgeHealth,
  KnowledgeStatus,
  OpportunityStatus,
  ProductMentionLevel,
  RecommendedAction,
  ResponseType,
  RiskLevel
} from "@/lib/types";

export const riskLabels: Record<RiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  blocked: "Blocked"
};

export const knowledgeHealthLabels: Record<KnowledgeHealth, string> = {
  strong: "Strong",
  needs_review: "Needs review",
  sparse: "Sparse",
  missing: "Missing",
  outdated: "Outdated"
};

export const knowledgeStatusLabels: Record<KnowledgeStatus, string> = {
  draft: "Draft",
  approved: "Approved",
  restricted: "Restricted",
  archived: "Archived"
};

export const opportunityStatusLabels: Record<OpportunityStatus, string> = {
  new: "New",
  analyzed: "Analyzed",
  draft_ready: "Draft ready",
  awaiting_review: "Awaiting review",
  approved: "Approved",
  posted_manually: "Posted externally",
  rejected: "Rejected",
  saved_as_insight: "Saved as insight",
  do_not_reply: "Do not reply"
};

export const draftStatusLabels: Record<DraftStatus, string> = {
  draft: "Draft",
  approved: "Approved",
  rejected: "Rejected",
  copied: "Copied",
  posted_manually: "Posted externally"
};

export const recommendedActionLabels: Record<RecommendedAction, string> = {
  helpful_answer_only: "Helpful answer only",
  clarifying_question: "Clarifying question",
  helpful_with_soft_disclosure: "Helpful answer with soft disclosure",
  product_recommendation_with_disclosure: "Product recommendation with disclosure",
  save_as_market_insight: "Save as market insight",
  monitor_for_follow_up: "Monitor for follow-up",
  do_not_reply: "Do not reply"
};

export const responseTypeLabels: Record<ResponseType, string> = {
  helpful_only: "Helpful-only reply",
  founder_style: "Founder-style reply",
  short_casual: "Short casual reply",
  detailed_practical: "Detailed practical reply",
  clarifying_question: "Clarifying question",
  soft_product_mention: "Soft product mention",
  product_recommendation_with_disclosure: "Product recommendation with disclosure"
};

export const guardrailActionLabels: Record<GuardrailAction, string> = {
  warn: "Warn",
  require_edit: "Require edit",
  block_response: "Block response",
  recommend_helpful_only: "Recommend helpful-only",
  recommend_save_as_insight: "Recommend save as insight",
  require_disclosure: "Require disclosure",
  remove_link: "Remove link",
  lower_product_mention_level: "Lower product mention level"
};

export const productMentionLabels: Record<ProductMentionLevel, string> = {
  0: "Level 0: No Product Mention",
  1: "Level 1: Category Mention",
  2: "Level 2: Soft Affiliation Mention",
  3: "Level 3: Product Name Mention",
  4: "Level 4: Product Link"
};

export const candidateTypeLabels: Record<CandidateType, string> = {
  original_post: "Original post",
  top_comment: "Top comment",
  recent_comment: "Recent comment",
  nested_reply: "Nested reply",
  unanswered_question: "Unanswered question",
  competitor_mention: "Competitor mention",
  tool_request: "Tool request",
  pain_point: "Pain point",
  implementation_question: "Implementation question",
  buying_intent: "Buying intent",
  negative_sentiment: "Negative sentiment",
  market_insight_only: "Market insight only"
};

export const candidateStatusLabels: Record<CandidateStatus, string> = {
  new: "New",
  mapped: "Mapped",
  deliberating: "Deliberating",
  deliberated: "Deliberated",
  queued_for_approval: "Queued for approval",
  safe_to_auto_engage: "Safe to auto-engage",
  auto_engaged: "Auto-engaged",
  saved_as_insight: "Saved as insight",
  monitor_only: "Monitor only",
  blocked: "Blocked",
  rejected: "Rejected"
};

export const finalDecisionActionLabels: Record<FinalDecisionAction, string> = {
  reply: "Reply",
  helpful_only_reply: "Helpful-only reply",
  clarifying_question: "Clarifying question",
  soft_product_mention: "Soft product mention",
  product_recommendation_with_disclosure: "Product recommendation with disclosure",
  save_as_market_insight: "Save as market insight",
  monitor_only: "Monitor only",
  do_not_engage: "Do not engage"
};

export const autonomyStatusLabels: Record<AutonomyStatus, string> = {
  safe_to_auto_engage: "Safe to auto-engage",
  needs_human_approval: "Needs human approval",
  monitor_only: "Monitor only",
  save_as_insight_only: "Save as insight only",
  blocked: "Blocked"
};

export const autonomousActionTypeLabels: Record<AutonomousActionType, string> = {
  auto_reply: "Auto reply",
  queue_for_approval: "Queue for approval",
  save_as_insight: "Save as insight",
  monitor: "Monitor",
  block: "Block"
};

export const autonomousActionStatusLabels: Record<AutonomousActionStatus, string> = {
  pending: "Pending",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
  blocked: "Blocked",
  simulated: "Simulated"
};
