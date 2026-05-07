"use client";

import Link from "next/link";
import Badge from "@atlaskit/badge";
import Banner from "@atlaskit/banner";
import Button from "@atlaskit/button";
import DynamicTable from "@atlaskit/dynamic-table";
import EmptyState from "@atlaskit/empty-state";
import { Box, Inline, Stack } from "@atlaskit/primitives";
import { MetricCard } from "@/components/metric-card";
import { PageHeading } from "@/components/page-heading";
import { SectionPanel } from "@/components/section-panel";
import { OpportunityStatusLozenge, RiskLozenge } from "@/components/status-lozenge";
import { recommendedActionLabels } from "@/lib/labels";
import { useReydar } from "@/lib/store";
import { topCounts } from "@/lib/selectors";

export function DashboardScreen() {
  const { state } = useReydar();
  const highPriority = state.opportunities.filter(
    (opportunity) => opportunity.scores.intentScore >= 75 && opportunity.riskLevel !== "high"
  );
  const pendingDrafts = state.responseDrafts.filter((draft) => draft.status === "draft");
  const actionsLogged = state.autonomousActionLogs.length;
  const riskAlerts = state.guardrailChecks.filter((check) => !check.passed || check.severity === "high");
  const productMentions = state.responseDrafts.filter((draft) => draft.productMentionLevel >= 2).length;
  const helpfulOnly = state.responseDrafts.filter((draft) => draft.productMentionLevel === 0).length;
  const productMentionRatio =
    state.responseDrafts.length > 0 ? Math.round((productMentions / state.responseDrafts.length) * 100) : 0;
  const topCommunities = topCounts(state.opportunities.map((opportunity) => opportunity.community));
  const topPainPoints = topCounts(state.opportunities.map((opportunity) => opportunity.painPoint));
  const projectCandidates = state.conversationCandidates;
  const deliberationsCompleted = state.deliberationRuns.filter((run) => run.status === "completed").length;
  const safeAutoEngagements = state.deliberationRuns.filter((run) => run.autonomyStatus === "safe_to_auto_engage").length;
  const approvalRequired = state.deliberationRuns.filter((run) => run.autonomyStatus === "needs_human_approval").length;
  const blockedEngagements = state.deliberationRuns.filter((run) => run.autonomyStatus === "blocked").length;
  const skepticBlocks = state.candidateScores.filter((score) => score.skepticObjectionStrength > 40).length;
  const communityRiskWarnings = state.candidateScores.filter((score) => score.communityRiskScore > 35).length;
  const policyViolations = state.finalDecisions.filter((decision) => !decision.autoEngageAllowed && decision.policyResult.includes("requires restraint")).length;

  return (
    <>
      <PageHeading
        title="ReydarOS"
        description="Autonomous engagement intelligence command center"
        action={
          <Button appearance="primary" href="/signal-discovery">
            Run autonomous pipeline
          </Button>
        }
      />

      {riskAlerts.length > 0 ? (
        <Box paddingBlockEnd="space.200">
          <Banner appearance="warning">
            {riskAlerts.length} guardrail warning{riskAlerts.length === 1 ? "" : "s"} need review before engagement.
          </Banner>
        </Box>
      ) : null}

      <section className="dashboard-summary" aria-label="Dashboard summary">
        <div className="dashboard-summary-grid">
          <MetricCard
            label="Relevant conversations"
            value={state.opportunities.length}
            change="+2"
            helper="Analyzed across active projects"
            status="good"
          />
          <MetricCard
            label="High priority"
            value={highPriority.length}
            helper="High intent with manageable risk"
            status={highPriority.length ? "watch" : "good"}
          />
          <MetricCard
            label="Review drafts"
            value={pendingDrafts.length}
            helper="Approval-gated exceptions"
            status={pendingDrafts.length ? "watch" : "good"}
          />
          <MetricCard
            label="Actions logged"
            value={actionsLogged}
            helper="Queued, blocked, monitored, or cleared"
            status="good"
          />
          <MetricCard label="Saved insights" value={state.marketInsights.length} helper="Traceable market memory" status="good" />
          <MetricCard label="Risk alerts" value={riskAlerts.length} helper="Guardrails requiring attention" status={riskAlerts.length ? "risk" : "good"} />
          <MetricCard label="Product mentions" value={productMentions} helper="Drafts with Level 2 or higher" status="watch" />
          <MetricCard label="Helpful only" value={helpfulOnly} helper="Low-risk community-first responses" status="good" />
          <MetricCard label="Candidates discovered" value={projectCandidates.length} helper="Mapped entry points" status="good" />
          <MetricCard label="Deliberations completed" value={deliberationsCompleted} helper="Internal debates run" status="good" />
          <MetricCard label="Safe auto-engagements" value={safeAutoEngagements} helper="Policy-cleared decisions" status="good" />
          <MetricCard label="Approval required" value={approvalRequired} helper="Default route when uncertain" status="watch" />
          <MetricCard label="Blocked engagements" value={blockedEngagements} helper="Hard-stop decisions" status={blockedEngagements ? "risk" : "good"} />
          <MetricCard label="Skeptic blocks" value={skepticBlocks} helper="Strong objections raised" status={skepticBlocks ? "watch" : "good"} />
          <MetricCard label="Community risk warnings" value={communityRiskWarnings} helper="Risk above policy threshold" status={communityRiskWarnings ? "watch" : "good"} />
          <MetricCard label="Policy violations" value={policyViolations} helper="Auto-action prevented" status={policyViolations ? "risk" : "good"} />
        </div>
      </section>

      <Box paddingBlockStart="space.300">
        <div className="two-column-workspace">
          <Stack space="space.200">
            <SectionPanel title="High-priority opportunities" description="DARM-ranked conversations worth reviewing first.">
              {highPriority.length ? (
                <DynamicTable
                  head={{
                    cells: [
                      { key: "title", content: "Thread" },
                      { key: "community", content: "Community" },
                      { key: "intent", content: "Intent" },
                      { key: "risk", content: "Risk" },
                      { key: "status", content: "Status" },
                      { key: "action", content: "Recommended action" }
                    ]
                  }}
                  rows={highPriority.map((opportunity) => ({
                    key: opportunity.id,
                    cells: [
                      {
                        key: "title",
                        content: <Link href={`/opportunities/${opportunity.id}`}>{opportunity.threadTitle}</Link>
                      },
                      { key: "community", content: opportunity.community },
                      { key: "intent", content: <Badge>{opportunity.scores.intentScore}</Badge> },
                      { key: "risk", content: <RiskLozenge value={opportunity.riskLevel} /> },
                      { key: "status", content: <OpportunityStatusLozenge value={opportunity.status} /> },
                      { key: "action", content: recommendedActionLabels[opportunity.recommendedAction] }
                    ]
                  }))}
                  rowsPerPage={5}
                />
              ) : (
                <EmptyState
                  header="No high-priority opportunities yet"
                  description="Run an autonomous source scan to create analyzed opportunities."
                  primaryAction={<Button appearance="primary" href="/signal-discovery">Run autonomous pipeline</Button>}
                />
              )}
            </SectionPanel>

            <SectionPanel title="Review-gated response drafts" description="Drafts appear here when policy or risk requires human review.">
              {pendingDrafts.length ? (
                <DynamicTable
                  head={{
                    cells: [
                      { key: "draft", content: "Draft" },
                      { key: "mention", content: "Mention level" },
                      { key: "risk", content: "Risk" },
                      { key: "review", content: "Review" }
                    ]
                  }}
                  rows={pendingDrafts.slice(0, 6).map((draft) => {
                    const opportunity = state.opportunities.find((item) => item.id === draft.opportunityId);
                    return {
                      key: draft.id,
                      cells: [
                        { key: "draft", content: opportunity?.threadTitle ?? "Unknown opportunity" },
                        { key: "mention", content: `Level ${draft.productMentionLevel}` },
                        { key: "risk", content: <RiskLozenge value={draft.riskLevel} /> },
                        {
                          key: "review",
                          content: <Button href={`/response-studio?opportunity=${draft.opportunityId}`}>Open</Button>
                        }
                      ]
                    };
                  })}
                />
              ) : (
                <EmptyState header="No drafts waiting" description="When DARM analyzes a conversation, response options appear here." />
              )}
            </SectionPanel>
          </Stack>

          <Stack space="space.200">
            <SectionPanel title="Operating mix" description="Signals that keep engagement from becoming volume-driven.">
              <Stack space="space.150">
                <Inline spread="space-between">
                  <span>Product mention ratio</span>
                  <strong>{productMentionRatio}%</strong>
                </Inline>
                <Inline spread="space-between">
                  <span>Helpful-only replies</span>
                  <strong>{helpfulOnly}</strong>
                </Inline>
                <Inline spread="space-between">
                  <span>Learning updates</span>
                  <strong>{state.marketInsights.length}</strong>
                </Inline>
              </Stack>
            </SectionPanel>

            <SectionPanel title="Recent insights">
              <Stack space="space.150">
                {state.marketInsights.slice(0, 5).map((insight) => (
                  <div className="panel-muted" key={insight.id}>
                    <Box padding="space.150">
                      <Stack space="space.050">
                        <strong>{insight.title}</strong>
                        <span className="small-text muted-text">{insight.category}</span>
                      </Stack>
                    </Box>
                  </div>
                ))}
              </Stack>
            </SectionPanel>

            <SectionPanel title="Top communities">
              <Stack space="space.100">
                {topCommunities.map((item) => (
                  <Inline key={item.label} spread="space-between">
                    <span>{item.label}</span>
                    <Badge>{item.count}</Badge>
                  </Inline>
                ))}
              </Stack>
            </SectionPanel>

            <SectionPanel title="Top pain points">
              <Stack space="space.100">
                {topPainPoints.map((item) => (
                  <Inline key={item.label} spread="space-between">
                    <span>{item.label}</span>
                    <Badge>{item.count}</Badge>
                  </Inline>
                ))}
              </Stack>
            </SectionPanel>
          </Stack>
        </div>
      </Box>
    </>
  );
}
