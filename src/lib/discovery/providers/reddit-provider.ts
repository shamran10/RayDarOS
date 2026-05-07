import type { DiscoveredItem } from "@/lib/types";
import type { DiscoveryProvider, DiscoveryProviderContext } from "./types";

interface RedditTokenResponse {
  access_token?: string;
  error?: string;
}

interface RedditListingResponse {
  data?: {
    children?: RedditListingChild[];
  };
}

interface RedditListingChild {
  kind?: string;
  data?: {
    id?: string;
    name?: string;
    subreddit?: string;
    subreddit_name_prefixed?: string;
    author?: string;
    title?: string;
    selftext?: string;
    permalink?: string;
    url?: string;
    score?: number;
    num_comments?: number;
    created_utc?: number;
  };
}

const REDDIT_OAUTH_URL = "https://www.reddit.com/api/v1/access_token";
const REDDIT_API_BASE_URL = "https://oauth.reddit.com";

const makeId = (prefix: string, seed: string) =>
  `${prefix}-${seed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48)}`;

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required for Reddit API discovery.`);
  return value;
}

function redditUserAgent() {
  return requiredEnv("REDDIT_USER_AGENT");
}

function subredditName(context: DiscoveryProviderContext) {
  const fromCommunity = context.source.communityName.match(/(?:^|\/)r\/([^/\s]+)/i)?.[1] ?? context.source.communityName;
  const fromUrl = context.source.sourceUrl.match(/reddit\.com\/r\/([^/\s]+)/i)?.[1];
  return (fromUrl ?? fromCommunity).replace(/^r\//i, "").trim();
}

function searchQuery(context: DiscoveryProviderContext) {
  const terms = [
    ...context.source.keywords,
    ...context.source.painPointTerms,
    ...context.source.competitorTerms
  ]
    .map((term) => term.trim())
    .filter(Boolean);
  const uniqueTerms = Array.from(new Set(terms)).slice(0, 8);
  return uniqueTerms.map((term) => `"${term.replaceAll('"', "")}"`).join(" OR ");
}

function scanLimit() {
  const parsed = Number(process.env.REDDIT_SCAN_LIMIT ?? 10);
  if (!Number.isFinite(parsed)) return 10;
  return Math.min(25, Math.max(1, Math.round(parsed)));
}

async function getAccessToken() {
  const clientId = requiredEnv("REDDIT_CLIENT_ID");
  const clientSecret = requiredEnv("REDDIT_CLIENT_SECRET");
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const body = new URLSearchParams({ grant_type: "client_credentials" });

  const response = await fetch(REDDIT_OAUTH_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": redditUserAgent()
    },
    body
  });

  const payload = (await response.json()) as RedditTokenResponse;
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error ? `Reddit OAuth failed: ${payload.error}` : `Reddit OAuth failed with ${response.status}.`);
  }

  return payload.access_token;
}

function buildListingUrl(context: DiscoveryProviderContext) {
  const subreddit = subredditName(context);
  if (!subreddit) throw new Error("A subreddit community name or reddit.com/r/... source URL is required.");

  const query = searchQuery(context);
  const params = new URLSearchParams({
    limit: String(scanLimit()),
    raw_json: "1"
  });

  if (query) {
    params.set("q", query);
    params.set("restrict_sr", "true");
    params.set("sort", "new");
    params.set("t", "week");
    return `${REDDIT_API_BASE_URL}/r/${encodeURIComponent(subreddit)}/search?${params.toString()}`;
  }

  return `${REDDIT_API_BASE_URL}/r/${encodeURIComponent(subreddit)}/new?${params.toString()}`;
}

function mapListingChild(context: DiscoveryProviderContext, child: RedditListingChild, index: number): DiscoveredItem | undefined {
  const data = child.data;
  if (!data?.id && !data?.name) return undefined;

  const externalId = data.name ?? `${child.kind ?? "t3"}_${data.id}`;
  const permalink = data.permalink ? `https://www.reddit.com${data.permalink}` : data.url ?? context.source.sourceUrl;
  const body = [data.selftext, data.url && data.url !== permalink ? `Source URL: ${data.url}` : ""].filter(Boolean).join("\n\n");

  return {
    id: makeId("discovered-reddit", `${context.discoveryRunId}-${index}-${externalId}`),
    projectId: context.project.id,
    discoveryRunId: context.discoveryRunId,
    platform: "Reddit",
    community: data.subreddit_name_prefixed ?? `r/${data.subreddit ?? subredditName(context)}`,
    sourceType: "reddit",
    externalId,
    authorHandle: data.author ? `u/${data.author}` : "u/unknown",
    title: data.title ?? "Untitled Reddit post",
    body: body || data.title || "",
    url: permalink,
    score: data.score ?? 0,
    replyCount: data.num_comments ?? 0,
    publishedAt: data.created_utc ? new Date(data.created_utc * 1000).toISOString() : context.now,
    rawJson: { provider: "reddit", kind: child.kind, data },
    createdAt: context.now,
    updatedAt: context.now
  };
}

export const redditDiscoveryProvider: DiscoveryProvider = {
  name: "Reddit API Provider",
  scan: async (context) => {
    const accessToken = await getAccessToken();
    const response = await fetch(buildListingUrl(context), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": redditUserAgent()
      }
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Reddit listing request failed with ${response.status}: ${text.slice(0, 200)}`);
    }

    const payload = (await response.json()) as RedditListingResponse;
    return (payload.data?.children ?? [])
      .map((child, index) => mapListingChild(context, child, index))
      .filter((item): item is DiscoveredItem => Boolean(item));
  }
};
