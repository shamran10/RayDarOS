"use client";

import { FormEvent, useState } from "react";
import Button from "@atlaskit/button";
import Banner from "@atlaskit/banner";
import EmptyState from "@atlaskit/empty-state";
import Select from "@/components/apple-select";
import SectionMessage from "@atlaskit/section-message";
import Tabs, { Tab, TabList, TabPanel } from "@atlaskit/tabs";
import TextArea from "@atlaskit/textarea";
import Textfield from "@atlaskit/textfield";
import { Box, Inline, Stack } from "@atlaskit/primitives";
import { Field } from "@/components/field";
import { PageHeading } from "@/components/page-heading";
import { ScoreList } from "@/components/score-list";
import { SectionPanel } from "@/components/section-panel";
import { AutonomyStatusLozenge, CandidateStatusLozenge, OpportunityStatusLozenge, RiskLozenge } from "@/components/status-lozenge";
import { candidateTypeLabels, finalDecisionActionLabels, productMentionLabels, recommendedActionLabels, responseTypeLabels } from "@/lib/labels";
import { useReydar } from "@/lib/store";

const outcomeOptions = [
  { label: "Rejected", value: "rejected" },
  { label: "Saved as insight", value: "saved_as_insight" },
  { label: "Monitor for follow-up", value: "monitoring" },
  { label: "Positive reply", value: "positive_reply" },
  { label: "Negative reply", value: "negative_reply" },
  { label: "Removed", value: "removed" }
];

export function OpportunityDetailScreen({ opportunityId }: { opportunityId: string }) {
  const { state, updateOpportunityStatus, logOutcome } = useReydar();
  const opportunity = state.opportunities.find((item) => item.id === opportunityId);
  const [outcome, setOutcome] = useState({
    outcomeType: "saved_as_insight",
    notes: "",
    postedUrl: ""
  });

  if (!opportunity) {
    return (
      <EmptyState
        header="Opportunity not found"
        description="The selected conversation could not be found in the local workspace."
        primaryAction={<Button href="/opportunities">Back to inbox</Button>}
      />
    );
  }

  const project = state.projects.find((item) => item.id === opportunity.projectId);
  const drafts = state.responseDrafts.filter((draft) => draft.opportunityId === opportunity.id);
  const checks = state.guardrailChecks.filter((check) => check.opportunityId === opportunity.id);
  const insights = state.marketInsights.filter((insight) => insight.opportunityId === opportunity.id);
  const outcomes = state.engagementOutcomes.filter((item) => item.opportunityId === opportunity.id);
  const candidates = state.conversationCandidates.filter((candidate) => candidate.opportunityId === opportunity.id);
  const deliberation = candidates[0] ? state.deliberationRuns.find((run) => run.candidateId === candidates[0].id) : undefined;
  const agents = deliberation ? state.deliberationAgentResults.filter((agent) => agent.deliberationRunId === deliberation.id) : [];
  const finalDecision = deliberation ? state.finalDecisions.find((decision) => decision.deliberationRunId === deliberation.id) : undefined;
  const failedChecks = checks.filter((check) => !check.passed);

  const submitOutcome = (event: FormEvent) => {
    event.preventDefault();
    logOutcome({
      opportunityId: opportunity.id,
      responseDraftId: drafts[0]?.id,
      outcomeType: outcome.outcomeType as never,
      notes: outcome.notes,
      postedUrl: outcome.postedUrl
    });
  };

  return (
    <>
      <PageHeading
        title={opportunity.threadTitle}
        description={`${opportunity.platform} / ${opportunity.community}`}
        breadcrumbs={[
          { text: "Review Inbox", href: "/opportunities" },
          { text: opportunity.threadTitle, href: `/opportunities/${opportunity.id}` }
        ]}
        action={<Button appearance="primary" href={`/response-studio?opportunity=${opportunity.id}`}>Open Review Studio</Button>}
      />

      {failedChecks.length || opportunity.riskLevel === "high" || opportunity.riskLevel === "blocked" ? (
        <Box paddingBlockEnd="space.200">
          <Banner appearance="warning">Risk warnings are present. Review guardrails before approving any response.</Banner>
        </Box>
      ) : null}

      <div className="two-column-workspace">
        <Stack space="space.200">
          <SectionPanel title="Opportunity analysis">
            <Tabs id="opportunity-detail-tabs">
              <TabList>
                <Tab>Analysis</Tab>
                <Tab>Candidate Trail</Tab>
                <Tab>Deliberation</Tab>
                <Tab>Drafts</Tab>
                <Tab>Guardrails</Tab>
                <Tab>Insights</Tab>
                <Tab>Learning</Tab>
              </TabList>
              <TabPanel>
                <Stack space="space.200">
                  <SectionMessage appearance="information" title="AI reasoning">
                    <p>{opportunity.reasoning}</p>
                  </SectionMessage>
                  <div className="dense-grid">
                    <SectionPanel title="Original thread details">
                      <Stack space="space.100">
                        <span>{opportunity.threadUrl || "No source URL"}</span>
                        <TextArea value={opportunity.sourceText} minimumRows={8} isReadOnly />
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
                        <Inline spread="space-between"><span>Recommended action</span><strong>{recommendedActionLabels[opportunity.recommendedAction]}</strong></Inline>
                        <Inline spread="space-between"><span>Response type</span><strong>{responseTypeLabels[opportunity.responseType]}</strong></Inline>
                        <Inline spread="space-between"><span>Product mention</span><strong>{productMentionLabels[opportunity.productMentionLevel]}</strong></Inline>
                      </Stack>
                    </SectionPanel>
                  </div>
                </Stack>
              </TabPanel>
              <TabPanel>
                <Stack space="space.150">
                  {candidates.length ? (
                    candidates.map((candidate) => (
                      <SectionPanel
                        key={candidate.id}
                        title={candidate.title}
                        description={candidate.candidateSummary}
                        action={<Button href={`/deliberation?candidate=${candidate.id}`}>Inspect decision trail</Button>}
                      >
                        <div className="dense-grid">
                          <Inline spread="space-between"><span>Type</span><strong>{candidateTypeLabels[candidate.candidateType]}</strong></Inline>
                          <Inline spread="space-between"><span>Status</span><CandidateStatusLozenge value={candidate.status} /></Inline>
                          <Inline spread="space-between"><span>Intent</span><strong>{candidate.detectedIntent}</strong></Inline>
                          <Inline spread="space-between"><span>Pain point</span><strong>{candidate.detectedPainPoint}</strong></Inline>
                          <Inline spread="space-between"><span>Relevance</span><strong>{candidate.initialRelevanceScore}</strong></Inline>
                          <Inline spread="space-between"><span>Risk</span><strong>{candidate.initialRiskScore}</strong></Inline>
                        </div>
                      </SectionPanel>
                    ))
                  ) : (
                    <EmptyState header="No mapped candidates" description="Older fallback opportunities may not have candidate mapping until reanalyzed." />
                  )}
                </Stack>
              </TabPanel>
              <TabPanel>
                {deliberation && finalDecision ? (
                  <Stack space="space.150">
                    <SectionMessage appearance="information" title="Final Judge">
                      <p>{finalDecision.finalReasoning}</p>
                    </SectionMessage>
                    <div className="dense-grid">
                      <Inline spread="space-between"><span>Decision</span><strong>{finalDecisionActionLabels[finalDecision.selectedAction]}</strong></Inline>
                      <Inline spread="space-between"><span>Autonomy</span><AutonomyStatusLozenge value={deliberation.autonomyStatus} /></Inline>
                      <Inline spread="space-between"><span>Auto-engage allowed</span><strong>{finalDecision.autoEngageAllowed ? "Yes" : "No"}</strong></Inline>
                      <Inline spread="space-between"><span>Human approval</span><strong>{finalDecision.humanApprovalRequired ? "Required" : "Not required"}</strong></Inline>
                    </div>
                    <SectionPanel title="Agent debate">
                      <Stack space="space.100">
                        {agents.map((agent) => (
                          <div className="panel-muted" key={agent.id}>
                            <Box padding="space.150">
                              <Inline spread="space-between">
                                <strong>{agent.agentName}</strong>
                                <span>{agent.recommendation} · {agent.score}</span>
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
                    description="The autonomous pipeline creates this decision trail when it analyzes a candidate."
                    primaryAction={candidates[0] ? <Button href={`/deliberation?candidate=${candidates[0].id}`}>Inspect decision trail</Button> : undefined}
                  />
                )}
              </TabPanel>
              <TabPanel>
                <Stack space="space.200">
                  {drafts.map((draft) => (
                    <SectionPanel
                      key={draft.id}
                      title={responseTypeLabels[draft.responseType]}
                      description={draft.reasoning}
                      action={<Button href={`/response-studio?opportunity=${opportunity.id}`}>Review in Studio</Button>}
                    >
                      <Stack space="space.150">
                        <Inline space="space.100">
                          <RiskLozenge value={draft.riskLevel} />
                          <span className="small-text muted-text">{productMentionLabels[draft.productMentionLevel]}</span>
                        </Inline>
                        <TextArea value={draft.responseText} minimumRows={8} isReadOnly />
                      </Stack>
                    </SectionPanel>
                  ))}
                </Stack>
              </TabPanel>
              <TabPanel>
                <Stack space="space.150">
                  {checks.map((check) => (
                    <SectionMessage key={check.id} appearance={check.passed ? "success" : "warning"} title={check.checkType}>
                      <p>{check.description}</p>
                    </SectionMessage>
                  ))}
                </Stack>
              </TabPanel>
              <TabPanel>
                <Stack space="space.150">
                  {insights.map((insight) => (
                    <SectionPanel key={insight.id} title={insight.title} description={insight.category}>
                      <p>{insight.insight}</p>
                    </SectionPanel>
                  ))}
                </Stack>
              </TabPanel>
              <TabPanel>
                <form onSubmit={submitOutcome}>
                  <Stack space="space.200">
                    <Inline space="space.200" shouldWrap>
                      <div className="form-field">
                        <Field label="Outcome">
                          <Select
                            options={outcomeOptions}
                            value={outcomeOptions.find((option) => option.value === outcome.outcomeType)}
                            onChange={(option) => setOutcome((current) => ({ ...current, outcomeType: String(option?.value ?? "saved_as_insight") }))}
                          />
                        </Field>
                      </div>
                      <div className="form-field-wide">
                        <Field label="Source or outcome URL" htmlFor="posted-url">
                          <Textfield
                            id="posted-url"
                            value={outcome.postedUrl}
                            onChange={(event) => setOutcome((current) => ({ ...current, postedUrl: event.currentTarget.value }))}
                          />
                        </Field>
                      </div>
                    </Inline>
                    <Field label="Notes" htmlFor="outcome-notes">
                      <TextArea
                        id="outcome-notes"
                        value={outcome.notes}
                        onChange={(event) => setOutcome((current) => ({ ...current, notes: event.currentTarget.value }))}
                        minimumRows={4}
                      />
                    </Field>
                    <Button appearance="primary" type="submit">Log outcome</Button>
                    {outcomes.length ? (
                      <Stack space="space.100">
                        {outcomes.map((item) => (
                          <div className="panel-muted" key={item.id}>
                            <Box padding="space.150">
                              <Stack space="space.050">
                                <strong>{item.outcomeType.replaceAll("_", " ")}</strong>
                                <span className="muted-text">{item.notes}</span>
                              </Stack>
                            </Box>
                          </div>
                        ))}
                      </Stack>
                    ) : null}
                  </Stack>
                </form>
              </TabPanel>
            </Tabs>
          </SectionPanel>
        </Stack>

        <aside className="right-panel-sticky">
          <Stack space="space.200">
            <SectionPanel title="Scores">
              <ScoreList scores={opportunity.scores} />
            </SectionPanel>
            <SectionPanel title="Risk and metadata">
              <Stack space="space.150">
                <Inline spread="space-between"><span>Status</span><OpportunityStatusLozenge value={opportunity.status} /></Inline>
                <Inline spread="space-between"><span>Risk</span><RiskLozenge value={opportunity.riskLevel} /></Inline>
                <Inline spread="space-between"><span>Intent</span><strong>{opportunity.intentLevel}</strong></Inline>
                <Inline spread="space-between"><span>Project</span><strong>{project?.name ?? "Unknown"}</strong></Inline>
                <Button onClick={() => updateOpportunityStatus(opportunity.id, "do_not_reply")}>Mark do not reply</Button>
                <Button appearance="primary" onClick={() => updateOpportunityStatus(opportunity.id, "approved")}>Approve exception</Button>
              </Stack>
            </SectionPanel>
          </Stack>
        </aside>
      </div>
    </>
  );
}
