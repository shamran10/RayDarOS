import { z } from "zod";
import type {
  ConversationCandidate,
  DiscoveredItem,
  DiscoveryRun,
  SignalSource
} from "@/lib/types";

const requiredText = (label: string, max = 10_000) =>
  z.string().trim().min(1, `${label} is required.`).max(max, `${label} is too long.`);

const optionalUrl = z
  .string()
  .trim()
  .max(2_048)
  .refine((value) => !value || z.url().safeParse(value).success, "Enter a valid URL.");

const termList = z
  .array(z.string().trim().min(1).max(240))
  .max(100)
  .transform((values) => Array.from(new Set(values)));

export const discoverySourceTypeSchema = z.enum(["mock", "reddit"]);
export const discoveryRiskLevelSchema = z.enum(["low", "medium", "high", "blocked"]);

export const signalSourceCreateSchema = z
  .object({
    platform: requiredText("Platform", 120),
    sourceType: discoverySourceTypeSchema,
    communityName: requiredText("Community or source name", 240),
    sourceUrl: optionalUrl.default(""),
    keywords: termList.default([]),
    competitorTerms: termList.default([]),
    painPointTerms: termList.default([]),
    excludedTerms: termList.default([]),
    scanFrequency: requiredText("Scan frequency", 120),
    riskTolerance: discoveryRiskLevelSchema.default("medium"),
    isActive: z.boolean().default(true)
  })
  .strict();

export const signalSourceUpdateSchema = signalSourceCreateSchema
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Provide at least one signal-source field.");

export const discoveryScanSchema = z.object({}).strict();

export const manualDiscoverySchema = z
  .object({
    platform: requiredText("Platform", 120),
    community: requiredText("Community", 240),
    title: requiredText("Thread title", 500),
    body: requiredText("Conversation text", 50_000),
    url: optionalUrl.default("")
  })
  .strict();

export type SignalSourceCreateInput = z.infer<typeof signalSourceCreateSchema>;
export type SignalSourceUpdateInput = z.infer<typeof signalSourceUpdateSchema>;
export type ManualDiscoveryInput = z.infer<typeof manualDiscoverySchema>;
export type DiscoveredItemDto = Omit<DiscoveredItem, "rawJson">;

export interface DiscoverySnapshot {
  signalSources: SignalSource[];
  discoveryRuns: DiscoveryRun[];
  discoveredItems: DiscoveredItemDto[];
  conversationCandidates: ConversationCandidate[];
}

export interface DiscoveryOperationResult {
  run: DiscoveryRun;
  items: DiscoveredItemDto[];
  candidates: ConversationCandidate[];
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
