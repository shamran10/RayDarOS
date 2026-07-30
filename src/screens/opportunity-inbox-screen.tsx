"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Badge from "@atlaskit/badge";
import Banner from "@atlaskit/banner";
import Button from "@atlaskit/button";
import DynamicTable from "@atlaskit/dynamic-table";
import EmptyState from "@atlaskit/empty-state";
import Select from "@/components/apple-select";
import { Box } from "@atlaskit/primitives";
import { PageHeading } from "@/components/page-heading";
import { SectionPanel } from "@/components/section-panel";
import {
  AutonomyStatusLozenge,
  CandidateStatusLozenge,
  OpportunityStatusLozenge,
  RiskLozenge
} from "@/components/status-lozenge";
import { useDeliberation } from "@/lib/deliberation/context";
import {
  finalDecisionActionLabels,
  opportunityStatusLabels
} from "@/lib/labels";
import { useReydar } from "@/lib/store";
import type { OpportunityStatus, RiskLevel } from "@/lib/types";

const statusOptions = Object.entries(opportunityStatusLabels).map(
  ([value, label]) => ({ value, label })
);
const riskOptions = ["low", "medium", "high", "blocked"].map((value) => ({
  value,
  label: value[0].toUpperCase() + value.slice(1)
}));

export function OpportunityInboxScreen() {
  const { activeProject } = useReydar();
  const { opportunities, status, error, retry } = useDeliberation();
  const [statusFilter, setStatusFilter] = useState<
    OpportunityStatus | "all"
  >("all");
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "all">("all");
  const [quickFilter, setQuickFilter] = useState<
    "all" | "high_intent" | "low_risk" | "completed" | "blocked"
  >("all");

  const filtered = useMemo(
    () =>
      opportunities.filter(({ opportunity, latestRun }) => {
        if (opportunity.projectId !== activeProject.id) return false;
        if (
          statusFilter !== "all" &&
          opportunity.status !== statusFilter
        ) {
          return false;
        }
        if (riskFilter !== "all" && opportunity.riskLevel !== riskFilter) {
          return false;
        }
        if (
          quickFilter === "high_intent" &&
          (opportunity.scores?.intentScore ?? 0) < 75
        ) {
          return false;
        }
        if (quickFilter === "low_risk" && opportunity.riskLevel !== "low") {
          return false;
        }
        if (
          quickFilter === "completed" &&
          latestRun?.run.status !== "completed"
        ) {
          return false;
        }
        if (
          quickFilter === "blocked" &&
          latestRun?.run.status !== "blocked"
        ) {
          return false;
        }
        return true;
      }),
    [activeProject.id, opportunities, quickFilter, riskFilter, statusFilter]
  );

  return (
    <>
      <PageHeading
        title="Opportunity Inbox"
        description="Persisted opportunities created only when a candidate enters deliberation."
        breadcrumbs={[
          { text: "ReydarOS", href: "/" },
          { text: "Opportunity Inbox", href: "/opportunities" }
        ]}
        action={
          <Button appearance="primary" href="/candidates">
            Open Candidate Map
          </Button>
        }
      />

      {status === "error" ? (
        <Box paddingBlockEnd="space.200">
          <Banner appearance="warning">
            {error ?? "Opportunities could not be loaded."}{" "}
            <button className="link-button" onClick={() => void retry()}>
              Retry
            </button>
          </Banner>
        </Box>
      ) : null}

      <SectionPanel
        className="filters-panel"
        title="Filters"
        description={`Database-backed opportunity history for ${activeProject.name}.`}
      >
        <div className="filter-stack">
          <div className="filter-chip-row">
            {[
              ["all", "All"],
              ["high_intent", "High intent"],
              ["low_risk", "Low risk"],
              ["completed", "Completed"],
              ["blocked", "Blocked"]
            ].map(([value, label]) => (
              <Button
                key={value}
                appearance={quickFilter === value ? "primary" : "default"}
                onClick={() => setQuickFilter(value as typeof quickFilter)}
              >
                {label}
              </Button>
            ))}
          </div>
          <div className="filter-select-grid">
            <div className="form-field">
              <Select
                isSearchable={false}
                options={[
                  { value: "all", label: "All statuses" },
                  ...statusOptions
                ]}
                value={[
                  { value: "all", label: "All statuses" },
                  ...statusOptions
                ].find((option) => option.value === statusFilter)}
                onChange={(option) =>
                  setStatusFilter(
                    (option?.value ?? "all") as OpportunityStatus | "all"
                  )
                }
              />
            </div>
            <div className="form-field">
              <Select
                isSearchable={false}
                options={[
                  { value: "all", label: "All risks" },
                  ...riskOptions
                ]}
                value={[
                  { value: "all", label: "All risks" },
                  ...riskOptions
                ].find((option) => option.value === riskFilter)}
                onChange={(option) =>
                  setRiskFilter(
                    (option?.value ?? "all") as RiskLevel | "all"
                  )
                }
              />
            </div>
          </div>
        </div>
      </SectionPanel>

      <Box paddingBlockStart="space.200">
        <SectionPanel
          title="Persisted opportunities"
          description={`${filtered.length} ${
            filtered.length === 1 ? "opportunity" : "opportunities"
          } in view.`}
        >
          {status === "loading" ? (
            <p className="muted-text">Loading persisted opportunities…</p>
          ) : filtered.length ? (
            <DynamicTable
              head={{
                cells: [
                  { key: "title", content: "Source conversation" },
                  { key: "source", content: "Source" },
                  { key: "candidate", content: "Candidate" },
                  { key: "relevance", content: "Relevance" },
                  { key: "risk", content: "Risk" },
                  { key: "run", content: "Latest run" },
                  { key: "decision", content: "Latest decision" },
                  { key: "autonomy", content: "Autonomy" },
                  { key: "status", content: "Opportunity" },
                  { key: "action", content: "Action" }
                ]
              }}
              rows={filtered.map(({ opportunity, candidate, latestRun }) => ({
                key: opportunity.id,
                cells: [
                  {
                    key: "title",
                    content: (
                      <Link href={`/opportunities/${opportunity.id}`}>
                        {opportunity.threadTitle}
                      </Link>
                    )
                  },
                  {
                    key: "source",
                    content: `${opportunity.platform} / ${opportunity.community}`
                  },
                  {
                    key: "candidate",
                    content: <CandidateStatusLozenge value={candidate.status} />
                  },
                  {
                    key: "relevance",
                    content: (
                      <Badge>
                        {opportunity.scores?.relevanceScore ??
                          candidate.initialRelevanceScore}
                      </Badge>
                    )
                  },
                  {
                    key: "risk",
                    content: <RiskLozenge value={opportunity.riskLevel} />
                  },
                  {
                    key: "run",
                    content: latestRun
                      ? `Revision ${latestRun.run.revision} · ${
                          latestRun.run.status
                        } · ${new Date(latestRun.run.startedAt).toLocaleString()}`
                      : "Not run"
                  },
                  {
                    key: "decision",
                    content: latestRun?.decision
                      ? finalDecisionActionLabels[
                          latestRun.decision.selectedAction
                        ]
                      : "Pending"
                  },
                  {
                    key: "autonomy",
                    content: latestRun ? (
                      <AutonomyStatusLozenge
                        value={latestRun.run.autonomyStatus}
                      />
                    ) : (
                      "Pending"
                    )
                  },
                  {
                    key: "status",
                    content: (
                      <OpportunityStatusLozenge value={opportunity.status} />
                    )
                  },
                  {
                    key: "action",
                    content: (
                      <Button href={`/opportunities/${opportunity.id}`}>
                        Open detail
                      </Button>
                    )
                  }
                ]
              }))}
              rowsPerPage={10}
            />
          ) : (
            <EmptyState
              header="No persisted opportunities yet"
              description="Start deliberation for a database-backed candidate. Discovery alone does not create opportunities."
              primaryAction={
                <Button appearance="primary" href="/candidates">
                  Open Candidate Map
                </Button>
              }
            />
          )}
        </SectionPanel>
      </Box>
    </>
  );
}
