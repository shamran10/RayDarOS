import {
  apiSuccess,
  handleDiscoveryError,
  parseMutation
} from "@/lib/discovery/api-response";
import { signalSourceCreateSchema } from "@/lib/discovery/contracts";
import { createSignalSource, listSignalSources } from "@/lib/discovery/service";

export const runtime = "nodejs";

interface RouteContext {
  params: { projectId: string };
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    return apiSuccess(await listSignalSources(params.projectId));
  } catch (error) {
    return handleDiscoveryError(error);
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const parsed = await parseMutation(request, signalSourceCreateSchema);
  if (!parsed.success) return parsed.response;

  try {
    return apiSuccess(await createSignalSource(params.projectId, parsed.data), 201);
  } catch (error) {
    return handleDiscoveryError(error);
  }
}
