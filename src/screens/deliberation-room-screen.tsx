"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Badge from "@atlaskit/badge";
import Banner from "@atlaskit/banner";
import Button, { LoadingButton } from "@atlaskit/button";
import EmptyState from "@atlaskit/empty-state";
import TextArea from "@atlaskit/textarea";
import { Box, Inline, Stack } from "@atlaskit/primitives";
import { PageHeading } from "@/components/page-heading";
import { ScoreList } from "@/components/score-list";
import { SectionPanel } from "@/components/section-panel";
import { AutonomyStatusLozenge, CandidateStatusLozenge } from "@/components/status-lozenge";
import { autonomyStatusLabels, candidateTypeLabels, finalDecisionActionLabels, productMentionLabels } from "@/lib/labels";
import { useReydar } from "@/lib/store";

export function DeliberationRoomScreen() {
  const searchParams = useSearchParams();
  const {
    activeProject,
    state,
    runDeliberationForCandidate
  } = useReydar();
  const requestedCandidate = searchParams.get("candidate");
  const projectCandidates = state.conversationCandidates.filter((candidate) => candidate.projectId === activeProject.id);
  const [selectedId, setSelectedId] = useState(requestedCandidate ?? projectCandidates[0]?.id ?? "");
  const [running, setRunning] = useState(false);
  const candidate = projectCandidates.find((item) => item.id === selectedId) ?? projectCandidates[0];
  const run = candidate ? state.deliberationRuns.find((item) => item.candidateId === candidate.id) : undefined;
  const agents = run ? state.deliberationAgentResults.filter((item) => item.deliberationRunId === run.id) : [];
  const score = run ? state.candidateScores.find((item) => item.deliberationRunId === run.id) : undefined;
  const decision = run ? state.finalDecisions.find((item) => item.deliberationRunId === run.id) : undefined;
  const candidateOptions = useMemo(
    () => projectCandidates.map((item) => ({ label: item.title, value: item.id })),
    [projectCandidates]
  );
  const opp = candidate?.opportunityId ? state.opportunities.find((item) => item.id === candidate.opportunityId) : undefined;

  const rerun = async () => {
    if (!candidate) return;
    setRunning(true);
    await runDeliberationForCandidate(candidate.id);
    setRunning(false);
  };

  if (!candidate) {
    return (
      <EmptyState
        header="No candidates to deliberate"
        description="Run the autonomous pipeline to create candidates, decisions, drafts, and audit records."
        primaryAction={<Button appearance="primary" href="/signal-discovery">Run autonomous pipeline</Button>}
      />
    );
  }

  return (
    <>
      <PageHeading
        title="Deliberation Debug"
        description="Admin fallback for inspecting or re-running the decision trail created by the autonomous pipeline."
        breadcrumbs={[{ text: "ReydarOS", href: "/" }, { text: "Deliberation Debug", href: "/deliberation" }]}
        action={
          <Inline space="space.100" shouldWrap>
            <select value={candidate.id} onChange={(event) => setSelectedId(event.currentTarget.value)} aria-label="Select candidate">
              {candidateOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <LoadingButton appearance="primary" isLoading={running} onClick={rerun}>Re-run decision</LoadingButton>
          </Inline>
        }
      />

      {decision && !decision.autoEngageAllowed ? (
        <Box paddingBlockEnd="space.200">
          <Banner appearance="warning">{decision.policyResult}</Banner>
        </Box>
      ) : null}

      <div className="deliberation-workspace">
        <SectionPanel title="Conversation context" description={`${candidate.platform} / ${candidate.community}`}>
          <Stack space="space.150">
            <Inline space="space.100" shouldWrap>
              <CandidateStatusLozenge value={candidate.status} />
              <Badge>{candidateTypeLabels[candidate.candidateType]}</Badge>
              {run ? <AutonomyStatusLozenge value={run.autonomyStatus} /> : null}
            </Inline>
            <strong>{candidate.title}</strong>
            <p>{candidate.candidateSummary}</p>
            <TextArea value={candidate.body} minimumRows={14} isReadOnly />
            <Stack space="space.050">
              <span><strong>Detected intent:</strong> {candidate.detectedIntent}</span>
              <span><strong>Detected pain:</strong> {candidate.detectedPainPoint}</span>
              <span><strong>Why analyze:</strong> {candidate.whyWorthAnalyzing}</span>
            </Stack>
          </Stack>
        </SectionPanel>

        <SectionPanel title="Agent deliberation" description="Every agent must argue before a final decision exists.">
          {run ? (
            <div className="agent-list">
              {agents.map((agent) => (
                <div className="agent-card" key={agent.id}>
                  <div className="agent-card-header">
                    <div className="agent-card-title">
                      <strong>{agent.agentName}</strong>
                      <span>{agent.recommendation}</span>
                    </div>
                    <span className="agent-score-tag">{agent.score}</span>
                  </div>
                  <p className="agent-reasoning">{agent.reasoning}</p>
                  <div className="agent-argument-grid">
                    <div className="agent-argument">
                      <strong>Argument for</strong>
                      <p>{agent.argumentFor}</p>
                    </div>
                    <div className="agent-argument">
                      <strong>Argument against</strong>
                      <p>{agent.argumentAgainst}</p>
                    </div>
                  </div>
                  {agent.riskFlags.length ? (
                    <div className="agent-tag-row">
                      {agent.riskFlags.map((flag) => (
                        <span className="agent-rule-tag" key={flag}>
                          {flag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              header="Deliberation has not run"
              description="Re-run the decision trail only when debugging an older or incomplete record."
              primaryAction={<LoadingButton appearance="primary" isLoading={running} onClick={rerun}>Re-run decision</LoadingButton>}
            />
          )}
        </SectionPanel>

        <aside className="right-panel-sticky">
          <Stack space="space.200">
            <SectionPanel title="Scores">
              {score ? (
                <Stack space="space.150">
                  <ScoreList
                    scores={{
                      relevanceScore: score.relevanceScore,
                      intentScore: score.intentScore,
                      productFitScore: score.productFitScore,
                      engagementValueScore: score.engagementValueScore,
                      promotionRiskScore: score.promotionRiskScore,
                      communityRiskScore: score.communityRiskScore,
                      accountSafetyScore: score.accountSafetyScore,
                      responseConfidenceScore: score.responseConfidenceScore
                    }}
                  />
                  <Inline spread="space-between"><span>Skeptic objection</span><strong>{score.skepticObjectionStrength}</strong></Inline>
                  <Inline spread="space-between"><span>Market insight value</span><strong>{score.marketInsightValueScore}</strong></Inline>
                </Stack>
              ) : (
                <p className="muted-text">No score snapshot is available for this decision trail.</p>
              )}
            </SectionPanel>

            <SectionPanel title="Final decision">
              {decision && run ? (
                <Stack space="space.150">
                  <Inline spread="space-between"><span>Decision</span><strong>{finalDecisionActionLabels[decision.selectedAction]}</strong></Inline>
                  <Inline spread="space-between"><span>Autonomy</span><strong>{autonomyStatusLabels[run.autonomyStatus]}</strong></Inline>
                  <Inline spread="space-between"><span>Product mention</span><strong>{productMentionLabels[decision.productMentionLevel]}</strong></Inline>
                  <Inline spread="space-between"><span>Human approval</span><strong>{decision.humanApprovalRequired ? "Required" : "Not required"}</strong></Inline>
                  <Inline spread="space-between"><span>Auto-engage</span><strong>{decision.autoEngageAllowed ? "Allowed" : "Blocked"}</strong></Inline>
                  {decision.blockedReason ? <p className="status-risk">{decision.blockedReason}</p> : null}
                  <p>{decision.finalReasoning}</p>
                  {decision.approvedDraft ? <TextArea value={decision.approvedDraft} minimumRows={10} isReadOnly /> : null}
                </Stack>
              ) : (
                <p className="muted-text">No final decision yet.</p>
              )}
            </SectionPanel>

            <SectionPanel title="Linked records">
              <Stack space="space.100">
                {opp ? <Button appearance="primary" href={`/response-studio?opportunity=${opp.id}`}>Open Review Studio</Button> : null}
                {opp ? <Button href={`/opportunities/${opp.id}`}>Open Review Inbox item</Button> : null}
                <Button href="/action-log">Open audit log</Button>
              </Stack>
            </SectionPanel>
          </Stack>
        </aside>
      </div>
    </>
  );
}
