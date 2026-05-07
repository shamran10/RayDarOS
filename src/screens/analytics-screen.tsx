"use client";

import { MetricCard } from "@/components/metric-card";
import { PageHeading } from "@/components/page-heading";
import { SectionPanel } from "@/components/section-panel";
import { useReydar } from "@/lib/store";
import { topCounts } from "@/lib/selectors";

function AnalyticsCount({ value }: { value: number }) {
  return <span className="analytics-count">{value}</span>;
}

function AnalyticsList({
  items,
  emptyLabel = "No data yet"
}: {
  items: { label: string; count: number }[];
  emptyLabel?: string;
}) {
  if (!items.length) return <p className="analytics-empty">{emptyLabel}</p>;

  return (
    <ul className="analytics-list">
      {items.map((item) => (
        <li key={item.label}>
          <span>{item.label}</span>
          <AnalyticsCount value={item.count} />
        </li>
      ))}
    </ul>
  );
}

function OutcomeList({
  items
}: {
  items: { label: string; value: number }[];
}) {
  return (
    <ul className="analytics-list">
      {items.map((item) => (
        <li key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </li>
      ))}
    </ul>
  );
}

export function AnalyticsScreen() {
  const { state } = useReydar();
  const helpfulOnly = state.responseDrafts.filter((draft) => draft.productMentionLevel === 0).length;
  const productMentions = state.responseDrafts.filter((draft) => draft.productMentionLevel >= 2).length;
  const mentionRatio = state.responseDrafts.length ? Math.round((productMentions / state.responseDrafts.length) * 100) : 0;
  const removed = state.engagementOutcomes.filter((outcome) => outcome.outcomeType === "removed").length;
  const positive = state.engagementOutcomes.filter((outcome) => outcome.outcomeType === "positive_reply").length;
  const negative = state.engagementOutcomes.filter((outcome) => outcome.outcomeType === "negative_reply").length;
  const communityPerformance = topCounts(state.opportunities.map((opportunity) => opportunity.community));
  const painPoints = topCounts(state.opportunities.map((opportunity) => opportunity.painPoint));
  const intentSignals = topCounts(state.opportunities.map((opportunity) => opportunity.intentLevel));
  const responseTypes = topCounts(state.responseDrafts.map((draft) => draft.responseType.replaceAll("_", " ")));
  const autoReady = state.deliberationRuns.filter((run) => run.autonomyStatus === "safe_to_auto_engage").length;
  const humanOverrides = state.conversationCandidates.filter((candidate) => ["rejected", "blocked"].includes(candidate.status)).length;
  const blockedActions = state.autonomousActionLogs.filter((log) => log.actionType === "block" || log.actionStatus === "blocked").length;
  const averageSkeptic =
    state.candidateScores.length > 0
      ? Math.round(state.candidateScores.reduce((sum, score) => sum + score.skepticObjectionStrength, 0) / state.candidateScores.length)
      : 0;
  const candidateTypes = topCounts(state.conversationCandidates.map((candidate) => candidate.candidateType.replaceAll("_", " ")));
  const riskyCommunities = topCounts(
    state.candidateScores
      .filter((score) => score.communityRiskScore > 35)
      .map((score) => state.conversationCandidates.find((candidate) => candidate.id === score.candidateId)?.community ?? "Unknown")
  );
  const reasonsNotToEngage = topCounts(
    state.finalDecisions
      .filter((decision) => decision.blockedReason || !decision.autoEngageAllowed)
      .map((decision) => decision.blockedReason ?? "Policy threshold not satisfied")
  );
  const productMentionSafetyRatio = state.finalDecisions.length
    ? Math.round((state.finalDecisions.filter((decision) => decision.productMentionLevel <= 1).length / state.finalDecisions.length) * 100)
    : 0;
  const helpfulOnlyRatio = state.finalDecisions.length
    ? Math.round((state.finalDecisions.filter((decision) => decision.selectedAction === "helpful_only_reply").length / state.finalDecisions.length) * 100)
    : 0;

  return (
    <>
      <PageHeading
        title="Analytics"
        description="Useful engagement intelligence, not vanity metrics."
        breadcrumbs={[{ text: "ReydarOS", href: "/" }, { text: "Analytics", href: "/analytics" }]}
      />

      <section className="dashboard-summary analytics-summary" aria-label="Analytics summary">
        <div className="dashboard-summary-grid">
          <MetricCard label="Relevant threads found" value={state.opportunities.length} helper="Analyzed conversations" status="good" />
          <MetricCard label="Replies drafted" value={state.responseDrafts.length} helper="Generated for review" status="watch" />
          <MetricCard label="Replies approved" value={state.responseDrafts.filter((draft) => draft.status === "approved").length} helper="Approved exceptions" status="good" />
          <MetricCard label="Actions logged" value={state.autonomousActionLogs.length} helper="Autonomous decisions traced" status="good" />
          <MetricCard label="Helpful-only replies" value={helpfulOnly} helper="Level 0 responses" status="good" />
          <MetricCard label="Product mentions" value={productMentions} helper="Level 2+" status="watch" />
          <MetricCard label="Product mention ratio" value={`${mentionRatio}%`} helper="Keep this low and justified" status={mentionRatio > 35 ? "risk" : "good"} />
          <MetricCard label="Risk incidents" value={removed + negative} helper="Negative or removed outcomes" status={removed + negative ? "risk" : "good"} />
          <MetricCard label="Auto approval rate" value={`${state.deliberationRuns.length ? Math.round((autoReady / state.deliberationRuns.length) * 100) : 0}%`} helper="Policy-cleared deliberations" status="good" />
          <MetricCard label="Human override rate" value={`${state.conversationCandidates.length ? Math.round((humanOverrides / state.conversationCandidates.length) * 100) : 0}%`} helper="Rejected or blocked candidates" status={humanOverrides ? "watch" : "good"} />
          <MetricCard label="Blocked action rate" value={`${state.autonomousActionLogs.length ? Math.round((blockedActions / state.autonomousActionLogs.length) * 100) : 0}%`} helper="Logged action blocks" status={blockedActions ? "risk" : "good"} />
          <MetricCard label="Avg skepticism" value={averageSkeptic} helper="Skeptic objection score" status={averageSkeptic > 45 ? "watch" : "good"} />
          <MetricCard label="Product mention safety" value={`${productMentionSafetyRatio}%`} helper="Level 0 or Level 1 decisions" status="good" />
          <MetricCard label="Helpful-only ratio" value={`${helpfulOnlyRatio}%`} helper="Helpful-only final decisions" status="good" />
        </div>
      </section>

      <div className="analytics-panels-grid">
        <SectionPanel title="Community performance">
          <AnalyticsList items={communityPerformance} />
        </SectionPanel>
        <SectionPanel title="Top pain points">
          <AnalyticsList items={painPoints} />
        </SectionPanel>
        <SectionPanel title="Top intent signals">
          <AnalyticsList items={intentSignals} />
        </SectionPanel>
        <SectionPanel title="Most successful response types">
          <AnalyticsList items={responseTypes} />
        </SectionPanel>
        <SectionPanel title="Outcomes">
          <OutcomeList
            items={[
              { label: "Positive replies", value: positive },
              { label: "Negative replies", value: negative },
              { label: "Removed comments", value: removed },
              { label: "Lead signals generated", value: state.opportunities.filter((item) => item.scores.intentScore >= 75).length }
            ]}
          />
        </SectionPanel>
        <SectionPanel title="Best candidate types">
          <AnalyticsList items={candidateTypes} />
        </SectionPanel>
        <SectionPanel title="Highest-risk communities">
          <AnalyticsList items={riskyCommunities} />
        </SectionPanel>
        <SectionPanel title="Most common reasons not to engage">
          <AnalyticsList items={reasonsNotToEngage} />
        </SectionPanel>
      </div>
    </>
  );
}
