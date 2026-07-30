import {
  apiSuccess,
  handleProjectBrainError,
  parseMutation
} from "@/lib/project-brain/api-response";
import { projectCreateSchema } from "@/lib/project-brain/contracts";
import { createProject, listProjects } from "@/lib/project-brain/service";

export const runtime = "nodejs";

export async function GET() {
  try {
    return apiSuccess(await listProjects());
  } catch (error) {
    return handleProjectBrainError(error);
  }
}

export async function POST(request: Request) {
  const parsed = await parseMutation(request, projectCreateSchema);
  if (!parsed.success) return parsed.response;

  try {
    return apiSuccess(await createProject(parsed.data), 201);
  } catch (error) {
    return handleProjectBrainError(error);
  }
}
