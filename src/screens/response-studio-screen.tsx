"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Button from "@atlaskit/button";
import Banner from "@atlaskit/banner";
import Flag, { FlagGroup } from "@atlaskit/flag";
import Select from "@/components/apple-select";
import Tabs, { Tab, TabList, TabPanel } from "@atlaskit/tabs";
import TextArea from "@atlaskit/textarea";
import Tooltip from "@atlaskit/tooltip";
import CheckIcon from "@atlaskit/icon/core/check-mark";
import CrossIcon from "@atlaskit/icon/core/cross";
import { Box, Inline, Stack } from "@atlaskit/primitives";
import { PageHeading } from "@/components/page-heading";
import { ScoreList } from "@/components/score-list";
import { SectionPanel } from "@/components/section-panel";
import { AutonomyStatusLozenge, RiskLozenge } from "@/components/status-lozenge";
import { finalDecisionActionLabels, productMentionLabels, responseTypeLabels } from "@/lib/labels";
import { useReydar } from "@/lib/store";
import type { ResponseDraft } from "@/lib/types";

function rewrite(text: string, command: string) {
  if (command === "shorter") return text.split("\n").slice(0, 2).join("\n").slice(0, 500);
  if (command === "casual") return text.replaceAll("I would", "I'd").replaceAll("usually", "often");
  if (command === "less_promotional") return text.replace(/Disclosure:[\s\S]*/i, "").replaceAll("product", "workflow");
  if (command === "remove_product") return text.replace(/Disclosure:[\s\S]*/i, "").replace(/The925|SUITS|Polaris|BUOST|ReydarOS/g, "a lightweight workflow tool");
  if (command === "disclosure") return `${text.trim()}\n\nDisclosure: I work on this product area, so treat this as biased but hopefully useful context.`;
  if (command === "technical") return `${text.trim()}\n\nThe operational test I would use is whether each state has an owner, due date, escalation path, and audit trail.`;
  if (command === "steps") return `${text.trim()}\n\nPractical steps: map the workflow, remove optional steps, assign owners, set review dates, and inspect the first few cases after the change.`;
  if (command === "avoid_links") return text.replace(/https?:\/\/\S+/g, "").replace("link", "reference");
  return `${text.trim()}\n\nAlternate angle: start by answering the process question before mentioning any tool.`;
}

export function ResponseStudioScreen() {
  const searchParams = useSearchParams();
  const {
    state,
    updateDraft,
    setDraftStatus,
    updateOpportunityStatus,
    saveInsight
  } = useReydar();
  const requestedOpportunity = searchParams.get("opportunity");
  const opportunitiesWithDrafts = state.opportunities.filter((opportunity) =>
    state.responseDrafts.some((draft) => draft.opportunityId === opportunity.id)
  );
  const [selectedOpportunityId, setSelectedOpportunityId] = useState(
    requestedOpportunity ?? opportunitiesWithDrafts[0]?.id ?? ""
  );
  const opportunity = state.opportunities.find((item) => item.id === selectedOpportunityId);
  const drafts = state.responseDrafts.filter((draft) => draft.opportunityId === selectedOpportunityId);
  const [selectedDraftId, setSelectedDraftId] = useState(drafts[0]?.id ?? "");
  const selectedDraft = drafts.find((draft) => draft.id === selectedDraftId) ?? drafts[0];
  const checks = state.guardrailChecks.filter((check) => check.opportunityId === selectedOpportunityId);
  const candidate = state.conversationCandidates.find((item) => item.opportunityId === selectedOpportunityId);
  const deliberation = candidate ? state.deliberationRuns.find((item) => item.candidateId === candidate.id) : undefined;
  const finalDecision = deliberation ? state.finalDecisions.find((item) => item.deliberationRunId === deliberation.id) : undefined;
  const [flag, setFlag] = useState<string | null>(null);

  const opportunityOptions = useMemo(
    () => opportunitiesWithDrafts.map((item) => ({ label: item.threadTitle, value: item.id })),
    [opportunitiesWithDrafts]
  );

  const applyRewrite = (command: string) => {
    if (!selectedDraft) return;
    updateDraft(selectedDraft.id, rewrite(selectedDraft.responseText, command));
    setFlag("Draft rewritten.");
  };

  const saveAsInsight = () => {
    if (!opportunity) return;
    saveInsight({
      id: `insight-${Date.now()}`,
      projectId: opportunity.projectId,
      opportunityId: opportunity.id,
      category: "Audience language",
      title: `Response learning from ${opportunity.community}`,
      insight: `Draft review captured language around ${opportunity.painPoint}.`,
      source: opportunity.threadUrl || opportunity.community,
      confidence: opportunity.scores.responseConfidenceScore / 100,
      approved: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    updateOpportunityStatus(opportunity.id, "saved_as_insight");
    setFlag("Saved as market insight.");
  };

  const approveDraft = () => {
    if (!selectedDraft || !opportunity) return;
    setDraftStatus(selectedDraft.id, "approved");
    updateOpportunityStatus(opportunity.id, "approved");
    setFlag("Draft approved for governed execution.");
  };

  const rejectDraft = () => {
    if (!selectedDraft || !opportunity) return;
    setDraftStatus(selectedDraft.id, "rejected");
    updateOpportunityStatus(opportunity.id, "rejected");
    setFlag("Draft rejected.");
  };

  return (
    <>
      <PageHeading
        title="Review Studio"
        description="Review, rewrite, approve, or reject approval-gated response drafts from the autonomous pipeline."
        breadcrumbs={[{ text: "ReydarOS", href: "/" }, { text: "Review Studio", href: "/response-studio" }]}
      />

      {!opportunity || !selectedDraft ? (
        <SectionPanel title="No draft selected">
          <Stack space="space.200">
            <Select
              className="conversation-select"
              isSearchable={false}
              placeholder="Select opportunity"
              options={opportunityOptions}
              value={opportunityOptions.find((option) => option.value === selectedOpportunityId)}
              onChange={(option) => {
                const next = String(option?.value ?? "");
                setSelectedOpportunityId(next);
                setSelectedDraftId(state.responseDrafts.find((draft) => draft.opportunityId === next)?.id ?? "");
              }}
            />
          </Stack>
        </SectionPanel>
      ) : (
        <>
          {checks.some((check) => !check.passed) || opportunity.riskLevel === "high" || opportunity.riskLevel === "blocked" ? (
            <Box paddingBlockEnd="space.200">
              <Banner appearance="warning">Safety warnings require review before approval.</Banner>
            </Box>
          ) : null}
          <div className="three-column-workspace">
            <SectionPanel title="Conversation context">
              <Stack space="space.200">
                <Select
                  className="conversation-select"
                  isSearchable={false}
                  options={opportunityOptions}
                  value={opportunityOptions.find((option) => option.value === selectedOpportunityId)}
                  onChange={(option) => {
                    const next = String(option?.value ?? "");
                    setSelectedOpportunityId(next);
                    setSelectedDraftId(state.responseDrafts.find((draft) => draft.opportunityId === next)?.id ?? "");
                  }}
                />
                <Stack space="space.100">
                  <strong>{opportunity.threadTitle}</strong>
                  <span className="muted-text">{opportunity.platform} / {opportunity.community}</span>
                  <span>{opportunity.conversationSummary}</span>
                </Stack>
                <TextArea value={opportunity.sourceText} minimumRows={12} isReadOnly />
              </Stack>
            </SectionPanel>

            <SectionPanel title="Response editor" description={selectedDraft.reasoning}>
              <Stack space="space.200">
                <Tabs id="draft-option-tabs" onChange={(index) => setSelectedDraftId(drafts[index]?.id ?? selectedDraft.id)}>
                  <TabList>
                    {drafts.map((draft) => (
                      <Tab key={draft.id}>{responseTypeLabels[draft.responseType]}</Tab>
                    ))}
                  </TabList>
                  {drafts.map((draft) => (
                    <TabPanel key={draft.id}>
                      <div className="draft-editor-field">
                        <TextArea
                          value={draft.responseText}
                          onChange={(event) => updateDraft(draft.id, event.currentTarget.value)}
                          minimumRows={18}
                        />
                        <span className="small-text muted-text">{productMentionLabels[draft.productMentionLevel]}</span>
                      </div>
                    </TabPanel>
                  ))}
                </Tabs>
                <Stack space="space.100">
                  <Inline space="space.100" shouldWrap>
                    {[
                      ["shorter", "Make it shorter"],
                      ["casual", "More casual"],
                      ["less_promotional", "Less promotional"],
                      ["remove_product", "Remove product mention"],
                      ["disclosure", "Add disclosure"],
                      ["technical", "More technical"],
                      ["steps", "Add practical steps"],
                      ["avoid_links", "Avoid links"],
                      ["alternate", "Generate alternate"]
                    ].map(([command, label]) => (
                      <Button key={command} onClick={() => applyRewrite(command)}>{label}</Button>
                    ))}
                  </Inline>
                  <Inline space="space.100" shouldWrap>
                    <Tooltip content="Save current draft text">
                      <Button onClick={() => setFlag("Draft saved.")}>Save draft</Button>
                    </Tooltip>
                    <Button appearance="primary" iconBefore={<CheckIcon label="" />} onClick={approveDraft}>Approve</Button>
                    <Button iconBefore={<CrossIcon label="" />} onClick={rejectDraft}>Reject</Button>
                  </Inline>
                  <Inline space="space.100" shouldWrap>
                    <Button onClick={saveAsInsight}>Save as market insight</Button>
                    <Button onClick={saveAsInsight}>Add to objection library</Button>
                    <Button onClick={() => setFlag("Community rule note captured as activity.")}>Add community rule note</Button>
                  </Inline>
                </Stack>
              </Stack>
            </SectionPanel>

            <SectionPanel title="Strategy, risk, and guardrails">
              <Stack space="space.200">
                <Inline space="space.100">
                  <RiskLozenge value={selectedDraft.riskLevel} />
                  <span className="small-text muted-text">{productMentionLabels[selectedDraft.productMentionLevel]}</span>
                </Inline>
                <ScoreList scores={opportunity.scores} />
                {deliberation && finalDecision ? (
                  <div className="panel-muted">
                    <Box padding="space.150">
                      <Stack space="space.100">
                        <strong>Deliberation decision</strong>
                      <Inline spread="space-between"><span>Autonomy</span><AutonomyStatusLozenge value={deliberation.autonomyStatus} /></Inline>
                      <Inline spread="space-between"><span>Final decision</span><strong>{finalDecisionActionLabels[finalDecision.selectedAction]}</strong></Inline>
                      <Inline spread="space-between"><span>Auto-engage</span><strong>{finalDecision.autoEngageAllowed ? "Allowed" : "Blocked"}</strong></Inline>
                      <Button href={`/deliberation?candidate=${candidate?.id}`}>Inspect decision trail</Button>
                      </Stack>
                    </Box>
                  </div>
                ) : null}
                <Stack space="space.100">
                  {checks.map((check) => (
                    <div className="panel-muted" key={check.id}>
                      <Box padding="space.150">
                        <Stack space="space.050">
                          <Inline spread="space-between">
                            <strong>{check.checkType}</strong>
                            <RiskLozenge value={check.severity} />
                          </Inline>
                          <span className="small-text muted-text">{check.description}</span>
                        </Stack>
                      </Box>
                    </div>
                  ))}
                </Stack>
              </Stack>
            </SectionPanel>
          </div>
        </>
      )}

      <FlagGroup onDismissed={() => setFlag(null)}>
        {flag ? <Flag id="response-studio-flag" title="Review Studio" description={flag} appearance="success" /> : null}
      </FlagGroup>
    </>
  );
}
