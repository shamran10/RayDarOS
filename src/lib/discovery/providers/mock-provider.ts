import type { DiscoveredItem } from "@/lib/types";
import type { DiscoveryProvider } from "./types";

const makeId = (prefix: string, seed: string) =>
  `${prefix}-${seed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 36)}`;

function item(context: Parameters<DiscoveryProvider["scan"]>[0], index: number, overrides: Partial<DiscoveredItem>): DiscoveredItem {
  const externalId = overrides.externalId ?? makeId("mock", `${context.source.communityName}-${index}`);

  return {
    id: makeId("discovered", `${context.discoveryRunId}-${index}-${externalId}`),
    projectId: context.project.id,
    discoveryRunId: context.discoveryRunId,
    platform: context.source.platform,
    community: context.source.communityName,
    sourceType: "mock",
    externalId,
    authorHandle: `u/mock_operator_${index}`,
    title: `${context.project.name} mock signal`,
    body: "",
    url: context.source.sourceUrl || `https://reddit.com/${context.source.communityName}/comments/${externalId}`,
    score: 42 + index * 11,
    replyCount: 6 + index * 3,
    publishedAt: context.now,
    rawJson: { provider: "mock", sourceId: context.source.id, index },
    createdAt: context.now,
    updatedAt: context.now,
    ...overrides
  };
}

export const mockDiscoveryProvider: DiscoveryProvider = {
  name: "Mock Reddit Provider",
  scan: (context) => {
    const keyword = context.source.keywords[0] ?? "workflow";
    const competitor = context.source.competitorTerms[0] ?? "spreadsheet";
    const painPoint = context.source.painPointTerms[0] ?? "approvals";

    return [
      item(context, 1, {
        externalId: makeId("thread", `${context.source.communityName}-${keyword}-tool-request`),
        authorHandle: "u/process_tangle",
        title: `What are teams using when ${keyword} tracking breaks down?`,
        body: `We are using ${competitor} and chat reminders for ${painPoint}. It was fine at first, but now approvals stall, no one owns the next step, and leadership keeps asking for a cleaner tool or process. What would you fix before buying software?`,
        score: 126,
        replyCount: 34
      }),
      item(context, 2, {
        externalId: makeId("comment", `${context.source.communityName}-competitor-complaint`),
        parentExternalId: makeId("thread", `${context.source.communityName}-${keyword}-tool-request`),
        authorHandle: "u/ops_founder",
        title: "Top comment on workflow tooling thread",
        body: `We tried moving this into a big suite, but the team still works from ${competitor}. The actual pain is unclear ownership and nobody knowing when a request is blocked.`,
        score: 88,
        replyCount: 12
      }),
      item(context, 3, {
        externalId: makeId("reply", `${context.source.communityName}-unanswered-question`),
        parentExternalId: makeId("comment", `${context.source.communityName}-competitor-complaint`),
        authorHandle: "u/quiet_builder",
        title: "Nested unanswered implementation question",
        body: "Has anyone found a lightweight way to assign owners and track exceptions without turning the whole company into Jira? I need something practical, not a giant rollout.",
        score: 51,
        replyCount: 0
      })
    ];
  }
};
