import "server-only";

import type {
  CommunityRule as PrismaCommunityRule,
  KnowledgeHealth as PrismaKnowledgeHealth,
  KnowledgeItemStatus as PrismaKnowledgeItemStatus,
  MarketKnowledgeItem,
  ProductKnowledgeItem,
  Prisma,
  Project as PrismaProject,
  ProjectStatus as PrismaProjectStatus,
  RiskLevel as PrismaRiskLevel
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ProjectBrainConflictError,
  ProjectBrainNotFoundError
} from "@/lib/project-brain/api-response";
import type {
  CommunityRuleCreateInput,
  CommunityRuleUpdateInput,
  KnowledgeCreateInput,
  KnowledgeUpdateInput,
  OrganizationRecord,
  OrganizationUpdateInput,
  ProjectBrainSnapshot,
  ProjectCreateInput,
  ProjectUpdateInput
} from "@/lib/project-brain/contracts";
import type {
  CommunityRule,
  KnowledgeHealth,
  KnowledgeItem,
  KnowledgeStatus,
  Project,
  ProjectStatus,
  RiskLevel
} from "@/lib/types";

export const WORKSPACE_ORGANIZATION_ID = "org-reydaros-internal";
const WORKSPACE_ORGANIZATION_NAME = "ReydarOS Internal";
const EMPTY_WORKSPACE_ORGANIZATION: OrganizationRecord = {
  id: WORKSPACE_ORGANIZATION_ID,
  name: WORKSPACE_ORGANIZATION_NAME,
  createdAt: "",
  updatedAt: ""
};

const toRisk = (value: PrismaRiskLevel) => value.toLowerCase() as RiskLevel;
const toProjectStatus = (value: PrismaProjectStatus) => value.toLowerCase() as ProjectStatus;
const toKnowledgeStatus = (value: PrismaKnowledgeItemStatus) => value.toLowerCase() as KnowledgeStatus;
const toKnowledgeHealth = (value: PrismaKnowledgeHealth) => value.toLowerCase() as KnowledgeHealth;

const fromRisk = (value: RiskLevel) => value.toUpperCase() as PrismaRiskLevel;
const fromProjectStatus = (value: ProjectStatus) => value.toUpperCase() as PrismaProjectStatus;
const fromKnowledgeStatus = (value: KnowledgeStatus) => value.toUpperCase() as PrismaKnowledgeItemStatus;
const fromKnowledgeHealth = (value: KnowledgeHealth) => value.toUpperCase() as PrismaKnowledgeHealth;

function mapOrganization(organization: {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}): OrganizationRecord {
  return {
    id: organization.id,
    name: organization.name,
    createdAt: organization.createdAt.toISOString(),
    updatedAt: organization.updatedAt.toISOString()
  };
}

function mapProject(project: PrismaProject): Project {
  const brandAccountName = project.brandAccountName ?? "";

  return {
    id: project.id,
    name: project.name,
    productType: project.productType,
    productDescription: project.productDescription,
    primaryObjective: project.primaryObjective,
    engagementGoal: project.engagementGoal,
    brandAccountName,
    websiteUrl: project.websiteUrl ?? "",
    targetAudience: project.targetAudience,
    defaultTone: project.defaultTone,
    productMentionPolicy: project.productMentionPolicy,
    riskTolerance: toRisk(project.riskTolerance),
    status: toProjectStatus(project.status),
    connectedAccount: brandAccountName ? `u/${brandAccountName}` : "Not connected",
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString()
  };
}

function mapKnowledge(
  item: ProductKnowledgeItem | MarketKnowledgeItem,
  restricted?: boolean
): KnowledgeItem {
  return {
    id: item.id,
    projectId: item.projectId,
    category: item.category,
    title: item.title,
    content: item.content,
    source: item.source ?? "",
    status: toKnowledgeStatus(item.status),
    health: toKnowledgeHealth(item.health),
    approved: item.approved,
    ...(restricted === undefined ? {} : { restricted }),
    confidence: item.confidence,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString()
  };
}

function mapCommunityRule(rule: PrismaCommunityRule): CommunityRule {
  return {
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
    riskLevel: toRisk(rule.riskLevel),
    moderatorSensitivity: rule.moderatorSensitivity,
    productMentionTolerance: rule.productMentionTolerance as CommunityRule["productMentionTolerance"],
    previousSuccessfulComments: rule.previousSuccessfulComments ?? "",
    previousRemovals: rule.previousRemovals ?? "",
    previousNegativeReactions: rule.previousNegativeReactions ?? "",
    recommendedReplyStyle: rule.recommendedReplyStyle,
    minimumAccountAgeOrKarma: rule.minimumAccountAgeOrKarma ?? "",
    engagementFrequencyHistory: rule.engagementFrequencyHistory ?? "",
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString()
  };
}

async function requireOwnedProject(projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: WORKSPACE_ORGANIZATION_ID }
  });

  if (!project) {
    throw new ProjectBrainNotFoundError("The requested project was not found in this workspace.");
  }

  return project;
}

export async function ensureWorkspaceOrganization() {
  return prisma.organization.upsert({
    where: { id: WORKSPACE_ORGANIZATION_ID },
    update: {},
    create: {
      id: WORKSPACE_ORGANIZATION_ID,
      name: WORKSPACE_ORGANIZATION_NAME
    }
  });
}

export async function getWorkspaceOrganization() {
  const organization = await prisma.organization.findUnique({
    where: { id: WORKSPACE_ORGANIZATION_ID }
  });
  return organization ? mapOrganization(organization) : EMPTY_WORKSPACE_ORGANIZATION;
}

export async function updateWorkspaceOrganization(input: OrganizationUpdateInput) {
  await ensureWorkspaceOrganization();
  return mapOrganization(
    await prisma.organization.update({
      where: { id: WORKSPACE_ORGANIZATION_ID },
      data: { name: input.name }
    })
  );
}

export async function deleteWorkspaceOrganizationIfEmpty() {
  const projectCount = await prisma.project.count({
    where: { organizationId: WORKSPACE_ORGANIZATION_ID }
  });

  if (projectCount > 0) {
    throw new ProjectBrainConflictError("Archive or delete all workspace projects before deleting the organization.");
  }

  await prisma.organization.deleteMany({ where: { id: WORKSPACE_ORGANIZATION_ID } });
  return { deleted: true };
}

export async function getProjectBrainSnapshot(): Promise<ProjectBrainSnapshot> {
  const [organization, projects, productKnowledge, marketKnowledge, communityRules] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: WORKSPACE_ORGANIZATION_ID }
    }),
    prisma.project.findMany({
      where: { organizationId: WORKSPACE_ORGANIZATION_ID },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }]
    }),
    prisma.productKnowledgeItem.findMany({
      where: { project: { organizationId: WORKSPACE_ORGANIZATION_ID } },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.marketKnowledgeItem.findMany({
      where: { project: { organizationId: WORKSPACE_ORGANIZATION_ID } },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.communityRule.findMany({
      where: { project: { organizationId: WORKSPACE_ORGANIZATION_ID } },
      orderBy: { updatedAt: "desc" }
    })
  ]);

  return {
    organization: organization ? mapOrganization(organization) : EMPTY_WORKSPACE_ORGANIZATION,
    projects: projects.map(mapProject),
    productKnowledge: productKnowledge.map((item) => mapKnowledge(item, item.restricted)),
    marketKnowledge: marketKnowledge.map((item) => mapKnowledge(item)),
    communityRules: communityRules.map(mapCommunityRule)
  };
}

export async function listProjects() {
  return (
    await prisma.project.findMany({
      where: { organizationId: WORKSPACE_ORGANIZATION_ID },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }]
    })
  ).map(mapProject);
}

export async function getProject(projectId: string) {
  return mapProject(await requireOwnedProject(projectId));
}

export async function createProject(input: ProjectCreateInput) {
  await ensureWorkspaceOrganization();
  return mapProject(
    await prisma.project.create({
      data: {
        ...input,
        brandAccountName: input.brandAccountName || null,
        websiteUrl: input.websiteUrl || null,
        riskTolerance: fromRisk(input.riskTolerance),
        organizationId: WORKSPACE_ORGANIZATION_ID
      }
    })
  );
}

export async function updateProject(projectId: string, input: ProjectUpdateInput) {
  await requireOwnedProject(projectId);
  const data: Prisma.ProjectUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.productType !== undefined) data.productType = input.productType;
  if (input.productDescription !== undefined) data.productDescription = input.productDescription;
  if (input.primaryObjective !== undefined) data.primaryObjective = input.primaryObjective;
  if (input.engagementGoal !== undefined) data.engagementGoal = input.engagementGoal;
  if (input.brandAccountName !== undefined) data.brandAccountName = input.brandAccountName || null;
  if (input.websiteUrl !== undefined) data.websiteUrl = input.websiteUrl || null;
  if (input.targetAudience !== undefined) data.targetAudience = input.targetAudience;
  if (input.defaultTone !== undefined) data.defaultTone = input.defaultTone;
  if (input.productMentionPolicy !== undefined) data.productMentionPolicy = input.productMentionPolicy;
  if (input.riskTolerance !== undefined) data.riskTolerance = fromRisk(input.riskTolerance);
  if (input.status !== undefined) data.status = fromProjectStatus(input.status);

  return mapProject(
    await prisma.project.update({
      where: { id: projectId },
      data
    })
  );
}

export async function deleteProject(projectId: string) {
  await requireOwnedProject(projectId);
  await prisma.project.delete({ where: { id: projectId } });
  return { deleted: true };
}

type KnowledgeKind = "product" | "market";

export async function listKnowledge(kind: KnowledgeKind, projectId: string) {
  await requireOwnedProject(projectId);
  if (kind === "product") {
    return (
      await prisma.productKnowledgeItem.findMany({
        where: { projectId },
        orderBy: { updatedAt: "desc" }
      })
    ).map((item) => mapKnowledge(item, item.restricted));
  }

  return (
    await prisma.marketKnowledgeItem.findMany({
      where: { projectId },
      orderBy: { updatedAt: "desc" }
    })
  ).map((item) => mapKnowledge(item));
}

export async function getKnowledge(kind: KnowledgeKind, projectId: string, itemId: string) {
  await requireOwnedProject(projectId);
  if (kind === "product") {
    const item = await prisma.productKnowledgeItem.findFirst({ where: { id: itemId, projectId } });
    if (!item) throw new ProjectBrainNotFoundError("The requested product knowledge item was not found.");
    return mapKnowledge(item, item.restricted);
  }

  const item = await prisma.marketKnowledgeItem.findFirst({ where: { id: itemId, projectId } });
  if (!item) throw new ProjectBrainNotFoundError("The requested market knowledge item was not found.");
  return mapKnowledge(item);
}

export async function createKnowledge(kind: KnowledgeKind, projectId: string, input: KnowledgeCreateInput) {
  await requireOwnedProject(projectId);
  const data = {
    projectId,
    category: input.category,
    title: input.title,
    content: input.content,
    source: input.source || null,
    status: fromKnowledgeStatus(input.status),
    health: fromKnowledgeHealth(input.health),
    approved: input.status === "approved",
    confidence: input.confidence
  };

  if (kind === "product") {
    const item = await prisma.productKnowledgeItem.create({
      data: {
        ...data,
        restricted: input.status === "restricted"
      }
    });
    return mapKnowledge(item, item.restricted);
  }

  return mapKnowledge(await prisma.marketKnowledgeItem.create({ data }));
}

export async function updateKnowledge(
  kind: KnowledgeKind,
  projectId: string,
  itemId: string,
  input: KnowledgeUpdateInput
) {
  await getKnowledge(kind, projectId, itemId);

  if (kind === "product") {
    const data: Prisma.ProductKnowledgeItemUpdateInput = {};
    if (input.category !== undefined) data.category = input.category;
    if (input.title !== undefined) data.title = input.title;
    if (input.content !== undefined) data.content = input.content;
    if (input.source !== undefined) data.source = input.source || null;
    if (input.status !== undefined) {
      data.status = fromKnowledgeStatus(input.status);
      data.approved = input.status === "approved";
      data.restricted = input.status === "restricted";
    }
    if (input.health !== undefined) data.health = fromKnowledgeHealth(input.health);
    if (input.confidence !== undefined) data.confidence = input.confidence;

    const item = await prisma.productKnowledgeItem.update({
      where: { id: itemId },
      data
    });
    return mapKnowledge(item, item.restricted);
  }

  const data: Prisma.MarketKnowledgeItemUpdateInput = {};
  if (input.category !== undefined) data.category = input.category;
  if (input.title !== undefined) data.title = input.title;
  if (input.content !== undefined) data.content = input.content;
  if (input.source !== undefined) data.source = input.source || null;
  if (input.status !== undefined) {
    data.status = fromKnowledgeStatus(input.status);
    data.approved = input.status === "approved";
  }
  if (input.health !== undefined) data.health = fromKnowledgeHealth(input.health);
  if (input.confidence !== undefined) data.confidence = input.confidence;

  return mapKnowledge(await prisma.marketKnowledgeItem.update({ where: { id: itemId }, data }));
}

export async function deleteKnowledge(kind: KnowledgeKind, projectId: string, itemId: string) {
  await getKnowledge(kind, projectId, itemId);
  if (kind === "product") {
    await prisma.productKnowledgeItem.delete({ where: { id: itemId } });
  } else {
    await prisma.marketKnowledgeItem.delete({ where: { id: itemId } });
  }
  return { deleted: true };
}

export async function listCommunityRules(projectId: string) {
  await requireOwnedProject(projectId);
  return (
    await prisma.communityRule.findMany({
      where: { projectId },
      orderBy: { updatedAt: "desc" }
    })
  ).map(mapCommunityRule);
}

export async function getCommunityRule(projectId: string, ruleId: string) {
  await requireOwnedProject(projectId);
  const rule = await prisma.communityRule.findFirst({ where: { id: ruleId, projectId } });
  if (!rule) throw new ProjectBrainNotFoundError("The requested community rule was not found.");
  return mapCommunityRule(rule);
}

export async function createCommunityRule(projectId: string, input: CommunityRuleCreateInput) {
  await requireOwnedProject(projectId);
  return mapCommunityRule(
    await prisma.communityRule.create({
      data: {
        ...input,
        projectId,
        riskLevel: fromRisk(input.riskLevel)
      }
    })
  );
}

export async function updateCommunityRule(
  projectId: string,
  ruleId: string,
  input: CommunityRuleUpdateInput
) {
  await getCommunityRule(projectId, ruleId);
  const data: Prisma.CommunityRuleUpdateInput = {};
  if (input.communityName !== undefined) data.communityName = input.communityName;
  if (input.platform !== undefined) data.platform = input.platform;
  if (input.topic !== undefined) data.topic = input.topic;
  if (input.allowedContentTypes !== undefined) data.allowedContentTypes = input.allowedContentTypes;
  if (input.selfPromotionPolicy !== undefined) data.selfPromotionPolicy = input.selfPromotionPolicy;
  if (input.linkPolicy !== undefined) data.linkPolicy = input.linkPolicy;
  if (input.vendorParticipationRules !== undefined) {
    data.vendorParticipationRules = input.vendorParticipationRules;
  }
  if (input.disclosureExpectations !== undefined) data.disclosureExpectations = input.disclosureExpectations;
  if (input.tonePreference !== undefined) data.tonePreference = input.tonePreference;
  if (input.riskLevel !== undefined) data.riskLevel = fromRisk(input.riskLevel);
  if (input.moderatorSensitivity !== undefined) data.moderatorSensitivity = input.moderatorSensitivity;
  if (input.productMentionTolerance !== undefined) {
    data.productMentionTolerance = input.productMentionTolerance;
  }
  if (input.previousSuccessfulComments !== undefined) {
    data.previousSuccessfulComments = input.previousSuccessfulComments || null;
  }
  if (input.previousRemovals !== undefined) data.previousRemovals = input.previousRemovals || null;
  if (input.previousNegativeReactions !== undefined) {
    data.previousNegativeReactions = input.previousNegativeReactions || null;
  }
  if (input.recommendedReplyStyle !== undefined) data.recommendedReplyStyle = input.recommendedReplyStyle;
  if (input.minimumAccountAgeOrKarma !== undefined) {
    data.minimumAccountAgeOrKarma = input.minimumAccountAgeOrKarma || null;
  }
  if (input.engagementFrequencyHistory !== undefined) {
    data.engagementFrequencyHistory = input.engagementFrequencyHistory || null;
  }

  return mapCommunityRule(
    await prisma.communityRule.update({
      where: { id: ruleId },
      data
    })
  );
}

export async function deleteCommunityRule(projectId: string, ruleId: string) {
  await getCommunityRule(projectId, ruleId);
  await prisma.communityRule.delete({ where: { id: ruleId } });
  return { deleted: true };
}
