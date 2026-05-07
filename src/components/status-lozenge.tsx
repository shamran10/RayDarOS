import type { AutonomyStatus, CandidateStatus, KnowledgeHealth, KnowledgeStatus, OpportunityStatus, RiskLevel } from "@/lib/types";
import {
  autonomyStatusLabels,
  candidateStatusLabels,
  knowledgeHealthLabels,
  knowledgeStatusLabels,
  opportunityStatusLabels,
  riskLabels
} from "@/lib/labels";

const riskTone: Record<RiskLevel, string> = {
  low: "status-good",
  medium: "status-watch",
  high: "status-risk",
  blocked: "status-risk"
};

const healthTone: Record<KnowledgeHealth, string> = {
  strong: "status-good",
  needs_review: "status-watch",
  sparse: "status-neutral",
  missing: "status-risk",
  outdated: "status-risk"
};

const opportunityTone: Record<OpportunityStatus, string> = {
  new: "status-info",
  analyzed: "status-watch",
  draft_ready: "status-neutral",
  awaiting_review: "status-watch",
  approved: "status-good",
  posted_manually: "status-good",
  rejected: "status-risk",
  saved_as_insight: "status-neutral",
  do_not_reply: "status-risk"
};

const knowledgeStatusTone: Record<KnowledgeStatus, string> = {
  draft: "status-watch",
  approved: "status-good",
  restricted: "status-risk",
  archived: "status-neutral"
};

const candidateStatusTone: Record<CandidateStatus, string> = {
  new: "status-info",
  mapped: "status-neutral",
  deliberating: "status-watch",
  deliberated: "status-neutral",
  queued_for_approval: "status-watch",
  safe_to_auto_engage: "status-good",
  auto_engaged: "status-good",
  saved_as_insight: "status-neutral",
  monitor_only: "status-neutral",
  blocked: "status-risk",
  rejected: "status-risk"
};

const autonomyStatusTone: Record<AutonomyStatus, string> = {
  safe_to_auto_engage: "status-good",
  needs_human_approval: "status-watch",
  monitor_only: "status-neutral",
  save_as_insight_only: "status-neutral",
  blocked: "status-risk"
};

export function StatusPill({ tone, children }: { tone: string; children: React.ReactNode }) {
  return (
    <span className={`status-pill ${tone}`}>
      <span aria-hidden="true" />
      {children}
    </span>
  );
}

export function RiskLozenge({ value }: { value: RiskLevel }) {
  return <StatusPill tone={riskTone[value]}>{riskLabels[value]}</StatusPill>;
}

export function HealthLozenge({ value }: { value: KnowledgeHealth }) {
  return <StatusPill tone={healthTone[value]}>{knowledgeHealthLabels[value]}</StatusPill>;
}

export function OpportunityStatusLozenge({ value }: { value: OpportunityStatus }) {
  return <StatusPill tone={opportunityTone[value]}>{opportunityStatusLabels[value]}</StatusPill>;
}

export function KnowledgeStatusLozenge({ value }: { value: KnowledgeStatus }) {
  return <StatusPill tone={knowledgeStatusTone[value]}>{knowledgeStatusLabels[value]}</StatusPill>;
}

export function CandidateStatusLozenge({ value }: { value: CandidateStatus }) {
  return <StatusPill tone={candidateStatusTone[value]}>{candidateStatusLabels[value]}</StatusPill>;
}

export function AutonomyStatusLozenge({ value }: { value: AutonomyStatus }) {
  return <StatusPill tone={autonomyStatusTone[value]}>{autonomyStatusLabels[value]}</StatusPill>;
}
