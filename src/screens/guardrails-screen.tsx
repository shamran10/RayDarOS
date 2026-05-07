"use client";

import Badge from "@atlaskit/badge";
import Banner from "@atlaskit/banner";
import Button from "@atlaskit/button";
import DynamicTable from "@atlaskit/dynamic-table";
import { Box, Inline, Stack } from "@atlaskit/primitives";
import { PageHeading } from "@/components/page-heading";
import { SectionPanel } from "@/components/section-panel";
import { RiskLozenge } from "@/components/status-lozenge";
import { guardrailActionLabels, productMentionLabels } from "@/lib/labels";
import { useReydar } from "@/lib/store";

const mentionRules = [
  "Level 4 should be rare.",
  "Level 4 should only be recommended when the user asks for a link or the community clearly allows it.",
  "Level 3 and Level 4 require disclosure.",
  "High-risk communities default to Level 0 or Do Not Reply.",
  "Blocked communities should not allow generated posting recommendations."
];

export function GuardrailsScreen() {
  const { state } = useReydar();
  const blockedCommunities = state.communityRules.filter((rule) => rule.riskLevel === "blocked");
  const riskyDrafts = state.responseDrafts.filter((draft) => draft.riskLevel === "high" || draft.productMentionLevel >= 3);
  const failedChecks = state.guardrailChecks.filter((check) => !check.passed);
  const policyBlocks = state.finalDecisions.filter((decision) => !decision.autoEngageAllowed && decision.policyResult.includes("requires restraint"));
  const autoPoliciesEnabled = state.autonomyPolicies.filter((policy) => policy.allowAutoEngage).length;

  return (
    <>
      <PageHeading
        title="Guardrails"
        description="Protect brand trust, account safety, and community norms before any autonomous engagement."
        breadcrumbs={[{ text: "ReydarOS", href: "/" }, { text: "Guardrails", href: "/guardrails" }]}
      />

      {failedChecks.length || blockedCommunities.length ? (
        <Box paddingBlockEnd="space.200">
          <Banner appearance="warning">Guardrail action is required before approving some responses.</Banner>
        </Box>
      ) : null}

      <div className="responsive-grid">
        <SectionPanel title="Guardrail checks">
          <Stack space="space.100">
            {[
              ["Repeated wording", "Warn"],
              ["Comment frequency", "Require edit"],
              ["Product mention ratio", "Recommend helpful-only"],
              ["Link usage", "Remove link"],
              ["Subreddit risk", "Block response"],
              ["Promotion sensitivity", "Lower product mention level"],
              ["Account reputation", "Warn"],
              ["Disclosure requirements", "Require disclosure"],
              ["Negative engagement history", "Recommend save as insight"],
              ["Over-engagement in one community", "Block response"]
            ].map(([check, action]) => (
              <Inline key={check} spread="space-between">
                <span>{check}</span>
                <Badge>{action}</Badge>
              </Inline>
            ))}
          </Stack>
        </SectionPanel>

        <SectionPanel title="Product mention levels">
          <Stack space="space.100">
            {([0, 1, 2, 3, 4] as const).map((level) => (
              <Inline key={level} spread="space-between">
                <span>{productMentionLabels[level]}</span>
                <Badge>{state.responseDrafts.filter((draft) => draft.productMentionLevel === level).length}</Badge>
              </Inline>
            ))}
          </Stack>
        </SectionPanel>

        <SectionPanel title="Mention rules">
          <ul className="mention-rule-list">
            {mentionRules.map((rule) => (
              <li key={rule}>
                <span aria-hidden="true" className="mention-rule-icon">i</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </SectionPanel>
        <SectionPanel title="Autonomy policy gates">
          <Stack space="space.100">
            <Inline spread="space-between"><span>Policies with auto-engage enabled</span><Badge>{autoPoliciesEnabled}</Badge></Inline>
            <Inline spread="space-between"><span>Policy-blocked final decisions</span><Badge>{policyBlocks.length}</Badge></Inline>
            <Inline spread="space-between"><span>Actions logged</span><Badge>{state.autonomousActionLogs.length}</Badge></Inline>
            <Button href="/autonomy-policies">Open Autonomy Policies</Button>
          </Stack>
        </SectionPanel>
      </div>

      <Box paddingBlockStart="space.200">
        <SectionPanel title="Active guardrail results" description="Generated during DARM analysis and Review Studio approval checks.">
          <DynamicTable
            head={{
              cells: [
                { key: "check", content: "Check" },
                { key: "description", content: "Description" },
                { key: "severity", content: "Severity" },
                { key: "action", content: "Action" },
                { key: "passed", content: "Passed" }
              ]
            }}
            rows={state.guardrailChecks.map((check) => ({
              key: check.id,
              cells: [
                { key: "check", content: check.checkType },
                { key: "description", content: check.description },
                { key: "severity", content: <RiskLozenge value={check.severity} /> },
                { key: "action", content: guardrailActionLabels[check.action] },
                { key: "passed", content: check.passed ? "Yes" : "No" }
              ]
            }))}
            rowsPerPage={10}
          />
        </SectionPanel>
      </Box>

      <Box paddingBlockStart="space.200">
        <SectionPanel title="Risky drafts" description="Drafts with high risk or Level 3+ product mention.">
          <DynamicTable
            head={{ cells: [{ key: "draft", content: "Draft" }, { key: "risk", content: "Risk" }, { key: "mention", content: "Mention" }, { key: "action", content: "Action" }] }}
            rows={riskyDrafts.map((draft) => ({
              key: draft.id,
              cells: [
                { key: "draft", content: draft.responseText.slice(0, 90) },
                { key: "risk", content: <RiskLozenge value={draft.riskLevel} /> },
                { key: "mention", content: productMentionLabels[draft.productMentionLevel] },
                { key: "action", content: <Button href={`/response-studio?opportunity=${draft.opportunityId}`}>Review</Button> }
              ]
            }))}
          />
        </SectionPanel>
      </Box>
    </>
  );
}
