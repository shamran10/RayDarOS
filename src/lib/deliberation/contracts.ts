import { z } from "zod";
import type {
  CandidateScore,
  ConversationCandidate,
  DeliberationAgentResult,
  DeliberationRun,
  FinalDecision,
  Opportunity,
  OpportunityScore
} from "@/lib/types";

export const DELIBERATION_AGENT_ROLES = [
  "Opportunity Scout",
  "Market Analyst",
  "Product Fit Analyst",
  "Community Risk Officer",
  "Skeptic",
  "Engagement Strategist",
  "Brand Guardian",
  "Final Judge"
] as const;

export type DeliberationAgentRole = (typeof DELIBERATION_AGENT_ROLES)[number];

export const startDeliberationSchema = z
  .object({
    requestId: z.uuid("A valid request ID is required.")
  })
  .strict();

export type StartDeliberationInput = z.infer<typeof startDeliberationSchema>;

export interface PersistedOpportunity extends Omit<Opportunity, "scores"> {
  candidateId: string;
  scores?: OpportunityScore;
}

export interface PersistedDeliberationRun extends DeliberationRun {
  opportunityId: string;
  revision: number;
  requestId: string;
  startedAt: string;
  completedAt?: string;
  errors: string[];
}

export interface PersistedFinalDecision extends FinalDecision {
  projectId: string;
}

export interface DeliberationRunDetail {
  run: PersistedDeliberationRun;
  agentResults: Array<DeliberationAgentResult & { agentName: DeliberationAgentRole }>;
  score?: CandidateScore;
  decision?: PersistedFinalDecision;
}

export interface OpportunitySourceTrail {
  discoveryRunId?: string;
  discoveredItemId?: string;
  sourceUrl: string;
}

export interface OpportunitySummary {
  opportunity: PersistedOpportunity;
  candidate: ConversationCandidate;
  latestRun?: DeliberationRunDetail;
}

export interface OpportunityDetail extends OpportunitySummary {
  sourceTrail: OpportunitySourceTrail;
  runs: DeliberationRunDetail[];
}

export interface DeliberationStartResult {
  opportunity: OpportunityDetail;
  reused: boolean;
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
