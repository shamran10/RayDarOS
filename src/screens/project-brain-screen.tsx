"use client";

import Button from "@atlaskit/button";
import EmptyState from "@atlaskit/empty-state";
import ChartIcon from "@atlaskit/icon/core/chart-bar";
import InboxIcon from "@atlaskit/icon/core/inbox";
import LightbulbIcon from "@atlaskit/icon/core/lightbulb";
import LockIcon from "@atlaskit/icon/core/lock-locked";
import ProjectIcon from "@atlaskit/icon/core/project";
import SearchIcon from "@atlaskit/icon/core/search";
import SettingsIcon from "@atlaskit/icon/core/settings";
import WarningIcon from "@atlaskit/icon/core/warning";
import { Box } from "@atlaskit/primitives";
import type { ReactNode } from "react";
import { PageHeading } from "@/components/page-heading";
import { ProjectBrainLoadState } from "@/components/project-brain-load-state";
import { HealthLozenge, RiskLozenge } from "@/components/status-lozenge";
import { useReydar } from "@/lib/store";
import { projectHealth, strongestRisk } from "@/lib/selectors";

function ProjectBrainRow({
  title,
  icon,
  action,
  primary,
  secondary
}: {
  title: string;
  icon: ReactNode;
  action?: ReactNode;
  primary?: ReactNode;
  secondary: ReactNode;
}) {
  const rowClassName = `panel project-brain-row-card${action ? " has-action" : ""}${primary ? " has-primary" : ""}`;

  return (
    <section className={rowClassName}>
      <div className="project-brain-row-title">
        <span className="project-brain-row-icon" aria-hidden="true">
          {icon}
        </span>
        <h2 className="section-title">{title}</h2>
      </div>
      <div className="project-brain-row-secondary muted-text">{secondary}</div>
      {primary ? <div className="project-brain-row-primary">{primary}</div> : null}
      {action ? <div className="project-brain-row-action">{action}</div> : null}
    </section>
  );
}

export function ProjectBrainScreen({ projectId }: { projectId: string }) {
  const {
    state,
    projectBrainStatus,
    projectBrainError,
    retryProjectBrain
  } = useReydar();
  const project = state.projects.find((item) => item.id === projectId);

  if (projectBrainStatus !== "ready") {
    return (
      <ProjectBrainLoadState
        status={projectBrainStatus}
        error={projectBrainError}
        retry={retryProjectBrain}
      />
    );
  }

  if (!project) {
    return (
      <EmptyState
        header="Project not found"
        description="The selected Project Brain could not be found in the database-backed workspace."
        primaryAction={<Button href="/projects">Back to projects</Button>}
      />
    );
  }

  const productKnowledge = state.productKnowledge.filter((item) => item.projectId === project.id);
  const marketKnowledge = state.marketKnowledge.filter((item) => item.projectId === project.id);
  const communityRules = state.communityRules.filter((item) => item.projectId === project.id);
  const opportunities = state.opportunities.filter((item) => item.projectId === project.id);
  const insights = state.marketInsights.filter((item) => item.projectId === project.id);
  const productHealth = projectHealth(productKnowledge);
  const marketHealth = projectHealth(marketKnowledge);
  const rulesHealth = communityRules.length ? "needs_review" : "missing";
  const riskLevel = strongestRisk([project.riskTolerance, ...communityRules.map((rule) => rule.riskLevel)]);
  const missingSuggestions = [
    productKnowledge.length < 3 ? "Add approved claims, restricted claims, and product limitations." : "",
    marketKnowledge.length < 3 ? "Capture more audience language, objections, and buying triggers." : "",
    communityRules.length < 2 ? "Add community rules for every subreddit you plan to engage with." : "",
    !project.productMentionPolicy ? "Define a product mention policy before drafting replies." : ""
  ].filter(Boolean);

  return (
    <>
      <PageHeading
        title={`${project.name} Project Brain`}
        description="Knowledge, rules, memory, and response settings for this project."
        breadcrumbs={[
          { text: "ReydarOS", href: "/" },
          { text: "Projects", href: "/projects" },
          { text: project.name, href: `/projects/${project.id}` }
        ]}
        action={<Button appearance="primary" href="/signal-monitor">Analyze signal</Button>}
      />

      {missingSuggestions.length ? (
        <Box paddingBlockEnd="space.200">
          <div className="project-brain-inline-alert" role="alert">
            <WarningIcon label="" />
            <strong>Project Brain needs more grounding</strong>
            <p>{missingSuggestions.join(" ")}</p>
          </div>
        </Box>
      ) : null}

      <div className="project-brain-row-stack">
        <ProjectBrainRow
          title="Product Knowledge health"
          icon={<ProjectIcon label="" />}
          action={<Button href={`/projects/${project.id}/product-knowledge`}>Manage</Button>}
          primary={<HealthLozenge value={productHealth} />}
          secondary={`${productKnowledge.length} product knowledge items`}
        />
        <ProjectBrainRow
          title="Market Knowledge health"
          icon={<LightbulbIcon label="" />}
          action={<Button href={`/projects/${project.id}/market-knowledge`}>Manage</Button>}
          primary={<HealthLozenge value={marketHealth} />}
          secondary={`${marketKnowledge.length} market memory items`}
        />
        <ProjectBrainRow
          title="Community Rules health"
          icon={<LockIcon label="" />}
          action={<Button href={`/projects/${project.id}/community-rules`}>Manage</Button>}
          primary={<HealthLozenge value={rulesHealth} />}
          secondary={`${communityRules.length} communities mapped`}
        />
        <ProjectBrainRow
          title="Signal coverage"
          icon={<SearchIcon label="" />}
          primary={<strong className="project-brain-row-metric">{opportunities.length}</strong>}
          secondary="Analyzed opportunities"
        />
        <ProjectBrainRow
          title="Response settings"
          icon={<SettingsIcon label="" />}
          primary={<RiskLozenge value={riskLevel} />}
          secondary={project.productMentionPolicy}
        />
        <ProjectBrainRow
          title="Recent memory updates"
          icon={insights.length ? <ChartIcon label="" /> : <InboxIcon label="" />}
          secondary={
            insights.length ? (
              <div className="project-brain-memory-list">
                {insights.slice(0, 4).map((insight) => (
                  <span className="project-brain-memory-item" key={insight.id}>
                    <span>{insight.title}</span>
                    <span className="small-text muted-text">{Math.round(insight.confidence * 100)}%</span>
                  </span>
                ))}
              </div>
            ) : (
              "Insights saved from opportunities will appear here."
            )
          }
        />
      </div>
    </>
  );
}
