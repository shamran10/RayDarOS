import type { DiscoveredItem, Project, SourceType } from "@/lib/types";

export function createManualDiscoveredItem({
  project,
  discoveryRunId,
  platform,
  community,
  title,
  body,
  url,
  now
}: {
  project: Project;
  discoveryRunId: string;
  platform: string;
  community: string;
  title: string;
  body: string;
  url: string;
  now: string;
}): DiscoveredItem {
  const seed = `${project.id}-${title}-${now}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 46);
  const sourceType: SourceType = "manual";

  return {
    id: `discovered-manual-${seed}`,
    projectId: project.id,
    discoveryRunId,
    platform,
    community,
    sourceType,
    externalId: `manual-${seed}`,
    authorHandle: "manual-submitter",
    title,
    body,
    url,
    score: undefined,
    replyCount: undefined,
    publishedAt: now,
    rawJson: { provider: "manual", url },
    createdAt: now,
    updatedAt: now
  };
}
