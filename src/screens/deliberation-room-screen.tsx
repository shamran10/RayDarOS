"use client";

import { useEffect, useMemo, useState } from "react";
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
import {
  AutonomyStatusLozenge,
  CandidateStatusLozenge
} from "@/components/status-lozenge";
import { loadOpportunityDetail } from "@/lib/deliberation/client";
import { useDeliberation } from "@/lib/deliberation/context";
import type {
  DeliberationRunDetail,
  OpportunityDetail
} from "@/lib/deliberation/contracts";
import { useDiscovery } from "@/lib/discovery/context";
import {
  autonomyStatusLabels,
  candidateTypeLabels,
  finalDecisionActionLabels,
  productMentionLabels
} from "@/lib/labels";
import { useReydar } from "@/lib/store";

type DetailStatus = "idle" | "loading" | "ready" | "error";

export function DeliberationRoomScreen() {
  const searchParams = useSearchParams();
  const { activeProject } = useReydar();
  const { snapshot, status: discoveryStatus } = useDiscovery();
  const {
    opportunities,
    startCandidate,
    rerunOpportunity,
    status: opportunityStatus
  } = useDeliberation();
  const requestedCandidate = searchParams.get("candidate");
  const projectCandidates = snapshot.conversationCandidates.filter(
    (candidate) => candidate.projectId === activeProject.id
  );
  const [selectedId, setSelectedId] = useState(
    requestedCandidate ?? projectCandidates[0]?.id ?? ""
  );
  const [detail, setDetail] = useState<OpportunityDetail>();
  const [detailStatus, setDetailStatus] = useState<DetailStatus>("idle");
  const [detailError, setDetailError] = useState<string>();
  const [selectedRunId, setSelectedRunId] = useState<string>();
  const [running, setRunning] = useState(false);
  const candidate =
    projectCandidates.find((item) => item.id === selectedId) ??
    projectCandidates[0];
  const summary = candidate
    ? opportunities.find((item) => item.candidate.id === candidate.id)
    : undefined;
  const candidateOptions = useMemo(
    () =>
      projectCandidates.map((item) => ({
        label: item.title,
        value: item.id
      })),
    [projectCandidates]
  );

  useEffect(() => {
    if (!selectedId && projectCandidates[0]) {
      setSelectedId(projectCandidates[0].id);
    }
  }, [projectCandidates, selectedId]);

  useEffect(() => {
    if (!summary) {
      setDetail(undefined);
      setDetailStatus("idle");
      setSelectedRunId(undefined);
      return;
    }

    let cancelled = false;
    setDetailStatus("loading");
    setDetailError(undefined);
    void loadOpportunityDetail(activeProject.id, summary.opportunity.id)
      .then((loaded) => {
        if (cancelled) return;
        setDetail(loaded);
        setSelectedRunId(loaded.latestRun?.run.id ?? loaded.runs[0]?.run.id);
        setDetailStatus("ready");
      })
      .catch((loadError) => {
        if (cancelled) return;
        setDetail(undefined);
        setDetailStatus("error");
        setDetailError(
          loadError instanceof Error
            ? loadError.message
            : "The deliberation history could not be loaded."
        );
      });

    return () => {
      cancelled = true;
    };
  }, [activeProject.id, summary]);

  const selectedRun: DeliberationRunDetail | undefined =
    detail?.runs.find((item) => item.run.id === selectedRunId) ??
    detail?.latestRun ??
    detail?.runs[0];

  const runAction = async () => {
    if (!candidate) return;
    setRunning(true);
    setDetailError(undefined);
    try {
      const result = summary
        ? await rerunOpportunity(summary.opportunity.id)
        : await startCandidate(candidate.id);
      setDetail(result.opportunity);
      setSelectedRunId(
        result.opportunity.runs[0]?.run.id ??
          result.opportunity.latestRun?.run.id
      );
      setDetailStatus("ready");
    } catch (runError) {
      setDetailError(
        runError instanceof Error
          ? runError.message
          : "The deliberation could not be run."
      );
    } finally {
      setRunning(false);
    }
  };

  if (
    (discoveryStatus === "loading" || opportunityStatus === "loading") &&
    !candidate
  ) {
    return (
      <EmptyState
        header="Loading deliberation workspace"
        description="ReydarOS is loading persisted candidates and run history."
      />
    );
  }

  if (!candidate) {
    return (
      <EmptyState
        header="No candidates to deliberate"
        description="Run the autonomous pipeline to persist a candidate first."
        primaryAction={
          <Button appearance="primary" href="/signal-discovery">
            Run autonomous pipeline
          </Button>
        }
      />
    );
  }

  return (
    <>
      <PageHeading
        title="Deliberation Debug"
        description="Inspect immutable, database-backed eight-agent decision history."
        breadcrumbs={[
          { text: "ReydarOS", href: "/" },
          { text: "Deliberation Debug", href: "/deliberation" }
        ]}
        action={
          <Inline space="space.100" shouldWrap>
            <select
              value={candidate.id}
              onChange={(event) => setSelectedId(event.currentTarget.value)}
              aria-label="Select candidate"
            >
              {candidateOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <LoadingButton
              appearance="primary"
              isLoading={running}
              isDisabled={detailStatus === "loading"}
              onClick={() => void runAction()}
            >
              {summary ? "Re-run decision" : "Start deliberation"}
            </LoadingButton>
          </Inline>
        }
      />

      {detailError ? (
        <Box paddingBlockEnd="space.200">
          <Banner appearance="warning">{detailError}</Banner>
        </Box>
      ) : null}
      {selectedRun?.decision && !selectedRun.decision.autoEngageAllowed ? (
        <Box paddingBlockEnd="space.200">
          <Banner appearance="warning">
            {selectedRun.decision.policyResult}
          </Banner>
        </Box>
      ) : null}

      <div className="deliberation-workspace">
        <SectionPanel
          title="Conversation context"
          description={`${candidate.platform} / ${candidate.community}`}
        >
          <Stack space="space.150">
            <Inline space="space.100" shouldWrap>
              <CandidateStatusLozenge value={candidate.status} />
              <Badge>{candidateTypeLabels[candidate.candidateType]}</Badge>
              {selectedRun ? (
                <AutonomyStatusLozenge value={selectedRun.run.autonomyStatus} />
              ) : null}
            </Inline>
            <strong>{candidate.title}</strong>
            <p>{candidate.candidateSummary}</p>
            <TextArea value={candidate.body} minimumRows={14} isReadOnly />
            <Stack space="space.050">
              <span>
                <strong>Detected intent:</strong> {candidate.detectedIntent}
              </span>
              <span>
                <strong>Detected pain:</strong> {candidate.detectedPainPoint}
              </span>
              <span>
                <strong>Why analyze:</strong> {candidate.whyWorthAnalyzing}
              </span>
            </Stack>
          </Stack>
        </SectionPanel>

        <SectionPanel
          title="Agent deliberation"
          description="Each persisted run keeps all eight arguments and risk flags."
        >
          {detailStatus === "loading" ? (
            <p className="muted-text">Loading persisted run history…</p>
          ) : selectedRun ? (
            <Stack space="space.150">
              <Inline spread="space-between" shouldWrap>
                <strong>
                  Revision {selectedRun.run.revision} ·{" "}
                  {selectedRun.run.status.replaceAll("_", " ")}
                </strong>
                {detail && detail.runs.length > 1 ? (
                  <select
                    aria-label="Select deliberation revision"
                    value={selectedRun.run.id}
                    onChange={(event) =>
                      setSelectedRunId(event.currentTarget.value)
                    }
                  >
                    {detail.runs.map((item) => (
                      <option key={item.run.id} value={item.run.id}>
                        Revision {item.run.revision} · {item.run.status}
                      </option>
                    ))}
                  </select>
                ) : null}
              </Inline>
              {selectedRun.run.errors.length ? (
                <Banner appearance="warning">
                  {selectedRun.run.errors.join(" ")}
                </Banner>
              ) : null}
              <div className="agent-list">
                {selectedRun.agentResults.map((agent) => (
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
            </Stack>
          ) : (
            <EmptyState
              header="Deliberation has not run"
              description="Start the deterministic eight-agent process for this candidate."
              primaryAction={
                <LoadingButton
                  appearance="primary"
                  isLoading={running}
                  onClick={() => void runAction()}
                >
                  Start deliberation
                </LoadingButton>
              }
            />
          )}
        </SectionPanel>

        <aside className="right-panel-sticky">
          <Stack space="space.200">
            <SectionPanel title="Scores">
              {selectedRun?.score ? (
                <Stack space="space.150">
                  <ScoreList scores={selectedRun.score} />
                  <Inline spread="space-between">
                    <span>Skeptic objection</span>
                    <strong>{selectedRun.score.skepticObjectionStrength}</strong>
                  </Inline>
                  <Inline spread="space-between">
                    <span>Market insight value</span>
                    <strong>{selectedRun.score.marketInsightValueScore}</strong>
                  </Inline>
                </Stack>
              ) : (
                <p className="muted-text">
                  No score snapshot is available for this run.
                </p>
              )}
            </SectionPanel>

            <SectionPanel title="Final decision">
              {selectedRun?.decision ? (
                <Stack space="space.150">
                  <Inline spread="space-between">
                    <span>Decision</span>
                    <strong>
                      {
                        finalDecisionActionLabels[
                          selectedRun.decision.selectedAction
                        ]
                      }
                    </strong>
                  </Inline>
                  <Inline spread="space-between">
                    <span>Autonomy</span>
                    <strong>
                      {autonomyStatusLabels[selectedRun.run.autonomyStatus]}
                    </strong>
                  </Inline>
                  <Inline spread="space-between">
                    <span>Product mention</span>
                    <strong>
                      {
                        productMentionLabels[
                          selectedRun.decision.productMentionLevel
                        ]
                      }
                    </strong>
                  </Inline>
                  <Inline spread="space-between">
                    <span>Human approval</span>
                    <strong>
                      {selectedRun.decision.humanApprovalRequired
                        ? "Required"
                        : "Not required"}
                    </strong>
                  </Inline>
                  {selectedRun.decision.blockedReason ? (
                    <p className="status-risk">
                      {selectedRun.decision.blockedReason}
                    </p>
                  ) : null}
                  <p>{selectedRun.decision.finalReasoning}</p>
                </Stack>
              ) : (
                <p className="muted-text">No final decision exists for this run.</p>
              )}
            </SectionPanel>

            <SectionPanel title="Linked records">
              <Stack space="space.100">
                {detail ? (
                  <Button href={`/opportunities/${detail.opportunity.id}`}>
                    Open opportunity detail
                  </Button>
                ) : null}
                <Button href="/candidates">Open Candidate Map</Button>
              </Stack>
            </SectionPanel>
          </Stack>
        </aside>
      </div>
    </>
  );
}
