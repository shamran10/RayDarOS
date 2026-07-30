import { PrismaClient, type Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { initialState } from "../src/lib/seed-data";
import type {
  DraftStatus,
  GuardrailAction,
  KnowledgeHealth,
  KnowledgeStatus,
  OpportunityStatus,
  ProductMentionLevel,
  RecommendedAction,
  ResponseType,
  RiskLevel
} from "../src/lib/types";
import type {
  AutonomousActionStatus,
  AutonomousActionType,
  AutonomyStatus,
  CandidateStatus,
  CandidateType,
  DeliberationStatus,
  DiscoveryRunStatus,
  FinalDecisionAction,
  SourceType
} from "../src/lib/types";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run the demo seed.");
}

const adapter = new PrismaPg({ connectionString: databaseUrl });

const prisma = new PrismaClient({ adapter });
const json = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

const risk = (value: RiskLevel) => value.toUpperCase() as "LOW" | "MEDIUM" | "HIGH" | "BLOCKED";
const knowledgeHealth = (value: KnowledgeHealth) =>
  value.toUpperCase() as "STRONG" | "NEEDS_REVIEW" | "SPARSE" | "MISSING" | "OUTDATED";
const knowledgeStatus = (value: KnowledgeStatus) =>
  value.toUpperCase() as "DRAFT" | "APPROVED" | "RESTRICTED" | "ARCHIVED";
const opportunityStatus = (value: OpportunityStatus) =>
  value.toUpperCase() as
    | "NEW"
    | "ANALYZED"
    | "DRAFT_READY"
    | "AWAITING_REVIEW"
    | "APPROVED"
    | "POSTED_MANUALLY"
    | "REJECTED"
    | "SAVED_AS_INSIGHT"
    | "DO_NOT_REPLY";
const action = (value: RecommendedAction) =>
  value.toUpperCase() as
    | "HELPFUL_ANSWER_ONLY"
    | "CLARIFYING_QUESTION"
    | "HELPFUL_WITH_SOFT_DISCLOSURE"
    | "PRODUCT_RECOMMENDATION_WITH_DISCLOSURE"
    | "SAVE_AS_MARKET_INSIGHT"
    | "MONITOR_FOR_FOLLOW_UP"
    | "DO_NOT_REPLY";
const responseType = (value: ResponseType) =>
  value.toUpperCase() as
    | "HELPFUL_ONLY"
    | "FOUNDER_STYLE"
    | "SHORT_CASUAL"
    | "DETAILED_PRACTICAL"
    | "CLARIFYING_QUESTION"
    | "SOFT_PRODUCT_MENTION"
    | "PRODUCT_RECOMMENDATION_WITH_DISCLOSURE";
const productMention = (value: ProductMentionLevel) =>
  `LEVEL_${value}` as "LEVEL_0" | "LEVEL_1" | "LEVEL_2" | "LEVEL_3" | "LEVEL_4";
const sourceType = (value: SourceType) => value.toUpperCase() as "MOCK" | "MANUAL" | "REDDIT";
const discoveryRunStatus = (value: DiscoveryRunStatus) =>
  value.toUpperCase() as "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
const candidateType = (value: CandidateType) =>
  value.toUpperCase() as
    | "ORIGINAL_POST"
    | "TOP_COMMENT"
    | "RECENT_COMMENT"
    | "NESTED_REPLY"
    | "UNANSWERED_QUESTION"
    | "COMPETITOR_MENTION"
    | "TOOL_REQUEST"
    | "PAIN_POINT"
    | "IMPLEMENTATION_QUESTION"
    | "BUYING_INTENT"
    | "NEGATIVE_SENTIMENT"
    | "MARKET_INSIGHT_ONLY";
const candidateStatus = (value: CandidateStatus) =>
  value.toUpperCase() as
    | "NEW"
    | "MAPPED"
    | "DELIBERATING"
    | "DELIBERATED"
    | "QUEUED_FOR_APPROVAL"
    | "SAFE_TO_AUTO_ENGAGE"
    | "AUTO_ENGAGED"
    | "SAVED_AS_INSIGHT"
    | "MONITOR_ONLY"
    | "BLOCKED"
    | "REJECTED";
const deliberationStatus = (value: DeliberationStatus) =>
  value.toUpperCase() as "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "BLOCKED";
const finalDecisionAction = (value: FinalDecisionAction) =>
  value.toUpperCase() as
    | "REPLY"
    | "HELPFUL_ONLY_REPLY"
    | "CLARIFYING_QUESTION"
    | "SOFT_PRODUCT_MENTION"
    | "PRODUCT_RECOMMENDATION_WITH_DISCLOSURE"
    | "SAVE_AS_MARKET_INSIGHT"
    | "MONITOR_ONLY"
    | "DO_NOT_ENGAGE";
const autonomyStatus = (value: AutonomyStatus) =>
  value.toUpperCase() as
    | "SAFE_TO_AUTO_ENGAGE"
    | "NEEDS_HUMAN_APPROVAL"
    | "MONITOR_ONLY"
    | "SAVE_AS_INSIGHT_ONLY"
    | "BLOCKED";
const autonomousActionType = (value: AutonomousActionType) =>
  value.toUpperCase() as "AUTO_REPLY" | "QUEUE_FOR_APPROVAL" | "SAVE_AS_INSIGHT" | "MONITOR" | "BLOCK";
const autonomousActionStatus = (value: AutonomousActionStatus) =>
  value.toUpperCase() as "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED" | "BLOCKED" | "SIMULATED";
const draftStatus = (value: DraftStatus) =>
  value.toUpperCase() as "DRAFT" | "APPROVED" | "REJECTED" | "COPIED" | "POSTED_MANUALLY";
const guardrailAction = (value: GuardrailAction) =>
  value.toUpperCase() as
    | "WARN"
    | "REQUIRE_EDIT"
    | "BLOCK_RESPONSE"
    | "RECOMMEND_HELPFUL_ONLY"
    | "RECOMMEND_SAVE_AS_INSIGHT"
    | "REQUIRE_DISCLOSURE"
    | "REMOVE_LINK"
    | "LOWER_PRODUCT_MENTION_LEVEL";

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("The destructive demo seed is disabled in production.");
  }
  if (process.env.ALLOW_DESTRUCTIVE_SEED !== "true") {
    throw new Error(
      "The demo seed deletes existing application data. Run it only against a disposable development database with ALLOW_DESTRUCTIVE_SEED=true."
    );
  }

  await prisma.activityLog.deleteMany();
  await prisma.engagementOutcome.deleteMany();
  await prisma.guardrailCheck.deleteMany();
  await prisma.responseDraft.deleteMany();
  await prisma.autonomousActionLog.deleteMany();
  await prisma.finalDecision.deleteMany();
  await prisma.candidateScore.deleteMany();
  await prisma.deliberationAgentResult.deleteMany();
  await prisma.deliberationRun.deleteMany();
  await prisma.marketInsight.deleteMany();
  await prisma.conversationCandidate.deleteMany();
  await prisma.discoveredItem.deleteMany();
  await prisma.discoveryRun.deleteMany();
  await prisma.opportunityScore.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.signalSource.deleteMany();
  await prisma.autonomyPolicy.deleteMany();
  await prisma.knowledgeEmbedding.deleteMany();
  await prisma.communityRule.deleteMany();
  await prisma.marketKnowledgeItem.deleteMany();
  await prisma.productKnowledgeItem.deleteMany();
  await prisma.uploadedDocument.deleteMany();
  await prisma.project.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  const organization = await prisma.organization.create({
    data: {
      id: "org-reydaros-internal",
      name: "ReydarOS Internal"
    }
  });

  const user = await prisma.user.create({
    data: {
      id: "user-demo",
      name: "ReydarOS Operator",
      email: "operator@reydaros.local",
      role: "ADMIN",
      organizationId: organization.id
    }
  });

  for (const project of initialState.projects) {
    await prisma.project.create({
      data: {
        id: project.id,
        organizationId: organization.id,
        name: project.name,
        productType: project.productType,
        productDescription: project.productDescription,
        primaryObjective: project.primaryObjective,
        engagementGoal: project.engagementGoal,
        brandAccountName: project.brandAccountName,
        websiteUrl: project.websiteUrl,
        targetAudience: project.targetAudience,
        defaultTone: project.defaultTone,
        productMentionPolicy: project.productMentionPolicy,
        riskTolerance: risk(project.riskTolerance),
        status: project.status.toUpperCase() as "ACTIVE" | "PAUSED" | "ARCHIVED",
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(project.updatedAt)
      }
    });
  }

  for (const item of initialState.productKnowledge) {
    await prisma.productKnowledgeItem.create({
      data: {
        id: item.id,
        projectId: item.projectId,
        category: item.category,
        title: item.title,
        content: item.content,
        source: item.source,
        status: knowledgeStatus(item.status),
        health: knowledgeHealth(item.health),
        approved: item.approved,
        restricted: item.restricted ?? false,
        confidence: item.confidence,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt)
      }
    });
  }

  for (const item of initialState.marketKnowledge) {
    await prisma.marketKnowledgeItem.create({
      data: {
        id: item.id,
        projectId: item.projectId,
        category: item.category,
        title: item.title,
        content: item.content,
        source: item.source,
        status: knowledgeStatus(item.status),
        health: knowledgeHealth(item.health),
        approved: item.approved,
        confidence: item.confidence,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt)
      }
    });
  }

  for (const rule of initialState.communityRules) {
    await prisma.communityRule.create({
      data: {
        id: rule.id,
        projectId: rule.projectId,
        communityName: rule.communityName,
        platform: rule.platform,
        topic: rule.topic,
        allowedContentTypes: rule.allowedContentTypes,
        selfPromotionPolicy: rule.selfPromotionPolicy,
        linkPolicy: rule.linkPolicy,
        vendorParticipationRules: rule.vendorParticipationRules,
        disclosureExpectations: rule.disclosureExpectations,
        tonePreference: rule.tonePreference,
        riskLevel: risk(rule.riskLevel),
        moderatorSensitivity: rule.moderatorSensitivity,
        productMentionTolerance: rule.productMentionTolerance,
        previousSuccessfulComments: rule.previousSuccessfulComments,
        previousRemovals: rule.previousRemovals,
        previousNegativeReactions: rule.previousNegativeReactions,
        recommendedReplyStyle: rule.recommendedReplyStyle,
        minimumAccountAgeOrKarma: rule.minimumAccountAgeOrKarma,
        engagementFrequencyHistory: rule.engagementFrequencyHistory,
        createdAt: new Date(rule.createdAt),
        updatedAt: new Date(rule.updatedAt)
      }
    });
  }

  for (const source of initialState.signalSources) {
    await prisma.signalSource.create({
      data: {
        id: source.id,
        projectId: source.projectId,
        platform: source.platform,
        sourceType: sourceType(source.sourceType),
        communityName: source.communityName,
        sourceUrl: source.sourceUrl,
        keywords: source.keywords,
        competitorTerms: source.competitorTerms,
        painPointTerms: source.painPointTerms,
        excludedTerms: source.excludedTerms,
        scanFrequency: source.scanFrequency,
        riskTolerance: risk(source.riskTolerance),
        isActive: source.isActive,
        lastScannedAt: source.lastScannedAt ? new Date(source.lastScannedAt) : undefined,
        createdAt: new Date(source.createdAt),
        updatedAt: new Date(source.updatedAt)
      }
    });
  }

  for (const run of initialState.discoveryRuns) {
    if (run.signalSourceId === "manual-intake") continue;
    await prisma.discoveryRun.create({
      data: {
        id: run.id,
        projectId: run.projectId,
        signalSourceId: run.signalSourceId,
        status: discoveryRunStatus(run.status),
        startedAt: new Date(run.startedAt),
        completedAt: run.completedAt ? new Date(run.completedAt) : undefined,
        itemsFound: run.itemsFound,
        candidatesCreated: run.candidatesCreated,
        errors: run.errors,
        createdAt: new Date(run.createdAt),
        updatedAt: new Date(run.updatedAt)
      }
    });
  }

  for (const item of initialState.discoveredItems) {
    await prisma.discoveredItem.create({
      data: {
        id: item.id,
        projectId: item.projectId,
        discoveryRunId: item.discoveryRunId,
        platform: item.platform,
        community: item.community,
        sourceType: sourceType(item.sourceType),
        externalId: item.externalId,
        parentExternalId: item.parentExternalId,
        authorHandle: item.authorHandle,
        title: item.title,
        body: item.body,
        url: item.url,
        score: item.score,
        replyCount: item.replyCount,
        publishedAt: new Date(item.publishedAt),
        rawJson: json(item.rawJson),
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt)
      }
    });
  }

  for (const opportunity of initialState.opportunities) {
    await prisma.opportunity.create({
      data: {
        id: opportunity.id,
        projectId: opportunity.projectId,
        platform: opportunity.platform,
        community: opportunity.community,
        threadTitle: opportunity.threadTitle,
        threadUrl: opportunity.threadUrl,
        sourceText: opportunity.sourceText,
        conversationSummary: opportunity.conversationSummary,
        userProblem: opportunity.userProblem,
        painPoint: opportunity.painPoint,
        audienceMatch: opportunity.audienceMatch,
        productFitExplanation: opportunity.productFitExplanation,
        intentLevel: opportunity.intentLevel.toUpperCase() as "LOW" | "MEDIUM" | "HIGH",
        riskLevel: risk(opportunity.riskLevel),
        recommendedAction: action(opportunity.recommendedAction),
        responseType: responseType(opportunity.responseType),
        productMentionLevel: productMention(opportunity.productMentionLevel),
        reasoning: opportunity.reasoning,
        status: opportunityStatus(opportunity.status),
        createdAt: new Date(opportunity.createdAt),
        updatedAt: new Date(opportunity.updatedAt),
        scores: {
          create: opportunity.scores
        }
      }
    });
  }

  for (const candidate of initialState.conversationCandidates) {
    await prisma.conversationCandidate.create({
      data: {
        id: candidate.id,
        projectId: candidate.projectId,
        opportunityId: candidate.opportunityId,
        discoveredItemId: candidate.discoveredItemId,
        platform: candidate.platform,
        community: candidate.community,
        sourceType: sourceType(candidate.sourceType),
        externalId: candidate.externalId,
        parentExternalId: candidate.parentExternalId,
        authorHandle: candidate.authorHandle,
        title: candidate.title,
        body: candidate.body,
        url: candidate.url,
        candidateType: candidateType(candidate.candidateType),
        detectedIntent: candidate.detectedIntent,
        detectedPainPoint: candidate.detectedPainPoint,
        competitorMentioned: candidate.competitorMentioned,
        productCategoryMentioned: candidate.productCategoryMentioned,
        candidateSummary: candidate.candidateSummary,
        initialRelevanceScore: candidate.initialRelevanceScore,
        initialIntentScore: candidate.initialIntentScore,
        initialRiskScore: candidate.initialRiskScore,
        status: candidateStatus(candidate.status),
        whyWorthAnalyzing: candidate.whyWorthAnalyzing,
        recommendedNextStep: candidate.recommendedNextStep,
        createdAt: new Date(candidate.createdAt),
        updatedAt: new Date(candidate.updatedAt)
      }
    });
  }

  const linkedOpportunityIds = new Set<string>();
  for (const candidate of initialState.conversationCandidates) {
    if (!candidate.opportunityId || linkedOpportunityIds.has(candidate.opportunityId)) continue;
    linkedOpportunityIds.add(candidate.opportunityId);
    await prisma.opportunity.update({
      where: { id: candidate.opportunityId },
      data: { candidateId: candidate.id }
    });
  }

  const opportunityRevisions = new Map<string, number>();
  for (const run of initialState.deliberationRuns) {
    const opportunityId = initialState.conversationCandidates.find(
      (candidate) => candidate.id === run.candidateId
    )?.opportunityId;
    if (!opportunityId) continue;
    const revision = (opportunityRevisions.get(opportunityId) ?? 0) + 1;
    opportunityRevisions.set(opportunityId, revision);
    await prisma.deliberationRun.create({
      data: {
        id: run.id,
        projectId: run.projectId,
        opportunityId,
        candidateId: run.candidateId,
        revision,
        requestId: `seed-${run.id}`,
        status: deliberationStatus(run.status),
        finalDecision: finalDecisionAction(run.finalDecision),
        finalConfidence: run.finalConfidence,
        autonomyStatus: autonomyStatus(run.autonomyStatus),
        startedAt: new Date(run.createdAt),
        completedAt:
          run.status === "completed" || run.status === "failed" || run.status === "blocked"
            ? new Date(run.updatedAt)
            : undefined,
        errors: [],
        createdAt: new Date(run.createdAt),
        updatedAt: new Date(run.updatedAt)
      }
    });
  }

  for (const agent of initialState.deliberationAgentResults) {
    await prisma.deliberationAgentResult.create({
      data: {
        id: agent.id,
        deliberationRunId: agent.deliberationRunId,
        agentName: agent.agentName,
        recommendation: agent.recommendation,
        score: agent.score,
        argumentFor: agent.argumentFor,
        argumentAgainst: agent.argumentAgainst,
        riskFlags: agent.riskFlags,
        reasoning: agent.reasoning,
        createdAt: new Date(agent.createdAt)
      }
    });
  }

  for (const score of initialState.candidateScores) {
    await prisma.candidateScore.create({
      data: {
        id: score.id,
        projectId: score.projectId,
        candidateId: score.candidateId,
        deliberationRunId: score.deliberationRunId,
        relevanceScore: score.relevanceScore,
        intentScore: score.intentScore,
        productFitScore: score.productFitScore,
        engagementValueScore: score.engagementValueScore,
        promotionRiskScore: score.promotionRiskScore,
        communityRiskScore: score.communityRiskScore,
        accountSafetyScore: score.accountSafetyScore,
        responseConfidenceScore: score.responseConfidenceScore,
        skepticObjectionStrength: score.skepticObjectionStrength,
        marketInsightValueScore: score.marketInsightValueScore,
        createdAt: new Date(score.createdAt)
      }
    });
  }

  for (const decision of initialState.finalDecisions) {
    await prisma.finalDecision.create({
      data: {
        id: decision.id,
        projectId: initialState.conversationCandidates.find((candidate) => candidate.id === decision.candidateId)?.projectId ?? initialState.activeProjectId,
        deliberationRunId: decision.deliberationRunId,
        candidateId: decision.candidateId,
        selectedAction: finalDecisionAction(decision.selectedAction),
        selectedResponseType: responseType(decision.selectedResponseType),
        productMentionLevel: productMention(decision.productMentionLevel),
        requiresDisclosure: decision.requiresDisclosure,
        autoEngageAllowed: decision.autoEngageAllowed,
        humanApprovalRequired: decision.humanApprovalRequired,
        finalReasoning: decision.finalReasoning,
        approvedDraft: decision.approvedDraft,
        blockedReason: decision.blockedReason,
        policyResult: decision.policyResult,
        createdAt: new Date(decision.createdAt)
      }
    });
  }

  for (const draft of initialState.responseDrafts) {
    await prisma.responseDraft.create({
      data: {
        id: draft.id,
        opportunityId: draft.opportunityId,
        candidateId: draft.candidateId,
        deliberationRunId: draft.deliberationRunId,
        finalDecisionId: draft.finalDecisionId,
        responseText: draft.responseText,
        responseType: responseType(draft.responseType),
        productMentionLevel: productMention(draft.productMentionLevel),
        disclosureIncluded: draft.disclosureIncluded,
        riskLevel: risk(draft.riskLevel),
        reasoning: draft.reasoning,
        status: draftStatus(draft.status),
        editedByUser: draft.editedByUser,
        createdAt: new Date(draft.createdAt),
        updatedAt: new Date(draft.updatedAt)
      }
    });
  }

  for (const check of initialState.guardrailChecks) {
    await prisma.guardrailCheck.create({
      data: {
        id: check.id,
        opportunityId: check.opportunityId,
        responseDraftId: check.responseDraftId,
        checkType: check.checkType,
        description: check.description,
        severity: risk(check.severity),
        action: guardrailAction(check.action),
        passed: check.passed,
        createdAt: new Date(check.createdAt)
      }
    });
  }

  for (const insight of initialState.marketInsights) {
    await prisma.marketInsight.create({
      data: {
        id: insight.id,
        projectId: insight.projectId,
        opportunityId: insight.opportunityId,
        candidateId: insight.candidateId,
        deliberationRunId: insight.deliberationRunId,
        category: insight.category,
        title: insight.title,
        insight: insight.insight,
        source: insight.source,
        confidence: insight.confidence,
        approved: insight.approved,
        createdAt: new Date(insight.createdAt),
        updatedAt: new Date(insight.updatedAt)
      }
    });
  }

  for (const policy of initialState.autonomyPolicies) {
    await prisma.autonomyPolicy.create({
      data: {
        id: policy.id,
        projectId: policy.projectId,
        communityRuleId: policy.communityRuleId,
        name: policy.name,
        allowAutoEngage: policy.allowAutoEngage,
        maxCommentsPerDay: policy.maxCommentsPerDay,
        maxCommentsPerCommunityPerDay: policy.maxCommentsPerCommunityPerDay,
        maxProductMentionsPerWeek: policy.maxProductMentionsPerWeek,
        allowedProductMentionLevels: policy.allowedProductMentionLevels.map(productMention),
        allowLinks: policy.allowLinks,
        requireDisclosure: policy.requireDisclosure,
        minRelevanceScore: policy.minRelevanceScore,
        minIntentScore: policy.minIntentScore,
        minProductFitScore: policy.minProductFitScore,
        minEngagementValueScore: policy.minEngagementValueScore,
        maxPromotionRiskScore: policy.maxPromotionRiskScore,
        maxCommunityRiskScore: policy.maxCommunityRiskScore,
        minAccountSafetyScore: policy.minAccountSafetyScore,
        maxSkepticObjectionStrength: policy.maxSkepticObjectionStrength,
        allowedCandidateTypes: policy.allowedCandidateTypes.map(candidateType),
        blockedCandidateTypes: policy.blockedCandidateTypes.map(candidateType),
        isActive: policy.isActive,
        createdAt: new Date(policy.createdAt),
        updatedAt: new Date(policy.updatedAt)
      }
    });
  }

  for (const log of initialState.autonomousActionLogs) {
    await prisma.autonomousActionLog.create({
      data: {
        id: log.id,
        projectId: log.projectId,
        candidateId: log.candidateId,
        deliberationRunId: log.deliberationRunId,
        finalDecisionId: log.finalDecisionId,
        actionType: autonomousActionType(log.actionType),
        actionStatus: autonomousActionStatus(log.actionStatus),
        platform: log.platform,
        community: log.community,
        responseText: log.responseText,
        policySnapshot: json(log.policySnapshot),
        reason: log.reason,
        postedUrl: log.postedUrl,
        errorMessage: log.errorMessage,
        createdAt: new Date(log.createdAt),
        updatedAt: new Date(log.updatedAt)
      }
    });
  }

  for (const outcome of initialState.engagementOutcomes) {
    await prisma.engagementOutcome.create({
      data: {
        id: outcome.id,
        opportunityId: outcome.opportunityId,
        responseDraftId: outcome.responseDraftId,
        outcomeType: outcome.outcomeType.toUpperCase() as
          | "POSTED_MANUALLY"
          | "REJECTED"
          | "SAVED_AS_INSIGHT"
          | "MONITORING"
          | "POSITIVE_REPLY"
          | "NEGATIVE_REPLY"
          | "REMOVED"
          | "REMOVED_COMMENT"
          | "MODERATOR_WARNING"
          | "MANUAL_REJECTION"
          | "USER_APPROVED_EDIT"
          | "AUTO_ENGAGEMENT_SUCCESS"
          | "AUTO_ENGAGEMENT_BLOCKED"
          | "AUTO_ENGAGEMENT_FAILURE",
        notes: outcome.notes,
        postedUrl: outcome.postedUrl,
        sentiment: outcome.sentiment,
        createdAt: new Date(outcome.createdAt)
      }
    });
  }

  for (const log of initialState.activityLogs) {
    await prisma.activityLog.create({
      data: {
        id: log.id,
        organizationId: organization.id,
        projectId: log.projectId,
        userId: user.id,
        entityType: log.entityType,
        entityId: log.entityId,
        action: log.action,
        message: log.message,
        createdAt: new Date(log.createdAt)
      }
    });
  }

  console.log("Seeded ReydarOS demo workspace.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
