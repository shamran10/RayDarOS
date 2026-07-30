import "server-only";

import { createHash } from "node:crypto";
import type {
  CandidateStatus as PrismaCandidateStatus,
  CandidateType as PrismaCandidateType,
  ConversationCandidate as PrismaConversationCandidate,
  DiscoveredItem as PrismaDiscoveredItem,
  DiscoveryRun as PrismaDiscoveryRun,
  DiscoveryRunStatus as PrismaDiscoveryRunStatus,
  Prisma,
  RiskLevel as PrismaRiskLevel,
  SignalSource as PrismaSignalSource,
  SourceType as PrismaSourceType
} from "@prisma/client";
import { mapDiscoveredItemToCandidates } from "@/lib/candidates/candidate-mapping-service";
import {
  DiscoveryConflictError,
  DiscoveryNotFoundError
} from "@/lib/discovery/api-response";
import type {
  DiscoveryOperationResult,
  DiscoverySnapshot,
  DiscoveredItemDto,
  ManualDiscoveryInput,
  SignalSourceCreateInput,
  SignalSourceUpdateInput
} from "@/lib/discovery/contracts";
import { createManualDiscoveredItem } from "@/lib/discovery/providers/manual-provider";
import { mockDiscoveryProvider } from "@/lib/discovery/providers/mock-provider";
import { redditDiscoveryProvider } from "@/lib/discovery/providers/reddit-provider";
import type { DiscoveryProvider } from "@/lib/discovery/providers/types";
import { prisma } from "@/lib/prisma";
import {
  WORKSPACE_ORGANIZATION_ID,
  getProject,
  listCommunityRules,
  listKnowledge
} from "@/lib/project-brain/service";
import type {
  CandidateStatus,
  CandidateType,
  ConversationCandidate,
  DiscoveredItem,
  DiscoveryRun,
  DiscoveryRunStatus,
  Project,
  RiskLevel,
  SignalSource,
  SourceType
} from "@/lib/types";

const fromSourceType = (value: SourceType) => value.toUpperCase() as PrismaSourceType;
const fromRisk = (value: RiskLevel) => value.toUpperCase() as PrismaRiskLevel;
const fromRunStatus = (value: DiscoveryRunStatus) => value.toUpperCase() as PrismaDiscoveryRunStatus;
const fromCandidateType = (value: CandidateType) => value.toUpperCase() as PrismaCandidateType;
const fromCandidateStatus = (value: CandidateStatus) => value.toUpperCase() as PrismaCandidateStatus;

const toSourceType = (value: PrismaSourceType) => value.toLowerCase() as SourceType;
const toRisk = (value: PrismaRiskLevel) => value.toLowerCase() as RiskLevel;
const toRunStatus = (value: PrismaDiscoveryRunStatus) => value.toLowerCase() as DiscoveryRunStatus;
const toCandidateType = (value: PrismaCandidateType) => value.toLowerCase() as CandidateType;
const toCandidateStatus = (value: PrismaCandidateStatus) => value.toLowerCase() as CandidateStatus;

function stableHash(...parts: string[]) {
  return createHash("sha256").update(parts.join("\u001f")).digest("hex");
}

function canonicalPlatform(value: string) {
  const trimmed = value.trim();
  if (trimmed.toLowerCase() === "reddit") return "Reddit";
  if (trimmed.toLowerCase() === "hacker news") return "Hacker News";
  if (trimmed.toLowerCase() === "linkedin") return "LinkedIn";
  return trimmed || "Unknown";
}

function mapSignalSource(source: PrismaSignalSource): SignalSource {
  return {
    id: source.id,
    projectId: source.projectId,
    platform: source.platform,
    sourceType: toSourceType(source.sourceType),
    communityName: source.communityName,
    sourceUrl: source.sourceUrl ?? "",
    keywords: source.keywords,
    competitorTerms: source.competitorTerms,
    painPointTerms: source.painPointTerms,
    excludedTerms: source.excludedTerms,
    scanFrequency: source.scanFrequency,
    riskTolerance: toRisk(source.riskTolerance),
    isActive: source.isActive,
    ...(source.lastScannedAt ? { lastScannedAt: source.lastScannedAt.toISOString() } : {}),
    createdAt: source.createdAt.toISOString(),
    updatedAt: source.updatedAt.toISOString()
  };
}

function mapDiscoveryRun(run: PrismaDiscoveryRun): DiscoveryRun {
  return {
    id: run.id,
    projectId: run.projectId,
    signalSourceId: run.signalSourceId,
    providerType: toSourceType(run.providerType),
    status: toRunStatus(run.status),
    startedAt: run.startedAt.toISOString(),
    ...(run.completedAt ? { completedAt: run.completedAt.toISOString() } : {}),
    itemsFound: run.itemsFound,
    candidatesCreated: run.candidatesCreated,
    errors: run.errors,
    createdAt: run.createdAt.toISOString(),
    updatedAt: run.updatedAt.toISOString()
  };
}

function mapDiscoveredItem(item: PrismaDiscoveredItem): DiscoveredItemDto {
  return {
    id: item.id,
    projectId: item.projectId,
    discoveryRunId: item.discoveryRunId,
    platform: item.platform,
    community: item.community,
    sourceType: toSourceType(item.sourceType),
    externalId: item.externalId,
    ...(item.parentExternalId ? { parentExternalId: item.parentExternalId } : {}),
    authorHandle: item.authorHandle,
    title: item.title,
    body: item.body,
    url: item.url,
    ...(item.score === null ? {} : { score: item.score }),
    ...(item.replyCount === null ? {} : { replyCount: item.replyCount }),
    publishedAt: item.publishedAt.toISOString(),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString()
  };
}

function mapConversationCandidate(candidate: PrismaConversationCandidate): ConversationCandidate {
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
    candidateType: toCandidateType(candidate.candidateType),
    detectedIntent: candidate.detectedIntent,
    detectedPainPoint: candidate.detectedPainPoint,
    ...(candidate.competitorMentioned ? { competitorMentioned: candidate.competitorMentioned } : {}),
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

async function requireOwnedProject(projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: WORKSPACE_ORGANIZATION_ID },
    select: { id: true }
  });

  if (!project) {
    throw new DiscoveryNotFoundError("The requested project was not found in this workspace.");
  }
}

async function requireOwnedSource(projectId: string, sourceId: string) {
  const source = await prisma.signalSource.findFirst({
    where: {
      id: sourceId,
      projectId,
      project: { organizationId: WORKSPACE_ORGANIZATION_ID }
    }
  });

  if (!source) {
    throw new DiscoveryNotFoundError("The requested signal source was not found in this workspace.");
  }

  return source;
}

export async function getDiscoverySnapshot(): Promise<DiscoverySnapshot> {
  const [signalSources, discoveryRuns, discoveredItems, conversationCandidates] = await Promise.all([
    prisma.signalSource.findMany({
      where: { project: { organizationId: WORKSPACE_ORGANIZATION_ID } },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.discoveryRun.findMany({
      where: { project: { organizationId: WORKSPACE_ORGANIZATION_ID } },
      orderBy: { startedAt: "desc" }
    }),
    prisma.discoveredItem.findMany({
      where: { project: { organizationId: WORKSPACE_ORGANIZATION_ID } },
      orderBy: { publishedAt: "desc" }
    }),
    prisma.conversationCandidate.findMany({
      where: { project: { organizationId: WORKSPACE_ORGANIZATION_ID } },
      orderBy: { updatedAt: "desc" }
    })
  ]);

  return {
    signalSources: signalSources.map(mapSignalSource),
    discoveryRuns: discoveryRuns.map(mapDiscoveryRun),
    discoveredItems: discoveredItems.map(mapDiscoveredItem),
    conversationCandidates: conversationCandidates.map(mapConversationCandidate)
  };
}

export async function listSignalSources(projectId: string) {
  await requireOwnedProject(projectId);
  return (
    await prisma.signalSource.findMany({
      where: { projectId },
      orderBy: { updatedAt: "desc" }
    })
  ).map(mapSignalSource);
}

export async function getSignalSource(projectId: string, sourceId: string) {
  return mapSignalSource(await requireOwnedSource(projectId, sourceId));
}

export async function createSignalSource(projectId: string, input: SignalSourceCreateInput) {
  await requireOwnedProject(projectId);
  return mapSignalSource(
    await prisma.signalSource.create({
      data: {
        projectId,
        platform: canonicalPlatform(input.platform),
        sourceType: fromSourceType(input.sourceType),
        communityName: input.communityName,
        sourceUrl: input.sourceUrl || null,
        keywords: input.keywords,
        competitorTerms: input.competitorTerms,
        painPointTerms: input.painPointTerms,
        excludedTerms: input.excludedTerms,
        scanFrequency: input.scanFrequency,
        riskTolerance: fromRisk(input.riskTolerance),
        isActive: input.isActive
      }
    })
  );
}

export async function updateSignalSource(
  projectId: string,
  sourceId: string,
  input: SignalSourceUpdateInput
) {
  const existing = await requireOwnedSource(projectId, sourceId);
  if (existing.sourceType === fromSourceType("manual")) {
    throw new DiscoveryConflictError("The internal manual-intake source cannot be edited.");
  }
  const data: Prisma.SignalSourceUncheckedUpdateInput = {};
  if (input.platform !== undefined) data.platform = canonicalPlatform(input.platform);
  if (input.sourceType !== undefined) data.sourceType = fromSourceType(input.sourceType);
  if (input.communityName !== undefined) data.communityName = input.communityName;
  if (input.sourceUrl !== undefined) data.sourceUrl = input.sourceUrl || null;
  if (input.keywords !== undefined) data.keywords = input.keywords;
  if (input.competitorTerms !== undefined) data.competitorTerms = input.competitorTerms;
  if (input.painPointTerms !== undefined) data.painPointTerms = input.painPointTerms;
  if (input.excludedTerms !== undefined) data.excludedTerms = input.excludedTerms;
  if (input.scanFrequency !== undefined) data.scanFrequency = input.scanFrequency;
  if (input.riskTolerance !== undefined) data.riskTolerance = fromRisk(input.riskTolerance);
  if (input.isActive !== undefined) data.isActive = input.isActive;

  return mapSignalSource(
    await prisma.signalSource.update({
      where: { id: sourceId },
      data
    })
  );
}

export async function deleteSignalSource(projectId: string, sourceId: string) {
  await requireOwnedSource(projectId, sourceId);
  const runCount = await prisma.discoveryRun.count({ where: { signalSourceId: sourceId } });
  if (runCount > 0) {
    throw new DiscoveryConflictError(
      "Deactivate this source instead of deleting it because discovery history references it."
    );
  }
  await prisma.signalSource.delete({ where: { id: sourceId } });
  return { deleted: true };
}

function providerFor(sourceType: SourceType): DiscoveryProvider {
  if (sourceType === "mock") return mockDiscoveryProvider;
  if (sourceType === "reddit") return redditDiscoveryProvider;
  throw new DiscoveryConflictError("Manual sources are processed through manual intake.");
}

interface NormalizedProviderItem {
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
}

function normalizeProviderItems(items: DiscoveredItem[], sourceType: SourceType) {
  const normalized = new Map<string, NormalizedProviderItem>();

  for (const item of items) {
    const platform = canonicalPlatform(item.platform);
    const externalId =
      item.externalId.trim() ||
      `content-${stableHash(platform, item.community, item.url, item.title, item.body).slice(0, 32)}`;
    const key = [platform.toLowerCase(), sourceType, externalId].join("\u001f");
    normalized.set(key, {
      platform,
      community: item.community.trim() || "Unknown",
      sourceType,
      externalId,
      ...(item.parentExternalId?.trim() ? { parentExternalId: item.parentExternalId.trim() } : {}),
      authorHandle: item.authorHandle.trim() || "unknown",
      title: item.title.trim() || "Untitled signal",
      body: item.body,
      url: item.url.trim(),
      ...(item.score === undefined ? {} : { score: item.score }),
      ...(item.replyCount === undefined ? {} : { replyCount: item.replyCount }),
      publishedAt: item.publishedAt,
      rawJson: item.rawJson
    });
  }

  return [...normalized.values()];
}

function itemStableId(projectId: string, item: NormalizedProviderItem) {
  return `discovered-${stableHash(
    projectId,
    item.platform.toLowerCase(),
    item.sourceType,
    item.externalId
  ).slice(0, 28)}`;
}

function candidateStableId(projectId: string, itemId: string, candidateType: CandidateType) {
  return `candidate-${stableHash(projectId, itemId, candidateType).slice(0, 28)}`;
}

async function finalizeSuccessfulRun({
  project,
  source,
  runId,
  providerItems
}: {
  project: Project;
  source: SignalSource;
  runId: string;
  providerItems: DiscoveredItem[];
}): Promise<DiscoveryOperationResult> {
  const normalizedItems = normalizeProviderItems(providerItems, source.sourceType);
  const [productKnowledge, marketKnowledge, communityRules, existingItems] = await Promise.all([
    listKnowledge("product", project.id),
    listKnowledge("market", project.id),
    listCommunityRules(project.id),
    normalizedItems.length
      ? prisma.discoveredItem.findMany({
          where: {
            projectId: project.id,
            OR: normalizedItems.map((item) => ({
              platform: item.platform,
              sourceType: fromSourceType(item.sourceType),
              externalId: item.externalId
            }))
          }
        })
      : Promise.resolve([])
  ]);
  const existingItemByKey = new Map(
    existingItems.map((item) => [
      [item.platform, toSourceType(item.sourceType), item.externalId].join("\u001f"),
      item
    ])
  );
  const now = new Date();
  const itemDtos = normalizedItems.map((item) => {
    const key = [item.platform, item.sourceType, item.externalId].join("\u001f");
    const existing = existingItemByKey.get(key);
    return {
      id: existing?.id ?? itemStableId(project.id, item),
      projectId: project.id,
      discoveryRunId: existing?.discoveryRunId ?? runId,
      platform: item.platform,
      community: item.community,
      sourceType: item.sourceType,
      externalId: item.externalId,
      ...(item.parentExternalId ? { parentExternalId: item.parentExternalId } : {}),
      authorHandle: item.authorHandle,
      title: item.title,
      body: item.body,
      url: item.url,
      ...(item.score === undefined ? {} : { score: item.score }),
      ...(item.replyCount === undefined ? {} : { replyCount: item.replyCount }),
      publishedAt: item.publishedAt,
      rawJson: item.rawJson,
      createdAt: existing?.createdAt.toISOString() ?? now.toISOString(),
      updatedAt: now.toISOString()
    } satisfies DiscoveredItem;
  });
  const mappedCandidates = itemDtos.flatMap((item) =>
    mapDiscoveredItemToCandidates({
      item,
      project,
      productKnowledge,
      marketKnowledge,
      communityRules
    })
  );
  const existingCandidates = itemDtos.length
    ? await prisma.conversationCandidate.findMany({
        where: {
          projectId: project.id,
          discoveredItemId: { in: itemDtos.map((item) => item.id) }
        }
      })
    : [];
  const existingCandidateByKey = new Map(
    existingCandidates.map((candidate) => [
      [candidate.discoveredItemId, toCandidateType(candidate.candidateType)].join("\u001f"),
      candidate
    ])
  );
  const candidates = mappedCandidates.map((candidate) => {
    const itemId = candidate.discoveredItemId!;
    const key = [itemId, candidate.candidateType].join("\u001f");
    const existing = existingCandidateByKey.get(key);
    return {
      ...candidate,
      id: existing?.id ?? candidateStableId(project.id, itemId, candidate.candidateType),
      status: existing ? toCandidateStatus(existing.status) : candidate.status,
      createdAt: existing?.createdAt.toISOString() ?? candidate.createdAt,
      updatedAt: now.toISOString()
    };
  });
  const candidatesCreated = candidates.filter((candidate) => {
    const key = [candidate.discoveredItemId, candidate.candidateType].join("\u001f");
    return !existingCandidateByKey.has(key);
  }).length;
  const operations: Prisma.PrismaPromise<unknown>[] = [];

  normalizedItems.forEach((item, index) => {
    const dto = itemDtos[index];
    operations.push(
      prisma.discoveredItem.upsert({
        where: {
          projectId_platform_sourceType_externalId: {
            projectId: project.id,
            platform: item.platform,
            sourceType: fromSourceType(item.sourceType),
            externalId: item.externalId
          }
        },
        create: {
          id: dto.id,
          projectId: project.id,
          discoveryRunId: runId,
          platform: item.platform,
          community: item.community,
          sourceType: fromSourceType(item.sourceType),
          externalId: item.externalId,
          parentExternalId: item.parentExternalId ?? null,
          authorHandle: item.authorHandle,
          title: item.title,
          body: item.body,
          url: item.url,
          score: item.score ?? null,
          replyCount: item.replyCount ?? null,
          publishedAt: new Date(item.publishedAt),
          rawJson: item.rawJson as Prisma.InputJsonValue
        },
        update: {
          community: item.community,
          parentExternalId: item.parentExternalId ?? null,
          authorHandle: item.authorHandle,
          title: item.title,
          body: item.body,
          url: item.url,
          score: item.score ?? null,
          replyCount: item.replyCount ?? null,
          publishedAt: new Date(item.publishedAt),
          rawJson: item.rawJson as Prisma.InputJsonValue
        }
      })
    );
  });

  candidates.forEach((candidate) => {
    const discoveredItemId = candidate.discoveredItemId!;
    const candidateType = fromCandidateType(candidate.candidateType);
    operations.push(
      prisma.conversationCandidate.upsert({
        where: {
          projectId_discoveredItemId_candidateType: {
            projectId: project.id,
            discoveredItemId,
            candidateType
          }
        },
        create: {
          id: candidate.id,
          projectId: project.id,
          discoveredItemId,
          platform: candidate.platform,
          community: candidate.community,
          sourceType: fromSourceType(candidate.sourceType),
          externalId: candidate.externalId,
          parentExternalId: candidate.parentExternalId ?? null,
          authorHandle: candidate.authorHandle,
          title: candidate.title,
          body: candidate.body,
          url: candidate.url,
          candidateType,
          detectedIntent: candidate.detectedIntent,
          detectedPainPoint: candidate.detectedPainPoint,
          competitorMentioned: candidate.competitorMentioned ?? null,
          productCategoryMentioned: candidate.productCategoryMentioned ?? null,
          candidateSummary: candidate.candidateSummary,
          initialRelevanceScore: candidate.initialRelevanceScore,
          initialIntentScore: candidate.initialIntentScore,
          initialRiskScore: candidate.initialRiskScore,
          status: fromCandidateStatus(candidate.status),
          whyWorthAnalyzing: candidate.whyWorthAnalyzing,
          recommendedNextStep: candidate.recommendedNextStep
        },
        update: {
          platform: candidate.platform,
          community: candidate.community,
          sourceType: fromSourceType(candidate.sourceType),
          externalId: candidate.externalId,
          parentExternalId: candidate.parentExternalId ?? null,
          authorHandle: candidate.authorHandle,
          title: candidate.title,
          body: candidate.body,
          url: candidate.url,
          detectedIntent: candidate.detectedIntent,
          detectedPainPoint: candidate.detectedPainPoint,
          competitorMentioned: candidate.competitorMentioned ?? null,
          productCategoryMentioned: candidate.productCategoryMentioned ?? null,
          candidateSummary: candidate.candidateSummary,
          initialRelevanceScore: candidate.initialRelevanceScore,
          initialIntentScore: candidate.initialIntentScore,
          initialRiskScore: candidate.initialRiskScore,
          whyWorthAnalyzing: candidate.whyWorthAnalyzing,
          recommendedNextStep: candidate.recommendedNextStep
        }
      })
    );
  });

  operations.push(
    prisma.discoveryRun.update({
      where: { id: runId },
      data: {
        status: fromRunStatus("completed"),
        completedAt: now,
        itemsFound: itemDtos.length,
        candidatesCreated,
        errors: []
      }
    }),
    prisma.signalSource.update({
      where: { id: source.id },
      data: { lastScannedAt: now }
    })
  );
  await prisma.$transaction(operations);
  const run = await prisma.discoveryRun.findUniqueOrThrow({ where: { id: runId } });
  const persistedCandidates = candidates.length
    ? await prisma.conversationCandidate.findMany({
        where: { id: { in: candidates.map((candidate) => candidate.id) } }
      })
    : [];

  return {
    run: mapDiscoveryRun(run),
    items: itemDtos.map(({ rawJson: _rawJson, ...item }) => item),
    candidates: persistedCandidates.map(mapConversationCandidate)
  };
}

async function recordFailedRun(runId: string, error: unknown): Promise<DiscoveryOperationResult> {
  const message = error instanceof Error ? error.message : "Unknown discovery error.";
  const failed = await prisma.discoveryRun.update({
    where: { id: runId },
    data: {
      status: fromRunStatus("failed"),
      completedAt: new Date(),
      itemsFound: 0,
      candidatesCreated: 0,
      errors: [message]
    }
  });
  return { run: mapDiscoveryRun(failed), items: [], candidates: [] };
}

async function executeDiscovery({
  project,
  source,
  scan
}: {
  project: Project;
  source: SignalSource;
  scan: (runId: string, now: string) => Promise<DiscoveredItem[]>;
}) {
  const startedAt = new Date();
  const pending = await prisma.discoveryRun.create({
    data: {
      projectId: project.id,
      signalSourceId: source.id,
      providerType: fromSourceType(source.sourceType),
      status: fromRunStatus("pending"),
      startedAt,
      errors: []
    }
  });
  await prisma.discoveryRun.update({
    where: { id: pending.id },
    data: { status: fromRunStatus("running") }
  });

  try {
    const items = await scan(pending.id, startedAt.toISOString());
    return await finalizeSuccessfulRun({
      project,
      source,
      runId: pending.id,
      providerItems: items
    });
  } catch (error) {
    return recordFailedRun(pending.id, error);
  }
}

export async function runSignalSource(projectId: string, sourceId: string) {
  const sourceRecord = await requireOwnedSource(projectId, sourceId);
  if (!sourceRecord.isActive) {
    throw new DiscoveryConflictError("Activate this signal source before running it.");
  }
  const [project] = await Promise.all([getProject(projectId)]);
  const source = mapSignalSource(sourceRecord);
  const provider = providerFor(source.sourceType);

  return executeDiscovery({
    project,
    source,
    scan: (runId, now) =>
      Promise.resolve(
        provider.scan({
          project,
          source,
          discoveryRunId: runId,
          now
        })
      )
  });
}

async function ensureManualSource(projectId: string) {
  const id = `source-manual-${stableHash(projectId).slice(0, 24)}`;
  return prisma.signalSource.upsert({
    where: { id },
    create: {
      id,
      projectId,
      platform: "Manual",
      sourceType: fromSourceType("manual"),
      communityName: "Manual intake",
      sourceUrl: null,
      keywords: [],
      competitorTerms: [],
      painPointTerms: [],
      excludedTerms: [],
      scanFrequency: "On demand",
      riskTolerance: fromRisk("medium"),
      isActive: true
    },
    update: {}
  });
}

export async function runManualDiscovery(projectId: string, input: ManualDiscoveryInput) {
  await requireOwnedProject(projectId);
  const [project, sourceRecord] = await Promise.all([
    getProject(projectId),
    ensureManualSource(projectId)
  ]);
  const source = mapSignalSource(sourceRecord);

  return executeDiscovery({
    project,
    source,
    scan: (runId, now) => {
      const providerItem = createManualDiscoveredItem({
        project,
        discoveryRunId: runId,
        platform: canonicalPlatform(input.platform),
        community: input.community,
        title: input.title,
        body: input.body,
        url: input.url,
        now
      });
      providerItem.externalId = `manual-${stableHash(
        project.id,
        canonicalPlatform(input.platform).toLowerCase(),
        input.community.toLowerCase(),
        input.url,
        input.title,
        input.body
      ).slice(0, 32)}`;
      return Promise.resolve([providerItem]);
    }
  });
}
