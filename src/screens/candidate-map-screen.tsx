"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Badge from "@atlaskit/badge";
import Banner from "@atlaskit/banner";
import Button, { LoadingButton } from "@atlaskit/button";
import DynamicTable from "@atlaskit/dynamic-table";
import EmptyState from "@atlaskit/empty-state";
import Select from "@/components/apple-select";
import TextArea from "@atlaskit/textarea";
import { Box, Inline, Stack } from "@atlaskit/primitives";
import { DiscoveryLoadState } from "@/components/discovery-load-state";
import { PageHeading } from "@/components/page-heading";
import { SectionPanel } from "@/components/section-panel";
import { CandidateStatusLozenge } from "@/components/status-lozenge";
import { useDeliberation } from "@/lib/deliberation/context";
import { useDiscovery } from "@/lib/discovery/context";
import { candidateTypeLabels } from "@/lib/labels";
import { useReydar } from "@/lib/store";
import type { CandidateStatus, CandidateType } from "@/lib/types";

const statusOptions = [
  "all",
  "mapped",
  "queued_for_approval",
  "safe_to_auto_engage",
  "monitor_only",
  "saved_as_insight",
  "blocked"
].map((value) => ({ label: value === "all" ? "All statuses" : value.replaceAll("_", " "), value }));

export function CandidateMapScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeProject } = useReydar();
  const { snapshot, status, error, retry } = useDiscovery();
  const {
    opportunities,
    startCandidate,
    status: deliberationStatus
  } = useDeliberation();
  const [statusFilter, setStatusFilter] = useState<CandidateStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<CandidateType | "all">("all");
  const [selectedId, setSelectedId] = useState<string | undefined>(
    searchParams.get("candidate") ?? undefined
  );
  const [runningCandidateId, setRunningCandidateId] = useState<string>();
  const [deliberationError, setDeliberationError] = useState<string>();
  const candidates = snapshot.conversationCandidates.filter(
    (candidate) => candidate.projectId === activeProject.id
  );
  const filtered = useMemo(
    () =>
      candidates.filter((candidate) => {
        if (statusFilter !== "all" && candidate.status !== statusFilter) return false;
        if (typeFilter !== "all" && candidate.candidateType !== typeFilter) return false;
        return true;
      }),
    [candidates, statusFilter, typeFilter]
  );
  const selected = candidates.find((candidate) => candidate.id === selectedId) ?? filtered[0];
  const selectedItem = selected
    ? snapshot.discoveredItems.find((item) => item.id === selected.discoveredItemId)
    : undefined;
  const typeOptions = [
    { label: "All candidate types", value: "all" },
    ...Object.entries(candidateTypeLabels).map(([value, label]) => ({ label, value }))
  ];
  const opportunityByCandidate = new Map(
    opportunities.map((item) => [item.candidate.id, item])
  );

  const deliberate = async (candidateId: string) => {
    const existing = opportunityByCandidate.get(candidateId);
    if (existing) {
      router.push(`/opportunities/${existing.opportunity.id}`);
      return;
    }

    setRunningCandidateId(candidateId);
    setDeliberationError(undefined);
    try {
      const result = await startCandidate(candidateId);
      await retry();
      router.push(`/opportunities/${result.opportunity.opportunity.id}`);
    } catch (runError) {
      setDeliberationError(
        runError instanceof Error
          ? runError.message
          : "Deliberation could not be started."
      );
    } finally {
      setRunningCandidateId(undefined);
    }
  };

  return (
    <>
      <PageHeading
        title="Candidate Map Debug"
        description="Inspect persisted candidate mappings and start deterministic deliberation."
        breadcrumbs={[{ text: "ReydarOS", href: "/" }, { text: "Candidate Map Debug", href: "/candidates" }]}
        action={<Button appearance="primary" href="/signal-discovery">Run autonomous pipeline</Button>}
      />

      <Box paddingBlockEnd="space.200">
        <DiscoveryLoadState status={status} error={error} retry={retry} />
      </Box>
      {deliberationError ? (
        <Box paddingBlockEnd="space.200">
          <Banner appearance="warning">{deliberationError}</Banner>
        </Box>
      ) : null}

      <div className="two-column-workspace">
        <Stack space="space.200">
          <SectionPanel
            className="filters-panel"
            title="Filters"
            description={`Showing ${filtered.length} candidate${filtered.length === 1 ? "" : "s"} for ${activeProject.name}.`}
          >
            <div className="filter-select-grid">
              <div className="form-field">
                <Select
                  isSearchable={false}
                  options={statusOptions}
                  value={statusOptions.find((option) => option.value === statusFilter)}
                  onChange={(option) => setStatusFilter(String(option?.value ?? "all") as CandidateStatus | "all")}
                />
              </div>
              <div className="form-field">
                <Select
                  isSearchable={false}
                  options={typeOptions}
                  value={typeOptions.find((option) => option.value === typeFilter)}
                  onChange={(option) => setTypeFilter(String(option?.value ?? "all") as CandidateType | "all")}
                />
              </div>
            </div>
          </SectionPanel>

          <SectionPanel title="Mapped candidates" description="Candidates are possible entry points generated by the pipeline before policy decisions are made.">
            {status === "ready" && filtered.length ? (
              <DynamicTable
                head={{
                  cells: [
                    { key: "candidate", content: "Candidate" },
                    { key: "type", content: "Type" },
                    { key: "pain", content: "Pain point" },
                    { key: "intent", content: "Intent" },
                    { key: "relevance", content: "Relevance" },
                    { key: "risk", content: "Risk" },
                    { key: "status", content: "Status" },
                    { key: "action", content: "Actions" }
                  ]
                }}
                rows={filtered.map((candidate) => ({
                  key: candidate.id,
                  cells: [
                    {
                      key: "candidate",
                      content: (
                        <button className="link-button" onClick={() => setSelectedId(candidate.id)}>
                          {candidate.title}
                        </button>
                      )
                    },
                    { key: "type", content: candidateTypeLabels[candidate.candidateType] },
                    { key: "pain", content: candidate.detectedPainPoint },
                    { key: "intent", content: candidate.detectedIntent },
                    { key: "relevance", content: <Badge>{candidate.initialRelevanceScore}</Badge> },
                    { key: "risk", content: <Badge>{candidate.initialRiskScore}</Badge> },
                    { key: "status", content: <CandidateStatusLozenge value={candidate.status} /> },
                    {
                      key: "action",
                      content: (
                        <Inline space="space.050" shouldWrap>
                          <Button onClick={() => setSelectedId(candidate.id)}>Inspect</Button>
                          <LoadingButton
                            appearance="primary"
                            isDisabled={
                              deliberationStatus !== "ready" ||
                              Boolean(runningCandidateId)
                            }
                            isLoading={runningCandidateId === candidate.id}
                            onClick={() => void deliberate(candidate.id)}
                          >
                            {opportunityByCandidate.has(candidate.id)
                              ? "Open opportunity"
                              : "Start deliberation"}
                          </LoadingButton>
                        </Inline>
                      )
                    }
                  ]
                }))}
                rowsPerPage={10}
              />
            ) : status === "ready" ? (
              <EmptyState
                header="No candidates yet"
                description="Run the autonomous pipeline to map candidate entry points."
                primaryAction={<Button appearance="primary" href="/signal-discovery">Run autonomous pipeline</Button>}
              />
            ) : null}
          </SectionPanel>
        </Stack>

        <aside className="right-panel-sticky">
          {selected ? (
            <Stack space="space.200">
              <SectionPanel title="Thread summary" description={`${selected.platform} / ${selected.community}`}>
                <Stack space="space.150">
                  <Inline space="space.100" shouldWrap>
                    <CandidateStatusLozenge value={selected.status} />
                    <Badge>{candidateTypeLabels[selected.candidateType]}</Badge>
                  </Inline>
                  <strong>{selected.title}</strong>
                  <p>{selected.candidateSummary}</p>
                  <TextArea value={selected.body} minimumRows={8} isReadOnly />
                  {selectedItem ? (
                    <span className="small-text muted-text">
                      Source score {selectedItem.score ?? "n/a"} · replies {selectedItem.replyCount ?? "n/a"}
                    </span>
                  ) : null}
                </Stack>
              </SectionPanel>
              <SectionPanel title="Recommended next step">
                <Stack space="space.150">
                  <p>{selected.recommendedNextStep}</p>
                  <p className="muted-text">{selected.whyWorthAnalyzing}</p>
                  <Inline space="space.100" shouldWrap>
                    <LoadingButton
                      appearance="primary"
                      isDisabled={
                        deliberationStatus !== "ready" ||
                        Boolean(runningCandidateId)
                      }
                      isLoading={runningCandidateId === selected.id}
                      onClick={() => void deliberate(selected.id)}
                    >
                      {opportunityByCandidate.has(selected.id)
                        ? "Open opportunity"
                        : "Start deliberation"}
                    </LoadingButton>
                  </Inline>
                  {selected.url ? <Link href={selected.url}>Open source URL</Link> : null}
                </Stack>
              </SectionPanel>
            </Stack>
          ) : (
            <SectionPanel title="No candidate selected">
              <p>Select a candidate to inspect the entry point and decision trail.</p>
            </SectionPanel>
          )}
        </aside>
      </div>

      <Box paddingBlockStart="space.200">
        <SectionPanel title="Mapping rules" description="The mapper identifies where ReydarOS could enter, not what it should say.">
          <div className="dense-grid">
            {["Original post", "Top comment", "Nested reply", "Unanswered question", "Competitor mention", "Tool request", "Buying intent", "Market insight only"].map((label) => (
              <div className="panel-muted" key={label}>
                <Box padding="space.150"><strong>{label}</strong></Box>
              </div>
            ))}
          </div>
        </SectionPanel>
      </Box>
    </>
  );
}
