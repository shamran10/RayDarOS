"use client";

import { useMemo, useState } from "react";
import Badge from "@atlaskit/badge";
import Button from "@atlaskit/button";
import DynamicTable from "@atlaskit/dynamic-table";
import EmptyState from "@atlaskit/empty-state";
import TextArea from "@atlaskit/textarea";
import { Box, Inline, Stack } from "@atlaskit/primitives";
import { PageHeading } from "@/components/page-heading";
import { SectionPanel } from "@/components/section-panel";
import { AutonomyStatusLozenge } from "@/components/status-lozenge";
import { autonomyStatusLabels, finalDecisionActionLabels, productMentionLabels } from "@/lib/labels";
import { useReydar } from "@/lib/store";
import type { AutonomyStatus, CandidateStatus } from "@/lib/types";

type QueueFilter = "all" | AutonomyStatus | "failed";

const filters: { label: string; value: QueueFilter }[] = [
  { label: "All", value: "all" },
  { label: "Safe to auto-engage", value: "safe_to_auto_engage" },
  { label: "Needs approval", value: "needs_human_approval" },
  { label: "Blocked", value: "blocked" },
  { label: "Monitor only", value: "monitor_only" },
  { label: "Saved as insight", value: "save_as_insight_only" },
  { label: "Failed actions", value: "failed" }
];

export function AutonomyQueueScreen() {
  const { activeProject, state, updateCandidateStatus, saveInsight } = useReydar();
  const [filter, setFilter] = useState<QueueFilter>("all");
  const queueItems = useMemo(
    () =>
      state.finalDecisions
        .filter((decision) => state.conversationCandidates.some((candidate) => candidate.id === decision.candidateId && candidate.projectId === activeProject.id))
        .map((decision) => {
          const candidate = state.conversationCandidates.find((item) => item.id === decision.candidateId);
          const run = state.deliberationRuns.find((item) => item.id === decision.deliberationRunId);
          const score = state.candidateScores.find((item) => item.deliberationRunId === decision.deliberationRunId);
          const actionLog = state.autonomousActionLogs.find((item) => item.finalDecisionId === decision.id);
          return { decision, candidate, run, score, actionLog };
        })
        .filter((item) => {
          if (!item.run || !item.candidate) return false;
          if (filter === "all") return true;
          if (filter === "failed") return item.actionLog?.actionStatus === "failed";
          return item.run.autonomyStatus === filter;
        }),
    [activeProject.id, filter, state.autonomousActionLogs, state.candidateScores, state.conversationCandidates, state.deliberationRuns, state.finalDecisions]
  );

  const setStatus = (candidateId: string, status: CandidateStatus) => updateCandidateStatus(candidateId, status);

  const saveDecisionAsInsight = (candidateId: string) => {
    const candidate = state.conversationCandidates.find((item) => item.id === candidateId);
    if (!candidate) return;
    saveInsight({
      id: `insight-candidate-${Date.now()}`,
      projectId: candidate.projectId,
      opportunityId: candidate.opportunityId,
      candidateId: candidate.id,
      category: "Deliberation insight",
      title: `${candidate.detectedPainPoint} from ${candidate.community}`,
      insight: candidate.candidateSummary,
      source: candidate.url,
      confidence: candidate.initialRelevanceScore / 100,
      approved: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setStatus(candidateId, "saved_as_insight");
  };

  return (
    <>
      <PageHeading
        title="Legacy Approval Queue"
        description="Admin fallback for inspecting approval-gated decisions. The default path is the autonomous pipeline and Review Inbox."
        breadcrumbs={[{ text: "ReydarOS", href: "/" }, { text: "Legacy Approval Queue", href: "/autonomy-queue" }]}
        action={<Button appearance="primary" href="/signal-discovery">Run autonomous pipeline</Button>}
      />

      <SectionPanel title="Queue filters">
        <Inline space="space.100" shouldWrap>
          {filters.map((item) => (
            <Button key={item.value} appearance={filter === item.value ? "primary" : "default"} onClick={() => setFilter(item.value)}>
              {item.label}
            </Button>
          ))}
        </Inline>
      </SectionPanel>

      <Box paddingBlockStart="space.200">
        <SectionPanel title="Autonomy decisions" description={`${queueItems.length} item${queueItems.length === 1 ? "" : "s"} in this view.`}>
          {queueItems.length ? (
            <DynamicTable
              head={{
                cells: [
                  { key: "candidate", content: "Candidate" },
                  { key: "community", content: "Community" },
                  { key: "decision", content: "Final decision" },
                  { key: "autonomy", content: "Autonomy status" },
                  { key: "risk", content: "Risk" },
                  { key: "mention", content: "Mention" },
                  { key: "draft", content: "Draft preview" },
                  { key: "policy", content: "Policy result" },
                  { key: "created", content: "Created" },
                  { key: "actions", content: "Actions" }
                ]
              }}
              rows={queueItems.map(({ decision, candidate, run, score }) => ({
                key: decision.id,
                cells: [
                  { key: "candidate", content: candidate?.title ?? "Unknown candidate" },
                  { key: "community", content: candidate?.community ?? "Unknown" },
                  { key: "decision", content: finalDecisionActionLabels[decision.selectedAction] },
                  { key: "autonomy", content: run ? <AutonomyStatusLozenge value={run.autonomyStatus} /> : "No run" },
                  { key: "risk", content: <Badge>{Math.max(score?.promotionRiskScore ?? 0, score?.communityRiskScore ?? 0)}</Badge> },
                  { key: "mention", content: productMentionLabels[decision.productMentionLevel] },
                  { key: "draft", content: decision.approvedDraft ? `${decision.approvedDraft.slice(0, 130)}...` : "No draft" },
                  { key: "policy", content: decision.policyResult.slice(0, 120) },
                  { key: "created", content: new Date(decision.createdAt).toLocaleDateString() },
                  {
                    key: "actions",
                    content: candidate ? (
                      <Inline space="space.050" shouldWrap>
                        <Button onClick={() => setStatus(candidate.id, "queued_for_approval")}>Route to review</Button>
                        {candidate.opportunityId ? <Button href={`/response-studio?opportunity=${candidate.opportunityId}`}>Edit</Button> : null}
                        <Button onClick={() => saveDecisionAsInsight(candidate.id)}>Save insight</Button>
                        <Button onClick={() => setStatus(candidate.id, "blocked")}>Block</Button>
                      </Inline>
                    ) : null
                  }
                ]
              }))}
              rowsPerPage={10}
            />
          ) : (
            <EmptyState
              header="No autonomy decisions in this filter"
              description="Run the autonomous pipeline to populate decision and audit records."
              primaryAction={<Button appearance="primary" href="/signal-discovery">Run autonomous pipeline</Button>}
            />
          )}
        </SectionPanel>
      </Box>

      <Box paddingBlockStart="space.200">
        <div className="two-column-workspace">
          <SectionPanel title="Queue policy legend">
            <Stack space="space.100">
              {Object.entries(autonomyStatusLabels).map(([status, label]) => (
                <Inline key={status} spread="space-between">
                  <span>{label}</span>
                  <Badge>{queueItems.filter((item) => item.run?.autonomyStatus === status).length}</Badge>
                </Inline>
              ))}
            </Stack>
          </SectionPanel>
          <SectionPanel title="Selected drafts remain inspectable">
            <TextArea value={queueItems[0]?.decision.approvedDraft ?? "Select or generate a decision to inspect the prepared draft here."} minimumRows={8} isReadOnly />
          </SectionPanel>
        </div>
      </Box>
    </>
  );
}
