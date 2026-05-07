"use client";

import Banner from "@atlaskit/banner";
import Button from "@atlaskit/button";
import DynamicTable from "@atlaskit/dynamic-table";
import Select from "@/components/apple-select";
import { Box, Inline, Stack } from "@atlaskit/primitives";
import { PageHeading } from "@/components/page-heading";
import { SectionPanel } from "@/components/section-panel";
import { StatusPill } from "@/components/status-lozenge";
import { productMentionLabels } from "@/lib/labels";
import { useReydar } from "@/lib/store";
import type { AutonomyPolicy, ProductMentionLevel } from "@/lib/types";

const mentionOptions = ([0, 1, 2, 3, 4] as ProductMentionLevel[]).map((value) => ({
  label: productMentionLabels[value],
  value
}));

type NumberPolicyField =
  | "maxCommentsPerDay"
  | "maxCommentsPerCommunityPerDay"
  | "maxProductMentionsPerWeek"
  | "minRelevanceScore"
  | "minIntentScore"
  | "minProductFitScore"
  | "minEngagementValueScore"
  | "maxPromotionRiskScore"
  | "maxCommunityRiskScore"
  | "minAccountSafetyScore"
  | "maxSkepticObjectionStrength";

const scorePolicyFields: NumberPolicyField[] = [
  "minRelevanceScore",
  "minIntentScore",
  "minProductFitScore",
  "minEngagementValueScore",
  "maxPromotionRiskScore",
  "maxCommunityRiskScore",
  "minAccountSafetyScore",
  "maxSkepticObjectionStrength"
];

function NumberEdit({
  policy,
  field,
  label,
  update
}: {
  policy: AutonomyPolicy;
  field: NumberPolicyField;
  label: string;
  update: (policyId: string, patch: Partial<AutonomyPolicy>) => void;
}) {
  const isScoreField = scorePolicyFields.includes(field);

  const updateValue = (rawValue: string) => {
    const parsedValue = Number(rawValue);
    if (!Number.isFinite(parsedValue)) return;

    const roundedValue = Math.round(parsedValue);
    const nextValue = isScoreField ? Math.min(100, Math.max(0, roundedValue)) : Math.max(0, roundedValue);
    update(policy.id, { [field]: nextValue } as Partial<AutonomyPolicy>);
  };

  return (
    <label className="number-setting-row">
      <span>{label}</span>
      <input
        aria-label={label}
        className="number-setting-input"
        inputMode="numeric"
        max={isScoreField ? 100 : undefined}
        min={0}
        onChange={(event) => updateValue(event.currentTarget.value)}
        step={1}
        type="number"
        value={policy[field]}
      />
    </label>
  );
}

export function AutonomyPoliciesScreen() {
  const { activeProject, state, updateAutonomyPolicy } = useReydar();
  const policies = state.autonomyPolicies.filter((policy) => policy.projectId === activeProject.id);
  const rows = policies.map((policy) => {
    const communityRule = state.communityRules.find((rule) => rule.id === policy.communityRuleId);
    return {
      key: policy.id,
      cells: [
        { key: "name", content: policy.name },
        { key: "scope", content: communityRule?.communityName ?? "Global project policy" },
        {
          key: "auto",
          content: (
            <StatusPill tone={policy.allowAutoEngage ? "status-good" : "status-neutral"}>
              {policy.allowAutoEngage ? "Enabled" : "Disabled"}
            </StatusPill>
          )
        },
        { key: "mentions", content: policy.allowedProductMentionLevels.map((level) => `L${level}`).join(", ") },
        { key: "links", content: policy.allowLinks ? "Allowed" : "Blocked" },
        { key: "threshold", content: `${policy.minRelevanceScore}/${policy.minIntentScore}/${policy.minProductFitScore}` },
        { key: "active", content: policy.isActive ? "Active" : "Inactive" }
      ]
    };
  });
  const selected = policies[0];

  return (
    <>
      <PageHeading
        title="Autonomy Controls"
        description="Define exactly when ReydarOS can act without human approval. Default is approval-gated."
        breadcrumbs={[{ text: "ReydarOS", href: "/" }, { text: "Autonomy Controls", href: "/autonomy-policies" }]}
      />

      <Box paddingBlockEnd="space.200">
        <Banner appearance="warning">
          Autonomous engagement should only be enabled for approved communities and low-risk helpful responses. Product recommendations, links, and high-risk communities should remain approval-gated.
        </Banner>
      </Box>

      <SectionPanel title="Policy inventory" description="Global project policies can be paired with stricter community-specific policies.">
        <DynamicTable
          head={{
            cells: [
              { key: "name", content: "Policy" },
              { key: "scope", content: "Scope" },
              { key: "auto", content: "Auto-engage" },
              { key: "mentions", content: "Mention levels" },
              { key: "links", content: "Links" },
              { key: "threshold", content: "Rel / Intent / Fit" },
              { key: "active", content: "Status" }
            ]
          }}
          rows={rows}
        />
      </SectionPanel>

      {selected ? (
        <Box paddingBlockStart="space.200">
          <div className="two-column-workspace">
            <Stack space="space.200">
              <SectionPanel
                title="Global project policy"
                description={selected.name}
                action={
                  <Button
                    appearance={selected.allowAutoEngage ? "warning" : "primary"}
                    onClick={() => updateAutonomyPolicy(selected.id, { allowAutoEngage: !selected.allowAutoEngage })}
                  >
                    {selected.allowAutoEngage ? "Disable auto-engage" : "Enable auto-engage"}
                  </Button>
                }
              >
                <Stack space="space.150">
                  <Inline spread="space-between"><span>Auto-engage</span><StatusPill tone={selected.allowAutoEngage ? "status-good" : "status-neutral"}>{selected.allowAutoEngage ? "Enabled" : "Disabled"}</StatusPill></Inline>
                  <Inline spread="space-between"><span>Allow links</span><Button onClick={() => updateAutonomyPolicy(selected.id, { allowLinks: !selected.allowLinks })}>{selected.allowLinks ? "Allowed" : "Blocked"}</Button></Inline>
                  <Inline spread="space-between"><span>Require disclosure</span><Button onClick={() => updateAutonomyPolicy(selected.id, { requireDisclosure: !selected.requireDisclosure })}>{selected.requireDisclosure ? "Required" : "Optional"}</Button></Inline>
                  <div className="policy-multiselect-field">
                    <span className="field-label">Allowed product mention levels</span>
                    <Select
                      isMulti
                      isSearchable={false}
                      options={mentionOptions}
                      value={mentionOptions.filter((option) => selected.allowedProductMentionLevels.includes(option.value))}
                      onChange={(options) =>
                        updateAutonomyPolicy(selected.id, {
                          allowedProductMentionLevels: options.map((option) => option.value)
                        })
                      }
                    />
                  </div>
                </Stack>
              </SectionPanel>

              <SectionPanel title="Safety limits">
                <Stack space="space.150">
                  <NumberEdit policy={selected} field="maxCommentsPerDay" label="Max comments per day" update={updateAutonomyPolicy} />
                  <NumberEdit policy={selected} field="maxCommentsPerCommunityPerDay" label="Max comments per community per day" update={updateAutonomyPolicy} />
                  <NumberEdit policy={selected} field="maxProductMentionsPerWeek" label="Max product mentions per week" update={updateAutonomyPolicy} />
                </Stack>
              </SectionPanel>
            </Stack>

            <Stack space="space.200">
              <SectionPanel title="Score thresholds">
                <Stack space="space.150">
                  <NumberEdit policy={selected} field="minRelevanceScore" label="Minimum relevance" update={updateAutonomyPolicy} />
                  <NumberEdit policy={selected} field="minIntentScore" label="Minimum intent" update={updateAutonomyPolicy} />
                  <NumberEdit policy={selected} field="minProductFitScore" label="Minimum product fit" update={updateAutonomyPolicy} />
                  <NumberEdit policy={selected} field="minEngagementValueScore" label="Minimum engagement value" update={updateAutonomyPolicy} />
                  <NumberEdit policy={selected} field="maxPromotionRiskScore" label="Maximum promotion risk" update={updateAutonomyPolicy} />
                  <NumberEdit policy={selected} field="maxCommunityRiskScore" label="Maximum community risk" update={updateAutonomyPolicy} />
                  <NumberEdit policy={selected} field="minAccountSafetyScore" label="Minimum account safety" update={updateAutonomyPolicy} />
                  <NumberEdit policy={selected} field="maxSkepticObjectionStrength" label="Maximum Skeptic objection" update={updateAutonomyPolicy} />
                </Stack>
              </SectionPanel>

              <SectionPanel title="Candidate permissions">
                <Stack space="space.100">
                  <Inline spread="space-between"><span>Allowed candidate types</span><strong>{selected.allowedCandidateTypes.length}</strong></Inline>
                  <Inline spread="space-between"><span>Blocked candidate types</span><strong>{selected.blockedCandidateTypes.join(", ") || "None"}</strong></Inline>
                  <p className="muted-text">High-risk communities, Level 3 or Level 4 product mentions, links without permission, and missing Brand Guardian approval remain blocked by hard rules.</p>
                </Stack>
              </SectionPanel>
            </Stack>
          </div>
        </Box>
      ) : null}
    </>
  );
}
