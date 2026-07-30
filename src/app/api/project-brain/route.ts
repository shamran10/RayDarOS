import { apiSuccess, handleProjectBrainError } from "@/lib/project-brain/api-response";
import { getProjectBrainSnapshot } from "@/lib/project-brain/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return apiSuccess(await getProjectBrainSnapshot());
  } catch (error) {
    return handleProjectBrainError(error);
  }
}
