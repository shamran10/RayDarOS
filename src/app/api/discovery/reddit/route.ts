import { NextResponse } from "next/server";
import { redditDiscoveryProvider } from "@/lib/discovery/providers/reddit-provider";
import type { Project, SignalSource } from "@/lib/types";

export const runtime = "nodejs";

interface RedditDiscoveryRequest {
  project: Project;
  source: SignalSource;
  discoveryRunId: string;
  now: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<RedditDiscoveryRequest>;
    if (!body.project || !body.source || !body.discoveryRunId || !body.now) {
      return NextResponse.json({ error: "project, source, discoveryRunId, and now are required." }, { status: 400 });
    }

    const items = await redditDiscoveryProvider.scan({
      project: body.project,
      source: body.source,
      discoveryRunId: body.discoveryRunId,
      now: body.now
    });

    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Reddit discovery error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
