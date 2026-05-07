"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Badge from "@atlaskit/badge";
import Button from "@atlaskit/button";
import DropdownMenu, { DropdownItem, DropdownItemGroup } from "@atlaskit/dropdown-menu";
import DynamicTable from "@atlaskit/dynamic-table";
import EmptyState from "@atlaskit/empty-state";
import Select from "@/components/apple-select";
import { Box } from "@atlaskit/primitives";
import { PageHeading } from "@/components/page-heading";
import { SectionPanel } from "@/components/section-panel";
import { AutonomyStatusLozenge, CandidateStatusLozenge, OpportunityStatusLozenge, RiskLozenge } from "@/components/status-lozenge";
import { opportunityStatusLabels, productMentionLabels, recommendedActionLabels } from "@/lib/labels";
import { useReydar } from "@/lib/store";
import type { OpportunityStatus, RiskLevel } from "@/lib/types";

const statusOptions = Object.entries(opportunityStatusLabels).map(([value, label]) => ({ value, label }));
const riskOptions = ["low", "medium", "high", "blocked"].map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }));

export function OpportunityInboxScreen() {
  const { state, updateOpportunityStatus } = useReydar();
  const [statusFilter, setStatusFilter] = useState<OpportunityStatus | "all">("all");
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "all">("all");
  const [quickFilter, setQuickFilter] = useState<"all" | "high_intent" | "low_risk" | "product_allowed" | "helpful_only" | "insight_only">("all");

  const filtered = useMemo(() => {
    return state.opportunities.filter((opportunity) => {
      if (statusFilter !== "all" && opportunity.status !== statusFilter) return false;
      if (riskFilter !== "all" && opportunity.riskLevel !== riskFilter) return false;
      if (quickFilter === "high_intent" && opportunity.scores.intentScore < 75) return false;
      if (quickFilter === "low_risk" && opportunity.riskLevel !== "low") return false;
      if (quickFilter === "product_allowed" && opportunity.productMentionLevel < 2) return false;
      if (quickFilter === "helpful_only" && opportunity.productMentionLevel !== 0) return false;
      if (quickFilter === "insight_only" && opportunity.recommendedAction !== "save_as_market_insight") return false;
      return true;
    });
  }, [quickFilter, riskFilter, state.opportunities, statusFilter]);

  return (
    <>
      <PageHeading
        title="Review Inbox"
        description="Exception queue for analyzed opportunities that need approval, edits, or a hard stop."
        breadcrumbs={[{ text: "ReydarOS", href: "/" }, { text: "Review Inbox", href: "/opportunities" }]}
        action={<Button appearance="primary" href="/signal-discovery">Run autonomous pipeline</Button>}
      />

      <SectionPanel
        className="filters-panel"
        title="Filters"
        description="Filter for intent, risk, mention level, community, status, and response posture."
      >
        <div className="filter-stack">
          <div className="filter-chip-row">
            {[
              ["all", "All"],
              ["high_intent", "High intent"],
              ["low_risk", "Low risk"],
              ["product_allowed", "Product mention allowed"],
              ["helpful_only", "Helpful-only"],
              ["insight_only", "Market insight only"]
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
                placeholder="Status"
                options={[{ value: "all", label: "All statuses" }, ...statusOptions]}
                value={[{ value: "all", label: "All statuses" }, ...statusOptions].find((option) => option.value === statusFilter)}
                onChange={(option) => setStatusFilter((option?.value ?? "all") as OpportunityStatus | "all")}
              />
            </div>
            <div className="form-field">
              <Select
                isSearchable={false}
                placeholder="Risk"
                options={[{ value: "all", label: "All risks" }, ...riskOptions]}
                value={[{ value: "all", label: "All risks" }, ...riskOptions].find((option) => option.value === riskFilter)}
                onChange={(option) => setRiskFilter((option?.value ?? "all") as RiskLevel | "all")}
              />
            </div>
          </div>
        </div>
      </SectionPanel>

      <Box paddingBlockStart="space.200">
        <SectionPanel title="Analyzed opportunities" description={`${filtered.length} conversation${filtered.length === 1 ? "" : "s"} in view.`}>
          {filtered.length ? (
            <DynamicTable
              head={{
                cells: [
                  { key: "title", content: "Thread title", isSortable: true },
                  { key: "community", content: "Community" },
                  { key: "platform", content: "Platform" },
                  { key: "pain", content: "Pain point" },
                  { key: "relevance", content: "Relevance" },
                  { key: "intent", content: "Intent" },
                  { key: "fit", content: "Product fit" },
                  { key: "risk", content: "Risk" },
                  { key: "action", content: "Recommended action" },
                  { key: "mention", content: "Mention" },
                  { key: "candidate", content: "Candidate status" },
                  { key: "deliberation", content: "Deliberation" },
                  { key: "status", content: "Status" },
                  { key: "created", content: "Created" },
                  { key: "actions", content: "Actions" }
                ]
              }}
              rows={filtered.map((opportunity) => {
                const candidate = state.conversationCandidates.find((item) => item.opportunityId === opportunity.id);
                const deliberation = candidate
                  ? state.deliberationRuns.find((item) => item.candidateId === candidate.id)
                  : undefined;
                return {
                  key: opportunity.id,
                  cells: [
                  { key: "title", content: <Link href={`/opportunities/${opportunity.id}`}>{opportunity.threadTitle}</Link> },
                  { key: "community", content: opportunity.community },
                  { key: "platform", content: opportunity.platform },
                  { key: "pain", content: opportunity.painPoint },
                  { key: "relevance", content: <Badge>{opportunity.scores.relevanceScore}</Badge> },
                  { key: "intent", content: <Badge>{opportunity.scores.intentScore}</Badge> },
                  { key: "fit", content: <Badge>{opportunity.scores.productFitScore}</Badge> },
                  { key: "risk", content: <RiskLozenge value={opportunity.riskLevel} /> },
                  { key: "action", content: recommendedActionLabels[opportunity.recommendedAction] },
                  { key: "mention", content: productMentionLabels[opportunity.productMentionLevel] },
                  { key: "candidate", content: candidate ? <CandidateStatusLozenge value={candidate.status} /> : "Not mapped" },
                  { key: "deliberation", content: deliberation ? <AutonomyStatusLozenge value={deliberation.autonomyStatus} /> : "Not run" },
                  { key: "status", content: <OpportunityStatusLozenge value={opportunity.status} /> },
                  { key: "created", content: new Date(opportunity.createdAt).toLocaleDateString() },
                  {
                    key: "actions",
                    content: (
                      <DropdownMenu trigger="Actions" spacing="compact">
                        <DropdownItemGroup>
                          <DropdownItem href={`/opportunities/${opportunity.id}`}>Open detail</DropdownItem>
                          <DropdownItem href={`/response-studio?opportunity=${opportunity.id}`}>Open Review Studio</DropdownItem>
                          <DropdownItem onClick={() => updateOpportunityStatus(opportunity.id, "approved")}>Approve</DropdownItem>
                          <DropdownItem onClick={() => updateOpportunityStatus(opportunity.id, "rejected")}>Reject</DropdownItem>
                          <DropdownItem onClick={() => updateOpportunityStatus(opportunity.id, "saved_as_insight")}>Save as insight</DropdownItem>
                          <DropdownItem onClick={() => updateOpportunityStatus(opportunity.id, "do_not_reply")}>Do not reply</DropdownItem>
                        </DropdownItemGroup>
                      </DropdownMenu>
                    )
                  }
                ]
              };
              })}
              rowsPerPage={10}
            />
          ) : (
            <EmptyState
              header="No opportunities match these filters"
              description="Adjust filters or run the autonomous pipeline to create analyzed opportunities."
              primaryAction={<Button appearance="primary" href="/signal-discovery">Run autonomous pipeline</Button>}
            />
          )}
        </SectionPanel>
      </Box>
    </>
  );
}
