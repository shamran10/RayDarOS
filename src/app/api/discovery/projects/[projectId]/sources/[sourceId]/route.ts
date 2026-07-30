import {
  apiSuccess,
  handleDiscoveryError,
  parseMutation
} from "@/lib/discovery/api-response";
import { signalSourceUpdateSchema } from "@/lib/discovery/contracts";
import {
  deleteSignalSource,
  getSignalSource,
  updateSignalSource
} from "@/lib/discovery/service";

export const runtime = "nodejs";

interface RouteContext {
  params: { projectId: string; sourceId: string };
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    return apiSuccess(await getSignalSource(params.projectId, params.sourceId));
  } catch (error) {
    return handleDiscoveryError(error);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const parsed = await parseMutation(request, signalSourceUpdateSchema);
  if (!parsed.success) return parsed.response;

  try {
    return apiSuccess(await updateSignalSource(params.projectId, params.sourceId, parsed.data));
  } catch (error) {
    return handleDiscoveryError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    return apiSuccess(await deleteSignalSource(params.projectId, params.sourceId));
  } catch (error) {
    return handleDiscoveryError(error);
  }
}
