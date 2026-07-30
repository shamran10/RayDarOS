import {
  apiSuccess,
  handleProjectBrainError,
  parseMutation
} from "@/lib/project-brain/api-response";
import { projectUpdateSchema } from "@/lib/project-brain/contracts";
import { deleteProject, getProject, updateProject } from "@/lib/project-brain/service";

export const runtime = "nodejs";

interface RouteContext {
  params: { projectId: string };
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    return apiSuccess(await getProject(params.projectId));
  } catch (error) {
    return handleProjectBrainError(error);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const parsed = await parseMutation(request, projectUpdateSchema);
  if (!parsed.success) return parsed.response;

  try {
    return apiSuccess(await updateProject(params.projectId, parsed.data));
  } catch (error) {
    return handleProjectBrainError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    return apiSuccess(await deleteProject(params.projectId));
  } catch (error) {
    return handleProjectBrainError(error);
  }
}
