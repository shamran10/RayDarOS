import {
  apiSuccess,
  handleDiscoveryError,
  parseMutation
} from "@/lib/discovery/api-response";
import { manualDiscoverySchema } from "@/lib/discovery/contracts";
import { runManualDiscovery } from "@/lib/discovery/service";

export const runtime = "nodejs";

interface RouteContext {
  params: { projectId: string };
}

export async function POST(request: Request, { params }: RouteContext) {
  const parsed = await parseMutation(request, manualDiscoverySchema);
  if (!parsed.success) return parsed.response;

  try {
    return apiSuccess(await runManualDiscovery(params.projectId, parsed.data), 201);
  } catch (error) {
    return handleDiscoveryError(error);
  }
}
