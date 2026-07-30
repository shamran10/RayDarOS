"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Badge from "@atlaskit/badge";
import Banner from "@atlaskit/banner";
import Button, { LoadingButton } from "@atlaskit/button";
import EmptyState from "@atlaskit/empty-state";
import SectionMessage from "@atlaskit/section-message";
import Tabs, { Tab, TabList, TabPanel } from "@atlaskit/tabs";
import TextArea from "@atlaskit/textarea";
import { Box, Inline, Stack } from "@atlaskit/primitives";
import { PageHeading } from "@/components/page-heading";
import { ScoreList } from "@/components/score-list";
import { SectionPanel } from "@/components/section-panel";
import {
  AutonomyStatusLozenge,
  CandidateStatusLozenge,
  OpportunityStatusLozenge,
  RiskLozenge
} from "@/components/status-lozenge";
import { loadOpportunityDetail } from "@/lib/deliberation/client";
import { useDeliberation } from "@/lib/deliberation/context";
import type {
  DeliberationRunDetail,
  OpportunityDetail
} from "@/lib/deliberation/contracts";
import {
  candidateTypeLabels,
  finalDecisionActionLabels,
  productMentionLabels,
  recommendedActionLabels,
  responseTypeLabels
} from "@/lib/labels";
import { useReydar } from "@/lib/store";

type DetailStatus = "loading" | "ready" | "error" | "not_found";

export function OpportunityDetailScreen({
  opportunityId
}: {
  opportunityId: string;
}) {
  const { activeProject } = useReydar();
  const { rerunOpportunity } = useDeliberation();
  const [detail, setDetail] = useState<OpportunityDetail>();
  const [status, setStatus] = useState<DetailStatus>("loading");
  const [error, setError] = useState<string>();
  const [selectedRunId, setSelectedRunId] = useState<string>();
  const [rerunning, setRerunning] = useState(false);

  const load = async () => {
    setStatus("loading");
    setError(undefined);
    try {
      const loaded = await loadOpportunityDetail(
        activeProject.id,
        opportunityId
      );
      setDetail(loaded);
      setSelectedRunId(
        loaded.latestRun?.run.id ?? loaded.runs[0]?.run.id
      );
      setStatus("ready");
    } catch (loadError) {
      setDetail(undefined);
      const message =
        loadError instanceof Error
          ? loadError.message
          : "The opportunity could not be loaded.";
      setError(message);
      setStatus(message.toLowerCase().includes("not found") ? "not_found" : "error");
    }
  };

  useEffect(() => {
    if (activeProject.id) {
      void load();
    }
    // The route identity and selected project fully define this request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProject.id, opportunityId]);

  const rerun = async () => {
    if (!detail) return;
    setRerunning(true);
    setError(undefined);
    try {
      const result = await rerunOpportunity(detail.opportunity.id);
      setDetail(result.opportunity);
      setSelectedRunId(result.opportunity.runs[0]?.run.id);
    } catch (runError) {
      setError(
        runError instanceof Error
          ? runError.message
          : "The deliberation could not be re-run."
      );
    } finally {
      setRerunning(false);
    }
  };

  if (status === "loading") {
    return (
      <EmptyState
        header="Loading opportunity"
        description="ReydarOS is loading the persisted candidate and deliberation history."
      />
    );
  }

  if (!detail) {
    return (
      <EmptyState
        header={status === "not_found" ? "Opportunity not found" : "Opportunity unavailable"}
        description={
          error ??
          "The selected opportunity could not be loaded from the project workspace."
        }
        primaryAction={
          status === "error" ? (
            <Button appearance="primary" onClick={() => void load()}>
              Retry
            </Button>
          ) : (
            <Button href="/opportunities">Back to opportunities</Button>
          )
        }
      />
    );
  }

  const { opportunity, candidate, sourceTrail } = detail;
  const selectedRun: DeliberationRunDetail | undefined =
    detail.runs.find((item) => item.run.id === selectedRunId) ??
    detail.latestRun ??
    detail.runs[0];

  return (
    <>
      <PageHeading
        title={opportunity.threadTitle}
        description={`${opportunity.platform} / ${opportunity.community}`}
        breadcrumbs={[
          { text: "Opportunities", href: "/opportunities" },
          {
            text: opportunity.threadTitle,
            href: `/opportunities/${opportunity.id}`
          }
        ]}
        action={
          <Inline space="space.100" shouldWrap>
            <Button href={`/deliberation?candidate=${candidate.id}`}>
              Open deliberation
            </Button>
            <LoadingButton
              appearance="primary"
              isLoading={rerunning}
              onClick={() => void rerun()}
            >
              Re-run decision
            </LoadingButton>
          </Inline>
        }
      />

      {error ? (
        <Box paddingBlockEnd="space.200">
          <Banner appearance="warning">{error}</Banner>
        </Box>
      ) : null}
      {selectedRun?.run.errors.length ? (
        <Box paddingBlockEnd="space.200">
          <Banner appearance="warning">
            {selectedRun.run.errors.join(" ")}
          </Banner>
        </Box>
      ) : null}

      <div className="two-column-workspace">
        <Stack space="space.200">
          <SectionPanel title="Persisted opportunity trail">
            <Tabs id="opportunity-detail-tabs">
              <TabList>
                <Tab>Analysis</Tab>
                <Tab>Candidate trail</Tab>
                <Tab>Deliberation</Tab>
                <Tab>Run history</Tab>
              </TabList>
              <TabPanel>
                <Stack space="space.200">
                  <SectionMessage appearance="information" title="Final reasoning">
                    <p>{opportunity.reasoning}</p>
                  </SectionMessage>
                  <div className="dense-grid">
                    <SectionPanel title="Original source">
                      <Stack space="space.100">
                        {sourceTrail.sourceUrl ? (
                          <Link href={sourceTrail.sourceUrl}>Open source URL</Link>
                        ) : (
                          <span className="muted-text">No source URL</span>
                        )}
                        <TextArea
                          value={opportunity.sourceText}
                          minimumRows={8}
                          isReadOnly
                        />
                      </Stack>
                    </SectionPanel>
                    <SectionPanel title="Conversation summary">
                      <Stack space="space.150">
                        <p>{opportunity.conversationSummary}</p>
                        <strong>User problem</strong>
                        <p>{opportunity.userProblem}</p>
                      </Stack>
                    </SectionPanel>
                    <SectionPanel title="Fit and intent">
                      <Stack space="space.150">
                        <strong>Relevant pain point</strong>
                        <p>{opportunity.painPoint}</p>
                        <strong>Audience match</strong>
                        <p>{opportunity.audienceMatch}</p>
                        <strong>Product fit explanation</strong>
                        <p>{opportunity.productFitExplanation}</p>
                      </Stack>
                    </SectionPanel>
                    <SectionPanel title="Suggested next step">
                      <Stack space="space.150">
                        <Inline spread="space-between">
                          <span>Recommended action</span>
                          <strong>
                            {recommendedActionLabels[opportunity.recommendedAction]}
                          </strong>
                        </Inline>
                        <Inline spread="space-between">
                          <span>Response type</span>
                          <strong>
                            {responseTypeLabels[opportunity.responseType]}
                          </strong>
                        </Inline>
                        <Inline spread="space-between">
                          <span>Product mention</span>
                          <strong>
                            {productMentionLabels[opportunity.productMentionLevel]}
                          </strong>
                        </Inline>
                      </Stack>
                    </SectionPanel>
                  </div>
                </Stack>
              </TabPanel>
              <TabPanel>
                <SectionPanel
                  title={candidate.title}
                  description={candidate.candidateSummary}
                  action={
                    <Button href={`/candidates?candidate=${candidate.id}`}>
                      Inspect candidate
                    </Button>
                  }
                >
                  <Stack space="space.150">
                    <Inline space="space.100" shouldWrap>
                      <CandidateStatusLozenge value={candidate.status} />
                      <Badge>{candidateTypeLabels[candidate.candidateType]}</Badge>
                    </Inline>
                    <div className="dense-grid">
                      <Inline spread="space-between">
                        <span>Project</span>
                        <strong>{candidate.projectId}</strong>
                      </Inline>
                      <Inline spread="space-between">
                        <span>Discovery run</span>
                        <strong>{sourceTrail.discoveryRunId ?? "Not linked"}</strong>
                      </Inline>
                      <Inline spread="space-between">
                        <span>Discovered item</span>
                        <strong>{sourceTrail.discoveredItemId ?? "Not linked"}</strong>
                      </Inline>
                      <Inline spread="space-between">
                        <span>Candidate</span>
                        <strong>{candidate.id}</strong>
                      </Inline>
                      <Inline spread="space-between">
                        <span>Opportunity</span>
                        <strong>{opportunity.id}</strong>
                      </Inline>
                    </div>
                  </Stack>
                </SectionPanel>
              </TabPanel>
              <TabPanel>
                {selectedRun ? (
                  <Stack space="space.150">
                    {selectedRun.decision ? (
                      <SectionMessage appearance="information" title="Final Judge">
                        <p>{selectedRun.decision.finalReasoning}</p>
                      </SectionMessage>
                    ) : null}
                    <div className="dense-grid">
                      <Inline spread="space-between">
                        <span>Run</span>
                        <strong>
                          Revision {selectedRun.run.revision} · {selectedRun.run.status}
                        </strong>
                      </Inline>
                      <Inline spread="space-between">
                        <span>Decision</span>
                        <strong>
                          {selectedRun.decision
                            ? finalDecisionActionLabels[
                                selectedRun.decision.selectedAction
                              ]
                            : "No decision"}
                        </strong>
                      </Inline>
                      <Inline spread="space-between">
                        <span>Autonomy</span>
                        <AutonomyStatusLozenge
                          value={selectedRun.run.autonomyStatus}
                        />
                      </Inline>
                    </div>
                    <SectionPanel title="Eight-agent record">
                      <Stack space="space.100">
                        {selectedRun.agentResults.map((agent) => (
                          <div className="panel-muted" key={agent.id}>
                            <Box padding="space.150">
                              <Inline spread="space-between">
                                <strong>{agent.agentName}</strong>
                                <span>
                                  {agent.recommendation} · {agent.score}
                                </span>
                              </Inline>
                              <p>{agent.reasoning}</p>
                            </Box>
                          </div>
                        ))}
                      </Stack>
                    </SectionPanel>
                  </Stack>
                ) : (
                  <EmptyState
                    header="No deliberation yet"
                    description="Start deliberation from the Candidate Map."
                  />
                )}
              </TabPanel>
              <TabPanel>
                <Stack space="space.100">
                  {detail.runs.map((item) => (
                    <button
                      type="button"
                      className="panel-muted link-button"
                      key={item.run.id}
                      onClick={() => setSelectedRunId(item.run.id)}
                    >
                      <Box padding="space.150">
                        <Inline spread="space-between" shouldWrap>
                          <strong>Revision {item.run.revision}</strong>
                          <span>
                            {item.run.status} ·{" "}
                            {new Date(item.run.startedAt).toLocaleString()}
                          </span>
                        </Inline>
                      </Box>
                    </button>
                  ))}
                </Stack>
              </TabPanel>
            </Tabs>
          </SectionPanel>
        </Stack>

        <aside className="right-panel-sticky">
          <Stack space="space.200">
            <SectionPanel title="Scores">
              {selectedRun?.score ? (
                <ScoreList scores={selectedRun.score} />
              ) : (
                <p className="muted-text">No score exists for this run.</p>
              )}
            </SectionPanel>
            <SectionPanel title="Status and metadata">
              <Stack space="space.150">
                <Inline spread="space-between">
                  <span>Opportunity</span>
                  <OpportunityStatusLozenge value={opportunity.status} />
                </Inline>
                <Inline spread="space-between">
                  <span>Risk</span>
                  <RiskLozenge value={opportunity.riskLevel} />
                </Inline>
                <Inline spread="space-between">
                  <span>Intent</span>
                  <strong>{opportunity.intentLevel}</strong>
                </Inline>
                <Inline spread="space-between">
                  <span>Run count</span>
                  <strong>{detail.runs.length}</strong>
                </Inline>
              </Stack>
            </SectionPanel>
          </Stack>
        </aside>
      </div>
    </>
  );
}
