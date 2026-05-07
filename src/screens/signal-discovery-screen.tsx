"use client";

import { FormEvent, useMemo, useState } from "react";
import Banner from "@atlaskit/banner";
import Button, { LoadingButton } from "@atlaskit/button";
import DynamicTable from "@atlaskit/dynamic-table";
import EmptyState from "@atlaskit/empty-state";
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle, ModalTransition } from "@atlaskit/modal-dialog";
import Select from "@/components/apple-select";
import TextArea from "@atlaskit/textarea";
import Textfield from "@atlaskit/textfield";
import { Box, Inline, Stack } from "@atlaskit/primitives";
import { Field } from "@/components/field";
import { PageHeading } from "@/components/page-heading";
import { SectionPanel } from "@/components/section-panel";
import { RiskLozenge } from "@/components/status-lozenge";
import { useReydar } from "@/lib/store";
import type { RiskLevel, SourceType } from "@/lib/types";

const splitLines = (value: string) =>
  value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

export function SignalDiscoveryScreen() {
  const { activeProject, state, createSignalSource, runSignalDiscovery } = useReydar();
  const [isOpen, setIsOpen] = useState(false);
  const [runningSourceId, setRunningSourceId] = useState<string | null>(null);
  const [form, setForm] = useState({
    platform: "Reddit",
    sourceType: "mock" as SourceType,
    communityName: "r/startups",
    sourceUrl: "https://reddit.com/r/startups",
    keywords: "workflow\napprovals\nonboarding",
    competitorTerms: "spreadsheet\nGoogle Sheets\nAirtable",
    painPointTerms: "lost in Slack\napproval bottlenecks\nownership",
    excludedTerms: "job posting\nfundraising announcement",
    scanFrequency: "Daily",
    riskTolerance: "medium" as RiskLevel,
    isActive: true
  });
  const sources = state.signalSources.filter((source) => source.projectId === activeProject.id);
  const runs = state.discoveryRuns.filter((run) => run.projectId === activeProject.id);
  const sourceOptions = sources.map((source) => ({ label: `${source.communityName} (${source.platform})`, value: source.id }));
  const runRows = useMemo(
    () =>
      runs.map((run) => {
        const source = state.signalSources.find((item) => item.id === run.signalSourceId);
        return {
          key: run.id,
          cells: [
            { key: "source", content: source?.communityName ?? "Fallback intake" },
            { key: "status", content: run.status },
            { key: "items", content: run.itemsFound },
            { key: "candidates", content: run.candidatesCreated },
            { key: "date", content: new Date(run.startedAt).toLocaleString() },
            { key: "errors", content: run.errors.length ? run.errors.join(", ") : "None" }
          ]
        };
      }),
    [runs, state.signalSources]
  );

  const submitSource = (event: FormEvent) => {
    event.preventDefault();
    createSignalSource({
      projectId: activeProject.id,
      platform: form.platform,
      sourceType: form.sourceType,
      communityName: form.communityName,
      sourceUrl: form.sourceUrl,
      keywords: splitLines(form.keywords),
      competitorTerms: splitLines(form.competitorTerms),
      painPointTerms: splitLines(form.painPointTerms),
      excludedTerms: splitLines(form.excludedTerms),
      scanFrequency: form.scanFrequency,
      riskTolerance: form.riskTolerance,
      isActive: form.isActive
    });
    setIsOpen(false);
  };

  const runSource = async (sourceId: string) => {
    setRunningSourceId(sourceId);
    await runSignalDiscovery(sourceId);
    setRunningSourceId(null);
  };

  return (
    <>
      <PageHeading
        title="Autonomous Pipeline"
        description="Configure source scanning. Each run maps candidates, deliberates, applies policy gates, prepares drafts, and writes audit records."
        breadcrumbs={[{ text: "ReydarOS", href: "/" }, { text: "Autonomous Pipeline", href: "/signal-discovery" }]}
        action={<Button appearance="primary" onClick={() => setIsOpen(true)}>Add source</Button>}
      />

      <Box paddingBlockEnd="space.200">
        <Banner appearance="warning">
          Autonomous discovery is the default path. Policy-cleared items are logged; uncertain or risky items are routed into the Review Inbox.
        </Banner>
      </Box>

      <SectionPanel title="Configured signal sources" description={`Active project: ${activeProject.name}`}>
        {sources.length ? (
          <DynamicTable
            head={{
              cells: [
                { key: "source", content: "Community/source" },
                { key: "platform", content: "Platform" },
                { key: "type", content: "Type" },
                { key: "keywords", content: "Keywords" },
                { key: "risk", content: "Risk tolerance" },
                { key: "frequency", content: "Frequency" },
                { key: "active", content: "Active" },
                { key: "last", content: "Last scanned" },
                { key: "action", content: "Action" }
              ]
            }}
            rows={sources.map((source) => ({
              key: source.id,
              cells: [
                { key: "source", content: source.communityName },
                { key: "platform", content: source.platform },
                { key: "type", content: source.sourceType },
                { key: "keywords", content: source.keywords.join(", ") },
                { key: "risk", content: <RiskLozenge value={source.riskTolerance} /> },
                { key: "frequency", content: source.scanFrequency },
                { key: "active", content: source.isActive ? "Active" : "Inactive" },
                { key: "last", content: source.lastScannedAt ? new Date(source.lastScannedAt).toLocaleString() : "Never" },
                {
                  key: "action",
                  content: (
                    <LoadingButton
                      isLoading={runningSourceId === source.id}
                      onClick={() => runSource(source.id)}
                      isDisabled={!source.isActive}
                    >
                      Run autonomous scan
                    </LoadingButton>
                  )
                }
              ]
            }))}
            rowsPerPage={8}
          />
        ) : (
          <EmptyState
            header="No signal sources configured"
            description="Add a source to start the autonomous discovery, deliberation, and policy pipeline."
            primaryAction={<Button appearance="primary" onClick={() => setIsOpen(true)}>Add source</Button>}
          />
        )}
      </SectionPanel>

      <Box paddingBlockStart="space.200">
        <SectionPanel
          title="Discovery run history"
          description="Every scan records discovery, mapping, deliberation, policy results, drafts, and action logs."
          action={
            <div className="form-field panel-action-select">
              <Select isSearchable={false} placeholder="Jump to source" options={sourceOptions} />
            </div>
          }
        >
          {runs.length ? (
            <DynamicTable
              head={{
                cells: [
                  { key: "source", content: "Source" },
                  { key: "status", content: "Status" },
                  { key: "items", content: "Items found" },
                  { key: "candidates", content: "Candidates" },
                  { key: "date", content: "Started" },
                  { key: "errors", content: "Errors" }
                ]
              }}
              rows={runRows}
              rowsPerPage={8}
            />
          ) : (
            <EmptyState header="No discovery runs yet" description="Run a source to populate discovered items, candidates, decisions, drafts, and audit logs." />
          )}
        </SectionPanel>
      </Box>

      <ModalTransition>
        {isOpen ? (
          <Modal onClose={() => setIsOpen(false)} width="large">
            <form onSubmit={submitSource}>
              <ModalHeader><ModalTitle>Add signal source</ModalTitle></ModalHeader>
              <ModalBody>
                <Stack space="space.200">
                  <Inline space="space.200" shouldWrap>
                    <div className="form-field">
                      <Field label="Platform">
                        <Select
                          options={["Reddit", "Hacker News", "LinkedIn", "Other"].map((value) => ({ label: value, value }))}
                          value={{ label: form.platform, value: form.platform }}
                          onChange={(option) => setForm((current) => ({ ...current, platform: String(option?.value ?? "Reddit") }))}
                        />
                      </Field>
                    </div>
                    <div className="form-field">
                      <Field label="Source type">
                        <Select
                          options={[
                            { label: "Demo provider", value: "mock" },
                            { label: "Reddit API", value: "reddit" }
                          ]}
                          value={{ label: form.sourceType, value: form.sourceType }}
                          onChange={(option) => setForm((current) => ({ ...current, sourceType: String(option?.value ?? "mock") as SourceType }))}
                        />
                      </Field>
                    </div>
                    <div className="form-field">
                      <Field label="Community/subreddit" htmlFor="community-name">
                        <Textfield
                          id="community-name"
                          value={form.communityName}
                          onChange={(event) => setForm((current) => ({ ...current, communityName: event.currentTarget.value }))}
                          isRequired
                        />
                      </Field>
                    </div>
                  </Inline>
                  <Field label="Source URL" htmlFor="source-url">
                    <Textfield
                      id="source-url"
                      value={form.sourceUrl}
                      onChange={(event) => setForm((current) => ({ ...current, sourceUrl: event.currentTarget.value }))}
                    />
                  </Field>
                  <div className="dense-grid">
                    <Field label="Keywords" htmlFor="source-keywords">
                      <TextArea id="source-keywords" value={form.keywords} onChange={(event) => setForm((current) => ({ ...current, keywords: event.currentTarget.value }))} minimumRows={5} />
                    </Field>
                    <Field label="Competitor terms" htmlFor="source-competitors">
                      <TextArea id="source-competitors" value={form.competitorTerms} onChange={(event) => setForm((current) => ({ ...current, competitorTerms: event.currentTarget.value }))} minimumRows={5} />
                    </Field>
                    <Field label="Pain-point terms" htmlFor="source-pain">
                      <TextArea id="source-pain" value={form.painPointTerms} onChange={(event) => setForm((current) => ({ ...current, painPointTerms: event.currentTarget.value }))} minimumRows={5} />
                    </Field>
                    <Field label="Excluded terms" htmlFor="source-excluded">
                      <TextArea id="source-excluded" value={form.excludedTerms} onChange={(event) => setForm((current) => ({ ...current, excludedTerms: event.currentTarget.value }))} minimumRows={5} />
                    </Field>
                  </div>
                  <Inline space="space.200" shouldWrap>
                    <div className="form-field">
                      <Field label="Scan frequency" htmlFor="scan-frequency">
                        <Textfield id="scan-frequency" value={form.scanFrequency} onChange={(event) => setForm((current) => ({ ...current, scanFrequency: event.currentTarget.value }))} />
                      </Field>
                    </div>
                    <div className="form-field">
                      <Field label="Risk tolerance">
                        <Select
                          options={["low", "medium", "high"].map((value) => ({ label: value, value }))}
                          value={{ label: form.riskTolerance, value: form.riskTolerance }}
                          onChange={(option) => setForm((current) => ({ ...current, riskTolerance: String(option?.value ?? "medium") as RiskLevel }))}
                        />
                      </Field>
                    </div>
                  </Inline>
                </Stack>
              </ModalBody>
              <ModalFooter>
                <Button appearance="subtle" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button appearance="primary" type="submit">Create source</Button>
              </ModalFooter>
            </form>
          </Modal>
        ) : null}
      </ModalTransition>
    </>
  );
}
