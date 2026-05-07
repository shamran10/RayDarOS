"use client";

import { useState } from "react";
import Button from "@atlaskit/button";
import DynamicTable from "@atlaskit/dynamic-table";
import EmptyState from "@atlaskit/empty-state";
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle, ModalTransition } from "@atlaskit/modal-dialog";
import Tabs, { Tab, TabList, TabPanel } from "@atlaskit/tabs";
import TextArea from "@atlaskit/textarea";
import Textfield from "@atlaskit/textfield";
import { Stack } from "@atlaskit/primitives";
import { PageHeading } from "@/components/page-heading";
import { SectionPanel } from "@/components/section-panel";
import { StatusPill } from "@/components/status-lozenge";
import { useReydar } from "@/lib/store";
import type { MarketInsight } from "@/lib/types";

const categories = [
  "Recurring pain points",
  "Audience language",
  "Common objections",
  "Competitor complaints",
  "Feature requests",
  "Buying triggers",
  "Misunderstood problems",
  "Content ideas",
  "Sales messaging improvements",
  "Product positioning recommendations",
  "Community behavior patterns"
];

export function MarketInsightsScreen() {
  const { activeProject, state, approveInsight, saveInsight } = useReydar();
  const [editing, setEditing] = useState<MarketInsight | undefined>();
  const projectInsights = state.marketInsights.filter((insight) => insight.projectId === activeProject.id);
  const insightHead = {
    cells: [
      { key: "title", content: "Title" },
      { key: "category", content: "Category" },
      { key: "source", content: "Source" },
      { key: "confidence", content: "Confidence" },
      { key: "approved", content: "Status" },
      { key: "actions", content: "Actions" }
    ]
  };
  const rows = projectInsights.map((insight) => ({
    key: insight.id,
    cells: [
      {
        key: "title",
        content: (
          <span className="market-insight-title">
            <strong>{insight.title}</strong>
            <span>{insight.insight}</span>
          </span>
        )
      },
      { key: "category", content: insight.category },
      { key: "source", content: insight.source },
      { key: "confidence", content: `${Math.round(insight.confidence * 100)}%` },
      {
        key: "approved",
        content: (
          <StatusPill tone={insight.approved ? "status-good" : "status-watch"}>
            {insight.approved ? "Approved" : "Needs review"}
          </StatusPill>
        )
      },
      { key: "actions", content: <Button onClick={() => (insight.approved ? setEditing(insight) : approveInsight(insight.id))}>{insight.approved ? "Edit" : "Approve"}</Button> }
    ]
  }));
  const approvedRows = rows.filter((_, index) => projectInsights[index]?.approved);
  const needsReviewRows = rows.filter((_, index) => !projectInsights[index]?.approved);

  return (
    <>
      <PageHeading
        title="Market Insights"
        description="Turn engagement activity into strategic learning that is traceable to sources."
        breadcrumbs={[{ text: "ReydarOS", href: "/" }, { text: "Market Insights", href: "/market-insights" }]}
      />

      <SectionPanel title="Insight memory">
        <Tabs id="market-insights-tabs">
          <TabList>
            <Tab>All insights</Tab>
            <Tab>Approved</Tab>
            <Tab>Needs review</Tab>
            <Tab>From deliberations</Tab>
            <Tab>Categories</Tab>
          </TabList>
          <TabPanel>
            {projectInsights.length ? (
              <DynamicTable
                head={insightHead}
                rows={rows}
                rowsPerPage={10}
              />
            ) : (
              <EmptyState header="No market insights yet" description="DARM will create insight candidates from analyzed opportunities." />
            )}
          </TabPanel>
          <TabPanel>
            <DynamicTable head={insightHead} rows={approvedRows} />
          </TabPanel>
          <TabPanel>
            <DynamicTable head={insightHead} rows={needsReviewRows} />
          </TabPanel>
          <TabPanel>
            <DynamicTable
              head={{ cells: [{ key: "title", content: "Insight" }, { key: "candidate", content: "Candidate" }, { key: "decision", content: "Deliberation" }] }}
              rows={projectInsights
                .filter((insight) => insight.candidateId || insight.deliberationRunId)
                .map((insight) => {
                  const candidate = state.conversationCandidates.find((item) => item.id === insight.candidateId);
                  const run = state.deliberationRuns.find((item) => item.id === insight.deliberationRunId);
                  return {
                    key: insight.id,
                    cells: [
                      { key: "title", content: insight.title },
                      { key: "candidate", content: candidate?.title ?? "Outcome memory" },
                      { key: "decision", content: run?.finalDecision?.replaceAll("_", " ") ?? "Not linked" }
                    ]
                  };
                })}
            />
          </TabPanel>
          <TabPanel>
            <div className="market-category-grid">
              {categories.map((category) => (
                <div className="market-category-card" key={category}>
                  <strong>{category}</strong>
                  <span>{projectInsights.filter((insight) => insight.category === category).length} items</span>
                </div>
              ))}
            </div>
          </TabPanel>
        </Tabs>
      </SectionPanel>

      <ModalTransition>
        {editing ? (
          <Modal onClose={() => setEditing(undefined)} width="large">
            <ModalHeader><ModalTitle>Edit insight</ModalTitle></ModalHeader>
            <ModalBody>
              <Stack space="space.200">
                <Textfield
                  value={editing.title}
                  onChange={(event) => setEditing((current) => current ? { ...current, title: event.currentTarget.value } : current)}
                />
                <TextArea
                  value={editing.insight}
                  minimumRows={8}
                  onChange={(event) => setEditing((current) => current ? { ...current, insight: event.currentTarget.value } : current)}
                />
              </Stack>
            </ModalBody>
            <ModalFooter>
              <Button appearance="subtle" onClick={() => setEditing(undefined)}>Cancel</Button>
              <Button
                appearance="primary"
                onClick={() => {
                  saveInsight({ ...editing, updatedAt: new Date().toISOString() });
                  setEditing(undefined);
                }}
              >
                Save insight
              </Button>
            </ModalFooter>
          </Modal>
        ) : null}
      </ModalTransition>
    </>
  );
}
