import "server-only";

import type {
  AutonomyStatus as PrismaAutonomyStatus,
  CandidateStatus as PrismaCandidateStatus,
  DeliberationRun as PrismaDeliberationRun,
  DeliberationStatus as PrismaDeliberationStatus,
  FinalDecisionAction as PrismaFinalDecisionAction,
  IntentLevel as PrismaIntentLevel,
  OpportunityStatus as PrismaOpportunityStatus,
  ProductMentionLevel as PrismaProductMentionLevel,
  RecommendedAction as PrismaRecommendedAction,
  ResponseType as PrismaResponseType,
  RiskLevel as PrismaRiskLevel,
  SourceType as PrismaSourceType
} from "@prisma/client";
import { Prisma } from "@prisma/client";
import {
  DeliberationConflictError,
  DeliberationNotFoundError
} from "@/lib/deliberation/api-response";
import {
  DELIBERATION_AGENT_ROLES,
  type DeliberationAgentRole,
  type DeliberationRunDetail,
  type DeliberationStartResult,
  type OpportunityDetail,
  type OpportunitySummary,
  type StartDeliberationInput
} from "@/lib/deliberation/contracts";
import { runCandidateDeliberation } from "@/lib/deliberation/deliberation-service";
import { prisma } from "@/lib/prisma";
import {
  WORKSPACE_ORGANIZATION_ID,
  getProject,
  listCommunityRules,
  listKnowledge
} from "@/lib/project-brain/service";
import type {
  AutonomyStatus,
  CandidateStatus,
  ConversationCandidate,
  DeliberationStatus,
  FinalDecisionAction,
  IntentLevel,
  OpportunityStatus,
  ProductMentionLevel,
  RecommendedAction,
  ResponseType,
  RiskLevel,
  SourceType
} from "@/lib/types";

const runHistoryInclude = {
  agentResults: { orderBy: { createdAt: "asc" as const } },
  candidateScores: true,
  finalDecisions: true
} satisfies Prisma.DeliberationRunInclude;

const opportunityDetailArgs =
  Prisma.validator<Prisma.OpportunityDefaultArgs>()({
    include: {
      candidate: {
        include: {
          discoveredItem: {
            select: {
              id: true,
              discoveryRunId: true,
              url: true
            }
          }
        }
      },
      deliberationRuns: {
        include: runHistoryInclude,
        orderBy: { revision: "desc" }
      }
    }
  });

type OpportunityRecord = Prisma.OpportunityGetPayload<typeof opportunityDetailArgs>;
type RunRecord = OpportunityRecord["deliberationRuns"][number];
type CandidateRecord = NonNullable<OpportunityRecord["candidate"]>;
type RunMode = "start" | "rerun";

const toRisk = (value: PrismaRiskLevel) => value.toLowerCase() as RiskLevel;
const toSourceType = (value: PrismaSourceType) => value.toLowerCase() as SourceType;
const toCandidateStatus = (value: PrismaCandidateStatus) =>
  value.toLowerCase() as CandidateStatus;
const toRunStatus = (value: PrismaDeliberationStatus) =>
  value.toLowerCase() as DeliberationStatus;
const toDecisionAction = (value: PrismaFinalDecisionAction) =>
  value.toLowerCase() as FinalDecisionAction;
const toAutonomyStatus = (value: PrismaAutonomyStatus) =>
  value.toLowerCase() as AutonomyStatus;
const toIntent = (value: PrismaIntentLevel) => value.toLowerCase() as IntentLevel;
const toOpportunityStatus = (value: PrismaOpportunityStatus) =>
  value.toLowerCase() as OpportunityStatus;
const toRecommendedAction = (value: PrismaRecommendedAction) =>
  value.toLowerCase() as RecommendedAction;
const toResponseType = (value: PrismaResponseType) =>
  value.toLowerCase() as ResponseType;
const toProductMention = (value: PrismaProductMentionLevel) =>
  Number(value.slice("LEVEL_".length)) as ProductMentionLevel;

const fromRunStatus = (value: DeliberationStatus) =>
  value.toUpperCase() as PrismaDeliberationStatus;
const fromDecisionAction = (value: FinalDecisionAction) =>
  value.toUpperCase() as PrismaFinalDecisionAction;
const fromAutonomyStatus = (value: AutonomyStatus) =>
  value.toUpperCase() as PrismaAutonomyStatus;
const fromCandidateStatus = (value: CandidateStatus) =>
  value.toUpperCase() as PrismaCandidateStatus;
const fromIntent = (value: IntentLevel) => value.toUpperCase() as PrismaIntentLevel;
const fromRisk = (value: RiskLevel) => value.toUpperCase() as PrismaRiskLevel;
const fromRecommendedAction = (value: RecommendedAction) =>
  value.toUpperCase() as PrismaRecommendedAction;
const fromResponseType = (value: ResponseType) =>
  value.toUpperCase() as PrismaResponseType;
const fromProductMention = (value: ProductMentionLevel) =>
  `LEVEL_${value}` as PrismaProductMentionLevel;
const fromOpportunityStatus = (value: OpportunityStatus) =>
  value.toUpperCase() as PrismaOpportunityStatus;

function isAgentRole(value: string): value is DeliberationAgentRole {
  return DELIBERATION_AGENT_ROLES.includes(value as DeliberationAgentRole);
}

function mapCandidate(candidate: CandidateRecord): ConversationCandidate {
  return {
    id: candidate.id,
    projectId: candidate.projectId,
    ...(candidate.opportunityId ? { opportunityId: candidate.opportunityId } : {}),
    ...(candidate.discoveredItemId ? { discoveredItemId: candidate.discoveredItemId } : {}),
    platform: candidate.platform,
    community: candidate.community,
    sourceType: toSourceType(candidate.sourceType),
    externalId: candidate.externalId,
    ...(candidate.parentExternalId ? { parentExternalId: candidate.parentExternalId } : {}),
    authorHandle: candidate.authorHandle,
    title: candidate.title,
    body: candidate.body,
    url: candidate.url,
    candidateType: candidate.candidateType.toLowerCase() as ConversationCandidate["candidateType"],
    detectedIntent: candidate.detectedIntent,
    detectedPainPoint: candidate.detectedPainPoint,
    ...(candidate.competitorMentioned
      ? { competitorMentioned: candidate.competitorMentioned }
      : {}),
    ...(candidate.productCategoryMentioned
      ? { productCategoryMentioned: candidate.productCategoryMentioned }
      : {}),
    candidateSummary: candidate.candidateSummary,
    initialRelevanceScore: candidate.initialRelevanceScore,
    initialIntentScore: candidate.initialIntentScore,
    initialRiskScore: candidate.initialRiskScore,
    status: toCandidateStatus(candidate.status),
    whyWorthAnalyzing: candidate.whyWorthAnalyzing,
    recommendedNextStep: candidate.recommendedNextStep,
    createdAt: candidate.createdAt.toISOString(),
    updatedAt: candidate.updatedAt.toISOString()
  };
}

function mapRun(run: RunRecord): DeliberationRunDetail {
  const score = run.candidateScores[0];
  const decision = run.finalDecisions[0];

  return {
    run: {
      id: run.id,
      projectId: run.projectId,
      opportunityId: run.opportunityId,
      candidateId: run.candidateId,
      revision: run.revision,
      requestId: run.requestId,
      status: toRunStatus(run.status),
      finalDecision: toDecisionAction(run.finalDecision),
      finalConfidence: run.finalConfidence,
      autonomyStatus: toAutonomyStatus(run.autonomyStatus),
      startedAt: run.startedAt.toISOString(),
      ...(run.completedAt ? { completedAt: run.completedAt.toISOString() } : {}),
      errors: run.errors,
      createdAt: run.createdAt.toISOString(),
      updatedAt: run.updatedAt.toISOString()
    },
    agentResults: run.agentResults
      .filter((agent) => isAgentRole(agent.agentName))
      .sort(
        (left, right) =>
          DELIBERATION_AGENT_ROLES.indexOf(left.agentName as DeliberationAgentRole) -
          DELIBERATION_AGENT_ROLES.indexOf(right.agentName as DeliberationAgentRole)
      )
      .map((agent) => ({
        id: agent.id,
        deliberationRunId: agent.deliberationRunId,
        agentName: agent.agentName as DeliberationAgentRole,
        recommendation: agent.recommendation,
        score: agent.score,
        argumentFor: agent.argumentFor,
        argumentAgainst: agent.argumentAgainst,
        riskFlags: agent.riskFlags,
        reasoning: agent.reasoning,
        createdAt: agent.createdAt.toISOString()
      })),
    ...(score
      ? {
          score: {
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
            createdAt: score.createdAt.toISOString()
          }
        }
      : {}),
    ...(decision
      ? {
          decision: {
            id: decision.id,
            projectId: decision.projectId,
            deliberationRunId: decision.deliberationRunId,
            candidateId: decision.candidateId,
            selectedAction: toDecisionAction(decision.selectedAction),
            selectedResponseType: toResponseType(decision.selectedResponseType),
            productMentionLevel: toProductMention(decision.productMentionLevel),
            requiresDisclosure: decision.requiresDisclosure,
            autoEngageAllowed: decision.autoEngageAllowed,
            humanApprovalRequired: decision.humanApprovalRequired,
            finalReasoning: decision.finalReasoning,
            approvedDraft: decision.approvedDraft,
            ...(decision.blockedReason ? { blockedReason: decision.blockedReason } : {}),
            policyResult: decision.policyResult,
            createdAt: decision.createdAt.toISOString()
          }
        }
      : {})
  };
}

function currentRun(runs: RunRecord[]) {
  return (
    runs.find((run) => run.status === "COMPLETED" || run.status === "BLOCKED") ?? runs[0]
  );
}

function mapOpportunity(record: OpportunityRecord): OpportunityDetail {
  if (!record.candidate || !record.candidateId) {
    throw new DeliberationNotFoundError(
      "This opportunity is not linked to a persisted discovery candidate."
    );
  }

  const candidate = mapCandidate(record.candidate);
  const runs = record.deliberationRuns.map(mapRun);
  const selectedRun = currentRun(record.deliberationRuns);
  const selectedRunDetail = selectedRun
    ? runs.find((run) => run.run.id === selectedRun.id)
    : undefined;
  const score = selectedRunDetail?.score;

  return {
    opportunity: {
      id: record.id,
      projectId: record.projectId,
      candidateId: record.candidateId,
      platform: record.platform,
      community: record.community,
      threadTitle: record.threadTitle,
      threadUrl: record.threadUrl ?? "",
      sourceText: record.sourceText,
      conversationSummary: record.conversationSummary,
      userProblem: record.userProblem,
      painPoint: record.painPoint,
      audienceMatch: record.audienceMatch,
      productFitExplanation: record.productFitExplanation,
      intentLevel: toIntent(record.intentLevel),
      riskLevel: toRisk(record.riskLevel),
      recommendedAction: toRecommendedAction(record.recommendedAction),
      responseType: toResponseType(record.responseType),
      productMentionLevel: toProductMention(record.productMentionLevel),
      reasoning: record.reasoning,
      status: toOpportunityStatus(record.status),
      ...(score
        ? {
            scores: {
              relevanceScore: score.relevanceScore,
              intentScore: score.intentScore,
              productFitScore: score.productFitScore,
              engagementValueScore: score.engagementValueScore,
              promotionRiskScore: score.promotionRiskScore,
              communityRiskScore: score.communityRiskScore,
              accountSafetyScore: score.accountSafetyScore,
              responseConfidenceScore: score.responseConfidenceScore
            }
          }
        : {}),
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString()
    },
    candidate,
    ...(selectedRunDetail ? { latestRun: selectedRunDetail } : {}),
    sourceTrail: {
      ...(record.candidate.discoveredItem?.discoveryRunId
        ? { discoveryRunId: record.candidate.discoveredItem.discoveryRunId }
        : {}),
      ...(record.candidate.discoveredItemId
        ? { discoveredItemId: record.candidate.discoveredItemId }
        : {}),
      sourceUrl: record.candidate.discoveredItem?.url || record.candidate.url
    },
    runs
  };
}

async function requireOwnedOpportunity(projectId: string, opportunityId: string) {
  const opportunity = await prisma.opportunity.findFirst({
    where: {
      id: opportunityId,
      projectId,
      project: { organizationId: WORKSPACE_ORGANIZATION_ID },
      candidateId: { not: null }
    },
    ...opportunityDetailArgs
  });

  if (!opportunity) {
    throw new DeliberationNotFoundError(
      "The requested opportunity was not found in this project workspace."
    );
  }

  return opportunity;
}

export async function listOpportunities(projectId: string): Promise<OpportunitySummary[]> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: WORKSPACE_ORGANIZATION_ID },
    select: { id: true }
  });
  if (!project) {
    throw new DeliberationNotFoundError(
      "The requested project was not found in this workspace."
    );
  }

  const opportunities = await prisma.opportunity.findMany({
    where: { projectId, candidateId: { not: null } },
    orderBy: { updatedAt: "desc" },
    ...opportunityDetailArgs
  });

  return opportunities.map((opportunity) => {
    const { sourceTrail: _sourceTrail, runs: _runs, ...summary } =
      mapOpportunity(opportunity);
    return summary;
  });
}

export async function getOpportunityDetail(
  projectId: string,
  opportunityId: string
): Promise<OpportunityDetail> {
  return mapOpportunity(await requireOwnedOpportunity(projectId, opportunityId));
}

export async function listOpportunityRuns(
  projectId: string,
  opportunityId: string
): Promise<DeliberationRunDetail[]> {
  return (await getOpportunityDetail(projectId, opportunityId)).runs;
}

function initialIntent(score: number): IntentLevel {
  if (score >= 75) return "high";
  if (score >= 55) return "medium";
  return "low";
}

function initialRisk(score: number): RiskLevel {
  if (score >= 75) return "high";
  if (score >= 42) return "medium";
  return "low";
}

function opportunityCreateData(candidate: Prisma.ConversationCandidateGetPayload<object>) {
  return {
    projectId: candidate.projectId,
    candidateId: candidate.id,
    platform: candidate.platform,
    community: candidate.community,
    threadTitle: candidate.title,
    threadUrl: candidate.url || null,
    sourceText: candidate.body,
    conversationSummary: candidate.candidateSummary,
    userProblem: `The candidate signals ${candidate.detectedPainPoint.toLowerCase()} and ${candidate.detectedIntent.toLowerCase()}.`,
    painPoint: candidate.detectedPainPoint,
    audienceMatch:
      "Audience fit is grounded in the owning project and persisted discovery configuration.",
    productFitExplanation:
      "Product fit is pending the deterministic eight-agent deliberation.",
    intentLevel: fromIntent(initialIntent(candidate.initialIntentScore)),
    riskLevel: fromRisk(initialRisk(candidate.initialRiskScore)),
    recommendedAction: fromRecommendedAction("helpful_answer_only"),
    responseType: fromResponseType("helpful_only"),
    productMentionLevel: fromProductMention(0),
    reasoning: "Deliberation has not completed yet.",
    status: fromOpportunityStatus("new")
  };
}

async function reserveRun({
  projectId,
  candidateId,
  opportunityId,
  input,
  mode
}: {
  projectId: string;
  candidateId: string;
  opportunityId?: string;
  input: StartDeliberationInput;
  mode: RunMode;
}) {
  const candidate = await prisma.conversationCandidate.findFirst({
    where: {
      id: candidateId,
      projectId,
      project: { organizationId: WORKSPACE_ORGANIZATION_ID }
    }
  });
  if (!candidate) {
    throw new DeliberationNotFoundError(
      "The requested candidate was not found in this project workspace."
    );
  }

  const duplicateRequest = await prisma.deliberationRun.findUnique({
    where: { requestId: input.requestId }
  });
  if (duplicateRequest) {
    if (
      duplicateRequest.projectId !== projectId ||
      duplicateRequest.candidateId !== candidateId
    ) {
      throw new DeliberationConflictError(
        "This request ID already belongs to another deliberation."
      );
    }
    return {
      opportunityId: duplicateRequest.opportunityId,
      runId: duplicateRequest.id,
      reused: true
    };
  }

  const opportunity = await prisma.opportunity.upsert({
    where: { candidateId: candidate.id },
    create: opportunityCreateData(candidate),
    update: {}
  });

  if (opportunityId && opportunity.id !== opportunityId) {
    throw new DeliberationNotFoundError(
      "The requested opportunity is not linked to this candidate."
    );
  }
  if (candidate.opportunityId && candidate.opportunityId !== opportunity.id) {
    throw new DeliberationConflictError(
      "The candidate is already linked to another opportunity."
    );
  }

  const [existingRun, activeRun] = await Promise.all([
    prisma.deliberationRun.findFirst({
      where: { opportunityId: opportunity.id },
      orderBy: { revision: "desc" }
    }),
    prisma.deliberationRun.findFirst({
      where: {
        opportunityId: opportunity.id,
        status: { in: ["PENDING", "RUNNING"] }
      }
    })
  ]);
  if (activeRun) {
    throw new DeliberationConflictError(
      "A deliberation is already running for this opportunity."
    );
  }
  if (mode === "start" && existingRun) {
    if (candidate.opportunityId !== opportunity.id) {
      await prisma.conversationCandidate.update({
        where: { id: candidate.id },
        data: { opportunityId: opportunity.id }
      });
    }
    return {
      opportunityId: opportunity.id,
      runId: existingRun.id,
      reused: true
    };
  }

  const revision = (existingRun?.revision ?? 0) + 1;
  const [run] = await prisma.$transaction([
    prisma.deliberationRun.create({
      data: {
        projectId,
        opportunityId: opportunity.id,
        candidateId: candidate.id,
        revision,
        requestId: input.requestId,
        status: "PENDING",
        errors: []
      }
    }),
    prisma.conversationCandidate.update({
      where: { id: candidate.id },
      data: { opportunityId: opportunity.id, status: "DELIBERATING" }
    })
  ]);

  return {
    opportunityId: opportunity.id,
    runId: run.id,
    reused: false
  };
}

function riskFromScores(score: {
  promotionRiskScore: number;
  communityRiskScore: number;
}): RiskLevel {
  if (score.promotionRiskScore >= 75 || score.communityRiskScore >= 75) return "high";
  if (score.promotionRiskScore >= 42 || score.communityRiskScore >= 42) return "medium";
  return "low";
}

function recommendedActionFromDecision(
  decision: ReturnType<typeof runCandidateDeliberation>["finalDecision"]
): RecommendedAction {
  if (decision.selectedAction === "clarifying_question") return "clarifying_question";
  if (decision.selectedAction === "soft_product_mention") {
    return "helpful_with_soft_disclosure";
  }
  if (decision.selectedAction === "product_recommendation_with_disclosure") {
    return "product_recommendation_with_disclosure";
  }
  if (decision.selectedAction === "save_as_market_insight") return "save_as_market_insight";
  if (decision.selectedAction === "monitor_only") return "monitor_for_follow_up";
  if (decision.selectedAction === "do_not_engage") return "do_not_reply";
  return "helpful_answer_only";
}

function opportunityStatusFromResult(
  result: ReturnType<typeof runCandidateDeliberation>
): OpportunityStatus {
  if (
    result.run.status === "blocked" ||
    result.finalDecision.selectedAction === "do_not_engage"
  ) {
    return "do_not_reply";
  }
  if (result.finalDecision.selectedAction === "save_as_market_insight") {
    return "saved_as_insight";
  }
  if (result.run.autonomyStatus === "monitor_only") return "analyzed";
  return "awaiting_review";
}

function candidateStatusFromResult(
  result: ReturnType<typeof runCandidateDeliberation>
): CandidateStatus {
  if (result.run.status === "blocked" || result.run.autonomyStatus === "blocked") {
    return "blocked";
  }
  if (result.run.autonomyStatus === "safe_to_auto_engage") return "safe_to_auto_engage";
  if (result.run.autonomyStatus === "monitor_only") return "monitor_only";
  if (result.run.autonomyStatus === "save_as_insight_only") return "saved_as_insight";
  return "queued_for_approval";
}

function sanitizedFailure(error: unknown) {
  console.error("Deterministic deliberation failed", error);
  return "Deterministic deliberation failed before completion. Retry this opportunity safely.";
}

async function executeReservedRun({
  projectId,
  opportunityId,
  runId,
  reused
}: {
  projectId: string;
  opportunityId: string;
  runId: string;
  reused: boolean;
}): Promise<DeliberationStartResult> {
  if (reused) {
    return {
      opportunity: await getOpportunityDetail(projectId, opportunityId),
      reused: true
    };
  }

  const running = await prisma.deliberationRun.update({
    where: { id: runId },
    data: { status: "RUNNING", startedAt: new Date(), errors: [] }
  });

  try {
    const candidateRecord = await prisma.conversationCandidate.findFirst({
      where: {
        id: running.candidateId,
        projectId,
        project: { organizationId: WORKSPACE_ORGANIZATION_ID }
      }
    });
    if (!candidateRecord) {
      throw new DeliberationNotFoundError(
        "The candidate was removed before deliberation could start."
      );
    }

    const [project, productKnowledge, marketKnowledge, communityRules] =
      await Promise.all([
        getProject(projectId),
        listKnowledge("product", projectId),
        listKnowledge("market", projectId),
        listCommunityRules(projectId)
      ]);
    const candidate = mapCandidate({
      ...candidateRecord,
      discoveredItem: null
    } as CandidateRecord);
    const result = runCandidateDeliberation({
      candidate,
      project,
      productKnowledge,
      marketKnowledge,
      communityRules,
      autonomyPolicies: [],
      runId,
      startedAt: running.startedAt.toISOString()
    });
    const status: DeliberationStatus =
      result.run.autonomyStatus === "blocked" ? "blocked" : "completed";
    const completedAt = new Date();
    const opportunityStatus = opportunityStatusFromResult({
      ...result,
      run: { ...result.run, status }
    });

    await prisma.$transaction([
      prisma.deliberationAgentResult.createMany({
        data: result.agentResults.map((agent) => ({
          deliberationRunId: runId,
          agentName: agent.agentName,
          recommendation: agent.recommendation,
          score: agent.score,
          argumentFor: agent.argumentFor,
          argumentAgainst: agent.argumentAgainst,
          riskFlags: agent.riskFlags,
          reasoning: agent.reasoning,
          createdAt: new Date(agent.createdAt)
        }))
      }),
      prisma.candidateScore.create({
        data: {
          projectId,
          candidateId: candidate.id,
          deliberationRunId: runId,
          relevanceScore: result.score.relevanceScore,
          intentScore: result.score.intentScore,
          productFitScore: result.score.productFitScore,
          engagementValueScore: result.score.engagementValueScore,
          promotionRiskScore: result.score.promotionRiskScore,
          communityRiskScore: result.score.communityRiskScore,
          accountSafetyScore: result.score.accountSafetyScore,
          responseConfidenceScore: result.score.responseConfidenceScore,
          skepticObjectionStrength: result.score.skepticObjectionStrength,
          marketInsightValueScore: result.score.marketInsightValueScore
        }
      }),
      prisma.finalDecision.create({
        data: {
          projectId,
          candidateId: candidate.id,
          deliberationRunId: runId,
          selectedAction: fromDecisionAction(result.finalDecision.selectedAction),
          selectedResponseType: fromResponseType(
            result.finalDecision.selectedResponseType
          ),
          productMentionLevel: fromProductMention(
            result.finalDecision.productMentionLevel
          ),
          requiresDisclosure: result.finalDecision.requiresDisclosure,
          autoEngageAllowed: result.finalDecision.autoEngageAllowed,
          humanApprovalRequired: result.finalDecision.humanApprovalRequired,
          finalReasoning: result.finalDecision.finalReasoning,
          approvedDraft: result.finalDecision.approvedDraft,
          blockedReason: result.finalDecision.blockedReason ?? null,
          policyResult: result.finalDecision.policyResult
        }
      }),
      prisma.deliberationRun.update({
        where: { id: runId },
        data: {
          status: fromRunStatus(status),
          finalDecision: fromDecisionAction(result.finalDecision.selectedAction),
          finalConfidence: result.score.responseConfidenceScore,
          autonomyStatus: fromAutonomyStatus(result.run.autonomyStatus),
          completedAt,
          errors:
            status === "blocked"
              ? [result.finalDecision.blockedReason ?? "Policy blocked engagement."]
              : []
        }
      }),
      prisma.opportunity.update({
        where: { id: opportunityId },
        data: {
          conversationSummary: candidate.candidateSummary,
          userProblem: `The candidate signals ${candidate.detectedPainPoint.toLowerCase()} and ${candidate.detectedIntent.toLowerCase()}.`,
          painPoint: candidate.detectedPainPoint,
          audienceMatch:
            "Audience fit is grounded in project discovery configuration and market knowledge.",
          productFitExplanation:
            result.finalDecision.productMentionLevel === 0
              ? "Product fit exists only at the category or problem level, so helpful-only engagement is safer."
              : "Product fit is plausible, but affiliation must remain disclosed and policy-gated.",
          intentLevel: fromIntent(initialIntent(result.score.intentScore)),
          riskLevel: fromRisk(riskFromScores(result.score)),
          recommendedAction: fromRecommendedAction(
            recommendedActionFromDecision(result.finalDecision)
          ),
          responseType: fromResponseType(result.finalDecision.selectedResponseType),
          productMentionLevel: fromProductMention(
            result.finalDecision.productMentionLevel
          ),
          reasoning: result.finalDecision.finalReasoning,
          status: fromOpportunityStatus(opportunityStatus)
        }
      }),
      prisma.conversationCandidate.update({
        where: { id: candidate.id },
        data: {
          status: fromCandidateStatus(
            candidateStatusFromResult({
              ...result,
              run: { ...result.run, status }
            })
          )
        }
      })
    ]);
  } catch (error) {
    const message = sanitizedFailure(error);
    await prisma.$transaction([
      prisma.deliberationRun.update({
        where: { id: runId },
        data: {
          status: "FAILED",
          completedAt: new Date(),
          errors: [message]
        }
      }),
      prisma.conversationCandidate.updateMany({
        where: { id: running.candidateId, status: "DELIBERATING" },
        data: { status: "MAPPED" }
      })
    ]);
  }

  return {
    opportunity: await getOpportunityDetail(projectId, opportunityId),
    reused: false
  };
}

export async function startCandidate(
  projectId: string,
  candidateId: string,
  input: StartDeliberationInput
) {
  return executeReservedRun({
    projectId,
    ...(await reserveRun({
      projectId,
      candidateId,
      input,
      mode: "start"
    }))
  });
}

export async function rerunOpportunity(
  projectId: string,
  opportunityId: string,
  input: StartDeliberationInput
) {
  const opportunity = await requireOwnedOpportunity(projectId, opportunityId);
  if (!opportunity.candidateId) {
    throw new DeliberationNotFoundError(
      "The opportunity is not linked to a persisted candidate."
    );
  }

  return executeReservedRun({
    projectId,
    ...(await reserveRun({
      projectId,
      candidateId: opportunity.candidateId,
      opportunityId,
      input,
      mode: "rerun"
    }))
  });
}
