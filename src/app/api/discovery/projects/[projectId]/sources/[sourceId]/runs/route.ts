import {
  apiSuccess,
  handleDiscoveryError,
  parseMutation
} from "@/lib/discovery/api-response";
import { discoveryScanSchema } from "@/lib/discovery/contracts";
import { runSignalSource } from "@/lib/discovery/service";

export const runtime = "nodejs";

interface RouteContext {
  params: { projectId: string; sourceId: string };
}

export async function POST(request: Request, { params }: RouteContext) {
  const parsed = await parseMutation(request, discoveryScanSchema);
  if (!parsed.success) return parsed.response;

  try {
    return apiSuccess(await runSignalSource(params.projectId, params.sourceId));
  } catch (error) {
    return handleDiscoveryError(error);
  }
}
