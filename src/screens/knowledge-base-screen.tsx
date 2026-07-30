"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import Button from "@atlaskit/button";
import DynamicTable from "@atlaskit/dynamic-table";
import EmptyState from "@atlaskit/empty-state";
import InlineEdit from "@atlaskit/inline-edit";
import Select from "@/components/apple-select";
import SectionMessage from "@atlaskit/section-message";
import Tabs, { Tab, TabList, TabPanel } from "@atlaskit/tabs";
import TextArea from "@atlaskit/textarea";
import Textfield from "@atlaskit/textfield";
import AddIcon from "@atlaskit/icon/core/add";
import UploadIcon from "@atlaskit/icon/core/upload";
import LinkIcon from "@atlaskit/icon/core/link";
import { Box, Inline, Stack } from "@atlaskit/primitives";
import { AppDialog } from "@/components/app-dialog";
import { Field } from "@/components/field";
import { PageHeading } from "@/components/page-heading";
import { ProjectBrainLoadState } from "@/components/project-brain-load-state";
import { SectionPanel } from "@/components/section-panel";
import { HealthLozenge, KnowledgeStatusLozenge } from "@/components/status-lozenge";
import { useReydar } from "@/lib/store";
import type { KnowledgeHealth, KnowledgeItem, KnowledgeStatus } from "@/lib/types";

const productCategories = [
  "Product overview",
  "Core features",
  "Use cases",
  "Value propositions",
  "Target personas",
  "Target industries",
  "Benefits",
  "Objections",
  "Pricing",
  "FAQs",
  "Competitors",
  "Approved claims",
  "Restricted claims",
  "Tone of voice",
  "Product limitations",
  "Messaging examples",
  "Technical documentation"
];

const marketCategories = [
  "Audience personas",
  "Industry problems",
  "Common pain points",
  "Buying triggers",
  "Common frustrations",
  "Existing tools",
  "Competitors",
  "Manual workarounds",
  "Audience language",
  "Reddit phrases",
  "Search keywords",
  "Subreddit topics",
  "Use-case scenarios",
  "Industry trends",
  "Objections",
  "Common questions",
  "Customer journey stages",
  "Decision-maker concerns",
  "End-user concerns"
];

const statusOptions: Array<{ label: string; value: KnowledgeStatus }> = [
  { label: "Draft", value: "draft" },
  { label: "Approved", value: "approved" },
  { label: "Restricted", value: "restricted" },
  { label: "Archived", value: "archived" }
];

const healthOptions: Array<{ label: string; value: KnowledgeHealth }> = [
  { label: "Strong", value: "strong" },
  { label: "Needs review", value: "needs_review" },
  { label: "Sparse", value: "sparse" },
  { label: "Missing", value: "missing" },
  { label: "Outdated", value: "outdated" }
];

function KnowledgeModal({
  onClose,
  projectId,
  kind,
  item
}: {
  onClose: () => void;
  projectId: string;
  kind: "product" | "market";
  item?: KnowledgeItem;
}) {
  const { addProductKnowledge, addMarketKnowledge, updateKnowledge } = useReydar();
  const categories = kind === "product" ? productCategories : marketCategories;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [form, setForm] = useState({
    projectId,
    category: item?.category ?? categories[0],
    title: item?.title ?? "",
    content: item?.content ?? "",
    source: item?.source ?? "Manual",
    status: item?.status ?? ("draft" as KnowledgeStatus),
    health: item?.health ?? ("sparse" as KnowledgeHealth),
    approved: item?.approved ?? false,
    restricted: item?.restricted ?? false,
    confidence: item?.confidence ?? 0.72
  });

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(undefined);
    const normalized = {
      ...form,
      approved: form.status === "approved",
      restricted: form.status === "restricted"
    };
    try {
      if (item) {
        await updateKnowledge(kind, item.id, normalized);
      } else if (kind === "product") {
        await addProductKnowledge(normalized);
      } else {
        await addMarketKnowledge(normalized);
      }
      onClose();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "The knowledge item could not be saved."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const close = () => {
    if (!isSubmitting) onClose();
  };

  return (
    <AppDialog
      footer={
        <>
          <Button type="button" appearance="subtle" onClick={close} isDisabled={isSubmitting}>Cancel</Button>
          <Button appearance="primary" type="submit" isDisabled={isSubmitting}>
            {isSubmitting ? "Saving…" : item ? "Save item" : "Add item"}
          </Button>
        </>
      }
      onClose={close}
      onSubmit={submit}
      testId={item ? `edit-${kind}-knowledge-dialog` : `add-${kind}-knowledge-dialog`}
      title={item ? "Edit knowledge item" : "Add knowledge item"}
      width="large"
    >
      <Stack space="space.200">
        {error ? (
          <SectionMessage appearance="error" title="Knowledge item was not saved">
            <p>{error}</p>
          </SectionMessage>
        ) : null}
        <Field label="Title" htmlFor="knowledge-title">
          <Textfield id="knowledge-title" value={form.title} onChange={(event) => update("title", event.currentTarget.value)} isRequired />
        </Field>
        <Field label="Category">
          <Select
            options={categories.map((category) => ({ label: category, value: category }))}
            value={{ label: form.category, value: form.category }}
            onChange={(option) => update("category", String(option?.value ?? categories[0]))}
          />
        </Field>
        <Field label="Content" htmlFor="knowledge-content">
          <TextArea
            id="knowledge-content"
            value={form.content}
            onChange={(event) => update("content", event.currentTarget.value)}
            minimumRows={8}
          />
        </Field>
        <Inline space="space.200" shouldWrap>
          <div className="form-field">
            <Field label="Status">
              <Select
                options={statusOptions}
                value={statusOptions.find((option) => option.value === form.status)}
                onChange={(option) => update("status", (option?.value ?? "draft") as KnowledgeStatus)}
              />
            </Field>
          </div>
          <div className="form-field">
            <Field label="Health">
              <Select
                options={healthOptions}
                value={healthOptions.find((option) => option.value === form.health)}
                onChange={(option) => update("health", (option?.value ?? "sparse") as KnowledgeHealth)}
              />
            </Field>
          </div>
        </Inline>
        <Field label="Source" htmlFor="knowledge-source">
          <Textfield id="knowledge-source" value={form.source} onChange={(event) => update("source", event.currentTarget.value)} />
        </Field>
      </Stack>
    </AppDialog>
  );
}

export function KnowledgeBaseScreen({ projectId, kind }: { projectId: string; kind: "product" | "market" }) {
  const {
    state,
    updateKnowledge,
    projectBrainStatus,
    projectBrainError,
    retryProjectBrain
  } = useReydar();
  const [editing, setEditing] = useState<KnowledgeItem | undefined>();
  const [isAdding, setIsAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [operationError, setOperationError] = useState<string>();
  const activeKnowledgeModal = isAdding ? (
    <KnowledgeModal
      key={`add-${kind}-knowledge-modal`}
      kind={kind}
      projectId={projectId}
      onClose={() => setIsAdding(false)}
    />
  ) : editing ? (
    <KnowledgeModal
      key={`edit-${kind}-knowledge-modal-${editing.id}`}
      kind={kind}
      projectId={projectId}
      item={editing}
      onClose={() => setEditing(undefined)}
    />
  ) : null;
  const project = state.projects.find((item) => item.id === projectId);
  const categories = kind === "product" ? productCategories : marketCategories;
  const items = (kind === "product" ? state.productKnowledge : state.marketKnowledge).filter(
    (item) =>
      item.projectId === projectId &&
      (!search ||
        `${item.title} ${item.category} ${item.content}`.toLowerCase().includes(search.toLowerCase()))
  );

  const title = kind === "product" ? "Product Knowledge Base" : "Market Knowledge Base";
  const description =
    kind === "product"
      ? "Store everything ReydarOS needs to know about the product before it recommends a response."
      : "Mature audience, pain-point, competitor, and market memory from engagement activity.";

  const updateTitle = useCallback(async (itemId: string, title: string) => {
    setOperationError(undefined);
    try {
      await updateKnowledge(kind, itemId, { title });
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : "The knowledge item could not be updated.");
      throw error;
    }
  }, [kind, updateKnowledge]);

  const rows = useMemo(
    () =>
      items.map((item) => ({
        key: item.id,
        cells: [
          {
            key: "title",
            content: (
              <InlineEdit
                defaultValue={item.title}
                label={`Edit ${item.title}`}
                editView={({ errorMessage, ...fieldProps }) => <Textfield {...fieldProps} autoFocus />}
                readView={() => <strong>{item.title}</strong>}
                onConfirm={(value) => updateTitle(item.id, value)}
              />
            )
          },
          { key: "category", content: item.category },
          { key: "status", content: <KnowledgeStatusLozenge value={item.status} /> },
          { key: "health", content: <HealthLozenge value={item.health} /> },
          { key: "source", content: item.source },
          { key: "confidence", content: `${Math.round(item.confidence * 100)}%` },
          {
            key: "actions",
            content: (
              <Button
                onClick={() => {
                  setIsAdding(false);
                  setEditing(item);
                }}
              >
                Edit
              </Button>
            )
          }
        ]
      })),
    [items, updateTitle]
  );

  if (projectBrainStatus === "ready" && !project) {
    return (
      <EmptyState
        header="Project not found"
        description="This project is not available in the database-backed workspace."
        primaryAction={<Button href="/projects">Back to projects</Button>}
      />
    );
  }

  return (
    <>
      <PageHeading
        title={title}
        description={description}
        breadcrumbs={[
          { text: "Projects", href: "/projects" },
          { text: project?.name ?? "Project", href: `/projects/${projectId}` },
          { text: title, href: `/projects/${projectId}/${kind}-knowledge` }
        ]}
        action={
          <Inline space="space.100" shouldWrap>
            <Button iconBefore={<UploadIcon label="" />}>Upload document</Button>
            <Button iconBefore={<LinkIcon label="" />}>Add URL</Button>
            <Button
              appearance="primary"
              iconBefore={<AddIcon label="" />}
              onClick={() => {
                setEditing(undefined);
                setIsAdding(true);
              }}
            >
              Add manual note
            </Button>
          </Inline>
        }
      />

      <Box paddingBlockEnd="space.200">
        <ProjectBrainLoadState
          status={projectBrainStatus}
          error={projectBrainError}
          retry={retryProjectBrain}
        />
        {operationError ? (
          <SectionMessage appearance="error" title="Knowledge update failed">
            <p>{operationError}</p>
          </SectionMessage>
        ) : null}
      </Box>

      <SectionPanel title={title} description="Search, classify, approve, restrict, and edit extracted knowledge.">
        <Stack space="space.200">
          <Textfield
            aria-label="Search knowledge"
            placeholder="Search knowledge"
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
          />
          <Tabs id={`${kind}-knowledge-tabs`}>
            <TabList>
              <Tab>All</Tab>
              <Tab>Approved</Tab>
              <Tab>Restricted</Tab>
              <Tab>Draft</Tab>
              <Tab>Categories</Tab>
            </TabList>
            <TabPanel>
              {projectBrainStatus === "ready" && items.length ? (
                <DynamicTable
                  head={{
                    cells: [
                      { key: "title", content: "Title" },
                      { key: "category", content: "Category" },
                      { key: "status", content: "Status" },
                      { key: "health", content: "Health" },
                      { key: "source", content: "Source" },
                      { key: "confidence", content: "Confidence" },
                      { key: "actions", content: "Actions" }
                    ]
                  }}
                  rows={rows}
                  rowsPerPage={10}
                />
              ) : projectBrainStatus === "ready" ? (
                <EmptyState
                  header={`No ${kind} knowledge yet`}
                  description="Add manual notes, URLs, or uploaded documents to ground DARM recommendations."
                  primaryAction={
                    <Button
                      appearance="primary"
                      onClick={() => {
                        setEditing(undefined);
                        setIsAdding(true);
                      }}
                    >
                      Add knowledge
                    </Button>
                  }
                />
              ) : null}
            </TabPanel>
            <TabPanel>
              <DynamicTable head={{ cells: [{ key: "title", content: "Approved items" }] }} rows={rows.filter((_, index) => items[index]?.status === "approved")} />
            </TabPanel>
            <TabPanel>
              <DynamicTable head={{ cells: [{ key: "title", content: "Restricted items" }] }} rows={rows.filter((_, index) => items[index]?.status === "restricted")} />
            </TabPanel>
            <TabPanel>
              <DynamicTable head={{ cells: [{ key: "title", content: "Draft items" }] }} rows={rows.filter((_, index) => items[index]?.status === "draft")} />
            </TabPanel>
            <TabPanel>
              <div className="dense-grid">
                {categories.map((category) => {
                  const count = items.filter((item) => item.category === category).length;
                  return (
                    <div className="panel-muted" key={category}>
                      <Box padding="space.150">
                        <Inline spread="space-between">
                          <span>{category}</span>
                          <strong>{count}</strong>
                        </Inline>
                      </Box>
                    </div>
                  );
                })}
              </div>
            </TabPanel>
          </Tabs>
        </Stack>
      </SectionPanel>

      {activeKnowledgeModal}
    </>
  );
}
