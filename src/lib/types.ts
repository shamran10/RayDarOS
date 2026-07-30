export type RiskLevel = "low" | "medium" | "high" | "blocked";
export type KnowledgeHealth = "strong" | "needs_review" | "sparse" | "missing" | "outdated";
export type KnowledgeStatus = "draft" | "approved" | "restricted" | "archived";
export type ProjectStatus = "active" | "paused" | "archived";
export type OpportunityStatus =
  | "new"
  | "analyzed"
  | "draft_ready"
  | "awaiting_review"
  | "approved"
  | "posted_manually"
  | "rejected"
  | "saved_as_insight"
  | "do_not_reply";
export type IntentLevel = "low" | "medium" | "high";
export type ProductMentionLevel = 0 | 1 | 2 | 3 | 4;
export type DraftStatus = "draft" | "approved" | "rejected" | "copied" | "posted_manually";
export type SourceType = "mock" | "manual" | "reddit";
export type DiscoveryRunStatus = "pending" | "running" | "completed" | "failed";
export type CandidateType =
  | "original_post"
  | "top_comment"
  | "recent_comment"
  | "nested_reply"
  | "unanswered_question"
  | "competitor_mention"
  | "tool_request"
  | "pain_point"
  | "implementation_question"
  | "buying_intent"
  | "negative_sentiment"
  | "market_insight_only";
export type CandidateStatus =
  | "new"
  | "mapped"
  | "deliberating"
  | "deliberated"
  | "queued_for_approval"
  | "safe_to_auto_engage"
  | "auto_engaged"
  | "saved_as_insight"
  | "monitor_only"
  | "blocked"
  | "rejected";
export type DeliberationStatus = "pending" | "running" | "completed" | "failed" | "blocked";
export type FinalDecisionAction =
  | "reply"
  | "helpful_only_reply"
  | "clarifying_question"
  | "soft_product_mention"
  | "product_recommendation_with_disclosure"
  | "save_as_market_insight"
  | "monitor_only"
  | "do_not_engage";
export type AutonomyStatus =
  | "safe_to_auto_engage"
  | "needs_human_approval"
  | "monitor_only"
  | "save_as_insight_only"
  | "blocked";
export type AutonomousActionType = "auto_reply" | "queue_for_approval" | "save_as_insight" | "monitor" | "block";
export type AutonomousActionStatus = "pending" | "completed" | "failed" | "cancelled" | "blocked" | "simulated";

export type RecommendedAction =
  | "helpful_answer_only"
  | "clarifying_question"
  | "helpful_with_soft_disclosure"
  | "product_recommendation_with_disclosure"
  | "save_as_market_insight"
  | "monitor_for_follow_up"
  | "do_not_reply";

export type ResponseType =
  | "helpful_only"
  | "founder_style"
  | "short_casual"
  | "detailed_practical"
  | "clarifying_question"
  | "soft_product_mention"
  | "product_recommendation_with_disclosure";

export type GuardrailAction =
  | "warn"
  | "require_edit"
  | "block_response"
  | "recommend_helpful_only"
  | "recommend_save_as_insight"
  | "require_disclosure"
  | "remove_link"
  | "lower_product_mention_level";

export interface Project {
  id: string;
  name: string;
  productType: string;
  productDescription: string;
  primaryObjective: string;
  engagementGoal: string;
  brandAccountName: string;
  websiteUrl: string;
  targetAudience: string;
  defaultTone: string;
  productMentionPolicy: string;
  riskTolerance: RiskLevel;
  status: ProjectStatus;
  connectedAccount: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeItem {
  id: string;
  projectId: string;
  category: string;
  title: string;
  content: string;
  source: string;
  status: KnowledgeStatus;
  health: KnowledgeHealth;
  approved: boolean;
  restricted?: boolean;
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityRule {
  id: string;
  projectId: string;
  communityName: string;
  platform: string;
  topic: string;
  allowedContentTypes: string;
  selfPromotionPolicy: string;
  linkPolicy: string;
  vendorParticipationRules: string;
  disclosureExpectations: string;
  tonePreference: string;
  riskLevel: RiskLevel;
  moderatorSensitivity: string;
  productMentionTolerance: "low" | "medium" | "high";
  previousSuccessfulComments: string;
  previousRemovals: string;
  previousNegativeReactions: string;
  recommendedReplyStyle: string;
  minimumAccountAgeOrKarma: string;
  engagementFrequencyHistory: string;
  createdAt: string;
  updatedAt: string;
}

export interface SignalSource {
  id: string;
  projectId: string;
  platform: string;
  sourceType: SourceType;
  communityName: string;
  sourceUrl: string;
  keywords: string[];
  competitorTerms: string[];
  painPointTerms: string[];
  excludedTerms: string[];
  scanFrequency: string;
  riskTolerance: RiskLevel;
  isActive: boolean;
  lastScannedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiscoveryRun {
  id: string;
  projectId: string;
  signalSourceId: string;
  providerType: SourceType;
  status: DiscoveryRunStatus;
  startedAt: string;
  completedAt?: string;
  itemsFound: number;
  candidatesCreated: number;
  errors: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DiscoveredItem {
  id: string;
  projectId: string;
  discoveryRunId: string;
  platform: string;
  community: string;
  sourceType: SourceType;
  externalId: string;
  parentExternalId?: string;
  authorHandle: string;
  title: string;
  body: string;
  url: string;
  score?: number;
  replyCount?: number;
  publishedAt: string;
  rawJson: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationCandidate {
  id: string;
  projectId: string;
  opportunityId?: string;
  discoveredItemId?: string;
  platform: string;
  community: string;
  sourceType: SourceType;
  externalId: string;
  parentExternalId?: string;
  authorHandle: string;
  title: string;
  body: string;
  url: string;
  candidateType: CandidateType;
  detectedIntent: string;
  detectedPainPoint: string;
  competitorMentioned?: string;
  productCategoryMentioned?: string;
  candidateSummary: string;
  initialRelevanceScore: number;
  initialIntentScore: number;
  initialRiskScore: number;
  status: CandidateStatus;
  whyWorthAnalyzing: string;
  recommendedNextStep: string;
  createdAt: string;
  updatedAt: string;
}

export interface OpportunityScore {
  relevanceScore: number;
  intentScore: number;
  productFitScore: number;
  engagementValueScore: number;
  promotionRiskScore: number;
  communityRiskScore: number;
  accountSafetyScore: number;
  responseConfidenceScore: number;
}

export interface CandidateScore extends OpportunityScore {
  id: string;
  projectId: string;
  candidateId: string;
  deliberationRunId: string;
  skepticObjectionStrength: number;
  marketInsightValueScore: number;
  createdAt: string;
}

export interface Opportunity {
  id: string;
  projectId: string;
  platform: string;
  community: string;
  threadTitle: string;
  threadUrl: string;
  sourceText: string;
  conversationSummary: string;
  userProblem: string;
  painPoint: string;
  audienceMatch: string;
  productFitExplanation: string;
  intentLevel: IntentLevel;
  riskLevel: RiskLevel;
  recommendedAction: RecommendedAction;
  responseType: ResponseType;
  productMentionLevel: ProductMentionLevel;
  reasoning: string;
  status: OpportunityStatus;
  scores: OpportunityScore;
  createdAt: string;
  updatedAt: string;
}

export interface ResponseDraft {
  id: string;
  opportunityId: string;
  candidateId?: string;
  deliberationRunId?: string;
  finalDecisionId?: string;
  responseText: string;
  responseType: ResponseType;
  productMentionLevel: ProductMentionLevel;
  disclosureIncluded: boolean;
  riskLevel: RiskLevel;
  reasoning: string;
  status: DraftStatus;
  editedByUser: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GuardrailCheck {
  id: string;
  opportunityId: string;
  responseDraftId?: string;
  checkType: string;
  description: string;
  severity: RiskLevel;
  action: GuardrailAction;
  passed: boolean;
  createdAt: string;
}

export interface MarketInsight {
  id: string;
  projectId: string;
  opportunityId?: string;
  candidateId?: string;
  deliberationRunId?: string;
  category: string;
  title: string;
  insight: string;
  source: string;
  confidence: number;
  approved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EngagementOutcome {
  id: string;
  opportunityId: string;
  responseDraftId?: string;
  candidateId?: string;
  autonomousActionLogId?: string;
  outcomeType:
    | "posted_manually"
    | "rejected"
    | "saved_as_insight"
    | "monitoring"
    | "positive_reply"
    | "negative_reply"
    | "removed"
    | "removed_comment"
    | "moderator_warning"
    | "manual_rejection"
    | "user_approved_edit"
    | "auto_engagement_success"
    | "auto_engagement_blocked"
    | "auto_engagement_failure";
  notes: string;
  postedUrl?: string;
  sentiment?: string;
  createdAt: string;
}

export interface DeliberationRun {
  id: string;
  projectId: string;
  candidateId: string;
  status: DeliberationStatus;
  finalDecision: FinalDecisionAction;
  finalConfidence: number;
  autonomyStatus: AutonomyStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DeliberationAgentResult {
  id: string;
  deliberationRunId: string;
  agentName: string;
  recommendation: string;
  score: number;
  argumentFor: string;
  argumentAgainst: string;
  riskFlags: string[];
  reasoning: string;
  createdAt: string;
}

export interface FinalDecision {
  id: string;
  deliberationRunId: string;
  candidateId: string;
  selectedAction: FinalDecisionAction;
  selectedResponseType: ResponseType;
  productMentionLevel: ProductMentionLevel;
  requiresDisclosure: boolean;
  autoEngageAllowed: boolean;
  humanApprovalRequired: boolean;
  finalReasoning: string;
  approvedDraft: string;
  blockedReason?: string;
  policyResult: string;
  createdAt: string;
}

export interface AutonomyPolicy {
  id: string;
  projectId: string;
  communityRuleId?: string;
  name: string;
  allowAutoEngage: boolean;
  maxCommentsPerDay: number;
  maxCommentsPerCommunityPerDay: number;
  maxProductMentionsPerWeek: number;
  allowedProductMentionLevels: ProductMentionLevel[];
  allowLinks: boolean;
  requireDisclosure: boolean;
  minRelevanceScore: number;
  minIntentScore: number;
  minProductFitScore: number;
  minEngagementValueScore: number;
  maxPromotionRiskScore: number;
  maxCommunityRiskScore: number;
  minAccountSafetyScore: number;
  maxSkepticObjectionStrength: number;
  allowedCandidateTypes: CandidateType[];
  blockedCandidateTypes: CandidateType[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AutonomousActionLog {
  id: string;
  projectId: string;
  candidateId: string;
  deliberationRunId: string;
  finalDecisionId: string;
  actionType: AutonomousActionType;
  actionStatus: AutonomousActionStatus;
  platform: string;
  community: string;
  responseText: string;
  policySnapshot: AutonomyPolicy;
  reason: string;
  postedUrl?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  projectId?: string;
  entityType: string;
  entityId?: string;
  action: string;
  message: string;
  createdAt: string;
}

export interface ReydarState {
  activeProjectId: string;
  projects: Project[];
  productKnowledge: KnowledgeItem[];
  marketKnowledge: KnowledgeItem[];
  communityRules: CommunityRule[];
  signalSources: SignalSource[];
  discoveryRuns: DiscoveryRun[];
  discoveredItems: DiscoveredItem[];
  conversationCandidates: ConversationCandidate[];
  deliberationRuns: DeliberationRun[];
  deliberationAgentResults: DeliberationAgentResult[];
  candidateScores: CandidateScore[];
  finalDecisions: FinalDecision[];
  autonomyPolicies: AutonomyPolicy[];
  autonomousActionLogs: AutonomousActionLog[];
  opportunities: Opportunity[];
  responseDrafts: ResponseDraft[];
  guardrailChecks: GuardrailCheck[];
  marketInsights: MarketInsight[];
  engagementOutcomes: EngagementOutcome[];
  activityLogs: ActivityLog[];
}

export interface AnalysisInput {
  project: Project;
  productKnowledge: KnowledgeItem[];
  marketKnowledge: KnowledgeItem[];
  communityRules: CommunityRule[];
  platform: string;
  community: string;
  threadTitle: string;
  threadUrl: string;
  sourceText: string;
  notes?: string;
}

export interface DarmAnalysisResult {
  opportunity: Opportunity;
  responseDrafts: ResponseDraft[];
  guardrailChecks: GuardrailCheck[];
  insightCandidates: MarketInsight[];
}
