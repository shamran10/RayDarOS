"use client";

import { FormEvent, useState } from "react";
import Banner from "@atlaskit/banner";
import Button from "@atlaskit/button";
import DropdownMenu, { DropdownItem, DropdownItemGroup } from "@atlaskit/dropdown-menu";
import DynamicTable from "@atlaskit/dynamic-table";
import EmptyState from "@atlaskit/empty-state";
import InlineEdit from "@atlaskit/inline-edit";
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle, ModalTransition } from "@atlaskit/modal-dialog";
import Select from "@/components/apple-select";
import TextArea from "@atlaskit/textarea";
import Textfield from "@atlaskit/textfield";
import Tooltip from "@atlaskit/tooltip";
import AddIcon from "@atlaskit/icon/core/add";
import { Box, Inline, Stack } from "@atlaskit/primitives";
import { Field } from "@/components/field";
import { PageHeading } from "@/components/page-heading";
import { SectionPanel } from "@/components/section-panel";
import { RiskLozenge } from "@/components/status-lozenge";
import { useReydar } from "@/lib/store";
import type { CommunityRule, RiskLevel } from "@/lib/types";

const riskOptions: Array<{ label: string; value: RiskLevel }> = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
  { label: "Blocked", value: "blocked" }
];

const toleranceOptions = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" }
];

function RuleModal({
  projectId,
  rule,
  onClose
}: {
  projectId: string;
  rule?: CommunityRule;
  onClose: () => void;
}) {
  const { addCommunityRule, updateCommunityRule } = useReydar();
  const [form, setForm] = useState<Omit<CommunityRule, "id" | "createdAt" | "updatedAt">>({
    projectId,
    communityName: rule?.communityName ?? "",
    platform: rule?.platform ?? "Reddit",
    topic: rule?.topic ?? "",
    allowedContentTypes: rule?.allowedContentTypes ?? "Helpful advice, frameworks, clarifying questions.",
    selfPromotionPolicy: rule?.selfPromotionPolicy ?? "Self-promotion is sensitive and should be avoided unless requested.",
    linkPolicy: rule?.linkPolicy ?? "No links unless directly requested.",
    vendorParticipationRules: rule?.vendorParticipationRules ?? "Disclose affiliation and avoid acting like a neutral user.",
    disclosureExpectations: rule?.disclosureExpectations ?? "Disclosure required for product or company mentions.",
    tonePreference: rule?.tonePreference ?? "Direct and helpful",
    riskLevel: rule?.riskLevel ?? "medium",
    moderatorSensitivity: rule?.moderatorSensitivity ?? "Unknown",
    productMentionTolerance: rule?.productMentionTolerance ?? "low",
    previousSuccessfulComments: rule?.previousSuccessfulComments ?? "",
    previousRemovals: rule?.previousRemovals ?? "",
    previousNegativeReactions: rule?.previousNegativeReactions ?? "",
    recommendedReplyStyle: rule?.recommendedReplyStyle ?? "Lead with useful advice. Mention product only if explicitly relevant.",
    minimumAccountAgeOrKarma: rule?.minimumAccountAgeOrKarma ?? "Unknown",
    engagementFrequencyHistory: rule?.engagementFrequencyHistory ?? "Keep engagement low-frequency until trust is proven."
  });

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (rule) updateCommunityRule(rule.id, form);
    else addCommunityRule(form);
    onClose();
  };

  return (
    <Modal onClose={onClose} width="x-large">
      <form onSubmit={submit}>
        <ModalHeader>
          <ModalTitle>{rule ? "Edit community rule" : "Add community rule"}</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <Stack space="space.200">
            <Inline space="space.200" shouldWrap>
              <div className="form-field">
                <Field label="Community name" htmlFor="community-name">
                  <Textfield id="community-name" value={form.communityName} onChange={(event) => update("communityName", event.currentTarget.value)} isRequired />
                </Field>
              </div>
              <div className="form-field-sm">
                <Field label="Platform" htmlFor="platform">
                  <Textfield id="platform" value={form.platform} onChange={(event) => update("platform", event.currentTarget.value)} />
                </Field>
              </div>
              <div className="form-field-sm">
                <Field label="Risk level">
                  <Select
                    options={riskOptions}
                    value={riskOptions.find((option) => option.value === form.riskLevel)}
                    onChange={(option) => update("riskLevel", (option?.value ?? "medium") as RiskLevel)}
                  />
                </Field>
              </div>
            </Inline>
            <Field label="Topic" htmlFor="topic">
              <Textfield id="topic" value={form.topic} onChange={(event) => update("topic", event.currentTarget.value)} />
            </Field>
            <Inline space="space.200" shouldWrap>
              <div className="form-field">
                <Field label="Product mention tolerance">
                  <Select
                    options={toleranceOptions}
                    value={toleranceOptions.find((option) => option.value === form.productMentionTolerance)}
                    onChange={(option) => update("productMentionTolerance", (option?.value ?? "low") as "low" | "medium" | "high")}
                  />
                </Field>
              </div>
              <div className="form-field">
                <Field label="Moderator sensitivity" htmlFor="moderator-sensitivity">
                  <Textfield
                    id="moderator-sensitivity"
                    value={form.moderatorSensitivity}
                    onChange={(event) => update("moderatorSensitivity", event.currentTarget.value)}
                  />
                </Field>
              </div>
              <div className="form-field">
                <Field label="Tone preference" htmlFor="tone-preference">
                  <Textfield id="tone-preference" value={form.tonePreference} onChange={(event) => update("tonePreference", event.currentTarget.value)} />
                </Field>
              </div>
            </Inline>
            {[
              ["Allowed content types", "allowedContentTypes"],
              ["Self-promotion policy", "selfPromotionPolicy"],
              ["Link policy", "linkPolicy"],
              ["Vendor participation rules", "vendorParticipationRules"],
              ["Disclosure expectations", "disclosureExpectations"],
              ["Recommended reply style", "recommendedReplyStyle"],
              ["Previous successful comments", "previousSuccessfulComments"],
              ["Previous removals", "previousRemovals"],
              ["Previous negative reactions", "previousNegativeReactions"],
              ["Minimum account age or karma rules", "minimumAccountAgeOrKarma"],
              ["Engagement frequency history", "engagementFrequencyHistory"]
            ].map(([label, key]) => (
              <Field key={key} label={label} htmlFor={key}>
                <TextArea
                  id={key}
                  value={String(form[key as keyof typeof form] ?? "")}
                  onChange={(event) => update(key as keyof typeof form, event.currentTarget.value as never)}
                  minimumRows={2}
                />
              </Field>
            ))}
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button appearance="subtle" onClick={onClose}>Cancel</Button>
          <Button appearance="primary" type="submit">{rule ? "Save rule" : "Add rule"}</Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export function CommunityRulesScreen({ projectId }: { projectId: string }) {
  const { state, updateCommunityRule } = useReydar();
  const [isAdding, setIsAdding] = useState(false);
  const [editing, setEditing] = useState<CommunityRule | undefined>();
  const project = state.projects.find((item) => item.id === projectId);
  const rules = state.communityRules.filter((rule) => rule.projectId === projectId);
  const blockedRules = rules.filter((rule) => rule.riskLevel === "blocked");

  return (
    <>
      <PageHeading
        title="Community Rules and Behavior Memory"
        description="Prevent spam-like behavior and keep engagement safe per community."
        breadcrumbs={[
          { text: "Projects", href: "/projects" },
          { text: project?.name ?? "Project", href: `/projects/${projectId}` },
          { text: "Community Rules", href: `/projects/${projectId}/community-rules` }
        ]}
        action={
          <Button appearance="primary" iconBefore={<AddIcon label="" />} onClick={() => setIsAdding(true)}>
            Add community
          </Button>
        }
      />

      {blockedRules.length ? (
        <Box paddingBlockEnd="space.200">
          <Banner appearance="warning">
            {blockedRules.length} community record is blocked. Review Studio will recommend no posting for these communities.
          </Banner>
        </Box>
      ) : null}

      <SectionPanel title="Community rules" description="Rules are used by DARM to lower mention levels, require disclosure, avoid links, or block recommendations.">
        {rules.length ? (
          <DynamicTable
            head={{
              cells: [
                { key: "community", content: "Community" },
                { key: "platform", content: "Platform" },
                { key: "topic", content: "Topic" },
                { key: "content", content: "Allowed content" },
                { key: "promo", content: "Self-promotion" },
                { key: "links", content: "Link policy" },
                { key: "risk", content: "Risk" },
                { key: "tolerance", content: "Product mention tolerance" },
                { key: "style", content: "Recommended style" },
                { key: "actions", content: "Actions" }
              ]
            }}
            rows={rules.map((rule) => ({
              key: rule.id,
              cells: [
                {
                  key: "community",
                  content: (
                    <InlineEdit
                      defaultValue={rule.communityName}
                      label={`Edit ${rule.communityName}`}
                      editView={({ errorMessage, ...fieldProps }) => <Textfield {...fieldProps} autoFocus />}
                      readView={() => <strong>{rule.communityName}</strong>}
                      onConfirm={(value) => updateCommunityRule(rule.id, { communityName: value })}
                    />
                  )
                },
                { key: "platform", content: rule.platform },
                { key: "topic", content: rule.topic },
                { key: "content", content: <Tooltip content={rule.allowedContentTypes}><span>{rule.allowedContentTypes.slice(0, 46)}</span></Tooltip> },
                { key: "promo", content: <Tooltip content={rule.selfPromotionPolicy}><span>{rule.selfPromotionPolicy.slice(0, 46)}</span></Tooltip> },
                { key: "links", content: rule.linkPolicy },
                { key: "risk", content: <RiskLozenge value={rule.riskLevel} /> },
                { key: "tolerance", content: rule.productMentionTolerance },
                { key: "style", content: rule.recommendedReplyStyle.slice(0, 70) },
                {
                  key: "actions",
                  content: (
                    <DropdownMenu trigger="Actions" spacing="compact">
                      <DropdownItemGroup>
                        <DropdownItem onClick={() => setEditing(rule)}>Edit rule</DropdownItem>
                        <DropdownItem onClick={() => updateCommunityRule(rule.id, { riskLevel: "blocked" })}>
                          Mark blocked
                        </DropdownItem>
                        <DropdownItem onClick={() => updateCommunityRule(rule.id, { riskLevel: "low" })}>
                          Mark low risk
                        </DropdownItem>
                      </DropdownItemGroup>
                    </DropdownMenu>
                  )
                }
              ]
            }))}
            rowsPerPage={8}
          />
        ) : (
          <EmptyState
            header="No community rules defined"
            description="Add rules before generating product mentions. Blocked communities will prevent posting recommendations."
            primaryAction={<Button appearance="primary" onClick={() => setIsAdding(true)}>Add community rule</Button>}
          />
        )}
      </SectionPanel>

      <ModalTransition>
        {isAdding ? <RuleModal projectId={projectId} onClose={() => setIsAdding(false)} /> : null}
        {editing ? <RuleModal projectId={projectId} rule={editing} onClose={() => setEditing(undefined)} /> : null}
      </ModalTransition>
    </>
  );
}
