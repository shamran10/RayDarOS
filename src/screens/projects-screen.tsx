"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import Link from "next/link";
import Button, { ButtonGroup } from "@atlaskit/button";
import DropdownMenu, { DropdownItem, DropdownItemGroup } from "@atlaskit/dropdown-menu";
import DynamicTable from "@atlaskit/dynamic-table";
import EmptyState from "@atlaskit/empty-state";
import SectionMessage from "@atlaskit/section-message";
import Select from "@/components/apple-select";
import TextArea from "@atlaskit/textarea";
import Textfield from "@atlaskit/textfield";
import AddIcon from "@atlaskit/icon/core/add";
import { Box, Grid, Inline, Stack } from "@atlaskit/primitives";
import { AppDialog } from "@/components/app-dialog";
import { Field } from "@/components/field";
import { PageHeading } from "@/components/page-heading";
import { ProjectBrainLoadState } from "@/components/project-brain-load-state";
import { SectionPanel } from "@/components/section-panel";
import { HealthLozenge, RiskLozenge } from "@/components/status-lozenge";
import { useReydar } from "@/lib/store";
import { projectHealth, strongestRisk } from "@/lib/selectors";
import type { Project, RiskLevel } from "@/lib/types";

const defaultForm = {
  name: "",
  productType: "",
  productDescription: "",
  primaryObjective: "",
  engagementGoal: "",
  brandAccountName: "",
  websiteUrl: "",
  targetAudience: "",
  defaultTone: "Helpful, practical, concise",
  productMentionPolicy: "Default to helpful-only. Mention product only with disclosure when context supports it.",
  riskTolerance: "medium" as RiskLevel
};

const riskOptions = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" }
];

const projectProfilePalette = [
  { background: "var(--accent)", color: "#ffffff" },
  { background: "#5e5ce6", color: "#ffffff" },
  { background: "#007a5a", color: "#ffffff" },
  { background: "#bf4800", color: "#ffffff" },
  { background: "#af52de", color: "#ffffff" },
  { background: "var(--green-soft)", color: "#14532d" },
  { background: "var(--orange-soft)", color: "#7a3f00" },
  { background: "var(--red-soft)", color: "#8a1c16" }
];

type ProjectWithProfile = Project & {
  avatarUrl?: string;
  displayProfileUrl?: string;
  logoUrl?: string;
  profileImageUrl?: string;
};

function getProjectInitials(name: string) {
  const words = name.match(/[A-Za-z0-9]+/g) ?? [];
  if (!words.length) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function getPaletteIndex(seed: string) {
  return Array.from(seed).reduce((hash, character) => hash + character.charCodeAt(0), 0) % projectProfilePalette.length;
}

function getProjectProfileUrl(project: Project) {
  const projectWithProfile = project as ProjectWithProfile;
  return projectWithProfile.displayProfileUrl ?? projectWithProfile.profileImageUrl ?? projectWithProfile.avatarUrl ?? projectWithProfile.logoUrl;
}

function ProjectDisplayProfile({ project }: { project: Project }) {
  const palette = projectProfilePalette[getPaletteIndex(`${project.id}-${project.name}`)];
  const profileUrl = getProjectProfileUrl(project);
  const initials = getProjectInitials(project.name);

  return (
    <span
      className="project-display-profile"
      style={
        {
          "--project-profile-background": palette.background,
          "--project-profile-color": palette.color,
          backgroundImage: profileUrl ? `url("${profileUrl.replace(/"/g, "%22")}")` : undefined
        } as CSSProperties
      }
      aria-label={`${project.name} display profile`}
    >
      {profileUrl ? null : initials}
    </span>
  );
}

function ProjectModal({ onClose, project }: { onClose: () => void; project?: Project }) {
  const { createProject, updateProject } = useReydar();
  const [form, setForm] = useState(project ?? defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const isEditing = Boolean(project);

  const update = (key: keyof typeof defaultForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(undefined);
    try {
      if (isEditing && project) {
        await updateProject(project.id, form);
      } else {
        await createProject(form);
      }
      onClose();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "The project could not be saved.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppDialog
      footer={
        <>
          <Button type="button" appearance="subtle" onClick={onClose} isDisabled={isSubmitting}>
            Cancel
          </Button>
          <Button appearance="primary" type="submit" isDisabled={isSubmitting}>
            {isSubmitting ? "Saving…" : isEditing ? "Save changes" : "Create project"}
          </Button>
        </>
      }
      onClose={onClose}
      onSubmit={submit}
      testId="modal-dialog"
      title={isEditing ? "Edit project" : "Create project"}
      width="x-large"
    >
      <Stack space="space.200">
        {error ? (
          <SectionMessage appearance="error" title="Project was not saved">
            <p>{error}</p>
          </SectionMessage>
        ) : null}
        <Grid gap="space.200" templateColumns="repeat(auto-fit, minmax(260px, 1fr))">
              <Field label="Project name" htmlFor="project-name">
                <Textfield id="project-name" value={form.name} onChange={(event) => update("name", event.currentTarget.value)} isRequired />
              </Field>
              <Field label="Product type" htmlFor="product-type">
                <Textfield
                  id="product-type"
                  value={form.productType}
                  onChange={(event) => update("productType", event.currentTarget.value)}
                  isRequired
                />
              </Field>
              <Field label="Brand account name" htmlFor="brand-account">
                <Textfield id="brand-account" value={form.brandAccountName} onChange={(event) => update("brandAccountName", event.currentTarget.value)} />
              </Field>
              <Field label="Website URL" htmlFor="website-url">
                <Textfield id="website-url" value={form.websiteUrl} onChange={(event) => update("websiteUrl", event.currentTarget.value)} />
              </Field>
              <Field label="Default tone" htmlFor="default-tone">
                <Textfield id="default-tone" value={form.defaultTone} onChange={(event) => update("defaultTone", event.currentTarget.value)} />
              </Field>
              <Field label="Risk tolerance">
                <Select
                  options={riskOptions}
                  value={riskOptions.find((option) => option.value === form.riskTolerance)}
                  onChange={(option) => update("riskTolerance", String(option?.value ?? "medium"))}
                />
              </Field>
        </Grid>
        <Field label="Product description" htmlFor="product-description">
              <TextArea
                id="product-description"
                value={form.productDescription}
                onChange={(event) => update("productDescription", event.currentTarget.value)}
                minimumRows={3}
              />
            </Field>
            <Field label="Primary objective" htmlFor="primary-objective">
              <TextArea
                id="primary-objective"
                value={form.primaryObjective}
                onChange={(event) => update("primaryObjective", event.currentTarget.value)}
                minimumRows={3}
              />
            </Field>
            <Field label="Engagement goal" htmlFor="engagement-goal">
              <TextArea
                id="engagement-goal"
                value={form.engagementGoal}
                onChange={(event) => update("engagementGoal", event.currentTarget.value)}
                minimumRows={3}
              />
            </Field>
            <Field label="Target audience" htmlFor="target-audience">
              <TextArea
                id="target-audience"
                value={form.targetAudience}
                onChange={(event) => update("targetAudience", event.currentTarget.value)}
                minimumRows={3}
              />
            </Field>
            <Field label="Product mention policy" htmlFor="mention-policy">
              <TextArea
                id="mention-policy"
                value={form.productMentionPolicy}
                onChange={(event) => update("productMentionPolicy", event.currentTarget.value)}
                minimumRows={3}
              />
        </Field>
      </Stack>
    </AppDialog>
  );
}

export function ProjectsScreen() {
  const {
    state,
    archiveProject,
    projectBrainStatus,
    projectBrainError,
    retryProjectBrain
  } = useReydar();
  const [isCreating, setIsCreating] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [operationError, setOperationError] = useState<string>();
  const activeProjectModal = isCreating ? (
    <ProjectModal key="create-project-modal" onClose={() => setIsCreating(false)} />
  ) : editingProject ? (
    <ProjectModal
      key={`edit-project-modal-${editingProject.id}`}
      project={editingProject}
      onClose={() => setEditingProject(undefined)}
    />
  ) : null;

  const archive = useCallback(async (projectId: string) => {
    setOperationError(undefined);
    try {
      await archiveProject(projectId);
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : "The project could not be archived.");
    }
  }, [archiveProject]);

  const projectRows = useMemo(
    () =>
      state.projects.map((project) => {
        const productItems = state.productKnowledge.filter((item) => item.projectId === project.id);
        const marketItems = state.marketKnowledge.filter((item) => item.projectId === project.id);
        const rules = state.communityRules.filter((rule) => rule.projectId === project.id);
        const opportunities = state.opportunities.filter((opportunity) => opportunity.projectId === project.id);
        return {
          key: project.id,
          cells: [
            {
              key: "name",
              content: (
                <div className="project-name-cell">
                  <ProjectDisplayProfile project={project} />
                  <div className="project-name-copy">
                    <Link href={`/projects/${project.id}`}>{project.name}</Link>
                    <span className="small-text muted-text">{project.websiteUrl || "No website"}</span>
                  </div>
                </div>
              )
            },
            { key: "type", content: project.productType },
            { key: "objective", content: project.primaryObjective },
            { key: "account", content: project.connectedAccount },
            { key: "health", content: <HealthLozenge value={projectHealth([...productItems, ...marketItems])} /> },
            { key: "open", content: opportunities.filter((item) => item.status !== "posted_manually").length },
            { key: "risk", content: <RiskLozenge value={strongestRisk([project.riskTolerance, ...rules.map((rule) => rule.riskLevel)])} /> },
            { key: "last", content: new Date(project.updatedAt).toLocaleDateString() },
            { key: "status", content: project.status },
            {
              key: "actions",
              content: (
                <DropdownMenu trigger="Actions" spacing="compact">
                  <DropdownItemGroup>
                    <DropdownItem href={`/projects/${project.id}`}>Open project</DropdownItem>
                    <DropdownItem
                      onClick={() => {
                        setIsCreating(false);
                        setEditingProject(project);
                      }}
                    >
                      Edit project
                    </DropdownItem>
                    <DropdownItem onClick={() => void archive(project.id)} isDisabled={project.status === "archived"}>
                      Archive project
                    </DropdownItem>
                  </DropdownItemGroup>
                </DropdownMenu>
              )
            }
          ]
        };
      }),
    [archive, state.communityRules, state.marketKnowledge, state.opportunities, state.productKnowledge, state.projects]
  );

  return (
    <>
      <PageHeading
        title="Projects"
        description="Create and manage monitored product, service, campaign, or brand workspaces."
        breadcrumbs={[{ text: "ReydarOS", href: "/" }, { text: "Projects", href: "/projects" }]}
        action={
          <Button
            appearance="primary"
            iconBefore={<AddIcon label="" />}
            onClick={() => {
              setEditingProject(undefined);
              setIsCreating(true);
            }}
          >
            Create project
          </Button>
        }
      />

      <Box paddingBlockEnd="space.200">
        <ProjectBrainLoadState
          status={projectBrainStatus}
          error={projectBrainError}
          retry={retryProjectBrain}
        />
        {operationError ? (
          <SectionMessage appearance="error" title="Project update failed">
            <p>{operationError}</p>
          </SectionMessage>
        ) : null}
      </Box>

      <SectionPanel
        title="Project workspaces"
        description="Each project has its own Project Brain, knowledge, rules, opportunities, and memory."
      >
        {projectBrainStatus === "ready" && state.projects.length ? (
          <DynamicTable
            head={{
              cells: [
                { key: "name", content: "Project name", isSortable: true },
                { key: "type", content: "Product type" },
                { key: "objective", content: "Primary objective" },
                { key: "account", content: "Connected account" },
                { key: "health", content: "Knowledge health" },
                { key: "open", content: "Open opportunities" },
                { key: "risk", content: "Risk level" },
                { key: "last", content: "Last analyzed" },
                { key: "status", content: "Status" },
                { key: "actions", content: "Actions" }
              ]
            }}
            rows={projectRows}
            rowsPerPage={8}
          />
        ) : projectBrainStatus === "ready" ? (
          <EmptyState
            header="No projects yet"
            description="Create a project to start building a Project Brain."
            primaryAction={
              <ButtonGroup>
                <Button
                  appearance="primary"
                  onClick={() => {
                    setEditingProject(undefined);
                    setIsCreating(true);
                  }}
                >
                  Create project
                </Button>
              </ButtonGroup>
            }
          />
        ) : null}
      </SectionPanel>

      <Box paddingBlockStart="space.200">
        <div className="responsive-grid">
          <SectionPanel title="Project Brain structure">
            <Stack space="space.100">
              <Inline spread="space-between"><span>Product Knowledge</span><strong>{state.productKnowledge.length}</strong></Inline>
              <Inline spread="space-between"><span>Market Knowledge</span><strong>{state.marketKnowledge.length}</strong></Inline>
              <Inline spread="space-between"><span>Community Rules</span><strong>{state.communityRules.length}</strong></Inline>
            </Stack>
          </SectionPanel>
          <SectionPanel title="Operating posture">
            <Stack space="space.100">
              <span className="muted-text">No automated posting in MVP.</span>
              <span className="muted-text">Human review is required before every reply.</span>
              <span className="muted-text">Insights stay traceable to source conversations.</span>
            </Stack>
          </SectionPanel>
        </div>
      </Box>

      {activeProjectModal}
    </>
  );
}
