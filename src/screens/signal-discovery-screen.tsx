"use client";

import { FormEvent, useMemo, useState } from "react";
import Banner from "@atlaskit/banner";
import Button, { LoadingButton } from "@atlaskit/button";
import DynamicTable from "@atlaskit/dynamic-table";
import EmptyState from "@atlaskit/empty-state";
import Select from "@/components/apple-select";
import SectionMessage from "@atlaskit/section-message";
import TextArea from "@atlaskit/textarea";
import Textfield from "@atlaskit/textfield";
import { Box, Inline, Stack } from "@atlaskit/primitives";
import { AppDialog } from "@/components/app-dialog";
import { DiscoveryLoadState } from "@/components/discovery-load-state";
import { Field } from "@/components/field";
import { PageHeading } from "@/components/page-heading";
import { SectionPanel } from "@/components/section-panel";
import { RiskLozenge } from "@/components/status-lozenge";
import type { SignalSourceCreateInput } from "@/lib/discovery/contracts";
import { useDiscovery } from "@/lib/discovery/context";
import { useReydar } from "@/lib/store";
import type { RiskLevel } from "@/lib/types";

const splitLines = (value: string) =>
  value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

export function SignalDiscoveryScreen() {
  const { activeProject } = useReydar();
  const {
    snapshot,
    status,
    error,
    retry,
    createSource,
    updateSource,
    runSource: runPersistedSource
  } = useDiscovery();
  const [isOpen, setIsOpen] = useState(false);
  const [runningSourceId, setRunningSourceId] = useState<string | null>(null);
  const [updatingSourceId, setUpdatingSourceId] = useState<string | null>(null);
  const [isSavingSource, setIsSavingSource] = useState(false);
  const [operationError, setOperationError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [form, setForm] = useState({
    platform: "Reddit",
    sourceType: "mock" as SignalSourceCreateInput["sourceType"],
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
  const updateForm = <Key extends keyof typeof form>(key: Key, value: (typeof form)[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };
  const sources = snapshot.signalSources.filter(
    (source) => source.projectId === activeProject.id && source.sourceType !== "manual"
  );
  const runs = snapshot.discoveryRuns.filter((run) => run.projectId === activeProject.id);
  const sourceOptions = sources.map((source) => ({ label: `${source.communityName} (${source.platform})`, value: source.id }));

  const runRows = useMemo(
    () =>
      runs.map((run) => {
        const source = snapshot.signalSources.find((item) => item.id === run.signalSourceId);
        return {
          key: run.id,
          cells: [
            { key: "source", content: source?.communityName ?? "Fallback intake" },
            { key: "provider", content: run.providerType },
            { key: "status", content: run.status },
            { key: "items", content: run.itemsFound },
            { key: "candidates", content: run.candidatesCreated },
            { key: "date", content: new Date(run.startedAt).toLocaleString() },
            { key: "errors", content: run.errors.length ? run.errors.join(", ") : "None" }
          ]
        };
      }),
    [runs, snapshot.signalSources]
  );

  const submitSource = async (event: FormEvent) => {
    event.preventDefault();
    if (isSavingSource || !activeProject.id) return;
    setIsSavingSource(true);
    setFormError(undefined);
    try {
      await createSource(activeProject.id, {
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
    } catch (submissionError) {
      setFormError(
        submissionError instanceof Error
          ? submissionError.message
          : "The signal source could not be created."
      );
    } finally {
      setIsSavingSource(false);
    }
  };

  const runSource = async (sourceId: string) => {
    setRunningSourceId(sourceId);
    setOperationError(undefined);
    try {
      const result = await runPersistedSource(activeProject.id, sourceId);
      if (result.run.status === "failed") {
        setOperationError(result.run.errors.join(" ") || "The discovery run failed.");
      }
    } catch (runError) {
      setOperationError(
        runError instanceof Error ? runError.message : "The discovery run could not be started."
      );
    } finally {
      setRunningSourceId(null);
    }
  };

  const toggleSource = async (sourceId: string, isActive: boolean) => {
    setUpdatingSourceId(sourceId);
    setOperationError(undefined);
    try {
      await updateSource(activeProject.id, sourceId, { isActive });
    } catch (updateError) {
      setOperationError(
        updateError instanceof Error ? updateError.message : "The signal source could not be updated."
      );
    } finally {
      setUpdatingSourceId(null);
    }
  };

  return (
    <>
      <PageHeading
        title="Autonomous Pipeline"
        description="Configure source scanning. Each run persists normalized signals and deterministic candidate mappings for later deliberation."
        breadcrumbs={[{ text: "ReydarOS", href: "/" }, { text: "Autonomous Pipeline", href: "/signal-discovery" }]}
        action={
          <Button
            appearance="primary"
            isDisabled={status !== "ready" || !activeProject.id}
            onClick={() => {
              setFormError(undefined);
              setIsOpen(true);
            }}
          >
            Add source
          </Button>
        }
      />

      <Box paddingBlockEnd="space.200">
        <DiscoveryLoadState status={status} error={error} retry={retry} />
        {operationError ? (
          <SectionMessage appearance="error" title="Discovery action failed">
            <p>{operationError}</p>
          </SectionMessage>
        ) : null}
        <Banner appearance="warning">
          Phase 2 stops after candidate mapping. Deliberation, drafting, autonomy, and posting remain local and are not run by source scans.
        </Banner>
      </Box>

      <SectionPanel title="Configured signal sources" description={`Active project: ${activeProject.name}`}>
        {status === "ready" && sources.length ? (
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
                    <Inline space="space.050" shouldWrap>
                      <LoadingButton
                        isLoading={runningSourceId === source.id}
                        onClick={() => runSource(source.id)}
                        isDisabled={!source.isActive || updatingSourceId === source.id}
                      >
                        Run discovery
                      </LoadingButton>
                      <LoadingButton
                        isLoading={updatingSourceId === source.id}
                        onClick={() => toggleSource(source.id, !source.isActive)}
                      >
                        {source.isActive ? "Deactivate" : "Activate"}
                      </LoadingButton>
                    </Inline>
                  )
                }
              ]
            }))}
            rowsPerPage={8}
          />
        ) : status === "ready" ? (
          <EmptyState
            header="No signal sources configured"
            description="Add a source to start database-backed discovery and candidate mapping."
            primaryAction={
              <Button
                appearance="primary"
                onClick={() => {
                  setFormError(undefined);
                  setIsOpen(true);
                }}
              >
                Add source
              </Button>
            }
          />
        ) : null}
      </SectionPanel>

      <Box paddingBlockStart="space.200">
        <SectionPanel
          title="Discovery run history"
          description="Every scan records its provider, lifecycle, normalized items, candidate count, and any failure details."
          action={
            <div className="form-field panel-action-select">
              <Select isSearchable={false} placeholder="Jump to source" options={sourceOptions} />
            </div>
          }
        >
          {status === "ready" && runs.length ? (
            <DynamicTable
              head={{
                cells: [
                  { key: "source", content: "Source" },
                  { key: "provider", content: "Provider" },
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
          ) : status === "ready" ? (
            <EmptyState header="No discovery runs yet" description="Run a source to persist discovered items and mapped candidates." />
          ) : null}
        </SectionPanel>
      </Box>

      {isOpen ? (
        <AppDialog
          footer={
            <>
              <Button
                type="button"
                appearance="subtle"
                isDisabled={isSavingSource}
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button appearance="primary" type="submit" isDisabled={isSavingSource}>
                {isSavingSource ? "Creating…" : "Create source"}
              </Button>
            </>
          }
          onClose={() => {
            if (!isSavingSource) setIsOpen(false);
          }}
          onSubmit={submitSource}
          testId="add-signal-source-dialog"
          title="Add signal source"
          width="large"
        >
          <Stack space="space.200">
                  {formError ? (
                    <SectionMessage appearance="error" title="Signal source was not created">
                      <p>{formError}</p>
                    </SectionMessage>
                  ) : null}
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
                          onChange={(option) => setForm((current) => ({
                            ...current,
                            sourceType: String(option?.value ?? "mock") as SignalSourceCreateInput["sourceType"]
                          }))}
                        />
                      </Field>
                    </div>
                    <div className="form-field">
                      <Field label="Community/subreddit" htmlFor="community-name">
                        <Textfield
                          id="community-name"
                          value={form.communityName}
                          onChange={(event) => updateForm("communityName", event.currentTarget.value)}
                          isRequired
                        />
                      </Field>
                    </div>
                  </Inline>
                  <Field label="Source URL" htmlFor="source-url">
                    <Textfield
                      id="source-url"
                      value={form.sourceUrl}
                      onChange={(event) => updateForm("sourceUrl", event.currentTarget.value)}
                    />
                  </Field>
                  <div className="dense-grid">
                    <Field label="Keywords" htmlFor="source-keywords">
                      <TextArea id="source-keywords" value={form.keywords} onChange={(event) => updateForm("keywords", event.currentTarget.value)} minimumRows={5} />
                    </Field>
                    <Field label="Competitor terms" htmlFor="source-competitors">
                      <TextArea id="source-competitors" value={form.competitorTerms} onChange={(event) => updateForm("competitorTerms", event.currentTarget.value)} minimumRows={5} />
                    </Field>
                    <Field label="Pain-point terms" htmlFor="source-pain">
                      <TextArea id="source-pain" value={form.painPointTerms} onChange={(event) => updateForm("painPointTerms", event.currentTarget.value)} minimumRows={5} />
                    </Field>
                    <Field label="Excluded terms" htmlFor="source-excluded">
                      <TextArea id="source-excluded" value={form.excludedTerms} onChange={(event) => updateForm("excludedTerms", event.currentTarget.value)} minimumRows={5} />
                    </Field>
                  </div>
                  <Inline space="space.200" shouldWrap>
                    <div className="form-field">
                      <Field label="Scan frequency" htmlFor="scan-frequency">
                        <Textfield id="scan-frequency" value={form.scanFrequency} onChange={(event) => updateForm("scanFrequency", event.currentTarget.value)} />
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
        </AppDialog>
      ) : null}
    </>
  );
}
