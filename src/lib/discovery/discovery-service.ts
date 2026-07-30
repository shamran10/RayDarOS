import { mockDiscoveryProvider } from "@/lib/discovery/providers/mock-provider";
import type { DiscoveryRun, DiscoveredItem, Project, SignalSource } from "@/lib/types";

const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

async function scanRedditSource({
  project,
  source,
  discoveryRunId,
  now
}: {
  project: Project;
  source: SignalSource;
  discoveryRunId: string;
  now: string;
}) {
  const response = await fetch("/api/discovery/reddit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project, source, discoveryRunId, now })
  });
  const payload = (await response.json()) as { items?: DiscoveredItem[]; error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? `Reddit discovery failed with ${response.status}.`);
  }

  return payload.items ?? [];
}

export async function runDiscoverySource({
  project,
  source,
  now = new Date().toISOString()
}: {
  project: Project;
  source: SignalSource;
  now?: string;
}): Promise<{ run: DiscoveryRun; items: DiscoveredItem[] }> {
  const runId = makeId("discovery-run");
  const startedAt = now;

  try {
    const items =
      source.sourceType === "reddit"
        ? await scanRedditSource({ project, source, discoveryRunId: runId, now })
        : await mockDiscoveryProvider.scan({ project, source, discoveryRunId: runId, now });
    const run: DiscoveryRun = {
      id: runId,
      projectId: project.id,
      signalSourceId: source.id,
      providerType: source.sourceType,
      status: "completed",
      startedAt,
      completedAt: new Date().toISOString(),
      itemsFound: items.length,
      candidatesCreated: 0,
      errors: [],
      createdAt: startedAt,
      updatedAt: new Date().toISOString()
    };

    return { run, items };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown discovery error";
    return {
      run: {
        id: runId,
        projectId: project.id,
        signalSourceId: source.id,
        providerType: source.sourceType,
        status: "failed",
        startedAt,
        completedAt: new Date().toISOString(),
        itemsFound: 0,
        candidatesCreated: 0,
        errors: [message],
        createdAt: startedAt,
        updatedAt: new Date().toISOString()
      },
      items: []
    };
  }
}
