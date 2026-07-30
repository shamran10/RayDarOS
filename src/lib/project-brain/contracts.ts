import { z } from "zod";
import type { CommunityRule, KnowledgeItem, Project } from "@/lib/types";

const requiredText = (label: string, max = 10_000) =>
  z.string().trim().min(1, `${label} is required.`).max(max, `${label} is too long.`);

const optionalText = (max = 10_000) => z.string().trim().max(max).default("");

const optionalUrl = z
  .string()
  .trim()
  .max(2_048)
  .refine((value) => !value || z.url().safeParse(value).success, "Enter a valid URL.");

export const riskLevelSchema = z.enum(["low", "medium", "high", "blocked"]);
export const projectStatusSchema = z.enum(["active", "paused", "archived"]);
export const knowledgeStatusSchema = z.enum(["draft", "approved", "restricted", "archived"]);
export const knowledgeHealthSchema = z.enum(["strong", "needs_review", "sparse", "missing", "outdated"]);
export const productMentionToleranceSchema = z.enum(["low", "medium", "high"]);

export const projectCreateSchema = z
  .object({
    name: requiredText("Project name", 160),
    productType: requiredText("Product type", 240),
    productDescription: requiredText("Product description"),
    primaryObjective: requiredText("Primary objective"),
    engagementGoal: requiredText("Engagement goal"),
    brandAccountName: optionalText(160),
    websiteUrl: optionalUrl,
    targetAudience: requiredText("Target audience"),
    defaultTone: requiredText("Default tone", 500),
    productMentionPolicy: requiredText("Product mention policy"),
    riskTolerance: riskLevelSchema.exclude(["blocked"])
  })
  .strict();

export const projectUpdateSchema = projectCreateSchema
  .partial()
  .extend({ status: projectStatusSchema.optional() })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Provide at least one project field.");

export const knowledgeCreateSchema = z
  .object({
    category: requiredText("Category", 240),
    title: requiredText("Title", 320),
    content: requiredText("Content", 50_000),
    source: optionalText(2_048),
    status: knowledgeStatusSchema.default("draft"),
    health: knowledgeHealthSchema.default("sparse"),
    confidence: z.number().min(0).max(1).default(0.7)
  })
  .strict();

export const knowledgeUpdateSchema = knowledgeCreateSchema
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Provide at least one knowledge field.");

export const communityRuleCreateSchema = z
  .object({
    communityName: requiredText("Community name", 240),
    platform: requiredText("Platform", 120),
    topic: requiredText("Topic", 1_000),
    allowedContentTypes: requiredText("Allowed content types"),
    selfPromotionPolicy: requiredText("Self-promotion policy"),
    linkPolicy: requiredText("Link policy"),
    vendorParticipationRules: requiredText("Vendor participation rules"),
    disclosureExpectations: requiredText("Disclosure expectations"),
    tonePreference: requiredText("Tone preference", 500),
    riskLevel: riskLevelSchema,
    moderatorSensitivity: requiredText("Moderator sensitivity", 500),
    productMentionTolerance: productMentionToleranceSchema,
    previousSuccessfulComments: optionalText(),
    previousRemovals: optionalText(),
    previousNegativeReactions: optionalText(),
    recommendedReplyStyle: requiredText("Recommended reply style"),
    minimumAccountAgeOrKarma: optionalText(500),
    engagementFrequencyHistory: optionalText()
  })
  .strict();

export const communityRuleUpdateSchema = communityRuleCreateSchema
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Provide at least one community-rule field.");

export const organizationUpdateSchema = z
  .object({
    name: requiredText("Organization name", 200)
  })
  .strict();

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
export type KnowledgeCreateInput = z.infer<typeof knowledgeCreateSchema>;
export type KnowledgeUpdateInput = z.infer<typeof knowledgeUpdateSchema>;
export type CommunityRuleCreateInput = z.infer<typeof communityRuleCreateSchema>;
export type CommunityRuleUpdateInput = z.infer<typeof communityRuleUpdateSchema>;
export type OrganizationUpdateInput = z.infer<typeof organizationUpdateSchema>;

export interface OrganizationRecord {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectBrainSnapshot {
  organization: OrganizationRecord;
  projects: Project[];
  productKnowledge: KnowledgeItem[];
  marketKnowledge: KnowledgeItem[];
  communityRules: CommunityRule[];
}

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiFailure {
  ok: false;
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
  };
}

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;
