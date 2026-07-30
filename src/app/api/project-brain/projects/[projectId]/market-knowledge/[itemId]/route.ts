import {
  apiSuccess,
  handleProjectBrainError,
  parseMutation
} from "@/lib/project-brain/api-response";
import { knowledgeUpdateSchema } from "@/lib/project-brain/contracts";
import {
  deleteKnowledge,
  getKnowledge,
  updateKnowledge
} from "@/lib/project-brain/service";

export const runtime = "nodejs";

interface RouteContext {
  params: { projectId: string; itemId: string };
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    return apiSuccess(await getKnowledge("market", params.projectId, params.itemId));
  } catch (error) {
    return handleProjectBrainError(error);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const parsed = await parseMutation(request, knowledgeUpdateSchema);
  if (!parsed.success) return parsed.response;

  try {
    return apiSuccess(await updateKnowledge("market", params.projectId, params.itemId, parsed.data));
  } catch (error) {
    return handleProjectBrainError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    return apiSuccess(await deleteKnowledge("market", params.projectId, params.itemId));
  } catch (error) {
    return handleProjectBrainError(error);
  }
}
